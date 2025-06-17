//editpetsitterprofile.tsx 
import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
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

type Service = {
  id: string;
  name_of_service: string; // Changed to use name_of_service as primary display
  service_type: string;
  service_url?: string | null;
  created_at?: string;
  price?: string;
  pet_preferences?: string;
  housing_type?: string;
  accepts_pets_with_transmissible_health_issues?: boolean;
  accepts_unsterilised_pets?: boolean;
  sitter_present_throughout_service?: boolean;
  no_adults_present?: boolean;
  no_children_present?: boolean;
  no_other_cats_present?: boolean;
  no_other_dogs_present?: boolean;
};

type HomeStackParamList = {
  Home: undefined;
  PetSitterProfile: { sitter: Sitter };
  EditPetSitterProfile: { sitter: Sitter };
  EditService: { service: Service };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'EditPetSitterProfile'>;

export default function EditPetSitterProfile({ route, navigation }: Props) {
  const { sitter } = route.params;

  const [about_me, set_about_me] = useState(sitter.about_me || '');
  const [years_of_experience, set_years_of_experience] = useState(sitter.years_of_experience || '');
  const [other_pet_related_skills, set_other_pet_related_skills] = useState(sitter.other_pet_related_skills || '');
  const [owns_pets, set_owns_pets] = useState(sitter.owns_pets);
  const [volunteers_with_animals, set_volunteers_with_animals] = useState(sitter.volunteers_with_animals);
  const [works_with_animals, set_works_with_animals] = useState(sitter.works_with_animals);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch services with all required fields
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select(`
            id,
            name_of_service,
            service_type,
            service_url,
            created_at,
            price,
            pet_preferences,
            housing_type,
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
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchServices();
  }, []);

  const onSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to save changes');
        return;
      }

      // Check if pet sitter profile exists
      const { data: existingData, error: checkError } = await supabase
        .from('pet_sitter')
        .select('id')
        .eq('id', user.id)
        .single();

      const petSitterData = {
        about_me,
        years_of_experience,
        other_pet_related_skills,
        owns_pets,
        volunteers_with_animals,
        works_with_animals,
      };

      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('pet_sitter')
          .insert([{
            id: user.id,
            ...petSitterData,
            average_stars: 0, // Default value
          }]);

        if (insertError) {
          throw insertError;
        }
      } else if (!checkError) {
        // Profile exists, update it
        const { error: updateError } = await supabase
          .from('pet_sitter')
          .update(petSitterData)
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        throw checkError;
      }

      Alert.alert('Success', 'Pet sitter profile saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving pet sitter profile:', error);
      Alert.alert('Error', 'Failed to save pet sitter profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to add services');
        return;
      }
  
      // First ensure pet sitter profile exists
      const { data: sitterExists } = await supabase
        .from('pet_sitter')
        .select('id')
        .eq('id', user.id)
        .single();
  
      if (!sitterExists) {
        Alert.alert('Error', 'Please save your pet sitter profile first');
        return;
      }
  
      // Generate a unique name_of_service since it's part of the composite primary key
      const timestamp = Date.now();
      const serviceName = `Service_${timestamp}`;
  
      const { data: newService, error } = await supabase
        .from('services')
        .insert([{
          id: user.id,
          name_of_service: serviceName,
          service_type: 'House visit',
          service_url: null,
          price: '',
          pet_preferences: '',
          housing_type: 'NA',
          accepts_pets_with_transmissible_health_issues: false,
          accepts_unsterilised_pets: false,
          sitter_present_throughout_service: false,
          no_adults_present: false,
          no_children_present: false,
          no_other_cats_present: false,
          no_other_dogs_present: false,
        }])
        .select(`
          id,
          name_of_service,
          service_type,
          service_url,
          created_at,
          price,
          pet_preferences,
          housing_type,
          accepts_pets_with_transmissible_health_issues,
          accepts_unsterilised_pets,
          sitter_present_throughout_service,
          no_adults_present,
          no_children_present,
          no_other_cats_present,
          no_other_dogs_present
        `)
        .single();
  
      if (error) {
        throw error;
      }
  
      setServices(prev => [newService, ...prev]);
      Alert.alert('Success', 'Service added! You can edit it now.');
    } catch (error) {
      console.error('Error adding service:', error);
      Alert.alert('Error', 'Failed to add service. Please try again.');
    }
  };

  const handleEditService = (service: Service) => {
    navigation.navigate('EditService', {
      service
    });
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={onSave}
          style={{ marginRight: 15 }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Done</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, about_me, years_of_experience, other_pet_related_skills, owns_pets, volunteers_with_animals, works_with_animals, loading]);

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
        <Text style={styles.reviewText}>⭐ {sitter.average_stars?.toFixed(1) || '0.0'} | Reviews</Text>
      </View>

      <Text style={styles.label}>About Me</Text>
      <TextInput
        style={[styles.input, styles.aboutMeInput]}
        multiline
        value={about_me}
        onChangeText={set_about_me}
        placeholder="Tell us about yourself..."
        placeholderTextColor="gray"
      />

      <View style={styles.section}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={years_of_experience}
          onChangeText={set_years_of_experience}
          placeholder="e.g. 2 - 5"
          placeholderTextColor="gray"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any Other Pet-Related Skills</Text>
        <TextInput
          style={styles.input}
          value={other_pet_related_skills}
          onChangeText={set_other_pet_related_skills}
          placeholder="e.g. Certified in pet first aid"
          placeholderTextColor="gray"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Owns pets</Text>
          <Switch value={owns_pets} onValueChange={set_owns_pets} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Volunteer with animals</Text>
          <Switch value={volunteers_with_animals} onValueChange={set_volunteers_with_animals} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Work with animals</Text>
          <Switch value={works_with_animals} onValueChange={set_works_with_animals} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Services Provided</Text>
        {services.length === 0 ? (
          <Text style={{ color: 'gray', marginTop: 10, marginBottom: 10 }}>No services added yet 🐶</Text>
        ) : (
          services.map(service => (
            <View key={`${service.id}-${service.name_of_service}`} style={styles.serviceCardLarge}>
              <Image
                source={getServiceImageUri(service)}
                style={styles.serviceImageLarge}
              />
              <View style={styles.serviceInfoLarge}>
                <Text style={styles.serviceTitle}>{service.name_of_service}</Text>
                <Text style={styles.serviceType}>{service.service_type}</Text>
                <TouchableOpacity onPress={() => handleEditService(service)}>
                  <Text style={styles.moreDetails}>Edit Details →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity onPress={handleAddService} style={styles.addServiceButton}>
          <Text style={styles.addServiceText}>+ Add Service</Text>
        </TouchableOpacity>
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
    fontSize: 25,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  serviceType: {
    fontSize: 16,
    color: 'black',
    marginVertical: 4,
  },
  moreDetails: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },  
  addServiceButton: {
    marginTop: 10,
    backgroundColor: '#f5c28b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addServiceText: {
    fontWeight: '600',
    fontSize: 16,
    color: 'white',
  },
});