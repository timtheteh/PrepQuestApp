import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface InterviewStudyToggleProps {
  // Props will be added later for toggle functionality
}

export function InterviewStudyToggle({}: InterviewStudyToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.text}>Study</Text>
        <Text style={styles.text}>Interview</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 35,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
  },
}); 