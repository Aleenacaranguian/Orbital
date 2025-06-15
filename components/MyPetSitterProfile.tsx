import React, { useLayoutEffect, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const defaultAvatar = require('../assets/default-profile.png');
const defaultServiceImage = require('../assets/petsitter.png');

type Sitter = {
  imageUri?: string | null;
  aboutMe: string;
  experience: string;
  skills: string;
  ownsPets: boolean;
  volunteers: boolean;
  worksWith: boolean;
};

type Service = {
  id: string;
  title: string;
  type: string;
  imageUri?: string | null;
};

type HomeStackParamList = {
  PetSitterProfileView: { sitter: Sitter; updatedSitter?: Sitter };
  EditPetSitterProfile: { sitter: Sitter };
  ViewService: { service: Service; onSave: (updatedService: Service) => void };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'PetSitterProfileView'>;

export default function PetSitterProfileView({ route, navigation }: Props) {
  const [sitter, setSitter] = useState<Sitter>(
    route.params?.sitter ?? {
      aboutMe: '',
      experience: '',
      skills: '',
      ownsPets: false,
      volunteers: false,
      worksWith: false,
    }
  );

  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      title: 'New Service',
      type: 'Dog Walking',
      imageUri: null,
    },
  ]);

  useEffect(() => {
    if (route.params?.updatedSitter) {
      setSitter(route.params.updatedSitter);
    }
  }, [route.params?.updatedSitter]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('EditPetSitterProfile', { sitter })}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, sitter]);

  const handleViewService = (service: Service) => {
    navigation.navigate('ViewService', {
      service,
      onSave: () => {},
    });
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: '#fef5ec' }}
      contentContainerStyle={styles.container}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={sitter.imageUri ? { uri: sitter.imageUri } : defaultAvatar}
          style={styles.avatar}
        />
        <Text style={styles.username}>Username</Text>
        <Text style={styles.reviewText}>⭐ 4.5 | 2 reviews</Text>
      </View>

      <Text style={styles.label}>About Me</Text>
      <TextInput
        style={[styles.input, styles.aboutMeInput]}
        multiline
        value={sitter.aboutMe}
        editable={false}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={sitter.experience}
          editable={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any Other Pet-Related Skills</Text>
        <TextInput
          style={styles.input}
          value={sitter.skills}
          editable={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Owns pets</Text>
          <Switch
            value={!!sitter.ownsPets}
            disabled
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sitter.ownsPets ? 'white' : '#f4f3f4'}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Volunteer with animals</Text>
          <Switch
            value={!!sitter.volunteers}
            disabled
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sitter.volunteers ? 'white' : '#f4f3f4'}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Work with animals</Text>
          <Switch
            value={!!sitter.worksWith}
            disabled
            trackColor={{ false: '#ccc', true: 'lightgreen' }}
            thumbColor={sitter.worksWith ? 'white' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Services Provided</Text>
        {services.map(service => (
          <View key={service.id} style={styles.serviceCardLarge}>
            <Image
              source={service.imageUri ? { uri: service.imageUri } : defaultServiceImage}
              style={styles.serviceImageLarge}
            />
            <View style={styles.serviceInfoLarge}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceType}>{service.type}</Text>
              <TouchableOpacity onPress={() => handleViewService(service)}>
                <Text style={styles.moreDetails}>More Details →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef5ec',
    paddingBottom: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 14,
    color: 'black',
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: '#844d3e',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
    color: 'black',
  },
  aboutMeInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  serviceCardLarge: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    height: 150,
  },
  serviceImageLarge: {
    width: 150,
    height: 120,
    borderRadius: 12,
    margin: 12,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  serviceInfoLarge: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  serviceTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#8B0000',
  },
  serviceType: {
    fontSize: 16,
    color: 'black',
    marginVertical: 4,
  },
  moreDetails: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
