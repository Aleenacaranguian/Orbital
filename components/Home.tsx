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

        {/* Profile Section */}
        <View style={styles.profileGroup}>
          <TouchableOpacity>
            <Image
            source={require('../assets/default-profile.png')}
            style={styles.avatar}
            />
          </TouchableOpacity>
            <Text style={styles.username}>Ynaleena23</Text>
          <TouchableOpacity>
            <Text style={styles.editProfile}>Tap Here to Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
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

      {/* Logout Button */}
      <View style={styles.footer}>
        <Button
          title="Log Out"
          color="#C21807"
          onPress={() => supabase.auth.signOut()}
        />
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
  profileGroup: {
    alignItems: 'center',
    marginBottom: 24,
  },  
  avatar: {
    width: 100,
    height: 100,
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 4,
  },
  editProfile: {
    color: '#C21807',
    marginTop: 4,
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
  }
})
