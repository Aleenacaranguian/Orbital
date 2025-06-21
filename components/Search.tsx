import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  useWindowDimensions,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SearchResults from './SearchResults';
import ViewServiceAsOwner from './ViewServiceAsOwner';

// Define the Service type to match your other components
type Service = {
  id: string;
  title: string;
  type: string;
  imageUri?: string | null;
  ratePerHour?: string;
  petPreferences?: string;
  housingType?: string;
  details?: string;
  noOtherDogPresent?: boolean;
  noOtherCatsPresent?: boolean;
  noChildren?: boolean;
  noAdults?: boolean;
  sitterPresentThroughout?: boolean;
  acceptsUnsterilisedPets?: boolean;
  acceptsTransmissiblePets?: boolean;
};

// Navigation types for the Search stack
export type SearchStackParamList = {
  SearchScreen: undefined;
  SearchResults: {
    selectedPetIds: string[];
    selectedService: string | null;
    fromDate: string;
    toDate: string;
  };
  ViewServiceAsOwner: { service: Service };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

type SearchScreenNavigationProp = StackNavigationProp<SearchStackParamList, 'SearchResults'>;

const petAvatars = [
  { id: '1', source: require('../assets/default-profile.png') },
  { id: '2', source: require('../assets/default-profile.png') },
  { id: '3', source: require('../assets/default-profile.png') },
];

const serviceTypes = ['House Visit', 'House Sitting', 'Dog Walking', 'Daycare', 'Boarding', 'Grooming', 'Training', 'Transport'];

function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { height } = useWindowDimensions();

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  function togglePetSelection(petId: string) {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    );
  }

  function handleSearch() {
    navigation.navigate('SearchResults', {
      selectedPetIds,
      selectedService,
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SEARCH</Text>

      <View style={[styles.card, { height: height * 0.8 }]}>
        <ScrollView contentContainerStyle={styles.cardScroll}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.subLabel}>Who</Text>
              <Text style={styles.helperText}>Select One or More</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
            {petAvatars.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                onPress={() => togglePetSelection(pet.id)}
                style={[
                  styles.avatarWrapper,
                  selectedPetIds.includes(pet.id) && styles.avatarSelected,
                ]}
              >
                <Image source={pet.source} style={styles.avatar} />
              </TouchableOpacity>
            ))}
          </ScrollView>

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

// Main Search component with Stack Navigator (like your Home component)
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
    marginRight: 10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#8B0000',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 30,
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