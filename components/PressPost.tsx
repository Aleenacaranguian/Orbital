import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  Community: undefined
  PressPost: {
    post: {
      username: string
      time: string
      avatar: any
      text: string
      likes: number
      comments: number
    }
    comments: Array<{
      id: number
      username: string
      time: string
      text: string
      likes: number
      avatar: any
      replies?: Array<{
        id: number
        username: string
        time: string
        text: string
        avatar: any
      }>
    }>
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'PressPost'>

export default function PressPost({ route, navigation }: Props) {
  const params = route.params

  if (!params) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Missing post data</Text>
      </View>
    )
  }

  const { post: initialPost, comments: initialComments } = params

  const [postLikes, setPostLikes] = useState(initialPost.likes)
  const [postLiked, setPostLiked] = useState(false)

  const [comments, setComments] = useState(initialComments)

  const [commentsLikes, setCommentsLikes] = useState(() =>
    initialComments.reduce((acc, c) => {
      acc[c.id] = { likes: c.likes, liked: false }
      return acc
    }, {} as Record<number, { likes: number; liked: boolean }>)
  )

  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  const [newCommentText, setNewCommentText] = useState('')

  function togglePostLike() {
    if (postLiked) {
      setPostLikes(postLikes - 1)
    } else {
      setPostLikes(postLikes + 1)
    }
    setPostLiked(!postLiked)
  }

  function toggleCommentLike(commentId: number) {
    setCommentsLikes(prev => {
      const current = prev[commentId]
      const liked = !current.liked
      const likes = liked ? current.likes + 1 : current.likes - 1
      return { ...prev, [commentId]: { liked, likes } }
    })
  }

  function toggleReplies(commentId: number) {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) newSet.delete(commentId)
      else newSet.add(commentId)
      return newSet
    })
  }

  function onSendComment() {
    if (!newCommentText.trim()) {
      Alert.alert('Error', 'Please enter a comment before sending.')
      return
    }

    // Create new comment object
    const newComment = {
      id: Date.now(), 
      username: 'You',
      time: 'Just now',
      text: newCommentText.trim(),
      likes: 0,
      avatar: require('../assets/profilepic.png'), 
      replies: [],
    }

    setComments([newComment, ...comments])

    setCommentsLikes(prev => ({
      ...prev,
      [newComment.id]: { likes: 0, liked: false },
    }))

    setNewCommentText('')
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Original Post */}
          <View style={styles.avatarRow}>
            <Image source={initialPost.avatar} style={styles.avatar} />
            <View>
              <Text style={styles.username}>{initialPost.username}</Text>
              <Text style={styles.helperText}>{initialPost.time}</Text>
            </View>
          </View>
          <Text style={styles.postText}>{initialPost.text}</Text>
          <View style={styles.reactionRow}>
            <TouchableOpacity
              style={styles.reaction}
              onPress={togglePostLike}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, postLiked && { color: 'red' }]}>❤️</Text>
              <Text>{postLikes}</Text>
            </TouchableOpacity>
            <View style={styles.reaction}>
              <Text style={styles.emoji}>💬</Text>
              <Text>{comments.length}</Text>
            </View>
          </View>

          {/* Comments */}
          {comments.map(comment => {
            const { liked, likes } = commentsLikes[comment.id] || {
              liked: false,
              likes: comment.likes,
            }
            return (
              <View key={comment.id} style={styles.commentSection}>
                <View style={styles.avatarRow}>
                  <Image source={comment.avatar} style={styles.avatarSmall} />
                  <View>
                    <Text style={styles.username}>{comment.username}</Text>
                    <Text style={styles.helperText}>{comment.time}</Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                <TouchableOpacity
                  style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => toggleCommentLike(comment.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.emoji, liked && { color: 'red' }]}>❤️</Text>
                  <Text>{likes}</Text>
                </TouchableOpacity>

                {/* Replies toggle */}
                {comment.replies && comment.replies.length > 0 && (
                  <>
                    <TouchableOpacity
                      onPress={() => toggleReplies(comment.id)}
                      style={{ marginTop: 8, marginLeft: 5 }}
                    >
                      <Text style={styles.replyLink}>
                        {expandedComments.has(comment.id)
                          ? '↳ Hide replies'
                          : `↳ View ${comment.replies.length} more repl${
                              comment.replies.length > 1 ? 'ies' : 'y'
                            }`}
                      </Text>
                    </TouchableOpacity>

                    {expandedComments.has(comment.id) &&
                      comment.replies.map(reply => (
                        <View key={reply.id} style={styles.replySection}>
                          <View style={styles.avatarRow}>
                            <Image source={reply.avatar} style={styles.avatarTiny} />
                            <View>
                              <Text style={styles.username}>{reply.username}</Text>
                              <Text style={styles.helperText}>{reply.time}</Text>
                            </View>
                          </View>
                          <Text style={styles.commentText}>{reply.text}</Text>
                        </View>
                      ))}
                  </>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <Image source={require('../assets/profilepic.png')} style={styles.avatar} />
        <TextInput
          placeholder="Comment"
          style={styles.commentInput}
          placeholderTextColor="#666"
          value={newCommentText}
          onChangeText={setNewCommentText}
          multiline
        />
        <TouchableOpacity onPress={onSendComment}>
          <Text style={styles.sendArrow}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
  avatarTiny: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#844d3e',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
  },
  postText: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 22,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 5,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  emoji: {
    fontSize: 22,
    marginRight: 5,
  },
  commentSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  commentText: {
    fontSize: 15,
    marginTop: 5,
    marginBottom: 5,
  },
  replyLink: {
    color: '#0066cc',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
  replySection: {
    marginLeft: 45,
    marginTop: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
    paddingLeft: 10,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#FFF3E3',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 15,
  },
  sendArrow: {
    fontSize: 24,
    color: '#8B0000',
    fontWeight: 'bold',
  },
})
