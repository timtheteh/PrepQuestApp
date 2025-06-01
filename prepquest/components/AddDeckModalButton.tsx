import React, { useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

interface AddDeckModalButtonProps {
  onPress?: () => void;
  children?: React.ReactNode;
}

export function AddDeckModalButton({ 
  onPress,
  children 
}: AddDeckModalButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableWithoutFeedback
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => {
        setIsPressed(false);
        if (onPress) onPress();
      }}
    >
      <View style={[
        styles.button,
        isPressed ? styles.buttonPressed : styles.buttonUnpressed
      ]}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 118,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonUnpressed: {
    borderWidth: 3,
    borderColor: '#4F41D8',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4, // for Android shadow
  },
  buttonPressed: {
    borderWidth: 3,
    borderColor: '#4F41D8',
    transform: [{ scale: 1.02 }], // slight scale effect when pressed
  },
}); 