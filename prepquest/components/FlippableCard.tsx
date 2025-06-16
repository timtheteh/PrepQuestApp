import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface FlippableCardProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const FlippableCard: React.FC<FlippableCardProps> = ({ style, children }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    overflow: 'hidden',
  },
}); 