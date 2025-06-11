import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export type AvatarProps = {
  url: string | null;
  size?: number;
};

const Avatar = ({ url, size = 100 }: AvatarProps) => {
  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2 
      }
    ]}>
      <Image
        source={
          url
            ? { uri: url }
            : require('../assets/profilepic.png') // Use local fallback image
        }
        style={[
          styles.avatar, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2 
          }
        ]}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  avatar: {
    backgroundColor: 'transparent',
  },
});

export default Avatar;