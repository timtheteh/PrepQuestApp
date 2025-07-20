import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ScrollView, TouchableOpacity, TextInput, Platform, Animated } from 'react-native';
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
}

export default function SplashScreen({ isDatabaseReady = false, onAuthComplete }: SplashScreenProps) {
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
  
  // Animation state
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Validation function
  const validateSignUp = () => {
    // Check if fields are empty
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setToastMessage('Fill up both email/username and password');
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

  const handleSignUp = () => {
    if (validateSignUp()) {
      // Proceed with sign up
      console.log('Sign up validation passed');
      // Add your sign up logic here
    }
  };

  const handleSignIn = () => {
    // Check if fields are empty
    if (!email.trim() || !password.trim()) {
      setToastMessage('Fill up both email/username and password');
      setToastVisible(true);
      return;
    }
    
    // Proceed with sign in
    console.log('Sign in validation passed');
    // Add your sign in logic here
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
                  onPress={() => setIsSignIn(true)}
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
                  onPress={() => setIsSignIn(false)}
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
                    placeholder="Email/Username"
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
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              
              {/* Social login section - visible in both states */}
              <View style={styles.forgotPasswordContainer}>
                <Text style={styles.signInWithText}>
                  {isSignIn ? 'Or Sign In With' : 'Or Sign Up With'}
                </Text>
                
                {/* Social login buttons */}
                <View style={styles.socialLoginContainer}>
                  {/* Google login */}
                  <TouchableOpacity style={styles.socialLoginButton}>
                    <View style={styles.iconContainer}>
                      <GoogleLoginIcon width={24} height={24} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.socialLoginText}>Continue with Google</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Apple login - only on iOS */}
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity style={styles.socialLoginButton}>
                      <View style={styles.iconContainer}>
                        <AppleLoginIcon width={24} height={24} />
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={styles.socialLoginText}>Continue with Apple</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {/* Facebook login */}
                  <TouchableOpacity style={styles.socialLoginButton}>
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
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    textAlign: 'center',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
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
    marginTop: 20,
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
}); 