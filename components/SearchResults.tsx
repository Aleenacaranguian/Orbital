import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackParamList, Pet, Service } from './Search';
import { supabase } from '../lib/supabase';


type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResults'>;

//Pet sitter attributes 
type PetSitter = {
  id: string;
  about_me?: string;
  years_of_experience?: string;
  other_pet_related_skills?: string;
  owns_pets?: boolean;
  volunteers_with_animals?: boolean;
  works_with_animals?: boolean;
  average_stars?: number;
  created_at?: string;
};

// profile attributes 
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

// Custom slider component
interface CustomSliderProps {
  minimumValue: number;
  maximumValue: number;
  value: number;
  onValueChange: (value: number) => void;
  step?: number;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ 
  minimumValue, 
  maximumValue, 
  value, 
  onValueChange, 
  step = 1 
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  
  const handlePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const percentage = locationX / sliderWidth;
    const newValue = Math.round(
      minimumValue + (percentage * (maximumValue - minimumValue)) / step
    ) * step;
    const clampedValue = Math.max(minimumValue, Math.min(maximumValue, newValue));
    onValueChange(clampedValue);
  };

  const thumbPosition = ((value - minimumValue) / (maximumValue - minimumValue)) * sliderWidth;

  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity
        style={styles.sliderTrack}
        onPress={handlePress}
        onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        activeOpacity={1}
      >
        <View style={[styles.sliderFill, { width: thumbPosition }]} />
        <View style={[styles.sliderThumb, { left: thumbPosition - 10 }]} />
      </TouchableOpacity>
    </View>
  );
};

export default function SearchResultsScreen({ route }: Props) {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();

  // Get search parameters from route
  const { selectedPets, selectedService, fromDate, toDate } = route.params;

  const PRICE_MIN = 15;
  const PRICE_MAX = 100;

  const [showFilter, setShowFilter] = useState(false);
  const [priceCap, setPriceCap] = useState(PRICE_MAX);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [filterOpened, setFilterOpened] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [selectedService, selectedPets]);

  // Fixed fetchServices function
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to search for services');
        return;
      }
      setCurrentUserId(user.id);

      // Build query for services
      let query = supabase
        .from('services')
        .select('*')
        .neq('id', user.id); // Exclude current user's services

      // Filter by service type if selected
      if (selectedService) {
        query = query.eq('service_type', selectedService);
      }

      // Filter by pet type if pets are selected
      if (selectedPets && selectedPets.length > 0) {
        const petTypes = [...new Set(selectedPets.map(pet => pet.pet_type).filter(Boolean))];
        if (petTypes.length > 0) {
          query = query.in('pet_type', petTypes);
        }
      }

      const { data: servicesData, error } = await query;
      if (error) {
        console.error('Error fetching services:', error);
        Alert.alert('Error', 'Failed to load services');
        return;
      }

    
      const userIds = servicesData?.map(service => service.id) || [];
      
      // Fetch profiles for all service providers
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const { data: petSittersData, error: petSittersError } = await supabase
        .from('pet_sitter')
        .select('*')
        .in('id', userIds);

      if (petSittersError) {
        console.error('Error fetching pet sitters:', petSittersError);
      }

      // Reviews query using to_id 
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('to_id, stars_int')
        .in('to_id', userIds);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);
      const petSittersMap = new Map(petSittersData?.map(sitter => [sitter.id, sitter]) || []);
      const reviewsMap = new Map<string, number[]>();
      
      // Group reviews by to_id 
      reviewsData?.forEach(review => {
        if (!reviewsMap.has(review.to_id)) {
          reviewsMap.set(review.to_id, []);
        }
        if (review.stars_int) {
          reviewsMap.get(review.to_id)?.push(review.stars_int);
        }
      });

   
      const transformedServices: Service[] = (servicesData || []).map(service => {
       
        const profile = profilesMap.get(service.id);
        
    
        const petSitter = petSittersMap.get(service.id);
        
        // Get reviews data for this sitter
        const userReviews = reviewsMap.get(service.id) || [];
        const averageRating = userReviews.length > 0 
          ? userReviews.reduce((sum, stars) => sum + stars, 0) / userReviews.length 
          : petSitter?.average_stars || 0;

        return {
          service_id: service.service_id,
          id: service.id,
          service_type: service.service_type,
          service_url: service.service_url,
          created_at: service.created_at,
          name_of_service: service.name_of_service,
          price: service.price,
          pet_preferences: service.pet_preferences,
          pet_type: service.pet_type,
          housing_type: service.housing_type,
          service_details: service.service_details,
          no_other_dogs_present: service.no_other_dogs_present,
          no_other_cats_present: service.no_other_cats_present,
          no_children_present: service.no_children_present,
          no_adults_present: service.no_adults_present,
          sitter_present_throughout_service: service.sitter_present_throughout_service,
          accepts_unsterilised_pets: service.accepts_unsterilised_pets,
          accepts_pets_with_transmissible_health_issues: service.accepts_pets_with_transmissible_health_issues,
          sitter_name: profile?.username || 'Unknown Sitter',
          sitter_rating: averageRating,
          sitter_image: profile?.avatar_url, 
        };
      });

      setServices(transformedServices);
    } catch (error) {
      console.error('Error in fetchServices:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const priceFilterActive = priceCap > PRICE_MIN && priceCap < PRICE_MAX;
  const ratingFilterActive = minRating !== null;
  const filtersApplied = (priceFilterActive ? 1 : 0) + (ratingFilterActive ? 1 : 0);
  const showBadge = filterOpened && filtersApplied > 0;

  const filteredServices = services.filter((service) => {
    const servicePrice = parseFloat(service.price || '0');
    const passPrice = priceFilterActive ? servicePrice <= priceCap : true;
    const passRating = ratingFilterActive ? (service.sitter_rating || 0) >= (minRating ?? 0) : true;
    return passPrice && passRating;
  });

  function openFilter() {
    setShowFilter(true);
    setFilterOpened(true);
  }

  function resetFilters() {
    setPriceCap(PRICE_MAX);
    setMinRating(null);
  }

  function closeFilter() {
    setShowFilter(false);
  }

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  // Get pet image URI 
  const getPetImageUri = (pet: Pet) => {
    if (pet.pet_url) {
      if (pet.pet_url.startsWith('http')) {
        return { uri: pet.pet_url };
      }
      const { data } = supabase.storage
        .from('my-pets')
        .getPublicUrl(pet.pet_url);
      return { uri: data.publicUrl };
    }
    return require('../assets/default-profile.png');
  };

  // Get service image URI - Fixed to use correct fallback logic
  const getServiceImageUri = (service: Service) => {
    if (service.service_url) {
      if (service.service_url.startsWith('http')) {
        return { uri: service.service_url };
      }
      const { data } = supabase.storage
        .from('services')
        .getPublicUrl(service.service_url);
      return { uri: data.publicUrl };
    }
    
    // Fallback to sitter avatar if no service image
    if (service.sitter_image) {
      if (service.sitter_image.startsWith('http')) {
        return { uri: service.sitter_image };
      }
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(service.sitter_image);
      return { uri: data.publicUrl };
    }
    
    // Final fallback to default pet sitter image
    return require('../assets/petsitter.png');
  };

  // Star rating with emoji
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Text key={i} style={styles.goldStar}>★</Text>);
    }
    
    if (hasHalfStar) {
      stars.push(<Text key="half" style={styles.goldStar}>☆</Text>);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={[styles.resultsCard, { flex: 1 }]}>
        <View style={styles.rowBetween}>
          <Text style={styles.subHeader}>Search results for</Text>
          <TouchableOpacity style={styles.filterButton} onPress={openFilter}>
            <Text style={styles.filterText}>Filter</Text>
            {showBadge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filtersApplied}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          {selectedPets.slice(0, 3).map((pet) => (
            <Image key={pet.id} source={getPetImageUri(pet)} style={styles.avatar} />
          ))}
          {selectedPets.length > 3 && (
            <View style={styles.moreAvatars}>
              <Text style={styles.moreText}>+{selectedPets.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.tag}>
          <Text style={styles.tagText}>{selectedService}</Text>
        </View>

        <View style={styles.datesWrapper}>
          <Text style={styles.dateText}>
            From: {formatDate(fromDate)}
          </Text>
          <Text style={styles.dateText}>
            To: {formatDate(toDate)}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <View key={service.service_id} style={styles.listingCard}>
                <Image source={getServiceImageUri(service)} style={styles.listingImage} />
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle}>{service.name_of_service || 'Untitled Service'}</Text>
                  <Text style={styles.sitterName}>by {service.sitter_name}</Text>
                  <Text style={styles.listingType}>{service.service_type}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starEmoji}>⭐</Text>
                    <Text style={styles.ratingNumber}>{service.sitter_rating?.toFixed(1) || '0.0'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('ViewServiceAsOwner', { 
                      service: service,
                      selectedPets: selectedPets,
                      fromDate: fromDate,
                      toDate: toDate
                    })}
                  >
                    <Text style={styles.moreDetails}>More Details →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.price}>${service.price || '0'}</Text>
                  <Text style={styles.perHour}>per hour</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {services.length === 0 
                  ? "No services found for your criteria. Try adjusting your search parameters."
                  : "No results match your filters. Try adjusting the price or rating filters."
                }
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {showFilter && (
        <Modal transparent animationType="slide" visible={showFilter}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Apply Filters</Text>
                <TouchableOpacity onPress={() => { resetFilters(); closeFilter(); }}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Max Price per Hour: ${priceCap}</Text>
              <CustomSlider
                minimumValue={PRICE_MIN}
                maximumValue={PRICE_MAX}
                step={1}
                value={priceCap}
                onValueChange={setPriceCap}
              />

              <Text style={styles.modalLabel}>Minimum Rating</Text>
              <View style={styles.starRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setMinRating(minRating === i + 1 ? null : i + 1)}>
                    <Text style={[styles.star, i < (minRating ?? 0) ? styles.filledStar : styles.emptyStar]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.applyButton} onPress={closeFilter}>
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
  },

  resultsCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
    flexGrow: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#999',
    marginRight: 6,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  moreAvatars: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  tag: {
    backgroundColor: '#844d3e',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tagText: {
    fontSize: 14,
    color: 'white',
  },
  datesWrapper: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingRight: 12,
  },
  listingImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    margin: 12,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  listingInfo: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 10,
    justifyContent: 'space-between',
  },
  listingTitle: {
    color: '#8B0000',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 2,
    flexShrink: 1,
  },
  sitterName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  listingType: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  starEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  goldStar: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 1,
  },
  ratingNumber: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  moreDetails: {
    backgroundColor: '#f5c28b',
    color: 'black',
    fontSize: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
  },
  priceTag: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 12,
  },
  price: {
    color: 'red',
    fontSize: 22,
    fontWeight: 'bold',
  },
  perHour: {
    fontSize: 12,
    color: '#555',
  },
  noResultsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#888',
    paddingHorizontal: 8,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  // Custom Slider Styles
  sliderContainer: {
    marginVertical: 10,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    position: 'relative',
    marginVertical: 15,
  },
  sliderFill: {
    height: 6,
    backgroundColor: '#FFB347',
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#FF7F50',
    borderRadius: 10,
    position: 'absolute',
    top: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    fontSize: 30,
    marginRight: 6,
  },
  filledStar: {
    color: '#FFD700',
  },
  emptyStar: {
    color: 'black',
  },
  applyButton: {
    backgroundColor: '#FF7F50',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});