import React, { useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface AddDeckModalButtonProps {
  onPress?: () => void;
  title: string;
  Icon: React.FC<SvgProps>;
  marginBottom?: number;
}

export function AddDeckModalButton({ 
  onPress,
  title,
  Icon,
  marginBottom = 8
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
        <View style={styles.column}>
          <View style={[styles.titleRow, { marginBottom }]}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.iconRow}>
            <Icon />
          </View>
        </View>
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
  column: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 10,
    alignItems: 'center',
  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    textAlign: 'center',
  },
  iconRow: {
    alignItems: 'center',
  },
}); 