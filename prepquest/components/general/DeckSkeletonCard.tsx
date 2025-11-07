import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DeckSkeletonCardProps {
  style?: any;
}

export const DeckSkeletonCard = React.memo(({ style }: DeckSkeletonCardProps) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create looping shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.shadowContainer, { width: '97%' }]}>
        <View style={[styles.card, { backgroundColor: Colors[theme].secondaryShade }]}>
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerOpacity,
                backgroundColor: Colors[theme].background,
              },
            ]}
          />
          {/* Content placeholder */}
          <View style={styles.content}>
            <View style={[styles.titlePlaceholder, { backgroundColor: Colors[theme].unselectedText }]} />
            <View style={[styles.titlePlaceholder2, { backgroundColor: Colors[theme].unselectedText }]} />
            <View style={styles.middleRow}>
              <View style={[styles.datePlaceholder, { backgroundColor: Colors[theme].unselectedText }]} />
              <View style={[styles.countPlaceholder, { backgroundColor: Colors[theme].unselectedText }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: '6%',
  },
  firstCard: {
    marginTop: 5,
  },
  shadowContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
    }),
  },
  card: {
    height: 124,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    margin: 10,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  titlePlaceholder: {
    height: 18,
    width: '70%',
    borderRadius: 4,
    marginBottom: 6,
  },
  titlePlaceholder2: {
    height: 18,
    width: '50%',
    borderRadius: 4,
    marginBottom: 12,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 8,
  },
  datePlaceholder: {
    height: 12,
    width: '35%',
    borderRadius: 4,
  },
  countPlaceholder: {
    height: 12,
    width: '25%',
    borderRadius: 4,
  },
});

