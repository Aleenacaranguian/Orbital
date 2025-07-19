//PressPost.tsx
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
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [postLiked, setPostLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [commentsCount, setCommentsCount] = useState(post.comments_count)

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          body,
          created_at,
          user_id,
          profiles:user_id!inner (
            username,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching comments:', error)
        Alert.alert('Error', 'Failed to load comments')
        return
      }

      // Transform the profiles array to a single profile object
      const transformedComments = (data || []).map((comment: any) => ({
        ...comment,
        profiles: Array.isArray(comment.profiles) && comment.profiles.length > 0 
          ? comment.profiles[0] 
          : null
      }))

      setComments(transformedComments)
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
        .select('*', { count: 'exact' })
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
    fetchComments()
    checkIfLiked()
    getLikesCount()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchComments()
    getLikesCount()
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
    if (!avatarPath) return require('../assets/profilepic.png')
    
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
          user_id,
          profiles:user_id!inner (
            username,
            avatar_url
          )
        `)

      if (error) {
        console.error('Error posting comment:', error)
        Alert.alert('Error', 'Failed to post comment')
        return
      }

      // Transform the profile data
      const newComment = data[0] ? {
        ...data[0],
        profiles: Array.isArray(data[0].profiles) && data[0].profiles.length > 0 
          ? data[0].profiles[0] 
          : null
      } : null

      if (newComment) {
        setComments(prev => [newComment, ...prev])
        setCommentsCount(prev => prev + 1)
        setNewCommentText('')
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10, textAlign: 'center' }}>Loading post...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.card}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
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
                  <View>
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

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <Image 
          source={require('../assets/profilepic.png')} 
          style={styles.avatarSmall} 
        />
        <TextInput
          placeholder="Write a comment..."
          placeholderTextColor="#666"
          style={styles.commentInput}
          value={newCommentText}
          onChangeText={setNewCommentText}
          multiline
          maxLength={500}
          editable={!submittingComment}
        />
        <TouchableOpacity 
          onPress={onSendComment}
          disabled={submittingComment || !newCommentText.trim()}
          style={[
            styles.sendButton,
            (!newCommentText.trim() || submittingComment) && styles.sendButtonDisabled
          ]}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#8B0000" />
          ) : (
            <Text style={styles.sendArrow}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 60,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  backButton: {
    backgroundColor: '#FFF176',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
  },
  commentSection: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 15,
    maxHeight: 80,
  },
  sendButton: {
    padding: 8,
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