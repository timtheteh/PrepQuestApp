import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Animated, Platform, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { Svg, Polygon } from 'react-native-svg';

// Import all country flags from straight folder
import UsaFlag from '@/assets/countryFlags/straight/usaFlag.svg';
import ChinaFlag from '@/assets/countryFlags/straight/chinaFlag.svg';
import SpainFlag from '@/assets/countryFlags/straight/spainFlag.svg';
import FranceFlag from '@/assets/countryFlags/straight/franceFlag.svg';
import GermanyFlag from '@/assets/countryFlags/straight/germanyFlag.svg';
import PortugalFlag from '@/assets/countryFlags/straight/brazilFlag.svg'; // Using Brazil flag for Portuguese
import JapanFlag from '@/assets/countryFlags/straight/japanFlag.svg';
import SouthKoreaFlag from '@/assets/countryFlags/straight/southKoreaFlag.svg';
import ItalyFlag from '@/assets/countryFlags/straight/italyFlag.svg';
import RussiaFlag from '@/assets/countryFlags/straight/russiaFlag.svg';
import SaudiArabiaFlag from '@/assets/countryFlags/straight/saudiArabiaFlag.svg';
import IndiaFlag from '@/assets/countryFlags/straight/indiaFlag.svg';
import IndonesiaFlag from '@/assets/countryFlags/straight/indonesiaFlag.svg';
import MalaysiaFlag from '@/assets/countryFlags/straight/malaysiaFlag.svg';
import ThailandFlag from '@/assets/countryFlags/straight/thailandFlag.svg';
import VietnamFlag from '@/assets/countryFlags/straight/vietnamFlag.svg';
import TurkeyFlag from '@/assets/countryFlags/straight/turkeyFlag.svg';
import NetherlandsFlag from '@/assets/countryFlags/straight/netherlandsFlag.svg';
import PolandFlag from '@/assets/countryFlags/straight/polandFlag.svg';
import SwedenFlag from '@/assets/countryFlags/straight/swedenFlag.svg';
import PhilippinesFlag from '@/assets/countryFlags/straight/philippinesFlag.svg';
import BangladeshFlag from '@/assets/countryFlags/straight/bangladeshFlag.svg';
import UkraineFlag from '@/assets/countryFlags/straight/ukraineFlag.svg';
import HungaryFlag from '@/assets/countryFlags/straight/hungaryFlag.svg';
import IranFlag from '@/assets/countryFlags/straight/iranFlag.svg';
import KenyaFlag from '@/assets/countryFlags/straight/kenyaFlag.svg';
import GreeceFlag from '@/assets/countryFlags/straight/greeceFlag.svg';
import IsraelFlag from '@/assets/countryFlags/straight/israelFlag.svg';
import CzechFlag from '@/assets/countryFlags/straight/czechFlag.svg';
import FinlandFlag from '@/assets/countryFlags/straight/finlandFlag.svg';
import NorwayFlag from '@/assets/countryFlags/straight/norwayFlag.svg';
import SouthAfricaFlag from '@/assets/countryFlags/straight/southafricaFlag.svg';
import RomaniaFlag from '@/assets/countryFlags/straight/romaniaFlag.svg';

const { height } = Dimensions.get('window');

// Picker constants
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 7;
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2);

// Function to get flag component with platform-specific sizing
const getFlagComponent = (languageKey: string) => {
  const flagProps = Platform.OS === 'android' 
    ? { width: 28, height: 20, style: { marginRight: 6 } } // Smaller flags for Android
    : { width: 32, height: 24, style: { marginRight: 8 } }; // Original size for iOS

  switch (languageKey) {
    case 'English': return <UsaFlag {...flagProps} />;
    case 'Chinese': return <ChinaFlag {...flagProps} />;
    case 'Spanish': return <SpainFlag {...flagProps} />;
    case 'French': return <FranceFlag {...flagProps} />;
    case 'German': return <GermanyFlag {...flagProps} />;
    case 'Portuguese': return <PortugalFlag {...flagProps} />;
    case 'Japanese': return <JapanFlag {...flagProps} />;
    case 'Korean': return <SouthKoreaFlag {...flagProps} />;
    case 'Italian': return <ItalyFlag {...flagProps} />;
    case 'Russian': return <RussiaFlag {...flagProps} />;
    case 'Arabic': return <SaudiArabiaFlag {...flagProps} />;
    case 'Hindi': return <IndiaFlag {...flagProps} />;
    case 'Indonesian': return <IndonesiaFlag {...flagProps} />;
    case 'Malay': return <MalaysiaFlag {...flagProps} />;
    case 'Thai': return <ThailandFlag {...flagProps} />;
    case 'Vietnamese': return <VietnamFlag {...flagProps} />;
    case 'Turkish': return <TurkeyFlag {...flagProps} />;
    case 'Dutch': return <NetherlandsFlag {...flagProps} />;
    case 'Polish': return <PolandFlag {...flagProps} />;
    case 'Swedish': return <SwedenFlag {...flagProps} />;
    case 'Tagalog': return <PhilippinesFlag {...flagProps} />;
    case 'Bengali': return <BangladeshFlag {...flagProps} />;
    case 'Ukrainian': return <UkraineFlag {...flagProps} />;
    case 'Hungarian': return <HungaryFlag {...flagProps} />;
    case 'Farsi': return <IranFlag {...flagProps} />;
    case 'Swahili': return <KenyaFlag {...flagProps} />;
    case 'Greek': return <GreeceFlag {...flagProps} />;
    case 'Hebrew': return <IsraelFlag {...flagProps} />;
    case 'Czech': return <CzechFlag {...flagProps} />;
    case 'Finnish': return <FinlandFlag {...flagProps} />;
    case 'Norwegian': return <NorwayFlag {...flagProps} />;
    case 'Afrikaans': return <SouthAfricaFlag {...flagProps} />;
    case 'Romanian': return <RomaniaFlag {...flagProps} />;
    case 'Tamil': return <IndiaFlag {...flagProps} />;
    default: return null;
  }
};

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
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Platform-specific animated styles
  const animatedStyles = React.useMemo(() => {
    return languages.map((_, index) => {
      if (Platform.OS === 'android') {
        // Simplified animations for Android performance
        const inputRange = [
          (index - 1) * ITEM_HEIGHT,
          index * ITEM_HEIGHT,
          (index + 1) * ITEM_HEIGHT,
        ];
        
        const opacity = scrollY.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        
        const scale = scrollY.interpolate({
          inputRange,
          outputRange: [0.8, 1, 0.8],
          extrapolate: 'clamp',
        });
        
        return { transform: [{ scale }], opacity };
      } else {
        // Original complex animations for iOS
        const inputRange = [
          (index - 2) * ITEM_HEIGHT,
          (index - 1) * ITEM_HEIGHT,
          index * ITEM_HEIGHT,
          (index + 1) * ITEM_HEIGHT,
          (index + 2) * ITEM_HEIGHT,
        ];
        
        const opacity = scrollY.interpolate({
          inputRange,
          outputRange: [0.25, 0.5, 1, 0.5, 0.25],
          extrapolate: 'clamp',
        });
        
        const scale = scrollY.interpolate({
          inputRange,
          outputRange: [0.3, 0.6, 1, 0.6, 0.3],
          extrapolate: 'clamp',
        });
        
        return { transform: [{ scale }], opacity };
      }
    });
  }, [languages.length, scrollY]);

  const pickerProps = Platform.OS === 'android' ? { 
    nestedScrollEnabled: true,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
  } : {};
  const pickerStyles = createLanguagePickerStyles();
  
  // Memoized text styles for better performance
  const getTextStyles = React.useCallback((languageKey: string) => {
    const isBahasaIndonesia = languageKey === 'Indonesian';
    const shouldUseSmallerFont = isBahasaIndonesia;
    
    return {
      color: Colors.light.text,
      fontWeight: 'bold' as const,
      fontSize: shouldUseSmallerFont ? 24 : 28, // Smaller font for Bahasa Indonesia on iOS
      textAlign: 'center' as const,
      fontFamily: Fonts.bodyMedium,
    };
  }, []);
  
  // Memoized container styles for better performance
  const containerStyles = React.useMemo(() => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: ITEM_HEIGHT,
  }), []);

  return (
    <View style={pickerStyles.container}>
      {/* Overlay highlight with triangles and center rectangle */}
      <View pointerEvents="none" style={pickerStyles.centerHighlight}>
        {/* Left triangle (pointing left) */}
        <View style={pickerStyles.leftTriangle}>
          <Svg width="12" height="12" viewBox="0 0 12 12">
            <Polygon
              points="12,6 0,0 0,12"
              fill={Colors.light.text}
            />
          </Svg>
        </View>
        
        {/* Center rounded rectangle */}
        <View style={pickerStyles.centerRectangle}>
        </View>
        
        {/* Right triangle (pointing right) */}
        <View style={pickerStyles.rightTriangle}>
          <Svg width="12" height="12" viewBox="0 0 12 12">
            <Polygon
              points="0,6 12,0 12,12"
              fill={Colors.light.text}
            />
          </Svg>
        </View>
      </View>
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
            
            // Debounce for Android to prevent excessive updates
            if (Platform.OS === 'android') {
              if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
              }
              debounceTimeoutRef.current = setTimeout(() => {
                setSelectedLanguage(languages[idx].key);
                (scrollRef.current as any)?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
              }, 50);
            } else {
              setSelectedLanguage(languages[idx].key);
              (scrollRef.current as any)?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
            }
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={Platform.OS === 'android' ? 16 : 8}
          {...pickerProps}
        >
          {languages.map((language, index) => (
            <Animated.View 
              key={language.key} 
              style={[
                animatedStyles[index],
                containerStyles
              ]}
            >
              {getFlagComponent(language.key)}
              <Text style={getTextStyles(language.key)}>
                {language.label}
              </Text>
            </Animated.View>
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
    zIndex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  centerRectangle: {
    flex: 1,
    height: ITEM_HEIGHT, // Slightly smaller than full height
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Subtle dark background
    borderRadius: 30, // Rounded rectangle
    marginHorizontal: 0, // Space from triangles
  },
  leftTriangle: {
    position: 'absolute',
    left: 0, // Zero margin from left edge
    top: '50%',
    marginTop: -6,
    zIndex: 1,
  },
  rightTriangle: {
    position: 'absolute',
    right: 0, // Zero margin from right edge
    top: '50%',
    marginTop: -6,
    zIndex: 1,
  },
});

export default function LanguageSelector({ 
  initialLanguage = 'English', 
  onLanguageChange 
}: LanguageSelectorProps) {
  // Available languages - sorted alphabetically by label
  const availableLanguages = [
    { key: 'Afrikaans', label: 'Afrikaans' },
    { key: 'Arabic' as const, label: 'العربية' },
    { key: 'Bengali', label: 'বাংলা' },
    { key: 'Chinese' as const, label: '中文' },
    { key: 'Czech' as const, label: 'Čeština' },
    { key: 'Dutch' as const, label: 'Nederlands' },
    { key: 'English' as const, label: 'English' },
    { key: 'Farsi', label: 'فارسی' },
    { key: 'Finnish', label: 'Suomi' },
    { key: 'French' as const, label: 'Français' },
    { key: 'German' as const, label: 'Deutsch' },
    { key: 'Greek' as const, label: 'Ελληνικά' },
    { key: 'Hebrew' as const, label: 'עברית' },
    { key: 'Hindi' as const, label: 'हिन्दी' },
    { key: 'Hungarian', label: 'Magyar' },
    { key: 'Indonesian' as const, label: 'Bahasa Indonesia' },
    { key: 'Italian' as const, label: 'Italiano' },
    { key: 'Japanese' as const, label: '日本語' },
    { key: 'Korean' as const, label: '한국어' },
    { key: 'Malay' as const, label: 'Bahasa Melayu' },
    { key: 'Norwegian', label: 'Norsk' },
    { key: 'Polish' as const, label: 'Polski' },
    { key: 'Portuguese' as const, label: 'Português' },
    { key: 'Romanian', label: 'Română' },
    { key: 'Russian' as const, label: 'Русский' },
    { key: 'Spanish' as const, label: 'Español' },
    { key: 'Swahili', label: 'Kiswahili' },
    { key: 'Swedish' as const, label: 'Svenska' },
    { key: 'Tagalog' as const, label: 'Tagalog' },
    { key: 'Tamil', label: 'தமிழ்' },
    { key: 'Thai' as const, label: 'ภาษาไทย' },
    { key: 'Turkish' as const, label: 'Türkçe' },
    { key: 'Ukrainian', label: 'Українська' },
    { key: 'Vietnamese' as const, label: 'Tiếng Việt' },
  ].sort((a, b) => a.label.localeCompare(b.label));

  const handleLanguageChange = (languageKey: string) => {
    onLanguageChange && onLanguageChange(languageKey);
  };

  return (
    <View style={styles.languageSelectionContainer}>
      {/* White rectangle container - same as login/sign-up */}
      <View style={styles.whiteContainer}>
        <Text style={styles.languageSelectionTitle}>Choose Language</Text>
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
    width: '85%', // Increased from 70% to 85% of screen width
    height: height * 0.6, // 60% of screen height
    borderRadius: 30, // 30px corner radius
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // White background with 60% opacity
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
