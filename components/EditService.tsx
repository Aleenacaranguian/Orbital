//editservice.tsx
import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

type Service = {
  id: string;
  service_type: string;
  service_url?: string | null;
  created_at?: string;
  // Extended fields for the UI
  name_of_service?: string;
  price?: string;
  pet_preferences?: string;
  housing_type?: string;
  service_details?: string;
  accepts_pets_with_transmissible_health_issues?: boolean;
  accepts_unsterilised_pets?: boolean;
  sitter_present_throughout_service?: boolean;
  no_adults_present?: boolean;
  no_children_present?: boolean;
  no_other_dogs_present?: boolean;
  no_other_cats_present?: boolean;
};

type HomeStackParamList = {
  EditService: { service: Service };
  ProfileScreen: { updatedService?: Service; timestamp?: number };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'EditService'>;

const defaultServiceImage = require('../assets/petsitter.png');

export default function EditServiceScreen({ route, navigation }: Props) {
  const { service } = route.params;
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Basic fields
  const [nameOfService, setNameOfService] = useState(service.name_of_service || '');
  const [price, setPrice] = useState(service.price || '');
  const [petPreferences, setPetPreferences] = useState(service.pet_preferences || '');
  const [serviceDetails, setServiceDetails] = useState(service.service_details || '');
  const [serviceImageUrl, setServiceImageUrl] = useState<string | null>(null);

  // Service Type dropdown
  const [openType, setOpenType] = useState(false);
  const [serviceType, setServiceType] = useState(service.service_type);
  const typeOptions = [
    { label: 'House visit', value: 'House visit' },
    { label: 'House sitting', value: 'House sitting' },
    { label: 'Dog walking', value: 'Dog walking' },
    { label: 'Daycare', value: 'Daycare' },
    { label: 'Boarding', value: 'Boarding' },
    { label: 'Grooming', value: 'Grooming' },
    { label: 'Transport', value: 'Transport' },
    { label: 'Training', value: 'Training' }
  ];

  // Service Environment toggles - fixed field names to match database schema
  const [noOtherDogsPresent, setNoOtherDogsPresent] = useState(service.no_other_dogs_present || false);
  const [noOtherCatsPresent, setNoOtherCatsPresent] = useState(service.no_other_cats_present || false);
  const [noChildren, setNoChildren] = useState(service.no_children_present || false);
  const [noAdults, setNoAdults] = useState(service.no_adults_present || false);
  const [sitterPresentThroughout, setSitterPresentThroughout] = useState(service.sitter_present_throughout_service || false);
  const [acceptsUnsterilisedPets, setAcceptsUnsterilisedPets] = useState(service.accepts_unsterilised_pets || false);
  const [acceptsTransmissiblePets, setAcceptsTransmissiblePets] = useState(service.accepts_pets_with_transmissible_health_issues || false);

  // Housing Type toggles (only one can be ON at once)
  const housingTypes = [
    'Apartment',
    'HDB',
    'Landed property with backyard',
    'Landed property without backyard',
    'NA',
  ];
  const [housingType, setHousingType] = useState(service.housing_type || 'NA');

  // Load service image on component mount
  useEffect(() => {
    if (service.service_url) {
      const { data: imageData } = supabase.storage
        .from('services')
        .getPublicUrl(service.service_url);
      
      setServiceImageUrl(imageData.publicUrl);
    }
  }, [service.service_url]);

  // For housing toggles: turn off all others when one is selected
  function toggleHousingType(selectedType: string) {
    if (housingType === selectedType) {
      setHousingType('NA');
    } else {
      setHousingType(selectedType);
    }
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setImageLoading(false);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create file name - using service id and name_of_service for uniqueness
      const fileExt = imageUri.split('.').pop();
      const fileName = `${service.id}_${nameOfService || 'service'}_${Date.now()}.${fileExt}`;

      // Convert uri to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('services')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // FIXED: Update service record with both id and name_of_service
      const { error: updateError } = await supabase
        .from('services')
        .update({ service_url: fileName })
        .eq('id', service.id)
        .eq('name_of_service', service.name_of_service);

      if (updateError) throw updateError;

      // Update local state
      const { data: imageData } = supabase.storage
        .from('services')
        .getPublicUrl(fileName);
      
      setServiceImageUrl(imageData.publicUrl);
      
      Alert.alert('Success', 'Service image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const saveService = async () => {
    try {
      setLoading(true);
  
      // Validate required fields
      if (!nameOfService.trim()) {
        Alert.alert('Error', 'Service name is required');
        return;
      }
  
      const { error } = await supabase
        .from('services')
        .update({
          name_of_service: nameOfService.trim(),
          service_type: serviceType,
          price: price,
          pet_preferences: petPreferences,
          housing_type: housingType,
          service_details: serviceDetails,
          accepts_pets_with_transmissible_health_issues: acceptsTransmissiblePets,
          accepts_unsterilised_pets: acceptsUnsterilisedPets,
          sitter_present_throughout_service: sitterPresentThroughout,
          no_adults_present: noAdults,
          no_children_present: noChildren,
          no_other_dogs_present: noOtherDogsPresent,
          no_other_cats_present: noOtherCatsPresent,
        })
        .eq('id', service.id)
        .eq('name_of_service', service.name_of_service);
  
      if (error) throw error;
  
      // Create updated service object
      const updatedService: Service = {
        ...service,
        service_type: serviceType,
        name_of_service: nameOfService.trim(),
        price,
        pet_preferences: petPreferences,
        housing_type: housingType,
        service_details: serviceDetails,
        no_other_dogs_present: noOtherDogsPresent,
        no_other_cats_present: noOtherCatsPresent,
        no_children_present: noChildren,
        no_adults_present: noAdults,
        sitter_present_throughout_service: sitterPresentThroughout,
        accepts_unsterilised_pets: acceptsUnsterilisedPets,
        accepts_pets_with_transmissible_health_issues: acceptsTransmissiblePets,
      };
  
      // Navigate back with the updated service data
      navigation.navigate({
        name: 'ProfileScreen',
        params: { 
          updatedService: updatedService,
          timestamp: Date.now() // Force refresh
        },
        merge: true
      });
      
      Alert.alert('Success', 'Service details saved successfully!');
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service details');
    } finally {
      setLoading(false);
    }
  };
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={saveService}
          disabled={loading}
          style={{ marginRight: 15, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    loading,
    nameOfService,
    serviceType,
    price,
    petPreferences,
    noOtherDogsPresent,
    noOtherCatsPresent,
    noChildren,
    noAdults,
    sitterPresentThroughout,
    acceptsUnsterilisedPets,
    acceptsTransmissiblePets,
    housingType,
    serviceDetails,
  ]);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.card}>
        <TouchableOpacity onPress={pickImage} disabled={imageLoading}>
          <View style={styles.imageContainer}>
            {imageLoading ? (
              <View style={[styles.image, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8B0000" />
                <Text style={{ marginTop: 10, color: '#666' }}>Uploading...</Text>
              </View>
            ) : (
              <Image
                source={serviceImageUrl ? { uri: serviceImageUrl } : defaultServiceImage}
                style={styles.image}
              />
            )}
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Tap to change image</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.label}>Service Name</Text>
          <TextInput
            style={styles.input}
            value={nameOfService}
            onChangeText={setNameOfService}
            placeholder="Enter service name"
          />

          <Text style={styles.label}>Service Type</Text>
          <View style={{ zIndex: 5000 }}>
            <DropDownPicker
              open={openType}
              value={serviceType}
              items={typeOptions}
              setOpen={setOpenType}
              setValue={setServiceType}
              placeholder="Select Service Type"
              placeholderStyle={{ color: 'gray' }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              dropDownDirection="BOTTOM"
              textStyle={{
                color: serviceType ? 'black' : 'gray',
                fontSize: 16,
              }}
            />
          </View>

          <Text style={styles.label}>Rate per Hour/Night</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="e.g., $20/hour"
            keyboardType="default"
          />

          <Text style={styles.label}>Pet Preferences</Text>
          <TextInput
            style={styles.input}
            value={petPreferences}
            onChangeText={setPetPreferences}
            placeholder="e.g., Small dogs, cats, no aggressive pets"
          />

          <Text style={styles.label}>Service Details</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            value={serviceDetails}
            onChangeText={setServiceDetails}
            multiline
            placeholder="Describe your service in detail..."
          />

          <Text style={[styles.label, { marginTop: 20 }]}>Service Environment</Text>
          <View style={styles.subCard}>
            {renderToggle('No other dogs present', noOtherDogsPresent, setNoOtherDogsPresent)}
            {renderToggle('No other cats present', noOtherCatsPresent, setNoOtherCatsPresent)}
            {renderToggle('No children present', noChildren, setNoChildren)}
            {renderToggle('No adults present', noAdults, setNoAdults)}
            {renderToggle('Sitter present throughout service', sitterPresentThroughout, setSitterPresentThroughout)}
            {renderToggle('Accepts unsterilised pets', acceptsUnsterilisedPets, setAcceptsUnsterilisedPets)}
            {renderToggle('Accepts pets with transmissible health issues', acceptsTransmissiblePets, setAcceptsTransmissiblePets)}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Housing Type</Text>
          <View style={styles.subCard}>
            {housingTypes.map(ht => (
              <View key={ht} style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>{ht}</Text>
                <Switch
                  value={housingType === ht}
                  onValueChange={() => toggleHousingType(ht)}
                  trackColor={{ false: '#ccc', true: '#4CAF50' }}
                  thumbColor={housingType === ht ? 'white' : '#f4f3f4'}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function renderToggle(label: string, value: boolean, onChange: (v: boolean) => void) {
  return (
    <View style={styles.toggleContainer} key={label}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#ccc', true: '#4CAF50' }}
        thumbColor={value ? 'white' : '#f4f3f4'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#fef5ec',
    padding: 20,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#eee',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  cardContent: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#844d3e',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdown: {
    backgroundColor: '#f7f7f7',
    borderColor: '#ddd',
    borderRadius: 10,
    zIndex: 5000,
  },
  dropdownContainer: {
    backgroundColor: '#f7f7f7',
    borderColor: '#ddd',
    borderRadius: 10,
    zIndex: 5000,
  },
  toggleContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  toggleLabel: {
    fontSize: 15,
    color: 'black',
    flexShrink: 1,
  },
  subCard: {
    backgroundColor: '#f4e4d3',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
});