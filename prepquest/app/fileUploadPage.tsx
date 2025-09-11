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
import { PrimaryButton } from '@/components/general/PrimaryButton';
import CloudUploadIcon from '@/assets/icons/fileUpload/cloudUploadIcon.svg';
import ImageIconFilled from '@/assets/icons/generalIcons/imageIconFilled.svg';
import CameraIconFilled from '@/assets/icons/generalIcons/cameraIconFilled.svg';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import LottieView from 'lottie-react-native';
import { checkDeckNameExists, saveUserFileUploadFormEntry, getMostRecentFileUploadFormEntry, createDeckWithGenAIFlashcards, createGenAIFlashcardsForDeck, getDeckNameById } from '../db/decks';
import { Toast } from '../components/general/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import * as mammoth from 'mammoth';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
// @ts-ignore
import * as XLSX from 'xlsx'; // Use CommonJS import for React Native compatibility
// @ts-ignore
import * as ImageManipulator from 'expo-image-manipulator';
import { getUserQuestionSettings } from '@/db/users';
import { getDistributionOfFlashcardsForInterviewType, promptAndData, promptAndDataChinese } from '@/constants/promptEngineering';
import DeckCreationStatusPage from './deckCreationStatusPage';
import { useTopBarAccountHeight } from '@/hooks/heights';
import BackgroundService from 'react-native-background-actions';
import { useBackgroundTask } from '@/contexts/BackgroundTaskContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
          await saveDeckCreationProgress({
            taskType: 'fileUpload',
            mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
            formData: { deckName },
            createdDeckId, createdFlashcardIds,
            status: 'networkError', inProgress: false, error: true, networkError: true, 
            errorMessage: 'Network error occurred during task execution', timestamp: Date.now(),
          });
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
          await saveDeckCreationProgress({
            taskType: 'fileUpload',
            mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
            formData: { deckName },
            createdDeckId, createdFlashcardIds,
            status: 'networkError', inProgress: false, error: true, networkError: true, 
            errorMessage: 'Network error occurred during task execution', timestamp: Date.now(),
          });
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

    let prompt = '';
    if (mode === 'interview' && language === 'English') {
      prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`;
    }
    if (mode === 'interview' && language === 'Chinese') {
      prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n`;
    }
    if (mode === 'study' && language === 'English') {
      prompt += `I am studying for ${studyMandatoryQuestion2} and my education level is ${studyMandatoryQuestion1}.\n`;
    }
    if (mode === 'study' && language === 'Chinese') {
      prompt += `我正在准备${studyMandatoryQuestion2}考试，我的教育水平是${studyMandatoryQuestion1}。\n`;
    }
    if (pdfCaptionClaudeCaption && language === 'English') {
      prompt += `Here is additional information and context from a PDF file for my preparation: ${pdfCaptionClaudeCaption}\n`;
    }
    if (pdfCaptionClaudeCaption && language === 'Chinese') {
      prompt += `这里有一些额外的信息和上下文，来自一个PDF文件，用于我的准备：${pdfCaptionClaudeCaption}\n`;
    }
    if (extractedText && extractedText.trim() !== '' && language === 'English') {
      prompt += `Here is additional information and context from a text file for my preparation: ${extractedText}\n`;
    }
    if (extractedText && extractedText.trim() !== '' && language === 'Chinese') {
      prompt += `这里有一些额外的信息和上下文，来自一个文本文件，用于我的准备：${extractedText}\n`;
    }
    if (imageCaptionClaudeCaption && language === 'English') {
      prompt += `Here is additional information and context from some images for my preparation: ${imageCaptionClaudeCaption}\n`;
    }
    if (imageCaptionClaudeCaption && language === 'Chinese') {
      prompt += `这里有一些额外的信息和上下文，来自一些图像，用于我的准备：${imageCaptionClaudeCaption}\n`;
    }

    if (distribution) {
      if (language === 'English') {
        for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
          prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`;
          // @ts-ignore
          prompt += `${promptAndData[flashcardType].prompt}\n`;
        }
      } else {
        for (const [flashcardType, numQuestions] of Object.entries(distribution)) {
          prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`;
          // @ts-ignore
          prompt += `${promptAndDataChinese[flashcardType].prompt}\n`;
        }
      }
    }

    if (language === 'English' && mode === 'interview' && isAIGenerate) {
      prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n';
      prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
    }
    if (language === 'English' && mode === 'interview' && !isAIGenerate) {
      prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\nHowever, it is EXTREMELY CRUCIAL THAT YOU DO NOT DEVIATE from the information and context I have provided from the PDF file, text file or images. STICK ONLY TO CONTENT FROM THE PDF FILE, TEXT FILE OR IMAGES. ';
      prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
    }
    if (language === 'Chinese' && mode === 'interview' && isAIGenerate) {
      prompt += '确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n';
      prompt += '生成一个JSON数组，格式为：[{"flashcardType": <>, "question": <>, "answer": <>}], 其中每个 {"flashcardType": <>, "question": <>, "answer": <>} 代表一个闪卡。';
    }
    if (language === 'English' && mode === 'study' && isAIGenerate) {
      prompt += 'Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n';
      prompt += 'Generate a JSON array of flashcards in this format: [{"flashcardType": <>, "question": <>, "answer": <>}], where each {"flashcardType": <>, "question": <>, "answer": <>} represents a flashcard.';
    }
    if (language === 'Chinese' && mode === 'study' && isAIGenerate) {
      prompt += '确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n';
      prompt += '生成一个JSON数组，格式为：[{"flashcardType": <>, "question": <>, "answer": <>}], 其中每个 {"flashcardType": <>, "question": <>, "answer": <>} 代表一个闪卡。';
    }

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
      if (resp.ok) {
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
      }
    } catch (networkError) {
      console.error('Network error during file upload GenAI flashcard generation:', networkError);
      // Save error state
      await saveDeckCreationProgress({
        taskType: 'fileUpload',
        mode, deckId, folderId, isInFavoritesPage, isInIndexPage, isInViewDecksInFolderPage, isInViewFlashcardsPage,
        formData: { deckName },
        createdDeckId, createdFlashcardIds,
        status: 'networkError', inProgress: false, error: true, networkError: true, 
        errorMessage: 'Network error occurred during task execution', timestamp: Date.now(),
      });
      stopKeepAlive();
      throw new Error('NETWORK_ERROR');
    }

    if (!flashcards || flashcards.length === 0) {
      stopKeepAlive();
      // Mark as completed without results to allow UI to close gracefully
      await saveDeckCreationProgress({
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
    
    if (isNetworkError) {
      console.log('🚨 NETWORK ERROR detected in main catch block, saving progress');
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
        status: 'error',
        inProgress: false, 
        error: true, 
        networkError: false,
        errorMessage: error.message,
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
  return (
    <View style={styles.fileUploadMainSection}>
      {/* Loading Bar */}
      {isLoading && (
        <View style={styles.loadingBarContainer}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${uploadProgress}%`,
                  backgroundColor: uploadProgress === 100 ? '#44B88A' : '#4F41D8',
                }
              ]} 
            />
          </View>
          <Text style={styles.percentText}>{uploadProgress}%</Text>
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
          <CloudUploadIcon width={110} height={110} />
        )}
        <Text style={[styles.supportedFilesText, { fontSize: 20 }]}>
          {isUploadSuccess 
            ? `${uploadType === 'image' ? (language === 'Chinese' ? '图片' : 'Image') : (language === 'Chinese' ? '文件' : 'File')} ${language === 'Chinese' ? '上传成功！' : 'uploaded successfully!'}\n${uploadType === 'file' ? (language === 'Chinese' ? `文件：${uploadedFileName}` : `File: ${uploadedFileName}`) : ''}`
            : language === 'Chinese' ? '支持的文件格式：.docx, .txt, .pptx,\n.xlsx, .pdf, images' : 'Supported file formats: .docx, .txt,\n.pptx, .xlsx, .pdf, images'
          }
        </Text>
        <PrimaryButton 
          text={STRINGS.browseFiles[language]}
          onPress={browseFiles}
        />
      </View>
      <View style={styles.cornerIconsContainer}>
        <TouchableOpacity onPress={pickImage}>
          <ImageIconFilled width={30} height={30} />
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto}>
          <CameraIconFilled width={40} height={40} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Add language mappings for all user-facing strings
const STRINGS = {
  mandatory: { English: 'Mandatory', Chinese: '必填' },
  fileUpload: { English: 'File Upload', Chinese: '文件上传' },
  deckName: { English: ' Deck Name', Chinese: '卡组名称' },
  study: { English: 'Study', Chinese: '学习' },
  interview: { English: 'Interview', Chinese: '面试' },
  typeHere: { English: 'Type here!', Chinese: '请在此输入！' },
  educationLevel: { English: '1. Education Level?', Chinese: '1. 教育程度？' },
  educationLevelPH: { English: 'e.g. Freshman, Sophomore, etc', Chinese: '例如：大一，大二等' },
  educationLevelHelper: { English: 'What education level is your preparation for?', Chinese: '你正在为哪个教育阶段做准备？' },
  subjects: { English: '2. Subject(s)?', Chinese: '2. 科目？' },
  subjectsPH: { English: 'e.g. Computer Science, Math, Physics, etc.', Chinese: '例如：计算机，数学，物理等' },
  subjectsHelper: { English: 'What subject(s) would this deck be for? Provide your answer in a comma separated list, e.g Inorganic Chemistry, Organic Chemistry, etc.', Chinese: '这个卡组是针对哪些科目？请用逗号分隔，例如：无机化学，有机化学等。' },
  jobRole: { English: '1. Job/Role?', Chinese: '1. 职位/角色？' },
  jobRolePH: { English: 'e.g. Frontend Developer, Private Equity Analyst, etc', Chinese: '例如：前端开发，私募分析师等' },
  jobRoleHelper: { English: 'What job or role are you preparing for?', Chinese: '你正在准备什么职位或角色？' },
  numQuestions: { English: '3. Number of questions:', Chinese: '3. 题目数量：' },
  uploadTitle: { English: 'Upload any file document to generate a new deck!', Chinese: '上传任意文件以生成新卡组！' },
  browseFiles: { English: 'Browse\nFiles', Chinese: '浏览\n文件' },
  supportedFiles: { English: 'Word documents, Text documents, Powerpoint files, Excel sheets, Pdf files, Anki Decks', Chinese: 'Word文档，文本文件，PPT，Excel表格，PDF文件，Anki卡组' },
  imageUploaded: { English: 'Image uploaded successfully!', Chinese: '图片上传成功！' },
  fileUploaded: { English: 'File uploaded successfully!', Chinese: '文件上传成功！' },
  fileLabel: { English: 'File:', Chinese: '文件：' },
  aiGenerate: { English: 'AI Generate new card content?', Chinese: 'AI生成新卡片内容？' },
  submit: { English: 'Submit', Chinese: '提交' },
  deckNameInUse: { English: 'Deckname already in use', Chinese: '卡组名称已被使用' },
  invalidSubjects: { English: "Invalid form input for 'Subject(s)'", Chinese: '“科目”输入无效' },
  fillAllAndUpload: { English: 'Fill up all mandatory fields\nand upload your file!', Chinese: '请填写所有必填项并上传文件！' },
  uploadBeforeSubmit: { English: 'Upload your file\nbefore submitting!', Chinese: '请先上传文件再提交！' },
  fillAll: { English: 'Fill up all\nmandatory fields!', Chinese: '请填写所有必填项！' },
  helpModal: { English: "Our team has identified 7 main types of cognitive questions based on Bloom's taxonomy to help with your learning. Visit our website to learn more.", Chinese: '我们的团队基于布鲁姆认知分类法，归纳了7种主要认知题型，帮助你的学习。访问我们的网站了解更多。' },
  aiHelpModal: { English: 'Ticking this option will let AI generate new, suggested cards outside the content of your upload.', Chinese: '勾选此项将让AI生成与上传内容无关的新建议卡片。' },
  useRecent: { English: ['Use most recent', 'form entry?'], Chinese: ['使用最近的', '表单记录？'] },
  greatSubmit: { English: 'Great! 😊 Do you want to go ahead and submit?', Chinese: '太棒了！😊 是否确认提交？' },
  leaveConfirm: { English: ['Are you sure you want', 'to leave? All your', 'progress will be lost'], Chinese: ['确定要离开吗？', '所有进度将丢失'] },
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { language } = useLanguage();
  // Type language as 'English' | 'Chinese' for STRINGS indexing
  const lang: 'English' | 'Chinese' = language === 'Chinese' ? 'Chinese' : 'English';
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
    resetAutomaticallyCancelledFlag 
  } = useBackgroundTask();

  const screenHeight = Dimensions.get('window').height;
  const bottomOffset = Platform.OS === 'ios' ? 
    (screenHeight < 670 ? 10 : (isReady ? insets.bottom : 34)) : 
    30;

  const getTopBarAccountHeight = useTopBarAccountHeight();

    // Error messages for network/API errors
  const ERROR_MESSAGES = {
    network: {
      English: 'Network error!',
      Chinese: '网络错误。请检查您的连接并重试。'
    },
    400: {
      English: 'Something went wrong. Please try again.',
      Chinese: '出现错误，请重试。'
    },
    401: {
      English: "You're not logged in. Please sign in to continue.",
      Chinese: '您尚未登录。请先登录。'
    },
    403: {
      English: "You don't have permission to perform this action.",
      Chinese: '您没有权限执行此操作。'
    },
    404: {
      English: 'The requested resource was not found.',
      Chinese: '未找到请求的资源。'
    },
    500: {
      English: 'Server error. Please try again later.',
      Chinese: '服务器错误，请稍后再试。'
    },
    502: {
      English: 'Service temporarily unavailable. Please try again shortly.',
      Chinese: '服务暂时不可用，请稍后再试。'
    },
    503: {
      English: 'Service temporarily unavailable. Please try again shortly.',
      Chinese: '服务暂时不可用，请稍后再试。'
    },
    default: {
      English: 'Something went wrong. Please try again.',
      Chinese: '出现错误，请重试。'
    }
  };

  const callGenAIFlashcardsGeneration = async (
    pdfCaption?: string | null,
    extractedText?: string | null,
    imageCaption?: string | null,
  ) => {
    try {
      const { isMcqEnabled, isClozeEnabled, isVoiceRecordedEnabled } = await getUserQuestionSettings();
      const distributionOfFlashcards = getDistributionOfFlashcardsForInterviewType(
        isMcqEnabled,
        isClozeEnabled,
        isVoiceRecordedEnabled,
        interviewType,
        numberOfQuestions,
      );

      let prompt = ""
      if (mode === 'interview' && language === 'English') {
        prompt += `I am preparing for a ${interviewType} interview for the role of ${interviewMandatoryQuestion1}.\n`
      }
      if (mode === 'interview' && language === 'Chinese') {
        prompt += `我正在准备一个${interviewType}面试，角色是${interviewMandatoryQuestion1}。\n `
      }
      if (mode === 'study' && language === 'English') {
        prompt += `I am studying for ${studyMandatoryQuestion2} and my education level is ${studyMandatoryQuestion1}.\n`
      }
      if (mode === 'study' && language === 'Chinese') { 
        prompt += `我正在准备${studyMandatoryQuestion2}考试，我的教育水平是${studyMandatoryQuestion1}。\n`
      }

      if (pdfCaption && language === 'English') {
        prompt += `Here is additional information and context from a PDF file for my preparation: ${pdfCaption}\n`
      }
      if (pdfCaption && language === 'Chinese') {
        prompt += `这里有一些额外的信息和上下文，来自一个PDF文件，用于我的准备：${pdfCaption}\n`
      }
      if (extractedText && extractedText.trim() !== '' && language === 'English') {
        prompt += `Here is additional information and context from a text file for my preparation: ${extractedText}\n`
      }
      if (extractedText && extractedText.trim() !== '' && language === 'Chinese') {
        prompt += `这里有一些额外的信息和上下文，来自一个文本文件，用于我的准备：${extractedText}\n`
      }
      if (imageCaption && language === 'English') {
        prompt += `Here is additional information and context from some images for my preparation: ${imageCaption}\n`
      }
      if (imageCaption && language === 'Chinese') {
        prompt += `这里有一些额外的信息和上下文，来自一些图像，用于我的准备：${imageCaption}\n`
      }

      if (distributionOfFlashcards) {   
        if (language === 'English') {
          for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
            prompt += `Generate ${numQuestions} flashcards of type '${flashcardType}'.\n`
            prompt += `${promptAndData[flashcardType as keyof typeof promptAndData].prompt}\n`
          }
        } 
        if (language === 'Chinese') {
          for (const [flashcardType, numQuestions] of Object.entries(distributionOfFlashcards)) {
            prompt += `生成${numQuestions}个'${flashcardType}'类型的闪卡。\n`
            prompt += `${promptAndDataChinese[flashcardType as keyof typeof promptAndDataChinese].prompt}\n`
          }
        }
      }

      if (language === 'English' && mode === 'interview' && isAIGenerate) { 
        prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\n"
        prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
      }
      if (language === 'English' && mode === 'interview' && !isAIGenerate) { 
        prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for my interview and for my job role.\nHowever, it is EXTREMELY CRUCIAL THAT YOU DO NOT DEVIATE from the information and context I have provided from the PDF file, text file or images. STICK ONLY TO CONTENT FROM THE PDF FILE, TEXT FILE OR IMAGES. "
        prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
      }
      if (language === 'Chinese' && mode === 'interview' && isAIGenerate) { 
        prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我的面试和我的工作角色。\n"
        prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
      }
      if (language === 'English' && mode === 'study' && isAIGenerate) { 
        prompt += "Make sure to generate meaningful, thoughtful and probable questions and answers specific for the subjects I am studying and my education level.\n The examples I have given for the questions and answers are JUST EXAMPLES to demonstrate the question styles for the question types, YOU MUST ONLY GENERATE questions and answers that are DIRECTLY RELATED to the subjects I am studying and my education level.\nIt is extremely crucial that you do not deviate away from the subjects taht I am studying\n"
        prompt += "Generate a JSON array of flashcards in this format: [{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], where each {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} represents a flashcard."
      }
      if (language === 'Chinese' && mode === 'study' && isAIGenerate) { 
        prompt += "确保生成有意义、有思考、有概率的问题和答案，针对我正在学习的科目和我的教育水平。\n"
        prompt += "生成一个JSON数组，格式为：[{\"flashcardType\": <>, \"question\": <>, \"answer\": <>}], 其中每个 {\"flashcardType\": <>, \"question\": <>, \"answer\": <>} 代表一个闪卡。"
      }
      console.log("prompt >>>> \n", prompt);
      let response;
      try {
        // Check if we should cancel before making the request
        if (cancelCreationRef.current) {
          console.log('Request cancelled before starting');
          return null;
        }
        
        // Create a new AbortController for this request
        abortControllerRef.current = new AbortController();
        
        response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/genAIFlashcardsGeneration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({prompt}),
          signal: abortControllerRef.current.signal,
        });
      } catch (networkError) {
        // Check if the error is due to cancellation
        if (networkError instanceof Error && networkError.name === 'AbortError') {
          console.log('Request was cancelled');
          return null;
        }
        Alert.alert('Error', ERROR_MESSAGES.network[language] || ERROR_MESSAGES.network.English);
        return null;
      } finally {
        // Clean up the AbortController after the request completes (success or error)
        if (abortControllerRef.current) {
          abortControllerRef.current = null;
        }
      }
      console.log("fetch complete, status:", response.status);
      if (!response.ok) {
        let message = '';
        switch (response.status) {
          case 400:
            message = ERROR_MESSAGES[400][language] || ERROR_MESSAGES[400].English;
            break;
          case 401:
            message = ERROR_MESSAGES[401][language] || ERROR_MESSAGES[401].English;
            break;
          case 403:
            message = ERROR_MESSAGES[403][language] || ERROR_MESSAGES[403].English;
            break;
          case 404:
            message = ERROR_MESSAGES[404][language] || ERROR_MESSAGES[404].English;
            break;
          case 500:
            message = ERROR_MESSAGES[500][language] || ERROR_MESSAGES[500].English;
            break;
          case 502:
            message = ERROR_MESSAGES[502][language] || ERROR_MESSAGES[502].English;
            break;
          case 503:
            message = ERROR_MESSAGES[503][language] || ERROR_MESSAGES[503].English;
            break;
          default:
            message = ERROR_MESSAGES.default[language] || ERROR_MESSAGES.default.English;
        }
        Alert.alert('Error', message);
        return null;
      }
      const data = await response.json();
      console.log("DATA >>>>>>>>>>>>>>>>> ", data);
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
          if (cleanedString.startsWith('{')) {
            // Try to parse as single object first
            try {
              const parsedFlashcards = JSON.parse(cleanedString);
              flashcards = [parsedFlashcards]; // Wrap single object in array
            } catch (parseError) {
              console.error('Failed to parse flashcards string in fileUpload:', parseError);
              throw new Error('Invalid flashcards format from API');
            }
          } else {
            throw new Error('Invalid flashcard format - does not start with object');
          }
        } catch (parseError) {
          console.error('Failed to parse flashcards string in fileUpload:', parseError);
          console.error('Raw flashcards string:', flashcards);
          throw new Error('Invalid flashcards format from API');
        }
      }

      // If it's a single object, wrap in array
      if (flashcards && !Array.isArray(flashcards)) {
        flashcards = [flashcards];
      }

      console.log("FLASHCARDS >>>>>>>>>>>>>>>>> \n", flashcards);
      return flashcards;
    } catch (error: any) {
      Alert.alert('Error', (error.message && typeof error.message === 'string') ? error.message : (ERROR_MESSAGES.default[language] || ERROR_MESSAGES.default.English));
    }
  };

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

  // Handle automatic cancellation after 30 seconds in background
  useEffect(() => {
    // Check both the context flag and the progress data flag
    const wasAutoCancelled = wasAutomaticallyCancelled || (backgroundTaskProgress?.automaticallyCancelled === true);
    
    if (wasAutoCancelled) {
      console.log('File upload deck creation task was automatically cancelled - hiding status page');
      
      // Hide the status page immediately
      setShowStatusPage(false);
      
      // Reset any loading states
      setIsSuccessModalOpen(false);
      setIsFileUploading(false);
      setUploadProgress(0);
      
      // Reset the automatic cancellation flag
      if (wasAutomaticallyCancelled) {
        resetAutomaticallyCancelledFlag();
      }
    }
  }, [wasAutomaticallyCancelled, backgroundTaskProgress?.automaticallyCancelled, resetAutomaticallyCancelledFlag]);

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
                taskTitle: language === 'Chinese' ? '创建卡组' : 'Creating Deck',
                taskDesc: language === 'Chinese' ? '正在后台创建您的卡组' : 'Your deck is being created in the background.',
                taskIcon: { name: 'ic_launcher', type: 'mipmap' },
                color: '#44B88A',
                parameters: progress,
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
        setToastMessage(STRINGS.deckNameInUse[lang]);
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
        setToastMessage(STRINGS.invalidSubjects[lang]);
        return false;
      }
    }

    // Error 1: mandatory fields not filled up and no file/image uploaded
    if (!mandatoryFieldsFilled && !hasFileUploaded) {
      setErrorMessage(STRINGS.fillAllAndUpload[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 2: mandatory fields filled up but file/image not uploaded
    if (mandatoryFieldsFilled && !hasFileUploaded) {
      setErrorMessage(STRINGS.uploadBeforeSubmit[lang]);
      setIsErrorModalOpen(true);
      return false;
    }

    // Error 3: mandatory fields not filled up but got file/image uploaded
    if (!mandatoryFieldsFilled && hasFileUploaded) {
      setErrorMessage(STRINGS.fillAll[lang]);
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
          taskTitle: language === 'Chinese' ? '创建卡组' : 'Creating Deck',
          taskDesc: language === 'Chinese' ? '正在后台创建您的卡组' : 'Your deck is being created in the background.',
          taskIcon: { name: 'ic_launcher', type: 'mipmap' },
          color: '#44B88A',
          parameters: params,
        });
      } catch (error) {
        console.error('Failed to start background task (file upload):', error);
        setShowStatusPage(false);
        Alert.alert('Error', 'Failed to start background task');
        return;
      }

      // Show status page; actual progress will stream from BackgroundTaskContext
      setIsSuccessModalOpen(false);
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
        alert('Sorry, we need camera roll permissions to make this work!');
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
      alert('Error selecting image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
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
      alert('Error taking photo. Please try again.');
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
          setToastMessage(language === 'Chinese' ? '不支持的文件类型' : 'Invalid file type');
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
      alert('Error selecting file. Please try again.');
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
          { done: statusExtractingInformationFromFiles, label: statusExtractingInformationFromFiles ? (language === 'Chinese' ? '成功提取信息' : 'Successfully extracted\ninfo from file') : (language === 'Chinese' ? '正在提取信息' : 'Extracting info\nfrom file') },
          { done: statusGeneratingFlashcards, label: statusGeneratingFlashcards ? (language === 'Chinese' ? '成功生成闪卡' : 'Successfully generated\nflashcards') : (language === 'Chinese' ? '正在生成闪卡' : 'Generating flashcards') },
          { done: statusAddingDeckAndFlashcards, label: statusAddingDeckAndFlashcards
            ? (isInViewFlashcardsPage
                ? (language === 'Chinese' ? '已添加闪卡到卡组' : 'Successfully Added\nflashcards to deck')
                : (language === 'Chinese' ? '成功添加闪卡和卡组' : 'Successfully added\nflashcards and deck'))
            : (isInViewFlashcardsPage
                ? (language === 'Chinese' ? '正在添加闪卡到卡组' : 'Adding flashcards\nto deck')
                : (language === 'Chinese' ? '正在添加闪卡和卡组' : 'Adding flashcards\nand deck')) }        ]}
        isInViewFlashcardsPage={isInViewFlashcardsPage === 'true'}
        onCancel={async () => {
          cancelCreationRef.current = true;
          
          // Abort any ongoing fetch requests
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          
          // Stop background service and clear progress
          try {
            forceStopBackgroundTask();
            await BackgroundService.stop();
            await clearDeckCreationProgress();
          } catch (error) {
            console.error('Error stopping background task (file upload):', error);
          }
          
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
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight()}]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <AntDesign name="arrowleft" size={32} color="black" />
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
            leftLabel={STRINGS.mandatory[lang]}
            rightLabel={STRINGS.fileUpload[lang]}
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
                  title={STRINGS.deckName[lang]}
                  highlightedWord={mode === 'study' ? STRINGS.study[lang] : STRINGS.interview[lang]}
                  placeholder={STRINGS.typeHere[lang]}
                  value={deckName}
                  onChangeText={setDeckName}
                />)
                }
                {isInViewFlashcardsPage === 'true' && (
                  <TitleTextBar
                    title={STRINGS.deckName[lang]}
                    highlightedWord={mode === 'study' ? STRINGS.study[lang] : STRINGS.interview[lang]}
                    placeholder={deckTitle}
                    value={deckTitle}
                    onChangeText={() => {}} // Disabled - no-op function
                    disabled={true}
                  />
                )}
                {mode === 'study' && (
                  <>
                    <QuestionTextBar
                      label={STRINGS.educationLevel[lang]}
                      placeholder={STRINGS.educationLevelPH[lang]}
                      value={studyMandatoryQuestion1}
                      onChangeText={setStudyMandatoryQuestion1}
                      helperText={STRINGS.educationLevelHelper[lang]}
                    />
                    <QuestionTextBar
                      label={STRINGS.subjects[lang]}
                      placeholder={STRINGS.subjectsPH[lang]}
                      value={studyMandatoryQuestion2}
                      onChangeText={setStudyMandatoryQuestion2}
                      helperText={STRINGS.subjectsHelper[lang]}
                    />
                  </>
                )}
                {mode !== 'study' && (
                  <>
                  <QuestionTextBar
                    label={STRINGS.jobRole[lang]}
                    placeholder={STRINGS.jobRolePH[lang]}
                    value={interviewMandatoryQuestion1}
                    onChangeText={setInterviewMandatoryQuestion1}
                    helperText={STRINGS.jobRoleHelper[lang]}
                    />
                  <TypeOfInterviewQn
                    value={interviewType}
                    onValueChange={setInterviewType}
                  />
                  </>
                )}
                <NumberOfQuestions
                  title={STRINGS.numQuestions[lang]}
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
                <Text style={styles.fileUploadTitle}>
                {STRINGS.uploadTitle[lang]}
              </Text>
              <FileUploadMainSection 
                pickImage={pickImage} 
                takePhoto={takePhoto} 
                browseFiles={browseFiles} 
                isUploadSuccess={isUploadSuccess} 
                uploadType={uploadType} 
                uploadedFileName={uploadedFileName} 
                language={lang}
                isLoading={isFileUploading}
                uploadProgress={uploadProgress}
              />
              <View style={styles.aiGenerateRow}>
                <SmallCircleSelectButton
                  selected={isAIGenerate}
                  onPress={() => setIsAIGenerate(!isAIGenerate)}
                    />
                <Text style={styles.aiGenerateText}>{STRINGS.aiGenerate[lang]}</Text>
                <TouchableOpacity onPress={() => setIsAIHelpModalOpen(true)}>
                  <HelpIconOutline width={24} height={24} />
                </TouchableOpacity>
              </View>
              </View>
            </ScrollView>
          </Animated.View>


          <View style={[
            styles.buttonContainer,
            { bottom: bottomOffset }
          ]}>
            <ActionButton
              text={STRINGS.submit[lang]}
              backgroundColor={isSubmitDisabled() ? '#D5D4DD' : '#44B88A'}
              onPress={handleSubmit}
              disabled={isSubmitDisabled()}
              fullWidth
            />
          </View>
      </View>

      <GreyOverlayBackground 
        visible={isHelpModalOpen || isAIHelpModalOpen || isRecentFormModalOpen || isErrorModalOpen || isSuccessModalOpen || isBackConfirmationModalOpen || isNetworkErrorModalOpen}
        opacity={isRecentFormModalOpen ? overlayOpacity : (isHelpModalOpen ? overlayOpacity : (isErrorModalOpen ? overlayOpacity : (isSuccessModalOpen ? overlayOpacity : (isBackConfirmationModalOpen ? overlayOpacity : (isNetworkErrorModalOpen ? overlayOpacity : aiHelpOverlayOpacity)))))}
        onPress={isRecentFormModalOpen ? handleDismissRecentForm : (isHelpModalOpen ? handleDismissHelp : (isErrorModalOpen ? handleDismissErrorModal : (isSuccessModalOpen ? handleDismissSuccessModal : (isBackConfirmationModalOpen ? handleDismissBackConfirmation : (isNetworkErrorModalOpen ? handleDismissNetworkErrorModal : handleDismissAIHelp)))))}
      />
      <GenericModal
        visible={isHelpModalOpen}
        opacity={modalOpacity}
        text={STRINGS.helpModal[lang]}
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
        text={STRINGS.aiHelpModal[lang]}
        buttons='none'
        Icon={HelpIconFilled}
      />
      <GenericModal
        visible={isRecentFormModalOpen}
        opacity={recentFormModalOpacity}
        text={STRINGS.useRecent[lang]}
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
        text={STRINGS.greatSubmit[lang]}
        buttons="double"
        onCancel={handleDismissSuccessModal}
        onConfirm={handleSuccessConfirm}
      />
      <GenericModal
        visible={isBackConfirmationModalOpen}
        opacity={backConfirmationModalOpacity}
        text={STRINGS.leaveConfirm[lang]}
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
        visible={isNetworkErrorModalOpen}
        opacity={networkErrorModalOpacity}
        text={ERROR_MESSAGES.network[language] || ERROR_MESSAGES.network.English}
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    borderColor: '#4F41D8',
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
    color: '#000000',
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
    color: '#000000',
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
    backgroundColor: '#4F41D8',
    borderRadius: 8,
  },
  percentText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 24,
    color: '#4F41D8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
}); 