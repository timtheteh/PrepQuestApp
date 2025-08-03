import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';

interface BackgroundTaskNotificationProps {
  onViewResults?: () => void;
}

export const BackgroundTaskNotification: React.FC<BackgroundTaskNotificationProps> = ({ 
  onViewResults 
}) => {
  const { isBackgroundTaskRunning, backgroundTaskProgress, clearBackgroundTaskProgress } = useBackgroundTask();
  const { language } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Check if a background task just completed
    if (!isBackgroundTaskRunning && backgroundTaskProgress) {
      const isCompleted = backgroundTaskProgress.completed;
      const hasError = backgroundTaskProgress.error;
      
      if (isCompleted && !hasError) {
        // Task completed successfully
        setNotificationType('success');
        setShowNotification(true);
        
        // Animate in
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
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          hideNotification();
        }, 5000);
      } else if (hasError) {
        // Task failed
        setNotificationType('error');
        setShowNotification(true);
        
        // Animate in
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
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          hideNotification();
        }, 5000);
      }
    }
  }, [isBackgroundTaskRunning, backgroundTaskProgress]);

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
      // Clear progress when notification is dismissed
      setTimeout(() => {
        clearBackgroundTaskProgress();
      }, 1000); // Small delay to ensure UI updates are complete
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

  const isInViewFlashcardsPage = backgroundTaskProgress?.isInViewFlashcardsPage;
  const isSuccess = notificationType === 'success';

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
          <GreenTickIcon width={24} height={24} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isSuccess 
                ? (language === 'Chinese' ? '任务完成！' : 'Task Completed!')
                : (language === 'Chinese' ? '任务失败' : 'Task Failed')
              }
            </Text>
            <Text style={styles.message}>
              {isSuccess 
                ? (language === 'Chinese' ? '卡组和闪卡已成功创建' : 'Deck and flashcards successfully created')
                : (language === 'Chinese' ? '创建过程中出现错误' : 'An error occurred during creation')
              }
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