// EditPetScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { uploadPetImageToSupabase, updatePetInSupabase } from '../supabase/pets';
import { defaultAvatar } from '../constants';

export default function EditPetScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const existingPet = route.params?.pet;

  const [name, setName] = useState(existingPet?.name || '');
  const [imageUrl, setImageUrl] = useState<string | null>(existingPet?.image_url || null);
  const [imageFile, setImageFile] = useState<any>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageFile(result.assets[0]);
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Name is required!');

    let finalUrl = imageUrl;
    if (imageFile) {
      const uploadedUrl = await uploadPetImageToSupabase(imageFile, existingPet?.id);
      if (uploadedUrl) finalUrl = uploadedUrl;
    }

    const updatedPet = {
      id: existingPet?.id || Date.now().toString(),
      name: name.trim(),
      image_url: finalUrl,
    };

    await updatePetInSupabase(updatedPet);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={imageUrl ? { uri: imageUrl } : defaultAvatar}
          style={styles.avatar}
        />
        <Text style={styles.tapToEdit}>Tap Here to Edit Profile</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, backgroundColor: '#fef5ec', flex: 1 },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center' },
  tapToEdit: { color: 'red', textAlign: 'center', marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    marginTop: 20, padding: 12, borderRadius: 10
  },
  saveButton: {
    marginTop: 20, backgroundColor: '#d9534f',
    padding: 12, borderRadius: 10, alignItems: 'center'
  },
  saveText: { color: 'white', fontWeight: 'bold' },
});
