import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Dimensions, Alert, AppState, AppStateStatus } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/formComponents/FormHeaderIcons';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { ActionButton } from '@/components/general/ActionButton';
import { TitleTextBar } from '@/components/general/TitleTextBar';
import { QuestionTextBar } from '@/components/formComponents/QuestionTextBar';
import { QuestionTextBarWithDropdown } from '@/components/formComponents/QuestionTextBarWithDropdown';
import { NumberOfQuestions } from '@/components/formComponents/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/formComponents/TypeOfInterviewQn';
import { KindsOfQuestions } from '@/components/formComponents/KindsOfQuestions';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { GenericModal } from '@/components/modals/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { checkDeckNameExists, saveUserGenAIFormEntry, getMostRecentGenAIFormEntry, createDeckWithGenAIFlashcards, createGenAIFlashcardsForDeck, getDeckNameById } from '../db/decks';
import { Toast } from '../components/general/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { getDistributionOfFlashcardsForInterviewType } from '@/constants/promptEngineering';
import { generateGenAIPrompt } from '@/utils/genAIPromptGeneration';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserQuestionSettings } from '../db/users';
import DeckCreationStatusPage from './deckCreationStatusPage';
import { useTopBarAccountHeight } from '@/hooks/heights';
import BackgroundService from 'react-native-background-actions';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import NotificationService from '@/utils/notifications';
import { db } from '@/db/index';

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

// Helper function to check network connectivity
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
}

// --- Background Task Logic for GenAI Deck/Flashcard Creation ---
const BG_TASK_PROGRESS_KEY = 'genAIDeckCreationBgTaskProgress';

// Helper to save progress
async function saveGenAIDeckCreationProgress(progress: any) {
  try {
    await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) { 
    console.error('Failed to save GenAI deck creation progress', e); 
  }
}

// Helper to load progress
async function loadGenAIDeckCreationProgress(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(BG_TASK_PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { 
    console.error('Failed to load GenAI deck creation progress', e);
    return null; 
  }
}

// Helper to clear progress
async function clearGenAIDeckCreationProgress() {
  try { 
    await AsyncStorage.removeItem(BG_TASK_PROGRESS_KEY); 
  } catch (e) {
    console.error('Failed to clear GenAI deck creation progress', e);
  }
}

// Helper to update progress periodically during long operations
// This function preserves the original status while updating the timestamp to keep progress fresh
async function updateProgressPeriodically(progressData: any, intervalMs: number = 5000) {
  const interval = setInterval(async () => {
    try {
      // Load current progress to preserve the most recent status
      const currentProgress = await loadGenAIDeckCreationProgress();
      if (currentProgress) {
        // Update only the timestamp while preserving the current status
        await saveGenAIDeckCreationProgress({
          ...currentProgress,
          timestamp: Date.now()
        });
      } else {
        // Fallback to the provided progress data if no current progress exists
        await saveGenAIDeckCreationProgress({
          ...progressData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating progress periodically:', error);
    }
  }, intervalMs);
  
  return () => clearInterval(interval);
}

// The background task function for GenAI deck creation
const genAIDeckCreationBackgroundTask = async (taskDataArguments: any) => {
  const { 
    mode, 
    deckId, 
    folderId, 
    isInFavoritesPage, 
    isInIndexPage, 
    isInViewDecksInFolderPage, 
    isInViewFlashcardsPage,
    formData,
    prompt,
    startIndex,
    cancelDeckCreationTaskDueToNetworkError
  } = taskDataArguments;
  
  let createdDeckId: number | null = null;
  let createdFlashcardIds: number[] = [];
  let cancelled = false;
  
  console.log('Background task started with parameters:', { mode, deckId, folderId });
  
  try {
    // Step 1: Generate flashcards via API
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped, cancelling task');
      cancelled = true; 
      return; 
    }
    
    console.log('Saving initial progress: requestReceived');
    // Save progress - API request received
    await saveGenAIDeckCreationProgress({
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData, prompt, createdDeckId, createdFlashcardIds, 
      status: 'requestReceived', inProgress: true, timestamp: Date.now()
    });
    
    // Check for cancellation after saving initial progress
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped after saving initial progress, cancelling task');
      cancelled = true; 
      // Save cancelled status to prevent resumption
      await saveGenAIDeckCreationProgress({
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, 
        status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
      });
      return; 
    }
    
    console.log('Making API call to GenAI...');
    // Call the GenAI API with periodic progress updates
    let response;
    const progressData = {
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData, prompt, createdDeckId, createdFlashcardIds, 
      status: 'requestReceived', inProgress: true
    };
    
    // Start periodic progress updates during API call
    const stopProgressUpdates = await updateProgressPeriodically(progressData, 1000);
    
    try {
      response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/genAIFlashcardsGeneration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });
    } catch (networkError) {
      stopProgressUpdates(); // Stop periodic updates
      if (networkError instanceof Error && networkError.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      // Handle network error - call cancellation function and send notification
      console.error('Network error during GenAI flashcard generation:', networkError);
      
      // Check if app is in background and send notification immediately
      const currentAppState = AppState.currentState;
      if (currentAppState !== 'active') {
        console.log('App is in background - sending network error notification immediately');
        try {
          const notificationService = NotificationService.getInstance();
          
          // Get user language from database
          let userLanguage = 'English';
          try {
            const userID = await getCurrentUserID();
            if (userID) {
              const result = await db.getFirstAsync(`SELECT language FROM users WHERE userID = ?`, [userID]) as any;
              if (result && result.language && typeof result.language === 'string') {
                userLanguage = result.language;
              }
            }
          } catch (e) {
            console.log('Could not get user language, defaulting to English');
          }
          
          await notificationService.sendNetworkErrorCancelledNotification(
            formData.deckName,
            userLanguage
          );
          console.log('Network error notification sent immediately from background task');
        } catch (error) {
          console.error('Error sending immediate network error notification:', error);
        }
      }
      
      // Call the network error cancellation function
      if (cancelDeckCreationTaskDueToNetworkError) {
        await cancelDeckCreationTaskDueToNetworkError();
      }
      
      throw new Error('NETWORK_ERROR');
    }
    
    // Stop periodic updates after API call completes
    stopProgressUpdates();
    
    // Check for cancellation after API call
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped after API call, cancelling task');
      cancelled = true; 
      // Save cancelled status to prevent resumption
      await saveGenAIDeckCreationProgress({
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, 
        status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
      });
      return; 
    }
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    let flashcards = data.flashcards?.flashcards ?? data.flashcards;
    
    // Handle case where API returns flashcards as raw string (when Edge Function parsing fails)
    if (typeof flashcards === 'string') {
      try {
        // Clean up the raw string - remove trailing ]\n and other artifacts
        let cleanedString = flashcards.trim();
        
        // Remove trailing ]
        if (cleanedString.endsWith(']')) {
          cleanedString = cleanedString.slice(0, -1);
        }
        
        // Remove leading [ if present
        if (cleanedString.startsWith('[')) {
          cleanedString = cleanedString.slice(1);
        }
        
        // Clean up any trailing whitespace/newlines
        cleanedString = cleanedString.trim();
        
        // If it doesn't start with {, it might need array wrapping
        if (!cleanedString.startsWith('{')) {
          throw new Error('Invalid flashcard format - does not start with object');
        }
        
        // Try to parse as single object first
        let parsedFlashcards;
        try {
          parsedFlashcards = JSON.parse(cleanedString);
          flashcards = [parsedFlashcards]; // Wrap single object in array
        } catch (singleParseError) {
          // If single object parsing fails, try to split multiple objects
          // Look for },{ pattern to split objects
          const objectStrings = [];
          let currentObject = '';
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < cleanedString.length; i++) {
            const char = cleanedString[i];
            
            if (escapeNext) {
              escapeNext = false;
              currentObject += char;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              currentObject += char;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
            }
            
            if (!inString) {
              if (char === '{') {
                braceCount++;
              } else if (char === '}') {
                braceCount--;
              }
            }
            
            currentObject += char;
            
            // If we've closed a complete object and there's more content
            if (!inString && braceCount === 0 && currentObject.trim().endsWith('}')) {
              objectStrings.push(currentObject.trim());
              currentObject = '';
              
              // Skip any whitespace and commas
              while (i + 1 < cleanedString.length && 
                     (cleanedString[i + 1] === ' ' || 
                      cleanedString[i + 1] === '\n' || 
                      cleanedString[i + 1] === '\t' || 
                      cleanedString[i + 1] === ',')) {
                i++;
              }
            }
          }
          
          // Add any remaining content
          if (currentObject.trim()) {
            objectStrings.push(currentObject.trim());
          }
          
          // Parse each object
          const parsedObjects = [];
          for (const objStr of objectStrings) {
            if (objStr.trim()) {
              try {
                const parsed = JSON.parse(objStr);
                parsedObjects.push(parsed);
              } catch (objError: any) {
                console.error('Failed to parse object in background task:', objStr, objError.message);
              }
            }
          }
          
          if (parsedObjects.length > 0) {
            flashcards = parsedObjects;
          } else {
            throw new Error('No valid flashcard objects found');
          }
        }
      } catch (parseError) {
        console.error('Failed to parse flashcards string in background task:', parseError);
        console.error('Raw flashcards string:', flashcards);
        throw new Error('Invalid flashcards format from API');
      }
    }
    
    // If it's a single object, wrap in array
    if (flashcards && !Array.isArray(flashcards)) {
      flashcards = [flashcards];
    }
    
    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error('No flashcards generated');
    }
    
    console.log('Parsed flashcards in background task:', flashcards);
    
    console.log(`Generated ${flashcards.length} flashcards, saving progress: flashcardsGenerated`);
    // Save progress - flashcards generated
    await saveGenAIDeckCreationProgress({
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
      status: 'flashcardsGenerated', inProgress: true, timestamp: Date.now()
    });
    
    // Check for cancellation after saving flashcards progress
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped after generating flashcards, cancelling task');
      cancelled = true; 
      // Save cancelled status to prevent resumption
      await saveGenAIDeckCreationProgress({
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
      });
      return; 
    }
    
    // Add a small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Create deck and/or add flashcards
    // Check for cancellation before proceeding with database operations
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped before database operations, cancelling task');
      cancelled = true; 
      // Save cancelled status to prevent resumption
      await saveGenAIDeckCreationProgress({
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
      });
      return; 
    }
    
    console.log('Proceeding with deck and flashcard creation...');
    
    console.log('Creating deck and flashcards...');
    if (isInIndexPage) {
      // Check for cancellation before creating deck for index page
      if (BackgroundService.isRunning() === false) { 
        console.log('Background service stopped before creating deck for index page, cancelling task');
        cancelled = true; 
        // Save cancelled status to prevent resumption
        await saveGenAIDeckCreationProgress({
          mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
          formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
          status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
        });
        return; 
      }
      
      console.log('Creating deck for index page...');
      
      // Start periodic progress updates during deck creation
      const deckProgressData = {
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        status: 'flashcardsGenerated', inProgress: true
      };
      const stopDeckProgressUpdates = await updateProgressPeriodically(deckProgressData, 1000);
      
      const result = await createDeckWithGenAIFlashcards({
        deckName: formData.deckName,
        mode: formData.mode === 'study' ? 'study' : 'interview',
        formFields: formData.formFields,
        flashcards
      });
      createdDeckId = result.deckId || null;
      console.log('Index page deck created with ID:', createdDeckId);
      
      // Stop periodic updates
      stopDeckProgressUpdates();
    }
    
    if (isInFavoritesPage) {
      // Check for cancellation before creating deck for favorites page
      if (BackgroundService.isRunning() === false) { 
        console.log('Background service stopped before creating deck for favorites page, cancelling task');
        cancelled = true; 
        // Save cancelled status to prevent resumption
        await saveGenAIDeckCreationProgress({
          mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
          formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
          status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
        });
        return; 
      }
      
      // Start periodic progress updates during deck creation
      const deckProgressData = {
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        status: 'flashcardsGenerated', inProgress: true
      };
      const stopDeckProgressUpdates = await updateProgressPeriodically(deckProgressData, 1000);
      
      const result = await createDeckWithGenAIFlashcards({
        deckName: formData.deckName,
        mode: formData.mode === 'study' ? 'study' : 'interview',
        formFields: formData.formFields,
        flashcards,
        isFavorited: 1
      });
      createdDeckId = result.deckId || null;
      
      // Stop periodic updates
      stopDeckProgressUpdates();
    }
    
    if (isInViewDecksInFolderPage) {
      // Check for cancellation before creating deck for folder page
      if (BackgroundService.isRunning() === false) { 
        console.log('Background service stopped before creating deck for folder page, cancelling task');
        cancelled = true; 
        // Save cancelled status to prevent resumption
        await saveGenAIDeckCreationProgress({
          mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
          formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
          status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
        });
        return; 
      }
      
      // Start periodic progress updates during deck creation
      const deckProgressData = {
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        status: 'flashcardsGenerated', inProgress: true
      };
      const stopDeckProgressUpdates = await updateProgressPeriodically(deckProgressData, 1000);
      
      const result = await createDeckWithGenAIFlashcards({
        deckName: formData.deckName,
        mode: formData.mode === 'study' ? 'study' : 'interview',
        formFields: formData.formFields,
        flashcards,
        folderIDs: `[${folderId}]`
      });
      createdDeckId = result.deckId || null;
      
      // Stop periodic updates
      stopDeckProgressUpdates();
    }
    
    if (isInViewFlashcardsPage) {
      // Check for cancellation before adding flashcards to existing deck
      if (BackgroundService.isRunning() === false) { 
        console.log('Background service stopped before adding flashcards to existing deck, cancelling task');
        cancelled = true; 
        // Save cancelled status to prevent resumption
        await saveGenAIDeckCreationProgress({
          mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
          formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
          status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now()
        });
        return; 
      }
      
      // Start periodic progress updates during flashcard creation
      const flashcardProgressData = {
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        status: 'flashcardsGenerated', inProgress: true
      };
      const stopFlashcardProgressUpdates = await updateProgressPeriodically(flashcardProgressData, 1000);
      
      const result = await createGenAIFlashcardsForDeck({
        deckId: Number(deckId),
        flashcards
      });
      if (result && result.flashcardIds) {
        createdFlashcardIds = result.flashcardIds;
      }
      
      // Stop periodic updates
      stopFlashcardProgressUpdates();
    }
    
    console.log('Deck and flashcards created, saving progress: deckAndFlashcardsCreated');
    console.log('Created deck ID:', createdDeckId, 'Created flashcard IDs:', createdFlashcardIds);
    // Save progress - deck and flashcards created
    await saveGenAIDeckCreationProgress({
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
      status: 'deckAndFlashcardsCreated', inProgress: true, timestamp: Date.now()
    });
    
    // Check for cancellation after saving deck and flashcards progress
    if (BackgroundService.isRunning() === false) { 
      console.log('Background service stopped after creating deck and flashcards, cancelling task');
      cancelled = true; 
      return; 
    }
    
    // Add a small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if background service is still running, but don't cancel if it's not
    if (BackgroundService.isRunning() === false) {
      console.log('Background service stopped, but continuing with completion...');
    }
    
    console.log('Task completed successfully, marking as complete');
    console.log('Final completion data:', { createdDeckId, createdFlashcardIds });
    
    // Check if app is in background and send notification immediately
    const currentAppState = AppState.currentState;
    console.log('Current app state during task completion:', currentAppState);
    
    // Send notification immediately if app is in background
    if (currentAppState !== 'active') {
      console.log('App is in background - sending notification immediately');
      try {
        const notificationService = NotificationService.getInstance();
        const flashcardCount = flashcards?.length || createdFlashcardIds?.length || 0;
        
        // Get user language from database
        let userLanguage = 'English';
        try {
          const userID = await getCurrentUserID();
          if (userID) {
            const result = await db.getFirstAsync(`SELECT language FROM users WHERE userID = ?`, [userID]) as any;
            if (result && result.language && typeof result.language === 'string') {
              userLanguage = result.language;
            }
          }
        } catch (e) {
          console.log('Could not get user language, defaulting to English');
        }
        
        if (isInViewFlashcardsPage && createdFlashcardIds?.length > 0) {
          // Adding flashcards to existing deck - get deck name from deckId
          const existingDeckName = await getDeckNameById(Number(deckId));
          await notificationService.sendFlashcardsCreatedNotification(
            flashcardCount,
            existingDeckName || formData.deckName,
            Number(deckId),
            userLanguage
          );
        } else if (createdDeckId) {
          // Creating new deck with flashcards
          if (flashcardCount > 0) {
            await notificationService.sendDeckAndFlashcardsCreatedNotification(
              formData.deckName,
              createdDeckId,
              flashcardCount,
              userLanguage
            );
          } else {
            await notificationService.sendDeckCreatedNotification(
              formData.deckName,
              createdDeckId,
              userLanguage
            );
          }
        }
        console.log('Notification sent immediately from background task');
      } catch (error) {
        console.error('Error sending immediate notification:', error);
      }
    }
    
    // Mark as complete - ensure this happens even if background service stops
    try {
      // Determine the action type and deck name for notifications
      let actionType = 'deck_created';
      let notificationDeckName = formData.deckName;
      
      if (isInViewFlashcardsPage) {
        // Adding flashcards to existing deck - need to get the existing deck name
        actionType = 'flashcards_added';
        // For viewFlashcardsPage, we need to get the existing deck name from the deckId
        // This will be handled in the notification service
      } else {
        // Creating new deck
        actionType = 'deck_created';
        notificationDeckName = formData.deckName;
      }
      
      await saveGenAIDeckCreationProgress({ 
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData, prompt, createdDeckId, createdFlashcardIds, flashcards,
        actionType, // New field to track the action type
        notificationDeckName, // New field for the deck name to show in notification
        status: 'deckAndFlashcardsCreated',
        inProgress: false, 
        completed: true,
        timestamp: Date.now(),
        notificationSent: currentAppState !== 'active' // Mark as sent if we sent it immediately
      });
      console.log('Completion status saved to AsyncStorage');
      
      // Mark notification as sent to prevent duplicates
      console.log('Background task completed - notification handling complete');
    } catch (error) {
      console.error('Error saving completion status:', error);
      // Don't retry - let the BackgroundTaskContext handle completion detection
    }
    
  } catch (e: any) {
    console.error('Background task error:', e);
    console.error('Error stack:', e.stack);
    
    // Check if this is a network error - be more comprehensive in detection
    const errorMessage = e?.message || String(e);
    const isNetworkError = 
      e instanceof TypeError || 
        (e as any)?.name === 'TypeError' || 
        (e as any)?.code === 'NETWORK_ERROR' ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('The Internet connection appears to be offline') ||
        errorMessage.includes('Could not connect to the server') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('connection') ||
        (e as any)?.code === 'ENOTFOUND' ||
        (e as any)?.code === 'ECONNREFUSED' ||
        (e as any)?.code === 'ETIMEDOUT';
    
    // Save progress on error
    await saveGenAIDeckCreationProgress({
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData, prompt, createdDeckId, createdFlashcardIds, 
      status: isNetworkError ? 'networkError' : 'error',
      inProgress: false, 
      error: true, 
      networkError: isNetworkError,
      errorMessage: isNetworkError ? 'Network error occurred during task execution' : e.message, 
      timestamp: Date.now()
    });
    console.log('Error progress saved to AsyncStorage');
    throw e;
  }
};
// --- END Background Task Logic ---

const HelpIconFilled: React.FC<SvgProps> = (props) => (
  <Svg 
    width={props.width || 31} 
    height={props.height || 31} 
    viewBox="0 0 31 31" 
    fill="none" 
    {...props}
  >
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M15.5 31C24.0604 31 31 24.0604 31 15.5C31 6.93959 24.0604 0 15.5 0C6.93959 0 0 6.93959 0 15.5C0 24.0604 6.93959 31 15.5 31ZM13.9019 18.4478C13.9019 18.5539 13.9879 18.6399 14.094 18.6399H16.1124C16.2185 18.6399 16.3045 18.5539 16.3045 18.4478C16.3093 17.9257 16.3694 17.4874 16.4848 17.1327C16.6051 16.7732 16.7879 16.4604 17.0332 16.1945C17.2833 15.9285 17.6031 15.6724 17.9927 15.4261C18.4353 15.1552 18.8176 14.8474 19.1399 14.5026C19.4622 14.1578 19.7099 13.7638 19.883 13.3205C20.061 12.8773 20.15 12.3749 20.15 11.8134C20.15 10.981 19.9528 10.2619 19.5584 9.6561C19.1688 9.04536 18.6228 8.57499 17.9206 8.245C17.2232 7.915 16.4151 7.75 15.4964 7.75C14.6547 7.75 13.8851 7.90761 13.1876 8.22283C12.495 8.53805 11.937 9.01088 11.5138 9.64132C11.3094 9.94918 11.1521 10.2934 11.0418 10.6741C10.8383 11.3764 11.4529 11.9907 12.1841 11.9907H12.2122C12.8883 11.9907 13.3794 11.4108 13.7504 10.8456C13.9524 10.5402 14.2049 10.3136 14.508 10.1659C14.8158 10.0132 15.1405 9.93684 15.482 9.93684C15.8523 9.93684 16.1866 10.0156 16.4848 10.1733C16.7879 10.3309 17.0284 10.5525 17.2063 10.8382C17.3843 11.1238 17.4733 11.4612 17.4733 11.8503C17.4733 12.1951 17.4059 12.5079 17.2713 12.7886C17.1366 13.0644 16.9514 13.3156 16.7157 13.5422C16.4848 13.7638 16.2227 13.9682 15.9293 14.1554C15.5012 14.4263 15.1381 14.7243 14.8398 15.0493C14.5416 15.3695 14.3107 15.7931 14.1472 16.3201C13.9885 16.8471 13.9067 17.5563 13.9019 18.4478ZM14.039 22.7772C14.3516 23.0924 14.7244 23.25 15.1573 23.25C15.4459 23.25 15.708 23.1786 15.9437 23.0357C16.1842 22.888 16.3766 22.691 16.5209 22.4447C16.67 22.1984 16.7446 21.9251 16.7446 21.6246C16.7446 21.1814 16.5858 20.8021 16.2684 20.4869C15.9557 20.1717 15.5854 20.0141 15.1573 20.0141C14.7244 20.0141 14.3516 20.1717 14.039 20.4869C13.7263 20.8021 13.57 21.1814 13.57 21.6246C13.57 22.0778 13.7263 22.4619 14.039 22.7772Z" 
      fill="#363538"
    />
  </Svg>
);


export default function GenAIFormPage() {
  const { 
    mode, 
    deckId, 
    folderId, 
    isInFavoritesPage, 
    isInIndexPage,
    isInViewFlashcardsPage,
    isInViewDecksInFolderPage
  } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMandatory, setIsMandatory] = useState(true);
  const [deckName, setDeckName] = useState('');
  const [deckTitle, setDeckTitle] = useState<string>('');
  const [studyMandatoryQuestion1, setStudyMandatoryQuestion1] = useState('');
  const [studyMandatoryQuestion2, setStudyMandatoryQuestion2] = useState('');
  const [studyOptionalQuestion1, setStudyOptionalQuestion1] = useState('');
  const [studyOptionalQuestion2, setStudyOptionalQuestion2] = useState('');
  const [studyOptionalQuestion3, setStudyOptionalQuestion3] = useState('');
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [interviewOptionalQuestion1, setInterviewOptionalQuestion1] = useState('');
  const [interviewOptionalQuestion2, setInterviewOptionalQuestion2] = useState('');
  const [interviewOptionalQuestion3, setInterviewOptionalQuestion3] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [questionType, setQuestionType] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isRecentFormModalOpen, setIsRecentFormModalOpen] = useState(false);
  const [isBackConfirmationModalOpen, setIsBackConfirmationModalOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const recentFormModalOpacity = useRef(new Animated.Value(0)).current;
  const backConfirmationModalOpacity = useRef(new Animated.Value(0)).current;
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const errorModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const [errorMessage, setErrorMessage] = useState('');
  const [isOptionalFieldsWarningModalOpen, setIsOptionalFieldsWarningModalOpen] = useState(false);
  const optionalFieldsWarningModalOpacity = useRef(new Animated.Value(0)).current;
  const [isNetworkErrorModalOpen, setIsNetworkErrorModalOpen] = useState(false);
  const networkErrorModalOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { language } = useLanguage();
  const { theme } = useTheme();
  const themeColors = Colors[theme as keyof typeof Colors];
  const getTopBarAccountHeight = useTopBarAccountHeight();
  const { 
    startBackgroundTaskMonitoring, 
    backgroundTaskProgress, 
    forceStopBackgroundTask, 
    wasAutomaticallyCancelled, 
    resetAutomaticallyCancelledFlag,
    cancelDeckCreationTaskDueToNetworkError
  } = useBackgroundTask();
  // Status page state for GenAI deck creation
  const [showStatusPage, setShowStatusPage] = useState(false);
  const cancelCreationRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMinimizingRef = useRef(false); // Track if we're minimizing vs canceling

  useEffect(() => {
    // Ensure the layout is ready after the first render
    const timer = setTimeout(() => setIsReady(true), 0);
    
    // Reset minimizing flag on mount
    isMinimizingRef.current = false;
    
    return () => clearTimeout(timer);
  }, []);


  // AppState logic to resume GenAI deck/flashcard creation if needed
  useEffect(() => {
    let appState = AppState.currentState;
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (typeof appState === 'string' && appState.match(/inactive|background/) && nextAppState === 'active') {
        // App is foregrounded - check if there's an ongoing background task
        const progress = await loadGenAIDeckCreationProgress();
        if (progress && progress.inProgress && !progress.completed) {
          // Only resume if the progress is recent (within the last 5 minutes)
          // This prevents resuming stale or cancelled tasks
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const timeDiff = now - progressTime;
          const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes
          
          if (isRecent) {
            // Resume background task
            const { 
              mode, 
              deckId, 
              folderId, 
              isInFavoritesPage, 
              isInIndexPage, 
              isInViewDecksInFolderPage, 
              isInViewFlashcardsPage,
              formData,
              prompt
            } = progress;
            
            // Start the background task
            try {
              await BackgroundService.start(genAIDeckCreationBackgroundTask, {
                taskName: 'GenAIDeckCreation',
                taskTitle: strings[language].genAIFormPage.creatingDeck,
                taskDesc: strings[language].genAIFormPage.creatingDeckInBackground,
                taskIcon: { name: 'ic_launcher', type: 'mipmap' },
                color: themeColors.brandColor1,
                parameters: {
                  mode, 
                  deckId, 
                  folderId, 
                  isInFavoritesPage, 
                  isInIndexPage, 
                  isInViewDecksInFolderPage, 
                  isInViewFlashcardsPage,
                  formData,
                  prompt,
                  cancelDeckCreationTaskDueToNetworkError
                },
              });
            } catch (error) {
              console.error('Failed to resume background task:', error);
            }
          } else {
            // Progress is stale, clear it
            console.log('Clearing stale background task progress on app foreground');
            await clearGenAIDeckCreationProgress();
          }
        }
      }
      appState = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [language]);

  // Cleanup effect to stop background service when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function to stop background service when component unmounts
      const cleanup = async () => {
        try {
          // Only stop background service and clear progress if we're not minimizing
          // When minimizing, we want the background task to continue running
          if (!isMinimizingRef.current) {
            await BackgroundService.stop();
            await clearGenAIDeckCreationProgress();
          } else {
            // If we're minimizing, don't stop the background service at all
            // Let it continue running and updating progress
            // The background task will continue to run independently
            console.log('Minimizing - keeping background task running');
          }
        } catch (error) {
          console.error('Error cleaning up background service:', error);
        }
      };
      cleanup();
    };
  }, []);

  // Fetch deck title when in view flashcards page
  useEffect(() => {
    const fetchDeckTitle = async () => {
      if (isInViewFlashcardsPage === 'true' && deckId) {
        try {
          const title = await getDeckNameById(Number(deckId));
          if (title) {
            setDeckTitle(title);
          }
        } catch (error) {
          console.error('Error fetching deck title:', error);
        }
      }
    };

    fetchDeckTitle();
  }, [isInViewFlashcardsPage, deckId]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isHelpModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isHelpModalOpen]);

  useEffect(() => {
    if (isRecentFormModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(recentFormModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isRecentFormModalOpen]);

  useEffect(() => {
    if (isBackConfirmationModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backConfirmationModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isBackConfirmationModalOpen]);

  useEffect(() => {
    if (isErrorModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(errorModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isErrorModalOpen]);

  useEffect(() => {
    if (isSuccessModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSuccessModalOpen]);

  useEffect(() => {
    if (isOptionalFieldsWarningModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(optionalFieldsWarningModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isOptionalFieldsWarningModalOpen]);

  useEffect(() => {
    if (isNetworkErrorModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(networkErrorModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isNetworkErrorModalOpen]);

  useEffect(() => {
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

  const handleBackPress = () => {
    setIsBackConfirmationModalOpen(true);
  };

  const handleUseMostRecentFormPress = () => {
    setIsRecentFormModalOpen(true);
  };

  const handleClearAllPress = () => {
    // Reset all form fields to initial values
    setDeckName('');
    // Study mandatory fields
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    // Study optional fields
    setStudyOptionalQuestion1('');
    setStudyOptionalQuestion2('');
    setStudyOptionalQuestion3('');
    // Interview mandatory fields
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    // Interview optional fields
    setInterviewOptionalQuestion1('');
    setInterviewOptionalQuestion2('');
    setInterviewOptionalQuestion3('');
    // Common fields
    setNumberOfQuestions(1);
    setQuestionType([]);
  };

  const handleToggle = (isRightSide: boolean) => {
    setIsMandatory(!isRightSide);
    
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const isStudyMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {
      // When adding flashcards to existing deck, only need the study questions
      return studyMandatoryQuestion1.trim() !== '' && 
             studyMandatoryQuestion2.trim() !== '';
    }
    // When creating new deck, need deck name and study questions
    return deckName.trim() !== '' && 
           studyMandatoryQuestion1.trim() !== '' && 
           studyMandatoryQuestion2.trim() !== '';
  };

  const isInterviewMandatoryFieldsFilled = () => {
    if (isInViewFlashcardsPage === 'true') {  
      // When adding flashcards to existing deck, only need the interview questions
      return interviewMandatoryQuestion1.trim() !== '' && 
             interviewType !== '' 
    }
    // When creating new deck, need deck name and interview questions
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '' 
  };

  const isStudyOptionalFieldsFilled = () => {
    return studyOptionalQuestion1.trim() !== '' && 
           studyOptionalQuestion2.trim() !== '' && 
           studyOptionalQuestion3.trim() !== '' && 
           questionType.length > 0;
  };

  const isInterviewOptionalFieldsFilled = () => {
    return interviewOptionalQuestion1.trim() !== '' && 
           interviewOptionalQuestion2.trim() !== '' && 
           interviewOptionalQuestion3.trim() !== '' && 
           questionType.length > 0;
  };

  const isSubmitDisabled = () => {
    return false; // Always enabled now
  };

  const validateFormSubmission = async () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const optionalFieldsFilled = mode === 'study' ? isStudyOptionalFieldsFilled() : isInterviewOptionalFieldsFilled();

    // Check if deck name already exists (only for new deck creation, not when adding to existing deck)
    if (!isInViewFlashcardsPage && deckName.trim() !== '') {
      const deckNameExists = await checkDeckNameExists(deckName.trim());
      if (deckNameExists) {
        setShowToast(true);
        setToastMessage(strings[language].genAIFormPage.toastMessages.deckNameInUse);
        return false;
      }
    }

    // Validate studyMandatoryQuestion2 format for study mode
    if (mode === 'study' && studyMandatoryQuestion2.trim() !== '') {
      const subjects = studyMandatoryQuestion2.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty subjects after splitting and trimming
      const hasEmptySubjects = subjects.some(subject => subject === '');
      
      // Check if there are any subjects that are just whitespace or special characters
      const hasInvalidSubjects = subjects.some(subject => 
        subject === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(subject) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptySubjects || hasInvalidSubjects) {
        setShowToast(true);
        setToastMessage(strings[language].genAIFormPage.toastMessages.invalidSubjects);
        return false;
      }
    }

    // Validate studyOptionalQuestion1 (topics) format for study mode
    if (mode === 'study' && studyOptionalQuestion1.trim() !== '') {
      const topics = studyOptionalQuestion1.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty topics after splitting and trimming
      const hasEmptyTopics = topics.some(topic => topic === '');
      
      // Check if there are any topics that are just whitespace or special characters
      // Check if there are any subjects that are just whitespace or special characters
      const hasInvalidTopics = topics.some(topic => 
        topic === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(topic) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptyTopics || hasInvalidTopics) {
        setShowToast(true);
        setToastMessage(strings[language].genAIFormPage.toastMessages.invalidTopics);
        return false;
      }
    }

    // Validate studyOptionalQuestion2 (subtopics) format for study mode
    if (mode === 'study' && studyOptionalQuestion2.trim() !== '') {
      const subtopics = studyOptionalQuestion2.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty subtopics after splitting and trimming
      const hasEmptySubtopics = subtopics.some(subtopic => subtopic === '');
      
      // Check if there are any subtopics that are just whitespace or special characters
      const hasInvalidSubtopics = subtopics.some(subtopic => 
        subtopic === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(subtopic) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptySubtopics || hasInvalidSubtopics) {
        setShowToast(true);
        setToastMessage(strings[language].genAIFormPage.toastMessages.invalidSubtopics);
        return false;
      }
    }

    // Validate interviewOptionalQuestion3 (topics) format for interview mode
    if (mode === 'interview' && interviewOptionalQuestion3.trim() !== '') {
      const topics = interviewOptionalQuestion3.split(/[\u002C\uFF0C\u060C\u201A\u201E\u2E41\u3001\uFE10\uFE11\uFE50\uFE51\uFF64]/).map(s => s.trim());
      
      // Check if there are any empty topics after splitting and trimming
      const hasEmptyTopics = topics.some(topic => topic === '');
      
      // Check if there are any topics that are just whitespace or special characters
      const hasInvalidTopics = topics.some(topic => 
        topic === '' ||
        !/^[\p{L}\p{N} '\u2019]+$/u.test(topic) // Only letters, numbers, spaces, and apostrophes
      );
      
      if (hasEmptyTopics || hasInvalidTopics) {
        setShowToast(true);
        setToastMessage(strings[language].genAIFormPage.toastMessages.invalidTopics);
        return false;
      }
    }

    // Validate that the number of question types does not exceed the number of questions
    if (questionType.length > numberOfQuestions) {
      setShowToast(true);
      setToastMessage(strings[language].genAIFormPage.toastMessages.insufficientQuestions);
      return false;
    }

    // Case 1: Mandatory fields and optional fields not filled up
    if (!mandatoryFieldsFilled) {
      setErrorMessage(strings[language].genAIFormPage.allMandatoryFieldsMustBeFilled);
      setIsErrorModalOpen(true);
      return false;
    }

    // Case 2: Mandatory fields filled up but optional fields not filled up
    if (mandatoryFieldsFilled && !optionalFieldsFilled) {
      setIsOptionalFieldsWarningModalOpen(true);
      return false;
    }

    // Case 3: Mandatory fields and optional fields both filled up
    setIsSuccessModalOpen(true);
    return true;
  };

  const handleSubmit = async () => {
    await validateFormSubmission();
  };

  const handleDismissHelp = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsHelpModalOpen(false);
    });
  };

  const handleDismissRecentForm = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(recentFormModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRecentFormModalOpen(false);
    });
  };

  const handleDismissBackConfirmation = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backConfirmationModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsBackConfirmationModalOpen(false);
    });
  };

  const handleDismissErrorModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(errorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsErrorModalOpen(false);
    });
  };

  const handleDismissSuccessModal = async () => {
    // Cancel any running background task when user clicks "No"
    try {
      // Update progress to indicate manual cancellation instead of clearing it immediately
      try {
        const currentProgress = await loadGenAIDeckCreationProgress();
        if (currentProgress) {
          const cancelledProgress = {
            ...currentProgress,
            inProgress: false,
            completed: false,
            cancelled: true,
            manuallyCancelled: true,
            error: true, // Add this flag for in-app notification
            timestamp: Date.now()
          };
          
          // Save the cancelled progress so UI can detect it
          await saveGenAIDeckCreationProgress(cancelledProgress);
          console.log('Updated progress to indicate manual cancellation');
        }
      } catch (progressError) {
        console.error('Error updating progress for manual cancellation:', progressError);
      }
      
      // Stop background service but preserve progress for notification
      await BackgroundService.stop();
      
      // Force stop the background task but preserve progress for notification
      forceStopBackgroundTask(true);
      
      // Delay the final progress cleanup to give UI components time to react and show notification
      setTimeout(async () => {
        try {
          console.log('Performing delayed cleanup after manual cancellation...');
          await clearGenAIDeckCreationProgress();
        } catch (error) {
          console.error('Error in delayed cleanup after manual cancellation:', error);
        }
      }, 5000); // 5 second delay to allow UI components to detect the cancellation and show notification
    } catch (error) {
      console.error('Error stopping background task on dismiss:', error);
    }
    
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsSuccessModalOpen(false);
    });
  };

  const handleSuccessConfirm = async () => {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      // Hide success modal and show network error modal
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsSuccessModalOpen(false);
        setIsNetworkErrorModalOpen(true);
      });
      return;
    }

    cancelCreationRef.current = false;
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsSuccessModalOpen(false);
      setShowStatusPage(true);
      
      // Save form entry
      const now = new Date().toISOString();
      await saveUserGenAIFormEntry({
        deckName,
        formEntryType: mode === 'study' ? 'study' : 'interview',
        formEntryMethod: 'genAIForm',
        formSubmissionDate: now,
        numberOfQuestions,
        kindsOfQuestions: JSON.stringify(questionType),
        studyEducationLevel: studyMandatoryQuestion1,
        studySubjects: studyMandatoryQuestion2,
        studyTopics: studyOptionalQuestion1,
        studySubtopics: studyOptionalQuestion2,
        studyExam: studyOptionalQuestion3,
        interviewJobRole: interviewMandatoryQuestion1,
        interviewType,
        interviewCompany: interviewOptionalQuestion1,
        interviewExperienceLevel: interviewOptionalQuestion2,
        interviewTopics: interviewOptionalQuestion3
      });

      // Build form data for background task
      const formData = {
        deckName,
        mode: mode === 'study' ? 'study' : 'interview',
        formFields: {
          studyEducationLevel: studyMandatoryQuestion1,
          studySubjects: studyMandatoryQuestion2,
          studyTopics: studyOptionalQuestion1,
          studySubtopics: studyOptionalQuestion2,
          studyExam: studyOptionalQuestion3,
          interviewJobRole: interviewMandatoryQuestion1,
          interviewType,
          interviewCompany: interviewOptionalQuestion1,
          interviewExperienceLevel: interviewOptionalQuestion2,
          interviewTopics: interviewOptionalQuestion3,
          numberOfQuestions,
          kindsOfQuestions: JSON.stringify(questionType)
        }
      };

      // Add flashcard distribution and type prompts
      const { isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled } = await getUserQuestionSettings();
      const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
        isMcqEnabled,
        isClozeEnabled,
        isVoiceRecordedEnabled,
        interviewType,
        numberOfQuestions,
        questionType
      );

      // Generate prompt using utility function
      const prompt = await generateGenAIPrompt({
        mode: mode as string,
        language,
        studyMandatoryQuestion1,
        studyMandatoryQuestion2,
        studyOptionalQuestion1,
        studyOptionalQuestion2,
        studyOptionalQuestion3,
        interviewMandatoryQuestion1,
        interviewOptionalQuestion1,
        interviewOptionalQuestion2,
        interviewOptionalQuestion3,
        interviewType,
        numberOfQuestions,
        questionType,
        distributionOfFlashcards: distributionOfFlashcards || undefined
      });

      // Start background task
      try {
        // Check if background service is already running to prevent duplicates
        if (BackgroundService.isRunning()) {
          console.log('Background service is already running, skipping start');
          // Still start monitoring in case it wasn't started before
          startBackgroundTaskMonitoring();
          return;
        }
        
        await BackgroundService.start(genAIDeckCreationBackgroundTask, {
          taskName: 'GenAIDeckCreation',
          taskTitle: strings[language].genAIFormPage.creatingDeck,
          taskDesc: strings[language].genAIFormPage.creatingDeckInBackground,
          taskIcon: { name: 'ic_launcher', type: 'mipmap' },
          color: '#44B88A',
          parameters: {
            mode, 
            deckId, 
            folderId, 
            isInFavoritesPage, 
            isInIndexPage, 
            isInViewDecksInFolderPage, 
            isInViewFlashcardsPage,
            formData,
            prompt,
            cancelDeckCreationTaskDueToNetworkError
          },
        });

        // Save initial progress immediately to ensure FloatingActionButton shows loading animation
        await saveGenAIDeckCreationProgress({
          mode, 
          deckId, 
          folderId, 
          isInFavoritesPage, 
          isInIndexPage, 
          isInViewDecksInFolderPage, 
          isInViewFlashcardsPage,
          formData,
          prompt,
          createdDeckId: null,
          createdFlashcardIds: [],
          status: 'requestReceived', 
          inProgress: true, 
          timestamp: Date.now()
        });

        // Start global background task monitoring
        startBackgroundTaskMonitoring();
        
      } catch (error) {
        console.error('Failed to start background task:', error);
        setShowStatusPage(false);
        Alert.alert(strings[language].error, strings[language].genAIFormPage.failedToStartBackgroundTask);
      }
    });
  };

  const handleOptionalFieldsWarningConfirm = async () => {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      // Hide optional fields warning modal and show network error modal
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(optionalFieldsWarningModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsOptionalFieldsWarningModalOpen(false);
        setIsNetworkErrorModalOpen(true);
      });
      return;
    }

    cancelCreationRef.current = false;
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(optionalFieldsWarningModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      setIsOptionalFieldsWarningModalOpen(false);
      setShowStatusPage(true);
      
      // Save form entry
      const now = new Date().toISOString();
      await saveUserGenAIFormEntry({
        deckName,
        formEntryType: mode === 'study' ? 'study' : 'interview',
        formEntryMethod: 'genAIForm',
        formSubmissionDate: now,
        numberOfQuestions,
        kindsOfQuestions: JSON.stringify(questionType),
        studyEducationLevel: studyMandatoryQuestion1,
        studySubjects: studyMandatoryQuestion2,
        studyTopics: studyOptionalQuestion1,
        studySubtopics: studyOptionalQuestion2,
        studyExam: studyOptionalQuestion3,
        interviewJobRole: interviewMandatoryQuestion1,
        interviewType,
        interviewCompany: interviewOptionalQuestion1,
        interviewExperienceLevel: interviewOptionalQuestion2,
        interviewTopics: interviewOptionalQuestion3
      });

      // Build form data for background task
      const formData = {
        deckName,
        mode: mode === 'study' ? 'study' : 'interview',
        formFields: {
          studyEducationLevel: studyMandatoryQuestion1,
          studySubjects: studyMandatoryQuestion2,
          studyTopics: studyOptionalQuestion1,
          studySubtopics: studyOptionalQuestion2,
          studyExam: studyOptionalQuestion3,
          interviewJobRole: interviewMandatoryQuestion1,
          interviewType,
          interviewCompany: interviewOptionalQuestion1,
          interviewExperienceLevel: interviewOptionalQuestion2,
          interviewTopics: interviewOptionalQuestion3,
          numberOfQuestions,
          kindsOfQuestions: JSON.stringify(questionType)
        }
      };

      // Add flashcard distribution and type prompts
      const { isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled } = await getUserQuestionSettings();
      const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
        isMcqEnabled,
        isClozeEnabled,
        isVoiceRecordedEnabled,
        interviewType,
        numberOfQuestions,
        questionType
      );

      // Generate prompt using utility function
      const prompt = await generateGenAIPrompt({
        mode: mode as string,
        language,
        studyMandatoryQuestion1,
        studyMandatoryQuestion2,
        studyOptionalQuestion1,
        studyOptionalQuestion2,
        studyOptionalQuestion3,
        interviewMandatoryQuestion1,
        interviewOptionalQuestion1,
        interviewOptionalQuestion2,
        interviewOptionalQuestion3,
        interviewType,
        numberOfQuestions,
        questionType,
        distributionOfFlashcards: distributionOfFlashcards || undefined
      });

      // Start background task
      try {
        // Check if background service is already running to prevent duplicates
        if (BackgroundService.isRunning()) {
          console.log('Background service is already running, skipping start');
          // Still start monitoring in case it wasn't started before
          startBackgroundTaskMonitoring();
          return;
        }
        
        await BackgroundService.start(genAIDeckCreationBackgroundTask, {
          taskName: 'GenAIDeckCreation',
          taskTitle: strings[language].genAIFormPage.creatingDeck,
          taskDesc: strings[language].genAIFormPage.creatingDeckInBackground,
          taskIcon: { name: 'ic_launcher', type: 'mipmap' },
          color: '#44B88A',
          parameters: {
            mode, 
            deckId, 
            folderId, 
            isInFavoritesPage, 
            isInIndexPage, 
            isInViewDecksInFolderPage, 
            isInViewFlashcardsPage,
            formData,
            prompt,
            cancelDeckCreationTaskDueToNetworkError
          },
        });

        // Save initial progress immediately to ensure FloatingActionButton shows loading animation
        await saveGenAIDeckCreationProgress({
          mode, 
          deckId, 
          folderId, 
          isInFavoritesPage, 
          isInIndexPage, 
          isInViewDecksInFolderPage, 
          isInViewFlashcardsPage,
          formData,
          prompt,
          createdDeckId: null,
          createdFlashcardIds: [],
          status: 'requestReceived', 
          inProgress: true, 
          timestamp: Date.now()
        });

        // Start global background task monitoring
        startBackgroundTaskMonitoring();
        
      } catch (error) {
        console.error('Failed to start background task:', error);
        setShowStatusPage(false);
        Alert.alert(strings[language].error, strings[language].genAIFormPage.failedToStartBackgroundTask);
      }
    });
  };

  const handleOptionalFieldsWarningCancel = async () => {
    // Cancel any running background task when user clicks "No"
    try {
      // Update progress to indicate manual cancellation instead of clearing it immediately
      try {
        const currentProgress = await loadGenAIDeckCreationProgress();
        if (currentProgress) {
          const cancelledProgress = {
            ...currentProgress,
            inProgress: false,
            completed: false,
            cancelled: true,
            manuallyCancelled: true,
            error: true, // Add this flag for in-app notification
            timestamp: Date.now()
          };
          
          // Save the cancelled progress so UI can detect it
          await saveGenAIDeckCreationProgress(cancelledProgress);
          console.log('Updated progress to indicate manual cancellation');
        }
      } catch (progressError) {
        console.error('Error updating progress for manual cancellation:', progressError);
      }
      
      // Stop background service but preserve progress for notification
      await BackgroundService.stop();
      
      // Force stop the background task but preserve progress for notification
      forceStopBackgroundTask(true);
      
      // Delay the final progress cleanup to give UI components time to react and show notification
      setTimeout(async () => {
        try {
          console.log('Performing delayed cleanup after manual cancellation...');
          await clearGenAIDeckCreationProgress();
        } catch (error) {
          console.error('Error in delayed cleanup after manual cancellation:', error);
        }
      }, 5000); // 5 second delay to allow UI components to detect the cancellation and show notification
    } catch (error) {
      console.error('Error stopping background task on dismiss:', error);
    }
    
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(optionalFieldsWarningModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsOptionalFieldsWarningModalOpen(false);
    });
  };

  const handleDismissNetworkErrorModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(networkErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsNetworkErrorModalOpen(false);
    });
  };

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : insets.bottom) : 
    insets.bottom + 10;

  const mandatoryOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const optionalOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });



  if (showStatusPage) {
    // Get status from global background task progress
    const statusRequestReceived = backgroundTaskProgress?.status === 'requestReceived' || backgroundTaskProgress?.status === 'flashcardsGenerated' || backgroundTaskProgress?.status === 'deckAndFlashcardsCreated' || backgroundTaskProgress?.completed;
    const statusGeneratingFlashcards = backgroundTaskProgress?.status === 'flashcardsGenerated' || backgroundTaskProgress?.status === 'deckAndFlashcardsCreated' || backgroundTaskProgress?.completed;
    const statusAddingDeckAndFlashcards = backgroundTaskProgress?.status === 'deckAndFlashcardsCreated' || backgroundTaskProgress?.completed;
    
    // If task is completed and we're still showing status page, navigate back after a delay
    // REMOVED: This navigation logic is now handled by deckCreationStatusPage.tsx
    // The status page will handle navigation when the user stays on it
    
    return (
      <DeckCreationStatusPage
        statusRows={[
          { done: statusRequestReceived, label: strings[language].deckCreationStatusPage.requestReceived },
          { done: statusGeneratingFlashcards, label: statusGeneratingFlashcards ? strings[language].deckCreationStatusPage.successfullyGeneratedFlashcards : strings[language].deckCreationStatusPage.generatingFlashcards },
          { done: statusAddingDeckAndFlashcards, label: statusAddingDeckAndFlashcards
              ? (isInViewFlashcardsPage
                  ? strings[language].deckCreationStatusPage.successfullyAddedFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.successfullyAddedFlashcardsAndDeck)
              : (isInViewFlashcardsPage
                  ? strings[language].deckCreationStatusPage.addingFlashcardsToDeck
                  : strings[language].deckCreationStatusPage.addingFlashcardsAndDeck) }
        ]}
        isInViewFlashcardsPage={isInViewFlashcardsPage === 'true'}
        onCancel={async () => {
          cancelCreationRef.current = true;
          
          // Update progress to indicate manual cancellation instead of clearing it immediately
          try {
            const currentProgress = await loadGenAIDeckCreationProgress();
            if (currentProgress) {
              const cancelledProgress = {
                ...currentProgress,
                inProgress: false,
                completed: false,
                cancelled: true,
                manuallyCancelled: true,
                error: true, // Add this flag for in-app notification
                timestamp: Date.now()
              };
              
              // Save the cancelled progress so UI can detect it
              await saveGenAIDeckCreationProgress(cancelledProgress);
              console.log('Updated progress to indicate manual cancellation');
            }
          } catch (progressError) {
            console.error('Error updating progress for manual cancellation:', progressError);
          }
          
          // Abort any ongoing fetch requests
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          
          // Stop background service but preserve progress for notification
          try {
            await BackgroundService.stop();
          } catch (error) {
            console.error('Error stopping background service:', error);
          }
          
          // Force stop the background task but preserve progress for notification
          forceStopBackgroundTask(true);
          
          // Set minimizing flag to false to ensure cleanup doesn't interfere
          isMinimizingRef.current = false;
          
          setShowStatusPage(false);
          
          // Clean up any partially created data
          try {
            if (backgroundTaskProgress?.createdDeckId && !isInViewFlashcardsPage) {
              await import('../db/decks').then(db => db.deleteDeck(backgroundTaskProgress.createdDeckId));
            }
            if (isInViewFlashcardsPage && backgroundTaskProgress?.createdFlashcardIds?.length > 0) {
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

          router.back();
        }}
        onMinimize={async () => {
          // Hide the status page and navigate back
          setShowStatusPage(false);
          
          // Set flag to indicate we're minimizing (not canceling)
          isMinimizingRef.current = true;
          
          // Don't cancel the background task - let it continue running
          // The background task will continue to run and update the database
          // We'll set up a global monitoring system to detect completion
          
          // Ensure background task progress is fresh when minimizing
          try {
            const currentProgress = await loadGenAIDeckCreationProgress();
            if (currentProgress && currentProgress.inProgress && !currentProgress.completed) {
              // Update timestamp to ensure progress is considered fresh
              await saveGenAIDeckCreationProgress({
                ...currentProgress,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error('Error updating progress on minimize:', error);
          }
          
          // Navigate back to the previous page
          router.back();
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight() }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color={themeColors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.headerIconsContainer, {paddingTop: getTopBarAccountHeight()}]}>
        <FormHeaderIcons 
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
          onClearAllPress={handleClearAllPress}
        />
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel={strings[language].genAIFormPage.mandatory}
            rightLabel={strings[language].genAIFormPage.optional}
            onToggle={handleToggle}
          />
        </View>
        <ScrollView 
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex', gap: 30}
          ]}>
            {isMandatory && (
              <View style={[{gap: Dimensions.get('window').height * 0.025}]}>
                {!isInViewFlashcardsPage && (                
                  <TitleTextBar
                  title={strings[language].genAIFormPage.deckName}
                  highlightedWord={mode === 'study' ? strings[language].genAIFormPage.study : strings[language].genAIFormPage.interview}
                  placeholder={strings[language].genAIFormPage.typeHere}
                  value={deckName}
                  onChangeText={setDeckName}
                />)}
                {isInViewFlashcardsPage === 'true' && (
                  <TitleTextBar
                    title={strings[language].genAIFormPage.deckName}
                    highlightedWord={mode === 'study' ? strings[language].genAIFormPage.study : strings[language].genAIFormPage.interview}
                    placeholder={deckTitle}
                    value={deckTitle}
                    onChangeText={() => {}} // Disabled - no-op function
                    disabled={true}
                  />
                )}
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label={strings[language].genAIFormPage.educationLevel}
                      placeholder={strings[language].genAIFormPage.educationLevelPlaceholder}
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText={strings[language].genAIFormPage.educationLevelHelper}
                    />
                    <QuestionTextBar
                      label={strings[language].genAIFormPage.subjects}
                      placeholder={strings[language].genAIFormPage.subjectsPlaceholder}
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText={strings[language].genAIFormPage.subjectsHelper}
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                  <QuestionTextBar
                    label={strings[language].genAIFormPage.jobRole}
                    placeholder={strings[language].genAIFormPage.jobRolePlaceholder}
                    value={interviewMandatoryQuestion1}
                    onChangeText={setInterviewMandatoryQuestion1}
                    helperText={strings[language].genAIFormPage.jobRoleHelper}
                    />
                  <TypeOfInterviewQn
                    value={interviewType}
                    onValueChange={setInterviewType}
                  />
                  </>
                  
                )}
                <NumberOfQuestions
                  title={strings[language].genAIFormPage.numberOfQuestions}
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
          </Animated.View>

          <Animated.View style={[
            { opacity: optionalOpacity, display: !isMandatory ? 'flex' : 'none', gap: 30}
          ]}>
            {!isMandatory && mode === 'study' && (
              <View style={[{gap: Dimensions.get('window').height * 0.025}]}>
                <QuestionTextBar
                  label={strings[language].genAIFormPage.topics}
                  placeholder={strings[language].genAIFormPage.topicsPlaceholder}
                  value={studyOptionalQuestion1}
                  onChangeText={setStudyOptionalQuestion1}
                  helperText={strings[language].genAIFormPage.topicsHelper}
                />
                <QuestionTextBar
                  label={strings[language].genAIFormPage.subtopics}
                  placeholder={strings[language].genAIFormPage.subtopicsPlaceholder}
                  value={studyOptionalQuestion2}
                  onChangeText={setStudyOptionalQuestion2}
                  helperText={strings[language].genAIFormPage.subtopicsHelper}
                />
                <QuestionTextBar
                  label={strings[language].genAIFormPage.examQuiz}
                  placeholder={strings[language].genAIFormPage.examQuizPlaceholder}
                  value={studyOptionalQuestion3}
                  onChangeText={setStudyOptionalQuestion3}
                  helperText={strings[language].genAIFormPage.examQuizHelper}
                />
                <KindsOfQuestions
                    value={questionType}
                    onValueChange={(value) => setQuestionType(value)}
                    onHelpPress={() => setIsHelpModalOpen(true)}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
            {!isMandatory && mode === 'interview' && (
              <View style={[{gap: Dimensions.get('window').height * 0.025}]}>
                <QuestionTextBarWithDropdown
                  label={strings[language].genAIFormPage.company}
                  placeholder={strings[language].genAIFormPage.companyPlaceholder}
                  value={interviewOptionalQuestion1}
                  onChangeText={setInterviewOptionalQuestion1}
                  helperText={strings[language].genAIFormPage.companyHelper}
                  showDropdown={true}
                />
                <QuestionTextBar
                  label={strings[language].genAIFormPage.experienceLevel}
                  placeholder={strings[language].genAIFormPage.experienceLevelPlaceholder}
                  value={interviewOptionalQuestion2}
                  onChangeText={setInterviewOptionalQuestion2}
                  helperText={strings[language].genAIFormPage.experienceLevelHelper}
                />
                <QuestionTextBar
                  label={strings[language].genAIFormPage.interviewTopics}
                  placeholder={strings[language].genAIFormPage.interviewTopicsPlaceholder}
                  value={interviewOptionalQuestion3}
                  onChangeText={setInterviewOptionalQuestion3}
                  helperText={strings[language].genAIFormPage.interviewTopicsHelper}
                />
                <KindsOfQuestions
                    value={questionType}
                    onValueChange={(value) => setQuestionType(value)}
                    onHelpPress={() => setIsHelpModalOpen(true)}
                />
                <View style={styles.bottomSpacing} />
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[
          styles.buttonContainer,
          { bottom: bottomOffset, backgroundColor: themeColors.background }
        ]}>
          <ActionButton
            text={strings[language].genAIFormPage.submit}
            backgroundColor={isSubmitDisabled() ? themeColors.unselectedText : themeColors.brandColor1}
            onPress={handleSubmit}
            disabled={isSubmitDisabled()}
            fullWidth
          />
        </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isRecentFormModalOpen || isBackConfirmationModalOpen || isErrorModalOpen || isSuccessModalOpen || isOptionalFieldsWarningModalOpen || isNetworkErrorModalOpen}
        opacity={overlayOpacity}
        onPress={isRecentFormModalOpen ? handleDismissRecentForm : (isHelpModalOpen ? handleDismissHelp : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : (isErrorModalOpen ? handleDismissErrorModal : (isSuccessModalOpen ? handleDismissSuccessModal : (isOptionalFieldsWarningModalOpen ? handleOptionalFieldsWarningCancel : handleDismissNetworkErrorModal)))))}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={strings[language].genAIFormPage.helpModalText}
        buttons='none'
        textStyle={{
          highlightWord: strings[language].genAIFormPage.helpModalHighlight,
          highlightColor: "#44B88A"
        }}
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={strings[language].genAIFormPage.useRecentFormEntry}
        buttons='double'
        onConfirm={async () => {
          const entry = await getMostRecentGenAIFormEntry(mode as 'study' | 'interview');
          console.log("entry", entry);
          if (entry) {
            setDeckName(entry.deckName || '');
            setNumberOfQuestions(entry.numberOfQuestions || 1);
            setQuestionType(entry.kindsOfQuestions ? JSON.parse(entry.kindsOfQuestions) : []);
            setStudyMandatoryQuestion1(entry.studyEducationLevel || '');
            setStudyMandatoryQuestion2(entry.studySubjects || '');
            setStudyOptionalQuestion1(entry.studyTopics || '');
            setStudyOptionalQuestion2(entry.studySubtopics || '');
            setStudyOptionalQuestion3(entry.studyExam || '');
            setInterviewMandatoryQuestion1(entry.interviewJobRole || '');
            setInterviewType(entry.interviewType || '');
            setInterviewOptionalQuestion1(entry.interviewCompany || '');
            setInterviewOptionalQuestion2(entry.interviewExperienceLevel || '');
            setInterviewOptionalQuestion3(entry.interviewTopics || '');
          }
          handleDismissRecentForm();
        }}
        onCancel={handleDismissRecentForm}
      />
      <GenericModal
        visible={isBackConfirmationModalOpen}
        opacity={backConfirmationModalOpacity}
        text={strings[language].genAIFormPage.leaveConfirmation}
        buttons="double"
        onCancel={handleDismissBackConfirmation}
        onConfirm={() => {
          // Animate out first, then navigate
          Animated.parallel([
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backConfirmationModalOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            setIsBackConfirmationModalOpen(false);
            // Navigate after animation completes
            setTimeout(() => {
              router.back();
            }, 50);
          });
        }}
        textMarginBottom={40}
        contentMarginTop={-10}
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isErrorModalOpen}
        opacity={errorModalOpacity}
        text={language === 'Chinese' ? strings[language].genAIFormPage.allMandatoryFieldsMustBeFilled : errorMessage}
        buttons="none"
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isOptionalFieldsWarningModalOpen}
        opacity={optionalFieldsWarningModalOpacity}
        text={strings[language].genAIFormPage.submitWithoutOptionalFields}
        buttons="double"
        onCancel={handleOptionalFieldsWarningCancel}
        onConfirm={handleOptionalFieldsWarningConfirm}
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isSuccessModalOpen}
        opacity={successModalOpacity}
        text={strings[language].genAIFormPage.greatSubmit}
        buttons="double"
        onCancel={handleDismissSuccessModal}
        onConfirm={handleSuccessConfirm}
      />
      <GenericModal
        visible={isNetworkErrorModalOpen}
        opacity={networkErrorModalOpacity}
        text={strings[language].genAIFormPage.errorMessages.network}
        buttons="single"
        onConfirm={handleDismissNetworkErrorModal}
        Icon={DeleteModalIcon}
      />
      
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20, // button height (72) + padding top (20)
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerIconsContainer: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    position: 'absolute',
    paddingTop: Dimensions.get('window').height < 670 ? 10 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
}); 