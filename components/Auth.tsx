import React, { useState } from 'react'
import {
  Alert,
  StyleSheet,
  View,
  AppState,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Input } from '@rneui/themed'

// Manage session auto-refresh
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF3E3" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.appTitle}>PAWPALS</Text>
            <Text style={styles.subtitle}>
              CONNECT, SHARE AND FIND THE PERFECT{'\n'}
              COMPANION FOR YOUR FURRY FRIEND
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <Input
                placeholder="email@address.com"
                onChangeText={(text: string) => setEmail(text)}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                inputContainerStyle={styles.inputContainerStyle}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <Input
                placeholder="Password"
                secureTextEntry
                onChangeText={(text: string) => setPassword(text)}
                value={password}
                autoCapitalize="none"
                inputContainerStyle={styles.inputContainerStyle}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.signInButton]}
              onPress={signInWithEmail}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signUpButton]}
              onPress={signUpWithEmail}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.petImagesContainer}>
            <Image
              source={require('../assets/petstogether.png')}
              style={styles.petImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#6B5B47',
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  inputContainerStyle: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    minHeight: 40,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 6,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  signInButton: {
    backgroundColor: '#D2691E',
  },
  signUpButton: {
    backgroundColor: '#D2691E',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  petImagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImage: {
    width: '90%',
    height: 200,
    maxHeight: 220,
  },
})