import React, { createContext, useContext, useState } from 'react';
import { StreakBadgeAward } from '@/db/grades';

interface StreakBadgeNotificationContextType {
  streakBadgeAward: StreakBadgeAward | null;
  showStreakBadgeNotification: boolean;
  setStreakBadgeAward: (award: StreakBadgeAward | null) => void;
  setShowStreakBadgeNotification: (show: boolean) => void;
  showNotification: (award: StreakBadgeAward) => void;
  dismissNotification: () => void;
}

const StreakBadgeNotificationContext = createContext<StreakBadgeNotificationContextType | undefined>(undefined);

export const useStreakBadgeNotification = () => {
  const context = useContext(StreakBadgeNotificationContext);
  if (!context) {
    throw new Error('useStreakBadgeNotification must be used within a StreakBadgeNotificationProvider');
  }
  return context;
};

interface StreakBadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const StreakBadgeNotificationProvider: React.FC<StreakBadgeNotificationProviderProps> = ({ children }) => {
  const [streakBadgeAward, setStreakBadgeAward] = useState<StreakBadgeAward | null>(null);
  const [showStreakBadgeNotification, setShowStreakBadgeNotification] = useState(false);

  const showNotification = (award: StreakBadgeAward) => {
    console.log('🎖️ Showing streak badge notification:', award);
    setStreakBadgeAward(award);
    setShowStreakBadgeNotification(true);
  };

  const dismissNotification = () => {
    console.log('🎖️ Dismissing streak badge notification');
    setShowStreakBadgeNotification(false);
    // Clear the award after animation completes (300ms animation + small buffer)
    setTimeout(() => {
      setStreakBadgeAward(null);
    }, 400);
  };

  return (
    <StreakBadgeNotificationContext.Provider
      value={{
        streakBadgeAward,
        showStreakBadgeNotification,
        setStreakBadgeAward,
        setShowStreakBadgeNotification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </StreakBadgeNotificationContext.Provider>
  );
};

