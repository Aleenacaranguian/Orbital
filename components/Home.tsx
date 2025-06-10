import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Button,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import EditProfile from '../components/EditProfile';
import MyPets from '../components/MyPets';
import MyPetSitterProfile from '../components/MyPetSitterProfile';
import MyPosts from '../components/MyPosts';

const Stack = createNativeStackNavigator();

function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<{
    username: string;
    avatar_url: string | null;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, email')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();

    // Set up real-time subscription
    const subscription = supabase.channel('profile_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${(supabase.auth.getUser() as any)?.id}`
      }, fetchProfile)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B0000']}
            tintColor="#8B0000"
          />
        }
      >
        <Text style={styles.header}>HOME</Text>

        <Image
          source={profile?.avatar_url 
            ? { uri: profile.avatar_url } 
            : require('../assets/profilepic.png')}
          style={styles.avatar}
        />

        <Text style={styles.username}>
          @{profile?.username || 'user'}
        </Text>



        <TouchableOpacity 
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.editButton}
        >
          <Text style={styles.editProfile}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.row} 
          onPress={() => navigation.navigate('MyPets')}
        >
          <Image source={require('../assets/pets.png')} style={styles.icon} />
          <Text style={styles.text}>My Pets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.row} 
          onPress={() => navigation.navigate('MyPetSitterProfile')}
        >
          <Image source={require('../assets/petsitter.png')} style={styles.icon} />
          <Text style={styles.text}>My Pet Sitter Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.row} 
          onPress={() => navigation.navigate('MyPosts')}
        >
          <Image source={require('../assets/posts.png')} style={styles.icon} />
          <Text style={styles.text}>My Posts</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Log Out"
          color="#C21807"
          onPress={async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}
        />
      </View>
    </View>
  );
}

export default function Home() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfile} 
        options={{ title: 'Edit Profile' }} 
      />
      <Stack.Screen 
        name="MyPets" 
        component={MyPets} 
        options={{ title: 'My Pets' }} 
      />
      <Stack.Screen 
        name="MyPetSitterProfile" 
        component={MyPetSitterProfile} 
        options={{ title: 'My Pet Sitter Profile' }} 
      />
      <Stack.Screen 
        name="MyPosts" 
        component={MyPosts} 
        options={{ title: 'My Posts' }} 
      />
    </Stack.Navigator>
  );
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
    width: 200,
    height: 200,
    borderRadius: 85,
    marginVertical: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    marginBottom: 20,
  },
  editProfile: {
    color: '#C21807',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    width: '80%',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
});