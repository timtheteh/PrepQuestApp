import React, { useContext, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HelpIconOutline from '@/assets/icons/helpIconOutline.svg';
import { MenuContext } from '@/contexts/MenuContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

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

export const KindsOfQuestions = React.memo(({
  value,
  onValueChange,
  onHelpPress,
}: KindsOfQuestionsProps) => {
  const { 
    setIsMenuOpen,
    setIsNoSelectionModalOpen,
  } = useContext(MenuContext);
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Memoize question type labels to prevent recreation on every render
  const questionTypeLabels: Record<string, { en: string; zh: string }> = useMemo(() => ({
    'Recall': { en: strings.English.questionTypes.recall, zh: strings.Chinese.questionTypes.recall },
    'Comprehension': { en: strings.English.questionTypes.comprehension, zh: strings.Chinese.questionTypes.comprehension },
    'Application': { en: strings.English.questionTypes.application, zh: strings.Chinese.questionTypes.application },
    'Analysis': { en: strings.English.questionTypes.analysis, zh: strings.Chinese.questionTypes.analysis },
    'Synthesis': { en: strings.English.questionTypes.synthesis, zh: strings.Chinese.questionTypes.synthesis },
    'Evaluation': { en: strings.English.questionTypes.evaluation, zh: strings.Chinese.questionTypes.evaluation },
    'Problem-Solving': { en: strings.English.questionTypes.problemSolving, zh: strings.Chinese.questionTypes.problemSolving },
  }), []);

  // Memoize the select handler to prevent recreation on every render
  const handleSelect = useCallback((selectedValue: string) => {
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
  }, [value, onValueChange]);

  // Memoize the help press handler to prevent recreation on every render
  const handleHelpPress = useCallback(() => {
    setIsMenuOpen(true);
    setIsNoSelectionModalOpen(true);
  }, [setIsMenuOpen, setIsNoSelectionModalOpen]);

  // Memoize dynamic styles to prevent recreation on every render
  const dynamicStyles = useMemo(() => ({
    title: {
      color: Colors[theme].text,
    },
  }), [theme]);

  // Memoize the button renderer to prevent recreation on every render
  const renderButton = useCallback((type: string) => {
    const isSelected = value.includes(type);
    const label = language === 'Chinese' ? questionTypeLabels[type]?.zh || type : questionTypeLabels[type]?.en || type;
    
    return (
      <TouchableOpacity
        key={type}
        style={[
          styles.button,
          { backgroundColor: isSelected ? Colors[theme].brandColor2 : Colors[theme].brandColor1 },
        ]}
        onPress={() => handleSelect(type)}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    );
  }, [value, language, questionTypeLabels, theme, handleSelect]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, dynamicStyles.title]}>{strings[language].kindsOfQuestionsTitle}</Text>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonsRow}>
          {QUESTION_TYPES.map(renderButton)}
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
});

KindsOfQuestions.displayName = 'KindsOfQuestions';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.title,
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
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: '#FFFFFF',
  },
}); 