import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView, Image, Share, Alert } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import type { ViewStyle } from 'react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { AntDesign } from '@expo/vector-icons';
import LightSwitchBody from '@/assets/icons/account/lightSwitchBody.svg';
import DarkSwitchBody from '@/assets/icons/account/darkSwitchBody.svg';
import LightSwitch from '@/assets/icons/account/lightSwitch.svg';
import DarkSwitch from '@/assets/icons/account/darkSwitch.svg';
import GrapeStem from '@/assets/icons/account/grapeStem.svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { useContext } from 'react';
import { MenuContext } from '@/contexts/MenuContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { strings } from '@/constants/strings';
import DeckCreationLoadingPage from '../DeckCreationLoadingPage';
import DeckCreationStatusPage from '../deckCreationStatusPage';
import { useTopBarAccountHeight } from '@/hooks/heights';
import { getAnimationConfig } from '@/utils/animationConfig';
import { optimizedScreenTransition } from '@/utils/performanceOptimizations';

export default function AccountScreen() {
  const [upgradePressed, setUpgradePressed] = useState(false);
  const [deckSettingsPressed, setDeckSettingsPressed] = useState(false);
  const [appSettingsPressed, setAppSettingsPressed] = useState(false);
  const [tcPressed, setTCPressed] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const [ratePressed, setRatePressed] = useState(false);
  const [websitePressed, setWebsitePressed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [preservedUser, setPreservedUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'profile' | 'stats'>('profile');
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  
  // Scale factor for responsive design - using iPhone 14 Pro Max (430px) as reference for more subtle scaling
  const REFERENCE_WIDTH = 480;
  const scaleFactor = Math.min(screenWidth / REFERENCE_WIDTH, 1.1); // Cap at 1.1x for very large screens
  const router = useRouter();
  const { language, reloadLanguage } = useLanguage();
  const { signOut, user } = useHybridAuth();
  const { theme, setThemeMode, isSystemTheme } = useTheme();
  const { showGlobalLoadingOverlay, setShowGlobalLoadingOverlay } = useContext(MenuContext);
  const themeColors = Colors[theme];
  const getTopBarAccountHeight = useTopBarAccountHeight();

  // For button animation
  const buttonAnim = useRef(new Animated.Value(theme === 'dark' ? 0 : 1)).current; // 1 = right (light), 0 = left (dark)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current; // 0 = profile view, 1 = stats view
  const arrowOpacity = useRef(new Animated.Value(0)).current; // For arrow fade-in optimization
  const isFocused = useIsFocused();
  const animationConfig = useMemo(() => getAnimationConfig(), []);

  useEffect(() => {
    if (isFocused) {
      // Reset to grape bunch view when returning to account page
      setCurrentView('profile');
      swipeAnim.setValue(0);
      
      // Use optimized screen transition
      optimizedScreenTransition.transitionWithDataPreload(
        () => {
          fadeAnim.setValue(0);
          arrowOpacity.setValue(0);
          
          // Start main content animation
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: animationConfig.screenTransitionDuration,
            useNativeDriver: true,
          }).start();
          
          // For high-end devices only: animate arrows
          if (!animationConfig.isLowEndDevice) {
            setTimeout(() => {
              Animated.timing(arrowOpacity, {
                toValue: 1,
                duration: animationConfig.duration,
                useNativeDriver: true,
              }).start();
            }, 0);
          }
        },
        // No data loading needed for account page, return resolved promise
        () => Promise.resolve()
      );
    }
  }, [isFocused, swipeAnim, fadeAnim, animationConfig.screenTransitionDuration]);

  useFocusEffect(
    useCallback(() => {
      reloadLanguage();
    }, [reloadLanguage])
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
    
    // Animate to the appropriate position with performance optimization
    const targetValue = newThemeMode === 'system' ? (theme === 'dark' ? 0 : 1) : (newThemeMode === 'dark' ? 0 : 1);
    Animated.timing(buttonAnim, {
      toValue: targetValue,
      duration: animationConfig.duration,
      useNativeDriver: false,
    }).start();
  };

  // Update button animation when theme changes
  useEffect(() => {
    Animated.timing(buttonAnim, {
      toValue: theme === 'dark' ? 0 : 1,
      duration: animationConfig.duration,
      useNativeDriver: false,
    }).start();
  }, [theme, animationConfig.duration]);

  // Swipe gesture handler
  const onSwipeGestureEvent = useCallback((event: any) => {
    const { translationX } = event.nativeEvent;
    const threshold = screenWidth * 0.3; // 30% of screen width
    
    if (translationX < -threshold && currentView === 'profile') {
      // Swiped left from profile view - go to stats
      setCurrentView('stats');
      Animated.timing(swipeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (translationX > threshold && currentView === 'stats') {
      // Swiped right from stats view - go to profile
      setCurrentView('profile');
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentView, screenWidth, swipeAnim]);

  const onSwipeHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.state === State.END) {
      onSwipeGestureEvent(event);
    }
  }, [onSwipeGestureEvent]);



  const handleDeckSettingsPress = useCallback(() => {
    router.push('/deckSettings');
  }, [router]);

  const handleAppSettingsPress = useCallback(() => {
    router.push('/appSettings');
  }, [router]);

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
            // Preserve current user information before sign out
            setPreservedUser(user);
            // Show global loading overlay instead of changing profile info
            setShowGlobalLoadingOverlay(true);
            setIsSigningOut(true);
            try {
              // Sign out from both Supabase and Clerk
              await signOut();
              // Force a small delay to ensure session is cleared and user sees the loading animation
              setTimeout(() => {
                setIsSigningOut(false);
                setShowGlobalLoadingOverlay(false);
                // Clear preserved user after sign out is complete
                setPreservedUser(null);
              }, 1500); // Slightly longer delay to show the loading animation
            } catch (error) {
              setIsSigningOut(false);
              setShowGlobalLoadingOverlay(false);
              // Clear preserved user on error
              setPreservedUser(null);
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

  // Grape bunch positions as a dictionary - memoized to prevent recreation
  const grapePositions = useMemo(() => ({
    stem:      { top: '-6%',  left: '10%' },
    website:   { top: '35%', left: '23%' },
    rate:      { top: '40%', left: '75%' },
    share:     { top: '72%', left: '80%' },
    tc:        { top: '65%', left: '22%' },
    app:       { top: '75%', left: '50%' },
    deck:      { top: '25%', left: '50%' },
    upgrade:   { top: '50%', left: '50%' },
  }), []);

  // --- BEGIN GRAPE BUNCH POSITIONING REFACTOR ---
  // Remove all getXTopPosition/getXLeftPosition functions

  // --- END GRAPE BUNCH POSITIONING REFACTOR ---

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: strings[language].shareMessage,
      });
    } catch (error) {
      // Optionally handle error
      console.error('Error sharing:', error);
    }
  }, [language]);

  // Memoized conditional styles to prevent recreation
  const stylesConditional = useMemo(() => StyleSheet.create({
    grapeBunchFlexWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    } as ViewStyle,
  }), []);

  const grapeBunchWrapperStyle = useMemo(() => 
    screenHeight > 670 ? stylesConditional.grapeBunchFlexWrapper : undefined,
    [screenHeight, stylesConditional.grapeBunchFlexWrapper]
  );



  // Get the user to display (preserved user during sign out, otherwise current user)
  const displayUser = useMemo(() => {
    return isSigningOut && preservedUser ? preservedUser : user;
  }, [isSigningOut, preservedUser, user]);

  // Theme-dependent styles - memoized to prevent recreation
  const themeStyles = useMemo(() => ({
    profileCircle: {
      ...styles.profileCircle,
      borderColor: themeColors.brandColor1,
      backgroundColor: themeColors.background,
    },
  }), [themeColors.brandColor1, themeColors.background]);

  // Scaled styles - memoized to prevent recreation
  const scaledStyles = useMemo(() => ({
    grapeBunchContainer: {
      ...styles.grapeBunchContainer,
      width: 350 * scaleFactor,
      height: 350 * scaleFactor,
    },
    grapeCircle: {
      ...styles.grapeCircle,
      width: 140 * scaleFactor,
      height: 140 * scaleFactor,
      borderRadius: 70 * scaleFactor,
    },
    stem: {
      ...styles.stem,
      width: 60 * scaleFactor,
      height: 60 * scaleFactor,
    },
    grapeMenuText: {
      ...styles.grapeMenuText,
      fontSize: 16 * scaleFactor,
    },
    diamondImage: {
      ...styles.diamondImage,
      width: 24 * scaleFactor,
      height: 24 * scaleFactor,
    },
    // Stats content scaling
    statsContent: {
      ...styles.statsContent,
      marginTop: -20 * scaleFactor,
    },
    statCard: {
      ...styles.statCard,
      width: 152 * scaleFactor,
      height: 170 * scaleFactor,
    },
    statCardBackground: {
      ...styles.statCardBackground,
      width: 152 * scaleFactor,
      height: 170 * scaleFactor,
    },
    statCardOverlay: {
      ...styles.statCardOverlay,
      width: 152 * scaleFactor,
      height: 160 * scaleFactor,
    },
    statNumber: {
      ...styles.statNumber,
      fontSize: 48 * scaleFactor,
      marginTop: -15 * scaleFactor,
    },
    statLabel: {
      ...styles.statLabel,
      fontSize: 20 * scaleFactor,
      marginTop: 10 * scaleFactor,
    },
    statsRow: {
      ...styles.statsRow,
      marginTop: 18 * scaleFactor,
      paddingHorizontal: 5 * scaleFactor,
    },
  }), [scaleFactor]);




  const MainContent = useMemo(() => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.mainScrollContent}>
      {/* Fixed Top Bar */}
      <View style={[styles.topBar, { paddingTop: getTopBarAccountHeight(), paddingHorizontal: 24 }]}> 
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
      
      {/* Fixed Profile Circle */}
      <View style={styles.circleContainer}> 
        <View style={themeStyles.profileCircle}>
          <Text style={[styles.profileInitials, { color: themeColors.text }]}>
            {displayUser?.email ? displayUser.email.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase() : 'GU'}
          </Text>
        </View>
      </View>
      
      {/* Fixed Info Column */}
      <View style={[styles.infoColumn, { marginTop: '4%', marginBottom: '10%' }]}> 
        <View style={styles.infoRow}>
          <Text style={[styles.infoHeading, { color: themeColors.text }]}>{strings[language].username}</Text>
          <Text style={[styles.infoValue, { color: themeColors.text }]}>{displayUser?.email || strings[language].notAvailable}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoHeading, { color: themeColors.text }]}>{strings[language].currentPlan}</Text>
          <Text style={[styles.infoValue, { color: themeColors.text }]}>{strings[language].basicPlan}</Text>
        </View>
      </View>
      
      {/* Swipeable Content Container */}
      <PanGestureHandler onHandlerStateChange={onSwipeHandlerStateChange}>
        <Animated.View style={styles.swipeableContainer}>
          <Animated.View 
            style={[
              styles.viewContainer,
              {
                transform: [{
                  translateX: swipeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -screenWidth],
                  })
                }]
              }
            ]}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={scaledStyles.grapeBunchContainer}>
                {/* Stem (behind) */}
                <GrapeStem
                  style={[
                    scaledStyles.stem,
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
                    scaledStyles.grapeCircle,
                    { backgroundColor: websitePressed ? '#8684FF' : '#685CDD', 
                      position: 'absolute', 
                      ...(grapePositions.website as any), 
                      zIndex: 7,
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }]
                    } as any
                  ]}
                >
                  <Text style={[scaledStyles.grapeMenuText, {marginLeft: -48 * scaleFactor, marginBottom: 15 * scaleFactor, textAlign: 'center'}]}>{strings[language].website}</Text>
                </TouchableOpacity>
                {/* Rate & Review button (behind) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setRatePressed(true)}
                  onPressOut={() => setRatePressed(false)}
                  style={[
                    scaledStyles.grapeCircle,
                    { backgroundColor: ratePressed ? '#8684FF' : '#4F41D8', 
                      position: 'absolute', 
                      ...(grapePositions.rate as any), 
                      zIndex: 8,
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }]
                    } as any
                  ]}
                >
                  <Text style={[scaledStyles.grapeMenuText, {marginLeft: 25 * scaleFactor, marginBottom: 15 * scaleFactor, textAlign: 'center'}]}>{strings[language].rateAndReview}</Text>
                </TouchableOpacity>
                {/* Share button (behind) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setSharePressed(true)}
                  onPressOut={() => setSharePressed(false)}
                  onPress={handleShare}
                  style={[
                    scaledStyles.grapeCircle,
                    { backgroundColor: sharePressed ? '#8684FF' : '#685CDD', 
                      position: 'absolute', ...(grapePositions.share as any), 
                      zIndex: 9, 
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }]} as any
                  ]}
                >
                  <Text style={[scaledStyles.grapeMenuText, {marginLeft: 15 * scaleFactor, marginTop: 5 * scaleFactor, textAlign: 'center'}]}>{strings[language].share}</Text>
                </TouchableOpacity>
                {/* T&C button (behind) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setTCPressed(true)}
                  onPressOut={() => setTCPressed(false)}
                  style={[
                    scaledStyles.grapeCircle,
                    { backgroundColor: tcPressed ? '#8684FF' : '#4F41D8', 
                      position: 'absolute', ...(grapePositions.tc as any), 
                      zIndex: 9, 
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }]} as any
                  ]}
                >
                  <Text style={[scaledStyles.grapeMenuText, {marginRight: 22 * scaleFactor, textAlign: 'center'}]}>{strings[language].termsAndConditions}</Text>
                </TouchableOpacity>
                {/* App Settings button (behind) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setAppSettingsPressed(true)}
                  onPressOut={() => setAppSettingsPressed(false)}
                  onPress={handleAppSettingsPress}
                  style={[
                    scaledStyles.grapeCircle,
                    { backgroundColor: appSettingsPressed ? '#8684FF' : '#3B30A7', 
                      position: 'absolute', 
                      ...(grapePositions.app as any), 
                      zIndex: 8, 
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }]
                    } as any
                  ]}
                >
                  <Text style={[scaledStyles.grapeMenuText, {marginTop: 50 * scaleFactor, textAlign: 'center'}]}>{strings[language].appSettings}</Text>
                </TouchableOpacity>
                {/* Deck Settings button (behind) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setDeckSettingsPressed(true)}
                  onPressOut={() => setDeckSettingsPressed(false)}
                  onPress={handleDeckSettingsPress}
                  style={[
                    scaledStyles.grapeCircle,
                    { backgroundColor: deckSettingsPressed ? '#8684FF' : '#3B30A7', 
                      position: 'absolute', 
                      ...(grapePositions.deck as any), 
                      zIndex: 8,
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }]
                    } as any
                  ]}
                >
                  <Text style={[scaledStyles.grapeMenuText, {marginBottom: 48 * scaleFactor, textAlign: 'center'}]}>{strings[language].deckSettings}</Text>
                </TouchableOpacity>
                {/* Upgrade button (on top) */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => setUpgradePressed(true)}
                  onPressOut={() => setUpgradePressed(false)}
                  style={[scaledStyles.grapeCircle, 
                    { backgroundColor: upgradePressed ? '#8684FF' : '#685CDD', 
                      position: 'absolute', 
                      ...(grapePositions.upgrade as any), 
                      zIndex: 10, 
                      transform: [{ translateX: -70 * scaleFactor }, { translateY: -70 * scaleFactor }] } as any]}
                >
                  <Text style={scaledStyles.grapeMenuText}>{strings[language].upgrade}</Text>
                  <Image 
                    source={require('@/assets/images/Diamond.png')} 
                    style={scaledStyles.diamondImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              
              {/* Right Arrow for Swipe Hint */}
              <Animated.View style={[styles.rightArrowContainer, { opacity: animationConfig.isLowEndDevice ? 1 : arrowOpacity }]}>
                <AntDesign name="arrowleft" size={24} color={themeColors.text} />
              </Animated.View>
            </View>
          </Animated.View>
          <Animated.View 
            style={[
              styles.viewContainer,
              {
                transform: [{
                  translateX: swipeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenWidth, 0],
                  })
                }]
              }
            ]}
          >
            <View style={scaledStyles.statsContent}>
              <View style={styles.statsGrid}>
                {/* First Row */}
                <View style={scaledStyles.statsRow}>
                  {/* GenAI Form Requests */}
                  <View style={scaledStyles.statCard}>
                    <Image 
                      source={require('@/assets/images/meshBackground1.png')} 
                      style={scaledStyles.statCardBackground}
                      resizeMode="contain"
                    />
                    <View style={scaledStyles.statCardOverlay}>
                      <View style={styles.statCardContent}>
                        <Text style={[scaledStyles.statNumber, { color: themeColors.text }]}>5/10</Text>
                        <Text style={[scaledStyles.statLabel, { color: themeColors.text }]}>{strings[language].genAIFormRequests}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* File Upload Form Requests */}
                  <View style={scaledStyles.statCard}>
                    <Image 
                      source={require('@/assets/images/meshBackground2.png')} 
                      style={scaledStyles.statCardBackground}
                      resizeMode="contain"
                    />
                    <View style={scaledStyles.statCardOverlay}>
                      <View style={styles.statCardContent}>
                        <Text style={[scaledStyles.statNumber, { color: themeColors.text }]}>4/10</Text>
                        <Text style={[scaledStyles.statLabel, { color: themeColors.text }]}>{strings[language].fileUploadFormRequests}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Second Row */}
                <View style={scaledStyles.statsRow}>
                  {/* Youtube Link Form Requests */}
                  <View style={scaledStyles.statCard}>
                    <Image 
                      source={require('@/assets/images/meshBackground3.png')} 
                      style={scaledStyles.statCardBackground}
                      resizeMode="contain"
                    />
                    <View style={scaledStyles.statCardOverlay}>
                      <View style={styles.statCardContent}>
                        <Text style={[scaledStyles.statNumber, { color: themeColors.text }]}>3/10</Text>
                        <Text style={[scaledStyles.statLabel, { color: themeColors.text }]}>{strings[language].youtubeLinkFormRequests}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* AI Chat Feedback Requests */}
                  <View style={scaledStyles.statCard}>
                    <Image 
                      source={require('@/assets/images/meshBackground4.png')} 
                      style={scaledStyles.statCardBackground}
                      resizeMode="contain"
                    />
                    <View style={scaledStyles.statCardOverlay}>
                      <View style={styles.statCardContent}>
                        <Text style={[scaledStyles.statNumber, { color: themeColors.text }]}>2/10</Text>
                        <Text style={[scaledStyles.statLabel, { color: themeColors.text }]}>{strings[language].aiChatFeedbackRequests}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Left Arrow for Swipe Hint */}
              <Animated.View style={[styles.leftArrowContainer, { opacity: animationConfig.isLowEndDevice ? 1 : arrowOpacity }]}>
                <AntDesign name="arrowright" size={24} color={themeColors.text} />
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </ScrollView>
  ), [
    getTopBarAccountHeight,
    handleSignOut,
    handleToggle,
    lightBodyOpacity,
    darkBodyOpacity,
    translateX,
    lightButtonOpacity,
    darkButtonOpacity,
    themeStyles.profileCircle,
    scaledStyles,
    themeColors.text,
    themeColors.unselectedText,
    displayUser?.email,
    strings,
    language,
    grapePositions,
    websitePressed,
    setWebsitePressed,
    ratePressed,
    setRatePressed,
    sharePressed,
    setSharePressed,
    handleShare,
    tcPressed,
    setTCPressed,
    appSettingsPressed,
    setAppSettingsPressed,
    handleAppSettingsPress,
    deckSettingsPressed,
    setDeckSettingsPressed,
    handleDeckSettingsPress,
    upgradePressed,
    setUpgradePressed,
    onSwipeHandlerStateChange,
    swipeAnim,
    screenWidth,
    scaleFactor
  ]);



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={{ flex: 1, backgroundColor: themeColors.background, opacity: fadeAnim }}>
        {MainContent}
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  swipeableContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  viewContainer: {
    flex: 1,
    width: '100%',
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  statsContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -80
  },
  statsGrid: {
    width: '100%',
    alignItems: 'center',
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 5,
  },
  statCard: {
    width: 152,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statCardBackground: {
    width: 152,
    height: 170,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  statCardOverlay: {
    width: 152,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  statCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontFamily: Fonts.title,
    fontSize: 48,
    textAlign: 'center',
    marginTop: -15,
  },
  statLabel: {
    fontFamily: Fonts.title,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  rightArrowContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 15,
  },
  leftArrowContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 15,
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