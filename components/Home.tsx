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
import { supabase } from '../lib/supabase';
import EditProfile from '../components/EditProfile';
import MyPets from '../components/MyPets';
import MyPetSitterProfile from '../components/MyPetSitterProfile';
import EditPetSitterProfile from '../components/EditPetSitterProfile';
import MyPosts from '../components/MyPosts';
import ViewPetProfile from '../components/ViewPetProfile';
import EditPetProfile from '../components/EditPetProfile';
import ViewServiceScreen from '../components/ViewService';
import EditServiceScreen from '../components/EditService';
import ReviewsScreen from '../components/Reviews'; 

//Pet attributes
export type Pet = {
  id: string; // user_id
  name: string; // pet_name
  birthday?: string | null;
  pet_type?: string | null;
  size?: string | null;
  breed?: string|null;
  sterilised?: boolean;
  transmissible_health_issues?: boolean;
  friendly_with_dogs?: boolean;
  friendly_with_cats?: boolean;
  friendly_with_children?: boolean;
  pet_url?: string | null; 
};

// Pet sitter attributes
export type Sitter = {
  id?: string;
  imageUri?: string | null;
  about_me: string;
  years_of_experience: string;
  other_pet_related_skills: string;
  owns_pets: boolean;
  volunteers_with_animals: boolean;
  works_with_animals: boolean;
  average_stars?: number;
  username?: string;
};

// Allowed pet_types
export type PetType = 'Dog' | 'Cat' | 'Rabbit' | 'Bird' | 'Reptile' | 'Fish';

// Service attributes
export type Service = {
  service_id: string; 
  id: string; 
  service_type: string;
  service_url?: string | null;
  created_at?: string;
  name_of_service?: string;
  price?: string;
  pet_preferences?: string;
  pet_type?: PetType | null;
  housing_type?: string;
  service_details?: string;
  no_other_dogs_present?: boolean;
  no_other_cats_present?: boolean;
  no_children_present?: boolean;
  no_adults_present?: boolean;
  sitter_present_throughout_service?: boolean;
  accepts_unsterilised_pets?: boolean;
  accepts_pets_with_transmissible_health_issues?: boolean;
};



export type HomeStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  MyPets: undefined;
  ViewPetProfile: { pet: Pet };
  EditPetProfile: { pet: Pet };
  PetSitterProfileView: undefined;
  EditPetSitterProfile: { sitter: Sitter };
  ViewService: { service: Service };
  EditService: { service: Service };
  MyPosts: undefined;
  Reviews: { sitterId: string; sitterUsername: string; sitterAvatar: string | null };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

function ProfileScreen({ navigation }: { navigation: any }) {
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

    // Set up real-time subscription with proper async handling
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const subscription = supabase.channel('profile_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          }, fetchProfile)
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      }
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(fn => fn && fn());
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
            : require('../assets/default-profile.png')}
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
          onPress={() => navigation.navigate('PetSitterProfileView')}
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
          color="white"
          onPress={async () => {
            await supabase.auth.signOut();
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
        name="ViewPetProfile" 
        component={ViewPetProfile} 
        options={{ title: 'Pet Profile' }} 
      />
      <Stack.Screen 
        name="EditPetProfile" 
        component={EditPetProfile} 
        options={{ title: 'Edit Pet' }} 
      />
      <Stack.Screen 
        name="PetSitterProfileView" 
        component={MyPetSitterProfile} 
        options={{ title: 'My Pet Sitter Profile' }} 
      />
      <Stack.Screen 
        name="EditPetSitterProfile" 
        component={EditPetSitterProfile} 
        options={{ title: 'Edit Pet Sitter Profile' }} 
      />
      <Stack.Screen 
        name="ViewService" 
        component={ViewServiceScreen} 
        options={{ title: 'Service Details' }} 
      />
      <Stack.Screen 
        name="EditService" 
        component={EditServiceScreen} 
        options={{ title: 'Edit Service' }} 
      />
      <Stack.Screen 
        name="MyPosts" 
        component={MyPosts} 
        options={{ title: 'My Posts' }} 
      />
      <Stack.Screen 
        name="Reviews" 
        component={ReviewsScreen} 
        options={{ title: 'Reviews' }} 
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
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#8B0000',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 150,
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
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5c28b',
  },
});