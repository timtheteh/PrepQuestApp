import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIconWhite from '@/assets/icons/generalIcons/deleteModalIconWhite.svg';

interface BackgroundTaskNotificationProps {
  onViewResults?: () => void;
}

export const BackgroundTaskNotification: React.FC<BackgroundTaskNotificationProps> = ({ 
  onViewResults 
}) => {
  const { isBackgroundTaskRunning, backgroundTaskProgress, clearBackgroundTaskProgress, wasAutomaticallyCancelled, isNotificationDismissed, dismissNotification } = useBackgroundTask();
  const { language } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const lastCompletedTaskRef = useRef<string | null>(null);
  const processedProgressRef = useRef<string | null>(null);
  const preservedNotificationDataRef = useRef<any>(null);

  useEffect(() => {
    // Check if a background task just completed
    if (!isBackgroundTaskRunning && backgroundTaskProgress) {
      const isCompleted = backgroundTaskProgress.completed;
      const hasError = backgroundTaskProgress.error;
      
      // Create a unique identifier for this specific progress data
      const progressId = JSON.stringify({
        completed: isCompleted,
        error: hasError,
        deckId: backgroundTaskProgress.createdDeckId,
        flashcardIds: backgroundTaskProgress.createdFlashcardIds,
        timestamp: backgroundTaskProgress.timestamp,
        deckName: backgroundTaskProgress.formData?.deckName || backgroundTaskProgress.deckName
      });
      
      // Skip if we've already processed this exact progress data
      if (processedProgressRef.current === progressId) {
        console.log('Skipping notification - already processed this progress data');
        return;
      }
      
      console.log('BackgroundTaskNotification - Progress update:', {
        isCompleted,
        hasError,
        deckName: backgroundTaskProgress.formData?.deckName || backgroundTaskProgress.deckName,
        timestamp: backgroundTaskProgress.timestamp,
        lastCompletedTaskRef: lastCompletedTaskRef.current,
        progressId
      });
      
      // Don't show notification if progress data is incomplete (missing deck name)
      // This prevents the fallback "Deck created for 'Deck'" message
      if (isCompleted && !hasError && (!backgroundTaskProgress.formData?.deckName && !backgroundTaskProgress.deckName)) {
        console.log('Skipping notification - incomplete progress data (missing deck name)');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if progress is being cleared
      if (backgroundTaskProgress.isClearing) {
        console.log('Skipping notification - progress is being cleared');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if push notification was already sent
      if (backgroundTaskProgress.notificationSent) {
        console.log('Skipping notification - push notification was already sent');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if the progress data is too old (stale)
      const now = Date.now();
      const progressTime = backgroundTaskProgress.timestamp || 0;
      const timeDiff = now - progressTime;
      if (timeDiff > 30000) { // 30 seconds
        console.log('Skipping notification - progress data is too old (stale)');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Create a unique identifier for this task completion
      // Use a more stable identifier that doesn't change with timestamps
      const taskId = `${backgroundTaskProgress.createdDeckId || 'no-deck'}-${backgroundTaskProgress.createdFlashcardIds?.join(',') || 'no-flashcards'}-${isCompleted}-${hasError}`;
      
      console.log('BackgroundTaskNotification - Task ID:', taskId);
      
      // Only show notification if we haven't shown one for this specific task completion and it hasn't been globally dismissed
      if (lastCompletedTaskRef.current !== taskId && !showNotification && !isNotificationDismissed) {
        if (isCompleted && !hasError) {
          // Task completed successfully
          console.log('Showing success notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            deckName: backgroundTaskProgress.formData?.deckName || backgroundTaskProgress.deckName || backgroundTaskProgress.notificationDeckName,
            isInViewFlashcardsPage: backgroundTaskProgress.isInViewFlashcardsPage,
            type: 'success'
          };
          // Defer state updates and animations to avoid insertion effect conflicts
          setTimeout(() => {
            setNotificationType('success');
            setShowNotification(true);
            Animated.parallel([
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
            setTimeout(() => {
              hideNotification();
            }, 5000);
          }, 0);
        } else if (hasError || backgroundTaskProgress.cancelled || backgroundTaskProgress.automaticallyCancelled || backgroundTaskProgress.networkErrorCancelled || backgroundTaskProgress.manuallyCancelled) {
          // Task failed or was cancelled
          console.log('Showing error notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            deckName: backgroundTaskProgress.formData?.deckName || backgroundTaskProgress.deckName || backgroundTaskProgress.notificationDeckName,
            isInViewFlashcardsPage: backgroundTaskProgress.isInViewFlashcardsPage,
            networkError: backgroundTaskProgress.networkError,
            automaticallyCancelled: backgroundTaskProgress.automaticallyCancelled,
            networkErrorCancelled: backgroundTaskProgress.networkErrorCancelled,
            manuallyCancelled: backgroundTaskProgress.manuallyCancelled,
            type: 'error'
          };
          // Defer state updates and animations to avoid insertion effect conflicts
          setTimeout(() => {
            setNotificationType('error');
            setShowNotification(true);
            Animated.parallel([
              Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
            setTimeout(() => {
              hideNotification();
            }, 5000);
          }, 0);
        }
      } else {
        console.log('Skipping duplicate notification for task:', taskId);
      }
    }
  }, [isBackgroundTaskRunning, backgroundTaskProgress]);

  // Effect to hide notification when globally dismissed
  useEffect(() => {
    if (isNotificationDismissed && showNotification) {
      console.log('Hiding notification due to global dismissal');
      // Directly set the notification to hidden without calling hideNotification
      setShowNotification(false);
      // Reset the refs to allow future notifications for different tasks
      lastCompletedTaskRef.current = null;
      processedProgressRef.current = null;
      preservedNotificationDataRef.current = null;
    }
  }, [isNotificationDismissed, showNotification]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setShowNotification(false);
        // Don't clear progress immediately to prevent duplicate notifications
        // The progress will be cleared by the BackgroundTaskContext when appropriate
        // Reset the refs to allow future notifications for different tasks
        lastCompletedTaskRef.current = null;
        processedProgressRef.current = null;
        preservedNotificationDataRef.current = null;
      }, 0);
    });
  };

  const handleViewResults = () => {
    dismissNotification();
    hideNotification();
    if (onViewResults) {
      onViewResults();
    }
  };

  if (!showNotification) {
    return null;
  }

  // Use preserved notification data if available (when progress is cleared)
  const notificationData = preservedNotificationDataRef.current;
  const isInViewFlashcardsPage = notificationData?.isInViewFlashcardsPage || backgroundTaskProgress?.isInViewFlashcardsPage;
  const isSuccess = notificationType === 'success';
  
  // Determine the message based on where the task was created
  const getMessage = () => {
    // Use preserved notification data if available (when progress is cleared)
    const notificationData = preservedNotificationDataRef.current;
    const isInViewFlashcardsPage = notificationData?.isInViewFlashcardsPage || backgroundTaskProgress?.isInViewFlashcardsPage;
    const isSuccess = notificationType === 'success';
    
    if (!isSuccess) {
      // Check if this is a network error
      const isNetworkError = backgroundTaskProgress?.networkError || notificationData?.networkError;
      if (isNetworkError) {
        return language === 'Chinese' ? '网络错误，任务已取消' : 'Network error occurred, task cancelled';
      }
      
      // Check if this is an automatic cancellation (30-second timeout)
      const isAutomaticCancellation = backgroundTaskProgress?.automaticallyCancelled || notificationData?.automaticallyCancelled;
      if (isAutomaticCancellation) {
        return language === 'Chinese' ? '任务已取消（超时）' : 'Task cancelled (timeout)';
      }
      
      // Check if this is a manual cancellation
      const isManualCancellation = backgroundTaskProgress?.manuallyCancelled || notificationData?.manuallyCancelled;
      if (isManualCancellation) {
        return language === 'Chinese' ? '任务已取消' : 'Task cancelled';
      }
      
      // Check if this is a general cancellation
      const isCancelled = backgroundTaskProgress?.cancelled || backgroundTaskProgress?.networkErrorCancelled;
      if (isCancelled) {
        return language === 'Chinese' ? '任务已取消' : 'Task cancelled';
      }
      
      return language === 'Chinese' ? '创建过程中出现错误' : 'An error occurred during creation';
    }
    
    // Get deck name from multiple possible sources
    const deckName = notificationData?.deckName || 
                     backgroundTaskProgress?.formData?.deckName || 
                     backgroundTaskProgress?.deckName || 
                     backgroundTaskProgress?.notificationDeckName;
    
    // If we still don't have a deck name, don't show the notification
    if (!deckName || deckName === 'Deck') {
      console.log('Skipping notification - no valid deck name found');
      return null;
    }
    
    if (isInViewFlashcardsPage) {
      // Flashcards were added to existing deck
      return language === 'Chinese' 
        ? `闪卡已为"${deckName}"创建`
        : `Flashcards created for "${deckName}"`;
    } else {
      // New deck was created (from index, favorites, or viewDecksInFolder pages)
      return language === 'Chinese' 
        ? `卡组"${deckName}"已创建`
        : `Deck created for "${deckName}"`;
    }
  };

  const message = getMessage();
  
  // Don't render if we don't have a valid message
  if (!message) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <View style={[styles.notification, { backgroundColor: isSuccess ? '#44B88A' : '#D7191C' }]}>
        <View style={styles.content}>
            {isSuccess ? (
                <GreenTickIcon width={24} height={24} style={styles.icon} />
              ) : (
                <DeleteModalIconWhite width={24} height={24} style={styles.icon} />
              )}     
            <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isSuccess 
                ? (language === 'Chinese' ? '任务完成！' : 'Task Completed!')
                : (language === 'Chinese' ? '任务失败' : 'Task Failed')
              }
            </Text>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>
        </View>
        {isSuccess && onViewResults && (
          <TouchableOpacity style={styles.viewButton} onPress={handleViewResults}>
            <Text style={styles.viewButtonText}>
              {language === 'Chinese' ? '查看' : 'View'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissButton} onPress={() => {
          dismissNotification();
          hideNotification();
        }}>
          <Text style={styles.dismissButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notification: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  viewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  viewButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 