import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, Animated, TouchableOpacity, ScrollView, Text, Platform } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText, G, Rect, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { SmallGreenBinaryToggle } from './SmallGreenBinaryToggle';

// Example data
const data = [
  {
    day: 'Mon',
    date: '18 Mar 2024',
    flashcards: 15,
    decks: 6,
  },
  {
    day: 'Tue',
    date: '19 Mar 2024',
    flashcards: 22,
    decks: 8,
  },
  {
    day: 'Wed',
    date: '20 Mar 2024',
    flashcards: 18,
    decks: 7,
  },
  {
    day: 'Thu',
    date: '21 Mar 2024',
    flashcards: 25,
    decks: 9,
  },
  {
    day: 'Fri',
    date: '22 Mar 2024',
    flashcards: 20,
    decks: 8,
  },
  {
    day: 'Sat',
    date: '23 Mar 2024',
    flashcards: 28,
    decks: 10,
  },
  {
    day: 'Sun',
    date: '24 Mar 2024',
    flashcards: 16,
    decks: 7,
  },
  {
    day: 'Mon',
    date: '25 Mar 2024',
    flashcards: 24,
    decks: 9,
  },
  {
    day: 'Tue',
    date: '26 Mar 2024',
    flashcards: 30,
    decks: 11,
  },
  {
    day: 'Wed',
    date: '27 Mar 2024',
    flashcards: 22,
    decks: 8,
  },
  {
    day: 'Thu',
    date: '28 Mar 2024',
    flashcards: 26,
    decks: 10,
  },
  {
    day: 'Fri',
    date: '29 Mar 2024',
    flashcards: 19,
    decks: 7,
  },
  {
    day: 'Sat',
    date: '30 Mar 2024',
    flashcards: 32,
    decks: 12,
  },
  {
    day: 'Sun',
    date: '31 Mar 2024',
    flashcards: 18,
    decks: 8,
  },
  {
    day: 'Mon',
    date: '1 Apr 2024',
    flashcards: 10,
    decks: 8,
  },
  {
    day: 'Tue',
    date: '2 Apr 2024',
    flashcards: 10,
    decks: 10,
  },
];

const month_data = [
    {
        month: 'Mar 2024',  
        flashcards: 101,
        decks: 20,
    },
    {
        month: 'Apr 2024',
        flashcards: 10,
        decks: 8,
    },
    {
        month: 'May 2024',
        flashcards: 70,
        decks: 6,
    },
    {
        month: 'Jun 2024',
        flashcards: 70,
        decks: 6,
    },
    // {
    //     month: 'Jul 2024',
    //     flashcards: 70,
    //     decks: 6,
    // }
]

const GRAPH_HEIGHT = 280;
const PADDING = 32;
const X_AXIS_LABEL_GAP = -5; // gap from bottom of graph to day label
const X_AXIS_DATE_GAP = 2; // gap between day and date label
const X_AXIS_EXTRA_HEIGHT = 28; // extra height to fit both labels

type ReviewLineGraphProps = {
  onContentReady?: () => void;
};

export function ReviewLineGraph({ onContentReady }: ReviewLineGraphProps) {
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
  const totalWidth = Math.max(GRAPH_WIDTH, PADDING + (currentData.length - 1) * X_STEP + PADDING);

  const yMaxRaw = Math.max(...currentData.map(d => Math.max(d.flashcards, d.decks)));
  const Y_MAX = Math.ceil(yMaxRaw / 10) * 10;
  const Y_STEP = isMonth ? 10 : 5;

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

  // Points for lines - using all data
//   const flashcardPoints = currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(isMonth ? d.flashcards : d.flashcards, GRAPH_HEIGHT)}`).join(' ');
//   const deckPoints = currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(isMonth ? d.decks : d.decks, GRAPH_HEIGHT)}`).join(' ');

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
    <View style={{ marginTop: 15, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center' }}>
            Decks / Flashcards Reviewed
        </Text>
        <SmallGreenBinaryToggle
            leftLabel="Day"
            rightLabel="Month"
            style={{ marginTop: 15}}
            onToggle={handleToggle}
        />
        {/* Legend Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 15, marginLeft: 30 }}>
          {/* Decks Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
            <View style={{ width: 20, height: 3, borderRadius: 10, backgroundColor: '#4F41D8' }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F41D8', marginLeft: -1 }} />
            <Text style={{ marginLeft: 6, fontFamily: 'Satoshi-Medium', fontSize: 16, color: '#4F41D8' }}>Decks</Text>
          </View>
          {/* Flashcards Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 20, height: 3, borderRadius: 10, backgroundColor: '#44B88A' }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#44B88A', marginLeft: -1 }} />
            <Text style={{ marginLeft: 6, fontFamily: 'Satoshi-Medium', fontSize: 16, color: '#44B88A' }}>Flashcards</Text>
          </View>
        </View>
    </View>
    
    <Animated.View
      style={{
        width: GRAPH_WIDTH,
        height: SVG_HEIGHT,
        alignSelf: 'center',
        marginLeft: 15,
        marginTop: -16,
        zIndex: 1,
        opacity: graphFadeAnim,
      }}
    >
      {/* Fixed elements */}
      <Svg width={GRAPH_WIDTH} height={SVG_HEIGHT} style={{ position: 'absolute',}}>
        {/* Y axis vertical line */}
        <Line
          x1={GRAPH_WIDTH - 32}
          x2={GRAPH_WIDTH - 32}
          y1={PADDING - 15}
          y2={GRAPH_HEIGHT - 32}
          stroke="#E5E4EA"
          strokeWidth={1}
        />
        {/* Y axis dashed lines and labels */}
        {Array.from({ length: Y_MAX / Y_STEP + 1 }, (_, i) => i * Y_STEP).map((y) => (
          <G key={y}>
            <Line
              x1={PADDING - 30}
              x2={GRAPH_WIDTH - PADDING}
              y1={getY(y, GRAPH_HEIGHT)}
              y2={getY(y, GRAPH_HEIGHT)}
              stroke="#E5E4EA"
              strokeDasharray={y === 0 ? undefined : y % Y_STEP === 0 ? '4,4' : undefined}
              strokeWidth={1}
            />
            {y % 10 === 0 && (
              <SvgText
                x={GRAPH_WIDTH - PADDING + 8}
                y={getY(y, GRAPH_HEIGHT) + 5}
                fontSize={isMonth ? 12 : 16}
                fill="#D5D4DD"
                fontFamily="Satoshi-Medium"
                textAnchor="start"
              >
                {y}
              </SvgText>
            )}
          </G>
        ))}
      </Svg>

      {/* Scrollable or fixed elements */}
      {currentData.length <= 4 ? (
        // Fixed SVG, right-aligned
        <Svg width={GRAPH_WIDTH} height={SVG_HEIGHT}>
          {/* Gradient Defs */}
          <Defs>
            <LinearGradient id="flashcardGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#5CFFBE" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="deckGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#5C4BFF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Calculate right-aligned X positions */}
          {(() => {
            const n = currentData.length;
            const minPoints = 4;
            var step = 0
            if (n=== 2) {
                step = (GRAPH_WIDTH ) / (n-1) - 110;
            }
            if (n=== 3) {
                step = (GRAPH_WIDTH ) / (n-1) - 58;
            }
            if (n=== 4) {
                step = (GRAPH_WIDTH ) / (n-1) - 37;
            }
            var xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH - PADDING - 40 - (n - 1 - i) * step);
            if (n === 1){
                xs =Array.from({ length: n }, (_, i) => GRAPH_WIDTH / 2 - 10)
            }
            // Helper to get x for index i
            const getX = (i: number) => xs[i];
            // Polygon for flashcards area
            const flashPoly = [
              ...currentData.map((d, i) => `${getX(i)},${getY(d.flashcards, GRAPH_HEIGHT)}`),
              `${getX(n - 1)},${GRAPH_HEIGHT-30}`,
              `${getX(0)},${GRAPH_HEIGHT-30}`
            ].join(' ');
            // Polygon for decks area
            const deckPoly = [
              ...currentData.map((d, i) => `${getX(i)},${getY(d.decks, GRAPH_HEIGHT)}`),
              `${getX(n - 1)},${GRAPH_HEIGHT-30}`,
              `${getX(0)},${GRAPH_HEIGHT-30}`
            ].join(' ');
            return (
              <>
                {/* Flashcards faded area */}
                <Polygon points={flashPoly} fill="url(#flashcardGradient)" stroke="none" />
                {/* Decks faded area */}
                <Polygon points={deckPoly} fill="url(#deckGradient)" stroke="none" />
                {/* Flashcards value labels */}
                {currentData.map((d, i) => (
                  <SvgText
                    key={`fc-label-${i}`}
                    x={getX(i)}
                    y={getY(d.flashcards, GRAPH_HEIGHT) - 12}
                    fontSize={12}
                    fill="#44B88A"
                    fontFamily="Satoshi-Bold"
                    textAnchor="middle"
                  >
                    {d.flashcards}
                  </SvgText>
                ))}
                {/* Decks value labels */}
                {currentData.map((d, i) => (
                  <SvgText
                    key={`deck-label-${i}`}
                    x={getX(i)}
                    y={getY(d.decks, GRAPH_HEIGHT) - 12}
                    fontSize={12}
                    fill="#4F41D8"
                    fontFamily="Satoshi-Bold"
                    textAnchor="middle"
                  >
                    {d.decks}
                  </SvgText>
                ))}
                {/* Flashcards line and area */}
                <Polyline
                  points={currentData.map((d, i) => `${getX(i)},${getY(d.flashcards, GRAPH_HEIGHT)}`).join(' ')}
                  fill="none"
                  stroke="#44B88A"
                  strokeWidth={2}
                />
                {/* Decks line */}
                <Polyline
                  points={currentData.map((d, i) => `${getX(i)},${getY(d.decks, GRAPH_HEIGHT)}`).join(' ')}
                  fill="none"
                  stroke="#4F41D8"
                  strokeWidth={2}
                />
                {/* Flashcards circles */}
                {currentData.map((d, i) => (
                  <G key={`fc-${i}`}>
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.flashcards, GRAPH_HEIGHT)}
                      r={30}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.flashcards, GRAPH_HEIGHT)}
                      r={7}
                      fill="#44B88A"
                    />
                  </G>
                ))}
                {/* Decks circles */}
                {currentData.map((d, i) => (
                  <G key={`deck-${i}`}>
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.decks, GRAPH_HEIGHT)}
                      r={30}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.decks, GRAPH_HEIGHT)}
                      r={7}
                      fill="#4F41D8"
                    />
                  </G>
                ))}
                {/* X axis labels */}
                {currentData.map((d, i) => (
                  <G key={`xaxis-${i}`}>
                    <Rect
                      x={getX(i) - 30}
                      y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                      width={60}
                      height={50}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    {'month' in d ? (
                      <SvgText
                        x={getX(i)}
                        y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP }
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
          onContentSizeChange={handleContentSizeChange}
        >
          <Svg width={totalWidth + PADDING} height={SVG_HEIGHT}>
            {/* Gradient Defs */}
            <Defs>
              <LinearGradient id="flashcardGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#5CFFBE" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="deckGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#5C4BFF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {/* Flashcards faded area */}
            <Polygon
              points={
                [
                  ...currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.flashcards, GRAPH_HEIGHT)}`),
                  `${PADDING + 10 + (currentData.length - 1) * X_STEP},${GRAPH_HEIGHT-30}`,
                  `${PADDING + 10},${GRAPH_HEIGHT-30}`
                ].join(' ')
              }
              fill="url(#flashcardGradient)"
              stroke="none"
            />
            {/* Decks faded area */}
            <Polygon
              points={
                [
                  ...currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.decks, GRAPH_HEIGHT)}`),
                  `${PADDING + 10 + (currentData.length - 1) * X_STEP},${GRAPH_HEIGHT-30}`,
                  `${PADDING + 10},${GRAPH_HEIGHT-30}`
                ].join(' ')
              }
              fill="url(#deckGradient)"
              stroke="none"
            />
            {/* Flashcards value labels */}
            {currentData.map((d, i) => (
              <SvgText
                key={`fc-label-${i}`}
                x={PADDING + 10 + i * X_STEP}
                y={getY(d.flashcards, GRAPH_HEIGHT) - 12}
                fontSize={12}
                fill="#44B88A"
                fontFamily="Satoshi-Bold"
                textAnchor="middle"
              >
                {d.flashcards}
              </SvgText>
            ))}
            {/* Decks value labels */}
            {currentData.map((d, i) => (
              <SvgText
                key={`deck-label-${i}`}
                x={PADDING + 10 + i * X_STEP}
                y={getY(d.decks, GRAPH_HEIGHT) - 12}
                fontSize={12}
                fill="#4F41D8"
                fontFamily="Satoshi-Bold"
                textAnchor="middle"
              >
                {d.decks}
              </SvgText>
            ))}
            {/* Flashcards line and area */}
            <Polyline
              points={currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.flashcards, GRAPH_HEIGHT)}`).join(' ')}
              fill="none"
              stroke="#44B88A"
              strokeWidth={2}
            />
            {/* Decks line */}
            <Polyline
              points={currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.decks, GRAPH_HEIGHT)}`).join(' ')}
              fill="none"
              stroke="#4F41D8"
              strokeWidth={2}
            />
            {/* Flashcards circles */}
            {currentData.map((d, i) => (
              <G key={`fc-${i}`}>
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.flashcards, GRAPH_HEIGHT)}
                  r={30}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
                />
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.flashcards, GRAPH_HEIGHT)}
                  r={7}
                  fill="#44B88A"
                />
              </G>
            ))}
            {/* Decks circles */}
            {currentData.map((d, i) => (
              <G key={`deck-${i}`}>
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.decks, GRAPH_HEIGHT)}
                  r={30}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
                />
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.decks, GRAPH_HEIGHT)}
                  r={7}
                  fill="#4F41D8"
                />
              </G>
            ))}
            {/* X axis labels */}
            {currentData.map((d, i) => (
              <G key={`xaxis-${i}`}>
                <Rect
                  x={PADDING + 10 + i * X_STEP - 30}
                  y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                  width={60}
                  height={50}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
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