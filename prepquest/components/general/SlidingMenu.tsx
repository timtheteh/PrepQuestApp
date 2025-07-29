import React, { useCallback, useMemo, memo } from 'react';
import { StyleSheet, Animated, View, Platform, Dimensions, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface SlidingMenuProps {
  visible: boolean;
  translateX: Animated.Value;
  onFolderPress?: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const SlidingMenu = memo(({ 
  visible,
  translateX,
  onFolderPress
}: SlidingMenuProps) => {
  const router = useRouter();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  if (!visible) return null;

  // Memoize event handlers to prevent unnecessary re-renders
  const handleFolderPress = useCallback(() => {
    if (onFolderPress) {
      onFolderPress();
    }
    // Small delay to allow the navbar animation to start
    setTimeout(() => {
      router.push('/folders' as any);
    }, 50);
  }, [onFolderPress, router]);

  const handleFavoritesPress = useCallback(() => {
    if (onFolderPress) {
      onFolderPress();
    }
    // Small delay to allow the navbar animation to start
    setTimeout(() => {
      router.push('/favorites' as any);
    }, 50);
  }, [onFolderPress, router]);

  // Memoize styles to prevent recreation on every render
  const menuStyle = useMemo(() => [
    styles.menu,
    {
      transform: [{ translateX }],
      top: Platform.OS === 'ios' ? insets.top : insets.top,
      backgroundColor: colors.brandColor2,
    }
  ], [translateX, insets.top, colors.brandColor2]);

  const menuTextStyle = useMemo(() => [
    styles.menuText, 
    { color: colors.background }
  ], [colors.background]);

  return (
    <Animated.View style={menuStyle}>
      <View style={styles.menuContent}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleFolderPress}
        >
          <FontAwesome name="folder" size={30} color={colors.background} />
          <Text style={menuTextStyle}>{strings[language].viewFolders}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.menuItem, styles.secondItem]}
          onPress={handleFavoritesPress}
        >
          <FontAwesome name="star" size={30} color={colors.background} />
          <Text style={menuTextStyle}>{strings[language].viewFavorites}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

SlidingMenu.displayName = 'SlidingMenu';

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    left: 0,
    width: 171,
    height: 152,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1001, // Higher than the grey overlay
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    left: 15
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondItem: {
    marginTop: 33,
  },
  menuText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
  },
}); 