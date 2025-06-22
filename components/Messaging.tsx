import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const mockChats = [
  {
    id: '1',
    name: 'SimonTay_48',
    message: 'Hi Aleena!...',
    avatar: require('../assets/default-profile.png'),
  },
  {
    id: '2',
    name: 'AliciaT',
    message: 'Thanks for...',
    avatar: require('../assets/default-profile.png'),
  },
  {
    id: '3',
    name: 'MarcusLee',
    message: 'It was a pleasure...',
    avatar: require('../assets/default-profile.png'),
  },
];

export default function ChatListScreen() {
  const navigation = useNavigation<any>(); 

  const handlePress = (chat: any) => {
    navigation.navigate('MessageSitter', {
      sitterUsername: chat.name,
      sitterAvatar: chat.avatar,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CHATS</Text>

      <View style={[styles.resultsCard, { flex: 1 }]}>
        <FlatList
          data={mockChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatItem} onPress={() => handlePress(item)}>
              <Image source={item.avatar} style={styles.avatar} />
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.message}>{item.message}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
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
  resultsCard: {
    width: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16, 
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 24,
    marginRight: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  message: {
    color: '#666',
    fontSize: 14,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f6e7d8',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  icon: {
    fontSize: 24,
  },
});
