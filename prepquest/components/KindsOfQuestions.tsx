import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface KindsOfQuestionsProps {
  value: string;
  onValueChange: (value: string) => void;
}

const QUESTION_TYPES = [
  'Recall',
  'Comprehension',
  'Application',
  'Analysis',
  'Synthesis',
  'Evaluation',
  'Problem-Solving'
];

export function KindsOfQuestions({
  value,
  onValueChange,
}: KindsOfQuestionsProps) {
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>4. What kinds of questions do you want to practice more of? (Pick any)</Text>
      <View style={styles.buttonContainer}>
        {QUESTION_TYPES.map((type) => (
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
    flexWrap: 'wrap',
    gap: 5,
  },
  button: {
    height: 40,
    backgroundColor: '#44B88A',
    borderRadius: 10,
    paddingHorizontal: 10,
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