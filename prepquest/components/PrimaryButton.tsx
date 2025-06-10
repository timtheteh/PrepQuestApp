import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
}

export function PrimaryButton({ 
  text,
  onPress
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 126,
    height: 49,
    backgroundColor: '#4F41D8',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 24,
    color: '#FFFFFF',
  },
}); 