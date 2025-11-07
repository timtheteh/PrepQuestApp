import React, { createContext, useContext, useState } from 'react';
import { LifetimeBadgeAward } from '@/db/grades';

interface LifetimeGradeBadgeNotificationContextType {
  lifetimeGradeBadgeAward: LifetimeBadgeAward | null;
  showLifetimeGradeBadgeNotification: boolean;
  setLifetimeGradeBadgeAward: (award: LifetimeBadgeAward | null) => void;
  setShowLifetimeGradeBadgeNotification: (show: boolean) => void;
  showNotification: (award: LifetimeBadgeAward) => void;
  dismissNotification: () => void;
}

const LifetimeGradeBadgeNotificationContext = createContext<LifetimeGradeBadgeNotificationContextType | undefined>(undefined);

export const useLifetimeGradeBadgeNotification = () => {
  const context = useContext(LifetimeGradeBadgeNotificationContext);
  if (!context) {
    throw new Error('useLifetimeGradeBadgeNotification must be used within a LifetimeGradeBadgeNotificationProvider');
  }
  return context;
};

interface LifetimeGradeBadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const LifetimeGradeBadgeNotificationProvider: React.FC<LifetimeGradeBadgeNotificationProviderProps> = ({ children }) => {
  const [lifetimeGradeBadgeAward, setLifetimeGradeBadgeAward] = useState<LifetimeBadgeAward | null>(null);
  const [showLifetimeGradeBadgeNotification, setShowLifetimeGradeBadgeNotification] = useState(false);

  const showNotification = (award: LifetimeBadgeAward) => {
    console.log('🎖️ Showing lifetime grade badge notification:', award);
    setLifetimeGradeBadgeAward(award);
    setShowLifetimeGradeBadgeNotification(true);
  };

  const dismissNotification = () => {
    console.log('🎖️ Dismissing lifetime grade badge notification');
    setShowLifetimeGradeBadgeNotification(false);
    // Clear the award after animation completes (300ms animation + small buffer)
    setTimeout(() => {
      setLifetimeGradeBadgeAward(null);
    }, 400);
  };

  return (
    <LifetimeGradeBadgeNotificationContext.Provider
      value={{
        lifetimeGradeBadgeAward,
        showLifetimeGradeBadgeNotification,
        setLifetimeGradeBadgeAward,
        setShowLifetimeGradeBadgeNotification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </LifetimeGradeBadgeNotificationContext.Provider>
  );
};

