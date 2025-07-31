import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView, Platform, Image, Share, Alert } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import LightSwitchBody from '@/assets/icons/account/lightSwitchBody.svg';
import DarkSwitchBody from '@/assets/icons/account/darkSwitchBody.svg';
import LightSwitch from '@/assets/icons/account/lightSwitch.svg';
import DarkSwitch from '@/assets/icons/account/darkSwitch.svg';
import GrapeStem from '@/assets/icons/account/grapeStem.svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { strings } from '@/constants/strings';
import DeckCreationLoadingPage, { DeckCreationStatusPage } from '../DeckCreationLoadingPage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopBarAccountHeight } from '@/hooks/heights';

export default function AccountScreen() {
  const [upgradePressed, setUpgradePressed] = useState(false);
  const [deckSettingsPressed, setDeckSettingsPressed] = useState(false);
  const [appSettingsPressed, setAppSettingsPressed] = useState(false);
  const [tcPressed, setTCPressed] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const [ratePressed, setRatePressed] = useState(false);
  const [websitePressed, setWebsitePressed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const router = useRouter();
  const { language, reloadLanguage } = useLanguage();
  const { signOut, user } = useHybridAuth();
  const { theme, setThemeMode, isSystemTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const themeColors = Colors[theme];
  const getTopBarAccountHeight = useTopBarAccountHeight();

  // For button animation
  const buttonAnim = useRef(new Animated.Value(theme === 'dark' ? 0 : 1)).current; // 1 = right (light), 0 = left (dark)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);

  useFocusEffect(
    React.useCallback(() => {
      reloadLanguage();
    }, [])
  );

  const handleToggle = () => {
    // Cycle through: system -> light -> dark -> system
    let newThemeMode: ThemeMode;
    if (isSystemTheme) {
      newThemeMode = 'light';
    } else if (theme === 'light') {
      newThemeMode = 'dark';
    } else {
      newThemeMode = 'system';
    }
    
    setThemeMode(newThemeMode);
    
    // Animate to the appropriate position
    const targetValue = newThemeMode === 'system' ? (theme === 'dark' ? 0 : 1) : (newThemeMode === 'dark' ? 0 : 1);
    Animated.timing(buttonAnim, {
      toValue: targetValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Update button animation when theme changes
  useEffect(() => {
    Animated.timing(buttonAnim, {
      toValue: theme === 'dark' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [theme]);

  const handleDeckSettingsPress = () => {
    router.push('/deckSettings');
  };

  const handleAppSettingsPress = () => {
    router.push('/appSettings');
  };

  const handleSignOut = async () => {
    Alert.alert(
      strings[language].signOutConfirmation,
      strings[language].signOutMessage,
      [
        {
          text: strings[language].cancel,
          style: 'cancel',
        },
        {
          text: strings[language].signOut,
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              // Sign out from both Supabase and Clerk
              await signOut();
              // Force a small delay to ensure session is cleared
              setTimeout(() => {
                setIsSigningOut(false);
              }, 500);
            } catch (error) {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // Button position: 0 (left) for dark, 1 (right) for light
  const translateX = buttonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26], // adjust for your SVG size
  });

  // Cross-fade opacities
  const lightBodyOpacity = buttonAnim;
  const darkBodyOpacity = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const lightButtonOpacity = buttonAnim;
  const darkButtonOpacity = buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  // Grape bunch positions as a dictionary
  const grapePositions = {
    stem:      { top: '-6%',  left: '10%' },
    website:   { top: '35%', left: '23%' },
    rate:      { top: '40%', left: '75%' },
    share:     { top: '72%', left: '80%' },
    tc:        { top: '65%', left: '22%' },
    app:       { top: '75%', left: '50%' },
    deck:      { top: '25%', left: '50%' },
    upgrade:   { top: '50%', left: '50%' },
  };

  // --- BEGIN GRAPE BUNCH POSITIONING REFACTOR ---
  // Remove all getXTopPosition/getXLeftPosition functions

  // --- END GRAPE BUNCH POSITIONING REFACTOR ---

  const handleShare = async () => {
    try {
      await Share.share({
        message: strings[language].shareMessage,
      });
    } catch (error) {
      // Optionally handle error
    }
  };

  const stylesConditional = StyleSheet.create({
    grapeBunchFlexWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    } as ViewStyle,
  });

  const grapeBunchWrapperStyle = screenHeight > 670
    ? stylesConditional.grapeBunchFlexWrapper
    : undefined;

  // Theme-dependent styles
  const themeStyles = {
    profileCircle: {
      ...styles.profileCircle,
      borderColor: themeColors.brandColor1,
      backgroundColor: themeColors.background,
    },
  };

  const MainContent = (
    <View style={{ flex: 1, width: '100%' }}> 
      <View style={[styles.mainColumnContainer, { paddingTop: getTopBarAccountHeight()}]}> 
        <View style={styles.topBar}> 
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={[styles.signOutText, { color: themeColors.text }]}>{strings[language].signOut}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.8} style={styles.switchContainer}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: lightBodyOpacity }]}> 
              <LightSwitchBody width={55} height={30} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: darkBodyOpacity }]}> 
              <DarkSwitchBody width={55} height={30} />
            </Animated.View>
            <Animated.View style={[styles.switchButton, { transform: [{ translateX }] }]}> 
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: lightButtonOpacity }]}> 
                <LightSwitch width={28} height={28} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: darkButtonOpacity }]}> 
                <DarkSwitch width={28} height={28} />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.circleContainer}> 
          <View style={themeStyles.profileCircle}>
            <Text style={[styles.profileInitials, { color: themeColors.text }]}>
              {user?.id ? user.id.substring(0, 2).toUpperCase() : 'GU'}
            </Text>
          </View>
        </View>
        <View style={[styles.infoColumn, { marginTop: '10%', marginBottom: '15%' }]}> 
          <View style={styles.infoRow}>
            <Text style={[styles.infoHeading, { color: themeColors.text }]}>{strings[language].username}</Text>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>{strings[language].user}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoHeading, { color: themeColors.text }]}>{strings[language].userId}</Text>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>{user?.id || strings[language].notAvailable}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoHeading, { color: themeColors.text }]}>{strings[language].currentPlan}</Text>
            <Text style={[styles.infoValue, { color: themeColors.text }]}>{strings[language].basicPlan}</Text>
          </View>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.grapeBunchContainer}>
          {/* Stem (behind) */}
          <GrapeStem
            style={[
              styles.grapeCircle,
              styles.stem,
              { ...(grapePositions.stem as any), 
                zIndex: 6 } as any
            ]}
          />
          {/* Website button (behind) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setWebsitePressed(true)}
            onPressOut={() => setWebsitePressed(false)}
            style={[
              styles.grapeCircle,
              { backgroundColor: websitePressed ? '#8684FF' : '#685CDD', 
                position: 'absolute', 
                ...(grapePositions.website as any), 
                zIndex: 7,
                transform: [{ translateX: -70 }, { translateY: -70 }]
              } as any
            ]}
          >
            <Text style={[styles.grapeMenuText, {marginLeft: -48, marginBottom: 15, textAlign: 'center'}]}>{strings[language].website}</Text>
          </TouchableOpacity>
          {/* Rate & Review button (behind) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setRatePressed(true)}
            onPressOut={() => setRatePressed(false)}
            style={[
              styles.grapeCircle,
              { backgroundColor: ratePressed ? '#8684FF' : '#4F41D8', 
                position: 'absolute', 
                ...(grapePositions.rate as any), 
                zIndex: 8,
                transform: [{ translateX: -70 }, { translateY: -70 }]
              } as any
            ]}
          >
            <Text style={[styles.grapeMenuText, {marginLeft: 25, marginBottom: 15, textAlign: 'center'}]}>{strings[language].rateAndReview}</Text>
          </TouchableOpacity>
          {/* Share button (behind) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setSharePressed(true)}
            onPressOut={() => setSharePressed(false)}
            onPress={handleShare}
            style={[
              styles.grapeCircle,
              { backgroundColor: sharePressed ? '#8684FF' : '#685CDD', 
                position: 'absolute', ...(grapePositions.share as any), 
                zIndex: 9, 
                transform: [{ translateX: -70 }, { translateY: -70 }]} as any
            ]}
          >
            <Text style={[styles.grapeMenuText, {marginLeft: 15, marginTop: 5, textAlign: 'center'}]}>{strings[language].share}</Text>
          </TouchableOpacity>
          {/* T&C button (behind) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setTCPressed(true)}
            onPressOut={() => setTCPressed(false)}
            style={[
              styles.grapeCircle,
              { backgroundColor: tcPressed ? '#8684FF' : '#4F41D8', 
                position: 'absolute', ...(grapePositions.tc as any), 
                zIndex: 9, 
                transform: [{ translateX: -70 }, { translateY: -70 }]} as any
            ]}
          >
            <Text style={[styles.grapeMenuText, {marginRight: 22, textAlign: 'center'}]}>{strings[language].termsAndConditions}</Text>
          </TouchableOpacity>
          {/* App Settings button (behind) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setAppSettingsPressed(true)}
            onPressOut={() => setAppSettingsPressed(false)}
            onPress={handleAppSettingsPress}
            style={[
              styles.grapeCircle,
              { backgroundColor: appSettingsPressed ? '#8684FF' : '#3B30A7', 
                position: 'absolute', 
                ...(grapePositions.app as any), 
                zIndex: 8, 
                transform: [{ translateX: -70 }, { translateY: -70 }]
              } as any
            ]}
          >
            <Text style={[styles.grapeMenuText, {marginTop: 50, textAlign: 'center'}]}>{strings[language].appSettings}</Text>
          </TouchableOpacity>
          {/* Deck Settings button (behind) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setDeckSettingsPressed(true)}
            onPressOut={() => setDeckSettingsPressed(false)}
            onPress={handleDeckSettingsPress}
            style={[
              styles.grapeCircle,
              { backgroundColor: deckSettingsPressed ? '#8684FF' : '#3B30A7', 
                position: 'absolute', 
                ...(grapePositions.deck as any), 
                zIndex: 8,
                transform: [{ translateX: -70 }, { translateY: -70 }]
              } as any
            ]}
          >
            <Text style={[styles.grapeMenuText, {marginBottom: 48, textAlign: 'center'}]}>{strings[language].deckSettings}</Text>
          </TouchableOpacity>
          {/* Upgrade button (on top) */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setUpgradePressed(true)}
            onPressOut={() => setUpgradePressed(false)}
            style={[styles.grapeCircle, 
              { backgroundColor: upgradePressed ? '#8684FF' : '#685CDD', 
                position: 'absolute', 
                ...(grapePositions.upgrade as any), 
                zIndex: 10, 
                transform: [{ translateX: -70 }, { translateY: -70 }] } as any]}
          >
            <Text style={styles.grapeMenuText}>{strings[language].upgrade}</Text>
            <Image 
              source={require('@/assets/images/Diamond.png')} 
              style={styles.diamondImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );



  return (
    <Animated.View style={{ flex: 1, backgroundColor: themeColors.background, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40}}>{MainContent}</ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 10,
  },
  signOutText: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    fontSize: 20,
  },
  switchContainer: {
    width: 55,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  switchButton: {
    position: 'absolute',
    top: 1,
    left: 0,
    width: 28,
    height: 28,
    zIndex: 2,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  profileInitials: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 95,
    paddingRight: 2
  },
  infoColumn: {
    gap: 10,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  infoHeading: {
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    fontSize: 16,
  },
  infoValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
  },
  grapeBunchContainer: {
    width: 350,
    height: 350,
    alignSelf: 'center',
    position: 'relative',
  },
  grapeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  stem: {
    width: 60,
    height: 60,
    left: undefined,
    top: undefined,
  },
  grapeMenuText: {
    color: 'white',
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    fontSize: 16,
  },
  diamondImage: {
    width: 24,
    height: 24,
    marginTop: 8,
  },
  mainColumnContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    // paddingTop handled inline
  },
}); 