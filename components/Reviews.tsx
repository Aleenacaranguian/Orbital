import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';

const defaultAvatar = require('../assets/default-profile.png');

type ReviewData = {
  id: string;
  created_at: string;
  to_id: string;
  from_id: string;
  description?: string | null;
  stars_int?: number | null;
  reviewer_username?: string;
  reviewer_avatar_url?: string | null;
};

type ProfileData = {
  username: string;
  avatar_url: string | null;
};

type HomeStackParamList = {
  Reviews: { sitterId: string; sitterUsername: string; sitterAvatar: string | null };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'Reviews'>;

const ReviewsScreen = ({ route }: Props) => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const { sitterId, sitterUsername, sitterAvatar } = route.params;

  useEffect(() => {
    fetchReviews();
  }, [sitterId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews with reviewer profile information
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          created_at,
          to_id,
          from_id,
          description,
          stars_int
        `)
        .eq('to_id', sitterId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        Alert.alert('Error', 'Failed to load reviews');
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setReviewCount(0);
        setAverageRating(0);
        setLoading(false);
        return;
      }

      // Fetch profile information for each reviewer
      const fromIds = reviewsData.map(review => review.from_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', fromIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of profile data for quick lookup
      const profilesMap = new Map<string, ProfileData>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, {
          username: profile.username,
          avatar_url: profile.avatar_url
        });
      });

      // Transform the data to include profile information
      const transformedReviews: ReviewData[] = reviewsData.map(review => {
        const profileData = profilesMap.get(review.from_id);
        return {
          id: review.id,
          created_at: review.created_at,
          to_id: review.to_id,
          from_id: review.from_id,
          description: review.description,
          stars_int: review.stars_int,
          reviewer_username: profileData?.username || 'Anonymous',
          reviewer_avatar_url: profileData?.avatar_url || null,
        };
      });

      setReviews(transformedReviews);
      setReviewCount(transformedReviews.length);

      // Calculate average rating
      const validRatings = transformedReviews
        .filter(review => review.stars_int !== null && review.stars_int !== undefined)
        .map(review => review.stars_int as number);

      if (validRatings.length > 0) {
        const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
        setAverageRating(average);
      } else {
        setAverageRating(0);
      }

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return '☆☆☆☆☆';
    
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  const getAvatarUri = (avatarUrl: string | null | undefined) => {
    if (avatarUrl) {
      return { uri: avatarUrl };
    }
    return defaultAvatar;
  };

  const getSitterAvatarUri = () => {
    if (sitterAvatar) {
      return { uri: sitterAvatar };
    }
    return defaultAvatar;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={{ marginTop: 10, color: '#8B0000' }}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.sitterProfileRow}>
        <Image source={getSitterAvatarUri()} style={styles.sitterAvatarRow} />
        <View style={styles.sitterInfoColumn}>
          <Text style={styles.sitterNameRow}>{sitterUsername}</Text>
          <View style={styles.sitterRatingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.sitterRatingText}>{averageRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.sitterReviewCountRow}>{reviewCount} reviews</Text>
        </View>
      </View>

      {reviewCount === 0 ? (
        <View style={styles.noReviewsContainer}>
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          <Text style={styles.noReviewsSubtext}>Reviews will appear here once customers start rating this pet sitter.</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Image 
                source={getAvatarUri(item.reviewer_avatar_url)} 
                style={styles.avatar} 
              />
              <View style={styles.reviewInfo}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.name}>{item.reviewer_username}</Text>
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={styles.stars}>{renderStars(item.stars_int)}</Text>
                <Text style={styles.message}>
                  {item.description || 'No comment provided'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
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
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noReviewsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#844d3e',
    marginBottom: 10,
  },
  noReviewsSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontWeight: '700',
    fontSize: 18,
    color: '#844d3e',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  stars: {
    fontSize: 16,
    color: '#f1c40f',
    marginVertical: 4,
  },
  message: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
  },
});