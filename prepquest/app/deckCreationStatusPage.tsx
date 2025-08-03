import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import DeleteModalIcon from '@/assets/icons/generalIcons/deleteModalIcon.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface DeckCreationStatusPageProps {
  statusRows: { done: boolean, label: string }[];
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

  return (
    <View style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'}}>
      {/* Top row with Minimize and Cancel buttons */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, paddingHorizontal: 16 }}>
        {/* Minimize button at top left */}
        <TouchableOpacity
          style={{ padding: 8 }}
          onPress={onMinimize || (() => {})}
        >
          <Text style={{ fontSize: 20, color: '#44B88A', fontFamily: 'Satoshi-Medium' }}>{strings[language].minimize}</Text>
        </TouchableOpacity>
        {/* Cancel button at top right */}
        {onCancel && (
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={onCancel}
          >
            <Text style={{ fontSize: 20, color: '#D7191C', fontFamily: 'Satoshi-Medium' }}>{strings[language].cancel}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ width: '100%', alignItems: 'center', marginTop: 20}}>
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
            {isInViewFlashcardsPage
              ? strings[language].flashcardViewPage.creatingFlashcards
              : strings[language].flashcardViewPage.creatingDeck}
          </Text>
          <View style={{ width: '80%', marginTop: 8,  marginLeft: 48}}>
            {statusRows.map((row, idx) => (
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
}); 