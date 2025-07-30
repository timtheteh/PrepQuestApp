import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import HelpIconOutline from '@/assets/icons/generalIcons/helpIconOutline.svg';
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

  // Dynamic function to get question type label based on current language
  const getQuestionTypeLabel = (type: string): string => {
    const typeKey = type.toLowerCase().replace(/\s+/g, '') as keyof typeof strings.English.questionTypes;
    
    // Get the label from the strings object based on current language
    const languageStrings = strings[language as keyof typeof strings];
    if (languageStrings?.questionTypes?.[typeKey]) {
      return languageStrings.questionTypes[typeKey];
    }
    
    // Fallback to English if the language is not found
    return strings.English.questionTypes[typeKey] || type;
  };

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

  const dynamicStyles = {
    title: {
      color: Colors[theme].text,
    },
  };

  const renderButton = (type: string) => {
    const isSelected = value.includes(type);
    const label = getQuestionTypeLabel(type);
    
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
  };

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