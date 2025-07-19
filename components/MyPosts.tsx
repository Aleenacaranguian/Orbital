import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const MyPostsScreen = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'comments'>('all');

  const renderPost = () => (
    <TouchableOpacity style={styles.postCard}>
      <View style={styles.subCard}>
        <View style={styles.userRow}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=12' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>FionaJenner</Text>
            <Text style={styles.timestamp}>10 hours ago</Text>
          </View>
        </View>
        <Text style={styles.postTitle}>How to care for goldfish?</Text>
        <Text style={styles.postBody}>
          Just got a goldfish from a game at a festival. No idea how to care for it. 
          As of now, I just filled up a bowl aquarium with tap water and fed it some food.
        </Text>
        <View style={styles.iconRow}>
          <Text style={styles.iconText}>❤️ 5</Text>
          <Text style={styles.iconText}>💬 2</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderComment = () => (
    <TouchableOpacity style={styles.postCard}>
      <View style={styles.subCard}>
        <View style={styles.userRow}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=14' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.username}>AudreyGoh</Text>
            <Text style={styles.timestamp}>5 hours ago</Text>
          </View>
        </View>
        <Text style={styles.postBody}>
          I recommend getting a proper tank with a filter. Tap water needs to be treated with a dechlorinator!
        </Text>
        <View style={styles.iconRow}>
          <Text style={styles.iconText}>❤️ 3</Text>
          <Text style={styles.iconText}>💬 2</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return renderPost();
      case 'comments':
        return renderComment();
      default:
        return (
          <>
            {renderPost()}
            {renderComment()}
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Posts & Comments</Text>

      <View style={styles.subCard}>
        <View style={styles.tabs}>
          {['all', 'posts', 'comments'].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTab,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.postsContainer}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
};

export default MyPostsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8B0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
  tabText: {
    fontSize: 16,
    color: '#4A2C2A',
  },
  activeTab: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  postsContainer: {
    flexGrow: 1,
  },
  postCard: {
    marginBottom: 20,
  },
  subCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,         
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  postTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginVertical: 4,
    color: '#4A2C2A',
  },
  postBody: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  iconText: {
    fontSize: 14,
  },
});
