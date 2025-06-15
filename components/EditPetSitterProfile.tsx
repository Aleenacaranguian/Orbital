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

type Sitter = {
  imageUri: string | null;
  aboutMe: string;
  experience: string;
  skillHighlight: string;
  ownsPets: boolean;
  volunteers: boolean;
  worksWith: boolean;
};

type HomeStackParamList = {
  Home: undefined;
  PetSitterProfile: { sitter: Sitter };
  EditPetSitterProfile: { sitter: Sitter };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'EditPetSitterProfile'>;

const defaultAvatar = require('../assets/default-profile.png');

export default function EditPetSitterProfileScreen({ route, navigation }: Props) {
  const { sitter } = route.params;

  const [aboutMe, setAboutMe] = useState(sitter.aboutMe || '');
  const [experience, setExperience] = useState(sitter.experience || '');
  const [skillHighlight, setSkillHighlight] = useState(sitter.skillHighlight || '');
  const [ownsPets, setOwnsPets] = useState(sitter.ownsPets);
  const [volunteers, setVolunteers] = useState(sitter.volunteers);
  const [worksWith, setWorksWith] = useState(sitter.worksWith);

  const onSave = () => {
    console.log({
        aboutMe,
        experience,
        skillHighlight,
        ownsPets,
        volunteers,
        worksWith,
    });
    alert('Pet details saved!');
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
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>
            Done
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [
    navigation, 
    aboutMe, 
    experience, 
    skillHighlight, 
    ownsPets, 
    volunteers, 
    worksWith]);

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

    <Text style={styles.username}>Ynaleena23</Text>
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
        <Text style={styles.label}>Years of experience with pets</Text>
        <TextInput
          style={styles.input}
          value={experience}
          onChangeText={setExperience}
          placeholder="e.g. 2 - 5"
          placeholderTextColor="gray"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any other pet-related skills to highlight</Text>
        <TextInput
          style={styles.input}
          value={skillHighlight}
          onChangeText={setSkillHighlight}
          placeholder="e.g. Basic certified pet first aid knowledge"
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
  content: {
    paddingBottom: 60,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },  
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 10,
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
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
});
