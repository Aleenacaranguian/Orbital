import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

const hardcodedAvatars = [
  require('../assets/default-profile.png'),
  require('../assets/default-profile.png'),
  require('../assets/default-profile.png'),
];

const hardcodedServiceType = "Boarding";

const listings = Array.from({ length: 10 }).map((_, index) => ({
  id: `${index + 1}`,
  title: `Pet Paradise #${index + 1}`,
  price: 40 + index,
  rating: 4 + (index % 2),
  image: require('../assets/petstogether.png'),
}));

export default function SearchResultsScreen() {
  const { height } = useWindowDimensions();

  const fromDate = "2025-06-15T14:00";
  const toDate = "2025-06-20T12:00";

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SEARCH</Text>

      <View style={[styles.resultsCard, { height: height * 0.8 }]}>
        <View style={styles.rowBetween}>
          <Text style={styles.subHeader}>Search results for</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
          </TouchableOpacity>
        </View>

        {/* Avatars side by side, no scroll */}
        <View style={styles.avatarRow}>
          {hardcodedAvatars.map((src, i) => (
            <Image key={i} source={src} style={styles.avatar} />
          ))}
        </View>

        {/* Service type pill */}
        <View style={styles.tag}>
          <Text style={styles.tagText}>{hardcodedServiceType}</Text>
        </View>

        {/* Dates */}
        <View style={styles.datesWrapper}>
          <Text style={styles.dateText}>
            From: {fromDate.slice(0, 10)} {fromDate.slice(11, 16)}
          </Text>
          <Text style={styles.dateText}>
            To: {toDate.slice(0, 10)} {toDate.slice(11, 16)}
          </Text>
        </View>

        {/* Scrollable list of services */}
        <ScrollView contentContainerStyle={styles.cardScroll}>
          {listings.map((item) => (
            <View key={item.id} style={styles.listingCard}>
              <Image source={item.image} style={styles.listingImage} />
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{item.title}</Text>
                <Text style={styles.listingType}>{hardcodedServiceType}</Text>
                <View style={styles.ratingRow}>
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Text key={i}>⭐</Text>
                  ))}
                </View>
                <TouchableOpacity>
                  <Text style={styles.moreDetails}>More Details →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.price}>${item.price}</Text>
                <Text style={styles.perNight}>per night</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
});