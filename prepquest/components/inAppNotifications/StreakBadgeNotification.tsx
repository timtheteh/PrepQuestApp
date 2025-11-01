import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';

interface StreakBadgeNotificationProps {
  badgeName: string;
  badgeSubtext: string;
  dayStreakRequirement: number;
  visible: boolean;
  onDismiss: () => void;
}

export const StreakBadgeNotification: React.FC<StreakBadgeNotificationProps> = ({ 
  badgeName,
  badgeSubtext,
  dayStreakRequirement,
  visible,
  onDismiss
}) => {
  const { language } = useLanguage();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(`🎖️ StreakBadgeNotification: visible = ${visible}, badgeName = ${badgeName}`);
    if (visible) {
      console.log('🎖️ Showing streak badge notification');
      // Show notification
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Don't auto-hide - notification stays until user dismisses it
      // Removed auto-hide timer to keep notification persistent
    } else {
      // Reset animations when hidden
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  console.log(`🎖️ StreakBadgeNotification render: visible = ${visible}, badgeName = ${badgeName}`);
  
  if (!visible) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <View style={styles.notification}>
        <View style={styles.content}>
          <GreenTickIcon width={24} height={24} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {strings[language].streakBadgeNotification.congratulations}
            </Text>
            <Text style={styles.message}>
              {strings[language].streakBadgeNotification.message
                .replace('{dayStreak}', dayStreakRequirement.toString())
                .replace('{badgeName}', badgeName)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={hideNotification}>
          <Text style={styles.dismissButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10000,
    elevation: 10000,
  },
  notification: {
    backgroundColor: '#44B88A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

