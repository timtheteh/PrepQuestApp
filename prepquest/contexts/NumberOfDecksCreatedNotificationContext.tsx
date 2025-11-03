import React, { createContext, useContext, useState } from 'react';
import { LifetimeBadgeAward } from '@/db/grades';

interface NumberOfDecksCreatedNotificationContextType {
  numberOfDecksCreatedBadgeAward: LifetimeBadgeAward | null;
  showNumberOfDecksCreatedBadgeNotification: boolean;
  setNumberOfDecksCreatedBadgeAward: (award: LifetimeBadgeAward | null) => void;
  setShowNumberOfDecksCreatedBadgeNotification: (show: boolean) => void;
  showNotification: (award: LifetimeBadgeAward) => void;
  dismissNotification: () => void;
}

const NumberOfDecksCreatedNotificationContext = createContext<NumberOfDecksCreatedNotificationContextType | undefined>(undefined);

export const useNumberOfDecksCreatedBadgeNotification = () => {
  const context = useContext(NumberOfDecksCreatedNotificationContext);
  if (!context) {
    throw new Error('useNumberOfDecksCreatedBadgeNotification must be used within a NumberOfDecksCreatedBadgeNotificationProvider');
  }
  return context;
};

interface NumberOfDecksCreatedBadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const NumberOfDecksCreatedBadgeNotificationProvider: React.FC<NumberOfDecksCreatedBadgeNotificationProviderProps> = ({ children }) => {
  const [numberOfDecksCreatedBadgeAward, setNumberOfDecksCreatedBadgeAward] = useState<LifetimeBadgeAward | null>(null);
  const [showNumberOfDecksCreatedBadgeNotification, setShowNumberOfDecksCreatedBadgeNotification] = useState(false);

  const showNotification = (award: LifetimeBadgeAward) => {
    console.log('🎖️ Showing number of decks created badge notification:', award);
    setNumberOfDecksCreatedBadgeAward(award);
    setShowNumberOfDecksCreatedBadgeNotification(true);
  };

  const dismissNotification = () => {
    console.log('🎖️ Dismissing number of decks created badge notification');
    setShowNumberOfDecksCreatedBadgeNotification(false);
    // Clear the award after animation completes (300ms animation + small buffer)
    setTimeout(() => {
      setNumberOfDecksCreatedBadgeAward(null);
    }, 400);
  };

  return (
    <NumberOfDecksCreatedNotificationContext.Provider
      value={{
        numberOfDecksCreatedBadgeAward,
        showNumberOfDecksCreatedBadgeNotification,
        setNumberOfDecksCreatedBadgeAward,
        setShowNumberOfDecksCreatedBadgeNotification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </NumberOfDecksCreatedNotificationContext.Provider>
  );
};

