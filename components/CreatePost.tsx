import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'

type RootStackParamList = {
  Community: undefined
  CreatePost: undefined
  PressPost: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>

export default function CreatePost({ navigation }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)

  async function pickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access media library is required!')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri)
    }
  }

  function onPost() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in both title and body.')
      return
    }

    // Here you can handle sending post data to backend or state management
    // For demo, just alert and navigate back

    Alert.alert('Posted!', `Title: ${title}`, [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create New Post</Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.titleInput}
      />

      <TextInput
        placeholder="Body"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={6}
        style={styles.bodyInput}
      />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>Upload Image</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.postButton} onPress={onPost}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF3E3',
    flexGrow: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  bodyInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  imagePicker: {
    backgroundColor: '#eee',
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  imagePickerText: {
    fontSize: 18,
    color: '#888',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  postButton: {
    backgroundColor: '#8B0000',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
})
