import { View, StyleSheet, Platform , Animated } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { NavBar, NavBarRef } from '@/components/general/NavBar';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { SlidingMenu } from '@/components/general/SlidingMenu';
import { AIPromptModal } from '@/components/AIDecks/AIPromptModal';
import { AddDeckModal } from '@/components/addDeckModal/AddDeckModal';
import { GenericModal } from '@/components/modals/GenericModal';
import { MenuContext } from '@/contexts/MenuContext';
import { useState, useRef, useCallback, RefObject, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import ModalExclamationMarkIcon from '@/assets/icons/generalIcons/modalExclamationMarkIcon.svg';

export default function TabLayout() {
  const navbarRef = useRef<NavBarRef>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSlidingMenu, setShowSlidingMenu] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isAddDeckOpen, setIsAddDeckOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'study' | 'interview'>('study');
  const [isTrashModalOpenInDecksPage, setIsTrashModalOpenInDecksPage] = useState(false);
  const [isNoSelectionModalOpen, setIsNoSelectionModalOpen] = useState(false);
  const [handleDeletion, setHandleDeletion] = useState<(() => void) | null>(null);
  const [isAddToFoldersModalOpen, setIsAddToFoldersModalOpen] = useState(false);
  const [isMoveToFoldersModalOpen, setIsMoveToFoldersModalOpen] = useState(false);
  const [isInFavoritesPage, setIsInFavoritesPage] = useState(false);
  const [isInFoldersPage, setIsInFoldersPage] = useState(false);
  const [isInViewFlashcardsPage, setIsInViewFlashcardsPage] = useState(false);
  const [isInViewDecksInFolderPage, setIsInViewDecksInFolderPage] = useState(false);
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateX = useRef(new Animated.Value(-171)).current;
  const aiPromptOpacity = useRef(new Animated.Value(0)).current;
  const addDeckOpacity = useRef(new Animated.Value(0)).current;
  const trashModalOpacity = useRef(new Animated.Value(0)).current;
  const noSelectionModalOpacity = useRef(new Animated.Value(0)).current;
  const addToFoldersModalOpacity = useRef(new Animated.Value(0)).current;
  const moveToFoldersModalOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const [sourcePageForFolders, setSourcePageForFolders] = useState('');
  const [currentDeckId, setCurrentDeckId] = useState<string | undefined>();
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [currentFolderTitle, setCurrentFolderTitle] = useState<string | undefined>();
  const [currentSourcePage, setCurrentSourcePage] = useState<string | undefined>();
  const [currentDeckType, setCurrentDeckType] = useState<string | undefined>();
  const [isUnfavoriteModalOpen, setIsUnfavoriteModalOpen] = useState(false);
  const [unfavoriteModalText, setUnfavoriteModalText] = useState('');
  const unfavoriteModalOpacity = useRef(new Animated.Value(0)).current;
  const [isSubmitCustomFormModalOpen, setIsSubmitCustomFormModalOpen] = useState(false);
  const submitCustomFormModalOpacity = useRef(new Animated.Value(0)).current;
  const [onSubmitCustomFormModalClose, setOnSubmitCustomFormModalClose] = useState<(() => void) | null>(null);
  const [isDeckDetailsDeleteModalOpen, setIsDeckDetailsDeleteModalOpen] = useState(false);
  const deckDetailsDeleteModalOpacity = useRef(new Animated.Value(0)).current;
  const [handleDeckDetailsDeletion, setHandleDeckDetailsDeletion] = useState<(() => void) | null>(null);
  const [onDeckDetailsDeleteModalDismiss, setOnDeckDetailsDeleteModalDismiss] = useState<(() => void) | null>(null);
  const [isDeckDetailsSaveModalOpen, setIsDeckDetailsSaveModalOpen] = useState(false);
  const deckDetailsSaveModalOpacity = useRef(new Animated.Value(0)).current;
  const [onDeckDetailsSaveModalDismiss, setOnDeckDetailsSaveModalDismiss] = useState<(() => void) | null>(null);
  const [deckDetailsSaveModalType, setDeckDetailsSaveModalType] = useState<'add' | 'move' | 'ai'>('add');
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const deleteFolderModalOpacity = useRef(new Animated.Value(0)).current;
  const [handleDeleteFolder, setHandleDeleteFolder] = useState<(() => void) | null>(null);
  const [handleUnfavorite, setHandleUnfavorite] = useState<(() => void) | null>(null);
  const [isDecksAlreadyInFoldersModalOpen, setIsDecksAlreadyInFoldersModalOpen] = useState(false);
  const decksAlreadyInFoldersModalOpacity = useRef(new Animated.Value(0)).current;
  const slidingMenuDuration = 300;
  const overlayDuration = 200;
  const { language } = useLanguage();

  // Memoize animation configurations to prevent recreation on every render
  const animationConfigs = useMemo(() => ({
    overlay: {
      toValue: 0,
      duration: overlayDuration,
      useNativeDriver: true,
    },
    slidingMenu: {
      toValue: 0,
      duration: slidingMenuDuration,
      useNativeDriver: true,
    },
    menuTranslate: {
      toValue: -171,
      duration: slidingMenuDuration,
      useNativeDriver: true,
    }
  }), [overlayDuration, slidingMenuDuration]);

  const handleDismissMenu = useCallback(() => {
    if (isAIPromptOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(aiPromptOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAIPromptOpen(false);
      });
    } else if (isAddDeckOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(addDeckOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAddDeckOpen(false);
      });
    } else if (isTrashModalOpenInDecksPage) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(trashModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsTrashModalOpenInDecksPage(false);
      });
    } else if (isNoSelectionModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(noSelectionModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsNoSelectionModalOpen(false);
      });
    } else if (isAddToFoldersModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(addToFoldersModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAddToFoldersModalOpen(false);
      });
    } else if (isMoveToFoldersModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(moveToFoldersModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsMoveToFoldersModalOpen(false);
      });
    } else if (isUnfavoriteModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(unfavoriteModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsUnfavoriteModalOpen(false);
      });
    } else if (isSubmitCustomFormModalOpen) {
      if (onSubmitCustomFormModalClose) {
        onSubmitCustomFormModalClose();
        setOnSubmitCustomFormModalClose(null);
      }
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(submitCustomFormModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsSubmitCustomFormModalOpen(false);
      });
    } else if (isDeckDetailsDeleteModalOpen) {
      if (onDeckDetailsDeleteModalDismiss) {
        onDeckDetailsDeleteModalDismiss();
        setOnDeckDetailsDeleteModalDismiss(null);
      }
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(deckDetailsDeleteModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDeckDetailsDeleteModalOpen(false);
      });
    } else if (isDeckDetailsSaveModalOpen) {
      if (onDeckDetailsSaveModalDismiss) {
        onDeckDetailsSaveModalDismiss();
        setOnDeckDetailsSaveModalDismiss(null);
      }
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(deckDetailsSaveModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDeckDetailsSaveModalOpen(false);
      });
    } else if (isDeleteFolderModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(deleteFolderModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDeleteFolderModalOpen(false);
      });
    } else if (isDecksAlreadyInFoldersModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.overlay),
        Animated.timing(decksAlreadyInFoldersModalOpacity, animationConfigs.overlay)
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDecksAlreadyInFoldersModalOpen(false);
      });
    } else if (showSlidingMenu) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, animationConfigs.slidingMenu),
        Animated.timing(menuTranslateX, animationConfigs.menuTranslate)
      ]).start(() => {
        setIsMenuOpen(false);
        setShowSlidingMenu(false);
      });
    } else {
      Animated.timing(menuOverlayOpacity, animationConfigs.slidingMenu).start(() => {
        setIsMenuOpen(false);
      });
    }
  }, [showSlidingMenu, 
    isAIPromptOpen, 
    isAddDeckOpen, 
    isTrashModalOpenInDecksPage, 
    isNoSelectionModalOpen, 
    isAddToFoldersModalOpen, 
    isUnfavoriteModalOpen, 
    isSubmitCustomFormModalOpen, 
    onSubmitCustomFormModalClose, 
    isDeckDetailsDeleteModalOpen, 
    onDeckDetailsDeleteModalDismiss, 
    isDeckDetailsSaveModalOpen, 
    onDeckDetailsSaveModalDismiss,
    isDeleteFolderModalOpen,
    isDecksAlreadyInFoldersModalOpen,
    animationConfigs]);

  const handleFolderPress = useCallback(() => {
    handleDismissMenu();
    navbarRef.current?.resetAnimation();
  }, [handleDismissMenu]);

  // Memoize the MenuContext value to prevent unnecessary re-renders of consuming components
  const menuContextValue = useMemo(() => ({ 
    isMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setIsMenuOpen,
    handleDismissMenu,
    showSlidingMenu,
    setShowSlidingMenu,
    isAIPromptOpen,
    setIsAIPromptOpen,
    aiPromptOpacity,
    isAddDeckOpen,
    setIsAddDeckOpen,
    addDeckOpacity,
    currentMode,
    setCurrentMode,
    isTrashModalOpenInDecksPage,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    isNoSelectionModalOpen,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity,
    handleDeletion,
    setHandleDeletion,
    navbarRef,
    deleteModalText: strings[language].deleteDecksConfirmation,
    setDeleteModalText: () => {},
    isAddToFoldersModalOpen,
    setIsAddToFoldersModalOpen,
    addToFoldersModalOpacity,
    isMoveToFoldersModalOpen,
    setIsMoveToFoldersModalOpen,
    moveToFoldersModalOpacity,
    isInFavoritesPage,
    setIsInFavoritesPage,
    isInFoldersPage,
    setIsInFoldersPage,
    isInViewFlashcardsPage,
    setIsInViewFlashcardsPage,
    isInViewDecksInFolderPage,
    setIsInViewDecksInFolderPage,
    noSelectionModalSubtitle: strings[language].noSelectionSubtitle,
    setNoSelectionModalSubtitle: () => {},
    sourcePageForFolders,
    setSourcePageForFolders,
    isUnfavoriteModalOpen,
    setIsUnfavoriteModalOpen,
    unfavoriteModalOpacity,
    unfavoriteModalText,
    setUnfavoriteModalText,
    handleUnfavorite,
    setHandleUnfavorite,
    currentDeckId,
    setCurrentDeckId,
    currentFolderId,
    setCurrentFolderId,
    currentFolderTitle,
    setCurrentFolderTitle,
    currentSourcePage,
    setCurrentSourcePage,
    currentDeckType,
    setCurrentDeckType,
    isSubmitCustomFormModalOpen,
    setIsSubmitCustomFormModalOpen,
    submitCustomFormModalOpacity,
    onSubmitCustomFormModalClose,
    setOnSubmitCustomFormModalClose,
    isDeckDetailsDeleteModalOpen,
    setIsDeckDetailsDeleteModalOpen,
    deckDetailsDeleteModalOpacity,
    handleDeckDetailsDeletion,
    setHandleDeckDetailsDeletion,
    onDeckDetailsDeleteModalDismiss,
    setOnDeckDetailsDeleteModalDismiss,
    isDeckDetailsSaveModalOpen,
    setIsDeckDetailsSaveModalOpen,
        deckDetailsSaveModalOpacity,
    setOnDeckDetailsSaveModalDismiss,
    onDeckDetailsSaveModalDismiss,
    isDeleteFolderModalOpen,
    setIsDeleteFolderModalOpen,
    deleteFolderModalOpacity,
    handleDeleteFolder,
    setHandleDeleteFolder,
    isDecksAlreadyInFoldersModalOpen,
    setIsDecksAlreadyInFoldersModalOpen,
    decksAlreadyInFoldersModalOpacity,
    deckDetailsSaveModalType,
    setDeckDetailsSaveModalType,
  }), [
    isMenuOpen, 
    menuOverlayOpacity, 
    menuTranslateX,
    setIsMenuOpen,
    handleDismissMenu,
    showSlidingMenu,
    setShowSlidingMenu,
    isAIPromptOpen,
    setIsAIPromptOpen,
    aiPromptOpacity,
    isAddDeckOpen,
    setIsAddDeckOpen,
    addDeckOpacity,
    currentMode,
    setCurrentMode,
    isTrashModalOpenInDecksPage,
    setIsTrashModalOpenInDecksPage,
    trashModalOpacity,
    isNoSelectionModalOpen,
    setIsNoSelectionModalOpen,
    noSelectionModalOpacity,
    handleDeletion,
    setHandleDeletion,
    navbarRef,
    language,
    isAddToFoldersModalOpen,
    setIsAddToFoldersModalOpen,
    addToFoldersModalOpacity,
    isMoveToFoldersModalOpen,
    setIsMoveToFoldersModalOpen,
    moveToFoldersModalOpacity,
    isInFavoritesPage,
    setIsInFavoritesPage,
    isInFoldersPage,
    setIsInFoldersPage,
    isInViewFlashcardsPage,
    setIsInViewFlashcardsPage,
    isInViewDecksInFolderPage,
    setIsInViewDecksInFolderPage,
    sourcePageForFolders,
    setSourcePageForFolders,
    isUnfavoriteModalOpen,
    setIsUnfavoriteModalOpen,
    unfavoriteModalOpacity,
    unfavoriteModalText,
    setUnfavoriteModalText,
    handleUnfavorite,
    setHandleUnfavorite,
    currentDeckId,
    setCurrentDeckId,
    currentFolderId,
    setCurrentFolderId,
    currentFolderTitle,
    setCurrentFolderTitle,
    currentSourcePage,
    setCurrentSourcePage,
    currentDeckType,
    setCurrentDeckType,
    isSubmitCustomFormModalOpen,
    setIsSubmitCustomFormModalOpen,
    submitCustomFormModalOpacity,
    onSubmitCustomFormModalClose,
    setOnSubmitCustomFormModalClose,
    isDeckDetailsDeleteModalOpen,
    setIsDeckDetailsDeleteModalOpen,
    deckDetailsDeleteModalOpacity,
    handleDeckDetailsDeletion,
    setHandleDeckDetailsDeletion,
    onDeckDetailsDeleteModalDismiss,
    setOnDeckDetailsDeleteModalDismiss,
    isDeckDetailsSaveModalOpen,
    setIsDeckDetailsSaveModalOpen,
    deckDetailsSaveModalOpacity,
    setOnDeckDetailsSaveModalDismiss,
    onDeckDetailsSaveModalDismiss,
    isDeleteFolderModalOpen,
    setIsDeleteFolderModalOpen,
    deleteFolderModalOpacity,
    handleDeleteFolder,
    setHandleDeleteFolder,
    isDecksAlreadyInFoldersModalOpen,
    setIsDecksAlreadyInFoldersModalOpen,
    decksAlreadyInFoldersModalOpacity,
    deckDetailsSaveModalType,
    setDeckDetailsSaveModalType,
  ]);

  return (
    <MenuContext.Provider value={menuContextValue}>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
          tabBar={() => <NavBar ref={navbarRef} />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="account" />
          <Tabs.Screen name="statistics" />
          <Tabs.Screen name="awards" />
          <Tabs.Screen 
            name="folders"
            listeners={{
              focus: () => {
                setIsInFoldersPage(true);
              },
              blur: () => {
                setIsInFoldersPage(false);
              }
            }}
          />
          <Tabs.Screen 
            name="viewDecksInFolder"
            listeners={{
              focus: () => {
                setIsInViewDecksInFolderPage(true);
              },
              blur: () => {
                setIsInViewDecksInFolderPage(false);
              }
            }}
          />
          <Tabs.Screen 
            name="favorites" 
            listeners={{
              focus: () => {
                setIsInFavoritesPage(true);
              },
              blur: () => {
                setIsInFavoritesPage(false);
              }
            }}
          />
          <Tabs.Screen name="deckDetails" />
          <Tabs.Screen 
            name="viewFlashcards" 
            listeners={{
              focus: () => {
                setIsInViewFlashcardsPage(true);
              },
              blur: () => {
                setIsInViewFlashcardsPage(false);
              }
            }}
          />
        </Tabs>
        <GreyOverlayBackground 
          visible={isMenuOpen}
          opacity={menuOverlayOpacity}
          onPress={handleDismissMenu}
        />
        {showSlidingMenu && (
          <SlidingMenu
            visible={isMenuOpen}
            translateX={menuTranslateX}
            onFolderPress={handleFolderPress}
          />
        )}
        <AIPromptModal
          visible={isAIPromptOpen}
          opacity={aiPromptOpacity}
          sourcePage={
            isInFavoritesPage ? 'favorites' :
            isInFoldersPage ? 'folders' :
            isInViewDecksInFolderPage ? 'viewDecksInFolder' :
            'index'
          }
        />
        <AddDeckModal
          visible={isAddDeckOpen}
          opacity={addDeckOpacity}
          currentMode={currentMode}
          isInFavoritesPage={isInFavoritesPage}
          isInViewFlashcardsPage={isInViewFlashcardsPage}
          isInViewDecksInFolderPage={isInViewDecksInFolderPage}
          deckId={currentDeckId}
          folderId={currentFolderId}
          deckType={currentDeckType}
        />
        <GenericModal
          visible={isTrashModalOpenInDecksPage}
          opacity={trashModalOpacity}
          Icon={DeleteModalIcon}
          text={strings[language].deleteDecksConfirmation}
          textStyle={{
            highlightWord: language === 'Chinese' ? '删除' : 'delete',
            highlightColor: '#D7191C'
          }}
          buttons="double"
          onCancel={handleDismissMenu}
          onConfirm={() => {
            if (handleDeletion) {
              handleDeletion();
            }
            handleDismissMenu();
          }}
        />
        <GenericModal
          visible={isNoSelectionModalOpen}
          opacity={noSelectionModalOpacity}
          text={strings[language].noSelectionMade}
          subtitle={strings[language].noSelectionSubtitle}
        />
        <GenericModal
          visible={isAddToFoldersModalOpen}
          opacity={addToFoldersModalOpacity}
          Icon={ModalExclamationMarkIcon}
          text={strings[language].confirmAddToFolders}
          buttons="double"
          onCancel={handleDismissMenu}
          onConfirm={() => {
            // TODO: Implement backend logic here later
            
            // First dismiss the modal
            handleDismissMenu();
            
            // Then navigate back based on source page
            if (Platform.OS === 'ios') {
              if (sourcePageForFolders === 'favorites') {
                navbarRef?.current?.resetAnimation();
              } else {
                navbarRef?.current?.setDecksTab();
              }
              setTimeout(() => {
                router.push({
                  pathname: sourcePageForFolders === 'favorites' ? '/(tabs)/favorites' : '/(tabs)',
                  params: {
                    mode: currentMode
                  }
                });
              }, 50);
            } else {
              router.push({
                pathname: sourcePageForFolders === 'favorites' ? '/(tabs)/favorites' : '/(tabs)',
                params: {
                  mode: currentMode
                }
              });
              setTimeout(() => {
                if (sourcePageForFolders === 'favorites') {
                  navbarRef?.current?.resetAnimation();
                } else {
                  navbarRef?.current?.setDecksTab();
                }
              }, 50);
            }
          }}
        />
        <GenericModal
          visible={isMoveToFoldersModalOpen}
          opacity={moveToFoldersModalOpacity}
          Icon={ModalExclamationMarkIcon}
          text={strings[language].confirmMoveToFolders}
          buttons="double"
          onCancel={handleDismissMenu}
          onConfirm={() => {
            // TODO: Implement backend logic here later
            
            // Dismiss the modal with animation and navigate after completion
            Animated.parallel([
              Animated.timing(menuOverlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(moveToFoldersModalOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              })
            ]).start(() => {
              setIsMenuOpen(false);
              setIsMoveToFoldersModalOpen(false);
              
              // Then navigate back to viewDecksInFolder page
              if (Platform.OS === 'ios') {
                navbarRef?.current?.resetAnimation();
                setTimeout(() => {
                  router.push({
                    pathname: '/(tabs)/viewDecksInFolder',
                    params: {
                      folderTitle: currentFolderTitle || '',
                      folderId: currentFolderId || '',
                      selectedState: 'true',
                      sourcePage: sourcePageForFolders
                    }
                  });
                }, 50);
              } else {
                router.push({
                  pathname: '/(tabs)/viewDecksInFolder',
                  params: {
                    folderTitle: currentFolderTitle || '',
                    folderId: currentFolderId || '',
                    selectedState: 'true',
                    sourcePage: sourcePageForFolders
                  }
                });
                setTimeout(() => {
                  navbarRef?.current?.resetAnimation();
                }, 50);
              }
            });
          }}
        />
        <GenericModal
          visible={isUnfavoriteModalOpen}
          opacity={unfavoriteModalOpacity}
          Icon={DeleteModalIcon}
          text={strings[language].unfavoriteConfirmation}
          textStyle={{
            highlightWord: language === 'Chinese' ? '取消收藏' : 'unfavorite',
            highlightColor: '#D7191C'
          }}
          buttons="double"
          onCancel={handleDismissMenu}
          onConfirm={() => {
            if (handleUnfavorite) {
              handleUnfavorite();
            }
            handleDismissMenu();
          }}
        />
        <GenericModal
          visible={isSubmitCustomFormModalOpen}
          opacity={submitCustomFormModalOpacity}
          text={strings[language].customGoalFormSubmitted}
          hasAnimation={true}
          animationSource={require('../../assets/animations/SuccessAnimation1_Tick.json')}
          animationLoop={true}
          contentMarginTop={20}
          lottieMarginTop={40}
        />
        <GenericModal
          visible={isDeckDetailsDeleteModalOpen}
          opacity={deckDetailsDeleteModalOpacity}
          Icon={DeleteModalIcon}
          text={strings[language].deleteDeckConfirmation}
          textStyle={{
            highlightWord: language === 'Chinese' ? '删除' : 'delete',
            highlightColor: '#D7191C'
          }}
          buttons="double"
          onCancel={handleDismissMenu}
          onConfirm={() => {
            if (handleDeckDetailsDeletion) {
              handleDeckDetailsDeletion();
            }
            handleDismissMenu();
          }}
        />
         <GenericModal
          visible={isDeckDetailsSaveModalOpen}
          opacity={deckDetailsSaveModalOpacity}
          text={deckDetailsSaveModalType === 'move'
            ? strings[language].deckMovedToFolder
            : deckDetailsSaveModalType === 'ai'
              ? strings[language].aiDeckSavedSuccessfully
              : strings[language].deckSavedToFolder}
          hasAnimation={true}
          animationSource={require('../../assets/animations/SuccessAnimation1_Tick.json')}
          animationLoop={true}
          contentMarginTop={20}
          lottieMarginTop={40}
        />
        <GenericModal
          visible={isDeleteFolderModalOpen}
          opacity={deleteFolderModalOpacity}
          Icon={DeleteModalIcon}
          text={strings[language].deleteFolderConfirmation}
          textStyle={{
            highlightWord: language === 'Chinese' ? '删除' : 'delete',
            highlightColor: '#D7191C'
          }}
          buttons="double"
          onCancel={handleDismissMenu}
          onConfirm={() => {
            if (handleDeleteFolder) {
              handleDeleteFolder();
            }
            handleDismissMenu();
          }}
        />
        <GenericModal
          visible={isDecksAlreadyInFoldersModalOpen}
          opacity={decksAlreadyInFoldersModalOpacity}
          Icon={DeleteModalIcon}
          text={strings[language].decksAlreadyInFolders}
          buttons="single"
          onConfirm={handleDismissMenu}
        />
      </View>
    </MenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  }
});
