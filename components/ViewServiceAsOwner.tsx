import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackParamList, Service, Pet } from './Search';
import { supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<SearchStackParamList, 'ViewServiceAsOwner'>;

//Profile attributes 
type Profile = {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  postal_code?: string;
  phone_number?: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
};

//Pet sitter attributes 
type PetSitter = {
  id: string;
  about_me: string;
  years_of_experience: string;
  other_pet_related_skills: string;
  owns_pets: boolean;
  volunteers_with_animals: boolean;
  works_with_animals: boolean;
  average_stars?: number;
  created_at: string;
};

// Combined type for display
type SitterInfo = {
  profile: Profile;
  petSitter: PetSitter;
};

const defaultServiceImage = require('../assets/petsitter.png');
const defaultProfileImage = require('../assets/default-profile.png');

const housingTypes = [
  'Apartment',
  'HDB',
  'Landed property with backyard',
  'Landed property without backyard',
  'NA',
];

export default function ViewServiceAsOwnerScreen({ route, navigation }: Props) {
  const { service, selectedPets, fromDate, toDate } = route.params;
  const [sitterInfo, setSitterInfo] = useState<SitterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchSitterInfo();
  }, [service.id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchSitterInfo = async () => {
    try {
      setLoading(true);
      
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', service.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        Alert.alert('Error', 'Failed to load sitter profile information');
        return;
      }

      // Get pet sitter data
      const { data: petSitterData, error: petSitterError } = await supabase
        .from('pet_sitter')
        .select('*')
        .eq('id', service.id)
        .single();
      
      if (petSitterError) {
        console.error('Error fetching pet sitter info:', petSitterError);
        Alert.alert('Error', 'Failed to load pet sitter information');
        return;
      }
      
      setSitterInfo({
        profile: profileData,
        petSitter: petSitterData
      });
    } catch (error) {
      console.error('Error in fetchSitterInfo:', error);
      Alert.alert('Error', 'Failed to load sitter information');
    } finally {
      setLoading(false);
    }
  };

  const getServiceImageUri = () => {
    if (service.service_url) {
      if (service.service_url.startsWith('http')) {
        return { uri: service.service_url };
      }
      const { data } = supabase.storage
        .from('services')
        .getPublicUrl(service.service_url);
      return { uri: data.publicUrl };
    }
    return defaultServiceImage;
  };

  const getSitterImageUri = () => {
    if (sitterInfo?.profile?.avatar_url) {
      if (sitterInfo.profile.avatar_url.startsWith('http')) {
        return { uri: sitterInfo.profile.avatar_url };
      }
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(sitterInfo.profile.avatar_url);
      return { uri: data.publicUrl };
    }
    return defaultProfileImage;
  };

  const handleViewReviews = () => {
    if (!sitterInfo?.profile) {
      Alert.alert('Error', 'Unable to load sitter information');
      return;
    }

    // Navigate to Reviews screen
    navigation.navigate('Reviews', {
      sitterId: sitterInfo.profile.id,
      sitterUsername: sitterInfo.profile.username,
      sitterAvatar: sitterInfo.profile.avatar_url || null,
    });
  };

  const createDefaultMessage = () => {
    const serviceName = service.name_of_service || service.service_type;
    const fromDateStr = fromDate ? new Date(fromDate).toLocaleDateString() : 'TBD';
    const toDateStr = toDate ? new Date(toDate).toLocaleDateString() : 'TBD';
    
  
    const petDetails = selectedPets?.map((pet: Pet) => {
      let petInfo = `• ${pet.name}`;
      
    
      if (pet.pet_type) {
        petInfo += ` (${pet.pet_type}`;
        if (pet.breed) {
          petInfo += `, ${pet.breed}`;
        }
        petInfo += ')';
      }
      

      if (pet.size) {
        petInfo += `\n  size: ${pet.size}`;
      }
      
      
      petInfo += `\n  sterilised: ${pet.sterilised ?? 'null'}`;
      petInfo += `\n  transmissible health issues: ${pet.transmissible_health_issues ?? 'null'}`;
      petInfo += `\n  friendly with dogs: ${pet.friendly_with_dogs ?? 'null'}`;
      petInfo += `\n  friendly with cats: ${pet.friendly_with_cats ?? 'null'}`;
      petInfo += `\n  friendly with children: ${pet.friendly_with_children ?? 'null'}`;
      
      return petInfo;
    }).join('\n') || 'My pet(s)';
    
    return `Hello ${sitterInfo?.profile?.username || 'there'}! I would like to inquire about your ${serviceName} service.
  
  Booking Details:
  • Service: ${serviceName}
  • From: ${fromDateStr}
  • To: ${toDateStr}
  • Rate: $${service.price || 'TBD'} per hour
  
  Pet Information:
  ${petDetails}
  
  I'm interested in booking this service. Could you please let me know your availability and if you have any questions about my pet(s)?`;
  };

  const handleSendMessage = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'Please log in to send a message');
        return;
      }
  
      if (!sitterInfo?.profile?.id) {
        Alert.alert('Error', 'Unable to identify the sitter');
        return;
      }
  
    //Check if user is messaging himself 
      if (currentUser.id === sitterInfo.profile.id) {
        Alert.alert('Error', 'You cannot send a message to yourself');
        return;
      }
  
      const defaultMessage = createDefaultMessage();
  
      // Insert message into the messages table
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: sitterInfo.profile.id,
          message_content: defaultMessage,
          is_read: false
        })
        .select()
        .single();
  
      if (messageError) {
        console.error('Error sending message:', messageError);
        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }
  
      // Show success alert without navigation
      Alert.alert(
        'Message Sent!', 
        'Your message has been sent to the sitter. You can continue the conversation in your Messaging tab.',
        [
          {
            text: 'OK',
            onPress: () => {
              //No navigation here, users to navigate themselves 
              console.log('Message sent successfully');
            }
          }
        ]
      );
  
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading service details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={getServiceImageUri()}
        style={styles.image}
      />

      <View style={styles.bigCard}>
        <Text style={styles.serviceName}>{service.name_of_service || 'Untitled Service'}</Text>

        <View style={styles.sitterSection}>
          <Image source={getSitterImageUri()} style={styles.sitterImage} />
          <View style={styles.sitterDetails}>
            <Text style={styles.sitterName}>{sitterInfo?.profile?.username || 'Unknown Sitter'}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.goldStar}>★</Text>
              <Text style={styles.ratingNumber}>{sitterInfo?.petSitter?.average_stars?.toFixed(1) || '0.0'}</Text>
              <TouchableOpacity onPress={handleViewReviews} style={styles.viewReviewsButton}>
                <Text style={styles.viewReviewsText}>View reviews</Text>
              </TouchableOpacity>
            </View>
            {sitterInfo?.petSitter?.years_of_experience && (
              <Text style={styles.experience}>{sitterInfo.petSitter.years_of_experience} years experience</Text>
            )}
          </View>
        </View>

        {sitterInfo?.petSitter?.about_me && (
          <>
            <Text style={styles.label}>About the Sitter</Text>
            <View style={styles.readOnlyFieldLarge}>
              <Text>{sitterInfo.petSitter.about_me}</Text>
            </View>
          </>
        )}

        <Text style={styles.label}>Service Type</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.service_type}</Text>
        </View>

        <Text style={styles.label}>Rate per Hour</Text>
        <View style={styles.readOnlyField}>
          <Text>${service.price || '0'}</Text>
        </View>

        <Text style={styles.label}>Pet Type Accepted</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.pet_type || 'All pets'}</Text>
        </View>

        {service.pet_preferences && (
          <>
            <Text style={styles.label}>Pet Preferences</Text>
            <View style={styles.readOnlyField}>
              <Text>{service.pet_preferences}</Text>
            </View>
          </>
        )}

        {service.service_details && (
          <>
            <Text style={styles.label}>Service Details</Text>
            <View style={styles.readOnlyFieldLarge}>
              <Text>{service.service_details}</Text>
            </View>
          </>
        )}

        <Text style={styles.label}>Service Environment</Text>
        <View style={styles.subCard}>
          {renderToggle('No other dogs present', service.no_other_dogs_present)}
          {renderToggle('No other cats present', service.no_other_cats_present)}
          {renderToggle('No children present', service.no_children_present)}
          {renderToggle('No adults present', service.no_adults_present)}
          {renderToggle('Sitter present throughout service', service.sitter_present_throughout_service)}
          {renderToggle('Accepts unsterilised pets', service.accepts_unsterilised_pets)}
          {renderToggle('Accepts pets with transmissible health issues', service.accepts_pets_with_transmissible_health_issues)}
        </View>

        {service.housing_type && (
          <>
            <Text style={styles.label}>Housing Type</Text>
            <View style={styles.subCard}>
              {housingTypes.map((ht) => (
                <View style={styles.toggleRow} key={ht}>
                  <Text style={styles.toggleLabel}>{ht}</Text>
                  <Switch
                    value={service.housing_type === ht}
                    disabled
                    trackColor={{ false: '#ccc', true: '#4CAF50' }}
                    thumbColor={service.housing_type === ht ? 'white' : '#f4f3f4'}
                  />
                </View>
              ))}
            </View>
          </>
        )}


        {sitterInfo?.petSitter?.other_pet_related_skills && (
          <>
            <Text style={styles.label}>Other Pet-Related Skills</Text>
            <View style={styles.readOnlyField}>
              <Text>{sitterInfo.petSitter.other_pet_related_skills}</Text>
            </View>
          </>
        )}

        <Text style={styles.label}>Sitter's Background</Text>
        <View style={styles.subCard}>
          {renderToggle('Owns pets', sitterInfo?.petSitter?.owns_pets)}
          {renderToggle('Volunteers with animals', sitterInfo?.petSitter?.volunteers_with_animals)}
          {renderToggle('Works with animals professionally', sitterInfo?.petSitter?.works_with_animals)}
        </View>

        {selectedPets && selectedPets.length > 0 && (
          <>
            <Text style={styles.label}>Selected Pets for This Service</Text>
            <View style={styles.petsContainer}>
              {selectedPets.map((pet: Pet) => (
                <View key={pet.id} style={styles.petItem}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petType}>({pet.pet_type})</Text>
                </View>
              ))}
            </View>
          </>
        )}


        {fromDate && toDate && (
          <>
            <Text style={styles.label}>Service Duration</Text>
            <View style={styles.durationContainer}>
              <Text style={styles.dateText}>From: {new Date(fromDate).toLocaleString()}</Text>
              <Text style={styles.dateText}>To: {new Date(toDate).toLocaleString()}</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.bookButton} onPress={handleSendMessage}>
          <Text style={styles.bookButtonText}>Send Message to Sitter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function renderToggle(label: string, value: boolean | undefined) {
  return (
    <View style={styles.toggleRow} key={label}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch 
        value={!!value} 
        disabled 
        trackColor={{ false: '#ccc', true: '#4CAF50' }}
        thumbColor={value ? 'white' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5ec',
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#ddd',
    resizeMode: 'cover',
  },
  bigCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  sitterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  sitterImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  sitterDetails: {
    flex: 1,
  },
  sitterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  goldStar: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 4,
  },
  ratingNumber: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  viewReviewsButton: {
    paddingVertical: 2,
  },
  viewReviewsText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  experience: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
    marginTop: 12,
    marginBottom: 6,
  },
  readOnlyField: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  readOnlyFieldLarge: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  subCard: {
    backgroundColor: '#fef5ec',
    borderRadius: 12,
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  petsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  petType: {
    fontSize: 14,
    color: '#666',
  },
  durationContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  bookButton: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});