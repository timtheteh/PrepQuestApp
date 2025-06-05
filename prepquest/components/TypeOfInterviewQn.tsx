import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TypeOfInterviewQnProps {
  value: string;
  onValueChange: (value: string) => void;
}

const INTERVIEW_TYPES = ['Technical', 'Behavioral', 'Brainteasers', 'Case Study'];

export function TypeOfInterviewQn({
  value,
  onValueChange,
}: TypeOfInterviewQnProps) {
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>2. Which kind of interview are you preparing for? (Pick One)</Text>
      <View style={styles.buttonContainer}>
        {INTERVIEW_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.button,
              value === type && styles.buttonSelected
            ]}
            onPress={() => handleSelect(type)}
          >
            <Text style={styles.buttonText}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    color: '#000000',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    width: '23%',
    height: 40,
    backgroundColor: '#44B88A',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    backgroundColor: '#4F41D8',
  },
  buttonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
}); 