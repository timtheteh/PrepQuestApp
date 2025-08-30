import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, InteractionManager } from 'react-native';
import { useImportBackgroundTask } from '@/contexts/ImportBackgroundTaskContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIconWhite from '@/assets/icons/generalIcons/deleteModalIconWhite.svg';

interface ImportTaskNotificationProps {
  onViewResults?: () => void;
}

export const ImportTaskNotification: React.FC<ImportTaskNotificationProps> = ({ 
  onViewResults 
}) => {
  const { isImportBackgroundTaskRunning, importBackgroundTaskProgress, clearImportBackgroundTaskProgress } = useImportBackgroundTask();
  const { language } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const lastCompletedTaskRef = useRef<string | null>(null);
  const processedProgressRef = useRef<string | null>(null);
  const preservedNotificationDataRef = useRef<any>(null);

  useEffect(() => {
    // Check if an import task just completed
    if (importBackgroundTaskProgress) {
      const isCompleted = importBackgroundTaskProgress.completed;
      const hasError = importBackgroundTaskProgress.error;
      const hasNetworkError = importBackgroundTaskProgress.networkError;
      const wasRunning = importBackgroundTaskProgress.inProgress;
      
      // Show notification when task completes (either from running to completed, or when we detect completed state)
      const shouldShowNotification = (isCompleted || hasError || hasNetworkError) && !isImportBackgroundTaskRunning;
      
      // Create a unique identifier for this specific progress data
      const progressId = JSON.stringify({
        completed: isCompleted,
        error: hasError,
        networkError: hasNetworkError,
        timestamp: importBackgroundTaskProgress.timestamp,
        message: importBackgroundTaskProgress.message
      });
      
      // Skip if we've already processed this exact progress data
      if (processedProgressRef.current === progressId) {
        console.log('Skipping import notification - already processed this progress data');
        return;
      }
      
      console.log('ImportTaskNotification - Progress update:', {
        isCompleted,
        hasError,
        hasNetworkError,
        wasRunning,
        isImportBackgroundTaskRunning,
        shouldShowNotification,
        message: importBackgroundTaskProgress.message,
        timestamp: importBackgroundTaskProgress.timestamp,
        lastCompletedTaskRef: lastCompletedTaskRef.current,
        progressId
      });
      
      // Don't show notification if progress is being cleared
      if (importBackgroundTaskProgress.isClearing) {
        console.log('Skipping import notification - progress is being cleared');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if push notification was already sent
      if (importBackgroundTaskProgress.notificationSent) {
        console.log('Skipping import notification - push notification was already sent');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if the progress data is too old (stale)
      const now = Date.now();
      const progressTime = importBackgroundTaskProgress.timestamp || 0;
      const timeDiff = now - progressTime;
      if (timeDiff > 30000) { // 30 seconds
        console.log('Skipping import notification - progress data is too old (stale)');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Create a unique identifier for this task completion
      const taskId = `import-${isCompleted}-${hasError}-${hasNetworkError}`;
      
      console.log('ImportTaskNotification - Task ID:', taskId);
      
      // Only show notification if we haven't shown one for this specific task completion and should show notification
      if (lastCompletedTaskRef.current !== taskId && !showNotification && shouldShowNotification) {
        if (isCompleted && !hasError && !hasNetworkError) {
          // Task completed successfully
          console.log('Showing import success notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            message: importBackgroundTaskProgress.message,
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
        } else if (hasError || hasNetworkError) {
          // Task failed (general error or network error)
          console.log(`Showing import ${hasNetworkError ? 'network error' : 'error'} notification for task:`, taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            message: importBackgroundTaskProgress.errorMessage || importBackgroundTaskProgress.message,
            type: 'error',
            isNetworkError: hasNetworkError
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
        console.log('Skipping duplicate import notification for task:', taskId);
      }
    }
  }, [isImportBackgroundTaskRunning, importBackgroundTaskProgress]);

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
      // Check if it's a network error
      if (notificationData?.isNetworkError) {
        return language === 'Chinese' ? '糟糕，导入因网络错误而取消！' : 'Oops import has cancelled due to a network error!';
      }
      return language === 'Chinese' ? '导入过程中出现错误' : 'An error occurred during import';
    }
    
    // Get message from multiple possible sources
    const message = (language === 'Chinese' ? '数据已成功从云端导入!' : 'Data successfully imported from cloud!');
    
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
                ? (language === 'Chinese' ? '导入完成！' : 'Import Completed!')
                : notificationData?.isNetworkError
                  ? (language === 'Chinese' ? '导入已取消！' : 'Import cancelled!')
                  : (language === 'Chinese' ? '导入失败' : 'Import Failed')
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
