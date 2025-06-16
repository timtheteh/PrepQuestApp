import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useState, useRef } from 'react';
import { ThemedText } from '@/components/ThemedText';
import LightSwitchBody from '@/assets/icons/lightSwitchBody.svg';
import DarkSwitchBody from '@/assets/icons/darkSwitchBody.svg';
import LightSwitch from '@/assets/icons/lightSwitch.svg';
import DarkSwitch from '@/assets/icons/darkSwitch.svg';

export default function AccountScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 60;

  // For button animation
  const buttonAnim = useRef(new Animated.Value(1)).current; // 1 = right (light), 0 = left (dark)

  const handleToggle = () => {
    setIsDarkMode((prev) => !prev);
    Animated.timing(buttonAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
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

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={[styles.topBar, { paddingTop: topPadding }]}> 
        <TouchableOpacity>
          <Text style={styles.signOutText}>Sign Out</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  signOutText: {
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 20,
    color: '#000',
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
}); 