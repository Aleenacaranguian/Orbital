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

type Pet = {
  id: string;
  name: string;
  imageUri: string | null;
  birthday?: string;
  type?: string;
  breed?: string;
  size?: string;
  sterilised?: boolean;
  transmissibleHealthIssues?: boolean;
  friendlyWithDogs?: boolean;
  friendlyWithCats?: boolean;
  friendlyWithChildren?: boolean;
};

type HomeStackParamList = {
  PetProfileView: { pet: Pet; updatedPet?: Pet };
  EditPetProfile: { pet: Pet };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'PetProfileView'>;

const defaultAvatar = require('../assets/default-profile.png');

export default function PetProfileView({ route, navigation }: Props) {
  // Use local state so we can update pet info on return from Edit
  const [pet, setPet] = useState(
    route.params?.pet ?? {
      id: '',
      name: '',
      // other default pet fields
    }
  );
  
  // If updatedPet param comes in (from Edit screen), update pet state
  useEffect(() => {
    if (route.params.updatedPet) {
      setPet(route.params.updatedPet);
    }
  }, [route.params.updatedPet]);

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

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: '#fef5ec' }}
      contentContainerStyle={styles.container}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      <Image
        source={pet.imageUri ? { uri: pet.imageUri } : defaultAvatar}
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

      <Text style={styles.label}>Birthday</Text>
      <TextInput
        style={styles.input}
        value={pet.birthday || ''}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Pet Type</Text>
      <TextInput
        style={styles.input}
        value={pet.type || ''}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        value={pet.breed || ''}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Pet Size</Text>
      <TextInput
        style={styles.input}
        value={pet.size || ''}
        editable={false}
        selectTextOnFocus={false}
      />

      {/* Show toggles as disabled Switches */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Sterilised</Text>
        <Switch
          value={!!pet.sterilised}
          disabled
          trackColor={{ false: '#ccc', true: '#4CAF50' }}
          thumbColor={pet.sterilised ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Transmissible Health Issues</Text>
        <Switch
          value={!!pet.transmissibleHealthIssues}
          disabled
          trackColor={{ false: '#ccc', true: '#4CAF50' }}
          thumbColor={pet.transmissibleHealthIssues ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Dogs</Text>
        <Switch
          value={!!pet.friendlyWithDogs}
          disabled
          trackColor={{ false: '#ccc', true: '#4CAF50' }}
          thumbColor={pet.friendlyWithDogs ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Cats</Text>
        <Switch
          value={!!pet.friendlyWithCats}
          disabled
          trackColor={{ false: '#ccc', true: '#4CAF50' }}
          thumbColor={pet.friendlyWithCats ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Children</Text>
        <Switch
          value={!!pet.friendlyWithChildren}
          disabled
          trackColor={{ false: '#ccc', true: '#4CAF50' }}
          thumbColor={pet.friendlyWithChildren ? 'white' : '#f4f3f4'}
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
