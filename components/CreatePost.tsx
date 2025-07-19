import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { supabase } from '../lib/supabase'

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
  const [isPosting, setIsPosting] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Function to get public URL for displaying images - SAME AS EXAMPLE
  const getPostImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null
    
    const { data } = supabase.storage
      .from('post-images')
      .getPublicUrl(imagePath)
    
    return data.publicUrl
  }

  // Upload function using same pattern as EditPetProfile
  const uploadPostImage = async (imageUri: string, postTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const fileExt = imageUri.split('.').pop()
      const fileName = `${user.id}_${postTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`

      // Convert image to base64 and then to Uint8Array - EXACT SAME AS EXAMPLE
      const fileBase64 = await FileSystem.readAsStringAsync(imageUri, { 
        encoding: FileSystem.EncodingType.Base64 
      })
      
      // Convert base64 to Uint8Array - EXACT SAME AS EXAMPLE
      const byteCharacters = atob(fileBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, byteArray, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error
      return data.path
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  async function pickImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required!')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9], // Good aspect ratio for posts
        quality: 0.8,
      })

      if (!result.canceled && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri
        setImageUri(pickedUri)
      }
    } catch (error) {
      console.error('Image pick error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  async function onPost() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in both title and body.')
      return
    }

    setIsPosting(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to create a post')
        setIsPosting(false)
        return
      }

      let imagePath = null
      
      // Upload image if selected - SAME PATTERN AS EXAMPLE
      if (imageUri) {
        try {
          setUploading(true)
          imagePath = await uploadPostImage(imageUri, title)
        } catch (error) {
          console.error('Error uploading image:', error)
          Alert.alert('Error', 'Failed to upload image. Post will be created without image.')
        } finally {
          setUploading(false)
        }
      }

      // Insert post into database
      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          body: body.trim(),
          image_url: imagePath,
          user_id: user.id
        })
        .select()

      if (error) {
        console.error('Error creating post:', error)
        Alert.alert('Error', 'Failed to create post. Please try again.')
        return
      }

      Alert.alert('Success!', 'Your post has been created!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setTitle('')
            setBody('')
            setImageUri(null)
            // Navigate back to community
            navigation.goBack()
          },
        },
      ])

    } catch (error) {
      console.error('Error creating post:', error)
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  function removeImage() {
    setImageUri(null)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPost}
          disabled={isPosting || uploading}
          style={styles.headerButton}
        >
          <Text style={[styles.postButton, (isPosting || uploading) && styles.disabledButton]}>
            {isPosting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Create New Post</Text>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              placeholder="Enter post title..."
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body</Text>
            <TextInput
              placeholder="What's on your mind?"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={6}
              style={styles.bodyInput}
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo</Text>
            <TouchableOpacity 
              style={styles.imagePicker} 
              onPress={pickImage}
              disabled={uploading}
            >
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={removeImage}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  {uploading ? (
                    <ActivityIndicator size="large" color="#8B0000" />
                  ) : (
                    <>
                      <Text style={styles.imagePickerIcon}>📷</Text>
                      <Text style={styles.imagePickerText}>Add Photo</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: '#FFF3E3',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButton: {
    fontSize: 18,
    color: '#8B0000',
    fontWeight: '600',
  },
  postButton: {
    fontSize: 18,
    color: '#8B0000',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B0000',
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bodyInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imagePicker: {
    backgroundColor: 'white',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  removeImageText: {
    fontSize: 20,
    color: '#8B0000',
    fontWeight: 'bold',
  },
})