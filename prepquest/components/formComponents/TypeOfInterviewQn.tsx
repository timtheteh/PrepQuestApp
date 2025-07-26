import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface TypeOfInterviewQnProps {
  value: string;
  onValueChange: (value: string) => void;
}

const INTERVIEW_TYPES = ['Technical', 'Behavioral', 'Brainteasers', 'Case Study', 'Others'];

const INTERVIEW_TYPE_LABELS: Record<string, { en: string; zh: string }> = {
  'Technical': { en: 'Technical', zh: '技术' },
  'Behavioral': { en: 'Behavioral', zh: '行为' },
  'Brainteasers': { en: 'Brainteasers', zh: '脑筋急转弯' },
  'Case Study': { en: 'Case Study', zh: '案例分析' },
  'Others': { en: 'Others', zh: '其他' },
};

export function TypeOfInterviewQn({
  value,
  onValueChange,
}: TypeOfInterviewQnProps) {
  const { language } = useLanguage();
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{language === 'Chinese' ? '2. 你正在准备哪种面试？（选一）' : '2. Which kind of interview are you preparing for? (Pick One)'}</Text>
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
              {language === 'Chinese' ? INTERVIEW_TYPE_LABELS[type]?.zh || type : INTERVIEW_TYPE_LABELS[type]?.en || type}
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
    width: '19%',
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
    fontSize: Dimensions.get('window').height < 670 ? 10 : 12,
    color: '#FFFFFF',
  },
}); 