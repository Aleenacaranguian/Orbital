//mypetsitterprofile.tsx
import React, { useLayoutEffect, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { supabase } from '../lib/supabase';

const defaultAvatar = require('../assets/default-profile.png');
const defaultServiceImage = require('../assets/petsitter.png');

type Sitter = {
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

// Define allowed pet types to match home.tsx
type PetType = 'Dog' | 'Cat' | 'Rabbit' | 'Bird' | 'Reptile' | 'Fish';

// Updated Service type to match the new table structure
type Service = {
  service_id: string; // New primary key (UUID)
  id: string; // Foreign key referencing user
  name_of_service: string;
  service_type: string;
  service_url?: string | null;
  created_at?: string;
  price?: string;
  pet_preferences?: string;
  pet_type?: PetType | null; // Updated to use the specific pet types
  housing_type?: string;
  service_details?: string;
  accepts_pets_with_transmissible_health_issues?: boolean;
  accepts_unsterilised_pets?: boolean;
  sitter_present_throughout_service?: boolean;
  no_adults_present?: boolean;
  no_children_present?: boolean;
  no_other_cats_present?: boolean;
  no_other_dogs_present?: boolean;
};

// Updated to match Home.tsx HomeStackParamList
type HomeStackParamList = {
  PetSitterProfileView: undefined;
  EditPetSitterProfile: { sitter: Sitter };
  ViewService: { service: Service };
  Reviews: { sitterId: string; sitterUsername: string; sitterAvatar: string | null };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'PetSitterProfileView'>;

export default function MyPetSitterProfile({ route, navigation }: Props) {
  const [sitter, setSitter] = useState<Sitter | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const fetchPetSitterProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to view your profile');
        return;
      }

      // Fetch profile data for avatar and username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch pet sitter data
      const { data: sitterData, error: sitterError } = await supabase
        .from('pet_sitter')
        .select('*')
        .eq('id', user.id)
        .single();

      if (sitterError) {
        if (sitterError.code === 'PGRST116') {
          // No pet sitter profile exists, create default one
          setSitter({
            id: user.id,
            about_me: '',
            years_of_experience: '',
            other_pet_related_skills: '',
            owns_pets: false,
            volunteers_with_animals: false,
            works_with_animals: false,
            average_stars: 0,
          });
        } else {
          console.error('Error fetching pet sitter:', sitterError);
        }
      } else {
        setSitter({
          ...sitterData,
          imageUri: profileData?.avatar_url || null,
          username: profileData?.username || 'Username',
        });
      }

      // Fetch review count
      const { count: reviewCountData, error: reviewCountError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('to_id', user.id);

      if (reviewCountError) {
        console.error('Error fetching review count:', reviewCountError);
      } else {
        setReviewCount(reviewCountData || 0);
      }

      // Fetch services with all required fields including service_id and pet_type
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          service_id,
          id,
          name_of_service,
          service_type,
          service_url,
          created_at,
          price,
          pet_preferences,
          pet_type,
          housing_type,
          service_details,
          accepts_pets_with_transmissible_health_issues,
          accepts_unsterilised_pets,
          sitter_present_throughout_service,
          no_adults_present,
          no_children_present,
          no_other_cats_present,
          no_other_dogs_present
        `)
        .eq('id', user.id)
        .order('created_at', { ascending: false });

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      } else {
        setServices(servicesData || []);
      }

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load pet sitter profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetSitterProfile();

    // Set up real-time subscription for profile changes
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const sitterSubscription = supabase.channel('pet_sitter_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'pet_sitter',
            filter: `id=eq.${user.id}`
          }, fetchPetSitterProfile)
          .subscribe();

        const servicesSubscription = supabase.channel('services_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'services',
            filter: `id=eq.${user.id}`
          }, fetchPetSitterProfile)
          .subscribe();

        const reviewsSubscription = supabase.channel('reviews_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'reviews',
            filter: `to_id=eq.${user.id}`
          }, fetchPetSitterProfile)
          .subscribe();

        return () => {
          supabase.removeChannel(sitterSubscription);
          supabase.removeChannel(servicesSubscription);
          supabase.removeChannel(reviewsSubscription);
        };
      }
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => sitter && navigation.navigate('EditPetSitterProfile', { sitter })}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, sitter]);

  const handleViewService = (service: Service) => {
    navigation.navigate('ViewService', {
      service,
    });
  };

  const handleViewReviews = () => {
    if (sitter?.id && profile) {
      navigation.navigate('Reviews', {
        sitterId: sitter.id,
        sitterUsername: profile.username,
        sitterAvatar: profile.avatar_url,
      });
    }
  };

  const getServiceImageUri = (service: Service) => {
    if (service.service_url) {
      return { uri: service.service_url };
    }
    return defaultServiceImage;
  };

  const getAvatarUri = () => {
    if (profile?.avatar_url) {
      return { uri: profile.avatar_url };
    }
    return defaultAvatar;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10, color: '#8B0000' }}>Loading profile...</Text>
      </View>
    );
  }

  if (!sitter) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#8B0000', fontSize: 18 }}>No pet sitter profile found</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: '#fef5ec' }}
      contentContainerStyle={styles.container}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={getAvatarUri()}
          style={styles.avatar}
        />
        <Text style={styles.username}>{profile?.username || 'Username'}</Text>
        <TouchableOpacity onPress={handleViewReviews}>
          <Text style={styles.reviewText}>
            ⭐ {sitter.average_stars?.toFixed(1) || '0.0'} | {reviewCount} Reviews
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>About Me</Text>
      <TextInput
        style={[styles.input, styles.aboutMeInput]}
        multiline
        value={sitter.about_me}
        editable={false}
        placeholder="No description provided"
        placeholderTextColor="#999"
      />

      <View style={styles.section}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={sitter.years_of_experience}
          editable={false}
          placeholder="No experience specified"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any Other Pet-Related Skills</Text>
        <TextInput
          style={styles.input}
          value={sitter.other_pet_related_skills}
          editable={false}
          placeholder="No additional skills specified"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Owns pets</Text>
          <Switch
            value={!!sitter.owns_pets}
            disabled
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sitter.owns_pets ? 'white' : '#f4f3f4'}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Volunteer with animals</Text>
          <Switch
            value={!!sitter.volunteers_with_animals}
            disabled
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sitter.volunteers_with_animals ? 'white' : '#f4f3f4'}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Work with animals</Text>
          <Switch
            value={!!sitter.works_with_animals}
            disabled
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sitter.works_with_animals ? 'white' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Services Provided</Text>
        {services.length === 0 ? (
          <Text style={{ color: 'gray', marginTop: 10, marginBottom: 10 }}>No services added yet 🐶</Text>
        ) : (
          services.map(service => (
            <View key={service.service_id} style={styles.serviceCardLarge}>
              <Image
                source={getServiceImageUri(service)}
                style={styles.serviceImageLarge}
              />
              <View style={styles.serviceInfoLarge}>
                <Text style={styles.serviceTitle}>{service.name_of_service}</Text>
                <Text style={styles.serviceType}>{service.service_type}</Text>
                {service.pet_type && (
                  <Text style={styles.petType}>For: {service.pet_type}</Text>
                )}
                <TouchableOpacity onPress={() => handleViewService(service)}>
                  <Text style={styles.moreDetails}>More Details →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef5ec',
    paddingBottom: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 14,
    color: 'black',
    textDecorationLine: 'underline',
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: '#844d3e',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    color: 'black',
  },
  aboutMeInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  serviceCardLarge: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    height: 150,
  },
  serviceImageLarge: {
    width: 150,
    height: 120,
    borderRadius: 12,
    margin: 12,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  serviceInfoLarge: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  serviceType: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  petType: {
    fontSize: 14,
    color: '#8B0000',
    fontWeight: '500',
    marginBottom: 4,
  },
  moreDetails: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});