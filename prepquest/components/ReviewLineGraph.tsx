import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, Animated, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText, G, Rect } from 'react-native-svg';

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
];

const GRAPH_HEIGHT = 280;
const PADDING = 32;
const Y_MAX = Math.ceil(Math.max(...data.map(d => Math.max(d.flashcards, d.decks))) / 10) * 10;
const Y_STEP = 5;
const X_AXIS_LABEL_GAP = -5; // gap from bottom of graph to day label
const X_AXIS_DATE_GAP = 2; // gap between day and date label
const X_AXIS_EXTRA_HEIGHT = 28; // extra height to fit both labels

function getY(value: number, graphHeight: number) {
  // Invert y for SVG
  const usableHeight = graphHeight - 2 * PADDING;
  return PADDING + usableHeight - (value / Y_MAX) * usableHeight;
}

export function ReviewLineGraph() {
  const { width: windowWidth } = useWindowDimensions();
  const GRAPH_WIDTH = Math.round(windowWidth * 0.93);
  const X_STEP = (GRAPH_WIDTH - 2 * PADDING) / 3 - 16;
  const SVG_HEIGHT = GRAPH_HEIGHT + X_AXIS_EXTRA_HEIGHT;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const fadeAnim = new Animated.Value(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate total width needed for all data points
  const totalWidth = Math.max(GRAPH_WIDTH, PADDING + (data.length - 1) * X_STEP + PADDING);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: selectedIndex !== null ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  // Scroll to the end on mount to show the 4 most recent data points
  useEffect(() => {
    if (scrollViewRef.current) {
      const scrollToX = totalWidth - GRAPH_WIDTH + PADDING;
      scrollViewRef.current.scrollTo({ x: scrollToX, animated: false });
    }
  }, []);

  // Points for lines - using all data
  const flashcardPoints = data.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.flashcards, GRAPH_HEIGHT)}`).join(' ');
  const deckPoints = data.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.decks, GRAPH_HEIGHT)}`).join(' ');

  const handleDataPointClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <View style={{ width: GRAPH_WIDTH, height: SVG_HEIGHT, alignSelf: 'center', marginTop: 20, marginLeft: 15 }}>
      {/* Fixed elements */}
      <Svg width={GRAPH_WIDTH} height={SVG_HEIGHT+100} style={{ position: 'absolute', borderWidth: 1, borderColor: 'red'}}>
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
        {Array.from({ length: Y_MAX / 5 + 1 }, (_, i) => i * 5).map((y) => (
          <G key={y}>
            <Line
              x1={PADDING - 30}
              x2={GRAPH_WIDTH - PADDING}
              y1={getY(y, GRAPH_HEIGHT)}
              y2={getY(y, GRAPH_HEIGHT)}
              stroke="#E5E4EA"
              strokeDasharray={y === 0 ? undefined : y % 5 === 0 ? '4,4' : undefined}
              strokeWidth={1}
            />
            {y % 10 === 0 && (
              <SvgText
                x={GRAPH_WIDTH - PADDING + 8}
                y={getY(y, GRAPH_HEIGHT) + 5}
                fontSize={16}
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

      {/* Scrollable elements */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: GRAPH_WIDTH, marginLeft: -PADDING}}
        contentContainerStyle={{ 
          width: totalWidth + PADDING,
          paddingLeft: PADDING -20,
        }}
      >
        <Svg width={totalWidth + PADDING} height={SVG_HEIGHT}>
          {/* Flashcards line and area */}
          <Polyline
            points={flashcardPoints}
            fill="none"
            stroke="#44B88A"
            strokeWidth={2}
          />
          {/* Decks line */}
          <Polyline
            points={deckPoints}
            fill="none"
            stroke="#4F41D8"
            strokeWidth={2}
          />
          {/* Flashcards circles */}
          {data.map((d, i) => (
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
          {data.map((d, i) => (
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
          {data.map((d, i) => (
            <G key={`xaxis-${i}`}>
              {/* Touch area for x-axis labels */}
              <Rect
                x={PADDING + 10 + i * X_STEP - 30}
                y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                width={60}
                height={50}
                fill="transparent"
                onPressIn={() => handleDataPointClick(i)}
              />
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
            </G>
          ))}
        </Svg>
      </ScrollView>

      {/* Labels that appear on click
      {selectedIndex !== null && (
        <>
          <Animated.Text
            style={{
              position: 'absolute',
              left: PADDING - 33 + selectedIndex * X_STEP,
              top: getY(data[selectedIndex].flashcards, GRAPH_HEIGHT) - 24,
              fontSize: 14,
              color: '#000',
              fontFamily: 'Satoshi-Medium',
              opacity: fadeAnim,
            }}
          >
            {`${data[selectedIndex].flashcards} Flashcards`}
          </Animated.Text>
          <Animated.Text
            style={{
              position: 'absolute',
              left: PADDING - 16 + selectedIndex * X_STEP,
              top: getY(data[selectedIndex].decks, GRAPH_HEIGHT) + 8,
              fontSize: 14,
              color: '#000',
              fontFamily: 'Satoshi-Medium',
              opacity: fadeAnim,
            }}
          >
            {`${data[selectedIndex].decks} Decks`}
          </Animated.Text>
        </>
      )} */}
    </View>
  );
} 