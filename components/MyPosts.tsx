import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';

type HomeStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  MyPets: undefined;
  ViewPetProfile: { pet: any };
  EditPetProfile: { pet: any };
  PetSitterProfileView: undefined;
  EditPetSitterProfile: { sitter: any };
  ViewService: { service: any };
  EditService: { service: any };
  MyPosts: undefined;
  Reviews: { sitterId: string; sitterUsername: string; sitterAvatar: string | null };
  PressPost: {
    post: {
      id: string;
      title: string;
      body: string | null;
      image_url: string | null;
      created_at: string;
      user_id: string;
      profiles: {
        username: string;
        avatar_url: string | null;
      } | null;
      likes_count: number;
      comments_count: number;
    };
  };
};

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'MyPosts'>;

interface Props {
  navigation: NavigationProp;
}

type Post = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  posts: {
    id: string;
    title: string;
    body: string | null;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    } | null;
    likes_count: number;
    comments_count: number;
  } | null;
};

const MyPostsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'comments'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUserContent();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchUserContent = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      
      await fetchUserPosts();
      
      await fetchUserComments();
      
    } catch (error) {
      console.error('Error fetching user content:', error);
      Alert.alert('Error', 'Failed to load your posts and comments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!currentUserId) return;

    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          body,
          image_url,
          created_at,
          user_id
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }


      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', currentUserId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      //get likes and comments count for each post
      const postsWithCounts = await Promise.all(
        postsData.map(async (post) => {
          //get likes count
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          //get comments count
          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            ...post,
            profiles: profileData || { username: 'Anonymous', avatar_url: null },
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error in fetchUserPosts:', error);
    }
  };

  const fetchUserComments = async () => {
    if (!currentUserId) return;

    try {
      //get user's comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          body,
          created_at,
          user_id,
          post_id
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      //get user profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', currentUserId)
        .single();

      if (userProfileError) {
        console.error('Error fetching user profile:', userProfileError);
      }

      const postIds = [...new Set(commentsData.map(comment => comment.post_id))];

      //get the posts these comments belong to
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          body,
          image_url,
          created_at,
          user_id
        `)
        .in('id', postIds);

      if (postsError) {
        console.error('Error fetching posts for comments:', postsError);
      }


      const postUserIds = postsData ? [...new Set(postsData.map(post => post.user_id))] : [];

      //get profiles for post authors
      const { data: postAuthorsProfiles, error: postAuthorsError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', postUserIds);

      if (postAuthorsError) {
        console.error('Error fetching post authors profiles:', postAuthorsError);
      }

      const postsMap = new Map();
      const profilesMap = new Map();

      if (postsData) {
        postsData.forEach(post => postsMap.set(post.id, post));
      }

      if (postAuthorsProfiles) {
        postAuthorsProfiles.forEach(profile => 
          profilesMap.set(profile.id, profile)
        );
      }

      const commentsWithPosts = await Promise.all(
        commentsData.map(async (comment) => {
          const post = postsMap.get(comment.post_id);
          
          if (post) {
            //get likes and comments count for the  post
            const { count: likesCount } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const { count: commentsCount } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const postWithProfile = {
              ...post,
              profiles: profilesMap.get(post.user_id) || { username: 'Anonymous', avatar_url: null },
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
            };

            return {
              ...comment,
              profiles: userProfile || { username: 'Anonymous', avatar_url: null },
              posts: postWithProfile,
            };
          }

          return {
            ...comment,
            profiles: userProfile || { username: 'Anonymous', avatar_url: null },
            posts: null,
          };
        })
      );

      setComments(commentsWithPosts);
    } catch (error) {
      console.error('Error in fetchUserComments:', error);
    }
  };

  const handleDeletePost = async (postId: string, postTitle: string) => {
    Alert.alert(
      'Delete Post',
      `Are you sure you want to delete "${postTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: commentsError } = await supabase
                .from('comments')
                .delete()
                .eq('post_id', postId);

              if (commentsError) {
                console.error('Error deleting comments:', commentsError);
              }

              const { error: likesError } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId);

              if (likesError) {
                console.error('Error deleting likes:', likesError);
              }

              const { error: postError } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', currentUserId);

              if (postError) throw postError;

              // refresh content
              await fetchUserContent();
              Alert.alert('Success', 'Post deleted successfully.');
            } catch (error) {
              console.error('Delete post error:', error);
              Alert.alert('Error', 'Failed to delete post.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUserId);

              if (error) throw error;

              //refresh content
              await fetchUserContent();
              Alert.alert('Success', 'Comment deleted successfully.');
            } catch (error) {
              console.error('Delete comment error:', error);
              Alert.alert('Error', 'Failed to delete comment.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserContent();
  }, [currentUserId]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMs = now.getTime() - commentDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return require('../assets/default-profile.png');
    
    if (avatarPath.startsWith('http')) {
      return { uri: avatarPath };
    }
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    
    return { uri: data.publicUrl };
  };

  const navigateToPost = (post: Post) => {
    navigation.navigate('PressPost', { post });
  };

  const navigateToCommentPost = (comment: Comment) => {
    if (comment.posts) {
      navigation.navigate('PressPost', { post: comment.posts });
    }
  };

  const renderPost = (post: Post) => (
    <TouchableOpacity 
      key={post.id}
      style={styles.postCard}
      onPress={() => navigateToPost(post)}
      onLongPress={() => handleDeletePost(post.id, post.title)}
    >
      <View style={styles.subCard}>
        <View style={styles.userRow}>
          <Image
            source={getAvatarUrl(post.profiles?.avatar_url || null)}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{post.profiles?.username || 'Anonymous'}</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.tapInstruction}>Tap to view • Long press to delete</Text>
        {post.body && (
          <Text style={styles.postBody} numberOfLines={3}>
            {post.body}
          </Text>
        )}
        <View style={styles.iconRow}>
          <Text style={styles.iconText}>❤️ {post.likes_count}</Text>
          <Text style={styles.iconText}>💬 {post.comments_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderComment = (comment: Comment) => (
    <TouchableOpacity 
      key={comment.id}
      style={styles.postCard}
      onPress={() => navigateToCommentPost(comment)}
      onLongPress={() => handleDeleteComment(comment.id)}
    >
      <View style={styles.subCard}>
        <View style={styles.userRow}>
          <Image
            source={getAvatarUrl(comment.profiles?.avatar_url || null)}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>{comment.profiles?.username || 'Anonymous'}</Text>
            <Text style={styles.timestamp}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
        </View>
        {comment.posts && (
          <Text style={styles.commentContext}>
            Commented on: "{comment.posts.title}"
          </Text>
        )}
        <Text style={styles.tapInstruction}>Tap to view • Long press to delete</Text>
        <Text style={styles.postBody}>{comment.body}</Text>
        {comment.posts && (
          <View style={styles.iconRow}>
            <Text style={styles.iconText}>❤️ {comment.posts.likes_count}</Text>
            <Text style={styles.iconText}>💬 {comment.posts.comments_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B0000" />
          <Text style={styles.loadingText}>Loading your content...</Text>
        </View>
      );
    }

    const allContent = [...posts, ...comments].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't made any posts yet.</Text>
          </View>
        );
      }
      return posts.map(post => renderPost(post));
    }

    if (activeTab === 'comments') {
      if (comments.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't made any comments yet.</Text>
          </View>
        );
      }
      return comments.map(comment => renderComment(comment));
    }

    if (allContent.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't made any posts or comments yet.</Text>
        </View>
      );
    }

    return allContent.map(item => {
      if ('title' in item) {
        return renderPost(item as Post);
      } else {
        return renderComment(item as Comment);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.subCard}>
        <View style={styles.tabs}>
          {['all', 'posts', 'comments'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTab,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.postsContainer}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#8B0000']}
              tintColor="#8B0000"
            />
          }
        >
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
};

export default MyPostsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  tabText: {
    fontSize: 16,
    color: '#4A2C2A',
  },
  activeTab: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  postsContainer: {
    flexGrow: 1,
  },
  postCard: {
    marginBottom: 20,
  },
  subCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,         
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  postTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginVertical: 4,
    color: '#4A2C2A',
  },
  tapInstruction: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  postBody: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
  },
  commentContext: {
    fontSize: 12,
    color: '#8B0000',
    fontStyle: 'italic',
    marginVertical: 4,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  iconText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});