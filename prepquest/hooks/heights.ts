import { Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback } from "react";

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