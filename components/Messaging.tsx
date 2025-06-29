import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MessageSitterScreen from './MessageSitter';
import { supabase } from '../lib/supabase';

const defaultAvatar = require('../assets/default-profile.png');

export type MessagingStackParamList = {
  ChatList: undefined;
  MessageSitter: {
    sitterUsername: string;
    sitterAvatar: any;
    sitterId: string;
    initialMessage?: string;
  };
};

const Stack = createNativeStackNavigator<MessagingStackParamList>();

type ChatItem = {
  id: string;
  name: string;
  message: string;
  avatar: any;
  sitterId: string;
  lastMessageTime: string;
};

type ChatListScreenNavigationProp = NativeStackNavigationProp<
  MessagingStackParamList,
  'ChatList'
>;

// Avatar component with better error handling
const AvatarImage = ({ avatarUrl, style }: { avatarUrl: string | null, style: any }) => {
  const [imageError, setImageError] = useState(false);
  
  const getImageSource = () => {
    if (!avatarUrl || imageError) {
      return defaultAvatar;
    }
    return { uri: avatarUrl };
  };

  return (
    <Image
      source={getImageSource()}
      style={style}
      onError={() => {
        console.warn('Avatar failed to load:', avatarUrl);
        setImageError(true);
      }}
      defaultSource={defaultAvatar}
    />
  );
};

function ChatListScreen() {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        fetchChats();
      }
    }, [currentUser])
  );

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
      Alert.alert('Error', 'Failed to load user information');
    }
  };

  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) {
      return null;
    }
    
    try {
      // Check if the avatarPath is already a full URL
      if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
      }
      
      // Clean the path - remove any leading slashes or 'avatars/' prefix
      const cleanPath = avatarPath.replace(/^\/+/, '').replace(/^avatars\//, '');
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(cleanPath);
      
      if (!data?.publicUrl) {
        return null;
      }
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  };
  
  const fetchChats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Get all conversations where current user is either sender or recipient
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          message_content,
          created_at
        `)
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        Alert.alert('Error', 'Failed to load chats');
        return;
      }

      console.log('Fetched messages:', messages?.length || 0);

      // Get unique user IDs from the messages (excluding current user)
      const userIds = new Set<string>();
      messages?.forEach((message) => {
        if (message.sender_id !== currentUser.id) {
          userIds.add(message.sender_id);
        }
        if (message.recipient_id !== currentUser.id) {
          userIds.add(message.recipient_id);
        }
      });

      console.log('Unique user IDs to fetch:', Array.from(userIds));

      // Fetch profile data for all users involved in conversations
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, first_name, last_name, avatar_url')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        Alert.alert('Error', 'Failed to load user profiles');
        return;
      }

      console.log('Fetched profiles:', profiles);

      const profileMap = new Map<string, any>();
      profiles?.forEach((profile) => {
        console.log(`Profile ${profile.username}:`, {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url
        });
        profileMap.set(profile.id, profile);
      });

      // Group messages by conversation partner
      const conversationMap = new Map<string, any>();

      messages?.forEach((message) => {
        // Determine who the other person in the conversation is
        const isCurrentUserSender = message.sender_id === currentUser.id;
        const otherUserId = isCurrentUserSender ? message.recipient_id : message.sender_id;
        const otherUser = profileMap.get(otherUserId);

        if (otherUser && !conversationMap.has(otherUserId)) {
          // Get avatar URL with proper fallback
          let avatarUrl = null;
          if (otherUser.avatar_url) {
            avatarUrl = getAvatarUrl(otherUser.avatar_url);
            console.log(`Avatar URL for ${otherUser.username}:`, avatarUrl);
          } else {
            console.log(`No avatar_url for ${otherUser.username}`);
          }

          // Create display name
          const displayName = otherUser.username || 
                            `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() || 
                            otherUser.email || 
                            'Unknown User';

          conversationMap.set(otherUserId, {
            id: otherUserId,
            name: displayName,
            avatar: avatarUrl, // Store the URL string
            sitterId: otherUserId,
            message: message.message_content,
            lastMessageTime: message.created_at,
            messages: [message]
          });
        } else if (otherUser && conversationMap.has(otherUserId)) {
          // Only update if this message is more recent
          const existing = conversationMap.get(otherUserId);
          if (new Date(message.created_at) > new Date(existing.lastMessageTime)) {
            existing.message = message.message_content;
            existing.lastMessageTime = message.created_at;
          }
          existing.messages.push(message);
        }
      });

      // Convert map to array and sort by last message time
      const chatList = Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      console.log('Final chat list:', chatList.map(chat => ({ 
        name: chat.name, 
        avatar: chat.avatar ? 'Has avatar' : 'No avatar' 
      })));
      
      setChats(chatList);
    } catch (error) {
      console.error('Error in fetchChats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp: string) => {
    const msgDate = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return msgDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handlePress = (chat: ChatItem) => {
    // For navigation, convert the avatar URL back to the proper format
    const avatarSource = chat.avatar ? { uri: chat.avatar } : defaultAvatar;
    
    navigation.navigate('MessageSitter', {
      sitterUsername: chat.name,
      sitterAvatar: avatarSource,
      sitterId: chat.sitterId,
    });
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => handlePress(item)}>
      <View style={styles.avatarContainer}>
        <AvatarImage avatarUrl={item.avatar} style={styles.avatar} />
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.timeText}>{formatLastMessageTime(item.lastMessageTime)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>
          {item.message}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CHATS</Text>
      
      <View style={[styles.resultsCard, { flex: 1 }]}>
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No conversations yet</Text>
          </View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={fetchChats}
          />
        )}
      </View>
    </View>
  );
}

export default function Messaging() {
  return (
    <Stack.Navigator initialRouteName="ChatList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="MessageSitter" component={MessageSitterScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B0000',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultsCard: {
    width: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  message: {
    color: '#666',
    fontSize: 14,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
});