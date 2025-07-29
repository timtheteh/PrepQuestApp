import React, { ReactNode, useContext, useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, ViewProps , Animated } from 'react-native';
import { MenuContext } from '@/contexts/MenuContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface FloatingActionButtonProps extends ViewProps {
  onPress?: () => void;
  children: ReactNode;
  disableOverlay?: boolean;
  backgroundColor?: string;
}

export const FloatingActionButton = React.memo(({ 
  style, 
  onPress,
  children,
  disableOverlay = false,
  backgroundColor,
  ...props 
}: FloatingActionButtonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  
  const { 
    setIsMenuOpen, 
    setIsAddDeckOpen, 
    menuOverlayOpacity, 
    addDeckOpacity 
  } = useContext(MenuContext);

  const handlePress = useCallback(() => {
    if (disableOverlay) {
      if (onPress) {
        onPress();
      }
      return;
    }

    if (onPress) {
      onPress();
    }

    setIsMenuOpen(true);
    setIsAddDeckOpen(true);

    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(addDeckOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [disableOverlay, onPress, setIsMenuOpen, setIsAddDeckOpen, menuOverlayOpacity, addDeckOpacity]);

  // Memoize style object to prevent recreation
  const buttonStyle = useMemo(() => [
    styles.button, 
    { backgroundColor: backgroundColor || colors.brandColor2 }, 
    style
  ], [styles.button, backgroundColor, colors.brandColor2, style]);

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
});

const createStyles = (colors: any) => StyleSheet.create({
  button: {
    width: 67,
    height: 67,
    borderRadius: 67 / 2,
    backgroundColor: colors.brandColor2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8, // for Android shadow
  },
}); 