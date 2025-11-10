import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface DeckCreationStatusPageProps {
  statusRows?: { done: boolean, label: string }[];
  isInViewFlashcardsPage?: boolean;
  onCancel?: () => void;
  onMinimize?: () => void;
}

export default function DeckCreationStatusPage({ 
  statusRows, 
  isInViewFlashcardsPage = false, 
  onCancel, 
  onMinimize 
}: DeckCreationStatusPageProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { backgroundTaskProgress, forceStopBackgroundTask, wasAutomaticallyCancelled, resetAutomaticallyCancelledFlag } = useBackgroundTask();
  const [currentStatusRows, setCurrentStatusRows] = useState<{ done: boolean, label: string }[]>([]);
  const [currentIsInViewFlashcardsPage, setCurrentIsInViewFlashcardsPage] = useState(false);
  const [deckName, setDeckName] = useState<string>('');
  const cancelCreationRef = useRef(false);
  const hasNavigatedRef = useRef(false);
  const lastProgressRef = useRef<any>(null);
  const isNewTaskRef = useRef(true); // Track if this is a new task

  // Helper to clear GenAI deck creation progress
  const clearGenAIDeckCreationProgress = async () => {
    try { 
      await AsyncStorage.removeItem('genAIDeckCreationBgTaskProgress'); 
    } catch (e) {
      console.error('Failed to clear GenAI deck creation progress', e);
    }
  };

  // Reset the automatically cancelled flag when component mounts (for new tasks)
  useEffect(() => {
    console.log('🚀 DeckCreationStatusPage - Component mounted, resetting automatically cancelled flag');
    console.log('🚀 Initial state check:', {
      wasAutomaticallyCancelled,
      hasBackgroundTaskProgress: !!backgroundTaskProgress,
      backgroundTaskProgressKeys: backgroundTaskProgress ? Object.keys(backgroundTaskProgress) : [],
      hasNavigated: hasNavigatedRef.current
    });
    resetAutomaticallyCancelledFlag();
  }, []);

  // Initialize status rows from props or params (only if no background task is running)
  useEffect(() => {
    if (!backgroundTaskProgress) {
      if (statusRows) {
        setCurrentStatusRows(statusRows);
        setCurrentIsInViewFlashcardsPage(isInViewFlashcardsPage || false);
      } else if (params.statusRows) {
        try {
          const parsedStatusRows = JSON.parse(params.statusRows as string);
          setCurrentStatusRows(parsedStatusRows);
          setCurrentIsInViewFlashcardsPage(params.isInViewFlashcardsPage === 'true');
        } catch (error) {
          console.error('Error parsing status rows from params:', error);
        }
      }
    }
  }, [statusRows, params.statusRows, params.isInViewFlashcardsPage, isInViewFlashcardsPage, backgroundTaskProgress]);

  // Update status rows based on background task progress
  useEffect(() => {
    console.log('🔄 DeckCreationStatusPage - useEffect triggered with:', {
      hasBackgroundTaskProgress: !!backgroundTaskProgress,
      wasAutomaticallyCancelled,
      hasNavigated: hasNavigatedRef.current,
      progressKeys: backgroundTaskProgress ? Object.keys(backgroundTaskProgress) : [],
      progressData: backgroundTaskProgress ? {
        networkError: backgroundTaskProgress.networkError,
        status: backgroundTaskProgress.status,
        automaticallyCancelled: backgroundTaskProgress.automaticallyCancelled,
        cancelled: backgroundTaskProgress.cancelled,
        completed: backgroundTaskProgress.completed,
        error: backgroundTaskProgress.error
      } : null
    });
    
    // Check if we had completed progress that is now cleared (progress went from completed to null)
    if (!backgroundTaskProgress && lastProgressRef.current && lastProgressRef.current.completed && !lastProgressRef.current.error && !lastProgressRef.current.cancelled && !hasNavigatedRef.current) {
      console.log('✅ DeckCreationStatusPage - Detected completion followed by clearing, navigating back');
      hasNavigatedRef.current = true;
      setTimeout(() => {
        router.back();
      }, 1000); // Short delay to show final completion state
    }
    
    // Check if there's a network error - if so, dismiss immediately like cancel
    // BUT only if this is not a new task (to prevent auto-minimization of new tasks)
    if (backgroundTaskProgress && backgroundTaskProgress.networkError && !hasNavigatedRef.current && !isNewTaskRef.current) {
      console.log('🚨 DeckCreationStatusPage - NETWORK ERROR DETECTED! DISMISSING STATUS PAGE IMMEDIATELY!');
      console.log('🚨 Network error details:', backgroundTaskProgress.networkError);
      hasNavigatedRef.current = true;
      // Immediately dismiss like cancel button
      handleCancel();
      return;
    }
    
    // Check if there's a server error - dismiss similarly
    if (backgroundTaskProgress && backgroundTaskProgress.serverError && !hasNavigatedRef.current && !isNewTaskRef.current) {
      console.log('🚨 DeckCreationStatusPage - SERVER ERROR DETECTED! DISMISSING STATUS PAGE IMMEDIATELY!');
      console.log('🚨 Server error status code:', backgroundTaskProgress.serverStatusCode);
      hasNavigatedRef.current = true;
      handleCancel();
      return;
    }
    
    // ALSO check for networkError status string
    if (backgroundTaskProgress && backgroundTaskProgress.status === 'networkError' && !hasNavigatedRef.current && !isNewTaskRef.current) {
      console.log('🚨 DeckCreationStatusPage - NETWORK ERROR STATUS DETECTED! DISMISSING STATUS PAGE IMMEDIATELY!');
      console.log('🚨 Network error status:', backgroundTaskProgress.status);
      hasNavigatedRef.current = true;
      // Immediately dismiss like cancel button
      handleCancel();
      return;
    }
    
    // Check if task was automatically cancelled (30-second timeout)
    // BUT only if this is not a new task (to prevent auto-minimization of new tasks)
    const wasAutoCancelled = wasAutomaticallyCancelled || (backgroundTaskProgress?.automaticallyCancelled === true);
    if (wasAutoCancelled && !hasNavigatedRef.current && !isNewTaskRef.current) {
      console.log('🚨 DeckCreationStatusPage - AUTOMATIC CANCELLATION DETECTED! DISMISSING STATUS PAGE IMMEDIATELY!');
      console.log('🚨 Auto cancellation details:', {
        wasAutomaticallyCancelled,
        progressAutomaticallyCancelled: backgroundTaskProgress?.automaticallyCancelled
      });
      hasNavigatedRef.current = true;
      
      // Reset the automatic cancellation flag
      if (wasAutomaticallyCancelled) {
        resetAutomaticallyCancelledFlag();
      }
      
      // Immediately dismiss like cancel button
      handleCancel();
      return;
    }
    
    if (backgroundTaskProgress) {
      console.log('DeckCreationStatusPage - Background task progress update:', backgroundTaskProgress.status);
      console.log('DeckCreationStatusPage - Full background task progress:', backgroundTaskProgress);
      
      // Mark that we're no longer in a "new task" state once we have actual progress
      if (isNewTaskRef.current && backgroundTaskProgress.inProgress) {
        console.log('📝 DeckCreationStatusPage - Marking as no longer new task (progress received)');
        isNewTaskRef.current = false;
      }
      
      // Store current progress for transition detection
      lastProgressRef.current = backgroundTaskProgress;
      
      const inView = backgroundTaskProgress.isInViewFlashcardsPage || false;
      const isFileUploadTask = backgroundTaskProgress.taskType === 'fileUpload';
      const isYouTubeLinkTask = backgroundTaskProgress.taskType === 'youtubeLink';

      let newStatusRows: { done: boolean; label: string }[] = [];

      if (isFileUploadTask) {
        // File upload flow statuses
        const statusExtractingInfo = backgroundTaskProgress.status === 'fileInfoExtracted'
          || backgroundTaskProgress.status === 'flashcardsGenerated'
          || backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;
        const statusGeneratingFlashcards = backgroundTaskProgress.status === 'flashcardsGenerated'
          || backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;
        const statusAddingDeckAndFlashcards = backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;

        newStatusRows = [
          {
            done: statusExtractingInfo,
            label: statusExtractingInfo
              ? strings[language].deckCreationStatusPage.successfullyExtractedInfoFromFile
              : strings[language].deckCreationStatusPage.extractingInfoFromFile
          },
          {
            done: statusGeneratingFlashcards,
            label: statusGeneratingFlashcards
              ? strings[language].deckCreationStatusPage.successfullyGeneratedFlashcards
              : strings[language].deckCreationStatusPage.generatingFlashcards
          },
          {
            done: statusAddingDeckAndFlashcards,
            label: statusAddingDeckAndFlashcards
              ? (inView
                  ? strings[language].deckCreationStatusPage.successfullyAddedFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.successfullyAddedFlashcardsAndDeck)
              : (inView
                  ? strings[language].deckCreationStatusPage.addingFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.addingFlashcardsAndDeck)
          }
        ];
      } else if (isYouTubeLinkTask) {
        // YouTube link flow statuses
        const statusTranscriptFetched = backgroundTaskProgress.status === 'transcriptFetched'
          || backgroundTaskProgress.status === 'flashcardsGenerated'
          || backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;
        const statusGeneratingFlashcards = backgroundTaskProgress.status === 'flashcardsGenerated'
          || backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;
        const statusAddingDeckAndFlashcards = backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;

        newStatusRows = [
          {
            done: statusTranscriptFetched,
            label: statusTranscriptFetched
              ? strings[language].deckCreationStatusPage.transcriptFetched
              : strings[language].deckCreationStatusPage.fetchingYoutubeTranscript
          },
          {
            done: statusGeneratingFlashcards,
            label: statusGeneratingFlashcards
              ? strings[language].deckCreationStatusPage.successfullyGeneratedFlashcards
              : strings[language].deckCreationStatusPage.generatingFlashcards
          },
          {
            done: statusAddingDeckAndFlashcards,
            label: statusAddingDeckAndFlashcards
              ? (inView
                  ? strings[language].deckCreationStatusPage.successfullyAddedFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.successfullyAddedFlashcardsAndDeck)
              : (inView
                  ? strings[language].deckCreationStatusPage.addingFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.addingFlashcardsAndDeck)
          }
        ];
      } else {
        // GenAI form flow statuses
        const statusRequestReceived = backgroundTaskProgress.status === 'requestReceived'
          || backgroundTaskProgress.status === 'flashcardsGenerated'
          || backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;
        const statusGeneratingFlashcards = backgroundTaskProgress.status === 'flashcardsGenerated'
          || backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;
        const statusAddingDeckAndFlashcards = backgroundTaskProgress.status === 'deckAndFlashcardsCreated'
          || backgroundTaskProgress.completed;

        newStatusRows = [
          {
            done: statusRequestReceived,
            label: strings[language].deckCreationStatusPage.requestReceived
          },
          {
            done: statusGeneratingFlashcards,
            label: statusGeneratingFlashcards
              ? strings[language].deckCreationStatusPage.successfullyGeneratedFlashcards
              : strings[language].deckCreationStatusPage.generatingFlashcards
          },
          {
            done: statusAddingDeckAndFlashcards,
            label: statusAddingDeckAndFlashcards
              ? (inView
                  ? strings[language].deckCreationStatusPage.successfullyAddedFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.successfullyAddedFlashcardsAndDeck)
              : (inView
                  ? strings[language].deckCreationStatusPage.addingFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.addingFlashcardsAndDeck)
          }
        ];
      }
      console.log('DeckCreationStatusPage - Setting new status rows:', newStatusRows);
      setCurrentStatusRows(newStatusRows);
      setCurrentIsInViewFlashcardsPage(inView);
      
      // If task is completed, navigate back after a delay
      if (backgroundTaskProgress.completed && !backgroundTaskProgress.error && !backgroundTaskProgress.cancelled && !cancelCreationRef.current && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        setTimeout(() => {
          router.back();
        }, 1000); // Wait 2 seconds to show completion
      }
    }
  }, [backgroundTaskProgress, router]);

  // Additional safety check - if all status rows are done and we have no progress, navigate back
  useEffect(() => {
    const allStatusRowsDone = currentStatusRows.length > 0 && currentStatusRows.every(row => row.done);
    
    if (allStatusRowsDone && !backgroundTaskProgress && !hasNavigatedRef.current) {
      console.log('DeckCreationStatusPage - All status rows completed and no progress data, navigating back');
      hasNavigatedRef.current = true;
      setTimeout(() => {
        router.back();
      }, 1000);
    }
  }, [currentStatusRows, backgroundTaskProgress, router]);

  // Reset navigation flag when component unmounts or when a new task starts
  useEffect(() => {
    return () => {
      hasNavigatedRef.current = false;
      lastProgressRef.current = null;
      isNewTaskRef.current = true; // Reset for next time
    };
  }, []);

  // Reset navigation flag when a new task starts (when progress changes from null to something)
  useEffect(() => {
    if (backgroundTaskProgress && !backgroundTaskProgress.completed) {
      hasNavigatedRef.current = false;
    }
  }, [backgroundTaskProgress?.completed]);

  // Handle app state changes - if user taps notification and returns to this page, navigate back
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active - check if we should navigate back
        // If we have no background task running and no progress, and we haven't navigated yet, 
        // it's likely the user tapped a completion notification
        setTimeout(() => {
          if (!backgroundTaskProgress && !hasNavigatedRef.current) {
            console.log('DeckCreationStatusPage - App became active with no progress, likely from notification tap - navigating back');
            hasNavigatedRef.current = true;
            router.back();
          }
        }, 500); // Small delay to allow context to update
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [backgroundTaskProgress, router]);

  // Fetch deck name when we have a deckId (for existing decks)
  useEffect(() => {
    const fetchDeckName = async () => {
      if (backgroundTaskProgress?.deckId && !backgroundTaskProgress?.formData?.deckName) {
        try {
          const { getDeckNameById } = await import('../db/decks');
          const deckName = await getDeckNameById(parseInt(backgroundTaskProgress.deckId));
          if (deckName) {
            setDeckName(deckName);
          }
        } catch (error) {
          console.error('Error fetching deck name:', error);
        }
      } else if (backgroundTaskProgress?.formData?.deckName) {
        setDeckName(backgroundTaskProgress.formData.deckName);
      }
    };

    fetchDeckName();
  }, [backgroundTaskProgress]);

  const handleCancel = async () => {
    if (onCancel) {
      onCancel();
    } else {
      // If no onCancel provided, implement proper cancellation logic
      console.log('DeckCreationStatusPage - Cancelling background task...');
      cancelCreationRef.current = true;
      
      // Update progress to indicate manual cancellation instead of clearing it immediately
      try {
        if (backgroundTaskProgress) {
          const cancelledProgress = {
            ...backgroundTaskProgress,
            inProgress: false,
            completed: false,
            cancelled: true,
            manuallyCancelled: true,
            error: true, // Add this flag for in-app notification
            timestamp: Date.now()
          };
          
          // Save the cancelled progress so UI can detect it
          await AsyncStorage.setItem('genAIDeckCreationBgTaskProgress', JSON.stringify(cancelledProgress));
          console.log('Updated progress to indicate manual cancellation');
        }
      } catch (progressError) {
        console.error('Error updating progress for manual cancellation:', progressError);
      }
      
      // Stop background service but preserve progress for notification
      try {
        await BackgroundService.stop();
      } catch (error) {
        console.error('Error stopping background service:', error);
      }
      
      // Force stop the background task but preserve progress for notification
      forceStopBackgroundTask(true);
      
      // Clean up any partially created data
      try {
        if (backgroundTaskProgress?.createdDeckId && !currentIsInViewFlashcardsPage) {
          await import('../db/decks').then(db => db.deleteDeck(backgroundTaskProgress.createdDeckId));
        }
        if (currentIsInViewFlashcardsPage && backgroundTaskProgress?.createdFlashcardIds?.length > 0) {
          await import('../db/decks').then(db => db.deleteFlashcardsByIds(backgroundTaskProgress.createdFlashcardIds));
        }
      } catch (error) {
        console.error('Error cleaning up partially created data:', error);
      }

      // Delay the final progress cleanup to give UI components time to react and show notification
      setTimeout(async () => {
        try {
          console.log('Performing delayed cleanup after manual cancellation...');
          await clearGenAIDeckCreationProgress();
        } catch (error) {
          console.error('Error in delayed cleanup after manual cancellation:', error);
        }
      }, 5000); // 5 second delay to allow UI components to detect the cancellation and show notification

      // Navigate back
      router.back();
    }
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      // If no onMinimize provided, navigate back
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background}}>
      {/* Top row with Minimize and Cancel buttons */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, paddingHorizontal: 16 }}>
        {/* Minimize button at top left */}
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={handleMinimize}
        >
          <Text style={{ fontSize: 20, color: Colors[theme].brandColor1, fontFamily: Fonts.bodyMedium }}>{strings[language].minimize}</Text>
        </TouchableOpacity>
        {/* Cancel button at top right */}
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={handleCancel}
        >
          <Text style={{ fontSize: 20, color: Colors[theme].alertColor, fontFamily: Fonts.bodyMedium }}>{strings[language].cancel}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: '100%', alignItems: 'center', marginTop: 20}}>
        {/* Deck name title above the animation */}
        {deckName && (
          <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.deckNameTitle, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
              {deckName}
            </Text>
          </View>
        )}
        {/* Stacked image + Lottie animation */}
        <View style={{ aspectRatio: 1.2, width: '100%', marginBottom: 0, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {theme !== 'dark' && (
            <Image
              source={require('@/assets/images/loadingBackground.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ rotate: '90deg' }] }}
              resizeMode="contain"
              fadeDuration={0}
            />
          )}
          <LottieView
            source={theme === 'dark' ? require('@/assets/animations/LoadingAnimation1DarkMode.json') : require('@/assets/animations/LoadingAnimation1.json')}
            autoPlay
            loop
            style={{ position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%' }}
            cacheComposition={true}
          />
        </View>
        <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center', marginTop: 8,}}>
          <Text style={[styles.title, { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }]}>
            {currentIsInViewFlashcardsPage
              ? strings[language].flashcardViewPage.creatingFlashcards
              : strings[language].flashcardViewPage.creatingDeck}
          </Text>
          <View style={{ width: '80%', marginTop: 8,  marginLeft: 48}}>
            {currentStatusRows.map((row, idx) => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                {row.done ? (
                  <GreenTickIcon width={28} height={28} style={{ marginRight: 12, marginTop: 5}} />
                ) : (
                  <DeleteModalIcon width={28} height={28} style={{ marginRight: 12 }} />
                )}
                <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 18, color: Colors[theme].text}}>{row.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
  deckNameTitle: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 36,
  },
}); 