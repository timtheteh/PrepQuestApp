import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal } from 'react-native';
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
              {strings[language].appSettingsPage.languages[voiceLanguage.toLowerCase()]}
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
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setIsLanguageModalOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.bodyBold }]}>
              {strings[language].appSettingsPage.selectVoiceLanguage || 'Select Voice Input Language'}
            </Text>
            {Object.entries(strings[language].appSettingsPage.languages).map(([langKey, langName]) => (
              <TouchableOpacity 
                key={langKey}
                style={styles.languageOption} 
                onPress={() => handleLanguageSelect(langKey.charAt(0).toUpperCase() + langKey.slice(1))}
              >
                <Text style={{ 
                  fontFamily: Fonts.bodyBold, 
                  fontSize: 20, 
                  color: voiceLanguage.toLowerCase() === langKey ? colors.brandColor1 : colors.text, 
                  textAlign: 'center' 
                }}>
                  {langName as string}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setIsLanguageModalOpen(false)}
            >
              <Text style={{ 
                color: colors.brandColor2, 
                fontSize: 18, 
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  languageOption: {
    paddingVertical: 16,
  },
  cancelButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
}); 