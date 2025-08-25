import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, InteractionManager } from 'react-native';
import { useBackupBackgroundTask } from '@/contexts/BackupBackgroundTaskContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIconWhite from '@/assets/icons/generalIcons/deleteModalIconWhite.svg';

interface BackupTaskNotificationProps {
  onViewResults?: () => void;
}

export const BackupTaskNotification: React.FC<BackupTaskNotificationProps> = ({ 
  onViewResults 
}) => {
  const { isBackupBackgroundTaskRunning, backupBackgroundTaskProgress, clearBackupBackgroundTaskProgress } = useBackupBackgroundTask();
  const { language } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  const lastCompletedTaskRef = useRef<string | null>(null);
  const processedProgressRef = useRef<string | null>(null);
  const preservedNotificationDataRef = useRef<any>(null);

  useEffect(() => {
    // Check if a backup task just completed
    if (backupBackgroundTaskProgress) {
      const isCompleted = backupBackgroundTaskProgress.completed;
      const hasError = backupBackgroundTaskProgress.error;
      const wasRunning = backupBackgroundTaskProgress.inProgress;
      
      // Show notification when task completes (either from running to completed, or when we detect completed state)
      const shouldShowNotification = (isCompleted || hasError) && !isBackupBackgroundTaskRunning;
      
      // Create a unique identifier for this specific progress data
      const progressId = JSON.stringify({
        completed: isCompleted,
        error: hasError,
        timestamp: backupBackgroundTaskProgress.timestamp,
        message: backupBackgroundTaskProgress.message
      });
      
      // Skip if we've already processed this exact progress data
      if (processedProgressRef.current === progressId) {
        console.log('Skipping backup notification - already processed this progress data');
        return;
      }
      
      console.log('BackupTaskNotification - Progress update:', {
        isCompleted,
        hasError,
        wasRunning,
        isBackupBackgroundTaskRunning,
        shouldShowNotification,
        message: backupBackgroundTaskProgress.message,
        timestamp: backupBackgroundTaskProgress.timestamp,
        lastCompletedTaskRef: lastCompletedTaskRef.current,
        progressId
      });
      
      // Don't show notification if progress is being cleared
      if (backupBackgroundTaskProgress.isClearing) {
        console.log('Skipping backup notification - progress is being cleared');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if push notification was already sent
      if (backupBackgroundTaskProgress.notificationSent) {
        console.log('Skipping backup notification - push notification was already sent');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Don't show notification if the progress data is too old (stale)
      const now = Date.now();
      const progressTime = backupBackgroundTaskProgress.timestamp || 0;
      const timeDiff = now - progressTime;
      if (timeDiff > 30000) { // 30 seconds
        console.log('Skipping backup notification - progress data is too old (stale)');
        processedProgressRef.current = progressId;
        return;
      }
      
      // Create a unique identifier for this task completion
      const taskId = `backup-${isCompleted}-${hasError}`;
      
      console.log('BackupTaskNotification - Task ID:', taskId);
      
      // Only show notification if we haven't shown one for this specific task completion and should show notification
      if (lastCompletedTaskRef.current !== taskId && !showNotification && shouldShowNotification) {
        if (isCompleted && !hasError) {
          // Task completed successfully
          console.log('Showing backup success notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            message: backupBackgroundTaskProgress.message,
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
          console.log('Showing backup error notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            message: backupBackgroundTaskProgress.errorMessage || backupBackgroundTaskProgress.message,
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
        console.log('Skipping duplicate backup notification for task:', taskId);
      }
    }
  }, [isBackupBackgroundTaskRunning, backupBackgroundTaskProgress]);

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
      return language === 'Chinese' ? '备份过程中出现错误' : 'An error occurred during backup';
    }
    
    // Get message from multiple possible sources
    const message = (language === 'Chinese' ? '数据已成功上传到云端!' : 'Data successfully uploaded to cloud!');
    
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
                ? (language === 'Chinese' ? '备份完成！' : 'Backup Completed!')
                : (language === 'Chinese' ? '备份失败' : 'Backup Failed')
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
