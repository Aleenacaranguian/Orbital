//PressPost.tsx - Fixed keyboard issues with blue back button
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'

type CommunityStackParamList = {
  CommunityMain: undefined
  PressPost: {
    post: {
      id: string
      title: string
      body: string | null
      image_url: string | null
      created_at: string
      user_id: string
      profiles: {
        username: string
        avatar_url: string | null
      } | null
      likes_count: number
      comments_count: number
    }
  }
  CreatePost: undefined
}

type Comment = {
  id: string
  body: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    avatar_url: string | null
  } | null
}

type Props = NativeStackScreenProps<CommunityStackParamList, 'PressPost'>

export default function PressPost({ route, navigation }: Props) {
  const { post } = route.params
  const screenHeight = Dimensions.get('window').height
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24
  const safeAreaBottom = Platform.OS === 'ios' ? 34 : 0
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [postLiked, setPostLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [commentsCount, setCommentsCount] = useState(post.comments_count)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  const fetchCurrentUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching current user profile:', error)
          return
        }

        setCurrentUserAvatar(data?.avatar_url || null)
      }
    } catch (error) {
      console.error('Error fetching current user profile:', error)
    }
  }

  const fetchComments = async () => {
    try {
      // First, get the comments without the profile join
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, body, created_at, user_id')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })

      if (commentsError) {
        console.error('Error fetching comments:', commentsError)
        Alert.alert('Error', 'Failed to load comments')
        return
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([])
        setCommentsCount(0)
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))]

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        // Continue without profiles
      }

      // Create a map of user_id to profile
      const profilesMap = new Map()
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, {
            username: profile.username,
            avatar_url: profile.avatar_url
          })
        })
      }

      // Combine comments with their profiles
      const commentsWithProfiles: Comment[] = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id) || { username: 'Anonymous', avatar_url: null }
      }))

      setComments(commentsWithProfiles)
      setCommentsCount(commentsWithProfiles.length)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkIfLiked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking like status:', error)
        return
      }

      setPostLiked(!!data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getLikesCount = async () => {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      if (error) {
        console.error('Error getting likes count:', error)
        return
      }

      setLikesCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    fetchCurrentUserProfile()
    fetchComments()
    checkIfLiked()
    getLikesCount()

    // Keyboard event listeners - simplified and more reliable
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height)
      setIsKeyboardVisible(true)
    })
    
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
      setIsKeyboardVisible(false)
    })

    // Set up real-time subscriptions
    const commentsSubscription = supabase
      .channel('comments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    const likesSubscription = supabase
      .channel('likes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${post.id}` },
        () => {
          getLikesCount()
          checkIfLiked()
        }
      )
      .subscribe()

    return () => {
      keyboardShowListener.remove()
      keyboardHideListener.remove()
      commentsSubscription.unsubscribe()
      likesSubscription.unsubscribe()
    }
  }, [post.id])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchCurrentUserProfile()
    fetchComments()
    getLikesCount()
    checkIfLiked()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const commentDate = new Date(dateString)
    const diffInMs = now.getTime() - commentDate.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return `${diffInDays}d ago`
    }
  }

  const getImageUrl = (imagePath: string | null): string | null => {
    if (!imagePath) return null
    
    const { data } = supabase.storage
      .from('post-images')
      .getPublicUrl(imagePath)
    
    return data.publicUrl
  }

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return require('../assets/default-profile.png')
    
    // If it's already a full URL, use it directly
    if (avatarPath.startsWith('http')) {
      return { uri: avatarPath }
    }
    
    // Otherwise, get it from storage
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath)
    
    return { uri: data.publicUrl }
  }

  const togglePostLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'You must be logged in to like posts')
        return
      }

      if (postLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error unliking post:', error)
          Alert.alert('Error', 'Failed to unlike post')
          return
        }

        setPostLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{
            post_id: post.id,
            user_id: user.id
          }])

        if (error) {
          console.error('Error liking post:', error)
          Alert.alert('Error', 'Failed to like post')
          return
        }

        setPostLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    }
  }

  const onSendComment = async () => {
    if (!newCommentText.trim()) {
      Alert.alert('Error', 'Please enter a comment before sending.')
      return
    }

    setSubmittingComment(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'You must be logged in to comment')
        setSubmittingComment(false)
        return
      }

      // Insert comment
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: post.id,
          user_id: user.id,
          body: newCommentText.trim()
        }])
        .select(`
          id,
          body,
          created_at,
          user_id
        `)

      if (error) {
        console.error('Error posting comment:', error)
        Alert.alert('Error', 'Failed to post comment')
        return
      }

      if (data && data.length > 0) {
        // Fetch the user's profile for the new comment
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile for comment:', profileError)
        }

        const newComment: Comment = {
          ...data[0],
          profiles: profileData || { username: 'Anonymous', avatar_url: null }
        }

        setComments(prev => [newComment, ...prev])
        setCommentsCount(prev => prev + 1)
        setNewCommentText('')
        Keyboard.dismiss()
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setSubmittingComment(false)
    }
  }

  const focusTextInput = () => {
    // Force focus on the TextInput - this can help with keyboard issues
    if (textInputRef.current) {
      textInputRef.current.focus()
    }
  }

  // Add ref for TextInput
  const textInputRef = React.useRef<TextInput>(null)

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10, textAlign: 'center' }}>Loading post...</Text>
      </View>
    )
  }

  const inputContainerHeight = 80 + safeAreaBottom

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContainer,
            { 
              paddingBottom: inputContainerHeight + 20,
              paddingTop: statusBarHeight
            }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
          <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>
            {/* Original Post */}
            <View style={styles.postHeader}>
              <View style={styles.avatarRow}>
                <Image 
                  source={getAvatarUrl(post.profiles?.avatar_url || null)} 
                  style={styles.avatar} 
                />
                <View>
                  <Text style={styles.username}>
                    {post.profiles?.username || 'Anonymous'}
                  </Text>
                  <Text style={styles.helperText}>
                    {formatTimeAgo(post.created_at)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>
            {post.body && (
              <Text style={styles.postText}>{post.body}</Text>
            )}

            {post.image_url && getImageUrl(post.image_url) && (
              <Image
                source={{ uri: getImageUrl(post.image_url)! }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.reactionRow}>
              <TouchableOpacity
                style={styles.reaction}
                onPress={togglePostLike}
                activeOpacity={0.7}
              >
                <Text style={[styles.emoji, postLiked && { color: 'red' }]}>❤️</Text>
                <Text style={styles.reactionText}>{likesCount}</Text>
              </TouchableOpacity>
              <View style={styles.reaction}>
                <Text style={styles.emoji}>💬</Text>
                <Text style={styles.reactionText}>{commentsCount}</Text>
              </View>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({commentsCount})</Text>
            </View>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>No comments yet. Be the first to comment!</Text>
              </View>
            ) : (
              comments.map(comment => (
                <View key={comment.id} style={styles.commentSection}>
                  <View style={styles.avatarRow}>
                    <Image 
                      source={getAvatarUrl(comment.profiles?.avatar_url || null)} 
                      style={styles.avatarSmall} 
                    />
                    <View style={styles.commentUserInfo}>
                      <Text style={styles.username}>
                        {comment.profiles?.username || 'Anonymous'}
                      </Text>
                      <Text style={styles.helperText}>
                        {formatTimeAgo(comment.created_at)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{comment.body}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input - Simplified positioning */}
        <View style={styles.commentInputContainer}>
          <TouchableOpacity onPress={focusTextInput} activeOpacity={1}>
            <Image 
              source={getAvatarUrl(currentUserAvatar)} 
              style={styles.avatarSmall} 
            />
          </TouchableOpacity>
          <TextInput
            ref={textInputRef}
            placeholder="Write a comment..."
            placeholderTextColor="#666"
            style={styles.commentInput}
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline={true}
            maxLength={500}
            editable={!submittingComment}
            blurOnSubmit={false}
            returnKeyType="default"
            textAlignVertical="top"
            autoCorrect={true}
            spellCheck={true}
            keyboardType="default"
            onFocus={() => console.log('TextInput focused')}
            onBlur={() => console.log('TextInput blurred')}
          />
          <TouchableOpacity 
            onPress={onSendComment}
            disabled={submittingComment || !newCommentText.trim()}
            style={[
              styles.sendButton,
              (!newCommentText.trim() || submittingComment) && styles.sendButtonDisabled
            ]}
            activeOpacity={0.7}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#8B0000" />
            ) : (
              <Text style={styles.sendArrow}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#007AFF', // iOS blue color
  },
  postHeader: {
    marginBottom: 15,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    lineHeight: 26,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  emoji: {
    fontSize: 20,
    marginRight: 5,
  },
  reactionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  commentsHeader: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptyComments: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  commentSection: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginTop: 8,
    marginLeft: 52, // Align with username
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
    color: '#333',
  },
  sendButton: {
    padding: 10,
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendArrow: {
    fontSize: 24,
    color: '#8B0000',
    fontWeight: 'bold',
  },
})