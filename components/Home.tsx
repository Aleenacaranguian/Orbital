// components/Home.tsx
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function Home() {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <Text style={styles.header}>PROFILE</Text>
      <Image
        source={{ uri: 'https://placekitten.com/100/100' }}
        style={styles.avatar}
      />
      <Text style={styles.username}>User123</Text>
      <Text style={styles.editProfile}>Tap Here to Edit Profile</Text>

      <TouchableOpacity style={styles.row}>
        <Image source={require('../assets/pets.png')} style={styles.icon} />
        <Text style={styles.text}>My Pets</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row}>
        <Image source={require('../assets/petsitter.png')} style={styles.icon} />
        <Text style={styles.text}>My Pet Sitter Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row}>
        <Image source={require('../assets/bookings.png')} style={styles.icon} />
        <Text style={styles.text}>Current & Past Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row}>
        <Image source={require('../assets/posts.png')} style={styles.icon} />
        <Text style={styles.text}>My Posts</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#FFF3E3',
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#8B0000',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginVertical: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
  },
  editProfile: {
    color: '#C21807',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    width: '80%',
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  text: {
    fontSize: 18,
  },
})
