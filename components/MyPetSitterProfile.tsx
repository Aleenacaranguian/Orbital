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

const defaultAvatar = require('../assets/default-profile.png');

type Sitter = {
  aboutMe: string;
  experience: string;
  skillHighlight: string;
  ownsPets: boolean;
  volunteers: boolean;
  worksWith: boolean;
};

type HomeStackParamList = {
  PetSitterProfileView: { sitter: Sitter; updatedSitter?: Sitter };
  EditPetSitterProfile: { sitter: Sitter };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'PetSitterProfileView'>;

export default function PetSitterProfileView({ route, navigation }: Props) {
  const [sitter, setSitter] = useState<Sitter>(
    route.params?.sitter ?? {
      aboutMe: '',
      experience: '',
      skillHighlight: '',
      ownsPets: false,
      volunteers: false,
      worksWith: false,
    }
  );

  useEffect(() => {
    if (route.params?.updatedSitter) {
      setSitter(route.params.updatedSitter);
    }
  }, [route.params?.updatedSitter]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EditPetSitterProfile', { sitter })
          }
          style={{ marginRight: 15 }}
        >
          <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 16 }}>
            Edit
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, sitter]);

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: '#fef5ec' }}
      contentContainerStyle={styles.container}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      <Image source={defaultAvatar} style={styles.avatar} />

      <Text style={styles.username}>Ynaleena23</Text>
      <Text style={styles.reviewText}>⭐ 4.5 | 2 reviews</Text>

      <Text style={styles.label}>About Me</Text>
      <TextInput
        style={[styles.input, styles.aboutMe]}
        value={sitter.aboutMe || ''}
        multiline
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Years of Experience</Text>
      <TextInput
        style={styles.input}
        value={sitter.experience || ''}
        editable={false}
        selectTextOnFocus={false}
      />

      <Text style={styles.label}>Skill Highlight</Text>
      <TextInput
        style={styles.input}
        value={sitter.skillHighlight || ''}
        editable={false}
        selectTextOnFocus={false}
      />

      <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Owns Pets</Text>
              <Switch
                value={!!sitter.ownsPets}
                disabled
                trackColor={{ false: '#ccc', true: 'lightgreen' }}
                thumbColor={sitter.ownsPets ? 'white' : '#f4f3f4'}
              />
            </View>
      
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Volunteers with Animals</Text>
              <Switch
                value={!!sitter.volunteers}
                disabled
                trackColor={{ false: '#ccc', true: 'lightgreen' }}
                thumbColor={sitter.volunteers ? 'white' : '#f4f3f4'}
              />
            </View>
      
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Works with Animals</Text>
              <Switch
                value={!!sitter.worksWith}
                disabled
                trackColor={{ false: '#ccc', true: 'lightgreen' }}
                thumbColor={sitter.worksWith ? 'white' : '#f4f3f4'}
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
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: 'black',
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
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
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#844d3e',
  },
});
