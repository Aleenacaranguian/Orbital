import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import Avatar from './Avatar';

const AVATAR_BUCKET = 'avatars';

const EditProfile = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    postal_code: '',
    avatar_url: null as string | null,
    email: '',
  });

  
  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, first_name, last_name, phone_number, postal_code, avatar_url, email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          Alert.alert('Error', 'Failed to load profile data');
          return;
        }

        if (data) {
          setProfile({
            username: data.username ?? '',
            first_name: data.first_name ?? '',
            last_name: data.last_name ?? '',
            phone_number: data.phone_number ?? '',
            postal_code: data.postal_code ?? '',
            avatar_url: data.avatar_url,
            email: data.email ?? '',
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (uri: string, userId: string) => {
    try {
      setUploading(true);

      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      
      const fileBase64 = await FileSystem.readAsStringAsync(uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
     
      const byteCharacters = atob(fileBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      if (profile.avatar_url) {
        try {
          const existingFileName = profile.avatar_url.split('/').pop()?.split('?')[0];
          if (existingFileName) {
            await supabase.storage.from(AVATAR_BUCKET).remove([existingFileName]);
          }
        } catch (deleteError) {
          console.log('Could not delete old avatar:', deleteError);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, byteArray, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload profile picture');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], 
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const publicUrl = await uploadAvatar(pickedUri, user.id);
          if (publicUrl) {
            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
          }
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAvatarUpload = async () => {
    await pickImage();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } = {} } = await supabase.auth.getUser();

      if (user) {
        const updateData = {
          username: profile.username || null,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          phone_number: profile.phone_number || null,
          postal_code: profile.postal_code || null,
          avatar_url: profile.avatar_url || null,
        };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          Alert.alert('Error', 'Failed to save profile');
          return;
        }

        Alert.alert('Success', 'Profile updated successfully');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('HomeMain' as never);
        }
      } else {
        Alert.alert('Error', 'User not authenticated.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('HomeMain' as never);
            }
          }}
          style={styles.headerButton}
        >
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.headerButton}
        >
          <Text style={[styles.doneButton, saving && styles.disabledButton]}>
            {saving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Avatar url={profile.avatar_url} size={120} key={profile.avatar_url} />
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleAvatarUpload}
            disabled={uploading}
          >
            <Text style={[styles.changePhotoText, uploading && { opacity: 0.5 }]}>
              {uploading ? 'Uploading...' : 'Change Profile Photo'}
            </Text>
          </TouchableOpacity>
          {__DEV__ && (
            <Text style={{ fontSize: 10, color: '#666', marginTop: 5, textAlign: 'center' }}>
              Avatar URL: {profile.avatar_url ? 'Available' : 'null'}
            </Text>
          )}
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={profile.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profile.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profile.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phone_number}
              onChangeText={(value) => handleInputChange('phone_number', value)}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={profile.postal_code}
              onChangeText={(value) => handleInputChange('postal_code', value)}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 100,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, 
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 10,
  },
  backButton: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '400',
  },
  doneButton: {
    fontSize: 18,
    color: '#007AFF',
  },
  disabledButton: {
    color: '#aaa',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  changePhotoButton: {
    marginTop: 10,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#007AFF',
  },
  formContainer: {
    marginTop: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
});

export default EditProfile;