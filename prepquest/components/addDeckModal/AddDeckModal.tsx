import React, { useContext } from 'react';
import { StyleSheet, Animated, View, Text } from 'react-native';
import { InterviewStudyToggle } from './InterviewStudyToggle';
import { AddDeckModalButton } from './AddDeckModalButton';
import { useRouter } from 'expo-router';
import { MenuContext } from '@/contexts/MenuContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import GenAIFormIcon from '@/assets/icons/addDeckIcons/genAIFormIcon.svg';
import FileUploadIcon from '@/assets/icons/addDeckIcons/fileUploadIcon.svg';
import YoutubeIcon from '@/assets/icons/addDeckIcons/youtubeIcon.svg';
import ManualFormIcon from '@/assets/icons/addDeckIcons/manualFormIcon.svg';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface AddDeckModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  currentMode: 'study' | 'interview';
  isInFavoritesPage?: boolean;
  isInViewFlashcardsPage?: boolean;
  isInViewDecksInFolderPage?: boolean;
  deckId?: string;
  folderId?: string;
  deckType?: string;
}

export const AddDeckModal = ({ 
  visible,
  opacity = new Animated.Value(0),
  currentMode,
  isInFavoritesPage = false,
  isInViewFlashcardsPage = false,
  isInViewDecksInFolderPage = false,
  deckId,
  folderId,
  deckType
}: AddDeckModalProps) => {
  const { setCurrentMode, handleDismissMenu } = useContext(MenuContext);
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const themeColors = Colors[theme];

  const buildNavigationParams = (pathname: '/genAIForm' | '/fileUploadPage' | '/youtubeLink' | '/manualAddDeck') => {
    const params: any = { mode: currentMode };
    
    if (isInViewFlashcardsPage && deckId) {
      params.deckId = deckId;
      params.isInViewFlashcardsPage = true;
    }
    if (isInViewFlashcardsPage && deckType) {
      params.mode = deckType;
      params.isInViewFlashcardsPage = true;
    }
    if (isInViewDecksInFolderPage && folderId) {
      params.folderId = folderId;
      params.isInViewDecksInFolderPage = true;
    }
    if (isInFavoritesPage) {
      params.isInFavoritesPage = true;
    }
    if (!isInViewFlashcardsPage && !isInViewDecksInFolderPage && !isInFavoritesPage) {
      params.isInIndexPage = true;
    }
    
    return { pathname, params };
  };

  const handleToggle = (mode: 'study' | 'interview') => {
    setCurrentMode(mode);
  };

  const handleGenAIFormPress = () => {
    handleDismissMenu();
    const { pathname, params } = buildNavigationParams('/genAIForm');
    router.push({ pathname, params });
  };

  const handleFormUploadPagePress = () => {
    handleDismissMenu();
    const { pathname, params } = buildNavigationParams('/fileUploadPage');
    router.push({ pathname, params });
  };

  const handleYoutubeLinkPress = () => {
    handleDismissMenu();
    const { pathname, params } = buildNavigationParams('/youtubeLink');
    router.push({ pathname, params });
  };

  const handleManualPress = () => {
    const { pathname, params } = buildNavigationParams('/manualAddDeck');
    router.push({ pathname, params });
    handleDismissMenu();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: opacity,
        borderColor: isInViewFlashcardsPage 
          ? themeColors.brandColor1 
          : themeColors.brandColor2,
        backgroundColor: themeColors.background,
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.column}>
          <View style={styles.titleRow}>
            {isInViewFlashcardsPage ? (
              <Text style={[styles.title, { 
                fontSize: 28, 
                fontFamily: Fonts.title,
                color: themeColors.text
              }]}>{strings[language].addFlashcardsToDeck}</Text>
            ) : (
              <Text style={[styles.title, { 
                fontFamily: Fonts.title, 
                fontSize: 32,
                color: themeColors.text
              }]}>
                {isInFavoritesPage
                  ? strings[language].addDeckToFavorites
                  : isInViewDecksInFolderPage
                    ? strings[language].addDeckToFolder
                    : strings[language].addDeck}
              </Text>
            )}
          </View>
          
          {isInViewFlashcardsPage ? (
            <View style={{ height: 35 }} />
          ) : (
            <View style={styles.toggleRow}>
              <InterviewStudyToggle 
                initialState={currentMode}
                onToggle={handleToggle}
                isInViewFlashcardsPage={isInViewFlashcardsPage}
              />
            </View>
          )}
          
          <View style={styles.firstButtonRow}>
            <AddDeckModalButton
              title={strings[language].genAIForm}
              Icon={GenAIFormIcon}
              onPress={handleGenAIFormPress}
              isInViewFlashcardsPage={isInViewFlashcardsPage}
            />
            <AddDeckModalButton
              title={strings[language].fileUpload}
              Icon={FileUploadIcon}
              marginBottom={3}
              onPress={handleFormUploadPagePress}
              isInViewFlashcardsPage={isInViewFlashcardsPage}
            />
          </View>
          <View style={styles.buttonRow}>
            <AddDeckModalButton
              title={strings[language].youtubeLink}
              Icon={YoutubeIcon}
              onPress={handleYoutubeLinkPress}
              isInViewFlashcardsPage={isInViewFlashcardsPage}
            />
            <AddDeckModalButton
              title={strings[language].manual}
              Icon={ManualFormIcon}
              isInViewFlashcardsPage={isInViewFlashcardsPage}
              marginBottom={6}
              onPress={handleManualPress}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: '50%',
    width: '85%',
    height: 388,
    marginLeft: '-42.5%', // Half of width
    borderRadius: 30,
    borderWidth: 10,
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  content: {
    flex: 1,
    paddingVertical: 12,
  },
  column: {
    flex: 1,
    flexDirection: 'column',

  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: 32,
    textAlign: 'center',
  },
  toggleRow: {
    alignItems: 'center',
    marginVertical: 8,
    paddingLeft: 8,
  },
  firstButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
    paddingHorizontal: 6
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 24,
    paddingHorizontal: 6
  },
}); 