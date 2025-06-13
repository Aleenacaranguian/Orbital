import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function Messaging() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Messaging Screen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 22,
  },
})
