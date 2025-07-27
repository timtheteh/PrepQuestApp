import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { setupDatabase } from '@/db/index';
import SplashScreen from './splash';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HybridAuthProvider, useHybridAuth } from '@/contexts/HybridAuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function AppContent() {
  const { isAuthenticated, user, isLoading } = useHybridAuth();
  const { theme } = useTheme();
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Function to handle authentication completion
  const handleAuthComplete = () => {
    // Start fade out animation to transition to main app
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800, // 800ms fade out
      useNativeDriver: true,
    }).start(() => {
      setShowSplash(false);
    });
  };

  // Show splash screen when user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowSplash(true);
      fadeAnim.setValue(1);
    } else if (!isLoading && isAuthenticated) {
      // Store user ID in AsyncStorage for database compatibility
      if (user?.id) {
        AsyncStorage.setItem('userID', user.id);
      }
      setShowSplash(false);
    }
  }, [isAuthenticated, isLoading, fadeAnim, user]);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Italic': require('../assets/fonts/Satoshi-Italic.otf'),
    'Satoshi-MediumItalic': require('../assets/fonts/Satoshi-MediumItalic.otf'),
    'CedarvilleCursive-Regular': require('../assets/fonts/CedarvilleCursive-Regular.ttf'),
    'Neuton-Regular': require('../assets/fonts/Neuton-Regular.ttf'),
    'Neuton-Bold': require('../assets/fonts/Neuton-Bold.ttf'),
    'Neuton-ExtraBold': require('../assets/fonts/Neuton-ExtraBold.ttf'),
    'Neuton-ExtraLight': require('../assets/fonts/Neuton-ExtraLight.ttf'),
    'Neuton-Light': require('../assets/fonts/Neuton-Light.ttf'),
    'Satoshi-Variable': require('../assets/fonts/Satoshi-Variable.ttf'),
  });

  // Initialize database when app starts
  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('🚀 Starting database initialization...');
        setIsInitializing(true);
        
        const startTime = Date.now();
        await setupDatabase();
        const endTime = Date.now();
        
        console.log(`✅ Database initialization completed successfully in ${endTime - startTime}ms`);
        
        // Ensure minimum 3 seconds of splash screen
        const elapsedTime = endTime - startTime;
        const remainingTime = Math.max(0, 5000 - elapsedTime);
        
        setTimeout(() => {
          setIsDatabaseReady(true);
        }, remainingTime);
        
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        setTimeout(() => {
          setIsDatabaseReady(true);
        }, 3000);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initDatabase();
  }, [fadeAnim]);

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Show splash screen while fonts are loading, database is initializing, or user is not authenticated */}
      {(!loaded || showSplash) ? (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <SplashScreen 
              isDatabaseReady={isDatabaseReady} 
              onAuthComplete={handleAuthComplete}
            />
          </Animated.View>
      ) : (
        <>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen 
              name="genAIForm" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="fileUploadPage" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="youtubeLink" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="manualAddDeck" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="deckSettings" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="appSettings" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="textInputModal" 
              options={{
                presentation: 'transparentModal',
                animation: 'fade_from_bottom',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="flashcardView" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false
              }} 
            />
            <Stack.Screen 
              name="viewQuizStats" 
              options={{
                presentation: 'modal',
                animation: 'slide_from_right',
                headerShown: false,
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </>
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required');
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <LanguageProvider>
        <HybridAuthProvider>
          <CustomThemeProvider>
            <AppContent />
          </CustomThemeProvider>
        </HybridAuthProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}
