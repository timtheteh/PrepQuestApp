import React, { useContext, useCallback, useMemo, memo } from 'react';
import { StyleSheet, Animated, View, Text } from 'react-native';
import { InterviewStudyToggle } from './InterviewStudyToggle';
import { AddDeckModalButton } from './AddDeckModalButton';
import { useRouter } from 'expo-router';
import { MenuContext } from '@/contexts/MenuContext';
import { useLanguage } from '@/contexts/LanguageContext';
import GenAIFormIcon from '@/assets/icons/addDeckIcons/genAIFormIcon.svg';
import FileUploadIcon from '@/assets/icons/addDeckIcons/fileUploadIcon.svg';
import YoutubeIcon from '@/assets/icons/addDeckIcons/youtubeIcon.svg';
import ManualFormIcon from '@/assets/icons/addDeckIcons/manualFormIcon.svg';
import { strings } from '@/constants/strings';
import { useColorScheme } from '@/hooks/useColorScheme';
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

function AddDeckModalComponent({ 
  visible,
  opacity = new Animated.Value(0),
  currentMode,
  isInFavoritesPage = false,
  isInViewFlashcardsPage = false,
  isInViewDecksInFolderPage = false,
  deckId,
  folderId,
  deckType
}: AddDeckModalProps) {
  const { setCurrentMode, handleDismissMenu } = useContext(MenuContext);
  const router = useRouter();
  const { language } = useLanguage();
  const colorScheme = useColorScheme();

  // Memoize parameter building logic to avoid duplication
  const buildNavigationParams = useCallback((pathname: '/genAIForm' | '/fileUploadPage' | '/youtubeLink' | '/manualAddDeck') => {
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
  }, [currentMode, isInViewFlashcardsPage, isInViewDecksInFolderPage, isInFavoritesPage, deckId, deckType, folderId]);

  // Memoize handler functions to prevent unnecessary re-renders
  const handleToggle = useCallback((mode: 'study' | 'interview') => {
    setCurrentMode(mode);
  }, [setCurrentMode]);

  const handleGenAIFormPress = useCallback(() => {
    handleDismissMenu();
    const { pathname, params } = buildNavigationParams('/genAIForm');
    router.push({ pathname, params });
  }, [handleDismissMenu, buildNavigationParams, router]);

  const handleFormUploadPagePress = useCallback(() => {
    handleDismissMenu();
    const { pathname, params } = buildNavigationParams('/fileUploadPage');
    router.push({ pathname, params });
  }, [handleDismissMenu, buildNavigationParams, router]);

  const handleYoutubeLinkPress = useCallback(() => {
    handleDismissMenu();
    const { pathname, params } = buildNavigationParams('/youtubeLink');
    router.push({ pathname, params });
  }, [handleDismissMenu, buildNavigationParams, router]);

  const handleManualPress = useCallback(() => {
    const { pathname, params } = buildNavigationParams('/manualAddDeck');
    router.push({ pathname, params });
    handleDismissMenu();
  }, [buildNavigationParams, router, handleDismissMenu]);

  // Memoize styles to prevent object recreation
  const containerStyle = useMemo(() => [
    styles.container,
    {
      opacity: opacity,
      borderColor: isInViewFlashcardsPage 
        ? Colors[colorScheme ?? 'light'].brandColor1 
        : Colors[colorScheme ?? 'light'].brandColor2,
      backgroundColor: Colors[colorScheme ?? 'light'].background,
    }
  ], [opacity, isInViewFlashcardsPage, colorScheme]);

  // Memoize conditional rendering logic
  const titleContent = useMemo(() => {
    const themeColors = Colors[colorScheme ?? 'light'];
    
    if (isInViewFlashcardsPage) {
      return (
        <Text style={[styles.title, { 
          fontSize: 28, 
          fontFamily: Fonts.title,
          color: themeColors.text
        }]}>{strings[language].addFlashcardsToDeck}</Text>
      );
    }
    
    return (
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
    );
  }, [isInViewFlashcardsPage, isInFavoritesPage, isInViewDecksInFolderPage, language, colorScheme]);

  const toggleContent = useMemo(() => {
    if (isInViewFlashcardsPage) {
      return <View style={{ height: 35 }} />;
    }
    
    return (
      <View style={styles.toggleRow}>
        <InterviewStudyToggle 
          initialState={currentMode}
          onToggle={handleToggle}
          isInViewFlashcardsPage={isInViewFlashcardsPage}
        />
      </View>
    );
  }, [isInViewFlashcardsPage, currentMode, handleToggle]);

  // Early return after all hooks have been called
  if (!visible) return null;

  return (
    <Animated.View style={containerStyle}>
      <View style={styles.content}>
        <View style={styles.column}>
          <View style={styles.titleRow}>
            {titleContent}
          </View>
          {toggleContent}
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
}

// Export the component directly (temporarily removing memo to debug)
export const AddDeckModal = AddDeckModalComponent;

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
    borderWidth: 1,
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