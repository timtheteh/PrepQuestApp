import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import GreenTickIcon from '@/assets/icons/generalIcons/GreenTickIcon.svg';
import { Fonts } from '@/constants/Fonts';

interface CustomBadgeNotificationProps {
  badgeSubtext: string;
  visible: boolean;
  onDismiss: () => void;
  topOffset?: number;
  onLayout?: (height: number) => void;
}

export const CustomBadgeNotification: React.FC<CustomBadgeNotificationProps> = ({
  badgeSubtext,
  visible,
  onDismiss,
  topOffset = 0,
  onLayout
}) => {
  const { language } = useLanguage();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
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
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          top: 60 + topOffset,
        }
      ]}
      onLayout={(event) => {
        if (onLayout) {
          onLayout(event.nativeEvent.layout.height);
        }
      }}
    >
      <View style={styles.notification}>
        <View style={styles.content}>
          <GreenTickIcon width={24} height={24} style={styles.icon} />
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {strings[language].customBadgeNotification.congratulations}
            </Text>
            <Text style={styles.message}>
              {strings[language].customBadgeNotification.message}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10000,
    elevation: 10000,
  },
  notification: {
    backgroundColor: '#44B88A',
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
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
    fontFamily: Fonts.bodyBold,
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

