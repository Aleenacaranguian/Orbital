import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Button,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'

export default function Home() {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PROFILE</Text>
        <Image
          source={{ uri: 'https://placekitten.com/100/100' }}
          style={styles.avatar}
        />
        <Text style={styles.username}>Ynaleena23</Text>
        <Text style={styles.editProfile}>Tap Here to Edit Profile</Text>

        <TouchableOpacity style={styles.row}>
          <Image source={require('../assets/pets.png')} style={styles.icon} />
          <Text style={styles.text}>My Pets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Image
            source={require('../assets/petsitter.png')}
            style={styles.icon}
          />
          <Text style={styles.text}>My Pet Sitter Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Image source={require('../assets/posts.png')} style={styles.icon} />
          <Text style={styles.text}>My Posts</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Button at Bottom */}
      <View style={styles.footer}>
        <Button title="Log Out" color="#C21807" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
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
    width: 40,
    height: 40,
    marginRight: 15,
  },
  text: {
    fontSize: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
})
