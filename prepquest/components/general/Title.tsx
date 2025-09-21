import { StyleSheet, Text, TextProps, Platform, Animated } from 'react-native';
import { useFonts } from 'expo-font';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface TitleProps extends Omit<TextProps, 'style'> {
  children: string;
  style?: any;
  animatedOpacity?: Animated.AnimatedInterpolation<number> | Animated.Value;
}

export function Title({ style, children, animatedOpacity, ...props }: TitleProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  
  const [fontsLoaded] = useFonts({
    'Neuton-Regular': require('@/assets/fonts/Neuton-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  if (animatedOpacity) {
    return (
      <Animated.Text style={[styles.title, style, { opacity: animatedOpacity }]} {...props}>
        {children}
      </Animated.Text>
    );
  }

  return (
    <Animated.Text style={[styles.title, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    lineHeight: Platform.OS === 'android' ? 32 : 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: colors.text,
  },
}); 