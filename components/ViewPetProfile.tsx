//viewpetprofile.tsx 
import React, { useLayoutEffect, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { HomeStackParamList, Pet } from './Home';

type Props = NativeStackScreenProps<HomeStackParamList, 'ViewPetProfile'>;

const defaultAvatar = require('../assets/default-profile.png');

export default function ViewPetProfile({ route, navigation }: Props) {
  const [pet, setPet] = useState<Pet>(route.params.pet);

  const getPetImageUrl = (petUrl: string | null | undefined) => {
    if (!petUrl) return null;
    
    const { data } = supabase.storage
      .from('my-pets')
      .getPublicUrl(petUrl);
    
    return data.publicUrl;
  };

  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.pet) {
        setPet(route.params.pet);
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.pet]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('EditPetProfile', { pet })}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>
            Edit
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, pet]);

  // Format birthday for display
  const formatBirthday = (birthday: string | null | undefined) => {
    if (!birthday) return 'Not set';
    
    try {
      // If birthday is in ISO format (YYYY-MM-DD), convert to DD/MM/YYYY
      if (birthday.includes('-')) {
        const [year, month, day] = birthday.split('-');
        return `${day}/${month}/${year}`;
      }
      return birthday;
    } catch (error) {
      return birthday || 'Not set';
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: '#fef5ec' }}
      contentContainerStyle={styles.container}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      <Image
        source={pet.pet_url ? { uri: getPetImageUrl(pet.pet_url) } : defaultAvatar}
        style={styles.avatar}
      />

      <Text style={styles.petName}>{pet.name}</Text>

      <Text style={styles.label}>Pet Name</Text>
      <TextInput
        style={styles.input}
        value={pet.name}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        value={pet.breed || 'Not set'}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Birthday</Text>
      <TextInput
        style={styles.input}
        value={formatBirthday(pet.birthday)}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Pet Type</Text>
      <TextInput
        style={styles.input}
        value={pet.pet_type || 'Not set'}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Pet Size</Text>
      <TextInput
        style={styles.input}
        value={pet.size || 'Not set'}
        editable={false}
        selectTextOnFocus={false}
      />

      {/* Show toggles as disabled Switches */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Sterilised</Text>
        <Switch
          value={!!pet.sterilised}
          disabled
          trackColor={{ false: '#ccc', true: 'lightgreen' }}
          thumbColor={pet.sterilised ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Transmissible Health Issues</Text>
        <Switch
          value={!!pet.transmissible_health_issues}
          disabled
          trackColor={{ false: '#ccc', true: 'lightgreen' }}
          thumbColor={pet.transmissible_health_issues ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Dogs</Text>
        <Switch
          value={!!pet.friendly_with_dogs}
          disabled
          trackColor={{ false: '#ccc', true: 'lightgreen' }}
          thumbColor={pet.friendly_with_dogs ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Cats</Text>
        <Switch
          value={!!pet.friendly_with_cats}
          disabled
          trackColor={{ false: '#ccc', true: 'lightgreen' }}
          thumbColor={pet.friendly_with_cats ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Children</Text>
        <Switch
          value={!!pet.friendly_with_children}
          disabled
          trackColor={{ false: '#ccc', true: 'lightgreen' }}
          thumbColor={pet.friendly_with_children ? 'white' : '#f4f3f4'}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    backgroundColor: '#fef5ec',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 10,
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
    color: 'black',
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