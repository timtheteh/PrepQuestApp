import { StyleSheet, TouchableOpacity, ViewProps } from 'react-native';
import { ReactNode } from 'react';

interface FloatingActionButtonProps extends ViewProps {
  onPress: () => void;
  children: ReactNode;
}

export function FloatingActionButton({ 
  style, 
  onPress,
  children,
  ...props 
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 67,
    height: 67,
    borderRadius: 67 / 2,
    backgroundColor: '#4F41D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8, // for Android shadow
  },
}); 