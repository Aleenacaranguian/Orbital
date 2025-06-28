import React, { useState, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase'; 
import SearchResults from './SearchResults';
import ViewServiceAsOwner from './ViewServiceAsOwner';
import ReviewsScreen from './Reviews'; 



export type PetType = 'Dog' | 'Cat' | 'Rabbit' | 'Bird' | 'Reptile' | 'Fish';

export type Pet = {
  id: string; 
  name: string;
  birthday?: string | null;
  pet_type?: PetType | null;
  size?: string | null;
  breed?: string | null;
  sterilised?: boolean;
  transmissible_health_issues?: boolean;
  friendly_with_dogs?: boolean;
  friendly_with_cats?: boolean;
  friendly_with_children?: boolean;
  pet_url?: string | null;
  created_at?: string;
};

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
  sitter_name?: string;
  sitter_rating?: number;
  sitter_image?: string;
};

// Navigation types for the Search stack
export type SearchStackParamList = {
  SearchScreen: undefined;
  SearchResults: {
    selectedPets: Pet[];
    selectedService: string | null;
    fromDate: string;
    toDate: string;
  };
  ViewServiceAsOwner: { 
    service: Service;
    selectedPets: Pet[];
    fromDate: string;
    toDate: string;
  };
  Reviews: { 
    sitterId: string; 
    sitterUsername: string; 
    sitterAvatar: string | null 
  }; 
  MessageSitter: {
    sitterUsername: string;
    sitterAvatar: any;
    sitterId: string;
    initialMessage?: string;
  };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchResults'>;

const serviceTypes = [
  'House visit', 
  'House sitting', 
  'Dog walking', 
  'Daycare', 
  'Boarding', 
  'Grooming', 
  'Training', 
  'Transport'
];

function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { height } = useWindowDimensions();

  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null); // Changed to single pet selection
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user's pets when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserPets();
    }, [])
  );

  const fetchUserPets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to view your pets');
        return;
      }

      const { data: pets, error } = await supabase
        .from('my_pets')
        .select('*')
        .eq('id', user.id); 
      if (error) {
        console.error('Error fetching pets:', error);
        Alert.alert('Error', 'Failed to load your pets');
        return;
      }

      setUserPets(pets || []);
      
      if (pets && pets.length > 0) {
        const currentPetIds = pets.map(pet => getPetUniqueId(pet));
        if (selectedPetId && !currentPetIds.includes(selectedPetId)) {
          setSelectedPetId(null);
        }
      } else {
        setSelectedPetId(null);
      }
    } catch (error) {
      console.error('Error in fetchUserPets:', error);
      Alert.alert('Error', 'Failed to load your pets');
    } finally {
      setLoading(false);
    }
  };

  // Create unique pet identifier since pets don't have individual IDs on supabase
  const getPetUniqueId = (pet: Pet) => {
    return `${pet.id}-${pet.name}-${pet.created_at || ''}`;
  };

  const selectPet = (pet: Pet) => {
    const petId = getPetUniqueId(pet);
    
    if (selectedPetId === petId) {
      // Deselect pet if already selected
      setSelectedPetId(null);
    } else {
      // Select this pet (replacing any previously selected pet)
      setSelectedPetId(petId);
    }
  };

  // Get selected pet object
  const getSelectedPet = (): Pet | null => {
    if (!selectedPetId) return null;
    return userPets.find(pet => getPetUniqueId(pet) === selectedPetId) || null;
  };

  const handleSearch = () => {
    const selectedPet = getSelectedPet();
    
    if (!selectedPet) {
      Alert.alert('Select Pet', 'Please select a pet for the service');
      return;
    }

    if (!selectedService) {
      Alert.alert('Select Service', 'Please select a service type');
      return;
    }

    if (fromDate >= toDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date');
      return;
    }

    navigation.navigate('SearchResults', {
      selectedPets: [selectedPet],
      selectedService,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    });
  };

  const getPetImageUri = (pet: Pet) => {
    if (pet.pet_url) {
 
      // If storing storage paths, construct the full URL using correct bucket name
      const { data } = supabase.storage
        .from('my-pets') // Fixed bucket name to match your schema
        .getPublicUrl(pet.pet_url);
      return { uri: data.publicUrl };
    }
    return require('../assets/default-profile.png');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading your pets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SEARCH</Text>

      <View style={[styles.card, { height: height * 0.8 }]}>
        <ScrollView contentContainerStyle={styles.cardScroll}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.subLabel}>Who</Text>
              <Text style={styles.helperText}>Select a Pet</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {userPets.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
              {userPets.map((pet, index) => {
                const petId = getPetUniqueId(pet);
                const isSelected = selectedPetId === petId;
                
                return (
                  <TouchableOpacity
                    key={petId} // Using unique pet identifier
                    onPress={() => selectPet(pet)}
                    style={[
                      styles.avatarWrapper,
                      isSelected && styles.avatarSelected,
                    ]}
                  >
                    <Image source={getPetImageUri(pet)} style={styles.avatar} />
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petType}>{pet.pet_type}</Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noPetsContainer}>
              <Text style={styles.noPetsText}>
                You haven't added any pets yet. Add pets in your profile to search for services.
              </Text>
            </View>
          )}

          <Text style={styles.subLabel}>Service Type</Text>
          <Text style={styles.helperText}>Select One</Text>
          <View style={styles.pillsContainer}>
            {serviceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedService(type)}
                style={[
                  styles.pill,
                  selectedService === type && styles.pillSelected,
                ]}
              >
                <Text
                  style={
                    selectedService === type ? styles.pillTextSelected : styles.pillText
                  }
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>Date(s)</Text>
          <Text style={styles.helperText}>From</Text>
          <TouchableOpacity onPress={() => setShowFromPicker(true)}>
            <Text style={styles.dateText}>
              {fromDate.toLocaleDateString()} 
              {' '}
              {fromDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate}
              mode="datetime"
              display="default"
              onChange={(_, date) => {
                setShowFromPicker(false);
                if (date) setFromDate(date);
              }}
            />
          )}

          <Text style={styles.helperText}>To</Text>
          <TouchableOpacity onPress={() => setShowToPicker(true)}>
            <Text style={styles.dateText}>
              {toDate.toLocaleDateString()} 
              {' '}
              {toDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={toDate}
              mode="datetime"
              display="default"
              onChange={(_, date) => {
                setShowToPicker(false);
                if (date) setToDate(date);
              }}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}
//Search Navigation
export default function Search() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SearchScreen" 
        component={SearchScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="SearchResults" 
        component={SearchResults} 
        options={{ title: 'Search Results' }} 
      />
      <Stack.Screen 
        name="ViewServiceAsOwner" 
        component={ViewServiceAsOwner} 
        options={{ title: 'View Service' }} 
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
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B0000',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardScroll: {
    paddingBottom: 40,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subLabel: {
    fontSize: 32,
    fontWeight: '600',
    color: '#844d3e',
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarWrapper: {
    marginRight: 15,
    marginTop: 5,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    paddingBottom: 8,
    position: 'relative',
  },
  avatarSelected: {
    borderColor: '#8B0000',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 4,
  },
  petName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    maxWidth: 80,
  },
  petType: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#8B0000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noPetsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  noPetsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: -20,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 20,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: '#e0d6d1',
    marginRight: 8,
    marginBottom: 8,
  },
  pillSelected: {
    backgroundColor: '#844d3e',
  },
  pillText: {
    fontSize: 18,
    color: '#333',
  },
  pillTextSelected: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 12,
  },
});