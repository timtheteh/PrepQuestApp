import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { setupDatabase } from '@/db/index';
import SplashScreen from './splash';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  
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
    // 'NotoSansSC-Black': require('../assets/fonts/NotoSansSC-Black.ttf'),
    // 'NotoSansSC-Bold': require('../assets/fonts/NotoSansSC-Bold.ttf'),
    // 'NotoSansSC-ExtraBold': require('../assets/fonts/NotoSansSC-ExtraBold.ttf'),
    // 'NotoSansSC-ExtraLight': require('../assets/fonts/NotoSansSC-ExtraLight.ttf'),
    // 'NotoSansSC-Light': require('../assets/fonts/NotoSansSC-Light.ttf'),
    // 'NotoSansSC-Medium': require('../assets/fonts/NotoSansSC-Medium.ttf'),
    // 'NotoSansSC-Regular': require('../assets/fonts/NotoSansSC-Regular.ttf'),
    // 'NotoSansSC-SemiBold': require('../assets/fonts/NotoSansSC-SemiBold.ttf'),
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
        setIsDatabaseReady(true);
        
        // Start fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800, // 800ms fade out
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        // Even if there's an error, we should still show the app
        // The user can retry or the app can handle the error gracefully
        setIsDatabaseReady(true);
        
        // Still fade out even on error
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setShowSplash(false);
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    initDatabase();
  }, [fadeAnim]);

  // Show splash screen while fonts are loading or database is initializing
  if (!loaded || showSplash) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SplashScreen />
      </Animated.View>
    );
  }

  return (
    <LanguageProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
    </ThemeProvider>
    </LanguageProvider>
  );
}
