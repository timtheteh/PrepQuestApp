import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Animated, Platform, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

const { height } = Dimensions.get('window');

// Picker constants
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2);

interface LanguageSelectorProps {
  initialLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

// Language picker component
const LanguagePicker = ({
  initialLanguage = 'English',
  onChange,
  languages,
}: {
  initialLanguage?: string;
  onChange?: (language: string) => void;
  languages: { key: string; label: string }[];
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialLanguage);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(languages.findIndex(l => l.key === initialLanguage) * ITEM_HEIGHT)).current;

  React.useEffect(() => {
    setTimeout(() => {
      const initialIndex = languages.findIndex(l => l.key === initialLanguage);
      const initialY = initialIndex * ITEM_HEIGHT;
      (scrollRef.current as any)?.scrollTo({ y: initialY, animated: false });
      scrollY.setValue(initialY);
    }, 10);
  }, []);

  React.useEffect(() => {
    onChange && onChange(selectedLanguage);
  }, [selectedLanguage]);

  // Animated getItemStyle - memoized to prevent recreation
  const getAnimatedStyle = React.useCallback((index: number) => {
    const inputRange = [
      (index - 2) * ITEM_HEIGHT,
      (index - 1) * ITEM_HEIGHT,
      index * ITEM_HEIGHT,
      (index + 1) * ITEM_HEIGHT,
      (index + 2) * ITEM_HEIGHT,
    ];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [0.3, 0.6, 1, 0.6, 0.3],
      extrapolate: 'clamp',
    });
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.25, 0.5, 1, 0.5, 0.25],
      extrapolate: 'clamp',
    });
    return {
      transform: [{ scale }],
      opacity,
      fontWeight: 'bold',
      fontSize: 28,
      textAlign: 'center',
      height: ITEM_HEIGHT,
      lineHeight: ITEM_HEIGHT,
      fontFamily: Fonts.bodyMedium,
    } as TextStyle;
  }, []);

  const pickerProps = Platform.OS === 'android' ? { nestedScrollEnabled: true } : {};
  const pickerStyles = createLanguagePickerStyles();

  return (
    <View style={pickerStyles.container}>
      {/* Overlay highlight */}
      <View pointerEvents="none" style={pickerStyles.centerHighlight} />
      {/* Language options */}
      <View style={pickerStyles.pickerColumn}>
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * CENTER_INDEX }}
          onMomentumScrollEnd={e => {
            const offsetY = e.nativeEvent.contentOffset.y;
            const idx = Math.round(offsetY / ITEM_HEIGHT);
            setSelectedLanguage(languages[idx].key);
            (scrollRef.current as any)?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          {...pickerProps}
        >
          {languages.map((language, index) => (
            <Animated.Text 
              key={language.key} 
              style={[
                getAnimatedStyle(index),
                { color: Colors.light.text }
              ]}
            >
              {language.label}
            </Animated.Text>
          ))}
        </Animated.ScrollView>
      </View>
    </View>
  );
};

const createLanguagePickerStyles = () => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    backgroundColor: 'transparent',
  },
  pickerColumn: {
    width: 280,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  centerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * CENTER_INDEX,
    height: ITEM_HEIGHT,
    backgroundColor: 'transparent',
    borderRadius: 8,
    zIndex: 0,
  },
});

export default function LanguageSelector({ 
  initialLanguage = 'English', 
  onLanguageChange 
}: LanguageSelectorProps) {
  // Available languages - sorted alphabetically by label
  const availableLanguages = [
    { key: 'Malay' as const, label: 'Bahasa Melayu' },
    { key: 'English' as const, label: 'English' },
    { key: 'French' as const, label: 'Français' },
    { key: 'Japanese' as const, label: '日本語' },
    { key: 'Korean' as const, label: '한국어' },
    { key: 'Hindi' as const, label: 'हिन्दी' },
    { key: 'Chinese' as const, label: '中文' }
  ];

  const handleLanguageChange = (languageKey: string) => {
    onLanguageChange && onLanguageChange(languageKey);
  };

  return (
    <View style={styles.languageSelectionContainer}>
      {/* White rectangle container - same as login/sign-up */}
      <View style={styles.whiteContainer}>
        <Text style={styles.languageSelectionTitle}>Select Language</Text>
        <View style={styles.languagePickerContainer}>
          <LanguagePicker
            initialLanguage={initialLanguage}
            onChange={handleLanguageChange}
            languages={availableLanguages}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  languageSelectionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  whiteContainer: {
    width: '70%', // 70% of screen width
    height: height * 0.6, // 60% of screen height
    opacity: 0.95, // 95% opacity
    borderRadius: 30, // 30px corner radius
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, // 16px horizontal margin
    position: 'relative', // For absolute positioning of title
  },
  languageSelectionTitle: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    fontSize: 24,
    fontFamily: Fonts.bodyMedium,
    color: Colors.light.text,
    textAlign: 'center',
  },
  languagePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
