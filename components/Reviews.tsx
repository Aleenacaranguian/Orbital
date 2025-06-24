import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';

const sitterProfile = {
  username: 'Ynaleena23',
  avatar: require('../assets/default-profile.png'),
  rating: 4.5,
  reviewCount: 2,
};

const reviewsData = [
  {
    id: '1',
    reviewerName: 'AliciaT',
    reviewerAvatar: require('../assets/default-profile.png'),
    stars: '★★★★★',
    reviewText: 'Super reassuring! Got photo updates and knew my pup was in good hands.',
  },
  {
    id: '2',
    reviewerName: 'MarcusLee',
    reviewerAvatar: require('../assets/default-profile.png'),
    stars: '★★★★☆',
    reviewText: 'Great service, just wished the visit was a bit longer. My dog loved it!',
  },
];

const ReviewsScreen = () => {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.headerText}>Reviews</Text>
      </View>

      <View style={styles.sitterProfileRow}>
        <Image source={sitterProfile.avatar} style={styles.sitterAvatarRow} />
        <View style={styles.sitterInfoColumn}>
          <Text style={styles.sitterNameRow}>{sitterProfile.username}</Text>
          <View style={styles.sitterRatingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.sitterRatingText}>{sitterProfile.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.sitterReviewCountRow}>{sitterProfile.reviewCount} reviews</Text>
        </View>
      </View>

      <FlatList
        data={reviewsData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Image source={item.reviewerAvatar} style={styles.avatar} />
            <View style={styles.reviewInfo}>
              <Text style={styles.name}>{item.reviewerName}</Text>
              <Text style={styles.stars}>{item.stars}</Text>
              <Text style={styles.message}>{item.reviewText}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default ReviewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff6e9',
    paddingTop: 30,
  },
  headerText: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B0000',
    textAlign: 'center',
  },
  sitterProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 10,
    marginTop: 10,
  },
  sitterAvatarRow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#eee',
  },
  sitterInfoColumn: {
    marginLeft: 16,
    justifyContent: 'center',
  },
  sitterNameRow: {
    fontWeight: '700',
    fontSize: 26,
    color: '#844d3e',
    marginBottom: 6,
  },
  sitterRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  star: {
    fontSize: 22,
    marginRight: 6,
    color: '#f1c40f',
  },
  sitterRatingText: {
    fontSize: 18,
    fontWeight: '500',
  },
  sitterReviewCountRow: {
    fontSize: 16,
    color: '#555',
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  reviewInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 20,
    color: '#844d3e',
    marginBottom: 4,
  },
  stars: {
    fontSize: 18,
    color: '#f1c40f',
    marginVertical: 4,
  },
  message: {
    fontSize: 15,
    color: '#555',
  },
});
