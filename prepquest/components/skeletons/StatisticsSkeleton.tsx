import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface StatisticsSkeletonProps {
  topOffset?: number;
}

const PlaceholderCard = ({
  shimmerOpacity,
  children,
  style,
}: {
  shimmerOpacity: Animated.AnimatedInterpolation<string | number>;
  children?: React.ReactNode;
  style?: any;
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <View style={[styles.card, style, { backgroundColor: colors.secondaryShade }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmerOverlay,
          {
            opacity: shimmerOpacity,
            backgroundColor: colors.background,
          },
        ]}
      />
      {children}
    </View>
  );
};

export const StatisticsSkeleton = React.memo(({ topOffset = 0 }: StatisticsSkeletonProps) => {
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
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: topOffset + 20, paddingBottom: 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PlaceholderCard shimmerOpacity={shimmerOpacity} style={styles.togglePlaceholder}>
          <View style={styles.toggleInner}>
            <View style={[styles.togglePill, { backgroundColor: colors.unselectedText }]} />
            <View style={[styles.togglePill, { backgroundColor: colors.unselectedText, opacity: 0.4 }]} />
          </View>
        </PlaceholderCard>

        <PlaceholderCard shimmerOpacity={shimmerOpacity} style={styles.largeSection}>
          <View style={styles.cardContent}>
            <View style={[styles.line, { width: '45%', backgroundColor: colors.unselectedText }]} />
            <View style={[styles.line, { width: '70%', marginTop: 12, backgroundColor: colors.unselectedText, opacity: 0.8 }]} />
            <View style={[styles.line, { width: '60%', marginTop: 12, backgroundColor: colors.unselectedText, opacity: 0.6 }]} />
          </View>
        </PlaceholderCard>

        <PlaceholderCard shimmerOpacity={shimmerOpacity} style={styles.mediumSection}>
          <View style={styles.cardContent}>
            <View style={[styles.line, { width: '40%', backgroundColor: colors.unselectedText }]} />
            <View style={styles.multiLineRow}>
              <View style={[styles.block, { backgroundColor: colors.unselectedText }]} />
              <View style={[styles.block, { backgroundColor: colors.unselectedText, opacity: 0.65 }]} />
            </View>
            <View style={styles.multiLineRow}>
              <View style={[styles.block, { backgroundColor: colors.unselectedText, opacity: 0.4 }]} />
              <View style={[styles.block, { backgroundColor: colors.unselectedText, opacity: 0.25 }]} />
            </View>
          </View>
        </PlaceholderCard>

        <PlaceholderCard shimmerOpacity={shimmerOpacity} style={styles.detailsSection}>
          <View style={styles.cardContent}>
            <View style={[styles.line, { width: '50%', backgroundColor: colors.unselectedText }]} />
            <View style={styles.metricRow}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={`metric-${index}`} style={styles.metricCard}>
                  <View style={[styles.metricLine, { backgroundColor: colors.unselectedText }]} />
                  <View style={[styles.metricLine, { width: '60%', backgroundColor: colors.unselectedText, opacity: 0.6, marginTop: 10 }]} />
                </View>
              ))}
            </View>
          </View>
        </PlaceholderCard>

        <PlaceholderCard shimmerOpacity={shimmerOpacity} style={styles.performanceSection}>
          <View style={styles.cardContent}>
            <View style={[styles.line, { width: '52%', backgroundColor: colors.unselectedText }]} />
            <View style={[styles.line, { width: '34%', marginTop: 12, backgroundColor: colors.unselectedText, opacity: 0.7 }]} />
            <View style={[styles.line, { width: '42%', marginTop: 12, backgroundColor: colors.unselectedText, opacity: 0.45 }]} />
          </View>
        </PlaceholderCard>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    pointerEvents: 'auto',
  },
  contentContainer: {
    paddingHorizontal: 16,
    gap: 18,
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
  togglePlaceholder: {
    height: 64,
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  toggleInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  togglePill: {
    height: 32,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  largeSection: {
    height: 280,
  },
  mediumSection: {
    height: 220,
    paddingVertical: 20,
  },
  detailsSection: {
    paddingVertical: 24,
  },
  performanceSection: {
    paddingVertical: 28,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  line: {
    height: 16,
    borderRadius: 8,
  },
  multiLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  block: {
    flex: 1,
    height: 18,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  metricCard: {
    flex: 1,
    height: 110,
    borderRadius: 18,
    marginHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLine: {
    height: 16,
    width: '80%',
    borderRadius: 8,
  },
});


