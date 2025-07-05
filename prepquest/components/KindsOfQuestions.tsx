import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HelpIconOutline from '@/assets/icons/helpIconOutline.svg';
import { MenuContext } from '@/contexts/MenuContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface KindsOfQuestionsProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  onHelpPress?: () => void;
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

const QUESTION_TYPE_LABELS: Record<string, { en: string; zh: string }> = {
  'Recall': { en: 'Recall', zh: '回忆问题' },
  'Comprehension': { en: 'Comprehension', zh: '理解问题' },
  'Application': { en: 'Application', zh: '应用问题' },
  'Analysis': { en: 'Analysis', zh: '分析问题' },
  'Synthesis': { en: 'Synthesis', zh: '综合问题' },
  'Evaluation': { en: 'Evaluation', zh: '评估问题' },
  'Problem-Solving': { en: 'Problem-Solving', zh: '解决问题' },
};

export function KindsOfQuestions({
  value,
  onValueChange,
  onHelpPress,
}: KindsOfQuestionsProps) {
  const { 
    setIsMenuOpen,
    menuOverlayOpacity,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity
  } = useContext(MenuContext);
  const { language } = useLanguage();

  const handleSelect = (selectedValue: string) => {
    const newValue = [...value]; // Create a copy of the current array
    
    if (newValue.includes(selectedValue)) {
      // If already selected, remove it
      const index = newValue.indexOf(selectedValue);
      newValue.splice(index, 1);
    } else {
      // If not selected, add it
      newValue.push(selectedValue);
    }
    
    onValueChange(newValue);
  };

  const handleHelpPress = () => {
    setIsMenuOpen(true);
    setIsNoSelectionModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{language === 'Chinese' ? '4. 你想多练习哪些类型的问题？（可多选）' : '4. What kinds of questions do you want to practice more of? (Pick any)'}</Text>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonsRow}>
          {QUESTION_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.button,
                value.includes(type) && styles.buttonSelected
              ]}
              onPress={() => handleSelect(type)}
            >
              <Text style={styles.buttonText}>
                {language === 'Chinese' ? QUESTION_TYPE_LABELS[type]?.zh || type : QUESTION_TYPE_LABELS[type]?.en || type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity 
          style={styles.helpIconContainer}
          onPress={onHelpPress || handleHelpPress}
        >
          <HelpIconOutline width={24} height={24} />
        </TouchableOpacity>
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
    alignItems: 'flex-start',
  },
  buttonsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginRight: 8,
  },
  helpIconContainer: {
    paddingTop: 8,
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