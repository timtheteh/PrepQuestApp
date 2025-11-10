import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView, Keyboard, Animated, Text, Dimensions, Alert, AppState, AppStateStatus } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { FormHeaderIcons } from '../components/formComponents/FormHeaderIcons';
import { RoundedContainer } from '@/components/general/RoundedContainer';
import { ActionButton } from '@/components/general/ActionButton';
import { TitleTextBar } from '@/components/general/TitleTextBar';
import { QuestionTextBar } from '@/components/formComponents/QuestionTextBar';
import { NumberOfQuestions } from '@/components/formComponents/NumberOfQuestions';
import { TypeOfInterviewQn } from '@/components/formComponents/TypeOfInterviewQn';
import { GreyOverlayBackground } from '@/components/general/GreyOverlayBackground';
import { GenericModal } from '@/components/modals/GenericModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
import { SmallCircleSelectButton } from '@/components/general/SmallCircleSelectButton';
import HelpIconOutline from '@/assets/icons/generalIcons/helpIconOutline.svg';
import HelpIconOutlineDarkMode from '@/assets/icons/generalIcons/helpIconOutlineDarkMode.svg';
import { PrimaryButton } from '@/components/general/PrimaryButton';
import CloudUploadIcon from '@/assets/icons/fileUpload/cloudUploadIcon.svg';
import CloudUploadIconDarkMode from '@/assets/icons/fileUpload/cloudUploadIconDarkMode.svg';
import ImageIconFilled from '@/assets/icons/generalIcons/imageIconFilled.svg';
import ImageIconFilledDarkMode from '@/assets/icons/generalIcons/imageIconFilledDarkMode.svg';
import CameraIconFilled from '@/assets/icons/generalIcons/cameraIconFilled.svg';
import CameraIconFilledDarkMode from '@/assets/icons/generalIcons/cameraIconFilledDarkMode.svg';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import LottieView from 'lottie-react-native';
import { checkDeckNameExists, saveUserFileUploadFormEntry, getMostRecentFileUploadFormEntry, createDeckWithGenAIFlashcards, createGenAIFlashcardsForDeck, getDeckNameById } from '../db/decks';
import { Toast } from '../components/general/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import * as mammoth from 'mammoth';
import * as FileSystem from 'expo-file-system';
import NotificationService from '@/utils/notifications';
import JSZip from 'jszip';
// @ts-ignore
import * as XLSX from 'xlsx'; // Use CommonJS import for React Native compatibility
// @ts-ignore
import * as ImageManipulator from 'expo-image-manipulator';
import { getUserQuestionSettings, incrementFileUploadRequests } from '@/db/users';
import { getDistributionOfFlashcardsForInterviewType } from '@/constants/promptEngineering';
import { generateFileUploadPrompt } from '@/utils/fileUploadPromptGeneration';
import DeckCreationStatusPage from './deckCreationStatusPage';
import { useTopBarAccountHeight } from '@/hooks/heights';
import BackgroundService from 'react-native-background-actions';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- File Size Limits ---
// Option 1: Current limits (recommended for optimal performance)
const FILE_SIZE_LIMITS = {
  PDF: 50 * 1024 * 1024, // 50MB for PDFs
  DOCX: 25 * 1024 * 1024, // 25MB for Word docs
  PPTX: 30 * 1024 * 1024, // 30MB for PowerPoint
  XLSX: 20 * 1024 * 1024, // 20MB for Excel
  TXT: 10 * 1024 * 1024,  // 10MB for text files
  IMAGE: 10 * 1024 * 1024, // 10MB for images
  DEFAULT: 25 * 1024 * 1024 // 25MB default
};

// Option 2: Generalized limits (if you prefer simplicity)
// const FILE_SIZE_LIMITS = {
//   PDF: 30 * 1024 * 1024, // 30MB for PDFs
//   DOCX: 30 * 1024 * 1024, // 30MB for Word docs
//   PPTX: 30 * 1024 * 1024, // 30MB for PowerPoint
//   XLSX: 30 * 1024 * 1024, // 30MB for Excel
//   TXT: 30 * 1024 * 1024,  // 30MB for text files
//   IMAGE: 30 * 1024 * 1024, // 30MB for images
//   DEFAULT: 30 * 1024 * 1024 // 30MB default
// };

// Absolute maximum limits (use only if needed for specific use cases)
const ABSOLUTE_MAX_FILE_SIZE_LIMITS = {
  PDF: 100 * 1024 * 1024,    // 100MB
  DOCX: 50 * 1024 * 1024,    // 50MB
  PPTX: 75 * 1024 * 1024,    // 75MB
  XLSX: 40 * 1024 * 1024,    // 40MB
  TXT: 25 * 1024 * 1024,     // 25MB
  IMAGE: 25 * 1024 * 1024,   // 25MB
  DEFAULT: 50 * 1024 * 1024  // 50MB
};

// --- Background Task Progress Helpers (reuse same key as GenAI form) ---
const BG_TASK_PROGRESS_KEY = 'genAIDeckCreationBgTaskProgress';

async function saveDeckCreationProgress(progress: any) {
  try {
    await AsyncStorage.setItem(BG_TASK_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save deck creation progress (file upload)', e);
  }
}

async function loadDeckCreationProgress(): Promise<any | null> {
  try {
    const data = await AsyncStorage.getItem(BG_TASK_PROGRESS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load deck creation progress (file upload)', e);
    return null;
  }
}

async function clearDeckCreationProgress() {
  try {
    await AsyncStorage.removeItem(BG_TASK_PROGRESS_KEY);
  } catch (e) {
    console.error('Failed to clear deck creation progress (file upload)', e);
  }
}

async function keepProgressFresh(base: any, intervalMs: number = 5000) {
  const interval = setInterval(async () => {
    try {
      const current = await loadDeckCreationProgress();
      if (current) {
        await saveDeckCreationProgress({ ...current, timestamp: Date.now() });
      } else {
        await saveDeckCreationProgress({ ...base, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('Error refreshing progress timestamp (file upload)', err);
    }
  }, intervalMs);
  return () => clearInterval(interval);
}

// --- Background Task for File Upload deck/flashcard creation ---
const fileUploadDeckCreationBackgroundTask = async (taskDataArguments: any) => {
  const {
    // Context flags
    mode,
    deckId,
    folderId,
    isInFavoritesPage,
    isInIndexPage,
    isInViewDecksInFolderPage,
    isInViewFlashcardsPage,
    // Form data
    language,
    deckName,
    studyMandatoryQuestion1,
    studyMandatoryQuestion2,
    interviewMandatoryQuestion1,
    interviewType,
    numberOfQuestions,
    isAIGenerate,
    // File-related
    selectedFile, // { uri, name, mimeType }
    uploadType, // 'image' | 'file'
    uploadedFileName,
    extractedText,
    imageUris = [],
    // Network error cancellation function
    cancelDeckCreationTaskDueToNetworkError,
  } = taskDataArguments;

  let createdDeckId: number | null = null;
  let createdFlashcardIds: number[] = [];

  try {
    if (BackgroundService.isRunning() === false) return;

    // Initial progress: request received
    await saveDeckCreationProgress({
      taskType: 'fileUpload',
      mode,
      deckId,
      folderId,
      isInFavoritesPage,
      isInIndexPage,
      isInViewDecksInFolderPage,
      isInViewFlashcardsPage,
      formData: {
        deckName,
        studyMandatoryQuestion1,
        studyMandatoryQuestion2,
        interviewMandatoryQuestion1,
        interviewType,
        numberOfQuestions,
        isAIGenerate,
      },
      createdDeckId,
      createdFlashcardIds,
      status: 'requestReceived',
      inProgress: true,
      timestamp: Date.now(),
    });

    const stopKeepAlive = await keepProgressFresh({ inProgress: true });

    // Step A: Build captions from file(s)
    let pdfCaptionClaudeCaption: string | null = null;
    let imageCaptionClaudeCaption: string | null = null;

    // PDF caption (if applicable)
    if (selectedFile && selectedFile.name && String(selectedFile.name).toLowerCase().endsWith('.pdf')) {
      if (BackgroundService.isRunning() === false) {
        stopKeepAlive();
        return;
      }
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/pdf',
        } as any);
        // Add timeout to PDF caption fetch
        const controller = new AbortController();
        
        const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/pdfCaptionClaude`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          signal: controller.signal
        });
        if (resp.ok) {
          const j = await resp.json();
          pdfCaptionClaudeCaption = j.caption;
        }
      } catch (e) {
        // Check if this is a network error - be more comprehensive in detection
        const errorMessage = (e as any)?.message || String(e);
        const isNetworkError = 
          e instanceof TypeError || 
          (e as any)?.name === 'TypeError' || 
          (e as any)?.name === 'AbortError' ||
          (e as any)?.code === 'NETWORK_ERROR' ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('The Internet connection appears to be offline') ||
          errorMessage.includes('Could not connect to the server') ||
          errorMessage.includes('The request was aborted') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Load failed') ||
          errorMessage.includes('network error') ||
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('connection') ||
          (e as any)?.code === 'ENOTFOUND' ||
          (e as any)?.code === 'ECONNREFUSED' ||
          (e as any)?.code === 'ETIMEDOUT';
        
        if (isNetworkError) {
          console.error('🚨 NETWORK ERROR during PDF caption fetch:', e);
          
          // Check if app is in background and send notification immediately
          const currentAppState = AppState.currentState;
          if (currentAppState !== 'active') {
            console.log('App is in background - sending network error notification immediately');
            try {
              const notificationService = NotificationService.getInstance();
              await notificationService.sendNetworkErrorCancelledNotification(
                deckName,
                language
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
          
          stopKeepAlive();
          throw new Error('NETWORK_ERROR');
        } else {
          console.log('Non-network error during PDF caption fetch, continuing:', e);
          // Not a network error, continue without caption
        }
      }
    }

    // Image captions (if provided URIs)
    if (Array.isArray(imageUris) && imageUris.length > 0) {
      if (BackgroundService.isRunning() === false) {
        stopKeepAlive();
        return;
      }
      try {
        const formData = new FormData();
        for (const uri of imageUris) {
          formData.append('images[]', {
            uri,
            name: uri.split('/').pop() || 'image.jpg',
            type: uri.endsWith('.png') ? 'image/png' : 'image/jpeg',
          } as any);
        }
        // Add timeout to image caption fetch
        const controller = new AbortController();
        
        const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/imageCaptionClaude`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          signal: controller.signal
        });
        if (resp.ok) {
          const j = await resp.json();
          imageCaptionClaudeCaption = j.caption;
        }
      } catch (e) {
        // Check if this is a network error - be more comprehensive in detection
        const errorMessage = (e as any)?.message || String(e);
        const isNetworkError = 
          e instanceof TypeError || 
          (e as any)?.name === 'TypeError' || 
          (e as any)?.name === 'AbortError' ||
          (e as any)?.code === 'NETWORK_ERROR' ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('The Internet connection appears to be offline') ||
          errorMessage.includes('Could not connect to the server') ||
          errorMessage.includes('The request was aborted') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Load failed') ||
          errorMessage.includes('network error') ||
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('connection') ||
          (e as any)?.code === 'ENOTFOUND' ||
          (e as any)?.code === 'ECONNREFUSED' ||
          (e as any)?.code === 'ETIMEDOUT';
        
        if (isNetworkError) {
          console.error('🚨 NETWORK ERROR during image caption fetch:', e);
          
          // Check if app is in background and send notification immediately
          const currentAppState = AppState.currentState;
          if (currentAppState !== 'active') {
            console.log('App is in background - sending network error notification immediately');
            try {
              const notificationService = NotificationService.getInstance();
              await notificationService.sendNetworkErrorCancelledNotification(
                deckName,
                language
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
          
          stopKeepAlive();
          throw new Error('NETWORK_ERROR');
        } else {
          console.log('Non-network error during image caption fetch, continuing:', e);
          // Not a network error, continue without caption
        }
      }
    }

    // Mark extraction complete before generating
    await saveDeckCreationProgress({
      taskType: 'fileUpload',
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData: { deckName },
      createdDeckId, createdFlashcardIds,
      status: 'fileInfoExtracted', inProgress: true, timestamp: Date.now(),
    });

    // Step B: Construct prompt
    const { getUserQuestionSettings } = await import('@/db/users');
    const { getDistributionOfFlashcardsForInterviewType } = await import('@/constants/promptEngineering');
    const { promptAndData, promptAndDataChinese } = await import('@/constants/promptEngineering');

    const userSettings = await getUserQuestionSettings();
    const distribution = getDistributionOfFlashcardsForInterviewType(
      userSettings.isMcqEnabled,
      userSettings.isClozeEnabled,
      userSettings.isVoiceRecordedEnabled,
      interviewType,
      numberOfQuestions,
    );

    // Generate prompt using utility function
    const prompt = generateFileUploadPrompt({
      mode: mode as string,
      language,
      studyMandatoryQuestion1,
      studyMandatoryQuestion2,
      interviewMandatoryQuestion1,
      interviewType,
      pdfCaptionClaudeCaption: pdfCaptionClaudeCaption || undefined,
      extractedText: extractedText || undefined,
      imageCaptionClaudeCaption: imageCaptionClaudeCaption || undefined,
      distribution: distribution || undefined,
      isAIGenerate
    });

    if (BackgroundService.isRunning() === false) { stopKeepAlive(); return; }

    // Step C: Call GenAI to generate flashcards
    let flashcards: any[] | null = null;
    try {
      const resp = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/genAIFlashcardsGeneration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`File upload GenAI flashcard request failed: ${resp.status}`, errorText);
        throw new Error(`SERVER_ERROR:${resp.status}`);
      }

      const data = await resp.json();
      let f = data.flashcards?.flashcards ?? data.flashcards;
        
        // Handle case where API returns flashcards as raw string (when Edge Function parsing fails)
        if (typeof f === 'string') {
          try {
            // Clean up the raw string - remove trailing ]\n and other artifacts
            let cleanedString = f.trim();
            
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
            if (cleanedString.startsWith('{')) {
              // Try to parse as single object first
              try {
                const parsedFlashcards = JSON.parse(cleanedString);
                f = [parsedFlashcards]; // Wrap single object in array
              } catch (parseError) {
                console.error('Failed to parse flashcards string in fileUpload background task:', parseError);
                f = null;
              }
            } else {
              f = null;
            }
          } catch (parseError) {
            console.error('Failed to parse flashcards string in fileUpload background task:', parseError);
            f = null;
          }
        }
        
      if (f && !Array.isArray(f)) f = [f];
      flashcards = f;
    } catch (networkError) {
      console.error('Network error during file upload GenAI flashcard generation:', networkError);
      
      // Check if app is in background and send notification immediately
      const currentAppState = AppState.currentState;
      if (currentAppState !== 'active') {
        console.log('App is in background - sending network error notification immediately');
        try {
          const notificationService = NotificationService.getInstance();
          await notificationService.sendNetworkErrorCancelledNotification(
            deckName,
            language
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
      
      stopKeepAlive();
      throw new Error('NETWORK_ERROR');
    }

    if (!flashcards || flashcards.length === 0) {
      stopKeepAlive();
      // Mark as completed without results to allow UI to close gracefully
      await saveDeckCreationProgress({
        taskType: 'fileUpload',
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData: { deckName },
        createdDeckId, createdFlashcardIds,
        status: 'cancelled', inProgress: false, cancelled: true, timestamp: Date.now(),
      });
      return;
    }

    // Update: flashcards generated
    await saveDeckCreationProgress({
      taskType: 'fileUpload',
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData: { deckName },
      createdDeckId, createdFlashcardIds,
      status: 'flashcardsGenerated', inProgress: true, timestamp: Date.now(),
    });

    if (BackgroundService.isRunning() === false) { stopKeepAlive(); return; }

    // Step D: Save to DB (create deck or add to existing)
    const { createDeckWithGenAIFlashcards, createGenAIFlashcardsForDeck } = await import('@/db/decks');
    if (isInViewFlashcardsPage) {
      const result = await createGenAIFlashcardsForDeck({
        deckId: Number(deckId),
        flashcards,
      });
      createdFlashcardIds = result?.flashcardIds || [];
    } else {
      const params: any = {
        deckName,
        mode: mode === 'study' ? 'study' : 'interview',
        formFields: {
          studyEducationLevel: studyMandatoryQuestion1,
          studySubjects: studyMandatoryQuestion2,
          interviewJobRole: interviewMandatoryQuestion1,
          interviewType,
          numberOfQuestions,
        },
        flashcards,
      };
      if (isInFavoritesPage) params.isFavorited = 1;
      if (isInViewDecksInFolderPage && folderId) params.folderIDs = `[${folderId}]`;
      const result = await createDeckWithGenAIFlashcards(params);
      createdDeckId = result.deckId || null;
    }

    if (BackgroundService.isRunning() === false) { stopKeepAlive(); return; }

    // Calculate flashcard count
    const flashcardCount = flashcards?.length || createdFlashcardIds?.length || 0;
    
    // Increment fileUploadRequests with the number of flashcards created
    if (flashcardCount > 0) {
      try {
        await incrementFileUploadRequests(flashcardCount);
        console.log(`Updated fileUploadRequests: added ${flashcardCount} flashcards to counter`);
      } catch (error) {
        console.error('Error incrementing fileUploadRequests:', error);
        // Don't fail the entire operation if this fails
      }
    }

    // Final progress: deck and flashcards created
    await saveDeckCreationProgress({
      taskType: 'fileUpload',
      mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
      formData: { deckName },
      createdDeckId, createdFlashcardIds,
      status: 'deckAndFlashcardsCreated', inProgress: false, completed: true, timestamp: Date.now(),
    });

    stopKeepAlive();
  } catch (error: any) {
    console.error('File upload background task error:', error);
    
    // If this is already a NETWORK_ERROR that was thrown from a previous stage, don't re-process it
    if (error.message === 'NETWORK_ERROR') {
      console.log('🚨 NETWORK_ERROR already processed by previous stage, not re-processing');
      return; // Exit without saving progress again
    }
    
    // Check if this is a network error - be more comprehensive in detection
    const errorMessage = error?.message || String(error);
    const isNetworkError = 
      error instanceof TypeError || 
      (error as any)?.name === 'TypeError' || 
      (error as any)?.name === 'AbortError' ||
      (error as any)?.code === 'NETWORK_ERROR' ||
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('The Internet connection appears to be offline') ||
      errorMessage.includes('Could not connect to the server') ||
      errorMessage.includes('The request was aborted') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('Load failed') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('connection') ||
      (error as any)?.code === 'ENOTFOUND' ||
      (error as any)?.code === 'ECONNREFUSED' ||
      (error as any)?.code === 'ETIMEDOUT';
    
    const isServerError = !isNetworkError && typeof errorMessage === 'string' && errorMessage.startsWith('SERVER_ERROR:');
    let serverStatusCode: number | null = null;
    if (isServerError) {
      const parts = errorMessage.split(':');
      if (parts.length > 1) {
        const parsed = parseInt(parts[1], 10);
        if (!Number.isNaN(parsed)) {
          serverStatusCode = parsed;
        }
      }
    }

    if (isNetworkError) {
      console.log('🚨 NETWORK ERROR detected in main catch block, saving progress');
      
      // Check if app is in background and send notification immediately
      const currentAppState = AppState.currentState;
      if (currentAppState !== 'active') {
        console.log('App is in background - sending network error notification immediately');
        try {
          const notificationService = NotificationService.getInstance();
          await notificationService.sendNetworkErrorCancelledNotification(
            deckName,
            language
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
      
      await saveDeckCreationProgress({ 
        taskType: 'fileUpload', 
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData: { deckName },
        createdDeckId, createdFlashcardIds,
        status: 'networkError',
        inProgress: false, 
        error: true, 
        networkError: true,
        errorMessage: 'Network error occurred during task execution',
        timestamp: Date.now() 
      });
    } else {
      console.log('Non-network error in main catch block, saving as general error');
      await saveDeckCreationProgress({ 
        taskType: 'fileUpload', 
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData: { deckName },
        createdDeckId, createdFlashcardIds,
        status: isServerError ? 'serverError' : 'error',
        inProgress: false, 
        error: true, 
        networkError: false,
        serverError: isServerError,
        serverStatusCode,
        errorMessage: isServerError
          ? `Server error occurred${serverStatusCode ? ` (status ${serverStatusCode})` : ''}`
          : error.message,
        timestamp: Date.now() 
      });
    }
  }
};

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

const FileUploadMainSection = ({ 
  pickImage, 
  takePhoto, 
  browseFiles, 
  isUploadSuccess, 
  uploadType,
  uploadedFileName,
  isLoading = false,
  uploadProgress = 0,
}: { 
  pickImage: () => void; 
  takePhoto: () => void; 
  browseFiles: () => void;
  isUploadSuccess: boolean;
  uploadType: 'image' | 'file' | null;
  uploadedFileName: string;
  language: 'English' | 'Chinese';
  isLoading?: boolean;
  uploadProgress?: number;
}) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const themeColors = Colors[theme as keyof typeof Colors];
  return (
      <View style={[styles.fileUploadMainSection, { borderColor: themeColors.brandColor2 }]}>
      {/* Loading Bar */}
      {isLoading && (
        <View style={styles.loadingBarContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${uploadProgress}%`,
                  backgroundColor: uploadProgress === 100 ? themeColors.brandColor1 : themeColors.brandColor2,
                }
              ]} 
            />
          </View>
          <Text style={[styles.percentText, { color: themeColors.brandColor2 }]}>{uploadProgress}%</Text>
        </View>
      )}
      
      <View style={styles.uploadContent}>
        {isUploadSuccess ? (
          <LottieView
            source={require('../assets/animations/SuccessAnimation1_Tick.json')}
            autoPlay
            loop={true}
            style={styles.successAnimation}
          />
        ) : (
          theme === 'dark' ? (
            <CloudUploadIconDarkMode width={110} height={110} />
          ) : (
            <CloudUploadIcon width={110} height={110} />
          )
        )}
        <Text style={[styles.supportedFilesText, { fontSize: 20, color: themeColors.unselectedText }]}>
          {isUploadSuccess 
            ? `${uploadType === 'image' ? strings[language].fileUploadPage.imageUploadedSuccessfully : strings[language].fileUploadPage.fileUploadedSuccessfully}\n${uploadType === 'file' ? `${strings[language].fileUploadPage.fileWithColon}${uploadedFileName}` : ''}`
            : strings[language].fileUploadPage.supportedFiles
          }
        </Text>
        <PrimaryButton 
          text={strings[language].fileUploadPage.browseFiles}
          onPress={browseFiles}
        />
      </View>
      <View style={styles.cornerIconsContainer}>
        <TouchableOpacity onPress={pickImage}>
          {theme === 'dark' ? (
            <ImageIconFilledDarkMode width={30} height={30} />
          ) : (
            <ImageIconFilled width={30} height={30} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto}>
          {theme === 'dark' ? (
            <CameraIconFilledDarkMode width={40} height={40} />
          ) : (
            <CameraIconFilled width={40} height={40} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};


// Utility: Save base64 image to file
async function saveBase64ImageToFile(base64Data: string, fileName: string) {
  const fileUri = FileSystem.documentDirectory + `docxExtracted/${fileName}`;
  // Ensure directory exists
  const dirUri = FileSystem.documentDirectory + 'docxExtracted';
  const dirInfo = await FileSystem.getInfoAsync(dirUri);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
  await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
  return fileUri;
}

// Extract text and images from docx
async function extractDocxTextAndImages(docxUri: string) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(docxUri, { encoding: FileSystem.EncodingType.Base64 });
  // Convert base64 to ArrayBuffer
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  // Use JSZip to unzip
  const zip = await JSZip.loadAsync(binary);
  // Extract images
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('word/media/'));
  const savedImages: string[] = [];
  for (const imgName of imageFiles) {
    const ext = imgName.split('.').pop() || 'img';
    const imgData = await zip.files[imgName].async('base64');
    const savedUri = await saveBase64ImageToFile(imgData, `${Date.now()}_${imgName.replace('word/media/', '')}`);
    savedImages.push(savedUri);
  }
  // Extract text with mammoth
  const arrayBuffer = binary.buffer;
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  return { text, images: savedImages };
}

// Extract text and images from pptx
async function extractPptxTextAndImages(pptxUri: string) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(pptxUri, { encoding: FileSystem.EncodingType.Base64 });
  // Convert base64 to ArrayBuffer
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  // Use JSZip to unzip
  const zip = await JSZip.loadAsync(binary);
  // Extract images
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/media/'));
  const savedImages: string[] = [];
  for (const imgName of imageFiles) {
    const ext = imgName.split('.').pop() || 'img';
    const imgData = await zip.files[imgName].async('base64');
    const savedUri = await saveBase64ImageToFile(imgData, `${Date.now()}_${imgName.replace('ppt/media/', '')}`);
    savedImages.push(savedUri);
  }
  // Extract text from slide XMLs
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  let allText = '';
  for (const slideName of slideFiles) {
    const xml = await zip.files[slideName].async('string');
    // Extract text between <a:t>...</a:t> tags
    const matches = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g));
    for (const m of matches) {
      allText += m[1] + '\n';
    }
  }
  return { text: allText, images: savedImages };
}

// Extract text and images from xlsx using only JSZip
async function extractXlsxTextAndImages(xlsxUri: string) {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(xlsxUri, { encoding: FileSystem.EncodingType.Base64 });
  // Convert base64 to ArrayBuffer
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  // Use JSZip to unzip
  const zip = await JSZip.loadAsync(binary);
  // Extract images
  const imageFiles = Object.keys(zip.files).filter(name => name.startsWith('xl/media/'));
  const savedImages: string[] = [];
  for (const imgName of imageFiles) {
    const ext = imgName.split('.').pop() || 'img';
    const imgData = await zip.files[imgName].async('base64');
    const savedUri = await saveBase64ImageToFile(imgData, `${Date.now()}_${imgName.replace('xl/media/', '')}`);
    savedImages.push(savedUri);
  }
  // Extract shared strings (for cell value lookup)
  let sharedStrings: string[] = [];
  if (zip.files['xl/sharedStrings.xml']) {
    const sharedStringsXml = await zip.files['xl/sharedStrings.xml'].async('string');
    sharedStrings = Array.from(sharedStringsXml.matchAll(/<t[^>]*>(.*?)<\/t>/g)).map(m => m[1]);
  }
  // Extract text from all sheets
  const sheetFiles = Object.keys(zip.files).filter(name => name.startsWith('xl/worksheets/sheet') && name.endsWith('.xml'));
  let allText = '';
  for (const sheetName of sheetFiles) {
    const xml = await zip.files[sheetName].async('string');
    // Extract all rows
    const rows = xml.split(/<row[^>]*>/g).slice(1); // skip before first <row>
    for (const rowXml of rows) {
      // Extract all cells in the row
      const cells = Array.from(rowXml.matchAll(/<c[^>]*?t="([^"]*)"[^>]*?r="([^"]*)"[^>]*>([\s\S]*?)<\/c>/g));
      let rowValues: string[] = [];
      if (cells.length === 0) {
        // fallback: try to match all <v>...</v> in row
        const vMatches = Array.from(rowXml.matchAll(/<v>(.*?)<\/v>/g));
        rowValues = vMatches.map(m => m[1]);
      } else {
        for (const cell of cells) {
          const type = cell[1];
          const ref = cell[2];
          const cellContent = cell[3];
          // Get value
          const vMatch = cellContent.match(/<v>(.*?)<\/v>/);
          let value = vMatch ? vMatch[1] : '';
          if (type === 's' && sharedStrings.length > 0) {
            // Shared string lookup
            const idx = parseInt(value, 10);
            value = sharedStrings[idx] || '';
          }
          rowValues.push(value);
        }
      }
      if (rowValues.length > 0) {
        allText += rowValues.join('\t') + '\n';
      }
    }
  }
  return { text: allText, images: savedImages };
}

// Helper function to check file size limits
function getFileSizeLimit(fileName: string): number {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  switch (extension) {
    case '.pdf':
      return FILE_SIZE_LIMITS.PDF;
    case '.docx':
      return FILE_SIZE_LIMITS.DOCX;
    case '.pptx':
      return FILE_SIZE_LIMITS.PPTX;
    case '.xlsx':
      return FILE_SIZE_LIMITS.XLSX;
    case '.txt':
      return FILE_SIZE_LIMITS.TXT;
    case '.jpg':
    case '.jpeg':
    case '.png':
      return FILE_SIZE_LIMITS.IMAGE;
    default:
      return FILE_SIZE_LIMITS.DEFAULT;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

// Utility: Resize and compress image to fit Claude API limits
async function prepareImageForUpload(uri: string): Promise<string> {
  // Resize to max 1568px on the long edge, compress to JPEG
  let manipResult = { uri };
  try {
    // Get image dimensions
    const { width, height } = await ImageManipulator.manipulateAsync(uri, [], { base64: false });
    let resize = {};
    if (width && height) {
      if (width > height && width > 1568) {
        resize = { width: 1568 };
      } else if (height > width && height > 1568) {
        resize = { height: 1568 };
      } else if (width === height && width > 1568) {
        resize = { width: 1568, height: 1568 };
      }
    }
    manipResult = await ImageManipulator.manipulateAsync(
      uri,
      resize ? [{ resize }] : [],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
  } catch (e) {
    // fallback to original if manipulation fails
    manipResult = { uri };
  }
  return manipResult.uri;
}

export default function FileUploadPage() {
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
  const [interviewMandatoryQuestion1, setInterviewMandatoryQuestion1] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [interviewType, setInterviewType] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isAIGenerate, setIsAIGenerate] = useState(false);
  const [isAIHelpModalOpen, setIsAIHelpModalOpen] = useState(false);
  const aiHelpOverlayOpacity = useRef(new Animated.Value(0)).current;
  const aiHelpModalOpacity = useRef(new Animated.Value(0)).current;
  const [isRecentFormModalOpen, setIsRecentFormModalOpen] = useState(false);
  const recentFormModalOpacity = useRef(new Animated.Value(0)).current;
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'file' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorModalOpacity = useRef(new Animated.Value(0)).current;
  const successModalOpacity = useRef(new Animated.Value(0)).current;
  const [isBackConfirmationModalOpen, setIsBackConfirmationModalOpen] = useState(false);
  const backConfirmationModalOpacity = useRef(new Animated.Value(0)).current;
  const [isNetworkErrorModalOpen, setIsNetworkErrorModalOpen] = useState(false);
  const networkErrorModalOpacity = useRef(new Animated.Value(0)).current;
  const [isServerErrorModalOpen, setIsServerErrorModalOpen] = useState(false);
  const serverErrorModalOpacity = useRef(new Animated.Value(0)).current;
  const [serverErrorMessage, setServerErrorMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { language } = useLanguage();
  const { theme } = useTheme();
  const themeColors = Colors[theme as keyof typeof Colors];
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showStatusPage, setShowStatusPage] = useState(false);
  const [statusExtractingInformationFromFiles, setStatusExtractingInformationFromFiles] = useState(false);
  const [statusGeneratingFlashcards, setStatusGeneratingFlashcards] = useState(false);
  const [statusAddingDeckAndFlashcards, setStatusAddingDeckAndFlashcards] = useState(false);
  const cancelCreationRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [createdDeckId, setCreatedDeckId] = useState<number | null>(null);
  const [createdFlashcardIds, setCreatedFlashcardIds] = useState<number[]>([]);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isMinimizingRef = useRef(false);
  const { 
    startBackgroundTaskMonitoring, 
    backgroundTaskProgress, 
    forceStopBackgroundTask, 
    wasAutomaticallyCancelled, 
    resetAutomaticallyCancelledFlag,
    cancelDeckCreationTaskDueToNetworkError
  } = useBackgroundTask();
  const serverErrorHandledRef = useRef(false);

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : insets.bottom) : 
    insets.bottom + 10;

  const getTopBarAccountHeight = useTopBarAccountHeight();

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
    // Ensure the layout is ready after the first render
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);


  // Resume background task on app foreground (mirrors genAIForm)
  useEffect(() => {
    let appState = AppState.currentState;
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (typeof appState === 'string' && appState.match(/inactive|background/) && nextAppState === 'active') {
        const progress = await loadDeckCreationProgress();
        if (progress && progress.inProgress && !progress.completed) {
          const now = Date.now();
          const progressTime = progress.timestamp || 0;
          const isRecent = now - progressTime < 5 * 60 * 1000;
          if (isRecent) {
            try {
              await BackgroundService.start(fileUploadDeckCreationBackgroundTask, {
                taskName: 'GenAIDeckCreation',
                taskTitle: strings[language].fileUploadPage.creatingDeck,
                taskDesc: strings[language].fileUploadPage.creatingDeckInBackground,
                taskIcon: { name: 'ic_launcher', type: 'mipmap' },
                color: themeColors.brandColor1,
                parameters: {
                  ...progress,
                  cancelDeckCreationTaskDueToNetworkError
                },
              });
            } catch (e) {
              console.error('Failed to resume file upload background task:', e);
            }
          } else {
            await clearDeckCreationProgress();
          }
        }
      }
      appState = nextAppState;
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [language]);

  // Cleanup: stop background service when unmounting unless minimizing
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          if (!isMinimizingRef.current) {
            await BackgroundService.stop();
            await clearDeckCreationProgress();
          }
        } catch (error) {
          console.error('Error cleaning up file upload background service:', error);
        }
      };
      cleanup();
    };
  }, []);

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
    if (isAIHelpModalOpen) {
      Animated.parallel([
        Animated.timing(aiHelpOverlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(aiHelpModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isAIHelpModalOpen]);

  useEffect(() => {
    // Set initial mode animation when component mounts
    fadeAnim.setValue(isMandatory ? 0 : 1);
  }, []);

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
    if (isServerErrorModalOpen) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(serverErrorModalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isServerErrorModalOpen]);

  useEffect(() => {
    if (
      backgroundTaskProgress &&
      backgroundTaskProgress.taskType === 'fileUpload' &&
      backgroundTaskProgress.serverError &&
      !backgroundTaskProgress.networkError
    ) {
      const statusCode = backgroundTaskProgress.serverStatusCode;
      const statusKey = statusCode ? String(statusCode) : 'default';
      const errorMessages = strings[language].fileUploadPage.errorMessages as Record<string, string>;
      const message = errorMessages[statusKey] ?? errorMessages.default;

      if (showStatusPage) {
        setShowStatusPage(false);
        setStatusExtractingInformationFromFiles(false);
        setStatusGeneratingFlashcards(false);
        setStatusAddingDeckAndFlashcards(false);
        setCreatedDeckId(null);
        setCreatedFlashcardIds([]);
        resetAutomaticallyCancelledFlag();
      }

      if (!serverErrorHandledRef.current) {
        setServerErrorMessage(message);
        setIsServerErrorModalOpen(true);
        serverErrorHandledRef.current = true;
      }
    } else if (!backgroundTaskProgress || backgroundTaskProgress.taskType !== 'fileUpload' || !backgroundTaskProgress.serverError) {
      serverErrorHandledRef.current = false;
    }
  }, [backgroundTaskProgress, language, showStatusPage]);

  // Reset state when component mounts or when navigating back
  useEffect(() => {
    // Reset abort controller and cancel flag
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelCreationRef.current = false;
    
    // Reset status states
    setStatusExtractingInformationFromFiles(false);
    setStatusGeneratingFlashcards(false);
    setStatusAddingDeckAndFlashcards(false);
    setShowStatusPage(false);
    
    // Reset created IDs
    setCreatedDeckId(null);
    setCreatedFlashcardIds([]);
    
    // Reset RoundedContainer state to "Mandatory" (left side)
    setIsMandatory(true);
    
    // Cleanup function for when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      cancelCreationRef.current = false;
    };
  }, []);

  const handleBackPress = () => {
    setIsBackConfirmationModalOpen(true);
  };

  const handleClearAllPress = () => {
    // Reset mandatory fields only
    setDeckName('');
    setStudyMandatoryQuestion1('');
    setStudyMandatoryQuestion2('');
    setInterviewMandatoryQuestion1('');
    setInterviewType('');
    setNumberOfQuestions(1);
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
             interviewType !== ''; 
    }
    // When creating new deck, need deck name and interview questions
    return deckName.trim() !== '' && 
           interviewMandatoryQuestion1.trim() !== '' && 
           interviewType !== '';
  };

  const isSubmitDisabled = () => {
    return false; // Always enabled now
  };

  const validateFormSubmission = async () => {
    const mandatoryFieldsFilled = mode === 'study' ? isStudyMandatoryFieldsFilled() : isInterviewMandatoryFieldsFilled();
    const hasFileUploaded = isUploadSuccess;

    // Check if deck name already exists (only for new deck creation, not when adding to existing deck)
    if (!isInViewFlashcardsPage && deckName.trim() !== '') {
      const deckNameExists = await checkDeckNameExists(deckName.trim());
      if (deckNameExists) {
        setShowToast(true);
        setToastMessage(strings[language].fileUploadPage.deckNameInUse);
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
        setToastMessage(strings[language].fileUploadPage.invalidSubjects);
        return false;
      }
    }

    // Error 1: mandatory fields not filled up and no file/image uploaded
    if (!mandatoryFieldsFilled && !hasFileUploaded) {
      setErrorMessage(strings[language].fileUploadPage.fillAllAndUpload);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 2: mandatory fields filled up but file/image not uploaded
    if (mandatoryFieldsFilled && !hasFileUploaded) {
      setErrorMessage(strings[language].fileUploadPage.uploadBeforeSubmit);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 3: mandatory fields not filled up but got file/image uploaded
    if (!mandatoryFieldsFilled && hasFileUploaded) {
      setErrorMessage(strings[language].fileUploadPage.fillAll);
      setIsErrorModalOpen(true);
      return false;
    }

    // Success: all validations passed
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

  const handleDismissAIHelp = () => {
    Animated.parallel([
      Animated.timing(aiHelpOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(aiHelpModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAIHelpModalOpen(false);
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

  const handleDismissSuccessModal = () => {
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

    // Check if we should cancel before starting
    if (cancelCreationRef.current) {
      console.log('Request cancelled before starting handleSuccessConfirm');
      return;
    }
    
    // Animate out first, then navigate
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
      // Start global background task monitoring
      startBackgroundTaskMonitoring();

      // Prepare parameters for background task
      const params: any = {
        mode,
        deckId,
        folderId,
        isInFavoritesPage,
        isInIndexPage,
        isInViewDecksInFolderPage,
        isInViewFlashcardsPage,
        language,
        deckName,
        studyMandatoryQuestion1,
        studyMandatoryQuestion2,
        interviewMandatoryQuestion1,
        interviewType,
        numberOfQuestions,
        isAIGenerate,
        selectedFile,
        uploadType,
        uploadedFileName,
        extractedText,
        imageUris: uploadType === 'image' && uploadedFileName ? [uploadedFileName] : extractedImages,
      };

      try {
        await BackgroundService.start(fileUploadDeckCreationBackgroundTask, {
          taskName: 'GenAIDeckCreation',
          taskTitle: strings[language].fileUploadPage.creatingDeck,
          taskDesc: strings[language].fileUploadPage.creatingDeckInBackground,
          taskIcon: { name: 'ic_launcher', type: 'mipmap' },
          color: themeColors.brandColor1,
          parameters: {
            ...params,
            cancelDeckCreationTaskDueToNetworkError
          },
        });
      } catch (error) {
        console.error('Failed to start background task (file upload):', error);
        setShowStatusPage(false);
        Alert.alert(strings[language].error, strings[language].fileUploadPage.failedToStartBackgroundTask);
        return;
      }

      // Show status page; actual progress will stream from BackgroundTaskContext
      setIsSuccessModalOpen(false);
      
      // Reset the automatically cancelled flag before showing status page
      resetAutomaticallyCancelledFlag();
      
      setShowStatusPage(true);
      setStatusExtractingInformationFromFiles(false);
      setStatusGeneratingFlashcards(false);
      setStatusAddingDeckAndFlashcards(false);

      // Save form submission to userFormEntries
      await saveUserFileUploadFormEntry({
        deckName,
        studyEducationLevel: studyMandatoryQuestion1,
        studySubjects: studyMandatoryQuestion2,
        numberOfQuestions,
        interviewJobRole: interviewMandatoryQuestion1,
        interviewType,
      });
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

  const handleDismissServerErrorModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(serverErrorModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsServerErrorModalOpen(false);
      setServerErrorMessage('');
    });
  };

  const handleUseMostRecentFormPress = () => {
    setIsRecentFormModalOpen(true);
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
  };
  

  const handleLoadMostRecentForm = async () => {
    const recent = await getMostRecentFileUploadFormEntry((mode as 'study' | 'interview'));
    if (recent) {
      setDeckName(recent.deckName || '');
      setStudyMandatoryQuestion1(recent.studyEducationLevel || '');
      setStudyMandatoryQuestion2(recent.studySubjects || '');
      setNumberOfQuestions(recent.numberOfQuestions || 1);
      setInterviewMandatoryQuestion1(recent.interviewJobRole || '');
      setInterviewType(recent.interviewType || '');
    }
    setIsRecentFormModalOpen(false);
  };

  const pickImage = async () => {
    try {
      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert(strings[language].fileUploadPage.cameraRollPermissionsNeeded);
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let selectedImage = result.assets[0];
        
        // Check file size limit for images
        const maxSize = FILE_SIZE_LIMITS.IMAGE;
        if (selectedImage.fileSize && selectedImage.fileSize > maxSize) {
          const sizeLimitText = formatFileSize(maxSize);
          const errorMessage = `${strings[language].fileUploadPage.fileSizeExceeded}!\n${strings[language].fileUploadPage.fileSizeLimit} ${sizeLimitText}.\n${strings[language].fileUploadPage.pleaseChooseSmallerFile}`;
          setShowToast(true);
          setToastMessage(errorMessage);
          return;
        }
        
        // Start loading state
        setIsFileUploading(true);
        setUploadProgress(30);
        
        // Resize/compress before upload
        const processedUri = await prepareImageForUpload(selectedImage.uri);
        setUploadProgress(90);
        
        // Complete the upload
        setUploadProgress(100);
        setTimeout(() => {
          setIsFileUploading(false);
          setUploadProgress(0);
        }, 500);
        
        console.log('Image selected:', processedUri);
        // Show success animation and update text permanently
        setUploadType('image');
        setIsUploadSuccess(true);
        setUploadedFileName(processedUri);
        setExtractedImages([]); // clear extracted images if picking image
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert(strings[language].fileUploadPage.errorSelectingImage);
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert(strings[language].fileUploadPage.cameraPermissionsNeeded);
        return;
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        let capturedImage = result.assets[0];
        
        // Check file size limit for images
        const maxSize = FILE_SIZE_LIMITS.IMAGE;
        if (capturedImage.fileSize && capturedImage.fileSize > maxSize) {
          const sizeLimitText = formatFileSize(maxSize);
          const errorMessage = `${strings[language].fileUploadPage.fileSizeExceeded}!\n${strings[language].fileUploadPage.fileSizeLimit} ${sizeLimitText}.\n${strings[language].fileUploadPage.pleaseChooseSmallerFile}`;
          setShowToast(true);
          setToastMessage(errorMessage);
          return;
        }
        
        // Start loading state
        setIsFileUploading(true);
        setUploadProgress(30);
        
        // Resize/compress before upload
        const processedUri = await prepareImageForUpload(capturedImage.uri);
        setUploadProgress(90);
        
        // Complete the upload
        setUploadProgress(100);
        setTimeout(() => {
          setIsFileUploading(false);
          setUploadProgress(0);
        }, 500);
        
        console.log('Photo taken:', processedUri);
        // Show success animation and update text permanently
        setUploadType('image');
        setIsUploadSuccess(true);
        setUploadedFileName(processedUri);
        setExtractedImages([]); // clear extracted images if taking photo
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert(strings[language].fileUploadPage.errorTakingPhoto);
    }
  };

  const browseFiles = async () => {
    try {
      // Launch the document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        
        // Check if file type is supported
        const supportedExtensions = ['.docx', '.txt', '.pptx', '.xlsx', '.pdf', '.jpg', '.jpeg', '.png'];
        const fileExtension = selected.name.toLowerCase().substring(selected.name.lastIndexOf('.'));
        
        if (!supportedExtensions.includes(fileExtension)) {
          setShowToast(true);
          setToastMessage(strings[language].fileUploadPage.invalidFileType);
          return;
        }
        
        // Check file size limit
        const maxSize = getFileSizeLimit(selected.name);
        if (selected.size && selected.size > maxSize) {
          const sizeLimitText = formatFileSize(maxSize);
          const errorMessage = `${strings[language].fileUploadPage.fileSizeExceeded}!\n${strings[language].fileUploadPage.fileSizeLimit} ${sizeLimitText}.\n${strings[language].fileUploadPage.pleaseChooseSmallerFile}`;
          setShowToast(true);
          setToastMessage(errorMessage);
          return;
        }
        
        setSelectedFile(selected); // <-- Store the file object
        console.log('File selected:', {
          name: selected.name,
          size: selected.size,
          uri: selected.uri,
          mimeType: selected.mimeType,
        });
        
        // Start loading state
        setIsFileUploading(true);
        setUploadProgress(10);
        
        // If docx, extract text and images
        if (selected.name.endsWith('.docx')) {
          try {
            setUploadProgress(20);
            const { text, images } = await extractDocxTextAndImages(selected.uri);
            setUploadProgress(60);
            // Resize/compress all extracted images
            const processedImages = await Promise.all(images.map(uri => prepareImageForUpload(uri)));
            setUploadProgress(90);
            setExtractedImages(processedImages);
            setExtractedText(text);
            console.log('Extracted text:', text);
            console.log('Extracted images:', images);
          } catch (err) {
            console.error('Docx extraction failed:', err);
            setExtractedImages([]);
            setExtractedText('');
          }
        }
        // If pptx, extract text and images
        else if (selected.name.endsWith('.pptx')) {
          try {
            setUploadProgress(20);
            const { text, images } = await extractPptxTextAndImages(selected.uri);
            setUploadProgress(60);
            const processedImages = await Promise.all(images.map(uri => prepareImageForUpload(uri)));
            setUploadProgress(90);
            setExtractedImages(processedImages);
            setExtractedText(text);
            console.log('Extracted PPTX text:', text);
            console.log('Extracted PPTX images:', images);
          } catch (err) {
            console.error('PPTX extraction failed:', err);
            setExtractedImages([]);
            setExtractedText('');
          }
        }
        // If xlsx, extract text and images
        else if (selected.name.endsWith('.xlsx')) {
          try {
            setUploadProgress(20);
            const { text, images } = await extractXlsxTextAndImages(selected.uri);
            setUploadProgress(60);
            const processedImages = await Promise.all(images.map(uri => prepareImageForUpload(uri)));
            setUploadProgress(90);
            setExtractedImages(processedImages);
            setExtractedText(text);
            console.log('Extracted XLSX text:', text);
            console.log('Extracted XLSX images:', images);
          } catch (err) {
            console.error('XLSX extraction failed:', err);
            setExtractedImages([]);
            setExtractedText('');
          }
        }
        // If txt, extract text only
        else if (selected.name.endsWith('.txt')) {
          try {
            setUploadProgress(20);
            const text = await FileSystem.readAsStringAsync(selected.uri, { encoding: FileSystem.EncodingType.UTF8 });
            setUploadProgress(90);
            setExtractedText(text);
            setExtractedImages([]); // No images in txt files
            console.log('Extracted TXT text:', text);
          } catch (err) {
            console.error('TXT extraction failed:', err);
            setExtractedText('');
            setExtractedImages([]);
          }
        }
        // For other file types, just process quickly
        else {
          setUploadProgress(50);
          // Simulate processing time for other file types
          await new Promise(resolve => setTimeout(resolve, 500));
          setUploadProgress(90);
        }
        
        // Complete the upload
        setUploadProgress(100);
        setTimeout(() => {
          setIsFileUploading(false);
          setUploadProgress(0);
        }, 500);
        
        // Show success animation and update text permanently
        setUploadType('file');
        setIsUploadSuccess(true);
        setUploadedFileName(selected.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      alert(strings[language].fileUploadPage.errorSelectingFile);
      setIsFileUploading(false);
      setUploadProgress(0);
    }
  };

  const mandatoryOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const fileUploadOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (showStatusPage) {
    return (
      <DeckCreationStatusPage
        statusRows={[
          { done: statusExtractingInformationFromFiles, label: statusExtractingInformationFromFiles ? strings[language].deckCreationStatusPage.successfullyExtractedInfoFromFile : strings[language].deckCreationStatusPage.extractingInfoFromFile },
          { done: statusGeneratingFlashcards, label: statusGeneratingFlashcards ? strings[language].deckCreationStatusPage.successfullyGeneratedFlashcards : strings[language].deckCreationStatusPage.generatingFlashcards },
          { done: statusAddingDeckAndFlashcards, label: statusAddingDeckAndFlashcards
            ? (isInViewFlashcardsPage
                ? strings[language].deckCreationStatusPage.successfullyAddedFlashcardsToDeck
                : strings[language].deckCreationStatusPage.successfullyAddedFlashcardsAndDeck)
            : (isInViewFlashcardsPage
                ? strings[language].deckCreationStatusPage.addingFlashcardsToDeck
                : strings[language].deckCreationStatusPage.addingFlashcardsAndDeck) }        ]}
        isInViewFlashcardsPage={isInViewFlashcardsPage === 'true'}
        onCancel={async () => {
          if (backgroundTaskProgress?.taskType === 'fileUpload' && backgroundTaskProgress?.serverError) {
            setShowStatusPage(false);
            setStatusExtractingInformationFromFiles(false);
            setStatusGeneratingFlashcards(false);
            setStatusAddingDeckAndFlashcards(false);
            setCreatedDeckId(null);
            setCreatedFlashcardIds([]);
            cancelCreationRef.current = false;
            return;
          }

          cancelCreationRef.current = true;
          
          // Update progress to indicate manual cancellation instead of clearing it immediately
          try {
            const currentProgress = await loadDeckCreationProgress();
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
              await saveDeckCreationProgress(cancelledProgress);
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
          
          // Delay the final progress cleanup to give UI components time to react and show notification
          setTimeout(async () => {
            try {
              console.log('Performing delayed cleanup after manual cancellation...');
              await clearDeckCreationProgress();
            } catch (error) {
              console.error('Error in delayed cleanup after manual cancellation:', error);
            }
          }, 5000); // 5 second delay to allow UI components to detect the cancellation and show notification
          
          setShowStatusPage(false);
          try {
            // Prefer cleaning up using backgroundTaskProgress if available
            const inView = backgroundTaskProgress?.isInViewFlashcardsPage || false;
            if (backgroundTaskProgress?.createdDeckId && !inView) {
              await import('../db/decks').then(db => db.deleteDeck(backgroundTaskProgress.createdDeckId));
            }
            if (inView && backgroundTaskProgress?.createdFlashcardIds?.length > 0) {
              await import('../db/decks').then(db => db.deleteFlashcardsByIds(backgroundTaskProgress.createdFlashcardIds));
            }
          } catch (e) {
            console.error('Error cleaning up after cancel (file upload):', e);
          }
          
          // Reset all state variables after cancellation
          setStatusExtractingInformationFromFiles(false);
          setStatusGeneratingFlashcards(false);
          setStatusAddingDeckAndFlashcards(false);
          setCreatedDeckId(null);
          setCreatedFlashcardIds([]);
          cancelCreationRef.current = false; // Reset the cancel flag          
          // Navigate back to the previous page
          router.back();
        }}
        onMinimize={async () => {
          // When minimizing, keep background task running
          isMinimizingRef.current = true;
          router.back();
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight()}]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color={themeColors.text} />
        </TouchableOpacity>
      </View>
      
      <Animated.View
        style={[
          styles.headerIconsContainer,
          { opacity: mandatoryOpacity, display: isMandatory ? 'flex' : 'none', 
            paddingTop: getTopBarAccountHeight()
          }
        ]}
      >
        <FormHeaderIcons 
          onClearAllPress={handleClearAllPress}
          onUseMostRecentFormPress={handleUseMostRecentFormPress}
        />
      </Animated.View>

      <View style={styles.mainContainer}>
        <View style={styles.toggleContainer}>
          <RoundedContainer 
            leftLabel={strings[language].fileUploadPage.mandatory}
            rightLabel={strings[language].fileUploadPage.fileUpload}
            onToggle={handleToggle}
          />
        </View>
        {isMandatory && (
        <ScrollView 
          style={[
            styles.scrollView,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 50 + bottomOffset }
          ]}
           contentContainerStyle={[
             styles.scrollContent,
           ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            { opacity: mandatoryOpacity, display: !isMandatory ? 'none' : 'flex' }
          ]}>
              <View style={[{gap: Dimensions.get('window').height * 0.025}]}>
                {!isInViewFlashcardsPage && (<TitleTextBar
                  title={strings[language].fileUploadPage.deckName}
                  highlightedWord={mode === 'study' ? strings[language].fileUploadPage.study : strings[language].fileUploadPage.interview}
                  placeholder={strings[language].fileUploadPage.typeHere}
                  value={deckName}
                  onChangeText={setDeckName}
                />)
                }
                {isInViewFlashcardsPage === 'true' && (
                  <TitleTextBar
                    title={strings[language].fileUploadPage.deckName}
                    highlightedWord={mode === 'study' ? strings[language].fileUploadPage.study : strings[language].fileUploadPage.interview}
                    placeholder={deckTitle}
                    value={deckTitle}
                    onChangeText={() => {}} // Disabled - no-op function
                    disabled={true}
                  />
                )}
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label={strings[language].fileUploadPage.educationLevel}
                      placeholder={strings[language].fileUploadPage.educationLevelPlaceholder}
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText={strings[language].fileUploadPage.educationLevelHelper}
                    />
                    <QuestionTextBar
                      label={strings[language].fileUploadPage.subjects}
                      placeholder={strings[language].fileUploadPage.subjectsPlaceholder}
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText={strings[language].fileUploadPage.subjectsHelper}
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                  <QuestionTextBar
                    label={strings[language].fileUploadPage.jobRole}
                    placeholder={strings[language].fileUploadPage.jobRolePlaceholder}
                    value={interviewMandatoryQuestion1}
                    onChangeText={setInterviewMandatoryQuestion1}
                    helperText={strings[language].fileUploadPage.jobRoleHelper}
                    />
                  <TypeOfInterviewQn
                    value={interviewType}
                    onValueChange={setInterviewType}
                  />
                  </>
                )}
                <NumberOfQuestions
                  title={strings[language].fileUploadPage.numberOfQuestions}
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                />
                <View style={styles.bottomSpacing} />
              </View>
           </Animated.View>
          </ScrollView>
            )}

          <Animated.View style={[
          styles.fileUploadContent,
          { opacity: fileUploadOpacity, display: !isMandatory ? 'flex' : 'none' }
          ]}>
            <ScrollView 
              style={[
                { marginBottom: 100 + bottomOffset }
              ]}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
              }}
              showsVerticalScrollIndicator={false}
              bounces={true}
              overScrollMode="always"
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text style={[styles.fileUploadTitle, { color: themeColors.text }]}>
                {strings[language].fileUploadPage.uploadTitle}
              </Text>
              <FileUploadMainSection 
                pickImage={pickImage} 
                takePhoto={takePhoto} 
                browseFiles={browseFiles} 
                isUploadSuccess={isUploadSuccess} 
                uploadType={uploadType} 
                uploadedFileName={uploadedFileName} 
                language={language}
                isLoading={isFileUploading}
                uploadProgress={uploadProgress}
              />
              <View style={styles.aiGenerateRow}>
                <SmallCircleSelectButton
                  selected={isAIGenerate}
                  onPress={() => setIsAIGenerate(!isAIGenerate)}
                    />
                <Text style={[styles.aiGenerateText, { color: themeColors.text }]}>{strings[language].fileUploadPage.aiGenerate}</Text>
                <TouchableOpacity onPress={() => setIsAIHelpModalOpen(true)}>
                  {theme === 'dark' ? (
                    <HelpIconOutlineDarkMode width={24} height={24} />
                  ) : (
                    <HelpIconOutline width={24} height={24} />
                  )}
                </TouchableOpacity>
              </View>
              </View>
            </ScrollView>
          </Animated.View>


          <View style={[
            styles.buttonContainer,
            { bottom: bottomOffset, backgroundColor: themeColors.background }
          ]}>
            <ActionButton
              text={strings[language].fileUploadPage.submit}
              backgroundColor={isSubmitDisabled() ? themeColors.unselectedText : themeColors.brandColor1}
              onPress={handleSubmit}
              disabled={isSubmitDisabled()}
              fullWidth
            />
          </View>
      </View>

      <GreyOverlayBackground 
        visible={
          isHelpModalOpen ||
          isAIHelpModalOpen ||
          isRecentFormModalOpen ||
          isErrorModalOpen ||
          isSuccessModalOpen ||
          isBackConfirmationModalOpen ||
          isNetworkErrorModalOpen ||
          isServerErrorModalOpen
        }
        opacity={
          isRecentFormModalOpen ? overlayOpacity :
          isHelpModalOpen ? overlayOpacity :
          isErrorModalOpen ? overlayOpacity :
          isSuccessModalOpen ? overlayOpacity :
          isBackConfirmationModalOpen ? overlayOpacity :
          isServerErrorModalOpen ? serverErrorModalOpacity :
          isNetworkErrorModalOpen ? networkErrorModalOpacity :
          aiHelpOverlayOpacity
        }
        onPress={
          isRecentFormModalOpen ? handleDismissRecentForm :
          isHelpModalOpen ? handleDismissHelp :
          isErrorModalOpen ? handleDismissErrorModal :
          isSuccessModalOpen ? handleDismissSuccessModal :
          isBackConfirmationModalOpen ? handleDismissBackConfirmation :
          isServerErrorModalOpen ? handleDismissServerErrorModal :
          isNetworkErrorModalOpen ? handleDismissNetworkErrorModal :
          handleDismissAIHelp
        }
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={strings[language].fileUploadPage.helpModal}
        buttons='none'
        textStyle={{
          highlightWord: "our website",
          highlightColor: "#44B88A"
        }}
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isAIHelpModalOpen}
        opacity={aiHelpModalOpacity}
        text={strings[language].fileUploadPage.aiHelpModal}
        buttons='none'
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={strings[language].fileUploadPage.useRecent}
        buttons='double'
        onConfirm={handleLoadMostRecentForm}
        onCancel={handleDismissRecentForm}
      />
      <GenericModal
        visible={isErrorModalOpen}
        opacity={errorModalOpacity}
        text={errorMessage}
        buttons="none"
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isSuccessModalOpen}
        opacity={successModalOpacity}
        text={strings[language].fileUploadPage.greatSubmit}
        buttons="double"
        onCancel={handleDismissSuccessModal}
        onConfirm={handleSuccessConfirm}
      />
      <GenericModal
        visible={isBackConfirmationModalOpen}
        opacity={backConfirmationModalOpacity}
        text={strings[language].fileUploadPage.leaveConfirm}
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
        visible={isServerErrorModalOpen}
        opacity={serverErrorModalOpacity}
        text={serverErrorMessage || strings[language].fileUploadPage.errorMessages.default}
        buttons="single"
        onConfirm={handleDismissServerErrorModal}
        Icon={DeleteModalIcon}
      />
      <GenericModal
        visible={isNetworkErrorModalOpen}
        opacity={networkErrorModalOpacity}
        text={strings[language].fileUploadPage.errorMessages.network}
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
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    justifyContent: 'center',
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
  fileUploadContent: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: '5%',
    justifyContent: 'center',
  },
  fileUploadScrollView: {
    flex: 1,
  },
  fileUploadScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  fileUploadBottomSpacing: {
    height: 100,
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
  bottomSpacingFilUpload: {
    height: 0,
  },
  fileUploadTitle: {
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    // marginTop: '5%',
  },
  fileUploadMainSection: {
    height: Dimensions.get('window').height * 0.5,
    width: '95%',
    alignSelf: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadContent: {
    height: '90%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  supportedFilesText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    paddingBottom: 10,
  },
  aiGenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: Platform.OS === 'ios' ? 20 : 5,
    gap: 5,
  },
  aiGenerateText: {
    flex: 1,
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
  },
  cornerIconsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successAnimation: {
    width: 100,
    height: 100,
  },
  loadingBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 16,
    backgroundColor: '#D5D4DD',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  percentText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
}); 