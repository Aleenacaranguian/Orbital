import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Service = {
  id: string;
  title: string;
  type: string;
  imageUri?: string | null;
  ratePerHour?: string;
  petPreferences?: string;
  noOtherDogPresent?: boolean;
  noOtherCatsPresent?: boolean;
  noChildren?: boolean;
  noAdults?: boolean;
  sitterPresentThroughout?: boolean;
  acceptsUnsterilisedPets?: boolean;
  acceptsTransmissiblePets?: boolean;
  housingType?: string;
  details?: string;
};

type HomeStackParamList = {
  ViewService: { service: Service; onSave: (updatedService: Service) => void };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'ViewService'>;

const defaultServiceImage = require('../assets/petsitter.png');

export default function ViewServiceScreen({ route, navigation }: Props) {
  const { service, onSave } = route.params;

  // Basic fields
  const [title, setTitle] = useState(service.title);
  const [ratePerHour, setRatePerHour] = useState(service.ratePerHour || '');
  const [petPreferences, setPetPreferences] = useState(service.petPreferences || '');
  const [details, setDetails] = useState(service.details || '');

  // Service Type dropdown
  const [openType, setOpenType] = useState(false);
  const [type, setType] = useState(service.type);
  const typeOptions = [
    { label: 'House Visit', value: 'House Visit' },
    { label: 'House Sitting', value: 'House Sitting' },
    { label: 'Dog Walking', value: 'Dog Walking' },
    { label: 'Daycare', value: 'Daycare' },
    { label: 'Boarding', value: 'Boarding' },
  ];

  // Service Environment toggles
  const [noOtherDogPresent, setNoOtherDogPresent] = useState(service.noOtherDogPresent || false);
  const [noOtherCatsPresent, setNoOtherCatsPresent] = useState(service.noOtherCatsPresent || false);
  const [noChildren, setNoChildren] = useState(service.noChildren || false);
  const [noAdults, setNoAdults] = useState(service.noAdults || false);
  const [sitterPresentThroughout, setSitterPresentThroughout] = useState(service.sitterPresentThroughout || false);
  const [acceptsUnsterilisedPets, setAcceptsUnsterilisedPets] = useState(service.acceptsUnsterilisedPets || false);
  const [acceptsTransmissiblePets, setAcceptsTransmissiblePets] = useState(service.acceptsTransmissiblePets || false);

  // Housing Type toggles (only one can be ON at once)
  const housingTypes = [
    'Apartment',
    'HDB',
    'Landed property with backyard',
    'Landed property without backyard',
    'NA',
  ];
  const [housingType, setHousingType] = useState(service.housingType || 'NA');

  // For housing toggles: turn off all others when one is selected
  function toggleHousingType(selectedType: string) {
    if (housingType === selectedType) {
      // If toggling the currently ON one, turn it off (so none selected)
      setHousingType('');
    } else {
      setHousingType(selectedType);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            const updatedService: Service = {
              ...service,
              title,
              type,
              ratePerHour,
              petPreferences,
              noOtherDogPresent,
              noOtherCatsPresent,
              noChildren,
              noAdults,
              sitterPresentThroughout,
              acceptsUnsterilisedPets,
              acceptsTransmissiblePets,
              housingType,
              details,
            };
            onSave(updatedService);
            alert('Service details saved!');
            navigation.goBack();
          }}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Done</Text>
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    title,
    type,
    ratePerHour,
    petPreferences,
    noOtherDogPresent,
    noOtherCatsPresent,
    noChildren,
    noAdults,
    sitterPresentThroughout,
    acceptsUnsterilisedPets,
    acceptsTransmissiblePets,
    housingType,
    details,
  ]);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.card}>
        <Image
          source={service.imageUri ? { uri: service.imageUri } : defaultServiceImage}
          style={styles.image}
        />

        <View style={styles.cardContent}>
          <Text style={styles.label}>Service Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Service Title"
          />

          <Text style={styles.label}>Service Type</Text>
          <View style={{ zIndex: 5000 }}>
            <DropDownPicker
              open={openType}
              value={type}
              items={typeOptions}
              setOpen={setOpenType}
              setValue={setType}
              placeholder="Select Service Type"
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

          <Text style={styles.label}>Rate per Hour</Text>
          <TextInput
            style={styles.input}
            value={ratePerHour}
            onChangeText={setRatePerHour}
            placeholder="Rate per Hour"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Pet Preferences</Text>
          <TextInput
            style={styles.input}
            value={petPreferences}
            onChangeText={setPetPreferences}
            placeholder="e.g. Small dogs, cats"
          />

        <Text style={styles.label}>Service Details</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            value={details}
            onChangeText={setDetails}
            multiline
            placeholder="Describe the Service"
          />  

          <Text style={[styles.label, { marginTop: 20 }]}>Service Environment</Text>
          <View style={styles.subCard}>
            {renderToggle('No other dog present', noOtherDogPresent, setNoOtherDogPresent)}
            {renderToggle('No other cats present', noOtherCatsPresent, setNoOtherCatsPresent)}
            {renderToggle('No children', noChildren, setNoChildren)}
            {renderToggle('No adults', noAdults, setNoAdults)}
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
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#eee',
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
