//editpetprofile.tsx
import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { HomeStackParamList, Pet } from './Home';

type Props = NativeStackScreenProps<HomeStackParamList, 'EditPetProfile'>;

const defaultAvatar = require('../assets/default-profile.png');

export default function EditPetProfile({ route, navigation }: Props) {
  const { pet } = route.params;

  const [name, setName] = useState(pet.name);
  const [breed, setBreed] = useState(pet.breed || ''); // Add breed state
  const [birthday, setBirthday] = useState(pet.birthday || '');
  const [petType, setPetType] = useState(pet.pet_type || '');
  const [size, setSize] = useState(pet.size || '');
  const [petUrl, setPetUrl] = useState(pet.pet_url || ''); // Store the storage path
  const [imageUploading, setImageUploading] = useState(false);

  const [sterilised, setSterilised] = useState(pet.sterilised || false);
  const [transmissibleHealthIssues, setTransmissibleHealthIssues] = useState(pet.transmissible_health_issues || false);
  const [friendlyWithDogs, setFriendlyWithDogs] = useState(pet.friendly_with_dogs || false);
  const [friendlyWithCats, setFriendlyWithCats] = useState(pet.friendly_with_cats || false);
  const [friendlyWithChildren, setFriendlyWithChildren] = useState(pet.friendly_with_children || false);

  const [openType, setOpenType] = useState(false);
  const [openSize, setOpenSize] = useState(false);
  const [saving, setSaving] = useState(false);

  const typeOptions = [
    { label: 'Dog', value: 'Dog' },
    { label: 'Cat', value: 'Cat' },
    { label: 'Rabbit', value: 'Rabbit' },
    { label: 'Bird', value: 'Bird' },
    { label: 'Reptile', value: 'Reptile'},
    { label: 'Fish', value: 'Fish'}
  ];

  const sizeOptions = [
    { label: '1-10kg', value: '1-10kg' },
    { label: '11-20kg', value: '11-20kg' },
    { label: '21-30kg', value: '21-30kg' },
    { label: '31-40kg', value: '31-40kg' },
    { label: '>40kg', value: '>40kg' },
  ];

  // Get pet image URL from Supabase storage
  const getPetImageUrl = (petUrlPath: string | null) => {
    if (!petUrlPath) return null;
    
    const { data } = supabase.storage
      .from('my-pets')
      .getPublicUrl(petUrlPath);
    
    return data.publicUrl;
  };

  // Function to pick image from gallery or camera
  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      
      if (source === 'camera') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permission required', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          Alert.alert('Permission required', 'Gallery permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Function to upload image to Supabase storage
  const uploadImage = async (uri: string) => {
    try {
      setImageUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create a unique filename
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}_${pet.name}_${Date.now()}.${fileExt}`;

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      // Delete old image if exists
      if (petUrl) {
        try {
          await supabase.storage
            .from('my-pets')
            .remove([petUrl]);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('my-pets')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Store the storage path (not the full URL)
      setPetUrl(data.path);
      Alert.alert('Success', 'Image uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  // Function to show image picker options
  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage('camera');
          } else if (buttonIndex === 2) {
            pickImage('gallery');
          } else if (buttonIndex === 3) {
            removePhoto();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
          { text: 'Remove Photo', onPress: removePhoto, style: 'destructive' },
        ]
      );
    }
  };

  // Function to remove photo
  const removePhoto = async () => {
    if (petUrl) {
      try {
        await supabase.storage
          .from('my-pets')
          .remove([petUrl]);
      } catch (error) {
        console.error('Error deleting image from storage:', error);
      }
    }
    setPetUrl('');
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Validate birthday format if provided (YYYY-MM-DD)
        if (birthday && !isValidDate(birthday)) {
          Alert.alert('Error', 'Please enter birthday in YYYY-MM-DD format or leave it empty.');
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from('my_pets')
          .update({
            breed: breed || null, // Add breed to update
            birthday: birthday || null,
            pet_type: petType || null,
            size: size || null,
            pet_url: petUrl || null,
            sterilised,
            transmissible_health_issues: transmissibleHealthIssues,
            friendly_with_dogs: friendlyWithDogs,
            friendly_with_cats: friendlyWithCats,
            friendly_with_children: friendlyWithChildren,
          })
          .eq('id', user.id)
          .eq('name', pet.name);

        if (error) throw error;

        Alert.alert('Success', 'Pet details updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.popToTop();
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error updating pet:', error);
      Alert.alert('Error', 'Failed to update pet details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Validate date format YYYY-MM-DD
  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day &&
           year >= 1900 && year <= new Date().getFullYear();
  };

  // Get image source - either from Supabase URL or default
  const getImageSource = () => {
    if (petUrl) {
      return { uri: getPetImageUrl(petUrl) };
    }
    return defaultAvatar;
  };

  // Set header right button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={onSave}
          style={{ marginRight: 15 }}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    name,
    breed,
    birthday,
    petType,
    size,
    petUrl,
    sterilised,
    transmissibleHealthIssues,
    friendlyWithDogs,
    friendlyWithCats,
    friendlyWithChildren,
    saving,
  ]);

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: '#fef5ec' }}
      contentContainerStyle={styles.container}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      <View style={styles.photoSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={getImageSource()}
            style={styles.avatar}
          />
          {imageUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </View>

        <Text style={styles.petName}>{name}</Text>

        <TouchableOpacity
          style={styles.changePhotoButton}
          onPress={showImagePicker}
          disabled={imageUploading}
        >
          <Text style={[styles.changePhotoText, imageUploading && { opacity: 0.5 }]}>
            {imageUploading ? 'Uploading...' : 'Change Pet Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Pet Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#f0f0f0' }]}
          value={name}
          editable={false}
          selectTextOnFocus={false}
        />
        <Text style={styles.helperText}>Pet name cannot be changed</Text>

        <Text style={styles.label}>Breed</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pet breed"
          value={breed}
          onChangeText={setBreed}
          placeholderTextColor="gray"
        />

        <Text style={styles.label}>Birthday</Text>
        <TextInput
          style={styles.input}
          placeholder="Birthday (YYYY-MM-DD)"
          value={birthday}
          onChangeText={setBirthday}
          placeholderTextColor="gray"
        />
        <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2020-01-15)</Text>

        <Text style={styles.label}>Pet Type</Text>
        <View style={{ zIndex: 9999, width: '100%', position: 'relative' }}>
          <DropDownPicker
            open={openType}
            value={petType}
            items={typeOptions}
            setOpen={setOpenType}
            setValue={setPetType}
            placeholder="Select Pet Type"
            placeholderStyle={{ color: 'gray' }}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            textStyle={{
              color: petType ? 'black' : 'gray',
              fontSize: 16,
            }}
          />
        </View>

        <Text style={styles.label}>Pet Size</Text>
        <View style={{ zIndex: 5000, width: '100%' }}>
          <DropDownPicker
            open={openSize}
            value={size}
            items={sizeOptions}
            setOpen={setOpenSize}
            setValue={setSize}
            placeholder="Select Pet Size"
            placeholderStyle={{ color: 'gray' }}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            listMode="SCROLLVIEW"
            dropDownDirection="BOTTOM"
            textStyle={{
              color: size ? 'black' : 'gray',
              fontSize: 16,
            }}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Sterilised</Text>
          <Switch
            value={sterilised}
            onValueChange={setSterilised}
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sterilised ? 'white' : '#f4f3f4'}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Transmissible Health Issues</Text>
          <Switch
            value={transmissibleHealthIssues}
            onValueChange={setTransmissibleHealthIssues}
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={transmissibleHealthIssues ? 'white' : '#f4f3f4'}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Friendly with Dogs</Text>
          <Switch
            value={friendlyWithDogs}
            onValueChange={setFriendlyWithDogs}
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={friendlyWithDogs ? 'white' : '#f4f3f4'}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Friendly with Cats</Text>
          <Switch
            value={friendlyWithCats}
            onValueChange={setFriendlyWithCats}
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={friendlyWithCats ? 'white' : '#f4f3f4'}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Friendly with Children</Text>
          <Switch
            value={friendlyWithChildren}
            onValueChange={setFriendlyWithChildren}
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={friendlyWithChildren ? 'white' : '#f4f3f4'}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#fef5ec',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 20,
  },

  photoSection: {
    marginTop: 30,
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative'
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000'
  },
  changePhotoButton: {
    marginTop: 5,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#007AFF',
  },
  // Form Container
  formContainer: {
    width: '100%',
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
  },
  helperText: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    marginTop: -10,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  dropdownContainer: {
    borderColor: '#ccc',
  },
  toggleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#844d3e',
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '600',
  },
});