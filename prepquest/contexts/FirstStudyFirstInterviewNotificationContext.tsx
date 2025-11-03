import React, { createContext, useContext, useState } from 'react';
import { WelcomeBadgeAward } from '@/db/grades';

interface FirstStudyFirstInterviewNotificationContextType {
  firstStudyFirstInterviewBadgeAward: WelcomeBadgeAward | null;
  showFirstStudyFirstInterviewBadgeNotification: boolean;
  setFirstStudyFirstInterviewBadgeAward: (award: WelcomeBadgeAward | null) => void;
  setShowFirstStudyFirstInterviewBadgeNotification: (show: boolean) => void;
  showNotification: (award: WelcomeBadgeAward) => void;
  dismissNotification: () => void;
}

const FirstStudyFirstInterviewNotificationContext = createContext<FirstStudyFirstInterviewNotificationContextType | undefined>(undefined);

export const useFirstStudyFirstInterviewBadgeNotification = () => {
  const context = useContext(FirstStudyFirstInterviewNotificationContext);
  if (!context) {
    throw new Error('useFirstStudyFirstInterviewBadgeNotification must be used within a FirstStudyFirstInterviewBadgeNotificationProvider');
  }
  return context;
};

interface FirstStudyFirstInterviewBadgeNotificationProviderProps {
  children: React.ReactNode;
}

export const FirstStudyFirstInterviewBadgeNotificationProvider: React.FC<FirstStudyFirstInterviewBadgeNotificationProviderProps> = ({ children }) => {
  const [firstStudyFirstInterviewBadgeAward, setFirstStudyFirstInterviewBadgeAward] = useState<WelcomeBadgeAward | null>(null);
  const [showFirstStudyFirstInterviewBadgeNotification, setShowFirstStudyFirstInterviewBadgeNotification] = useState(false);

  const showNotification = (award: WelcomeBadgeAward) => {
    console.log('🎖️ Showing first study/first interview badge notification:', award);
    setFirstStudyFirstInterviewBadgeAward(award);
    setShowFirstStudyFirstInterviewBadgeNotification(true);
  };

  const dismissNotification = () => {
    console.log('🎖️ Dismissing first study/first interview badge notification');
    setShowFirstStudyFirstInterviewBadgeNotification(false);
    // Clear the award after animation completes (300ms animation + small buffer)
    setTimeout(() => {
      setFirstStudyFirstInterviewBadgeAward(null);
    }, 400);
  };

  return (
    <FirstStudyFirstInterviewNotificationContext.Provider
      value={{
        firstStudyFirstInterviewBadgeAward,
        showFirstStudyFirstInterviewBadgeNotification,
        setFirstStudyFirstInterviewBadgeAward,
        setShowFirstStudyFirstInterviewBadgeNotification,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </FirstStudyFirstInterviewNotificationContext.Provider>
  );
};

