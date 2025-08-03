import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { backgroundTaskProgress, forceStopBackgroundTask } = useBackgroundTask();
  const [currentStatusRows, setCurrentStatusRows] = useState<{ done: boolean, label: string }[]>([]);
  const [currentIsInViewFlashcardsPage, setCurrentIsInViewFlashcardsPage] = useState(false);
  const [deckName, setDeckName] = useState<string>('');
  const cancelCreationRef = useRef(false);

  // Helper to clear GenAI deck creation progress
  const clearGenAIDeckCreationProgress = async () => {
    try { 
      await AsyncStorage.removeItem('genAIDeckCreationBgTaskProgress'); 
    } catch (e) {
      console.error('Failed to clear GenAI deck creation progress', e);
    }
  };

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
    if (backgroundTaskProgress) {
      console.log('DeckCreationStatusPage - Background task progress update:', backgroundTaskProgress.status);
      console.log('DeckCreationStatusPage - Full background task progress:', backgroundTaskProgress);
      const newStatusRows = [
        { 
          done: backgroundTaskProgress.status === 'requestReceived' || backgroundTaskProgress.status === 'flashcardsGenerated' || backgroundTaskProgress.status === 'deckAndFlashcardsCreated', 
          label: backgroundTaskProgress.status === 'requestReceived' ? 'Request received' : backgroundTaskProgress.status === 'flashcardsGenerated' ? 'Generating flashcards' : 'Adding flashcards and deck' 
        },
        { 
          done: backgroundTaskProgress.status === 'flashcardsGenerated' || backgroundTaskProgress.status === 'deckAndFlashcardsCreated', 
          label: backgroundTaskProgress.status === 'flashcardsGenerated' ? 'Successfully generated flashcards' : 'Generating flashcards' 
        },
        { 
          done: backgroundTaskProgress.status === 'deckAndFlashcardsCreated', 
          label: backgroundTaskProgress.status === 'deckAndFlashcardsCreated' ? 'Successfully added flashcards and deck' : 'Saving to database' 
        }
      ];
      console.log('DeckCreationStatusPage - Setting new status rows:', newStatusRows);
      setCurrentStatusRows(newStatusRows);
      setCurrentIsInViewFlashcardsPage(backgroundTaskProgress.isInViewFlashcardsPage || false);
      
      // If task is completed, navigate back after a delay
      if (backgroundTaskProgress.completed && !backgroundTaskProgress.error && !backgroundTaskProgress.cancelled && !cancelCreationRef.current) {
        setTimeout(() => {
          router.back();
        }, 2000); // Wait 2 seconds to show completion
      }
    }
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
      
      // Immediately stop the background task to hide loading animation
      forceStopBackgroundTask();
      
      // Stop background service and clear progress immediately
      try {
        await BackgroundService.stop();
        await clearGenAIDeckCreationProgress();
      } catch (error) {
        console.error('Error stopping background service:', error);
      }
      
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
    <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
      {/* Top row with Minimize and Cancel buttons */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, paddingHorizontal: 16 }}>
        {/* Minimize button at top left */}
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={handleMinimize}
        >
          <Text style={{ fontSize: 20, color: '#44B88A', fontFamily: 'Satoshi-Medium' }}>{strings[language].minimize}</Text>
        </TouchableOpacity>
        {/* Cancel button at top right */}
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={handleCancel}
        >
          <Text style={{ fontSize: 20, color: '#D7191C', fontFamily: 'Satoshi-Medium' }}>{strings[language].cancel}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: '100%', alignItems: 'center', marginTop: 20}}>
        {/* Deck name title above the animation */}
        {deckName && (
          <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center', marginBottom: 16 }}>
            <Text style={styles.deckNameTitle}>
              {deckName}
            </Text>
          </View>
        )}
        {/* Stacked image + Lottie animation */}
        <View style={{ aspectRatio: 1.2, width: '100%', marginBottom: 0, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <Image
            source={require('@/assets/images/loadingBackground.png')}
            style={{ width: '100%', height: '100%', borderRadius: 24, transform: [{ rotate: '90deg' }] }}
            resizeMode="contain"
            fadeDuration={0}
          />
          <LottieView
            source={require('@/assets/animations/LoadingAnimation1.json')}
            autoPlay
            loop
            style={{ position: 'absolute', width: '70%', height: '70%', top: '15%', left: '15%' }}
            cacheComposition={true}
          />
        </View>
        <View style={{ width: '100%', paddingHorizontal: 16, alignItems: 'center', marginTop: 8,}}>
          <Text style={styles.title}>
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
                <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 18, color: '#000'}}>{row.label}</Text>
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
    fontFamily: 'Satoshi-Medium',
    fontSize: 24,
    color: '#000',
    textAlign: 'center',
    lineHeight: 32,
  },
  deckNameTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 28,
    color: '#000',
    textAlign: 'center',
    lineHeight: 36,
  },
}); 