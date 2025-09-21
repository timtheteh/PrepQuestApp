import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, InteractionManager } from 'react-native';
import { useClearDataBackgroundTask } from '@/contexts/ClearDataBackgroundTaskContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIconWhite from '@/assets/icons/generalIcons/deleteModalIconWhite.svg';

interface ClearDataTaskNotificationProps {
  onViewResults?: () => void;
}

export const ClearDataTaskNotification: React.FC<ClearDataTaskNotificationProps> = ({ 
  onViewResults 
}) => {
  const { isClearDataBackgroundTaskRunning, clearDataBackgroundTaskProgress, clearClearDataBackgroundTaskProgress } = useClearDataBackgroundTask();
  const { language } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const lastCompletedTaskRef = useRef<string | null>(null);
  const processedProgressRef = useRef<string | null>(null);
  const preservedNotificationDataRef = useRef<any>(null);

  useEffect(() => {
    // Check if a clear data task just completed
    if (clearDataBackgroundTaskProgress) {
      const isCompleted = clearDataBackgroundTaskProgress.completed;
      const hasError = clearDataBackgroundTaskProgress.error;
      const wasRunning = clearDataBackgroundTaskProgress.inProgress;
      
      // Show notification when task completes (either from running to completed, or when we detect completed state)
      const shouldShowNotification = (isCompleted || hasError) && !isClearDataBackgroundTaskRunning;
      
      // Create a unique identifier for this specific progress data
      const progressId = JSON.stringify({
        completed: isCompleted,
        error: hasError,
        timestamp: clearDataBackgroundTaskProgress.timestamp,
        message: clearDataBackgroundTaskProgress.message
      });
      
      // Skip if we've already processed this exact progress data
      if (processedProgressRef.current === progressId) {
        console.log('Skipping clear data notification - already processed this progress data');
        return;
      }
      
      console.log('ClearDataTaskNotification - Progress update:', {
        isCompleted,
        hasError,
        wasRunning,
        isClearDataBackgroundTaskRunning,
        shouldShowNotification,
        message: clearDataBackgroundTaskProgress.message,
        timestamp: clearDataBackgroundTaskProgress.timestamp,
        lastCompletedTaskRef: lastCompletedTaskRef.current,
        progressId
      });
      
      // Don't show notification if progress is being cleared
      if (clearDataBackgroundTaskProgress.isClearing) {
        console.log('Skipping clear data notification - progress is being cleared');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if push notification was already sent
      if (clearDataBackgroundTaskProgress.notificationSent) {
        console.log('Skipping clear data notification - push notification was already sent');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if the progress data is too old (stale)
      const now = Date.now();
      const progressTime = clearDataBackgroundTaskProgress.timestamp || 0;
      const timeDiff = now - progressTime;
      if (timeDiff > 30000) { // 30 seconds
        console.log('Skipping clear data notification - progress data is too old (stale)');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Create a unique identifier for this task completion
      const taskId = `clearData-${isCompleted}-${hasError}`;
      
      console.log('ClearDataTaskNotification - Task ID:', taskId);
      
      // Only show notification if we haven't shown one for this specific task completion and should show notification
      if (lastCompletedTaskRef.current !== taskId && !showNotification && shouldShowNotification) {
        if (isCompleted && !hasError) {
          // Task completed successfully
          console.log('Showing clear data success notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            message: clearDataBackgroundTaskProgress.message,
            type: 'success'
          };
          // Defer state updates and animations until after insertion/layout phase
          InteractionManager.runAfterInteractions(() => {
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
          });
        } else if (hasError) {
          // Task failed
          console.log('Showing clear data error notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            message: clearDataBackgroundTaskProgress.errorMessage || clearDataBackgroundTaskProgress.message,
            type: 'error'
          };
          // Defer state updates and animations until after insertion/layout phase
          InteractionManager.runAfterInteractions(() => {
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
          });
        }
      } else {
        console.log('Skipping duplicate clear data notification for task:', taskId);
      }
    }
  }, [isClearDataBackgroundTaskRunning, clearDataBackgroundTaskProgress]);

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
      setShowNotification(false);
      // Reset the refs to allow future notifications for different tasks
      lastCompletedTaskRef.current = null;
      processedProgressRef.current = null;
      preservedNotificationDataRef.current = null;
    });
  };

  const handleViewResults = () => {
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
  const isSuccess = notificationType === 'success';
  
  // Determine the message
  const getMessage = () => {
    if (!isSuccess) {
      return strings[language].clearDataTaskNotification.errorOccurredDuringClearData;
    }
    
    // Get message from multiple possible sources
    const message = strings[language].clearDataTaskNotification.localStorageDataSuccessfullyCleared;
    
    return message;
  };

  const message = getMessage();

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
                ? strings[language].clearDataTaskNotification.clearDataCompleted
                : strings[language].clearDataTaskNotification.clearDataFailed
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
              {strings[language].clearDataTaskNotification.view}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissButton} onPress={hideNotification}>
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
