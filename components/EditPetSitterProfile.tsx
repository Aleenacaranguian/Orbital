import React, { useState, useLayoutEffect } from 'react';
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
  imageUri: string | null;
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
  Home: undefined;
  PetSitterProfile: { sitter: Sitter };
  EditPetSitterProfile: { sitter: Sitter };
  EditService: { service: Service; onSave: (updatedService: Service) => void };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'EditPetSitterProfile'>;

export default function EditPetSitterProfileScreen({ route, navigation }: Props) {
  const { sitter } = route.params;

  const [aboutMe, setAboutMe] = useState(sitter.aboutMe || '');
  const [experience, setExperience] = useState(sitter.experience || '');
  const [skills, setSkills] = useState(sitter.skills || '');
  const [ownsPets, setOwnsPets] = useState(sitter.ownsPets);
  const [volunteers, setVolunteers] = useState(sitter.volunteers);
  const [worksWith, setWorksWith] = useState(sitter.worksWith);
  const [services, setServices] = useState<Service[]>([]);

  const onSave = () => {
    console.log({
      aboutMe,
      experience,
      skills,
      ownsPets,
      volunteers,
      worksWith,
      services,
    });
    alert('Pet sitter details saved!');
  };

  const handleAddService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      title: 'New Service',
      type: 'Service Type',
      imageUri: null,
    };
    setServices(prev => [...prev, newService]);
  };

  const handleEditService = (service: Service) => {
    navigation.navigate('EditService', {
      service,
      onSave: (updatedService: Service) => {
        setServices(prev =>
          prev.map(s => (s.id === updatedService.id ? updatedService : s))
        );
      },
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            onSave();
            navigation.goBack();
          }}
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>Done</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, aboutMe, experience, skills, ownsPets, volunteers, worksWith, services]);

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
        value={aboutMe}
        onChangeText={setAboutMe}
        placeholder="Tell us about yourself..."
        placeholderTextColor="gray"
      />

      <View style={styles.section}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          placeholder="e.g. 2 - 5"
          placeholderTextColor="gray"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any Other Pet-Related Skills</Text>
        <TextInput
          style={styles.input}
          value={skills}
          onChangeText={setSkills}
          placeholder="e.g. Certified in pet first aid"
          placeholderTextColor="gray"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Owns pets</Text>
          <Switch value={ownsPets} onValueChange={setOwnsPets} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Volunteer with animals</Text>
          <Switch value={volunteers} onValueChange={setVolunteers} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Work with animals</Text>
          <Switch value={worksWith} onValueChange={setWorksWith} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Services Provided</Text>
        {services.length === 0 ? (
          <Text style={{ color: 'gray', marginTop: 10, marginBottom: 10 }}>No services added yet 🐶</Text>
        ) : (
          services.map(service => (
          <View key={service.id} style={styles.serviceCardLarge}>
            <Image
              source={service.imageUri ? { uri: service.imageUri } : defaultServiceImage}
              style={styles.serviceImageLarge}
            />
            <View style={styles.serviceInfoLarge}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceType}>{service.type}</Text>
              <TouchableOpacity onPress={() => handleEditService(service)}>
                <Text style={styles.moreDetails}>Edit Details →</Text>
              </TouchableOpacity>
            </View>
          </View>
          ))
        )}
        <TouchableOpacity onPress={handleAddService} style={styles.addServiceButton}>
          <Text style={styles.addServiceText}>+ Add Service</Text>
        </TouchableOpacity>
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
  addServiceButton: {
    marginTop: 10,
    backgroundColor: '#f5c28b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addServiceText: {
    fontWeight: '600',
    fontSize: 16,
    color: 'white',
  },
});
