import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { Fonts } from '@/constants/Fonts';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface TypeOfInterviewQnProps {
  value: string;
  onValueChange: (value: string) => void;
}

const INTERVIEW_TYPES = ['Technical', 'Behavioral', 'Brainteasers', 'Case Study', 'Others'];

export const TypeOfInterviewQn = React.memo(({
  value,
  onValueChange,
}: TypeOfInterviewQnProps) => {
  const { language } = useLanguage();
  const { theme } = useTheme();

  // Dynamic function to get interview type label based on current language
  const getInterviewTypeLabel = useCallback((type: string): string => {
    const typeKey = type.toLowerCase().replace(/\s+/g, '') as keyof typeof strings.English.interviewTypes;
    
    // Get the label from the strings object based on current language
    const languageStrings = strings[language as keyof typeof strings];
    if (languageStrings?.interviewTypes?.[typeKey]) {
      return languageStrings.interviewTypes[typeKey];
    }
    
    // Fallback to English if the language is not found
    return strings.English.interviewTypes[typeKey] || type;
  }, [language]);

  // Memoize the select handler to prevent recreation on every render
  const handleSelect = useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
  }, [onValueChange]);

  // Memoize dynamic styles to prevent recreation on every render
  const dynamicStyles = useMemo(() => ({
    title: {
      color: Colors[theme].text,
    },
  }), [theme]);

  // Memoize the button renderer to prevent recreation on every render
  const renderButton = useCallback((type: string) => {
    const isSelected = value === type;
    const label = getInterviewTypeLabel(type);
    
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
  }, [value, getInterviewTypeLabel, theme, handleSelect]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, dynamicStyles.title]}>{strings[language].typeOfInterviewTitle}</Text>
      <View style={styles.buttonContainer}>
        {INTERVIEW_TYPES.map(renderButton)}
      </View>
    </View>
  );
});

TypeOfInterviewQn.displayName = 'TypeOfInterviewQn';

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
    width: '100%',
  },
  button: {
    width: '19%',
    height: 40,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Dimensions.get('window').height < 670 ? 10 : 12,
    color: '#FFFFFF',
  },
}); 