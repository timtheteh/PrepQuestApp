import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Polygon, Defs, ClipPath, Path } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';

interface AverageGradeThermometerProps {
  score?: number; // 0-100
}

const SEGMENTS = [0, 20, 45, 65, 80, 90, 100];
const SEGMENT_COLORS = [
  'rgba(79,65,216,1)', // 0-20
  'rgba(79,65,216,0.85)', // 20-45
  'rgba(104,92,221,0.73)', // 45-65
  'rgba(142,133,227,0.54)', // 65-80
  'rgba(189,184,235,0.75)', // 80-90
  'rgba(203,199,237,0.71)', // 90-100
];

const RECT_WIDTH = Dimensions.get('window').width * 0.73;
const RECT_HEIGHT = 24;
const RADIUS = 12;
const HORIZONTAL_PADDING = 10;

export function AverageGradeThermometer({ score = 0 }: AverageGradeThermometerProps) {
  const { language } = useLanguage();
  // Calculate segment widths
  const segmentWidths = SEGMENTS.slice(1).map((val, i) => (val - SEGMENTS[i]) / 100 * RECT_WIDTH);
  // Calculate arrow position, clamped to padding
  const arrowX = HORIZONTAL_PADDING + Math.max(0, Math.min(100, score)) / 100 * RECT_WIDTH;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, 
        // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
        ]}>
        {language === 'Chinese' ? '平均分数' : 'Average Grade'}
      </Text>
      <Text style={styles.scoreText}>{score}%</Text>
      <View style={{ marginTop: 10, alignItems: 'center', width: RECT_WIDTH + 2 * HORIZONTAL_PADDING, height: RECT_HEIGHT + 38 }}>
        <Svg width={RECT_WIDTH + 2 * HORIZONTAL_PADDING} height={RECT_HEIGHT + 38}>
          {/* Labels above breakpoints */}
          {SEGMENTS.map((val, i) => (
            <SvgText
              key={val}
              x={HORIZONTAL_PADDING + (val / 100) * RECT_WIDTH}
              y={10}
              fontSize={10}
              fill="#111"
              fontFamily="Satoshi-Medium"
              textAnchor={i === 0 ? 'start' : i === SEGMENTS.length - 1 ? 'end' : 'middle'}
            >
              {val}
            </SvgText>
          ))}
          {/* Single rounded rectangle as background */}
          <Rect
            x={HORIZONTAL_PADDING}
            y={18}
            width={RECT_WIDTH}
            height={RECT_HEIGHT}
            fill={SEGMENT_COLORS[SEGMENT_COLORS.length - 1]}
            rx={RADIUS}
            ry={RADIUS}
          />
          {/* Overlay colored segments (no border radius except for first and last) */}
          <G>
            {/* First segment: round left corners only */}
            <Defs>
              <ClipPath id="leftRadius">
                <Path d={`
                  M${HORIZONTAL_PADDING + RADIUS},18
                  h${segmentWidths[0] - RADIUS}
                  v${RECT_HEIGHT}
                  h-${segmentWidths[0] - RADIUS}
                  a${RADIUS},${RADIUS} 0 0 1 -${RADIUS},-${RADIUS}
                  v-${RECT_HEIGHT - 2 * RADIUS}
                  a${RADIUS},${RADIUS} 0 0 1 ${RADIUS},-${RADIUS}
                  z
                `} />
              </ClipPath>
              <ClipPath id="rightRadius">
                <Path d={`
                  M${HORIZONTAL_PADDING + SEGMENTS[5] / 100 * RECT_WIDTH},18
                  h${segmentWidths[5] - RADIUS}
                  a${RADIUS},${RADIUS} 0 0 1 ${RADIUS},${RADIUS}
                  v${RECT_HEIGHT - 2 * RADIUS}
                  a${RADIUS},${RADIUS} 0 0 1 -${RADIUS},${RADIUS}
                  h-${segmentWidths[5] - RADIUS}
                  z
                `} />
              </ClipPath>
            </Defs>
            <Rect
              x={HORIZONTAL_PADDING}
              y={18}
              width={segmentWidths[0]}
              height={RECT_HEIGHT}
              fill={SEGMENT_COLORS[0]}
              clipPath="url(#leftRadius)"
            />
            {/* Middle segments: no radius */}
            {segmentWidths.slice(1, 5).map((w, i) => (
              <Rect
                key={i + 1}
                x={HORIZONTAL_PADDING + SEGMENTS[i + 1] / 100 * RECT_WIDTH}
                y={18}
                width={w}
                height={RECT_HEIGHT}
                fill={SEGMENT_COLORS[i + 1]}
              />
            ))}
            {/* Last segment: round right corners only */}
            <Rect
              x={HORIZONTAL_PADDING + SEGMENTS[5] / 100 * RECT_WIDTH}
              y={18}
              width={segmentWidths[5]}
              height={RECT_HEIGHT}
              fill={SEGMENT_COLORS[5]}
              clipPath="url(#rightRadius)"
            />
          </G>
          {/* Arrow needle (overlapping bottom of rectangle) */}
          <Polygon
            points={`
              ${arrowX - 10},${18 + RECT_HEIGHT + 10}
              ${arrowX + 10},${18 + RECT_HEIGHT + 10}
              ${arrowX},${18 + RECT_HEIGHT - 2}
            `}
            fill="#111"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    textAlign: 'center',
    lineHeight: 30,
  },
  scoreText: {
    fontSize: 48,
    fontFamily: 'Neuton-Regular',
    textAlign: 'center',
  },
}); 