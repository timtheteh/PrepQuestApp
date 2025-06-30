import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const animationRef = useRef<LottieView>(null);
  const logoAnimationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Ensure animations start playing
    if (animationRef.current) {
      animationRef.current.play();
    }
    if (logoAnimationRef.current) {
      logoAnimationRef.current.play();
    }
  }, []);

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
}); 