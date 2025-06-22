import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';

const defaultAvatar = require('../assets/default-profile.png'); // Replace with sitter's image if available

export default function MessageSitterScreen() {
  const sitterUsername = 'SimonTay_48';
  const petName = 'Toffee';
  const serviceType = 'House Boarding';
  const startDate = '1 Jan 2025 11:00AM';
  const endDate = '5 Jan 2025 21:00PM';

  const defaultMessage = `Hello! I would like to make a booking with the following details:\n\n1. Pet(s): ${petName}\n2. Service Type: ${serviceType}\n3. Date(s): ${startDate} to ${endDate}`;

  const [message, setMessage] = useState(defaultMessage);
  const [chatMessages, setChatMessages] = useState<string[]>([]);

  function onSend() {
    if (message.trim().length === 0) return; // don't send empty

    setChatMessages(prev => [...prev, message]);
    setMessage(''); // clear input
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fef9f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Image source={defaultAvatar} style={styles.avatar} />
        <Text style={styles.username}>{sitterUsername}</Text>
      </View>

      <TouchableOpacity style={styles.reviewButton}>
        <Text style={styles.reviewButtonText}>Review & Rate</Text>
      </TouchableOpacity>

      {/* Chat messages */}
      <FlatList
        style={styles.chatList}
        data={chatMessages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.chatBubble}>
            <Text style={styles.chatText}>{item}</Text>
          </View>
        )}
        inverted
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
      />

      {/* Message input */}
      <View style={styles.messageBox}>
        <TextInput
          multiline
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f6e7d8',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    marginRight: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  reviewButton: {
    backgroundColor: '#e74c3c',
    alignSelf: 'flex-start',
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  chatBubble: {
    backgroundColor: '#8d6e63',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    alignSelf: 'flex-end', 
    maxWidth: '80%',
  },
  chatText: {
    color: 'white',
    fontSize: 16,
  },
  messageBox: {
    flexDirection: 'row',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    alignItems: 'flex-end', 
    margin: 16,
  },
  
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingRight: 8,
  },
  
  sendButton: {
    backgroundColor: '#8d6e63',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },  
});
