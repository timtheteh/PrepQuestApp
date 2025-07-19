import { Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const getTopBarTopHeight = () => {
    const insets = useSafeAreaInsets();
    if (Dimensions.get('window').height < 670) {
      return 10;
    } 
    if (Platform.OS === 'ios') {
      return 3;
    }
    return insets.top + 3;
  }

export const getHeaderIconsTopHeight = () => {
    const insets = useSafeAreaInsets();
    if (Dimensions.get('window').height < 670) {
      return 10;
    } 
    if (Platform.OS === 'ios') {
      return 0;
    }
    return insets.top;
  }

export const getContentTopHeight = () => {
    const insets = useSafeAreaInsets();
    if (Dimensions.get('window').height < 670) {
      return 70;
    }
    if (Platform.OS === 'ios') {
      return 60;
    }
    return insets.top + 60;
  }

  export const getContentTopHeightNoRoundedToggle = () => {
    const insets = useSafeAreaInsets();
    if (Dimensions.get('window').height < 670) {
      return 40;
    }
    if (Platform.OS === 'ios') {
      return 40;
    }
    return insets.top + 40;
  }

  export const getContentTopHeightNoRoundedToggle2 = () => {
    const insets = useSafeAreaInsets();
    if (Dimensions.get('window').height < 670) {
      return 50;
    }
    if (Platform.OS === 'ios') {
      return 50;
    }
    return insets.top + 50;
  }

export const getTopBarAccountHeight = () => {
    const insets = useSafeAreaInsets();
    if (Dimensions.get('window').height < 670) {
      return insets.top +10;
    }
    return insets.top;
  }

export const getTopBarStatisticsHeight = () => {
    const insets = useSafeAreaInsets();
    return insets.top + 15;
    }