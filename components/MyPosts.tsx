import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function MyPosts() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Posts</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3E3',
  },
  text: {
    fontSize: 24,
  },
})
