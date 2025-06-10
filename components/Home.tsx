import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Button,
} from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import EditProfile from '../components/EditProfile'
import MyPets from '../components/MyPets'
import MyPetSitterProfile from '../components/MyPetSitterProfile'
import MyPosts from '../components/MyPosts'

const Stack = createNativeStackNavigator()

function ProfileScreen() {
  const navigation = useNavigation<any>()

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>HOME</Text>

        <Image
          source={require('../assets/profilepic.png')}
          style={styles.avatar}
        />

        <Text style={styles.username}>User12345</Text>

        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editProfile}>Tap Here to Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MyPets')}>
          <Image source={require('../assets/pets.png')} style={styles.icon} />
          <Text style={styles.text}>My Pets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MyPetSitterProfile')}>
          <Image source={require('../assets/petsitter.png')} style={styles.icon} />
          <Text style={styles.text}>My Pet Sitter Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MyPosts')}>
          <Image source={require('../assets/posts.png')} style={styles.icon} />
          <Text style={styles.text}>My Posts</Text>
        </TouchableOpacity>
      </ScrollView>

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

export default function Home() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="MyPets" component={MyPets} options={{ title: 'My Pets' }} />
      <Stack.Screen name="MyPetSitterProfile" component={MyPetSitterProfile} options={{ title: 'My Pet Sitter Profile' }} />
      <Stack.Screen name="MyPosts" component={MyPosts} options={{ title: 'My Posts' }} />
    </Stack.Navigator>
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
    width: 170,
    height: 170,
    borderRadius: 50,
    marginVertical: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 0,
  },
  editProfile: {
    color: '#C21807',
    marginBottom: 20,
    textDecorationLine: 'underline',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    width: '80%',
  },
  icon: {
    width: 50,
    height: 50,
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
