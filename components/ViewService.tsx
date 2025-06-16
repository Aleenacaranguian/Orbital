import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Service = {
  id: string;
  name_of_service: string;
  service_type: string;
  imageUri?: string | null;
  price?: string;
  pet_preferences?: string;
  housing_type?: string;
  service_details?: string;
  no_other_dogs_present?: boolean;
  no_other_cats_present?: boolean;
  no_children_present?: boolean;
  no_adults_present?: boolean;
  sitter_present_throughout_service?: boolean;
  accepts_unsterilised_pets?: boolean;
  accepts_transmissible_pets?: boolean;
};

type HomeStackParamList = {
  ViewService: { service: Service };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'ViewService'>;

const defaultServiceImage = require('../assets/petsitter.png');

const housingTypes = [
  'Apartment',
  'HDB',
  'Landed property with backyard',
  'Landed property without backyard',
  'NA',
];

export default function ViewServiceScreen({ route }: Props) {
  const { service } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image
        source={service.imageUri ? { uri: service.imageUri } : defaultServiceImage}
        style={styles.image}
      />

      <View style={styles.bigCard}>
        <Text style={styles.serviceName}>{service.name_of_service || 'Untitled Service'}</Text>

        <Text style={styles.label}>Service Type</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.service_type || ''}</Text>
        </View>

        <Text style={styles.label}>Rate per Hour/Night</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.price || ''}</Text>
        </View>

        <Text style={styles.label}>Pet Preferences</Text>
        <View style={styles.readOnlyField}>
          <Text>{service.pet_preferences || ''}</Text>
        </View>

        <Text style={styles.label}>Service Details</Text>
        <View style={styles.readOnlyFieldLarge}>
          <Text>{service.service_details || ''}</Text>
        </View>

        {/* Subcard for Service Environment */}
        <Text style={styles.label}>Service Environment</Text>
        <View style={styles.subCard}>
          {renderToggle('No other dog present', service.no_other_dogs_present)}
          {renderToggle('No other cats present', service.no_other_cats_present)}
          {renderToggle('No children', service.no_children_present)}
          {renderToggle('No adults', service.no_adults_present)}
          {renderToggle('Sitter present throughout', service.sitter_present_throughout_service)}
          {renderToggle('Accepts unsterilised pets', service.accepts_unsterilised_pets)}
          {renderToggle('Accepts transmissible health issues', service.accepts_transmissible_pets)}
        </View>

        <Text style={styles.label}>Housing Type</Text>
        <View style={styles.subCard}>
          {housingTypes.map((ht) => (
            <View style={styles.toggleRow} key={ht}>
              <Text style={styles.toggleLabel}>{ht}</Text>
              <Switch
                value={service.housing_type === ht}
                disabled
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
                thumbColor={service.housing_type === ht ? 'white' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function renderToggle(label: string, value: boolean | undefined) {
  return (
    <View style={styles.toggleRow} key={label}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={!!value} disabled />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5ec',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#ddd',
  },
  bigCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B0000',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
    marginTop: 12,
    marginBottom: 6,
  },
  readOnlyField: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  readOnlyFieldLarge: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    justifyContent: 'center',
  },
  subCard: {
    backgroundColor: '#fef5ec',
    borderRadius: 12,
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
});
