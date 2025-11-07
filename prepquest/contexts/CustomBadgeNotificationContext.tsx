import React, { createContext, useContext, useState } from 'react';
import { CustomBadgeAward } from '@/db/decks';

interface CustomBadgeNotificationContextType {
  customBadgeAward: CustomBadgeAward | null;
  showCustomBadgeNotification: boolean;
  setCustomBadgeAward: (award: CustomBadgeAward | null) => void;
  setShowCustomBadgeNotification: (show: boolean) => void;
  showNotification: (award: CustomBadgeAward) => void;
  dismissNotification: () => void;
}

const CustomBadgeNotificationContext = createContext<CustomBadgeNotificationContextType | undefined>(undefined);

export const useCustomBadgeNotification = () => {
  const context = useContext(CustomBadgeNotificationContext);
  if (!context) {
    throw new Error('useCustomBadgeNotification must be used within a CustomBadgeNotificationProvider');
  }
  return context;
};

interface CustomBadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const CustomBadgeNotificationProvider: React.FC<CustomBadgeNotificationProviderProps> = ({ children }) => {
  const [customBadgeAward, setCustomBadgeAward] = useState<CustomBadgeAward | null>(null);
  const [showCustomBadgeNotification, setShowCustomBadgeNotification] = useState(false);

  const showNotification = (award: CustomBadgeAward) => {
    console.log('🎯 Showing custom badge notification:', award);
    setCustomBadgeAward(award);
    setShowCustomBadgeNotification(true);
  };

  const dismissNotification = () => {
    console.log('🎯 Dismissing custom badge notification');
    setShowCustomBadgeNotification(false);
  };

  const value = {
    customBadgeAward,
    showCustomBadgeNotification,
    setCustomBadgeAward,
    setShowCustomBadgeNotification,
    showNotification,
    dismissNotification,
  };

  return (
    <CustomBadgeNotificationContext.Provider value={value}>
      {children}
    </CustomBadgeNotificationContext.Provider>
  );
};

