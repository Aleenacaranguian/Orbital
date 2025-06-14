import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, StyleSheet, Alert, TextInput, Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const defaultAvatar = require('../assets/default-profile.png');

type Pet = {
  id: string;
  name: string;
  imageUri: string | null;
};

type HomeStackParamList = {
  HomeMain: undefined;
  EditProfile: undefined;
  MyPets: undefined;
  ViewPetProfile: { pet: Pet };
  MyPetSitterProfile: undefined;
  MyPosts: undefined;
};

type MyPetsScreenProp = NativeStackNavigationProp<HomeStackParamList, 'MyPets'>;

export default function MyPets() {
  const navigation = useNavigation<MyPetsScreenProp>();

  const [pets, setPets] = useState<Pet[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetImage, setNewPetImage] = useState<string | null>(null);

  useEffect(() => {
    const loadPets = async () => {
      const stored = await AsyncStorage.getItem('pets');
      if (stored) {
        setPets(JSON.parse(stored));
      }
    };
    loadPets();
  }, []);

  const savePets = async (updated: Pet[]) => {
    await AsyncStorage.setItem('pets', JSON.stringify(updated));
    setPets(updated);
  };

  const handleAddPet = () => {
    if (!newPetName.trim()) {
      Alert.alert('Please enter a pet name.');
      return;
    }

    const newPet: Pet = {
      id: Date.now().toString(),
      name: newPetName.trim(),
      imageUri: newPetImage,
    };

    const updated = [...pets, newPet];
    savePets(updated);

    setNewPetName('');
    setNewPetImage(null);
    setModalVisible(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setNewPetImage(result.assets[0].uri);
    }
  };

  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.petContainer}
      onPress={() => navigation.navigate('ViewPetProfile', { pet: item })}
    >
      <Image
        source={item.imageUri ? { uri: item.imageUri } : defaultAvatar}
        style={styles.avatar}
      />
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.tapInstruction}>View Profile</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Pets</Text>

      {pets.length === 0 ? (
        <Text style={{ alignSelf: 'center', marginBottom: 20, color: 'gray' }}>
          No pets added yet 🐶
        </Text>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetItem}
          keyExtractor={(item) => item.id}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addText}>＋ Add Pet Profile</Text>
      </TouchableOpacity>

      {/* Modal to add a new pet */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a New Pet</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              value={newPetName}
              onChangeText={setNewPetName}
            />
            <TouchableOpacity onPress={pickImage}>
              <Image
                source={newPetImage ? { uri: newPetImage } : defaultAvatar}
                style={styles.avatar}
              />
              <Text style={styles.pickImageText}>Tap to upload image</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleAddPet}>
                <Text style={styles.modalButton}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalButton, { color: 'gray' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fef5ec',
    flex: 1,
  },
  header: {
    fontSize: 35,
    fontWeight: '600',
    alignSelf: 'center',
    marginBottom: 40,
    color: '#844d3e',
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 14,
  },
  name: {
    fontSize: 25,
    fontWeight: '600',
    color: '#8B0000',
  },
  tapInstruction: {
    color: 'black',
    fontSize: 14,
  },
  addButton: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  addText: {
    fontSize: 16,
    color: 'red',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  pickImageText: {
    color: 'gray',
    marginTop: 5,
    textAlign: 'center',
  },
  modalButtons: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
    color: 'red',
  },
});
