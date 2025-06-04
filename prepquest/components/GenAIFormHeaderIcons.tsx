import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { CircleIconButton } from './CircleIconButton';
import { Entypo } from '@expo/vector-icons';

interface GenAIFormHeaderIconsProps {
  onUseMostRecentFormPress?: () => void;
  onClearAllPress?: () => void;
}

export function GenAIFormHeaderIcons({ 
  onUseMostRecentFormPress,
  onClearAllPress
}: GenAIFormHeaderIconsProps) {
  return (
    <View style={styles.container}>
      <CircleIconButton 
        renderCustomIcon={(color) => (
          <Entypo name="back-in-time" size={20} color={color} />
        )}
        onPress={onUseMostRecentFormPress}
      />
      <TouchableOpacity onPress={onClearAllPress}>
        <Text style={styles.clearAllText}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
  },
}); 