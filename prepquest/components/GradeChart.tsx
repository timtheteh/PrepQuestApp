import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, Animated, TouchableOpacity, ScrollView, Text, Platform } from 'react-native';
import Svg, { Line, Rect as SvgRect, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SmallGreenBinaryToggle } from './SmallGreenBinaryToggle';

// Example data for bar chart
const data = [
  { day: 'Mon', date: '18 Mar 2024', score: 85 },
  { day: 'Tue', date: '19 Mar 2024', score: 72 },
  { day: 'Wed', date: '20 Mar 2024', score: 90 },
  { day: 'Thu', date: '21 Mar 2024', score: 60 },
  { day: 'Fri', date: '22 Mar 2024', score: 95 },
  { day: 'Sat', date: '23 Mar 2024', score: 78 },
  { day: 'Sun', date: '24 Mar 2024', score: 88 },
  { day: 'Mon', date: '25 Mar 2024', score: 92 },
  { day: 'Tue', date: '26 Mar 2024', score: 70 },
  { day: 'Wed', date: '27 Mar 2024', score: 80 },
  { day: 'Thu', date: '28 Mar 2024', score: 65 },
  { day: 'Fri', date: '29 Mar 2024', score: 77 },
  { day: 'Sat', date: '30 Mar 2024', score: 99 },
  { day: 'Sun', date: '31 Mar 2024', score: 85 },
  { day: 'Mon', date: '1 Apr 2024', score: 55 },
  { day: 'Tue', date: '2 Apr 2024', score: 68 },
];

const month_data = [
  { month: 'Mar 2024', score: 82 },
  { month: 'Apr 2024', score: 75 },
  { month: 'May 2024', score: 90 },
  { month: 'Jun 2024', score: 60 },
];

const GRAPH_HEIGHT = 280;
const PADDING = 32;
const X_AXIS_LABEL_GAP = -5;
const X_AXIS_DATE_GAP = 2;
const X_AXIS_EXTRA_HEIGHT = 28;
const BAR_WIDTH = 45;
const BAR_COLOR = '#CAC6F3';
const BAR_RADIUS = 10;

type GradeChartProps = {
  onContentReady?: () => void;
};

export function GradeChart({ onContentReady }: GradeChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const GRAPH_WIDTH = Math.round(windowWidth * 0.93);
  const X_STEP = (GRAPH_WIDTH - 2 * PADDING) / 3 - 16;
  const SVG_HEIGHT = GRAPH_HEIGHT + X_AXIS_EXTRA_HEIGHT;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMonth, setIsMonth] = useState(false);
  const [pendingFadeIn, setPendingFadeIn] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const graphFadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Use correct data
  const currentData = isMonth ? month_data : data;

  // Calculate total width needed for all data points
  const totalWidth = Math.max(
    GRAPH_WIDTH,
    PADDING + (currentData.length - 1) * X_STEP + PADDING
  );

  // Y axis is always 0-100
  const Y_MAX = 100;
  const Y_STEP = 25;

  function getY(value: number, graphHeight: number) {
    // Invert y for SVG
    const usableHeight = graphHeight - 2 * PADDING;
    return PADDING + usableHeight - (value / Y_MAX) * usableHeight;
  }

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: selectedIndex !== null ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  // Fade animation for graph when toggling day/month
  const handleToggle = (val: boolean) => {
    Animated.timing(graphFadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsMonth(val);
      if (!val) {
        // If switching to day view, delay fade-in until content is rendered
        setPendingFadeIn(true);
      } else {
        // If switching to month view, fade in immediately
        Animated.timing(graphFadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  // Only fade in after ScrollView content is rendered when switching to day view
  const handleContentSizeChange = () => {
    if (scrollViewRef.current) {
      const scrollToX = totalWidth - GRAPH_WIDTH + PADDING;
      scrollViewRef.current.scrollTo({ x: scrollToX, animated: false });
    }
    if (pendingFadeIn) {
      setTimeout(() => {
        Animated.timing(graphFadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
        setPendingFadeIn(false);
        if (onContentReady) onContentReady();
      }, Platform.OS === 'android' ? 20 : 0);
    } else {
      if (onContentReady) onContentReady();
    }
  };

  // Bar chart rendering
  const renderBars = (getX: (i: number) => number) =>
    currentData.map((d, i: number) => {
      const barX = getX(i) - BAR_WIDTH / 2;
      const barY = getY(d.score, GRAPH_HEIGHT);
      const barBottomY = getY(0, GRAPH_HEIGHT);
      const barHeight = barBottomY - barY;
      return (
        <G key={`bar-${i}`}>
          {/* Bar */}
          <SvgRect
            x={barX}
            y={barY}
            width={BAR_WIDTH}
            height={barHeight}
            fill={BAR_COLOR}
            rx={BAR_RADIUS}
            ry={BAR_RADIUS}
          />
          {/* Value label above bar */}
          <SvgText
            x={getX(i)-5}
            y={barY - 10}
            fontSize={14}
            fill="#4F41D8"
            fontFamily="Satoshi-Variable"
            fontWeight="700"
            textAnchor="middle"
          >
            {d.score}%
          </SvgText>
        </G>
      );
    });

  const handleDataPointClick = (index: number) => {
    setSelectedIndex(index);
  };

  // For the fixed (non-scrollable) case, call onContentReady after mount
  useEffect(() => {
    if (currentData.length <= 4 && onContentReady) {
      onContentReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData.length <= 4]);

  return (
    <View>
      {/* Fixed header with title and toggle */}
      <View style={{ marginTop: 0, alignItems: 'center', zIndex: 2 }}>
        <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center', lineHeight: 30 }}>
          Grade Chart (%)
        </Text>
        <SmallGreenBinaryToggle
          leftLabel="Day"
          rightLabel="Month"
          style={{ marginTop: 15 }}
          onToggle={handleToggle}
        />
      </View>
      <Animated.View
        style={{
          width: GRAPH_WIDTH,
          height: SVG_HEIGHT,
          alignSelf: 'center',
          marginLeft: 0,
          marginTop: 10,
          zIndex: 1,
          opacity: graphFadeAnim,
        }}
      >
        {/* Fixed elements */}
        <Svg width={GRAPH_WIDTH+10} height={SVG_HEIGHT} style={{ position: 'absolute',}}>
          {/* Y axis vertical line */}
          <Line
            x1={GRAPH_WIDTH - 32}
            x2={GRAPH_WIDTH - 32}
            y1={PADDING - 15}
            y2={GRAPH_HEIGHT - 32}
            stroke="#E5E4EA"
            strokeWidth={1}
          />
          {/* Y axis dashed lines and labels at every 25% */}
          {[0, 25, 50, 75, 100].map((y) => (
            <G key={y}>
              <Line
                x1={PADDING - 30}
                x2={GRAPH_WIDTH - PADDING}
                y1={getY(y, GRAPH_HEIGHT)}
                y2={getY(y, GRAPH_HEIGHT)}
                stroke="#E5E4EA"
                strokeDasharray={y === 0 ? undefined : '4,4'}
                strokeWidth={1}
              />
              <SvgText
                x={GRAPH_WIDTH - PADDING + 8}
                y={getY(y, GRAPH_HEIGHT) + 5}
                fontSize={12}
                fill="#D5D4DD"
                fontFamily="Satoshi-Medium"
                textAnchor="start"
              >
                {y}%
              </SvgText>
            </G>
          ))}
        </Svg>
        {/* Scrollable or fixed elements */}
        {currentData.length <= 4 ? (
          // Fixed SVG, right-aligned
          <Svg width={GRAPH_WIDTH} height={SVG_HEIGHT}>
            {/* Calculate right-aligned X positions */}
            {(() => {
              const n = currentData.length;
              const minPoints = 4;
              var step = 0;
              if (n === 2) {
                step = GRAPH_WIDTH / (n - 1) - 205;
              }
              if (n === 3) {
                step = GRAPH_WIDTH / (n - 1) - 58;
              }
              if (n === 4) {
                step = GRAPH_WIDTH / (n - 1) - 37;
              }
              var xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH - PADDING - 40 - (n - 1 - i) * step);
              if (n === 1) {
                xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH / 2 - 10);
              }
              if (n === 2) {
                xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH - PADDING - 85 - (n - 1 - i) * step);
              }
              // Helper to get x for index i
              const getX = (i: number) => xs[i];
              return (
                <>
                  {renderBars(getX)}
                  {/* X axis labels */}
                  {currentData.map((d, i) => (
                    <G key={`xaxis-${i}`}>
                      <SvgRect
                        x={getX(i) - 30}
                        y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                        width={60}
                        height={50}
                        fill="transparent"
                      />
                      {'month' in d ? (
                        <SvgText
                          x={getX(i)}
                          y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP}
                          fontSize={16}
                          fill="#D5D4DD"
                          fontFamily="Satoshi-Medium"
                          textAnchor="middle"
                        >
                          {d.month}
                        </SvgText>
                      ) : (
                        <>
                          <SvgText
                            x={getX(i)}
                            y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP}
                            fontSize={16}
                            fill="#D5D4DD"
                            fontFamily="Satoshi-Medium"
                            textAnchor="middle"
                          >
                            {d.day}
                          </SvgText>
                          <SvgText
                            x={getX(i)}
                            y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + X_AXIS_DATE_GAP + 14}
                            fontSize={12}
                            fill="#D5D4DD"
                            fontFamily="Satoshi-Medium"
                            textAnchor="middle"
                          >
                            {d.date}
                          </SvgText>
                        </>
                      )}
                    </G>
                  ))}
                </>
              );
            })()}
          </Svg>
        ) : (
          // Scrollable SVG for 4 or more points
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ width: GRAPH_WIDTH, marginLeft: -PADDING }}
            contentContainerStyle={{
              width: totalWidth + PADDING,
              paddingLeft: PADDING - 20,
            }}
            keyboardShouldPersistTaps="always"
            onContentSizeChange={handleContentSizeChange}
          >
            <Svg width={totalWidth + PADDING} height={SVG_HEIGHT}>
              {/* Bars */}
              {(() => {
                const n = currentData.length;
                const getX = (i: number) => PADDING + 10 + i * X_STEP;
                return renderBars(getX);
              })()}
              {/* X axis labels */}
              {currentData.map((d, i) => (
                <G key={`xaxis-${i}`}>
                  <SvgRect
                    x={PADDING + 10 + i * X_STEP - 30}
                    y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                    width={60}
                    height={50}
                    fill="transparent"
                  />
                  {'month' in d ? (
                    <SvgText
                      x={PADDING + 10 + i * X_STEP}
                      y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + 6}
                      fontSize={16}
                      fill="#D5D4DD"
                      fontFamily="Satoshi-Medium"
                      textAnchor="middle"
                    >
                      {d.month}
                    </SvgText>
                  ) : (
                    <>
                      <SvgText
                        x={PADDING + 10 + i * X_STEP}
                        y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP}
                        fontSize={16}
                        fill="#D5D4DD"
                        fontFamily="Satoshi-Medium"
                        textAnchor="middle"
                      >
                        {d.day}
                      </SvgText>
                      <SvgText
                        x={PADDING + 10 + i * X_STEP}
                        y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + X_AXIS_DATE_GAP + 14}
                        fontSize={12}
                        fill="#D5D4DD"
                        fontFamily="Satoshi-Medium"
                        textAnchor="middle"
                      >
                        {d.date}
                      </SvgText>
                    </>
                  )}
                </G>
              ))}
            </Svg>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
} 