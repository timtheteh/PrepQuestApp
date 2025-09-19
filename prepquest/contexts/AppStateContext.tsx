import { createContext } from 'react';

interface AppStateContextType {
  currentMode: 'study' | 'interview';
  setCurrentMode: (mode: 'study' | 'interview') => void;
  isInFavoritesPage: boolean;
  setIsInFavoritesPage: (value: boolean) => void;
  isInFoldersPage: boolean;
  setIsInFoldersPage: (value: boolean) => void;
  isInViewFlashcardsPage: boolean;
  setIsInViewFlashcardsPage: (value: boolean) => void;
  isInViewDecksInFolderPage: boolean;
  setIsInViewDecksInFolderPage: (value: boolean) => void;
  sourcePageForFolders: string;
  setSourcePageForFolders: (value: string) => void;
  currentDeckId: string | undefined;
  setCurrentDeckId: (deckId: string | undefined) => void;
  currentFolderId: string | undefined;
  setCurrentFolderId: (folderId: string | undefined) => void;
  currentFolderTitle: string | undefined;
  setCurrentFolderTitle: (folderTitle: string | undefined) => void;
  currentSourcePage: string | undefined;
  setCurrentSourcePage: (sourcePage: string | undefined) => void;
  currentDeckType: string | undefined;
  setCurrentDeckType: (deckType: string | undefined) => void;
  deckDetailsSaveModalType: 'add' | 'move' | 'ai';
  setDeckDetailsSaveModalType: (type: 'add' | 'move' | 'ai') => void;
}

export const AppStateContext = createContext<AppStateContextType>({
  currentMode: 'study',
  setCurrentMode: () => {},
  isInFavoritesPage: false,
  setIsInFavoritesPage: () => {},
  isInFoldersPage: false,
  setIsInFoldersPage: () => {},
  isInViewFlashcardsPage: false,
  setIsInViewFlashcardsPage: () => {},
  isInViewDecksInFolderPage: false,
  setIsInViewDecksInFolderPage: () => {},
  sourcePageForFolders: '',
  setSourcePageForFolders: () => {},
  currentDeckId: undefined,
  setCurrentDeckId: () => {},
  currentFolderId: undefined,
  setCurrentFolderId: () => {},
  currentFolderTitle: undefined,
  setCurrentFolderTitle: () => {},
  currentSourcePage: undefined,
  setCurrentSourcePage: () => {},
  currentDeckType: undefined,
  setCurrentDeckType: () => {},
  deckDetailsSaveModalType: 'add',
  setDeckDetailsSaveModalType: () => {},
});
