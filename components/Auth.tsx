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
  TouchableOpacity
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Input } from '@rneui/themed'

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF3E3" />

      {/* Main Content */}
      <View style={styles.content}>
        {/* App Title */}
        <Text style={styles.appTitle}>PAWPALS</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          CONNECT, SHARE AND FIND THE PERFECT{'\n'}
          COMPANION FOR YOUR FURRY FRIEND,{'\n'}
          ANYTIME, ANYWHERE.
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Input
            label="Email"
            leftIcon={{ type: 'font-awesome', name: 'envelope' }}
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="email@address.com"
            autoCapitalize={'none'}
            keyboardType="email-address"
            inputContainerStyle={styles.inputContainerStyle}
            labelStyle={styles.inputLabel}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Input
            label="Password"
            leftIcon={{ type: 'font-awesome', name: 'lock' }}
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Password"
            autoCapitalize={'none'}
            inputContainerStyle={styles.inputContainerStyle}
            labelStyle={styles.inputLabel}
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.button, styles.signInButton]}
          onPress={signInWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={signUpWithEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Pet Images */}
        <View style={styles.petImagesContainer}>
          <Image
            source={require('../assets/petstogether.png')}
            style={styles.petImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E3',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingTop: 40,
  },
  appTitle: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 2,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B5B47',
    textAlign: 'center',
    marginBottom: 5,
    lineHeight: 16,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 5,
  },
  inputContainerStyle: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
  },
  inputLabel: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  signInButton: {
    backgroundColor: '#D2691E',
  },
  signUpButton: {
    backgroundColor: '#D2691E',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  petImagesContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 30,
    width: '100%',
  },
  petImage: {
    width: '100%',
    height: 300,
  },
})