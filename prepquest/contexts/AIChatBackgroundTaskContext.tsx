import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

import { strings } from '@/constants/strings';
import {
  clearAIChatProgress,
  loadAIChatProgress,
  stopAIChatBackgroundTask,
} from '@/utils/aiChatBackgroundTask';
import { useLanguage } from './LanguageContext';

interface AIChatBackgroundTaskContextType {
  isAIChatBackgroundTaskRunning: boolean;
  aiChatBackgroundTaskProgress: any | null;
  wasAutomaticallyCancelled: boolean;
  startAIChatBackgroundTaskMonitoring: () => void;
  stopAIChatBackgroundTaskMonitoring: () => void;
  clearAIChatBackgroundTaskProgress: () => Promise<void>;
  forceStopAIChatBackgroundTask: () => void;
  resetAutomaticallyCancelledFlag: () => void;
}

const AIChatBackgroundTaskContext = createContext<AIChatBackgroundTaskContextType | undefined>(undefined);

export const useAIChatBackgroundTask = () => {
  const context = useContext(AIChatBackgroundTaskContext);
  if (!context) {
    throw new Error('useAIChatBackgroundTask must be used within an AIChatBackgroundTaskProvider');
  }
  return context;
};

interface ProviderProps {
  children: React.ReactNode;
}

export const AIChatBackgroundTaskProvider: React.FC<ProviderProps> = ({ children }) => {
  const [isAIChatBackgroundTaskRunning, setIsAIChatBackgroundTaskRunning] = useState(false);
  const [aiChatBackgroundTaskProgress, setAIChatBackgroundTaskProgress] = useState<any | null>(null);
  const [wasAutomaticallyCancelled, setWasAutomaticallyCancelled] = useState(false);
  const monitoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const forceStoppedRef = useRef(false);
  const lastProgressRef = useRef<string | null>(null);
  const backgroundWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundTerminationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preTerminationNotificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClearingProgressRef = useRef(false);

  const { language } = useLanguage();
  const localeStrings = strings[language] ?? strings.English;
  const englishAIChatNotifications = strings.English.notifications.aiChat;
  const aiChatNotifications = localeStrings.notifications?.aiChat ?? englishAIChatNotifications;
  const {
    backgroundWarningTitle = englishAIChatNotifications.backgroundWarningTitle,
    backgroundWarningBody = englishAIChatNotifications.backgroundWarningBody,
    preTerminationTitle = englishAIChatNotifications.preTerminationTitle,
    preTerminationBody = englishAIChatNotifications.preTerminationBody,
  } = aiChatNotifications;

  const startAIChatBackgroundTaskMonitoring = React.useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    forceStoppedRef.current = false;

    const checkProgress = async () => {
      try {
        const progress = await loadAIChatProgress();

        if (progress) {
          const progressId = JSON.stringify({
            completed: progress.completed,
            inProgress: progress.inProgress,
            error: progress.error,
            networkError: progress.networkError,
            serverError: progress.serverError,
            status: progress.status,
            timestamp: progress.timestamp,
          });

          if (lastProgressRef.current !== progressId) {
            lastProgressRef.current = progressId;
            setAIChatBackgroundTaskProgress(progress);
            setIsAIChatBackgroundTaskRunning(Boolean(progress.inProgress && !progress.completed));
          }
        } else {
          if (aiChatBackgroundTaskProgress !== null && !isClearingProgressRef.current) {
            setAIChatBackgroundTaskProgress(null);
            setIsAIChatBackgroundTaskRunning(false);
          }
        }
      } catch (error) {
        console.error('Error monitoring AI chat background task progress:', error);
      }
    };

    checkProgress();
    monitoringIntervalRef.current = setInterval(checkProgress, 1000);
  }, [aiChatBackgroundTaskProgress]);

  const stopAIChatBackgroundTaskMonitoring = React.useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, []);

  const clearAIChatBackgroundTaskProgress = React.useCallback(async () => {
    try {
      isClearingProgressRef.current = true;
      await clearAIChatProgress();
      setAIChatBackgroundTaskProgress(null);
      setIsAIChatBackgroundTaskRunning(false);
      lastProgressRef.current = null;
    } catch (error) {
      console.error('Failed to clear AI chat background task progress', error);
    } finally {
      setTimeout(() => {
        isClearingProgressRef.current = false;
      }, 200);
    }
  }, []);

  const forceStopAIChatBackgroundTask = React.useCallback(() => {
    forceStoppedRef.current = true;
    stopAIChatBackgroundTaskMonitoring();
    setIsAIChatBackgroundTaskRunning(false);
    setAIChatBackgroundTaskProgress(null);
  }, [stopAIChatBackgroundTaskMonitoring]);

  const resetAutomaticallyCancelledFlag = React.useCallback(() => {
    setWasAutomaticallyCancelled(false);
  }, []);

  const automaticallyCancelAIChat = React.useCallback(async () => {
    try {
      setWasAutomaticallyCancelled(true);
      forceStopAIChatBackgroundTask();
      await stopAIChatBackgroundTask();
      await clearAIChatBackgroundTaskProgress();
    } catch (error) {
      console.error('Error automatically cancelling AI chat task:', error);
    }
  }, [forceStopAIChatBackgroundTask, clearAIChatBackgroundTaskProgress]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundWarningTimerRef.current) {
          clearTimeout(backgroundWarningTimerRef.current);
          backgroundWarningTimerRef.current = null;
        }
        if (backgroundTerminationTimerRef.current) {
          clearTimeout(backgroundTerminationTimerRef.current);
          backgroundTerminationTimerRef.current = null;
        }
        if (preTerminationNotificationTimerRef.current) {
          clearTimeout(preTerminationNotificationTimerRef.current);
          preTerminationNotificationTimerRef.current = null;
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (isAIChatBackgroundTaskRunning) {
          if (backgroundWarningTimerRef.current) {
            clearTimeout(backgroundWarningTimerRef.current);
          }
          if (backgroundTerminationTimerRef.current) {
            clearTimeout(backgroundTerminationTimerRef.current);
          }
          if (preTerminationNotificationTimerRef.current) {
            clearTimeout(preTerminationNotificationTimerRef.current);
          }

          backgroundWarningTimerRef.current = setTimeout(async () => {
            try {
              const progress = await loadAIChatProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: backgroundWarningTitle,
                    body: backgroundWarningBody,
                    data: { type: 'ai_chat_background_warning' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null,
                });
              }
            } catch (error) {
              console.error('Error sending AI chat background warning notification:', error);
            }
          }, 1000);

          preTerminationNotificationTimerRef.current = setTimeout(async () => {
            try {
              const progress = await loadAIChatProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: preTerminationTitle,
                    body: preTerminationBody,
                    data: { type: 'ai_chat_pre_termination' },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                  },
                  trigger: null,
                });
              }
            } catch (error) {
              console.error('Error sending AI chat pre-termination notification:', error);
            }
          }, 29000);

          backgroundTerminationTimerRef.current = setTimeout(async () => {
            try {
              const progress = await loadAIChatProgress();
              if (progress && progress.inProgress && !progress.completed && !progress.cancelled && !progress.error) {
                await automaticallyCancelAIChat();
              }
            } catch (error) {
              console.error('Error during automatic AI chat termination:', error);
            }
          }, 30000);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const initialize = async () => {
      try {
        const progress = await loadAIChatProgress();
        if (progress && progress.inProgress && !progress.completed) {
          console.log('Clearing stale AI chat background task progress on start');
          await clearAIChatBackgroundTaskProgress();
        }
      } catch (error) {
        console.error('Error clearing stale AI chat progress:', error);
      } finally {
        startAIChatBackgroundTaskMonitoring();
      }
    };

    initialize();

    return () => {
      subscription.remove();
      stopAIChatBackgroundTaskMonitoring();

      if (backgroundWarningTimerRef.current) {
        clearTimeout(backgroundWarningTimerRef.current);
        backgroundWarningTimerRef.current = null;
      }
      if (backgroundTerminationTimerRef.current) {
        clearTimeout(backgroundTerminationTimerRef.current);
        backgroundTerminationTimerRef.current = null;
      }
      if (preTerminationNotificationTimerRef.current) {
        clearTimeout(preTerminationNotificationTimerRef.current);
        preTerminationNotificationTimerRef.current = null;
      }
    };
  }, [
    automaticallyCancelAIChat,
    clearAIChatBackgroundTaskProgress,
    isAIChatBackgroundTaskRunning,
    preTerminationBody,
    preTerminationTitle,
    startAIChatBackgroundTaskMonitoring,
    stopAIChatBackgroundTaskMonitoring,
    backgroundWarningBody,
    backgroundWarningTitle,
  ]);

  const value: AIChatBackgroundTaskContextType = {
    isAIChatBackgroundTaskRunning,
    aiChatBackgroundTaskProgress,
    wasAutomaticallyCancelled,
    startAIChatBackgroundTaskMonitoring,
    stopAIChatBackgroundTaskMonitoring,
    clearAIChatBackgroundTaskProgress,
    forceStopAIChatBackgroundTask,
    resetAutomaticallyCancelledFlag,
  };

  return (
    <AIChatBackgroundTaskContext.Provider value={value}>
      {children}
    </AIChatBackgroundTaskContext.Provider>
  );
};

