import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AppState,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MessagingStackParamList } from './Messaging';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const defaultAvatar = require('../assets/default-profile.png');

type MessageSitterNavigationProp = NativeStackNavigationProp<
  MessagingStackParamList,
  'MessageSitter'
>;

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message_content: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
};

export default function MessageSitterScreen() {
  const route = useRoute<RouteProp<MessagingStackParamList, 'MessageSitter'>>();
  const navigation = useNavigation<MessageSitterNavigationProp>();
  const { sitterUsername, sitterAvatar, sitterId, initialMessage } = route.params;

  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [submittingMessage, setSubmittingMessage] = useState(false);
  
  // New state for tracking conversation ownership
  const [canReview, setCanReview] = useState(false);
  const [conversationOwner, setConversationOwner] = useState<string | null>(null);

  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewDescription, setReviewDescription] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);

  const sitterIdString = sitterId;

  
  const cleanupSubscriptions = useCallback(() => {
    if (messageChannelRef.current) {
      messageChannelRef.current.unsubscribe();
      messageChannelRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsRealtimeConnected(false);
  }, []);

  
  useFocusEffect(
    useCallback(() => {
      if (currentUser && sitterIdString) {
        setupRealtimeOrPolling();
      }
      return cleanupSubscriptions;
    }, [currentUser, sitterIdString])
  );

  useEffect(() => {
    fetchCurrentUser();
    return cleanupSubscriptions;
  }, [cleanupSubscriptions]);

  useEffect(() => {
    if (currentUser && sitterIdString) {
      fetchChatMessages();
    }
  }, [currentUser, sitterIdString]);

  // Handle app state changes for polling
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && currentUser && sitterIdString && !isRealtimeConnected) {
        fetchChatMessages();
      }
    });

    return () => subscription?.remove();
  }, [currentUser, sitterIdString, isRealtimeConnected]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('No authenticated user');
        setLoading(false);
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to load user information');
      setLoading(false);
    }
  };

  // Function to determine conversation ownership
  const determineConversationOwnership = (messages: Message[]) => {
    if (messages.length === 0) {
      // current user can potentially be the owner if they send first
      setConversationOwner(null);
      setCanReview(false);
      return;
    }

    // Sort messages by creation time to find the first message
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const firstMessage = sortedMessages[0];
    const firstMessageSenderId = firstMessage.sender_id;
    
    setConversationOwner(firstMessageSenderId);
    
    // Current user can review if they sent the first message
    setCanReview(currentUser?.id === firstMessageSenderId);
  };

  
  const startPolling = useCallback(() => {
   
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${sitterIdString}),and(sender_id.eq.${sitterIdString},recipient_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });

        if (error) return;

        if (data && data.length > 0) {
          const latestMessage = data[data.length - 1];
          
          // Only update if we have new messages
          if (!lastMessageTimestampRef.current || 
              new Date(latestMessage.created_at) > new Date(lastMessageTimestampRef.current)) {
            
            setChatMessages(data);
            determineConversationOwnership(data);
            lastMessageTimestampRef.current = latestMessage.created_at;
            
           
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); 
  }, [currentUser, sitterIdString]);

  
  const setupRealtimeOrPolling = useCallback(() => {
    if (!currentUser || !sitterIdString) return;

    cleanupSubscriptions();

   
    const channelName = `messages-conversation-${Date.now()}`;

    messageChannelRef.current = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUser.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newMessage = payload.new as Message;
            
            const isRelevantMessage = 
              (newMessage.sender_id === currentUser.id && newMessage.recipient_id === sitterIdString) ||
              (newMessage.sender_id === sitterIdString && newMessage.recipient_id === currentUser.id);
            
      
            if (isRelevantMessage && newMessage.sender_id !== currentUser.id) {
              setChatMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                
                const updatedMessages = [...prev, newMessage];

                determineConversationOwnership(updatedMessages);
                return updatedMessages;
              });
              

              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 50);
            }
          }
        }
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('Real-time error:', error);
        }
        
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
          
        
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          setIsRealtimeConnected(false);
          startPolling();
        }
      });

   
    setTimeout(() => {
      if (!isRealtimeConnected) {
        startPolling();
      }
    }, 5000);

  }, [currentUser, sitterIdString, cleanupSubscriptions, startPolling, isRealtimeConnected]);

  const fetchChatMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser?.id || !sitterIdString) {
        throw new Error('Missing user or sitter ID');
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${sitterIdString}),and(sender_id.eq.${sitterIdString},recipient_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fetch messages error:', error);
        throw error;
      }

      setChatMessages(data || []);
      
     
      determineConversationOwnership(data || []);
      
      
      if (data && data.length > 0) {
        lastMessageTimestampRef.current = data[data.length - 1].created_at;
      }
      
     
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);

    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    cleanupSubscriptions();
    navigation.goBack();
  };

  const onSend = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message before sending.');
      return;
    }

    const messageToSend = message.trim();
    const tempId = `temp_${Date.now()}`;
    
    setSubmittingMessage(true);
    
    // Create optimistic message object
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: sitterIdString,
      message_content: messageToSend,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setChatMessages(prev => {
      const updatedMessages = [...prev, optimisticMessage];
      
      determineConversationOwnership(updatedMessages);
      return updatedMessages;
    });
    setMessage(''); 
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 50);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: sitterIdString,
          message_content: messageToSend,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Send message error:', error);
        setChatMessages(prev => {
          const filteredMessages = prev.filter(msg => msg.id !== tempId);
          determineConversationOwnership(filteredMessages);
          return filteredMessages;
        });
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setMessage(messageToSend); 
        return;
      }

      setChatMessages(prev => {
        const updatedMessages = prev.map(msg => msg.id === tempId ? data : msg);
        determineConversationOwnership(updatedMessages);
        return updatedMessages;
      });

      lastMessageTimestampRef.current = data.created_at;

    } catch (error) {
      console.error('Send error:', error);
      setChatMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.id !== tempId);
        determineConversationOwnership(filteredMessages);
        return filteredMessages;
      });
      Alert.alert('Error', 'Failed to send message');
      setMessage(messageToSend); 
    } finally {
      setSubmittingMessage(false);
    }
  };

  
  const openReviewModal = () => {
    if (!canReview) {
      Alert.alert('Unable to Review', 'Only the conversation starter can leave a review.');
      return;
    }
    setShowReviewModal(true);
    setReviewRating(0);
    setReviewDescription('');
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewDescription('');
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Error', 'Please select a star rating');
      return;
    }

    setSubmittingReview(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          from_id: currentUser.id,
          to_id: sitterIdString,
          stars_int: reviewRating,
          description: reviewDescription.trim() || null,
        });

      if (error) {
        console.error('Submit review error:', error);
        Alert.alert('Error', 'Failed to submit review. Please try again.');
        return;
      }

      Alert.alert('Success', 'Review submitted successfully!');
      closeReviewModal();
    } catch (error) {
      console.error('Review submission error:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setReviewRating(index + 1)}
        style={styles.starButton}
      >
        <Text style={[
          styles.reviewStar,
          index < reviewRating ? styles.filledReviewStar : styles.emptyReviewStar
        ]}>
          ★
        </Text>
      </TouchableOpacity>
    ));
  };

  const getSitterImageUri = () => {
    if (sitterAvatar && typeof sitterAvatar === 'object' && 'uri' in sitterAvatar) {
      return sitterAvatar;
    }
    return defaultAvatar;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    const isOptimistic = item.id.toString().startsWith('temp_');
    
    return (
      <View style={[
        styles.messageBubble,
        isMyMessage ? styles.myMessage : styles.theirMessage,
        isOptimistic && styles.optimisticMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.message_content}
        </Text>
        <Text style={[
          styles.messageTime,
          isMyMessage ? styles.myMessageTime : styles.theirMessageTime
        ]}>
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={() => {
          setError(null);
          setLoading(true);
          fetchCurrentUser();
        }} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fef9f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.userInfo}>
          <Image source={getSitterImageUri()} style={styles.avatar} />
          <View style={styles.userInfoText}>
            <Text style={styles.username}>{sitterUsername}</Text>
          </View>
          {/* Only show review button if user can review */}
          {canReview && (
            <TouchableOpacity onPress={openReviewModal} style={styles.reviewButton}>
              <Text style={styles.reviewButtonText}>Review and Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        style={styles.chatList}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        )}
      />

      {/* Updated Message Input - Matching PressPost.tsx styling */}
      <View style={styles.messageInputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={textInputRef}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            multiline={true}
            maxLength={500}
            editable={!submittingMessage}
            blurOnSubmit={false}
            returnKeyType="default"
            textAlignVertical="top"
            autoCorrect={true}
            spellCheck={true}
            keyboardType="default"
          />
          <TouchableOpacity 
            onPress={onSend}
            disabled={submittingMessage || !message.trim()}
            style={[
              styles.sendButton,
              (!message.trim() || submittingMessage) && styles.sendButtonDisabled
            ]}
            activeOpacity={0.7}
          >
            {submittingMessage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={[
                styles.sendIcon,
                message.trim() ? styles.sendIconActive : styles.sendIconInactive
              ]}>
                <Text style={styles.sendArrow}>➤</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Review Modal */}
      {canReview && (
        <Modal
          visible={showReviewModal}
          transparent
          animationType="fade"
          onRequestClose={closeReviewModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.reviewModalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.reviewModalHeader}>
                  <Text style={styles.reviewModalTitle}>Review {sitterUsername}</Text>
                  <TouchableOpacity onPress={closeReviewModal}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.reviewLabel}>How would you rate this sitter?</Text>
                <View style={styles.starsContainer}>
                  {renderStars()}
                </View>

                <Text style={styles.reviewLabel}>Share your experience (optional)</Text>
                <TextInput
                  style={styles.reviewTextInput}
                  multiline
                  value={reviewDescription}
                  onChangeText={setReviewDescription}
                  placeholder="Tell others about your experience with this sitter..."
                  placeholderTextColor="#999"
                  textAlignVertical="top"
                />

                <View style={styles.reviewButtonsContainer}>
                  <TouchableOpacity
                    style={styles.cancelReviewButton}
                    onPress={closeReviewModal}
                    disabled={submittingReview}
                  >
                    <Text style={styles.cancelReviewButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.submitReviewButton,
                      (submittingReview || reviewRating === 0) && styles.submitReviewButtonDisabled
                    ]}
                    onPress={submitReview}
                    disabled={submittingReview || reviewRating === 0}
                  >
                    <Text style={styles.submitReviewButtonText}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef9f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8d6e63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f6e7d8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backArrow: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: 'normal',
    marginRight: 5,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: 'normal',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  },
  reviewButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessage: {
    backgroundColor: '#8d6e63',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optimisticMessage: {
    opacity: 0.8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: '#999',
    textAlign: 'left',
  },
  // Updated input styling to match PressPost.tsx
  messageInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 34 : 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 36,
    color: '#333',
    paddingVertical: 8,
    paddingRight: 10,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconActive: {
    backgroundColor: '#8B0000',
  },
  sendIconInactive: {
    backgroundColor: '#ccc',
  },
  sendArrow: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  // Review modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
    padding: 5,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    padding: 5,
  },
  reviewStar: {
    fontSize: 32,
    marginHorizontal: 4,
  },
  filledReviewStar: {
    color: '#FFD700',
  },
  emptyReviewStar: {
    color: '#ddd',
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  reviewButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelReviewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelReviewButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitReviewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#dc3545',
    alignItems: 'center',
  },
  submitReviewButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitReviewButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});