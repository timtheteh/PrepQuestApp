import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIconWhite from '@/assets/icons/generalIcons/deleteModalIconWhite.svg';
import { useWelcomeBadgeNotification } from '@/contexts/WelcomeBadgeNotificationContext';
import { useFirstStudyFirstInterviewBadgeNotification } from '@/contexts/FirstStudyFirstInterviewNotificationContext';
import { useNumberOfDecksCreatedBadgeNotification } from '@/contexts/NumberOfDecksCreatedNotificationContext';
import { checkAndAwardWelcomeBadges, checkAndAwardNumDecksLifetimeBadges } from '@/db/grades';

interface BackgroundTaskNotificationProps {
  onViewResults?: () => void;
  topOffset?: number;
  onLayout?: (height: number) => void;
}

export const BackgroundTaskNotification: React.FC<BackgroundTaskNotificationProps> = ({ 
  onViewResults,
  topOffset = 0,
  onLayout
}) => {
  const { isBackgroundTaskRunning, backgroundTaskProgress, clearBackgroundTaskProgress, wasAutomaticallyCancelled, isNotificationDismissed, dismissNotification, showBackgroundTaskNotification, setShowBackgroundTaskNotification } = useBackgroundTask();
  const { language } = useLanguage();
  const { showNotification: showWelcomeBadgeNotification } = useWelcomeBadgeNotification();
  const { showNotification: showFirstStudyFirstInterviewBadgeNotification } = useFirstStudyFirstInterviewBadgeNotification();
  const { showNotification: showNumberOfDecksCreatedBadgeNotification } = useNumberOfDecksCreatedBadgeNotification();
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
      if (lastCompletedTaskRef.current !== taskId && !showBackgroundTaskNotification && !isNotificationDismissed) {
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
          
          // Check and award welcome badge for first Gen-AI, File Upload, YouTube Link, or Manual Add deck creation
          // Only check if this is a new deck creation and not adding flashcards to existing deck
          if (!backgroundTaskProgress.isInViewFlashcardsPage && backgroundTaskProgress.createdDeckId) {
            (async () => {
              try {
                // Check task type to determine which badge to award
                const taskType = backgroundTaskProgress.taskType;
                let badgeType: string;
                if (taskType === 'fileUpload') {
                  badgeType = '1st File-Upload Deck';
                } else if (taskType === 'youtubeLink') {
                  badgeType = '1st Youtube Deck';
                } else if (taskType === 'manualAdd') {
                  badgeType = '1st Manual Deck';
                } else {
                  badgeType = '1st Gen-AI Deck';
                }
                
                const welcomeBadgeAward = await checkAndAwardWelcomeBadges(badgeType as any);
                console.log(`🎉 Welcome badge award result for ${taskType}:`, welcomeBadgeAward);
                if (welcomeBadgeAward && welcomeBadgeAward.isNewAchievement) {
                  console.log(`🎉 Showing welcome badge notification for ${taskType} deck`);
                  showWelcomeBadgeNotification(welcomeBadgeAward);
                } else {
                  console.log(`🎉 No ${taskType} welcome badge award or already achieved`);
                }
                
                // Also check for first study/interview deck badges
                const mode = backgroundTaskProgress.mode;
                if (mode === 'study') {
                  const firstStudyBadgeAward = await checkAndAwardWelcomeBadges('1st Study Deck' as any);
                  console.log('🎉 Welcome badge award result for 1st Study Deck:', firstStudyBadgeAward);
                  if (firstStudyBadgeAward && firstStudyBadgeAward.isNewAchievement) {
                    console.log('🎉 Showing first study deck badge notification');
                    showFirstStudyFirstInterviewBadgeNotification(firstStudyBadgeAward);
                  } else {
                    console.log('🎉 No 1st Study Deck welcome badge award or already achieved');
                  }
                } else if (mode === 'interview') {
                  const firstInterviewBadgeAward = await checkAndAwardWelcomeBadges('1st Interview Deck' as any);
                  console.log('🎉 Welcome badge award result for 1st Interview Deck:', firstInterviewBadgeAward);
                  if (firstInterviewBadgeAward && firstInterviewBadgeAward.isNewAchievement) {
                    console.log('🎉 Showing first interview deck badge notification');
                    showFirstStudyFirstInterviewBadgeNotification(firstInterviewBadgeAward);
                  } else {
                    console.log('🎉 No 1st Interview Deck welcome badge award or already achieved');
                  }
                }
              } catch (error) {
                console.error('Error checking welcome badges:', error);
              }
            })();
          }
          
          // Also check for number of decks created lifetime badges
          if (!backgroundTaskProgress.isInViewFlashcardsPage && backgroundTaskProgress.createdDeckId) {
            (async () => {
              try {
                const numDecksLifetimeBadgeAward = await checkAndAwardNumDecksLifetimeBadges();
                console.log('📊 Number of decks created lifetime badge award result:', numDecksLifetimeBadgeAward);
                if (numDecksLifetimeBadgeAward && numDecksLifetimeBadgeAward.isNewAchievement) {
                  console.log('📊 Showing number of decks created lifetime badge notification');
                  showNumberOfDecksCreatedBadgeNotification(numDecksLifetimeBadgeAward);
                } else {
                  console.log('📊 No number of decks created lifetime badge award or already achieved');
                }
              } catch (error) {
                console.error('Error checking number of decks created lifetime badges:', error);
              }
            })();
          }
          
          // Defer state updates and animations to avoid insertion effect conflicts
          setTimeout(() => {
            setNotificationType('success');
            setShowBackgroundTaskNotification(true);
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
        } else if (hasError || backgroundTaskProgress.cancelled || backgroundTaskProgress.automaticallyCancelled || backgroundTaskProgress.networkErrorCancelled || backgroundTaskProgress.manuallyCancelled || backgroundTaskProgress.transcriptError || backgroundTaskProgress.transcriptErrorCancelled) {
          // Task failed or was cancelled
          console.log('Showing error notification for task:', taskId);
          lastCompletedTaskRef.current = taskId;
          processedProgressRef.current = progressId;
          // Preserve notification data so it doesn't disappear when progress is cleared
          preservedNotificationDataRef.current = {
            deckName: backgroundTaskProgress.formData?.deckName || backgroundTaskProgress.deckName || backgroundTaskProgress.notificationDeckName,
            isInViewFlashcardsPage: backgroundTaskProgress.isInViewFlashcardsPage,
            networkError: backgroundTaskProgress.networkError,
            transcriptError: backgroundTaskProgress.transcriptError,
            transcriptErrorCancelled: backgroundTaskProgress.transcriptErrorCancelled,
            errorMessage: backgroundTaskProgress.errorMessage,
            automaticallyCancelled: backgroundTaskProgress.automaticallyCancelled,
            networkErrorCancelled: backgroundTaskProgress.networkErrorCancelled,
            manuallyCancelled: backgroundTaskProgress.manuallyCancelled,
            type: 'error'
          };
          // Defer state updates and animations to avoid insertion effect conflicts
          setTimeout(() => {
            setNotificationType('error');
            setShowBackgroundTaskNotification(true);
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
    if (isNotificationDismissed && showBackgroundTaskNotification) {
      console.log('Hiding notification due to global dismissal');
      // Directly set the notification to hidden without calling hideNotification
      setShowBackgroundTaskNotification(false);
      // Reset the refs to allow future notifications for different tasks
      lastCompletedTaskRef.current = null;
      processedProgressRef.current = null;
      preservedNotificationDataRef.current = null;
    }
  }, [isNotificationDismissed, showBackgroundTaskNotification]);

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
        setShowBackgroundTaskNotification(false);
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

  if (!showBackgroundTaskNotification) {
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
      // Check if this is a transcript error (YouTube-specific)
      const isTranscriptError = backgroundTaskProgress?.transcriptError || notificationData?.transcriptError;
      const isTranscriptErrorCancelled = backgroundTaskProgress?.transcriptErrorCancelled || notificationData?.transcriptErrorCancelled;
      if (isTranscriptError || isTranscriptErrorCancelled) {
        // Use the specific error message from the background task
        const transcriptErrorMessage = backgroundTaskProgress?.errorMessage || notificationData?.errorMessage;
        if (transcriptErrorMessage) {
          return transcriptErrorMessage;
        }
        return strings[language].backgroundTaskNotification.youtubeTranscriptFetchFailed;
      }
      
      // Check if this is a network error
      const isNetworkError = backgroundTaskProgress?.networkError || notificationData?.networkError;
      if (isNetworkError) {
        return strings[language].backgroundTaskNotification.networkErrorTaskCancelled;
      }
      
      // Check if this is an automatic cancellation (30-second timeout)
      const isAutomaticCancellation = backgroundTaskProgress?.automaticallyCancelled || notificationData?.automaticallyCancelled;
      if (isAutomaticCancellation) {
        return strings[language].backgroundTaskNotification.taskCancelledTimeout;
      }
      
      // Check if this is a manual cancellation
      const isManualCancellation = backgroundTaskProgress?.manuallyCancelled || notificationData?.manuallyCancelled;
      if (isManualCancellation) {
        return strings[language].backgroundTaskNotification.taskCancelled;
      }
      
      // Check if this is a general cancellation
      const isCancelled = backgroundTaskProgress?.cancelled || backgroundTaskProgress?.networkErrorCancelled;
      if (isCancelled) {
        return strings[language].backgroundTaskNotification.taskCancelled;
      }
      
      return strings[language].backgroundTaskNotification.errorOccurredDuringCreation;
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
      return strings[language].backgroundTaskNotification.flashcardsCreatedFor.replace('{deckName}', deckName);
    } else {
      // New deck was created (from index, favorites, or viewDecksInFolder pages)
      return strings[language].backgroundTaskNotification.deckCreatedFor.replace('{deckName}', deckName);
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
          top: 60 + topOffset,
        }
      ]}
      onLayout={(event) => {
        if (onLayout) {
          onLayout(event.nativeEvent.layout.height);
        }
      }}
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
                ? strings[language].backgroundTaskNotification.taskCompleted
                : strings[language].backgroundTaskNotification.taskFailed
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
              {strings[language].backgroundTaskNotification.view}
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
    zIndex: 10000,
    elevation: 10000,
  },
  notification: {
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
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