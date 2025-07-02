import { createContext, RefObject } from 'react';
import { Animated } from 'react-native';
import { NavBarRef } from '@/components/NavBar';

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
  isMoveToFoldersModalOpen: boolean;
  setIsMoveToFoldersModalOpen: (value: boolean) => void;
  moveToFoldersModalOpacity: Animated.Value;
  isInFavoritesPage: boolean;
  setIsInFavoritesPage: (value: boolean) => void;
  isInFoldersPage: boolean;
  setIsInFoldersPage: (value: boolean) => void;
  noSelectionModalSubtitle: string;
  setNoSelectionModalSubtitle: (text: string) => void;
  sourcePageForFolders: string;
  setSourcePageForFolders: (value: string) => void;
  isUnfavoriteModalOpen: boolean;
  setIsUnfavoriteModalOpen: (value: boolean) => void;
  unfavoriteModalOpacity: Animated.Value;
  unfavoriteModalText: string;
  setUnfavoriteModalText: (text: string) => void;
  handleUnfavorite: (() => void) | null;
  setHandleUnfavorite: (handler: (() => void) | null) => void;
  isSubmitCustomFormModalOpen: boolean;
  setIsSubmitCustomFormModalOpen: (value: boolean) => void;
  submitCustomFormModalOpacity: Animated.Value;
  onSubmitCustomFormModalClose: (() => void) | null;
  setOnSubmitCustomFormModalClose: (handler: (() => void) | null) => void;
  isDeckDetailsDeleteModalOpen: boolean;
  setIsDeckDetailsDeleteModalOpen: (value: boolean) => void;
  deckDetailsDeleteModalOpacity: Animated.Value;
  handleDeckDetailsDeletion: (() => void) | null;
  setHandleDeckDetailsDeletion: (handler: (() => void) | null) => void;
  onDeckDetailsDeleteModalDismiss: (() => void) | null;
  setOnDeckDetailsDeleteModalDismiss: (handler: (() => void) | null) => void;
  isInViewFlashcardsPage: boolean;
  setIsInViewFlashcardsPage: (value: boolean) => void;
  isInViewDecksInFolderPage: boolean;
  setIsInViewDecksInFolderPage: (value: boolean) => void;
  isDeckDetailsSaveModalOpen: boolean;
  setIsDeckDetailsSaveModalOpen: (value: boolean) => void;
  deckDetailsSaveModalOpacity: Animated.Value;
  setOnDeckDetailsSaveModalDismiss: (handler: (() => void) | null) => void;
  onDeckDetailsSaveModalDismiss: (() => void) | null;
  isDeleteFolderModalOpen: boolean;
  setIsDeleteFolderModalOpen: (value: boolean) => void;
  deleteFolderModalOpacity: Animated.Value;
  handleDeleteFolder: (() => void) | null;
  setHandleDeleteFolder: (handler: (() => void) | null) => void;
  isDecksAlreadyInFoldersModalOpen: boolean;
  setIsDecksAlreadyInFoldersModalOpen: (value: boolean) => void;
  decksAlreadyInFoldersModalOpacity: Animated.Value;
  deckDetailsSaveModalType: 'add' | 'move' | 'ai';
  setDeckDetailsSaveModalType: (type: 'add' | 'move' | 'ai') => void;
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
  isMoveToFoldersModalOpen: false,
  setIsMoveToFoldersModalOpen: () => {},
  moveToFoldersModalOpacity: new Animated.Value(0),
  isInFavoritesPage: false,
  setIsInFavoritesPage: () => {},
  isInFoldersPage: false,
  setIsInFoldersPage: () => {},
  noSelectionModalSubtitle: '',
  setNoSelectionModalSubtitle: () => {},
  sourcePageForFolders: '',
  setSourcePageForFolders: () => {},
  isUnfavoriteModalOpen: false,
  setIsUnfavoriteModalOpen: () => {},
  unfavoriteModalOpacity: new Animated.Value(0),
  unfavoriteModalText: '',
  setUnfavoriteModalText: () => {},
  handleUnfavorite: null,
  setHandleUnfavorite: () => {},
  isSubmitCustomFormModalOpen: false,
  setIsSubmitCustomFormModalOpen: () => {},
  submitCustomFormModalOpacity: new Animated.Value(0),
  onSubmitCustomFormModalClose: null,
  setOnSubmitCustomFormModalClose: () => {},
  isDeckDetailsDeleteModalOpen: false,
  setIsDeckDetailsDeleteModalOpen: () => {},
  deckDetailsDeleteModalOpacity: new Animated.Value(0),
  handleDeckDetailsDeletion: null,
  setHandleDeckDetailsDeletion: () => {},
  onDeckDetailsDeleteModalDismiss: null,
  setOnDeckDetailsDeleteModalDismiss: () => {},
  isInViewFlashcardsPage: false,
  setIsInViewFlashcardsPage: () => {},
  isInViewDecksInFolderPage: false,
  setIsInViewDecksInFolderPage: () => {},
  isDeckDetailsSaveModalOpen: false,
  setIsDeckDetailsSaveModalOpen: () => {},
  deckDetailsSaveModalOpacity: new Animated.Value(0),
  setOnDeckDetailsSaveModalDismiss: () => {},
  onDeckDetailsSaveModalDismiss: null,
  isDeleteFolderModalOpen: false,
  setIsDeleteFolderModalOpen: () => {},
  deleteFolderModalOpacity: new Animated.Value(0),
  handleDeleteFolder: null,
  setHandleDeleteFolder: () => {},
  isDecksAlreadyInFoldersModalOpen: false,
  setIsDecksAlreadyInFoldersModalOpen: () => {},
  decksAlreadyInFoldersModalOpacity: new Animated.Value(0),
  deckDetailsSaveModalType: 'add',
  setDeckDetailsSaveModalType: () => {},
}); 