import { Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback } from "react";

// Utility to detect if Android device has system navigation bar
const hasAndroidSystemNavBar = (bottomInset: number) => {
  return Platform.OS === 'android' && bottomInset > 0;
};

export const useTopBarTopHeight = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Dimensions.get('window').height < 670) {
      return 10;
    } 
    if (Platform.OS === 'ios') {
      return 3;
    }
    return insets.top + 3;
  }, [insets.top]);
}

export const useHeaderIconsTopHeight = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Dimensions.get('window').height < 670) {
      return 10;
    } 
    if (Platform.OS === 'ios') {
      return 0;
    }
    return insets.top;
  }, [insets.top]);
}

export const useContentTopHeight = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Dimensions.get('window').height < 670) {
      return 70;
    }
    if (Platform.OS === 'ios') {
      return 60;
    }
    return insets.top + 60;
  }, [insets.top]);
}

export const useContentTopHeightNoRoundedToggle = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Dimensions.get('window').height < 670) {
      return 40;
    }
    if (Platform.OS === 'ios') {
      return 40;
    }
    return insets.top + 40;
  }, [insets.top]);
}

export const useContentTopHeightNoRoundedToggle2 = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Dimensions.get('window').height < 670) {
      return 50;
    }
    if (Platform.OS === 'ios') {
      return 50;
    }
    return insets.top + 50;
  }, [insets.top]);
}

export const useTopBarAccountHeight = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Dimensions.get('window').height < 670) {
      return insets.top + 10;
    }
    return insets.top;
  }, [insets.top]);
}

export const useTopBarStatisticsHeight = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    return insets.top + 15;
  }, [insets.top]);
}

// Hook to get bottom safe area height for Android devices with system navigation
export const useBottomSafeAreaHeight = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Platform.OS === 'android' && insets.bottom > 0) {
      // For Android devices with just the home indicator line (small inset)
      if (insets.bottom <= 30) {
        return 0; // Don't adjust NavBar height for small insets
      }
      // For Android devices with full navigation bars (large inset)
      else {
        return insets.bottom - 10; // Adjust NavBar height for large insets
      }
    }
    return 0; // No adjustment for iOS and Android without bottom insets
  }, [insets.bottom]);
}

// Hook to get adjusted bottom spacing for scrollable content
export const useBottomContentSpacing = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    if (Platform.OS === 'android' && insets.bottom > 0) {
      // For Android devices with just the home indicator line (small inset)
      if (insets.bottom <= 30) {
        return insets.bottom + 20; // Small inset + base spacing
      }
      // For Android devices with full navigation bars (large inset)
      else {
        return 40; // Just use base spacing since NavBar already handles the inset
      }
    }
    return 40; // Default bottom spacing for iOS and Android without bottom insets
  }, [insets.bottom]);
}

// Hook to check if device has Android system navigation bar
export const useHasAndroidSystemNavBar = () => {
  const insets = useSafeAreaInsets();
  
  return useCallback(() => {
    return hasAndroidSystemNavBar(insets.bottom);
  }, [insets.bottom]);
}