import { createContext } from 'react';

interface ActionHandlersContextType {
  handleDeletion: (() => void) | null;
  setHandleDeletion: (handler: (() => void) | null) => void;
  handleUnfavorite: (() => void) | null;
  setHandleUnfavorite: (handler: (() => void) | null) => void;
  handleDeckDetailsDeletion: (() => void) | null;
  setHandleDeckDetailsDeletion: (handler: (() => void) | null) => void;
  handleDeleteFolder: (() => void) | null;
  setHandleDeleteFolder: (handler: (() => void) | null) => void;
  onSubmitCustomFormModalClose: (() => void) | null;
  setOnSubmitCustomFormModalClose: (handler: (() => void) | null) => void;
  onDeckDetailsDeleteModalDismiss: (() => void) | null;
  setOnDeckDetailsDeleteModalDismiss: (handler: (() => void) | null) => void;
  onDeckDetailsSaveModalDismiss: (() => void) | null;
  setOnDeckDetailsSaveModalDismiss: (handler: (() => void) | null) => void;
  deleteModalText: string;
  setDeleteModalText: (text: string) => void;
  noSelectionModalSubtitle: string;
  setNoSelectionModalSubtitle: (text: string) => void;
  unfavoriteModalText: string;
  setUnfavoriteModalText: (text: string) => void;
}

export const ActionHandlersContext = createContext<ActionHandlersContextType>({
  handleDeletion: null,
  setHandleDeletion: () => {},
  handleUnfavorite: null,
  setHandleUnfavorite: () => {},
  handleDeckDetailsDeletion: null,
  setHandleDeckDetailsDeletion: () => {},
  handleDeleteFolder: null,
  setHandleDeleteFolder: () => {},
  onSubmitCustomFormModalClose: null,
  setOnSubmitCustomFormModalClose: () => {},
  onDeckDetailsDeleteModalDismiss: null,
  setOnDeckDetailsDeleteModalDismiss: () => {},
  onDeckDetailsSaveModalDismiss: null,
  setOnDeckDetailsSaveModalDismiss: () => {},
  deleteModalText: '',
  setDeleteModalText: () => {},
  noSelectionModalSubtitle: '',
  setNoSelectionModalSubtitle: () => {},
  unfavoriteModalText: '',
  setUnfavoriteModalText: () => {},
});
