import { StyleSheet, Text, TextProps, Platform } from 'react-native';
import { useFonts } from 'expo-font';

interface TitleProps extends TextProps {
  children: string;
}

export function Title({ style, children, ...props }: TitleProps) {
  const [fontsLoaded] = useFonts({
    'Neuton-Regular': require('@/assets/fonts/Neuton-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    lineHeight: Platform.OS === 'android' ? 32 : 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
}); 