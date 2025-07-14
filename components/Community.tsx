import React from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type RootStackParamList = {
  CommunityMain: undefined
  PressPost: {
    post: {
      id: number
      username: string
      time: string
      text: string
      likes: number
      comments: number
      avatar: any
      image?: any
      commentsData: Array<{
        id: number
        username: string
        time: string
        text: string
        likes: number
        avatar: any
      }>
    }
  }
  CreatePost: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityMain'>

const posts = [
  {
    id: 1,
    username: 'Ben1975',
    time: '20 minutes ago',
    text: 'My 2 year old puppy ate chocolate. What should I do?\n\nMy dog weighs about 7kg and ate a whole bag of m&ms. Should I bring him to the vet? Please help...',
    likes: 2,
    comments: 2,
    avatar: require('../assets/profilepic.png'),
    image: require('../assets/pets.png'),
    commentsData: [
      {
        id: 11,
        username: 'PetLover99',
        time: '10 minutes ago',
        text: 'Please call the vet immediately!',
        likes: 3,
        avatar: require('../assets/profilepic.png'),
      },
      {
        id: 12,
        username: 'VetAdvice',
        time: '5 minutes ago',
        text: 'Chocolate can be toxic. Don’t delay treatment!',
        likes: 1,
        avatar: require('../assets/profilepic.png'),
      },
    ],
  },
  {
    id: 2,
    username: 'FionaJenner',
    time: '10 hours ago',
    text: 'How to care for goldfish?\n\nJust got a goldfish from a game at a festival. No idea how to care for it. As of now, I just filled up a bowl aquarium with tap water and fed it some food. What do yall recommend for me to do?',
    likes: 5,
    comments: 1,
    avatar: require('../assets/profilepic.png'),
    commentsData: [
      {
        id: 21,
        username: 'Ynaleena23',
        time: '6 hours ago',
        text: 'A 20-gallon tank is a good starting point, but larger is better!',
        likes: 1,
        avatar: require('../assets/profilepic.png'),
      },
    ],
  },
]

export default function Community({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>COMMUNITY</Text>

      <View style={styles.rowBetween}>
        <TextInput
          placeholder="Hinted search text"
          placeholderTextColor="#666"
          style={styles.searchInput}
        />
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostText}>+ Create Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.cardScroll}>
        {posts.map(post => (
          <TouchableOpacity
            key={post.id}
            style={[styles.card, { marginBottom: 20 }]}
            onPress={() => navigation.navigate('PressPost', { post })}
          >
            <View style={styles.rowBetween}>
              <View style={styles.avatarRow}>
                <Image source={post.avatar} style={styles.avatar} />
                <View>
                  <Text style={styles.subLabel}>{post.username}</Text>
                  <Text style={styles.helperText}>{post.time}</Text>
                </View>
              </View>
            </View>

            <Text style={{ marginBottom: 10 }}>{post.text}</Text>

            {post.image && (
              <Image
                source={post.image}
                style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 10 }}
                resizeMode="cover"
              />
            )}

            <View style={[styles.rowBetween, { marginTop: 5 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, marginRight: 5 }}>❤️</Text>
                <Text>{post.likes}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, marginRight: 5 }}>💬</Text>
                <Text>{post.comments}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B0000',
    textAlign: 'center',
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
})
