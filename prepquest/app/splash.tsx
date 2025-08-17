import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, ScrollView, TouchableOpacity, TextInput, Platform, Animated, Modal } from 'react-native';
import { useSignUp, useSignIn } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import PrepQuestLogo from '@/assets/icons/loginIcons/PrepQuestLogo.svg';
import GoogleLoginIcon from '@/assets/icons/loginIcons/GoogleLoginIcon.svg';
import AppleLoginIcon from '@/assets/icons/loginIcons/AppleLoginIcon.svg';
import FacebookLoginIcon from '@/assets/icons/loginIcons/FacebookLoginIcon.svg';
import { Feather } from '@expo/vector-icons';
import { Toast } from '@/components/general/Toast';
import { useHybridAuth } from '@/contexts/HybridAuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createUser } from '@/db/users';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

const { height } = Dimensions.get('window');

interface SplashScreenProps {
  isDatabaseReady?: boolean;
  onAuthComplete?: () => void;
}

// Memoized child components to prevent unnecessary re-renders
const MemoizedTextInput = React.memo(({ 
  style, 
  placeholder, 
  placeholderTextColor, 
  value, 
  onChangeText, 
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect
}: {
  style: any;
  placeholder: string;
  placeholderTextColor: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoCorrect?: boolean;
}) => (
  <TextInput
    style={style}
    placeholder={placeholder}
    placeholderTextColor={placeholderTextColor}
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
  />
));

const MemoizedTouchableOpacity = React.memo(({ 
  style, 
  onPress, 
  children, 
  disabled 
}: {
  style: any;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <TouchableOpacity 
    style={style}
    onPress={onPress}
    disabled={disabled}
  >
    {children}
  </TouchableOpacity>
));

const MemoizedText = React.memo(({ 
  style, 
  children 
}: {
  style: any;
  children: React.ReactNode;
}) => (
  <Text style={style}>
    {children}
  </Text>
));

export default function SplashScreen({ 
  isDatabaseReady = false, 
  onAuthComplete,
}: SplashScreenProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { 
    isAuthenticated, 
    user, 
    isLoading,
    signInWithEmail,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signOut
  } = useHybridAuth();
  
  // Direct Clerk signup hook for verification
  const { signUp, setActive } = useSignUp();
  
  // Direct Clerk signin hook for password reset
  const { signIn } = useSignIn();
  
  const insets = useSafeAreaInsets();
  
  // Track splash screen start time
  const splashStartTime = useRef(Date.now());

  const animationRef = useRef<LottieView>(null);
  const logoAnimationRef = useRef<LottieView>(null);
  const verificationInputRefs = useRef<(TextInput | null)[]>([]);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSignIn, setIsSignIn] = useState(true); // true for Sign In, false for Sign Up
  const [showPassword, setShowPassword] = useState(false); // false = hidden, true = visible
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastBackgroundColor, setToastBackgroundColor] = useState<string | undefined>(undefined);
  
  // Forgot password modal state
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [passwordResetCode, setPasswordResetCode] = useState(['', '', '', '', '', '']);
  const [isVerifyingResetCode, setIsVerifyingResetCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pendingPasswordReset, setPendingPasswordReset] = useState<any>(null);
  const passwordResetInputRefs = useRef<(TextInput | null)[]>([]);
  const passwordResetFadeAnim = useRef(new Animated.Value(1)).current;
  const [hasPasswordResetError, setHasPasswordResetError] = useState(false);
  
  // Email verification modal state
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [pendingSignUpAttempt, setPendingSignUpAttempt] = useState<any>(null);
  const [hasVerificationError, setHasVerificationError] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(15);
  const [canResendCode, setCanResendCode] = useState(false);
  
  // Animation state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toggleFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Loading overlay state
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const loadingOverlayRef = useRef<LottieView>(null);

  // Memoized animation configurations for better performance
  const fadeInAnimationConfig = useMemo(() => ({
    toValue: 1,
    duration: 800,
    useNativeDriver: true,
  }), []);

  const fadeOutAnimationConfig = useMemo(() => ({
    toValue: 0,
    duration: 150,
    useNativeDriver: true,
  }), []);

  const fadeInQuickAnimationConfig = useMemo(() => ({
    toValue: 1,
    duration: 150,
    useNativeDriver: true,
  }), []);

  // Memoized values to prevent unnecessary recalculations
  const containerStyle = useMemo(() => [
    styles.container, 
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  const whiteContainerStyle = useMemo(() => [
    styles.whiteContainer, 
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  const signInContainerStyle = useMemo(() => [
    styles.signInContainer, 
    { 
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }
  ], [insets.top, insets.bottom]);

  // Memoized text input styles
  const textInputStyle = useMemo(() => [
    styles.textInput, 
    { 
      borderColor: Colors[theme].unselectedText,
      color: Colors[theme].text,
      fontFamily: Fonts.bodyBold
    }
  ], [theme]);

  const placeholderTextColor = useMemo(() => Colors[theme].unselectedText, [theme]);

  // Memoized button styles
  const signInButtonStyle = useMemo(() => [
    styles.signInButton, 
    { backgroundColor: Colors[theme].brandColor2 }
  ], [theme]);

  const signInButtonTextStyle = useMemo(() => [
    styles.signInButtonText, 
    { color: Colors[theme].background, fontFamily: Fonts.bodyBold }
  ], [theme]);

  // Memoized social login button style
  const socialLoginButtonStyle = useMemo(() => [
    styles.socialLoginButton, 
    { borderColor: Colors[theme].unselectedText }
  ], [theme]);

  const socialLoginTextStyle = useMemo(() => [
    styles.socialLoginText, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyBold }
  ], [theme]);

  // Memoized toggle text styles
  const signInToggleTextStyle = useMemo(() => [
    styles.toggleText,
    { 
      color: isSignIn ? Colors[theme].text : Colors[theme].unselectedText,
      fontFamily: Fonts.bodyMedium
    }
  ], [isSignIn, theme]);

  const signUpToggleTextStyle = useMemo(() => [
    styles.toggleText,
    { 
      color: !isSignIn ? Colors[theme].text : Colors[theme].unselectedText,
      fontFamily: Fonts.bodyMedium
    }
  ], [isSignIn, theme]);

  const underlineStyle = useMemo(() => [
    styles.underline, 
    { backgroundColor: Colors[theme].brandColor2 }
  ], [theme]);

  const welcomeTextStyle = useMemo(() => [
    styles.welcomeText, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  const forgotPasswordTextStyle = useMemo(() => [
    styles.forgotPasswordText, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyBold }
  ], [theme]);

  const signInWithTextStyle = useMemo(() => [
    styles.signInWithText, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyBold }
  ], [theme]);

  const loadingTextStyle = useMemo(() => [
    styles.loadingText, 
    { color: Colors[theme].text }
  ], [theme]);

  // Memoized animation sources to prevent unnecessary re-renders
  const backgroundAnimationSource = useMemo(() => 
    require('../assets/animations/SplashScreenAnimation.json'), 
    []
  );

  const logoAnimationSource = useMemo(() => 
    require('../assets/animations/splashScreenLogoAnimation.json'), 
    []
  );

  const loadingAnimationSource = useMemo(() => 
    require('../assets/animations/addDeckLoadingAnimation.json'), 
    []
  );

  // Memoized modal styles
  const modalContentStyle = useMemo(() => [
    styles.modalContent, 
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  const modalTitleStyle = useMemo(() => [
    styles.modalTitle, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  const modalSubtitleStyle = useMemo(() => [
    styles.modalSubtitle, 
    { color: Colors[theme].unselectedText, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  const modalInputStyle = useMemo(() => [
    styles.modalInput, 
    { 
      borderColor: Colors[theme].unselectedText,
      color: Colors[theme].text,
      fontFamily: Fonts.bodyBold
    }
  ], [theme]);

  const modalCancelButtonStyle = useMemo(() => [
    styles.modalCancelButton, 
    { borderColor: Colors[theme].unselectedText }
  ], [theme]);

  const modalCancelButtonTextStyle = useMemo(() => [
    styles.modalCancelButtonText, 
    { color: Colors[theme].text, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  const modalConfirmButtonStyle = useMemo(() => [
    styles.modalConfirmButton, 
    { backgroundColor: Colors[theme].brandColor2 },
    isResettingPassword && { backgroundColor: Colors[theme].unselectedText, opacity: 0.6 }
  ], [theme, isResettingPassword]);

  const modalConfirmButtonTextStyle = useMemo(() => [
    styles.modalConfirmButtonText, 
    { color: Colors[theme].background, fontFamily: Fonts.bodyMedium }
  ], [theme]);

  // Verification modal styles
  const verificationCodeInputStyle = useMemo(() => [
    styles.verificationCodeInput,
    {
      borderColor: hasVerificationError ? '#FF4444' : Colors[theme].unselectedText,
      color: Colors[theme].text,
      backgroundColor: Colors[theme].background,
      fontFamily: Fonts.bodyBold
    }
  ], [theme, hasVerificationError]);

  // Password reset verification code input styles
  const passwordResetCodeInputStyle = useMemo(() => [
    styles.verificationCodeInput,
    {
      borderColor: hasPasswordResetError ? '#FF4444' : Colors[theme].unselectedText,
      color: Colors[theme].text,
      backgroundColor: Colors[theme].background,
      fontFamily: Fonts.bodyBold
    }
  ], [theme, hasPasswordResetError]);



  const resendButtonStyle = useMemo(() => [
    styles.resendButton,
    { 
      borderColor: canResendCode ? Colors[theme].brandColor2 : Colors[theme].unselectedText,
      opacity: canResendCode ? 1 : 0.5
    }
  ], [theme, canResendCode]);

  const resendButtonTextStyle = useMemo(() => [
    styles.resendButtonText,
    { 
      color: canResendCode ? Colors[theme].brandColor2 : Colors[theme].unselectedText, 
      fontFamily: Fonts.bodyMedium 
    }
  ], [theme, canResendCode]);

  // Loading overlay styles
  const loadingOverlayStyle = useMemo(() => [
    styles.loadingOverlay,
    { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
  ], []);

  const loadingAnimationContainerStyle = useMemo(() => [
    styles.loadingAnimationContainer
  ], []);

  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Show loading overlay for any authentication
      setShowLoadingOverlay(true);
      
      const handleAuthComplete = async () => {
        try {
          if (user?.id) {
            // Store userID in AsyncStorage for compatibility with existing database operations
            await AsyncStorage.setItem('userID', user.id);
            
            // Check if user exists in local database, if not create them
            // This handles both new Clerk signups and social login users
            const dbSuccess = await createUser(user.id);
            if (!dbSuccess) {
              console.warn('Failed to create user in local database, but Clerk auth succeeded');
            }
          }
        } catch (error) {
          console.error('Error handling user creation:', error);
        }
      };
      
      // Handle user creation if there's a user object (new auth), otherwise just proceed (existing auth)
      if (user) {
        handleAuthComplete();
      }
      
      // Complete auth after ensuring minimum splash duration
      const elapsedTime = Date.now() - splashStartTime.current;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      console.log(`🕐 Splash (auth complete): elapsed: ${elapsedTime}ms, remaining: ${remainingTime}ms`);
      
      setTimeout(() => {
        setShowLoadingOverlay(false);
        onAuthComplete?.();
      }, remainingTime);
    }
  }, [isLoading, isAuthenticated, user, onAuthComplete]);

  // Clear any existing session when component mounts
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Ensure AsyncStorage is cleared when not signed in
      AsyncStorage.removeItem('userID');
    }
  }, [isLoading, isAuthenticated]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      // Stop any running animations to prevent memory leaks
      fadeAnim.stopAnimation();
      toggleFadeAnim.stopAnimation();
      passwordResetFadeAnim.stopAnimation();
      // Clear resend timer
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
        resendTimerRef.current = null;
      }
    };
  }, [fadeAnim, toggleFadeAnim, passwordResetFadeAnim]);

  // Handle resend code countdown
  useEffect(() => {
    if (!canResendCode && resendCountdown > 0) {
      resendTimerRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResendCode(true);
            if (resendTimerRef.current) {
              clearInterval(resendTimerRef.current);
              resendTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (resendTimerRef.current) {
          clearInterval(resendTimerRef.current);
          resendTimerRef.current = null;
        }
      };
    }
  }, [canResendCode, resendCountdown]);

  const handleHideToast = useCallback(() => {
    setToastVisible(false);
    setToastBackgroundColor(undefined);
  }, []);

  // Helper functions for different toast types
  const showSuccessToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastBackgroundColor('#44B88A');
    setToastVisible(true);
  }, []);

  const showErrorToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastBackgroundColor(undefined); // Use default error color
    setToastVisible(true);
  }, []);

  // Helper function to start resend countdown
  const startResendCountdown = useCallback(() => {
    setCanResendCode(false);
    setResendCountdown(5);
  }, []);

  // Helper function to transition password reset steps with fade animation
  const transitionPasswordResetStep = useCallback((newStep: 'email' | 'code' | 'newPassword') => {
    // Fade out
    Animated.timing(passwordResetFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Change step
      setPasswordResetStep(newStep);
      // Fade in
      Animated.timing(passwordResetFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [passwordResetFadeAnim]);

  // Validation function
  const validateSignUp = useCallback(() => {
    // Check if fields are empty
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showErrorToast(strings[language].splash.fillUpBothEmailAndPassword);
      return false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      showErrorToast(strings[language].splash.passwordsDontMatch);
      return false;
    }
    
    return true;
  }, [email, password, confirmPassword, language, showErrorToast]);

  const handleSignUp = useCallback(async () => {
    if (validateSignUp()) {
      try {
        // Use direct Clerk signup to handle verification flow
        if (!signUp) {
          setToastMessage(strings[language].splash.signUpFailed);
          setToastVisible(true);
          return;
        }

        const result = await signUp.create({
          emailAddress: email.trim(),
          password,
        });

        if (result.status === 'complete') {
          // Signup completed without verification
          if (setActive) {
            await setActive({ session: result.createdSessionId });
          }
          showSuccessToast(strings[language].splash.accountCreatedSuccessfully);
        } else if (result.status === 'missing_requirements') {
          // Email verification required
          await result.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPendingSignUpAttempt(result);
          setHasVerificationError(false); // Reset error state when opening modal
          startResendCountdown(); // Start 5-second countdown for resend button
          setVerificationModalVisible(true);
          showSuccessToast(strings[language].splash.verificationCodeSent);
        } else {
          showErrorToast(strings[language].splash.signUpFailed);
        }
      } catch (error: any) {
        const errorMessage = error.errors?.[0]?.message || error?.message || strings[language].splash.signUpFailed;
        showErrorToast(errorMessage);
      }
    }
  }, [validateSignUp, email, password, signUp, setActive, language, showSuccessToast, showErrorToast, startResendCountdown]);

  const handleSignIn = useCallback(async () => {
    // Check if fields are empty
    if (!email.trim() || !password.trim()) {
      showErrorToast(strings[language].splash.fillUpBothEmailAndPassword);
      return;
    }
    
    try {
      const result = await signInWithEmail(email.trim(), password);

      if (result.success) {
        // Clerk authentication successful - auth state will be updated and trigger the useEffect
      } else {
        // Handle Clerk-specific error messages
        let errorMessage = result.error || strings[language].splash.signInFailed;
        
        // Provide user-friendly messages for common Clerk errors
        if (result.error?.includes('identifier') || result.error?.includes('not found')) {
          errorMessage = result.error; // Use Clerk's specific error message
        } else if (result.error?.includes('password') || result.error?.includes('credentials')) {
          errorMessage = result.error; // Use Clerk's specific error message
        }
        
        showErrorToast(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.message || strings[language].splash.signInFailed;
      showErrorToast(errorMessage);
    }
  }, [email, password, signInWithEmail, language, showErrorToast]);

  const handleSocialLogin = useCallback(async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      let oauthFunction;
      switch (provider) {
        case 'google':
          oauthFunction = signInWithGoogle;
          break;
        case 'facebook':
          oauthFunction = signInWithFacebook;
          break;
        case 'apple':
          oauthFunction = signInWithApple;
          break;
        default:
          showErrorToast(strings[language].splash.providerNotSupported);
          return;
      }
    
      await oauthFunction();
      
      // Show loading overlay immediately after successful social authentication
      setShowLoadingOverlay(true);
      
      // Clerk social login successful - user state will be updated by the context
      // and we can handle user creation in the useEffect that watches auth state changes
    } catch (error: any) {
      // Ensure loading overlay is hidden when social sign-in fails or is canceled
      setShowLoadingOverlay(false);
      
      // If user canceled OAuth, handle silently (no error message)
      if (error?.code === 'oauth_canceled') {
        // User canceled - just return to login screen silently
        return;
      }
      
      let errorMessage;
      switch (provider) {
        case 'google':
          errorMessage = error?.message || strings[language].splash.googleSignInFailed;
          break;
        case 'facebook':
          errorMessage = error?.message || strings[language].splash.facebookSignInFailed;
          break;
        case 'apple':
          errorMessage = error?.message || strings[language].splash.appleSignInFailed;
          break;
        default:
          errorMessage = error?.message || strings[language].splash.signInFailed;
      }
      showErrorToast(errorMessage);
    }
  }, [signInWithGoogle, signInWithFacebook, signInWithApple, language, showErrorToast]);

  useEffect(() => {
    // Ensure animations start playing
    if (animationRef.current) {
      animationRef.current.play();
    }
    if (logoAnimationRef.current) {
      logoAnimationRef.current.play();
    }
    if (loadingOverlayRef.current) {
      loadingOverlayRef.current.play();
    }

    // Cleanup function to stop animations when component unmounts
    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
      if (logoAnimationRef.current) {
        logoAnimationRef.current.pause();
      }
      if (loadingOverlayRef.current) {
        loadingOverlayRef.current.pause();
      }
    };
  }, []);

  // Fade in animation when database is ready
  useEffect(() => {
    if (isDatabaseReady) {
      Animated.timing(fadeAnim, {
        ...fadeInAnimationConfig,
      }).start();
    }
  }, [isDatabaseReady, fadeAnim, fadeInAnimationConfig]);

  // Handle toggle between sign in and sign up with fade animation
  const handleToggle = useCallback((newIsSignIn: boolean) => {
    if (newIsSignIn !== isSignIn) {
      // Fade out
      Animated.timing(toggleFadeAnim, {
        ...fadeOutAnimationConfig,
      }).start(() => {
        // Change state
        setIsSignIn(newIsSignIn);
        // Fade in
        Animated.timing(toggleFadeAnim, {
          ...fadeInQuickAnimationConfig,
        }).start();
      });
    }
  }, [isSignIn, toggleFadeAnim, fadeOutAnimationConfig, fadeInQuickAnimationConfig]);

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    setForgotPasswordModalVisible(true);
    setForgotPasswordEmail(email.trim()); // Pre-populate with current email
  }, [email]);

  // Handle password reset
  const handlePasswordReset = useCallback(async () => {
    if (!forgotPasswordEmail.trim()) {
      showErrorToast(strings[language].splash.pleaseEnterYourEmailAddress);
      return;
    }

    setIsResettingPassword(true);

    try {
      // Start the password reset flow with Clerk
      if (!signIn) {
        showErrorToast('Sign in not available');
        setIsResettingPassword(false);
        return;
      }

      // Create a sign-in attempt with the email
      const result = await signIn.create({
        identifier: forgotPasswordEmail.trim(),
      });

      // Look for reset password factor
      const resetPasswordFactor = result.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'reset_password_email_code'
      );

      if (!resetPasswordFactor) {
        showErrorToast('Password reset not available for this email');
        setIsResettingPassword(false);
        return;
      }

      // Prepare the reset password email
      await result.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: (resetPasswordFactor as any).emailAddressId,
      });

      // Store the sign-in attempt for later use
      setPendingPasswordReset(result);
      
      // Move to code verification step with animation
      setHasPasswordResetError(false); // Reset error state when opening code step
      transitionPasswordResetStep('code');
      showSuccessToast(strings[language].splash.passwordResetEmailSent);
    } catch (error: any) {
      const errorMessage = error?.message || strings[language].splash.failedToSendResetEmail;
      showErrorToast(errorMessage);
    }

    setIsResettingPassword(false);
  }, [forgotPasswordEmail, signIn, language, showSuccessToast, showErrorToast, transitionPasswordResetStep]);

  const handleCloseModal = useCallback(() => {
    setForgotPasswordModalVisible(false);
    // Reset all password reset states
    setPasswordResetStep('email');
    setPasswordResetCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
    setPendingPasswordReset(null);
    setForgotPasswordEmail('');
    setHasPasswordResetError(false);
    // Reset animation
    passwordResetFadeAnim.setValue(1);
  }, [passwordResetFadeAnim]);

  // Handle password reset code verification
  const handleVerifyResetCode = useCallback(async () => {
    const code = passwordResetCode.join('');
    if (code.length !== 6) {
      setHasPasswordResetError(true);
      return;
    }

    if (!pendingPasswordReset) {
      showErrorToast('Password reset session expired');
      return;
    }

    setIsVerifyingResetCode(true);

    try {
      const result = await pendingPasswordReset.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        // Move to new password step with animation
        transitionPasswordResetStep('newPassword');
        setPasswordResetCode(['', '', '', '', '', '']); // Clear code
        setHasPasswordResetError(false); // Clear error state
      } else {
        setHasPasswordResetError(true);
      }
    } catch (error: any) {
      // Show red border for invalid verification code instead of toast
      setHasPasswordResetError(true);
    }

    setIsVerifyingResetCode(false);
  }, [passwordResetCode, pendingPasswordReset, showErrorToast, transitionPasswordResetStep]);

  // Handle new password submission
  const handleSetNewPassword = useCallback(async () => {
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      showErrorToast('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showErrorToast('Passwords do not match');
      return;
    }

    if (!pendingPasswordReset) {
      showErrorToast('Password reset session expired');
      return;
    }

    try {
      await pendingPasswordReset.resetPassword({
        password: newPassword,
      });

      // Password reset completed successfully
      // Clerk might have automatically created a session, so we need to clear it
      // to ensure the user signs in fresh with their new password
      try {
        await signOut();
      } catch {
        // Ignore sign out errors - there might not be a session to clear
        console.log('No session to clear after password reset');
      }

      // Close modal and show success message
      setForgotPasswordModalVisible(false);
      showSuccessToast(strings[language].splash.passwordResetSuccess);
      
      // Reset all password reset states
      setPasswordResetStep('email');
      setPasswordResetCode(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
      setPendingPasswordReset(null);
      setForgotPasswordEmail('');
      setHasPasswordResetError(false);
      
      // Reset animation
      passwordResetFadeAnim.setValue(1);
      
      // Clear main sign-in form to ensure fresh sign-in
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Failed to reset password';
      showErrorToast(errorMessage);
    }
  }, [newPassword, confirmNewPassword, pendingPasswordReset, showErrorToast, showSuccessToast, language, signOut, passwordResetFadeAnim]);

  // Handle password reset code input change
  const handlePasswordResetCodeChange = useCallback((text: string, index: number) => {
    // Clear error state when user starts typing
    if (hasPasswordResetError) {
      setHasPasswordResetError(false);
    }

    if (text.length > 1) {
      // Handle paste - distribute characters across inputs
      const chars = text.slice(0, 6).split('');
      const newCode = [...passwordResetCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setPasswordResetCode(newCode);
      return;
    }

    const newCode = [...passwordResetCode];
    newCode[index] = text;
    setPasswordResetCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      const nextInput = passwordResetInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  }, [passwordResetCode, hasPasswordResetError]);

  // Handle password reset code key press
  const handlePasswordResetCodeKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !passwordResetCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      const prevInput = passwordResetInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  }, [passwordResetCode]);

  const handleTogglePassword = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
  }, []);

  const handleForgotPasswordEmailChange = useCallback((text: string) => {
    setForgotPasswordEmail(text);
  }, []);

  const handleNewPasswordChange = useCallback((text: string) => {
    setNewPassword(text);
  }, []);

  const handleConfirmNewPasswordChange = useCallback((text: string) => {
    setConfirmNewPassword(text);
  }, []);

  // Verification code handlers
  const handleVerificationCodeChange = useCallback((text: string, index: number) => {
    // Clear error state when user starts typing
    if (hasVerificationError) {
      setHasVerificationError(false);
    }

    if (text.length > 1) {
      // Handle paste - distribute characters across inputs
      const chars = text.slice(0, 6).split('');
      const newCode = [...verificationCode];
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setVerificationCode(newCode);
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      const nextInput = verificationInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  }, [verificationCode, hasVerificationError]);

  const handleVerificationCodeKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      const prevInput = verificationInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  }, [verificationCode]);

  const handleVerifyCode = useCallback(async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      showErrorToast(strings[language].splash.pleaseEnterAllDigits);
      return;
    }

    if (!pendingSignUpAttempt) {
      showErrorToast(strings[language].splash.verificationFailed);
      return;
    }

    setIsVerifying(true);

    try {
      const result = await pendingSignUpAttempt.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        // Close verification modal and show loading overlay
        setVerificationModalVisible(false);
        setVerificationCode(['', '', '', '', '', '']);
        setPendingSignUpAttempt(null);
        setHasVerificationError(false);
        setShowLoadingOverlay(true);
        showSuccessToast(strings[language].splash.accountCreatedSuccessfully);
      } else {
        setHasVerificationError(true);
      }
    } catch (error: any) {
      // Show red border for invalid verification code instead of toast
      setHasVerificationError(true);
    }

    setIsVerifying(false);
  }, [verificationCode, pendingSignUpAttempt, setActive, language, showSuccessToast, showErrorToast]);

  const handleResendCode = useCallback(async () => {
    if (!pendingSignUpAttempt) {
      return;
    }

    setIsResendingCode(true);

    try {
      await pendingSignUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });
      showSuccessToast(strings[language].splash.verificationCodeSent);
      startResendCountdown(); // Start countdown again after successful resend
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || strings[language].splash.verificationFailed;
      showErrorToast(errorMessage);
    }

    setIsResendingCode(false);
  }, [pendingSignUpAttempt, language, showSuccessToast, showErrorToast, startResendCountdown]);

  const handleCloseVerificationModal = useCallback(() => {
    setVerificationModalVisible(false);
    setVerificationCode(['', '', '', '', '', '']);
    setPendingSignUpAttempt(null);
    setHasVerificationError(false);
    // Reset countdown states
    setCanResendCode(false);
    setResendCountdown(5);
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  }, []);

  const handleSignInPress = useCallback(() => {
    if (isSignIn) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  }, [isSignIn, handleSignIn, handleSignUp]);

  const handleGoogleLogin = useCallback(() => {
    handleSocialLogin('google');
  }, [handleSocialLogin]);

  const handleAppleLogin = useCallback(() => {
    handleSocialLogin('apple');
  }, [handleSocialLogin]);

  const handleFacebookLogin = useCallback(() => {
    handleSocialLogin('facebook');
  }, [handleSocialLogin]);

  const handleToggleSignIn = useCallback(() => {
    handleToggle(true);
  }, [handleToggle]);

  const handleToggleSignUp = useCallback(() => {
    handleToggle(false);
  }, [handleToggle]);

  return (
    <View style={containerStyle}>
      {/* Background animation that fills the screen */}
      <LottieView
        ref={animationRef}
        source={backgroundAnimationSource}
        autoPlay
        loop={true}
        style={styles.animation}
        resizeMode="cover"
        speed={1}
        cacheComposition={true}
        renderMode="HARDWARE"
        onAnimationFailure={(error) => {
          console.error('Background animation failed to load:', error);
        }}
      />
      
      {/* Toast component */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={handleHideToast}
        duration={3000}
        backgroundColor={toastBackgroundColor}
      />
      
      {/* Show sign in/signup screen when database is ready */}
      {isDatabaseReady ? (
        <Animated.View style={[
          signInContainerStyle, 
          { opacity: fadeAnim }
        ]}>
          {/* White rectangle container */}
          <View style={whiteContainerStyle}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Logo row at the top */}
              <View style={styles.logoRow}>
                <PrepQuestLogo 
                  width={height * 0.25} // 8% of device height
                  height={height * 0.125} // 4% of device height
                />
              </View>
              
              {/* Sign In / Sign Up Toggle */}
              <View style={styles.toggleContainer}>
                <MemoizedTouchableOpacity 
                  style={styles.toggleOption}
                  onPress={handleToggleSignIn}
                >
                  <MemoizedText style={signInToggleTextStyle}>
                    {strings[language].splash.signIn}
                  </MemoizedText>
                  {isSignIn && <View style={underlineStyle} />}
                </MemoizedTouchableOpacity>
                
                <MemoizedTouchableOpacity 
                  style={styles.toggleOption}
                  onPress={handleToggleSignUp}
                >
                  <MemoizedText style={signUpToggleTextStyle}>
                    {strings[language].splash.signUp}
                  </MemoizedText>
                  {!isSignIn && <View style={underlineStyle} />}
                </MemoizedTouchableOpacity>
              </View>
              
              {/* Animated content that changes between sign in and sign up */}
              <Animated.View style={{ opacity: toggleFadeAnim, width: '100%' }}>
                {/* Welcome text for sign in/sign up state */}
                {isSignIn ? (
                  <View style={styles.welcomeContainer}>
                    <MemoizedText style={welcomeTextStyle}>{strings[language].splash.welcomeBack}</MemoizedText>
                  </View>
                ) : (
                  <View style={styles.welcomeContainer}>
                    <MemoizedText style={welcomeTextStyle}>{strings[language].splash.welcomeAboard}</MemoizedText>
                  </View>
                )}
                
                {/* Input fields - visible in both sign in and sign up states */}
                <View style={styles.inputContainer}>
                  {/* Email/Username input */}
                  <View style={styles.inputWrapper}>
                    <MemoizedTextInput
                      style={textInputStyle}
                      placeholder={strings[language].splash.email}
                      placeholderTextColor={placeholderTextColor}
                      value={email}
                      onChangeText={handleEmailChange}
                    />
                  </View>
                  
                  {/* Password input */}
                  <View style={styles.inputWrapper}>
                    <MemoizedTextInput
                      style={textInputStyle}
                      placeholder={strings[language].splash.password}
                      placeholderTextColor={placeholderTextColor}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={handlePasswordChange}
                    />
                    <MemoizedTouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={handleTogglePassword}
                    >
                      <Feather 
                        name={showPassword ? 'eye' : 'eye-off'} 
                        size={20} 
                        color={Colors[theme].normalIconColor}
                      />
                    </MemoizedTouchableOpacity>
                  </View>
                  
                  {/* Confirm Password input - only in sign up state */}
                  {!isSignIn && (
                    <View style={styles.inputWrapper}>
                      <MemoizedTextInput
                        style={textInputStyle}
                        placeholder={strings[language].splash.confirmPassword}
                        placeholderTextColor={placeholderTextColor}
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                      />
                      <MemoizedTouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={handleTogglePassword}
                      >
                        <Feather 
                          name={showPassword ? 'eye' : 'eye-off'} 
                          size={20} 
                          color={Colors[theme].normalIconColor}
                        />
                      </MemoizedTouchableOpacity>
                    </View>
                  )}
                </View>
                
                {/* Sign In/Sign Up button */}
                <View style={styles.buttonContainer}>
                  <MemoizedTouchableOpacity 
                    style={signInButtonStyle}
                    onPress={handleSignInPress}
                  >
                    <MemoizedText style={signInButtonTextStyle}>
                      {isSignIn ? strings[language].splash.signIn : strings[language].splash.signUp}
                    </MemoizedText>
                  </MemoizedTouchableOpacity>
                </View>
                
                {/* Forgot Password text - visible in both states */}
                {isSignIn && (
                                  <View style={styles.forgotPasswordContainer}>
                   <MemoizedTouchableOpacity style={{}} onPress={handleForgotPassword}>
                     <MemoizedText style={forgotPasswordTextStyle}>{strings[language].splash.forgotPassword}</MemoizedText>
                   </MemoizedTouchableOpacity>
                 </View>
                )}
              </Animated.View>
              
              {/* Social login section - visible in both states */}
              <View style={styles.forgotPasswordContainer}>
                <MemoizedText style={signInWithTextStyle}>
                  {isSignIn ? strings[language].splash.orSignInWith : strings[language].splash.orSignUpWith}
                </MemoizedText>
                
                {/* Social login buttons */}
                <View style={styles.socialLoginContainer}>
                  {/* Google login */}
                  <MemoizedTouchableOpacity 
                    style={socialLoginButtonStyle}
                    onPress={handleGoogleLogin}
                  >
                    <View style={styles.iconContainer}>
                      <GoogleLoginIcon width={24} height={24} />
                    </View>
                    <View style={styles.textContainer}>
                      <MemoizedText style={socialLoginTextStyle}>{strings[language].splash.continueWithGoogle}</MemoizedText>
                    </View>
                  </MemoizedTouchableOpacity>
                  
                  {/* Apple login - only on iOS */}
                  {Platform.OS === 'ios' && (
                    <MemoizedTouchableOpacity 
                      style={socialLoginButtonStyle}
                      onPress={handleAppleLogin}
                    >
                      <View style={styles.iconContainer}>
                        <AppleLoginIcon width={24} height={24} />
                      </View>
                      <View style={styles.textContainer}>
                        <MemoizedText style={socialLoginTextStyle}>{strings[language].splash.continueWithApple}</MemoizedText>
                      </View>
                    </MemoizedTouchableOpacity>
                  )}
                  
                  {/* Facebook login */}
                  <MemoizedTouchableOpacity 
                    style={socialLoginButtonStyle}
                    onPress={handleFacebookLogin}
                  >
                    <View style={styles.iconContainer}>
                      <FacebookLoginIcon width={24} height={24} />
                    </View>
                    <View style={styles.textContainer}>
                      <MemoizedText style={socialLoginTextStyle}>{strings[language].splash.continueWithFacebook}</MemoizedText>
                    </View>
                  </MemoizedTouchableOpacity>
                </View>
              </View>
              
              {/* Sign in/signup content will go here later */}
            </ScrollView>
          </View>
        </Animated.View>

      ) : (
        <>
          {/* Logo animation centered on top */}
          <View style={styles.logoContainer}>
            <LottieView
              ref={logoAnimationRef}
              source={logoAnimationSource}
              autoPlay
              loop={false}
              style={styles.logoAnimation}
              speed={1}
              cacheComposition={true}
              renderMode="HARDWARE"
              onAnimationFailure={(error) => {
                console.error('Logo animation failed to load:', error);
              }}
            />
          </View>

          {/* Optional: Add a loading text in case animation fails */}
          <View style={styles.loadingTextContainer}>
            <MemoizedText style={loadingTextStyle}>{strings[language].splash.loading}</MemoizedText>
          </View>
        </>
      )}

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={modalContentStyle}>
            <Animated.View style={{ opacity: passwordResetFadeAnim, width: '100%' }}>
              {passwordResetStep === 'email' && (
              <>
                <MemoizedText style={modalTitleStyle}>{strings[language].splash.resetPassword}</MemoizedText>
                <MemoizedText style={modalSubtitleStyle}>
                  {strings[language].splash.resetPasswordSubtitle}
                </MemoizedText>
                
                <MemoizedTextInput
                  style={modalInputStyle}
                  placeholder={strings[language].splash.enterYourEmail}
                  placeholderTextColor={placeholderTextColor}
                  value={forgotPasswordEmail}
                  onChangeText={handleForgotPasswordEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                
                <View style={styles.modalButtonContainer}>
                  <MemoizedTouchableOpacity 
                    style={modalCancelButtonStyle}
                    onPress={handleCloseModal}
                  >
                    <MemoizedText style={modalCancelButtonTextStyle}>{strings[language].splash.cancel}</MemoizedText>
                  </MemoizedTouchableOpacity>
                  
                  <MemoizedTouchableOpacity 
                    style={modalConfirmButtonStyle}
                    onPress={handlePasswordReset}
                    disabled={isResettingPassword}
                  >
                    <MemoizedText style={modalConfirmButtonTextStyle}>
                      {isResettingPassword ? strings[language].splash.sending : strings[language].splash.sendEmail}
                    </MemoizedText>
                  </MemoizedTouchableOpacity>
                </View>
              </>
            )}

            {passwordResetStep === 'code' && (
              <>
                <MemoizedText style={modalTitleStyle}>{strings[language].splash.verifyYourEmail}</MemoizedText>
                <MemoizedText style={modalSubtitleStyle}>
                  {strings[language].splash.firstKeyInCodeToVerify}
                </MemoizedText>
                
                {/* Password Reset Code Input Grid */}
                <View style={styles.verificationCodeContainer}>
                  {passwordResetCode.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        passwordResetInputRefs.current[index] = ref;
                      }}
                      style={passwordResetCodeInputStyle}
                      value={digit}
                      onChangeText={(text) => handlePasswordResetCodeChange(text, index)}
                      onKeyPress={({ nativeEvent }) => handlePasswordResetCodeKeyPress(nativeEvent.key, index)}
                      keyboardType="numeric"
                      maxLength={6}
                      textAlign="center"
                      selectTextOnFocus={true}
                      autoFocus={index === 0}
                    />
                  ))}
                </View>
                
                <View style={styles.modalButtonContainer}>
                  <MemoizedTouchableOpacity 
                    style={modalCancelButtonStyle}
                    onPress={handleCloseModal}
                  >
                    <MemoizedText style={modalCancelButtonTextStyle}>{strings[language].splash.cancel}</MemoizedText>
                  </MemoizedTouchableOpacity>
                  
                  <MemoizedTouchableOpacity 
                    style={[modalConfirmButtonStyle, isVerifyingResetCode && { backgroundColor: Colors[theme].unselectedText, opacity: 0.6 }]}
                    onPress={handleVerifyResetCode}
                    disabled={isVerifyingResetCode}
                  >
                    <MemoizedText style={modalConfirmButtonTextStyle}>
                      {isVerifyingResetCode ? strings[language].splash.verifying : strings[language].splash.verify}
                    </MemoizedText>
                  </MemoizedTouchableOpacity>
                </View>
              </>
            )}

            {passwordResetStep === 'newPassword' && (
              <>
                <MemoizedText style={modalTitleStyle}>{strings[language].splash.setNewPassword}</MemoizedText>
                <MemoizedText style={modalSubtitleStyle}>
                  {strings[language].splash.enterYourNewPassword}
                </MemoizedText>
                
                <View style={styles.inputWrapper}>
                  <MemoizedTextInput
                    style={modalInputStyle}
                    placeholder={strings[language].splash.newPassword}
                    placeholderTextColor={placeholderTextColor}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <MemoizedTouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={handleTogglePassword}
                  >
                    <Feather 
                      name={showPassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color={Colors[theme].normalIconColor}
                    />
                  </MemoizedTouchableOpacity>
                </View>
                
                <View style={styles.inputWrapper}>
                  <MemoizedTextInput
                    style={modalInputStyle}
                    placeholder={strings[language].splash.confirmNewPassword}
                    placeholderTextColor={placeholderTextColor}
                    secureTextEntry={!showPassword}
                    value={confirmNewPassword}
                    onChangeText={handleConfirmNewPasswordChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <MemoizedTouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={handleTogglePassword}
                  >
                    <Feather 
                      name={showPassword ? 'eye' : 'eye-off'} 
                      size={20} 
                      color={Colors[theme].normalIconColor}
                    />
                  </MemoizedTouchableOpacity>
                </View>
                
                <View style={styles.modalButtonContainer}>
                  <MemoizedTouchableOpacity 
                    style={modalCancelButtonStyle}
                    onPress={handleCloseModal}
                  >
                    <MemoizedText style={modalCancelButtonTextStyle}>{strings[language].splash.cancel}</MemoizedText>
                  </MemoizedTouchableOpacity>
                  
                  <MemoizedTouchableOpacity 
                    style={modalConfirmButtonStyle}
                    onPress={handleSetNewPassword}
                  >
                    <MemoizedText style={modalConfirmButtonTextStyle}>{strings[language].splash.done}</MemoizedText>
                  </MemoizedTouchableOpacity>
                </View>
              </>
            )}
            </Animated.View>
          </View>
        </View>
      </Modal>

      {/* Email Verification Modal */}
      <Modal
        visible={verificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseVerificationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={modalContentStyle}>
            <MemoizedText style={modalTitleStyle}>{strings[language].splash.verifyEmail}</MemoizedText>
            <MemoizedText style={modalSubtitleStyle}>
              {strings[language].splash.verifyEmailSubtitle}
            </MemoizedText>
            
            {/* Verification Code Input Grid */}
            <View style={styles.verificationCodeContainer}>
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    verificationInputRefs.current[index] = ref;
                  }}
                  style={verificationCodeInputStyle}
                  value={digit}
                  onChangeText={(text) => handleVerificationCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleVerificationCodeKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={6} // Allow paste of full code
                  textAlign="center"
                  selectTextOnFocus={true}
                  autoFocus={index === 0}
                />
              ))}
            </View>
            
            {/* Resend Code Button */}
            <MemoizedTouchableOpacity 
              style={resendButtonStyle}
              onPress={handleResendCode}
              disabled={!canResendCode || isResendingCode}
            >
              <MemoizedText style={resendButtonTextStyle}>
                {isResendingCode 
                  ? strings[language].splash.resendingCode 
                  : canResendCode 
                    ? strings[language].splash.resendCode
                    : `${strings[language].splash.resendCode} (${resendCountdown}s)`
                }
              </MemoizedText>
            </MemoizedTouchableOpacity>
            
            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <MemoizedTouchableOpacity 
                style={modalCancelButtonStyle}
                onPress={handleCloseVerificationModal}
              >
                <MemoizedText style={modalCancelButtonTextStyle}>{strings[language].splash.cancel}</MemoizedText>
              </MemoizedTouchableOpacity>
              
              <MemoizedTouchableOpacity 
                style={[modalConfirmButtonStyle, isVerifying && { backgroundColor: Colors[theme].unselectedText, opacity: 0.6 }]}
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                <MemoizedText style={modalConfirmButtonTextStyle}>
                  {isVerifying ? strings[language].splash.verifying : strings[language].splash.verify}
                </MemoizedText>
              </MemoizedTouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <View style={loadingOverlayStyle}>
          <View style={loadingAnimationContainerStyle}>
            <LottieView
              ref={loadingOverlayRef}
              source={loadingAnimationSource}
              autoPlay
              loop={true}
              style={styles.loadingAnimation}
              speed={1}
              cacheComposition={true}
              renderMode="HARDWARE"
              onAnimationFailure={(error) => {
                console.error('Loading overlay animation failed to load:', error);
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  animation: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoAnimation: {
    width: 200, // Adjust size as needed
    height: 200, // Adjust size as needed
  },
  loadingTextContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  signInContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  whiteContainer: {
    width: '90%', // 90% of screen width
    height: height * 0.85, // 80% of screen height
    opacity: 0.95, // 95% opacity
    borderRadius: 30, // 30px corner radius
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 16, // 16px horizontal margin
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  toggleOption: {
    marginHorizontal: 20,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 20,
    paddingVertical: 8,
    fontFamily: 'Satoshi-Medium',
  },

  underline: {
    height: 3,
    width: '200%', // Slightly wider than text
    marginTop: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 12,
    padding: 5,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  signInButton: {
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  signInButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  forgotPasswordText: {
    fontSize: 16,
  },
  signInWithText: {
    fontSize: 16,
    marginBottom: 16,
  },
  socialLoginContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  socialLoginButton: {
    width: '90%',
    height: 50,
    borderWidth: 2,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialLoginButtonDisabled: {
    opacity: 0.6,
    borderColor: '#9CA3AF',
  },
  socialLoginText: {
    fontSize: 16,
  },
  iconContainer: {
    width: '20%', // 1/8 of the width
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1, // Takes remaining space
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    textAlign: 'center'
  },
  modalConfirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalConfirmButtonText: {
    fontSize: 16,
  },
  // Verification code modal styles
  verificationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  verificationCodeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendButton: {
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000, // Higher than modals
  },
  loadingAnimationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 96, // Same size as the animation
    height: 96,
  },
}); 