import React, { useState, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal, Dimensions, ScrollView } from 'react-native';
import { CircleIconButton } from '../general/CircleIconButton';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { Fonts } from '@/constants/Fonts';
import { Colors } from '@/constants/Colors';

interface FlashcardViewTopBarProps {
  onAudioPress?: () => void;
  onCopyPress?: () => void;
  onTrashPress?: () => void;
  isCopyButtonEnabled?: boolean;
  isAudioButtonEnabled?: boolean;
  isSpeechPlaying?: boolean;
  isSpeechPaused?: boolean;
  answerType?: string;
  voiceLanguage?: string;
  onVoiceLanguageChange?: (language: string) => void;
}

export const FlashcardViewTopBar = ({
  onAudioPress,
  onCopyPress,
  onTrashPress,
  isCopyButtonEnabled = true,
  isAudioButtonEnabled = true,
  isSpeechPlaying = false,
  isSpeechPaused = false,
  answerType,
  voiceLanguage = 'English',
  onVoiceLanguageChange,
}: FlashcardViewTopBarProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const colors = Colors[theme];
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const availableLanguages = useMemo(() => [
    { key: 'Afrikaans', label: 'Afrikaans' },
    { key: 'Arabic', label: 'العربية' },
    { key: 'Bengali', label: 'বাংলা' },
    { key: 'Chinese', label: '中文' },
    { key: 'Czech', label: 'Čeština' },
    { key: 'Dutch', label: 'Nederlands' },
    { key: 'English', label: 'English' },
    { key: 'Farsi', label: 'فارسی' },
    { key: 'Finnish', label: 'Suomi' },
    { key: 'French', label: 'Français' },
    { key: 'German', label: 'Deutsch' },
    { key: 'Greek', label: 'Ελληνικά' },
    { key: 'Hebrew', label: 'עברית' },
    { key: 'Hindi', label: 'हिन्दी' },
    { key: 'Hungarian', label: 'Magyar' },
    { key: 'Indonesian', label: 'Bahasa Indonesia' },
    { key: 'Italian', label: 'Italiano' },
    { key: 'Japanese', label: '日本語' },
    { key: 'Korean', label: '한국어' },
    { key: 'Malay', label: 'Bahasa Melayu' },
    { key: 'Norwegian', label: 'Norsk' },
    { key: 'Polish', label: 'Polski' },
    { key: 'Portuguese', label: 'Português' },
    { key: 'Romanian', label: 'Română' },
    { key: 'Russian', label: 'Русский' },
    { key: 'Spanish', label: 'Español' },
    { key: 'Swahili', label: 'Kiswahili' },
    { key: 'Swedish', label: 'Svenska' },
    { key: 'Tagalog', label: 'Tagalog' },
    { key: 'Tamil', label: 'தமிழ்' },
    { key: 'Thai', label: 'ภาษาไทย' },
    { key: 'Turkish', label: 'Türkçe' },
    { key: 'Ukrainian', label: 'Українська' },
    { key: 'Vietnamese', label: 'Tiếng Việt' },
  ].sort((a, b) => a.label.localeCompare(b.label)), []);

  const renderAudioIcon = (color: string) => {
    if (isSpeechPlaying && !isSpeechPaused) {
      return <FontAwesome6 name="volume-xmark" size={20} color="#FF3B30" />;
    }
    return <MaterialIcons name="volume-up" size={20} color={color} />;
  };

  // Handle voice language selection for speech-to-text
  // NOTE: This changes the language used for speech-to-text detection ONLY,
  // NOT the app's UI language (which is managed by LanguageContext)
  // TODO: Add functionality to use selected language for speech-to-text detection
  const handleLanguageSelect = (selectedLanguage: string) => {
    if (onVoiceLanguageChange) {
      onVoiceLanguageChange(selectedLanguage);
    }
    setIsLanguageModalOpen(false);
  };

  // Get current language display label
  const currentLanguageLabel = availableLanguages.find(l => l.key === voiceLanguage)?.label || voiceLanguage;

  const isVoiceAnswerType = answerType === 'voice';

  return (
    <>
      <View style={styles.container}>
        {/* Language selector - only shown for voice answer type */}
        {isVoiceAnswerType && (
          <TouchableOpacity 
            style={[
              styles.languageSelector, 
              { 
                backgroundColor: colors.secondaryShade,
              }
            ]}
            onPress={() => setIsLanguageModalOpen(true)}
          >
            <MaterialIcons name="language" size={18} color={colors.normalIconColor} />
            <Text style={{ color: colors.text, fontSize: 14, fontFamily: Fonts.bodyBold }} numberOfLines={1}>
              {currentLanguageLabel}
            </Text>
            <AntDesign name="down" size={14} color={colors.unselectedText} />
          </TouchableOpacity>
        )}
        
        <CircleIconButton
          onPress={onAudioPress}
          disabled={!isAudioButtonEnabled}
          renderCustomIcon={renderAudioIcon}
        />
        <CircleIconButton
          onPress={isCopyButtonEnabled ? onCopyPress : undefined}
          disabled={!isCopyButtonEnabled}
          renderCustomIcon={(color) => <MaterialIcons name="content-copy" size={20} color={color} />}
        />
        <CircleIconButton
          color="#FF3B30"
          onPress={onTrashPress}
          renderCustomIcon={(color) => <Ionicons name="trash" size={20} color={color} />}
        />
      </View>

      {/* Language selection modal - same as appSettings */}
      <Modal
        visible={isLanguageModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguageModalOpen(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} 
          activeOpacity={1} 
          onPressOut={() => setIsLanguageModalOpen(false)}
        >
          <View style={{ 
            position: 'absolute', 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: colors.background, 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            paddingTop: 12,
            paddingBottom: 24,
            maxHeight: Dimensions.get('window').height * 0.6,
            minHeight: 440, // Height to show 5 languages comfortably (5 * 60px + title + cancel button + padding)
          }}>
            <Text style={{ 
              fontSize: 32, 
              fontFamily: Fonts.title, 
              color: colors.text, 
              textAlign: 'left', 
              marginBottom: 16,
              paddingHorizontal: 24,
            }}>
              {strings[language]?.appSettingsPage?.selectVoiceLanguage || strings.English.appSettingsPage.selectVoiceLanguage}
            </Text>
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              showsVerticalScrollIndicator={true}
            >
              {availableLanguages.map((lang) => (
                <TouchableOpacity 
                  key={lang.key}
                  style={{ 
                    paddingVertical: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.unselectedText + '20',
                  }} 
                  onPress={() => handleLanguageSelect(lang.key)}
                >
                  <Text style={{ 
                    fontFamily: Fonts.bodyBold, 
                    fontSize: 20, 
                    color: voiceLanguage === lang.key ? colors.brandColor1 : colors.text, 
                    textAlign: 'center' 
                  }}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={{ 
                marginTop: 16, 
                alignSelf: 'center',
                paddingVertical: 12,
                paddingHorizontal: 32,
              }} 
              onPress={() => setIsLanguageModalOpen(false)}
            >
              <Text style={{ 
                color: colors.brandColor2, 
                fontSize: 20, 
                fontFamily: Fonts.bodyMedium 
              }}>
                {strings[language].cancel}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 23,
    gap: 6,
    width: 125,
    minWidth: 125,
    maxWidth: 125,
    height: 46,
  },
}); 