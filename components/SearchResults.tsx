import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackParamList } from './Search';

// Props type for this screen
type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResults'>;

// Custom Slider Component
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

const hardcodedAvatars = [
  require('../assets/default-profile.png'),
  require('../assets/default-profile.png'),
  require('../assets/default-profile.png'),
];

const hardcodedServiceType = 'Boarding';

const listings = Array.from({ length: 10 }).map((_, index) => ({
  id: `${index + 1}`,
  title: `Pet Paradise #${index + 1}`,
  price: 40 + index,
  rating: 4 + (index % 2),
  image: require('../assets/petstogether.png'),
  type: 'Boarding',
  imageUri: null,
  ratePerHour: `$${40 + index}`,
  petPreferences: 'All pets welcome',
  housingType: 'Apartment',
  details: 'Professional pet care service with years of experience.',
  noOtherDogPresent: false,
  noOtherCatsPresent: false,
  noChildren: false,
  noAdults: false,
  sitterPresentThroughout: true,
  acceptsUnsterilisedPets: true,
  acceptsTransmissiblePets: false,
}));

export default function SearchResultsScreen({ route }: Props) {
  const navigation = useNavigation();
  const { height } = useWindowDimensions();

  // Get search parameters from route
  const { selectedPetIds, selectedService, fromDate, toDate } = route.params;

  const PRICE_MIN = 15;
  const PRICE_MAX = 80;

  const [showFilter, setShowFilter] = useState(false);
  const [priceCap, setPriceCap] = useState(PRICE_MAX);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [filterOpened, setFilterOpened] = useState(false);

  const priceFilterActive = priceCap > PRICE_MIN && priceCap < PRICE_MAX;
  const ratingFilterActive = minRating !== null;
  const filtersApplied = (priceFilterActive ? 1 : 0) + (ratingFilterActive ? 1 : 0);
  const showBadge = filterOpened && filtersApplied > 0;

  const filteredListings = listings.filter((item) => {
    const passPrice = priceFilterActive ? item.price <= priceCap : true;
    const passRating = ratingFilterActive ? item.rating >= (minRating ?? 0) : true;
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SEARCH</Text>

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
          {hardcodedAvatars.map((src, i) => (
            <Image key={i} source={src} style={styles.avatar} />
          ))}
        </View>

        <View style={styles.tag}>
          <Text style={styles.tagText}>{selectedService || hardcodedServiceType}</Text>
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
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => (
              <View key={item.id} style={styles.listingCard}>
                <Image source={item.image} style={styles.listingImage} />
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle}>{item.title}</Text>
                  <Text style={styles.listingType}>{selectedService || hardcodedServiceType}</Text>
                  <View style={styles.ratingRow}>
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Text key={i} style={styles.goldStar}>★</Text>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('ViewServiceAsOwner', { service: item })}
                  >
                    <Text style={styles.moreDetails}>More Details →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.priceTag}>
                  <Text style={styles.price}>${item.price}</Text>
                  <Text style={styles.perNight}>per night</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noResultsText}>No results match your filters.</Text>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
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

              <Text style={styles.modalLabel}>Max Price: ${priceCap}</Text>
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
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 20,
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
    marginRight: 8,
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
  cardScroll: {
    paddingBottom: 40,
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
    height: 100,
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
    fontSize: 20,
    marginBottom: 4,
    flexShrink: 1,
  },
  listingType: {
    fontSize: 12,
    color: '#555',
  },
  ratingRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  goldStar: {
    color: '#FFD700',
    fontSize: 18,
    marginRight: 2,
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
    fontSize: 25,
    fontWeight: 'bold',
  },
  perNight: {
    fontSize: 12,
    color: '#555',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
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