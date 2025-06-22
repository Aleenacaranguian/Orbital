// mypets.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, StyleSheet, Alert, TextInput, Modal, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { HomeStackParamList, Pet } from './Home';

// local fallback image
const defaultAvatar = require('../assets/default-profile.png');

type MyPetsScreenProp = NativeStackNavigationProp<HomeStackParamList, 'MyPets'>;

export default function MyPets() {
  const navigation = useNavigation<MyPetsScreenProp>();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetImage, setNewPetImage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // get public URL of the image stored in Supabase
  const getPetImageUrl = (petUrl: string | null) => {
    if (!petUrl) return null;
    const { data } = supabase.storage.from('my-pets').getPublicUrl(petUrl);
    return data?.publicUrl || null;
  };

  // upload image to Supabase storage
  const uploadPetImage = async (imageUri: string, petName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const fileExt = imageUri.split('.').pop();
      const fileName = `${user.id}_${petName}_${Date.now()}.${fileExt}`;
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('my-pets')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // fetch pets from Supabase
  const fetchPets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('my_pets')
          .select('*')
          .eq('id', user.id);

        if (error) throw error;

        const transformedPets: Pet[] = (data || []).map(pet => ({
          id: pet.id,
          name: pet.name,
          birthday: pet.birthday,
          pet_type: pet.pet_type,
          size: pet.size,
          sterilised: pet.sterilised,
          transmissible_health_issues: pet.transmissible_health_issues,
          friendly_with_dogs: pet.friendly_with_dogs,
          friendly_with_cats: pet.friendly_with_cats,
          friendly_with_children: pet.friendly_with_children,
          pet_url: pet.pet_url
        }));

        setPets(transformedPets);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      Alert.alert('Error', 'Failed to load pets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // add pet entry to Supabase
  const handleAddPet = async () => {
    if (!newPetName.trim()) {
      Alert.alert('Error', 'Please enter a pet name.');
      return;
    }

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingPet } = await supabase
          .from('my_pets')
          .select('name')
          .eq('id', user.id)
          .eq('name', newPetName.trim())
          .single();

        if (existingPet) {
          Alert.alert('Error', 'A pet with this name already exists.');
          setAdding(false);
          return;
        }

        let petUrl = null;
        if (newPetImage) {
          try {
            petUrl = await uploadPetImage(newPetImage, newPetName.trim());
          } catch (error) {
            console.error('Image upload error:', error);
            Alert.alert('Warning', 'Pet added but image upload failed.');
          }
        }

        const { error } = await supabase
          .from('my_pets')
          .insert({
            id: user.id,
            name: newPetName.trim(),
            birthday: null,
            pet_type: null,
            size: null,
            sterilised: false,
            transmissible_health_issues: false,
            friendly_with_dogs: false,
            friendly_with_cats: false,
            friendly_with_children: false,
            pet_url: petUrl
          });

        if (error) throw error;

        await fetchPets();
        setNewPetName('');
        setNewPetImage(null);
        setModalVisible(false);
        Alert.alert('Success', 'Pet added successfully!');
      }
    } catch (error) {
      console.error('Add pet error:', error);
      Alert.alert('Error', 'Failed to add pet.');
    } finally {
      setAdding(false);
    }
  };

  // delete pet and image from Supabase
  const handleDeletePet = async (petName: string) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${petName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();

              if (user) {
                const { data: petData } = await supabase
                  .from('my_pets')
                  .select('pet_url')
                  .eq('id', user.id)
                  .eq('name', petName)
                  .single();

                const { error } = await supabase
                  .from('my_pets')
                  .delete()
                  .eq('id', user.id)
                  .eq('name', petName);

                if (error) throw error;

                if (petData?.pet_url) {
                  await supabase.storage
                    .from('my-pets')
                    .remove([petData.pet_url]);
                }

                await fetchPets();
                Alert.alert('Success', 'Pet deleted.');
              }
            } catch (error) {
              console.error('Delete pet error:', error);
              Alert.alert('Error', 'Delete failed.');
            }
          }
        }
      ]
    );
  };

  // pick image from gallery
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

  useEffect(() => {
    fetchPets();

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const channel = supabase.channel('pets_channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'my_pets',
              filter: `id=eq.${user.id}`
            },
            fetchPets
          )
          .subscribe();

        return () => supabase.removeChannel(channel);
      }
    };

    const unsubscribe = setupSubscription();
    return () => {
      unsubscribe?.then(cleanup => cleanup && cleanup());
    };
  }, []);

  // show each pet card
  const renderPetItem = ({ item }: { item: Pet }) => {
    const imageSource =
      item.pet_url && getPetImageUrl(item.pet_url)
        ? { uri: getPetImageUrl(item.pet_url) }
        : defaultAvatar;

    return (
      <TouchableOpacity
        style={styles.petContainer}
        onPress={() => navigation.navigate('ViewPetProfile', { pet: item })}
        onLongPress={() => handleDeletePet(item.name)}
      >
        <Image source={imageSource} style={styles.avatar} />
        <View style={styles.petInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.tapInstruction}>Tap to view • Long press to delete</Text>
          {item.pet_type && <Text style={styles.petType}>{item.pet_type}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading your pets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Pets</Text>

      {pets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pets added yet 🐶</Text>
          <Text style={styles.emptySubtext}>Add your first pet to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPetItem}
          keyExtractor={(item) => `${item.id}-${item.name}`}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addText}>＋ Add Pet Profile</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a New Pet</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              value={newPetName}
              onChangeText={setNewPetName}
              maxLength={50}
            />
            <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
              <Image
                source={newPetImage ? { uri: newPetImage } : defaultAvatar}
                style={styles.avatar}
              />
              <Text style={styles.pickImageText}>Tap to upload image (optional)</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleAddPet}
                disabled={adding}
                style={[styles.modalButtonContainer, adding && styles.disabledButton]}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButton}>Add</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewPetName('');
                  setNewPetImage(null);
                }}
                disabled={adding}
              >
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
    paddingTop: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fef5ec',
    flex: 1,
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#844d3e',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 14,
  },
  petInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B0000',
    marginBottom: 4,
  },
  tapInstruction: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  petType: {
    color: '#844d3e',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  addButton: {
    marginTop: 20,
    alignItems: 'flex-start',
    paddingBottom: 20,
  },
  addText: {
    fontSize: 16,
    color: 'red',
    fontWeight: '600',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pickImageText: {
    color: 'gray',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  modalButtonContainer: {
    backgroundColor: '#C21807',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '600',
    color: 'red',
  },
});

