import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import LottieView from 'lottie-react-native';

/**
 * OAuth Native Callback Route
 * 
 * This route handles OAuth redirects from social login providers on Android.
 * When OAuth completes, Android redirects to prepquest://oauth-native-callback
 * instead of staying on the same screen. This route ensures users see a 
 * loading state and are properly redirected to the main app.
 */
export default function OAuthNativeCallback() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useHybridAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleRedirect = () => {
      if (hasRedirected) return;

      if (isAuthenticated) {
        // User is authenticated, redirect to main app
        setHasRedirected(true);
        router.replace('/(tabs)');
      } else if (!isLoading) {
        // Auth failed or was cancelled, redirect back to splash
        setHasRedirected(true);
        router.replace('/splash');
      } else {
        // Still loading, check again after a short delay
        timeoutId = setTimeout(handleRedirect, 500);
      }
    };

    // Initial check with a small delay to ensure auth state is updated
    timeoutId = setTimeout(handleRedirect, 200);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, isLoading, router, hasRedirected]);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
      padding: 20,
    }}>
      <LottieView
        source={require('@/assets/animations/addDeckLoadingAnimation.json')}
        autoPlay
        loop
        style={{ width: 96, height: 96}}
      />
    </View>
  );
}
