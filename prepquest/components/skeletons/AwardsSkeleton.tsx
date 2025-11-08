import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface AwardsSkeletonProps {
  topOffset?: number;
}

export const AwardsSkeleton = React.memo(({ topOffset = 0 }: AwardsSkeletonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = useMemo(
    () =>
      shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.6],
      }),
    [shimmerAnim]
  );

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: topOffset + 20, paddingBottom: 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, styles.toggleCard, { backgroundColor: colors.secondaryShade }]}>
          <Animated.View pointerEvents="none" style={[styles.shimmerOverlay, { opacity: shimmerOpacity, backgroundColor: colors.background }]} />
          <View style={styles.toggleInner}>
            <View style={[styles.togglePill, { backgroundColor: colors.unselectedText }]} />
            <View style={[styles.togglePill, { backgroundColor: colors.unselectedText, opacity: 0.35 }]} />
          </View>
        </View>

        <View style={[styles.card, styles.sectionCard, { backgroundColor: colors.secondaryShade }]}>
          <Animated.View pointerEvents="none" style={[styles.shimmerOverlay, { opacity: shimmerOpacity, backgroundColor: colors.background }]} />
          <View style={styles.sectionContent}>
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '68%' }]} />
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '80%', opacity: 0.6 }]} />
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '60%', opacity: 0.4 }]} />
          </View>
        </View>

        <View style={[styles.card, styles.sectionCard, { backgroundColor: colors.secondaryShade }]}>
          <Animated.View pointerEvents="none" style={[styles.shimmerOverlay, { opacity: shimmerOpacity, backgroundColor: colors.background }]} />
          <View style={styles.sectionContent}>
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '55%' }]} />
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '70%', opacity: 0.6 }]} />
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '52%', opacity: 0.4 }]} />
          </View>
        </View>

        <View style={[styles.card, styles.sectionCard, { backgroundColor: colors.secondaryShade }]}>
          <Animated.View pointerEvents="none" style={[styles.shimmerOverlay, { opacity: shimmerOpacity, backgroundColor: colors.background }]} />
          <View style={styles.sectionContent}>
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '48%' }]} />
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '62%', opacity: 0.6 }]} />
            <View style={[styles.line, { backgroundColor: colors.unselectedText, width: '58%', opacity: 0.4 }]} />
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    pointerEvents: 'auto',
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 24,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  toggleCard: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  toggleInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  togglePill: {
    flex: 1,
    height: 36,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  sectionCard: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 10,
    minHeight: 110,
  },
  sectionContent: {
    gap: 8,
  },
  line: {
    height: 14,
    borderRadius: 8,
  },
});

