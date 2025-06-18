import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
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
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
