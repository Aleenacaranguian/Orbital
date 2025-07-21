// Community.tsx - Enhanced version with better image handling
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { supabase } from '../lib/supabase'
import CreatePost from './CreatePost'
import PressPost from './PressPost'

// Define the stack param list
export type CommunityStackParamList = {
  CommunityMain: undefined
  PressPost: {
    post: Post
  }
  CreatePost: undefined
}

export type Post = {
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

const CommunityStack = createNativeStackNavigator<CommunityStackParamList>()

// Main Community Screen Component
function CommunityMainScreen({ navigation }: any) {
  const [posts, setPosts] = useState<Post[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

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

  const fetchPosts = async () => {
    try {
      // Fetch posts with profile data and counts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          body,
          image_url,
          created_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        Alert.alert('Error', 'Failed to load posts')
        return
      }

      // Get likes and comments count for each post
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post: any) => {
          // Get likes count
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          // Get comments count
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
          } as Post
        })
      )

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCurrentUserProfile()
    fetchPosts()

    // Set up real-time subscription for posts
    const postsSubscription = supabase
      .channel('posts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    // Set up real-time subscription for likes
    const likesSubscription = supabase
      .channel('likes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    // Set up real-time subscription for comments
    const commentsSubscription = supabase
      .channel('comments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      postsSubscription.unsubscribe()
      likesSubscription.unsubscribe()
      commentsSubscription.unsubscribe()
    }
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setImageLoadErrors(new Set()) // Reset image load errors on refresh
    fetchCurrentUserProfile()
    fetchPosts()
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const postDate = new Date(dateString)
    const diffInMs = now.getTime() - postDate.getTime()
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
    
    // If it's already a full URL, return it directly
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Otherwise, get it from Supabase storage
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

  const handleImageError = (postId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(postId))
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (post.body && post.body.toLowerCase().includes(searchText.toLowerCase()))
  )

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10, textAlign: 'center' }}>Loading posts...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.header}>COMMUNITY</Text>
        
        {/* Current user avatar in top right */}
        <View style={styles.currentUserAvatarContainer}>
          <Image 
            source={getAvatarUrl(currentUserAvatar)} 
            style={styles.currentUserAvatar} 
          />
        </View>
      </View>

      <View style={styles.rowBetween}>
        <TextInput
          placeholder="Search posts..."
          placeholderTextColor="#666"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostText}>+ Create Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.cardScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchText ? 'No posts found matching your search' : 'No posts yet. Be the first to create one!'}
            </Text>
          </View>
        ) : (
          filteredPosts.map(post => {
            const imageUrl = getImageUrl(post.image_url)
            const hasValidImage = imageUrl && !imageLoadErrors.has(post.id)
            
            return (
              <TouchableOpacity
                key={post.id}
                style={[styles.card, { marginBottom: 20 }]}
                onPress={() => navigation.navigate('PressPost', { post })}
                activeOpacity={0.7}
              >
                <View style={styles.rowBetween}>
                  <View style={styles.avatarRow}>
                    <Image 
                      source={getAvatarUrl(post.profiles?.avatar_url || null)} 
                      style={styles.avatar} 
                    />
                    <View>
                      <Text style={styles.subLabel}>
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
                  <Text style={styles.postBody} numberOfLines={3}>
                    {post.body}
                  </Text>
                )}

                {/* Enhanced Image Display - Same as PressPost */}
                {hasValidImage && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                      onError={() => handleImageError(post.id)}
                      onLoad={() => {
                        // Remove from error set if it loads successfully
                        setImageLoadErrors(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(post.id)
                          return newSet
                        })
                      }}
                    />
                  </View>
                )}

                <View style={[styles.rowBetween, { marginTop: 15 }]}>
                  <View style={styles.interactionRow}>
                    <Text style={styles.emoji}>❤️</Text>
                    <Text style={styles.interactionText}>{post.likes_count}</Text>
                  </View>
                  <View style={styles.interactionRow}>
                    <Text style={styles.emoji}>💬</Text>
                    <Text style={styles.interactionText}>{post.comments_count}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

// Main Community Component with Navigation Stack
export default function Community() {
  return (
    <CommunityStack.Navigator
      initialRouteName="CommunityMain"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <CommunityStack.Screen 
        name="CommunityMain" 
        component={CommunityMainScreen} 
      />
      <CommunityStack.Screen 
        name="PressPost" 
        component={PressPost}
      />
      <CommunityStack.Screen 
        name="CreatePost" 
        component={CreatePost}
      />
    </CommunityStack.Navigator>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  topSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#8B0000',
    textAlign: 'center',
    flex: 1,
  },
  currentUserAvatarContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  currentUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B0000',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createPostButton: {
    backgroundColor: '#FFF176',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createPostText: {
    fontWeight: '600',
    fontSize: 16,
  },
  cardScroll: {
    paddingBottom: 40,
    paddingTop: 10,
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  subLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#844d3e',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  postBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 10,
  },
  imageContainer: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0', // Placeholder background while loading
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
    marginRight: 5,
  },
  interactionText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
})