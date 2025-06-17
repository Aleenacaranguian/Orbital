//viewservice.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';

type Service = {
  id: string;
  service_type: string;
  service_url?: string | null;
  created_at?: string;
  name_of_service?: string;
  price?: string;
  pet_preferences?: string;
  housing_type?: string;
  service_details?: string;
  accepts_pets_with_transmissible_health_issues?: boolean;
  accepts_unsterilised_pets?: boolean;
  sitter_present_throughout_service?: boolean;
  no_adults_present?: boolean;
  no_children_present?: boolean;
  no_other_dogs_present?: boolean;
  no_other_cats_present?: boolean;
};

type PetSitter = {
  id: string;
  about_me: string;
  other_pet_related_skills: string;
  works_with_animals: boolean;
  volunteers_with_animals: boolean;
  owns_pets: boolean;
  years_of_experience: string;
  average_stars: number;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
};

type HomeStackParamList = {
  ViewService: { service: Service };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'ViewService'>;

const defaultServiceImage = require('../assets/petsitter.png'); // Ensure this path is correct

const housingTypes = [
  'Apartment',
  'HDB',
  'Landed property with backyard',
  'Landed property without backyard',
  'NA',
];

export default function ViewServiceScreen({ route }: Props) {
  const { service } = route.params;
  const [petSitter, setPetSitter] = useState<PetSitter | null>(null);
  const [serviceImageUrl, setServiceImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceDetails();
  }, []);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);

      // Fetch pet sitter details with profile info
      const { data: sitterData, error: sitterError } = await supabase
        .from('pet_sitter')
        .select(
          `
          *,
          profiles!pet_sitter_id_fkey (
            username,
            avatar_url
          )
          `
        )
        .eq('id', service.id)
        .single();

      if (sitterError) {
        console.error('Error fetching pet sitter:', sitterError);
        Alert.alert('Error', 'Failed to load pet sitter details');
        setPetSitter(null);
      } else {
        setPetSitter(sitterData as PetSitter);
      }

      // Get service image URL if service_url exists
      if (service.service_url) {
        const { data: imageData } = supabase.storage
          .from('services')
          .getPublicUrl(service.service_url);

        setServiceImageUrl(imageData.publicUrl);
      }

    } catch (error) {
      console.error('Error in fetchServiceDetails:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading service details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={serviceImageUrl ? { uri: serviceImageUrl } : defaultServiceImage}
        style={styles.image}
      />

      <View style={styles.bigCard}>
        <Text style={styles.serviceName}>
          {service.name_of_service || `${service.service_type} Service`}
        </Text>

        {petSitter && petSitter.profiles ? (
          <View style={styles.sitterInfo}>
            <Image
              source={
                petSitter.profiles.avatar_url
                  ? { uri: petSitter.profiles.avatar_url }
                  : require('../assets/default-profile.png') // Ensure this path is correct
              }
              style={styles.sitterAvatar}
            />
            <Text style={styles.sitterName}>@{petSitter.profiles.username || 'User'}</Text>
            {petSitter.average_stars != null && (
                <Text style={styles.sitterRating}>
                    ⭐ {petSitter.average_stars.toFixed(1)} Rating
                </Text>
            )}
          </View>
        ) : (
          <View style={styles.sitterInfo}>
            <Text style={styles.sitterName}>Pet Sitter Info Unavailable</Text>
          </View>
        )}

        <Text style={styles.label}>Service Type</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.service_type || ''}</Text>
        </View>

        <Text style={styles.label}>Rate per Hour/Night</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.price || 'Contact for pricing'}</Text>
        </View>

        <Text style={styles.label}>Pet Preferences</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.pet_preferences || 'All pets welcome'}</Text>
        </View>

        <Text style={styles.label}>Service Details</Text>
        <View style={styles.readOnlyFieldLarge}>
          <Text>{service.service_details || 'No additional details provided'}</Text>
        </View>

        {petSitter && (
          <>
            <Text style={styles.label}>About the Pet Sitter</Text>
            <View style={styles.readOnlyFieldLarge}>
              <Text>{petSitter.about_me || 'No description provided'}</Text>
            </View>

            <Text style={styles.label}>Experience & Skills</Text>
            <View style={styles.subCard}>
              {/* Using a consistent style for these details */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Years of Experience:</Text>
                <Text style={styles.toggleValue}>{petSitter.years_of_experience || 'Not specified'}</Text>
              </View>
              {renderToggleWithText('Works with animals professionally', petSitter.works_with_animals)}
              {renderToggleWithText('Volunteers with animals', petSitter.volunteers_with_animals)}
              {renderToggleWithText('Owns pets', petSitter.owns_pets)}
              {petSitter.other_pet_related_skills && (
                <View style={styles.readOnlySubField}>
                  <Text style={styles.toggleLabel}>Other Skills:</Text>
                  <Text style={styles.toggleValue}>{petSitter.other_pet_related_skills}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Service Environment */}
        <Text style={styles.label}>Service Environment</Text>
        <View style={styles.subCard}>
          {renderToggle('No other dogs present', service.no_other_dogs_present)}
          {renderToggle('No other cats present', service.no_other_cats_present)}
          {renderToggle('No children', service.no_children_present)}
          {renderToggle('No adults', service.no_adults_present)}
          {renderToggle('Sitter present throughout', service.sitter_present_throughout_service)}
          {renderToggle('Accepts unsterilised pets', service.accepts_unsterilised_pets)}
          {renderToggle('Accepts transmissible health issues', service.accepts_pets_with_transmissible_health_issues)}
        </View>

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
        thumbColor={!!value ? 'white' : '#f4f3f4'}
      />
    </View>
  );
}

// New helper function for consistent 'Yes'/'No' display with a switch-like visual
function renderToggleWithText(label: string, value: boolean | undefined) {
  return (
    <View style={styles.toggleRow} key={label}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleValueContainer, { backgroundColor: value ? '#d4edda' : '#f8d7da' }]}>
        <Text style={[styles.toggleValueText, { color: value ? '#155724' : '#721c24' }]}>
          {value ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5ec',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#ddd',
  },
  bigCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  sitterInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sitterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    backgroundColor: '#ddd', // Placeholder background
  },
  sitterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sitterRating: {
    fontSize: 16,
    color: '#666',
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
    marginBottom: 8, // Added for consistent spacing
  },
  readOnlyFieldLarge: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: 8, // Added for consistent spacing
  },
  subCard: {
    backgroundColor: '#fef5ec',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10, // Added for spacing between subcards/sections
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  toggleValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
  },
  toggleValueContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  toggleValueText: {
    fontSize: 15,
    fontWeight: '600',
  },
  readOnlySubField: { // For "Other Skills" within the subCard
    backgroundColor: '#f2f2f2', // Lighter background for consistency
    borderRadius: 8,
    padding: 12,
    marginTop: 8, // Spacing from previous items in subcard
  },
});