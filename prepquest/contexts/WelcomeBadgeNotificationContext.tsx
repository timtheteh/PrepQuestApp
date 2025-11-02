import React, { createContext, useContext, useState } from 'react';
import { WelcomeBadgeAward } from '@/db/grades';

interface WelcomeBadgeNotificationContextType {
  welcomeBadgeAward: WelcomeBadgeAward | null;
  showWelcomeBadgeNotification: boolean;
  setWelcomeBadgeAward: (award: WelcomeBadgeAward | null) => void;
  setShowWelcomeBadgeNotification: (show: boolean) => void;
  showNotification: (award: WelcomeBadgeAward) => void;
  dismissNotification: () => void;
}

const WelcomeBadgeNotificationContext = createContext<WelcomeBadgeNotificationContextType | undefined>(undefined);

export const useWelcomeBadgeNotification = () => {
  const context = useContext(WelcomeBadgeNotificationContext);
  if (!context) {
    throw new Error('useWelcomeBadgeNotification must be used within a WelcomeBadgeNotificationProvider');
  }
  return context;
};

interface WelcomeBadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const WelcomeBadgeNotificationProvider: React.FC<WelcomeBadgeNotificationProviderProps> = ({ children }) => {
  const [welcomeBadgeAward, setWelcomeBadgeAward] = useState<WelcomeBadgeAward | null>(null);
  const [showWelcomeBadgeNotification, setShowWelcomeBadgeNotification] = useState(false);

  const showNotification = (award: WelcomeBadgeAward) => {
    console.log('🎖️ Showing welcome badge notification:', award);
    setWelcomeBadgeAward(award);
    setShowWelcomeBadgeNotification(true);
  };

  const dismissNotification = () => {
    console.log('🎖️ Dismissing welcome badge notification');
    setShowWelcomeBadgeNotification(false);
    // Clear the award after animation completes (300ms animation + small buffer)
    setTimeout(() => {
      setWelcomeBadgeAward(null);
    }, 400);
  };

  return (
    <WelcomeBadgeNotificationContext.Provider
      value={{
        welcomeBadgeAward,
        showWelcomeBadgeNotification,
        setWelcomeBadgeAward,
        setShowWelcomeBadgeNotification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </WelcomeBadgeNotificationContext.Provider>
  );
};

