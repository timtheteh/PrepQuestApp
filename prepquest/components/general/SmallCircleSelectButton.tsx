import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SmallCircleSelectButtonProps {
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function SmallCircleSelectButton({ 
  selected,
  onPress,
  disabled = false
}: SmallCircleSelectButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[
        styles.outerCircle,
        disabled && styles.disabledCircle
      ]}>
        {selected && <View style={styles.innerCircle} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D5D4DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledCircle: {
    borderColor: '#F0F0F0',
    opacity: 0.5,
  },
  innerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D5D4DD',
  },
}); 