import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setupDatabase } from '@/db/index';
import SplashScreen from './splash';
import SplashOnboarding from './splashOnboarding';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HybridAuthProvider, useHybridAuth } from '@/contexts/HybridAuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { BackgroundTaskProvider } from '@/contexts/BackgroundTaskContext';
import { BackupBackgroundTaskProvider } from '@/contexts/BackupBackgroundTaskContext';
import { ImportBackgroundTaskProvider } from '@/contexts/ImportBackgroundTaskContext';
import { ClearDataBackgroundTaskProvider } from '@/contexts/ClearDataBackgroundTaskContext';
import { DeleteAccountBackgroundTaskProvider } from '@/contexts/DeleteAccountBackgroundTaskContext';
import { StreakBadgeNotificationProvider, useStreakBadgeNotification } from '@/contexts/StreakBadgeNotificationContext';
import { BackgroundTaskNotification } from '@/components/inAppNotifications/BackgroundTaskNotification';
import { StreakBadgeNotification } from '@/components/inAppNotifications/StreakBadgeNotification';

import { ImportTaskNotification } from '@/components/inAppNotifications/ImportTaskNotification';
import NotificationService from '@/utils/notifications';
import * as Notifications from 'expo-notifications';

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

// Function to stop all background tasks on app startup
const stopAllBackgroundTasks = async () => {
  try {
    console.log('🛑 Stopping all background tasks on app startup...');
    
    // Stop any running background service
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
      console.log('✅ Background service stopped');
    }
    
    // Clear all background task progress data
    const progressKeys = [
      'genAIDeckCreationBgTaskProgress',
      'backupDataBgTaskProgress',
      'importDataBgTaskProgress',
      'clearDataBgTaskProgress',
      'deleteAccountBgTaskProgress'
    ];
    
    for (const key of progressKeys) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Cleared progress data for ${key}`);
      } catch (error) {
        console.log(`⚠️ Failed to clear progress data for ${key}:`, error);
      }
    }
    
    console.log('✅ All background tasks stopped and progress cleared');
  } catch (error) {
    console.error('❌ Error stopping background tasks:', error);
  }
};

// Component to render streak badge notification at app root level
function StreakBadgeNotificationWrapper() {
  const { streakBadgeAward, showStreakBadgeNotification, dismissNotification } = useStreakBadgeNotification();
  
  if (!streakBadgeAward) {
    return null;
  }

  return (
    <StreakBadgeNotification
      badgeName={streakBadgeAward.badgeName}
      badgeSubtext={streakBadgeAward.badgeSubtext}
      dayStreakRequirement={streakBadgeAward.dayStreakRequirement}
      visible={showStreakBadgeNotification}
      onDismiss={dismissNotification}
    />
  );
}

function AppContent() {
  const { isAuthenticated, user, isLoading } = useHybridAuth();
  const { theme } = useTheme();
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [splashStartTime] = useState(Date.now());
  const [hideLoadingOverlayCallback, setHideLoadingOverlayCallback] = useState<(() => void) | null>(null);

  // Function to handle authentication completion
  const handleAuthComplete = async () => {
    console.log(`🕐 Auth complete - transitioning to main app`);
    
    // If coming from onboarding, database initialization is handled in splashOnboarding.tsx
    if (showOnboarding) {
      console.log(`🕐 Auth complete during onboarding - database initialization handled in splashOnboarding`);
      
      // Set firstTimeInstalled to false so onboarding doesn't show again
      await AsyncStorage.setItem('firstTimeInstalled', 'false');
      
      // Mark database as ready since it was initialized in splashOnboarding.tsx
      setIsDatabaseReady(true);
      setIsInitializing(false);
      
      // Hide onboarding and go directly to main app
      setShowOnboarding(false);
      setShowSplash(false);
    } else {
      // Immediately hide splash screen without fade animation to prevent blank white screen
      setShowSplash(false);
    }
  };

  // Function to handle onboarding completion (skip button clicked)
  const handleOnboardingComplete = async () => {
    console.log(`🕐 Skip button clicked - starting database initialization`);
    
    // Set firstTimeInstalled to false so onboarding doesn't show again
    await AsyncStorage.setItem('firstTimeInstalled', 'false');
    
    // Hide onboarding and show regular splash
    setShowOnboarding(false);
    setShowSplash(true);
    
    // Start database initialization
    const initDatabase = async () => {
      try {
        console.log('🚀 Starting database initialization and dummy data population...');
        setIsInitializing(true);
        
        // Stop all background tasks first
        await stopAllBackgroundTasks();
        
        const startTime = Date.now();
        await setupDatabase(); // This now includes both schema and dummy data
        const endTime = Date.now();
        
        console.log(`✅ Database initialization and dummy data population completed successfully in ${endTime - startTime}ms`);
        
        // Initialize notifications
        console.log('🔔 Initializing notifications...');
        await NotificationService.getInstance().initialize();
        console.log('✅ Notifications initialized successfully');
        
        // Set up notification response handler
        const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data as any;
          console.log('Notification tapped:', data);
          
          // Handle navigation based on notification type
          if (data?.type === 'deck_created' || data?.type === 'deck_and_flashcards_created') {
            // Navigate to deck details or main page
            // You can add navigation logic here when needed
          } else if (data?.type === 'backup_completed') {
            // Navigate to app settings page for backup completion
            // The success modal will be shown automatically by the context
            // You can add navigation logic here when needed
          }
        });
        
        // Ensure minimum 3 seconds of splash screen
        const elapsedTime = endTime - startTime;
        const remainingTime = Math.max(0, 3000 - elapsedTime);
        
        console.log(`🕐 Database init + dummy data: elapsed: ${elapsedTime}ms, remaining: ${remainingTime}ms`);
        
        setTimeout(() => {
          setIsDatabaseReady(true);
        }, remainingTime);
        
      } catch (error) {
        console.error('❌ Failed to initialize database or populate dummy data:', error);
        // Ensure minimum 3 seconds even on error
        const elapsedTime = Date.now() - splashStartTime;
        const remainingTime = Math.max(0, 3000 - elapsedTime);
        
        console.log(`🕐 Database error: elapsed: ${elapsedTime}ms, remaining: ${remainingTime}ms`);
        
        setTimeout(() => {
          setIsDatabaseReady(true);
        }, remainingTime);
      } finally {
        setIsInitializing(false);
      }
    };
    
    // Start database initialization
    initDatabase();
  };

  // Show splash screen when user is not authenticated (only after onboarding is complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !showOnboarding) {
      // Only show splash if we're not in onboarding mode
      setShowSplash(true);
    }
    // For authenticated users, let the splash screen handle the transition via handleAuthComplete
  }, [isAuthenticated, isLoading, showOnboarding]);

  // Handle database ready state when onboarding is complete
  useEffect(() => {
    if (isDatabaseReady && !showOnboarding && !isLoading && !isAuthenticated) {
      // If database is ready and we're not showing onboarding, show the regular splash
      setShowSplash(true);
    }
  }, [isDatabaseReady, showOnboarding, isLoading, isAuthenticated]);
  
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

  // Check for first time installation and initialize database
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if this is the first time the app is being installed
        const firstTimeInstalled = await AsyncStorage.getItem('firstTimeInstalled');
        
        if (firstTimeInstalled === null || firstTimeInstalled === 'true') {
          // First time install - show onboarding
          console.log('✅ First time installation detected - showing onboarding');
          setShowOnboarding(true);
          setShowSplash(false);
        } else {
          // Not first time - show splash and initialize database
          console.log('✅ Not first time - showing splash and initializing database');
          setShowOnboarding(false);
          setShowSplash(true);
          
          // Initialize database immediately for returning users
          const initDatabase = async () => {
            try {
              console.log('🚀 Starting database initialization...');
              setIsInitializing(true);
              
              // Stop all background tasks first
              await stopAllBackgroundTasks();
              
              const startTime = Date.now();
              await setupDatabase();
              const endTime = Date.now();
              
              console.log(`✅ Database initialization completed in ${endTime - startTime}ms`);
              
              // Initialize notifications
              console.log('🔔 Initializing notifications...');
              await NotificationService.getInstance().initialize();
              console.log('✅ Notifications initialized successfully');
              
              setIsDatabaseReady(true);
              setIsInitializing(false);
            } catch (error) {
              console.error('❌ Error during database initialization:', error);
              setIsInitializing(false);
            }
          };
          
          initDatabase();
        }
      } catch (error) {
        console.error('❌ Error checking first time installation flag:', error);
        // On error, default to showing onboarding to be safe
        setShowOnboarding(true);
        setShowSplash(false);
      }
    };
    
    // Initialize app
    initApp();
    
    return () => {
      // Cleanup if needed
    };
  }, [splashStartTime]);

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Show onboarding screen on first install */}
      {showOnboarding ? (
        <SplashOnboarding 
          onComplete={handleOnboardingComplete}
          onAuthComplete={handleAuthComplete}
          onHideLoadingOverlay={setHideLoadingOverlayCallback}
        />
      ) : (
        <>
          {/* Show splash screen while fonts are loading or database is not ready, or while auth splash is active */}
          {(!loaded || !isDatabaseReady || showSplash) ? (
              <SplashScreen 
                isDatabaseReady={isDatabaseReady} 
                onAuthComplete={handleAuthComplete}
              />
          ) : (
        <>
          <Stack
            screenOptions={{
              // Performance optimizations for modal screens
              animationTypeForReplace: 'push',
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
              }} 
            />
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
            <Stack.Screen 
              name="deckCreationStatusPage" 
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_right',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="oauth-native-callback" 
              options={{
                headerShown: false,
                animation: 'none', // No animation for seamless transition
              }} 
            />
          </Stack>
            <BackgroundTaskNotification />
            <ImportTaskNotification />
            <StreakBadgeNotificationWrapper />
            <StatusBar style="auto" />
          </>
        )}
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
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <LanguageProvider>
          <HybridAuthProvider>
            <CustomThemeProvider>
              <BackgroundTaskProvider>
                <BackupBackgroundTaskProvider>
                  <ImportBackgroundTaskProvider>
                    <ClearDataBackgroundTaskProvider>
                      <DeleteAccountBackgroundTaskProvider>
                        <StreakBadgeNotificationProvider>
                          <AppContent />
                        </StreakBadgeNotificationProvider>
                      </DeleteAccountBackgroundTaskProvider>
                    </ClearDataBackgroundTaskProvider>
                  </ImportBackgroundTaskProvider>
                </BackupBackgroundTaskProvider>
              </BackgroundTaskProvider>
            </CustomThemeProvider>
          </HybridAuthProvider>
        </LanguageProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
