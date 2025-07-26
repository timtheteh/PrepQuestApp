import { View, StyleSheet, Platform , Animated } from 'react-native';
import { Tabs, useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { NavBar, NavBarRef } from '@/components/general/NavBar';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { SlidingMenu } from '@/components/general/SlidingMenu';
import { AIPromptModal } from '@/components/AIDecks/AIPromptModal';
import { AddDeckModal } from '@/components/addDeckModal/AddDeckModal';
import { GenericModal } from '@/components/modals/GenericModal';
import { MenuContext } from '@/contexts/MenuContext';
import { useState, useRef, useCallback, RefObject, useEffect } from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';

const DeleteModalIcon: React.FC<SvgProps> = (props) => (
  <Svg 
    width={props.width || 31} 
    height={props.height || 31} 
    viewBox="0 0 31 31" 
    fill="none" 
    {...props}
  >
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM16.8375 9.11342C16.8536 8.36521 16.2515 7.75 15.5031 7.75C14.755 7.75 14.153 8.36467 14.1686 9.11256L14.3421 17.4431C14.3552 18.0734 14.8699 18.5775 15.5004 18.5775C16.1305 18.5775 16.6451 18.0739 16.6587 17.4438L16.8375 9.11342ZM14.4009 22.7708C14.7062 23.0903 15.0726 23.25 15.5 23.25C15.7818 23.25 16.0378 23.1776 16.268 23.0329C16.5028 22.8831 16.6907 22.6834 16.8316 22.4338C16.9772 22.1842 17.05 21.9072 17.05 21.6027C17.05 21.1534 16.895 20.769 16.585 20.4495C16.2797 20.13 15.918 19.9703 15.5 19.9703C15.0726 19.9703 14.7062 20.13 14.4009 20.4495C14.1003 20.769 13.95 21.1534 13.95 21.6027C13.95 22.0619 14.1003 22.4513 14.4009 22.7708Z" 
      fill="#D7191C"
    />
  </Svg>
);

const ModalExclamationMarkIcon: React.FC<SvgProps> = (props) => (
  <Svg 
    width={props.width || 31} 
    height={props.height || 31} 
    viewBox="0 0 31 31" 
    fill="none" 
    {...props}
  >
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM16.8375 9.11342C16.8536 8.36521 16.2515 7.75 15.5031 7.75C14.755 7.75 14.153 8.36467 14.1686 9.11256L14.3421 17.4431C14.3552 18.0734 14.8699 18.5775 15.5004 18.5775C16.1305 18.5775 16.6451 18.0739 16.6587 17.4438L16.8375 9.11342ZM14.4009 22.7708C14.7062 23.0903 15.0726 23.25 15.5 23.25C15.7818 23.25 16.0378 23.1776 16.268 23.0329C16.5028 22.8831 16.6907 22.6834 16.8316 22.4338C16.9772 22.1842 17.05 21.9072 17.05 21.6027C17.05 21.1534 16.895 20.769 16.585 20.4495C16.2797 20.13 15.918 19.9703 15.5 19.9703C15.0726 19.9703 14.7062 20.13 14.4009 20.4495C14.1003 20.769 13.95 21.1534 13.95 21.6027C13.95 22.0619 14.1003 22.4513 14.4009 22.7708Z"      
      fill="#4F41D8"
    />
  </Svg>
);

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
  const [noSelectionModalSubtitle, setNoSelectionModalSubtitle] = useState('Please choose at least one deck if you want to delete or add to folder.');
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateX = useRef(new Animated.Value(-171)).current;
  const aiPromptOpacity = useRef(new Animated.Value(0)).current;
  const addDeckOpacity = useRef(new Animated.Value(0)).current;
  const trashModalOpacity = useRef(new Animated.Value(0)).current;
  const noSelectionModalOpacity = useRef(new Animated.Value(0)).current;
  const addToFoldersModalOpacity = useRef(new Animated.Value(0)).current;
  const moveToFoldersModalOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();
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

  const handleDismissMenu = useCallback(() => {
    if (isAIPromptOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(aiPromptOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAIPromptOpen(false);
      });
    } else if (isAddDeckOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(addDeckOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAddDeckOpen(false);
      });
    } else if (isTrashModalOpenInDecksPage) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(trashModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsTrashModalOpenInDecksPage(false);
      });
    } else if (isNoSelectionModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(noSelectionModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsNoSelectionModalOpen(false);
      });
    } else if (isAddToFoldersModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(addToFoldersModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsAddToFoldersModalOpen(false);
      });
    } else if (isMoveToFoldersModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(moveToFoldersModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsMoveToFoldersModalOpen(false);
      });
    } else if (isUnfavoriteModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(unfavoriteModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
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
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(submitCustomFormModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
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
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(deckDetailsDeleteModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
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
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(deckDetailsSaveModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDeckDetailsSaveModalOpen(false);
      });
    } else if (isDeleteFolderModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(deleteFolderModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDeleteFolderModalOpen(false);
      });
    } else if (isDecksAlreadyInFoldersModalOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(decksAlreadyInFoldersModalOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsDecksAlreadyInFoldersModalOpen(false);
      });
    } else if (showSlidingMenu) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        }),
        Animated.timing(menuTranslateX, {
          toValue: -171,
          duration: slidingMenuDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setShowSlidingMenu(false);
      });
    } else {
      Animated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: slidingMenuDuration,
        useNativeDriver: true,
      }).start(() => {
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
    isDecksAlreadyInFoldersModalOpen]);

  const handleFolderPress = useCallback(() => {
    handleDismissMenu();
    navbarRef.current?.resetAnimation();
  }, [handleDismissMenu]);

  // Debug logging to verify parameter passing
  useEffect(() => {
    console.log('🔍 Debug - Page states:', {
      isInViewFlashcardsPage,
      isInViewDecksInFolderPage,
      currentDeckId,
      currentFolderId
    });
    
    if (isInViewFlashcardsPage) {
      console.log('✅ viewFlashcards page focused');
      if (currentDeckId) {
        console.log('✅ deckId received:', currentDeckId);
      } else {
        console.log('❌ No deckId found');
      }
    }
    
    if (isInViewDecksInFolderPage) {
      console.log('✅ viewDecksInFolder page focused');
      if (currentFolderId) {
        console.log('✅ folderId received:', currentFolderId);
      } else {
        console.log('❌ No folderId found');
      }
    }
  }, [isInViewFlashcardsPage, isInViewDecksInFolderPage]);

  return (
    <MenuContext.Provider value={{ 
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
      deleteModalText: language === 'Chinese'
        ? '你确定要删除这些卡片组吗？'
        : 'Are you sure you want to delete these deck(s)?',
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
      noSelectionModalSubtitle: language === 'Chinese'
        ? '如果你想删除或添加到文件夹，请至少选择一个卡片组。'
        : 'Please choose at least one deck if you want to delete or add to folder.',
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
    }}>
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
          text={language === 'Chinese' ? '你确定要删除这些卡片组吗？' : 'Are you sure you want to delete these deck(s)?'}
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
          text={language === 'Chinese' ? '未选择任何内容！' : 'No selection made!'}
          subtitle={language === 'Chinese'
            ? '如果你想删除或添加到文件夹，请至少选择一个卡片组。'
            : 'Please choose at least one deck if you want to delete or add to folder.'}
        />
        <GenericModal
          visible={isAddToFoldersModalOpen}
          opacity={addToFoldersModalOpacity}
          Icon={ModalExclamationMarkIcon}
          text={language === 'Chinese' ? '确认添加到文件夹？' : 'Confirm adding to\nfolder(s)?'}
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
          text={language === 'Chinese' ? '确认移动到文件夹？' : 'Confirm moving to\nfolder(s)?'}
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
          text={language === 'Chinese' ? '你确定要取消收藏吗？' : unfavoriteModalText}
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
          text={language === 'Chinese' ? ["自定义目标表单", "已提交！"] : ["Custom Goal Form", "Submitted!"]}
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
          text={language === 'Chinese' ? '你确定要删除这个卡片组吗？' : 'Are you sure you want to delete this deck?'}
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
          text={language === 'Chinese'
            ? deckDetailsSaveModalType === 'move'
              ? ['卡片组已移动', '到文件夹！']
              : deckDetailsSaveModalType === 'ai'
                ? ['AI卡片组', '保存成功！']
                : ['卡片组已保存', '到文件夹！']
            : deckDetailsSaveModalType === 'move'
              ? ["Deck(s) moved", "into folder(s)!"]
              : deckDetailsSaveModalType === 'ai'
                ? ["AI Deck", "saved successfully!"]
                : ["Deck(s) saved", "into folder(s)!"]}
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
          text={language === 'Chinese' ? '你确定要删除这个文件夹吗？' : 'Are you sure you want to delete this folder?'}
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
          text={language === 'Chinese' ? ['你选择的一个或多个卡片组', '已在所选文件夹中！'] : ["One or more decks you", "have selected are already", "in the selected folder(s)!"]}
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
