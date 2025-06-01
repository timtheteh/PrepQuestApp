import { StyleSheet, TouchableOpacity, ViewProps } from 'react-native';
import { ReactNode, useContext } from 'react';
import { MenuContext } from '@/app/(tabs)/_layout';
import { Animated } from 'react-native';

interface FloatingActionButtonProps extends ViewProps {
  onPress?: () => void;
  children: ReactNode;
}

export function FloatingActionButton({ 
  style, 
  onPress,
  children,
  ...props 
}: FloatingActionButtonProps) {
  const { 
    setIsMenuOpen, 
    setIsAddDeckOpen, 
    menuOverlayOpacity, 
    addDeckOpacity 
  } = useContext(MenuContext);

  const handlePress = () => {
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
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 67,
    height: 67,
    borderRadius: 67 / 2,
    backgroundColor: '#4F41D8',
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