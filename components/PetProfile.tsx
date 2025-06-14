import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Platform,
  Switch,
  TouchableOpacity,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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
  PetProfile: { pet: Pet };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'PetProfile'>;

const defaultAvatar = require('../assets/default-profile.png');

export default function PetProfile({ route, navigation }: Props) {
  const { pet } = route.params;

  const [name, setName] = useState(pet.name);
  const [birthday, setBirthday] = useState(pet.birthday || '');
  const [type, setType] = useState(pet.type || '');
  const [breed, setBreed] = useState(pet.breed || '');
  const [size, setSize] = useState(pet.size || '');

  const [sterilised, setSterilised] = useState(pet.sterilised || false);
  const [transmissibleHealthIssues, setTransmissibleHealthIssues] = useState(pet.transmissibleHealthIssues || false);
  const [friendlyWithDogs, setFriendlyWithDogs] = useState(pet.friendlyWithDogs || false);
  const [friendlyWithCats, setFriendlyWithCats] = useState(pet.friendlyWithCats || false);
  const [friendlyWithChildren, setFriendlyWithChildren] = useState(pet.friendlyWithChildren || false);

  const [openType, setOpenType] = useState(false);
  const [openSize, setOpenSize] = useState(false);

  const typeOptions = [
    { label: 'Dog', value: 'Dog' },
    { label: 'Cat', value: 'Cat' },
    { label: 'Rabbit', value: 'Rabbit' },
    { label: 'Bird', value: 'Bird' },
  ];

  const sizeOptions = [
    { label: '1-10kg', value: '1-10kg' },
    { label: '11-20kg', value: '11-20kg' },
    { label: '21-30kg', value: '21-30kg' },
    { label: '31-40kg', value: '31-40kg' },
    { label: '>40kg', value: '>40kg' },
  ];

  const onSave = () => {
    console.log({
      name,
      birthday,
      type,
      breed,
      size,
      sterilised,
      friendlyWithDogs,
      friendlyWithCats,
    });
    alert('Pet details saved!');
  };

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

      <Text style={styles.petName}>{name}</Text>
      <Text style={styles.label}>Pet Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="gray"
      />

      <Text style={styles.label}>Birthday</Text>
      <TextInput
        style={styles.input}
        placeholder="Birthday (DD/MM/YYYY)"
        value={birthday}
        onChangeText={setBirthday}
        placeholderTextColor="gray"
      />

      <Text style={styles.label}>Pet Type</Text>
      <View style={{ zIndex: 9999, width: '100%', position: 'relative' }}>
        <DropDownPicker
          open={openType}
          value={type}
          items={typeOptions}
          setOpen={setOpenType}
          setValue={setType}
          placeholder="Select Pet Type"
          placeholderStyle={{ color: 'gray' }}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          listMode="SCROLLVIEW"
          textStyle={{
            color: type ? 'black' : 'gray',
            fontSize: 16,
          }}
        />
      </View>

      <Text style={styles.label}>Breed</Text>
      <TextInput
        style={styles.input}
        placeholder="Breed"
        value={breed}
        onChangeText={setBreed}
        placeholderTextColor="gray"
      />

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
            color: type ? 'black' : 'gray',
            fontSize: 16,
          }}
        />
      </View>

    {/* Toggle switches */}
    <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Sterilised</Text>
        <Switch
          value={sterilised}
          onValueChange={setSterilised}
          trackColor={{ false: '#ccc', true: 'light green' }}
          thumbColor={friendlyWithChildren ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Transmissible Health Issues</Text>
        <Switch
          value={transmissibleHealthIssues}
          onValueChange={setTransmissibleHealthIssues}
          trackColor={{ false: '#ccc', true: 'light green' }}
          thumbColor={transmissibleHealthIssues ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Dogs</Text>
        <Switch
          value={friendlyWithDogs}
          onValueChange={setFriendlyWithDogs}
          trackColor={{ false: '#ccc', true: 'light green' }}
          thumbColor={friendlyWithChildren ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Cats</Text>
        <Switch
          value={friendlyWithCats}
          onValueChange={setFriendlyWithCats}
          trackColor={{ false: '#ccc', true: 'light green' }}
          thumbColor={friendlyWithChildren ? 'white' : '#f4f3f4'}
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Friendly with Children</Text>
        <Switch
          value={friendlyWithChildren}
          onValueChange={setFriendlyWithChildren}
          trackColor={{ false: '#ccc', true: 'light green' }}
          thumbColor={friendlyWithChildren ? 'white' : '#f4f3f4'}
        />
      </View>

      {/* Save/Update Button */}
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save / Update</Text>
      </TouchableOpacity>
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
  saveButton: {
    marginTop: 20,
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
  
