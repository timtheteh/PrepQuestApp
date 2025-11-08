import { createContext, ReactNode } from 'react';
import { Animated } from 'react-native';

interface ModalContextType {
  isAIPromptOpen: boolean;
  setIsAIPromptOpen: (value: boolean) => void;
  aiPromptOpacity: Animated.Value;
  isAddDeckOpen: boolean;
  setIsAddDeckOpen: (value: boolean) => void;
  addDeckOpacity: Animated.Value;
  isTrashModalOpenInDecksPage: boolean;
  setIsTrashModalOpenInDecksPage: (value: boolean) => void;
  trashModalOpacity: Animated.Value;
  isNoSelectionModalOpen: boolean;
  setIsNoSelectionModalOpen: (value: boolean) => void;
  noSelectionModalOpacity: Animated.Value;
  isAddToFoldersModalOpen: boolean;
  setIsAddToFoldersModalOpen: (value: boolean) => void;
  addToFoldersModalOpacity: Animated.Value;
  isMoveToFoldersModalOpen: boolean;
  setIsMoveToFoldersModalOpen: (value: boolean) => void;
  moveToFoldersModalOpacity: Animated.Value;
  isUnfavoriteModalOpen: boolean;
  setIsUnfavoriteModalOpen: (value: boolean) => void;
  unfavoriteModalOpacity: Animated.Value;
  isSubmitCustomFormModalOpen: boolean;
  setIsSubmitCustomFormModalOpen: (value: boolean) => void;
  submitCustomFormModalOpacity: Animated.Value;
  isDeckDetailsDeleteModalOpen: boolean;
  setIsDeckDetailsDeleteModalOpen: (value: boolean) => void;
  deckDetailsDeleteModalOpacity: Animated.Value;
  isDeckDetailsSaveModalOpen: boolean;
  setIsDeckDetailsSaveModalOpen: (value: boolean) => void;
  deckDetailsSaveModalOpacity: Animated.Value;
  isDeleteFolderModalOpen: boolean;
  setIsDeleteFolderModalOpen: (value: boolean) => void;
  deleteFolderModalOpacity: Animated.Value;
  isDecksAlreadyInFoldersModalOpen: boolean;
  setIsDecksAlreadyInFoldersModalOpen: (value: boolean) => void;
  decksAlreadyInFoldersModalOpacity: Animated.Value;
  showGlobalLoadingOverlay: boolean;
  setShowGlobalLoadingOverlay: (value: boolean) => void;
  setGlobalOverlayContent: (content: ReactNode | null) => void;
}

export const ModalContext = createContext<ModalContextType>({
  isAIPromptOpen: false,
  setIsAIPromptOpen: () => {},
  aiPromptOpacity: new Animated.Value(0),
  isAddDeckOpen: false,
  setIsAddDeckOpen: () => {},
  addDeckOpacity: new Animated.Value(0),
  isTrashModalOpenInDecksPage: false,
  setIsTrashModalOpenInDecksPage: () => {},
  trashModalOpacity: new Animated.Value(0),
  isNoSelectionModalOpen: false,
  setIsNoSelectionModalOpen: () => {},
  noSelectionModalOpacity: new Animated.Value(0),
  isAddToFoldersModalOpen: false,
  setIsAddToFoldersModalOpen: () => {},
  addToFoldersModalOpacity: new Animated.Value(0),
  isMoveToFoldersModalOpen: false,
  setIsMoveToFoldersModalOpen: () => {},
  moveToFoldersModalOpacity: new Animated.Value(0),
  isUnfavoriteModalOpen: false,
  setIsUnfavoriteModalOpen: () => {},
  unfavoriteModalOpacity: new Animated.Value(0),
  isSubmitCustomFormModalOpen: false,
  setIsSubmitCustomFormModalOpen: () => {},
  submitCustomFormModalOpacity: new Animated.Value(0),
  isDeckDetailsDeleteModalOpen: false,
  setIsDeckDetailsDeleteModalOpen: () => {},
  deckDetailsDeleteModalOpacity: new Animated.Value(0),
  isDeckDetailsSaveModalOpen: false,
  setIsDeckDetailsSaveModalOpen: () => {},
  deckDetailsSaveModalOpacity: new Animated.Value(0),
  isDeleteFolderModalOpen: false,
  setIsDeleteFolderModalOpen: () => {},
  deleteFolderModalOpacity: new Animated.Value(0),
  isDecksAlreadyInFoldersModalOpen: false,
  setIsDecksAlreadyInFoldersModalOpen: () => {},
  decksAlreadyInFoldersModalOpacity: new Animated.Value(0),
  showGlobalLoadingOverlay: false,
  setShowGlobalLoadingOverlay: () => {},
  setGlobalOverlayContent: () => {},
});
