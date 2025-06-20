import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { NavBar, NavBarRef } from '@/components/NavBar';
import { GreyOverlayBackground } from '@/components/GreyOverlayBackground';
import { SlidingMenu } from '@/components/SlidingMenu';
import { AIPromptModal } from '@/components/AIPromptModal';
import { CalendarModal } from '@/components/CalendarModal';
import { AddDeckModal } from '@/components/AddDeckModal';
import { GenericModal } from '@/components/GenericModal';
import { createContext, useState, useRef, useCallback, RefObject } from 'react';
import { Animated } from 'react-native';
import Svg, { SvgProps, Path } from 'react-native-svg';

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

interface MenuContextType {
  isMenuOpen: boolean;
  menuOverlayOpacity: Animated.Value;
  menuTranslateX: Animated.Value;
  setIsMenuOpen: (value: boolean) => void;
  handleDismissMenu: () => void;
  showSlidingMenu: boolean;
  setShowSlidingMenu: (value: boolean) => void;
  isAIPromptOpen: boolean;
  setIsAIPromptOpen: (value: boolean) => void;
  aiPromptOpacity: Animated.Value;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (value: boolean) => void;
  calendarOpacity: Animated.Value;
  calendarTitle: string;
  setCalendarTitle: (value: string) => void;
  isAddDeckOpen: boolean;
  setIsAddDeckOpen: (value: boolean) => void;
  addDeckOpacity: Animated.Value;
  currentMode: 'study' | 'interview';
  setCurrentMode: (mode: 'study' | 'interview') => void;
  isTrashModalOpenInDecksPage: boolean;
  setIsTrashModalOpenInDecksPage: (value: boolean) => void;
  trashModalOpacity: Animated.Value;
  isNoSelectionModalOpen: boolean;
  setIsNoSelectionModalOpen: (value: boolean) => void;
  noSelectionModalOpacity: Animated.Value;
  handleDeletion: (() => void) | null;
  setHandleDeletion: (handler: (() => void) | null) => void;
  navbarRef: RefObject<NavBarRef | null>;
  deleteModalText: string;
  setDeleteModalText: (text: string) => void;
  isAddToFoldersModalOpen: boolean;
  setIsAddToFoldersModalOpen: (value: boolean) => void;
  addToFoldersModalOpacity: Animated.Value;
  isInFavoritesPage: boolean;
  setIsInFavoritesPage: (value: boolean) => void;
  noSelectionModalSubtitle: string;
  setNoSelectionModalSubtitle: (text: string) => void;
  sourcePageForFolders: string;
  setSourcePageForFolders: (value: string) => void;
  isUnfavoriteModalOpen: boolean;
  setIsUnfavoriteModalOpen: (value: boolean) => void;
  unfavoriteModalOpacity: Animated.Value;
  unfavoriteModalText: string;
  setUnfavoriteModalText: (text: string) => void;
  isSubmitCustomFormModalOpen: boolean;
  setIsSubmitCustomFormModalOpen: (value: boolean) => void;
  submitCustomFormModalOpacity: Animated.Value;
  onSubmitCustomFormModalClose: (() => void) | null;
  setOnSubmitCustomFormModalClose: (handler: (() => void) | null) => void;
}

export const MenuContext = createContext<MenuContextType>({
  isMenuOpen: false,
  menuOverlayOpacity: new Animated.Value(0),
  menuTranslateX: new Animated.Value(-171),
  setIsMenuOpen: () => {},
  handleDismissMenu: () => {},
  showSlidingMenu: false,
  setShowSlidingMenu: () => {},
  isAIPromptOpen: false,
  setIsAIPromptOpen: () => {},
  aiPromptOpacity: new Animated.Value(0),
  isCalendarOpen: false,
  setIsCalendarOpen: () => {},
  calendarOpacity: new Animated.Value(0),
  calendarTitle: '',
  setCalendarTitle: () => {},
  isAddDeckOpen: false,
  setIsAddDeckOpen: () => {},
  addDeckOpacity: new Animated.Value(0),
  currentMode: 'study',
  setCurrentMode: () => {},
  isTrashModalOpenInDecksPage: false,
  setIsTrashModalOpenInDecksPage: () => {},
  trashModalOpacity: new Animated.Value(0),
  isNoSelectionModalOpen: false,
  setIsNoSelectionModalOpen: () => {},
  noSelectionModalOpacity: new Animated.Value(0),
  handleDeletion: null,
  setHandleDeletion: () => {},
  navbarRef: { current: null },
  deleteModalText: '',
  setDeleteModalText: () => {},
  isAddToFoldersModalOpen: false,
  setIsAddToFoldersModalOpen: () => {},
  addToFoldersModalOpacity: new Animated.Value(0),
  isInFavoritesPage: false,
  setIsInFavoritesPage: () => {},
  noSelectionModalSubtitle: '',
  setNoSelectionModalSubtitle: () => {},
  sourcePageForFolders: '',
  setSourcePageForFolders: () => {},
  isUnfavoriteModalOpen: false,
  setIsUnfavoriteModalOpen: () => {},
  unfavoriteModalOpacity: new Animated.Value(0),
  unfavoriteModalText: '',
  setUnfavoriteModalText: () => {},
  isSubmitCustomFormModalOpen: false,
  setIsSubmitCustomFormModalOpen: () => {},
  submitCustomFormModalOpacity: new Animated.Value(0),
  onSubmitCustomFormModalClose: null,
  setOnSubmitCustomFormModalClose: () => {},
});

export default function TabLayout() {
  const navbarRef = useRef<NavBarRef>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSlidingMenu, setShowSlidingMenu] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState('');
  const [isAddDeckOpen, setIsAddDeckOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'study' | 'interview'>('study');
  const [isTrashModalOpenInDecksPage, setIsTrashModalOpenInDecksPage] = useState(false);
  const [isNoSelectionModalOpen, setIsNoSelectionModalOpen] = useState(false);
  const [handleDeletion, setHandleDeletion] = useState<(() => void) | null>(null);
  const [deleteModalText, setDeleteModalText] = useState('Are you sure you want to delete these deck(s)?');
  const [isAddToFoldersModalOpen, setIsAddToFoldersModalOpen] = useState(false);
  const [isInFavoritesPage, setIsInFavoritesPage] = useState(false);
  const [noSelectionModalSubtitle, setNoSelectionModalSubtitle] = useState('Please choose at least one deck if you want to delete or add to folder.');
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateX = useRef(new Animated.Value(-171)).current;
  const aiPromptOpacity = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const addDeckOpacity = useRef(new Animated.Value(0)).current;
  const trashModalOpacity = useRef(new Animated.Value(0)).current;
  const noSelectionModalOpacity = useRef(new Animated.Value(0)).current;
  const addToFoldersModalOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();
  const { sourcePage } = useLocalSearchParams();
  const [sourcePageForFolders, setSourcePageForFolders] = useState('');
  const [isUnfavoriteModalOpen, setIsUnfavoriteModalOpen] = useState(false);
  const [unfavoriteModalText, setUnfavoriteModalText] = useState('');
  const unfavoriteModalOpacity = useRef(new Animated.Value(0)).current;
  const [isSubmitCustomFormModalOpen, setIsSubmitCustomFormModalOpen] = useState(false);
  const submitCustomFormModalOpacity = useRef(new Animated.Value(0)).current;
  const [onSubmitCustomFormModalClose, setOnSubmitCustomFormModalClose] = useState<(() => void) | null>(null);

  const slidingMenuDuration = 300;
  const overlayDuration = 200;

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
    } else if (isCalendarOpen) {
      Animated.parallel([
        Animated.timing(menuOverlayOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 0,
          duration: overlayDuration,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsMenuOpen(false);
        setIsCalendarOpen(false);
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
  }, [showSlidingMenu, isAIPromptOpen, isCalendarOpen, isAddDeckOpen, isTrashModalOpenInDecksPage, isNoSelectionModalOpen, isAddToFoldersModalOpen, isUnfavoriteModalOpen, isSubmitCustomFormModalOpen, onSubmitCustomFormModalClose]);

  const handleFolderPress = useCallback(() => {
    handleDismissMenu();
    navbarRef.current?.resetAnimation();
  }, [handleDismissMenu]);

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
      isCalendarOpen,
      setIsCalendarOpen,
      calendarOpacity,
      calendarTitle,
      setCalendarTitle,
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
      deleteModalText,
      setDeleteModalText,
      isAddToFoldersModalOpen,
      setIsAddToFoldersModalOpen,
      addToFoldersModalOpacity,
      isInFavoritesPage,
      setIsInFavoritesPage,
      noSelectionModalSubtitle,
      setNoSelectionModalSubtitle,
      sourcePageForFolders,
      setSourcePageForFolders,
      isUnfavoriteModalOpen,
      setIsUnfavoriteModalOpen,
      unfavoriteModalOpacity,
      unfavoriteModalText,
      setUnfavoriteModalText,
      isSubmitCustomFormModalOpen,
      setIsSubmitCustomFormModalOpen,
      submitCustomFormModalOpacity,
      onSubmitCustomFormModalClose,
      setOnSubmitCustomFormModalClose,
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
          <Tabs.Screen name="folders" />
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
        />
        <CalendarModal
          visible={isCalendarOpen}
          opacity={calendarOpacity}
          title={calendarTitle}
        />
        <AddDeckModal
          visible={isAddDeckOpen}
          opacity={addDeckOpacity}
          currentMode={currentMode}
          isInFavoritesPage={isInFavoritesPage}
        />
        <GenericModal
          visible={isTrashModalOpenInDecksPage}
          opacity={trashModalOpacity}
          Icon={DeleteModalIcon}
          text={deleteModalText}
          textStyle={{
            highlightWord: "delete",
            highlightColor: "#D7191C"
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
          text="No selection made!"
          subtitle={noSelectionModalSubtitle}
        />
        <GenericModal
          visible={isAddToFoldersModalOpen}
          opacity={addToFoldersModalOpacity}
          Icon={ModalExclamationMarkIcon}
          text={"Confirm adding to\nfolder(s)?"}
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
          visible={isUnfavoriteModalOpen}
          opacity={unfavoriteModalOpacity}
          Icon={DeleteModalIcon}
          text={unfavoriteModalText}
          textStyle={{
            highlightWord: "unfavorite",
            highlightColor: "#D7191C"
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
          visible={isSubmitCustomFormModalOpen}
          opacity={submitCustomFormModalOpacity}
          text={["Custom Goal Form", "Submitted!"]}
          hasAnimation={true}
          animationSource={require('../../assets/animations/SuccessAnimation1_Tick.json')}
          animationLoop={true}
          contentMarginTop={20}
          lottieMarginTop={40}
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
