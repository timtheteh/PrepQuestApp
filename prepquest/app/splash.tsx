import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ScrollView, TouchableOpacity, TextInput, Platform, Animated, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import PrepQuestLogo from '@/assets/icons/PrepQuestLogo.svg';
import GoogleLoginIcon from '@/assets/icons/GoogleLoginIcon.svg';
import AppleLoginIcon from '@/assets/icons/AppleLoginIcon.svg';
import FacebookLoginIcon from '@/assets/icons/FacebookLoginIcon.svg';
import { Feather } from '@expo/vector-icons';
import { Toast } from '@/components/Toast';


const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  isDatabaseReady?: boolean;
  onAuthComplete?: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  error: string | null;
  clearError: () => void;
}

export default function SplashScreen({ 
  isDatabaseReady = false, 
  onAuthComplete,
  signIn,
  signUp,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  resetPassword,
  error,
  clearError
}: SplashScreenProps) {
  const animationRef = useRef<LottieView>(null);
  const logoAnimationRef = useRef<LottieView>(null);
  const [isSignIn, setIsSignIn] = useState(true); // true for Sign In, false for Sign Up
  const [showPassword, setShowPassword] = useState(false); // false = hidden, true = visible
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Forgot password modal state
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Animation state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toggleFadeAnim = useRef(new Animated.Value(1)).current;

  // Validation function
  const validateSignUp = () => {
    // Check if fields are empty
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setToastMessage('Fill up both email and password');
      setToastVisible(true);
      return false;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setToastMessage('Passwords don\'t match');
      setToastVisible(true);
      return false;
    }
    
    return true;
  };

  const handleSignUp = async () => {
    if (validateSignUp()) {
      clearError();
      
      const result = await signUp(email.trim(), password);
      
      if (result.success) {
        setToastMessage('Account created successfully!');
        setToastVisible(true);
        // Call onAuthComplete after successful sign up
        setTimeout(() => {
          onAuthComplete?.();
        }, 1000);
      } else {
        setToastMessage(result.error || 'Sign up failed');
        setToastVisible(true);
        
        // If user already exists, suggest switching to sign in
        if (result.error?.includes('sign in instead')) {
          // Small delay to show the error message first
          setTimeout(() => {
            // setToastMessage('Switch to Sign In tab to access your account');
            // setToastVisible(true);
            // Optionally auto-switch to sign in tab
            setTimeout(() => {
              handleToggle(true);
            }, 500);
          }, 500);
        }
      }
    }
  };

  const handleSignIn = async () => {
    // Check if fields are empty
    if (!email.trim() || !password.trim()) {
      setToastMessage('Fill up both email and password');
      setToastVisible(true);
      return;
    }
    
    clearError();
    
    const result = await signIn(email.trim(), password);
    
    if (result.success) {
      // setToastMessage('Signed in successfully!');
      // setToastVisible(true);
      // Call onAuthComplete after successful sign in
      setTimeout(() => {
        onAuthComplete?.();
      }, 1000);
    } else {
      setToastMessage(result.error || 'Sign in failed');
      setToastVisible(true);
      
      // If user doesn't exist, suggest switching to sign up
      if (result.error?.includes('Sign up first')) {
        // Small delay to show the error message first
        setTimeout(() => {
          // setToastMessage('Switch to Sign Up tab to create an account');
          // setToastVisible(true);
          // Optionally auto-switch to sign up tab with fade animation
          setTimeout(() => {
            handleToggle(false);
          }, 500);
        }, 500);
      }
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    clearError();
    
    let result;
    switch (provider) {
      case 'google':
        result = await signInWithGoogle();
        break;
      case 'facebook':
        result = await signInWithFacebook();
        break;
      case 'apple':
        result = await signInWithApple();
        break;
    }
    
    if (result?.success) {
      // setToastMessage('Signed in successfully!');
      // setToastVisible(true);
      // Call onAuthComplete after successful social login
      setTimeout(() => {
        onAuthComplete?.();
      }, 1000);
    } else {
      setToastMessage(result?.error || 'Social login failed');
      setToastVisible(true);
    }
  };

  useEffect(() => {
    // Ensure animations start playing
    if (animationRef.current) {
      animationRef.current.play();
    }
    if (logoAnimationRef.current) {
      logoAnimationRef.current.play();
    }
  }, []);

  // Fade in animation when database is ready
  useEffect(() => {
    if (isDatabaseReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800, // 800ms fade in
        useNativeDriver: true,
      }).start();
    }
  }, [isDatabaseReady, fadeAnim]);



  // Show auth error in toast
  useEffect(() => {
    if (error) {
      setToastMessage(error);
      setToastVisible(true);
    }
  }, [error]);

  // Handle toggle between sign in and sign up with fade animation
  const handleToggle = (newIsSignIn: boolean) => {
    if (newIsSignIn !== isSignIn) {
      // Fade out
      Animated.timing(toggleFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Change state
        setIsSignIn(newIsSignIn);
        // Clear form fields
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        // Fade in
        Animated.timing(toggleFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(true);
    setForgotPasswordEmail('');
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!forgotPasswordEmail.trim()) {
      setToastMessage('Please enter your email address');
      setToastVisible(true);
      return;
    }

    setIsResettingPassword(true);
    clearError();

    const result = await resetPassword(forgotPasswordEmail.trim());

    if (result.success) {
      setToastMessage('Password reset email sent! Check your inbox.');
      setToastVisible(true);
      setForgotPasswordModalVisible(false);
      setForgotPasswordEmail('');
    } else {
      setToastMessage(result.error || 'Failed to send reset email');
      setToastVisible(true);
    }

    setIsResettingPassword(false);
  };

  return (
    <View style={styles.container}>
      {/* Background animation that fills the screen */}
      <LottieView
        ref={animationRef}
        source={require('../assets/animations/SplashScreenAnimation.json')}
        autoPlay
        loop={true}
        style={styles.animation}
        resizeMode="cover"
        onAnimationFailure={(error) => {
          console.error('Background animation failed to load:', error);
        }}
      />
      
      {/* Toast component */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
        duration={3000}
      />
      
      {/* Show sign in/signup screen when database is ready */}
      {isDatabaseReady ? (
        <Animated.View style={[styles.signInContainer, { opacity: fadeAnim }]}>
          {/* White rectangle container */}
          <View style={styles.whiteContainer}>
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
                <TouchableOpacity 
                  style={styles.toggleOption}
                  onPress={() => handleToggle(true)}
                >
                  <Text style={[
                    styles.toggleText,
                    isSignIn ? styles.toggleTextActive : styles.toggleTextInactive
                  ]}>
                    Sign In
                  </Text>
                  {isSignIn && <View style={styles.underline} />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.toggleOption}
                  onPress={() => handleToggle(false)}
                >
                  <Text style={[
                    styles.toggleText,
                    !isSignIn ? styles.toggleTextActive : styles.toggleTextInactive
                  ]}>
                    Sign Up
                  </Text>
                  {!isSignIn && <View style={styles.underline} />}
                </TouchableOpacity>
              </View>
              
              {/* Animated content that changes between sign in and sign up */}
              <Animated.View style={{ opacity: toggleFadeAnim, width: '100%' }}>
                {/* Welcome text for sign in/sign up state */}
                {isSignIn ? (
                  <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>Welcome back!</Text>
                  </View>
                ) : (
                  <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>Welcome Aboard!</Text>
                  </View>
                )}
                
                {/* Input fields - visible in both sign in and sign up states */}
                <View style={styles.inputContainer}>
                  {/* Email/Username input */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email"
                      placeholderTextColor="#D5D4DD"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                  
                  {/* Password input */}
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Password"
                      placeholderTextColor="#D5D4DD"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather 
                        name={showPassword ? 'eye' : 'eye-off'} 
                        size={20} 
                        color="#000"
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Confirm Password input - only in sign up state */}
                  {!isSignIn && (
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Confirm Password"
                        placeholderTextColor="#D5D4DD"
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Feather 
                          name={showPassword ? 'eye' : 'eye-off'} 
                          size={20} 
                          color="#000"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {/* Sign In/Sign Up button */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.signInButton}
                    onPress={isSignIn ? handleSignIn : handleSignUp}
                  >
                    <Text style={styles.signInButtonText}>
                      {isSignIn ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Forgot Password text - visible in both states */}
                {isSignIn && (
                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                )}
              </Animated.View>
              
              {/* Social login section - visible in both states */}
              <View style={styles.forgotPasswordContainer}>
                <Text style={styles.signInWithText}>
                  {isSignIn ? 'Or Sign In With' : 'Or Sign Up With'}
                </Text>
                
                {/* Social login buttons */}
                <View style={styles.socialLoginContainer}>
                  {/* Google login */}
                  <TouchableOpacity 
                    style={styles.socialLoginButton}
                    onPress={() => handleSocialLogin('google')}
                  >
                    <View style={styles.iconContainer}>
                      <GoogleLoginIcon width={24} height={24} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.socialLoginText}>Continue with Google</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Apple login - only on iOS */}
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity 
                      style={styles.socialLoginButton}
                      onPress={() => handleSocialLogin('apple')}
                    >
                      <View style={styles.iconContainer}>
                        <AppleLoginIcon width={24} height={24} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.socialLoginText}>Continue with Apple</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {/* Facebook login */}
                  <TouchableOpacity 
                    style={styles.socialLoginButton}
                    onPress={() => handleSocialLogin('facebook')}
                  >
                    <View style={styles.iconContainer}>
                      <FacebookLoginIcon width={24} height={24} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.socialLoginText}>Continue with Facebook</Text>
                    </View>
                  </TouchableOpacity>
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
              source={require('../assets/animations/splashScreenLogoAnimation.json')}
              autoPlay
              loop={false}
              style={styles.logoAnimation}
              onAnimationFailure={(error) => {
                console.error('Logo animation failed to load:', error);
              }}
            />
          </View>

          {/* Optional: Add a loading text in case animation fails */}
          <View style={styles.loadingTextContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </>
      )}

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              placeholderTextColor="#D5D4DD"
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setForgotPasswordModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalConfirmButton, isResettingPassword && styles.modalConfirmButtonDisabled]}
                onPress={handlePasswordReset}
                disabled={isResettingPassword}
              >
                <Text style={styles.modalConfirmButtonText}>
                  {isResettingPassword ? 'Sending...' : 'Send Email'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background to match the animation
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
    color: '#fff',
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
  },
  whiteContainer: {
    width: '90%', // 90% of screen width
    height: height * 0.8, // 80% of screen height
    backgroundColor: '#fff',
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
  toggleTextActive: {
    color: '#000000', // Black text for active state
  },
  toggleTextInactive: {
    color: '#D5D4DD', // Light gray text for inactive state
  },
  underline: {
    height: 3,
    backgroundColor: '#6366F1', // Purple underline
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
    fontFamily: 'Satoshi-Variable',
    color: '#000000',
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
    borderColor: '#D5D4DD',
    borderRadius: 30,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    color: '#000000',
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
    backgroundColor: '#4F41D8',
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  signInButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  forgotPasswordText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    color: '#000', // Same purple as button for consistency
  },
  signInWithText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    color: '#000', // Same purple as button for consistency
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
    borderColor: '#D5D4DD',
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
    fontFamily: 'Satoshi-Variable',
    color: '#000000',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalInput: {
    height: 50,
    borderWidth: 2,
    borderColor: '#D5D4DD',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    color: '#000000',
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
    borderColor: '#D5D4DD',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#666',
    textAlign: 'center'
  },
  modalConfirmButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#4F41D8',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#FFFFFF',
  },
}); 