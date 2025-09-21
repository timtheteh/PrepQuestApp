import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G, Polygon, Defs, ClipPath, Path } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface AverageGradeThermometerProps {
  score?: number; // 0-100
}

const SEGMENTS = [0, 20, 45, 65, 80, 90, 100];

const RECT_WIDTH = Dimensions.get('window').width * 0.73;
const RECT_HEIGHT = 24;
const RADIUS = 12;
const HORIZONTAL_PADDING = 10;

export function AverageGradeThermometer({ score = 0 }: AverageGradeThermometerProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Get theme-based segment colors
  const segmentColors = [
    colors.thermometerColor1, // 0-20
    colors.thermometerColor2, // 20-45
    colors.thermometerColor3, // 45-65
    colors.thermometerColor4, // 65-80
    colors.thermometerColor5, // 80-90
    colors.thermometerColor6, // 90-100
  ];
  
  // Calculate segment widths
  const segmentWidths = SEGMENTS.slice(1).map((val, i) => (val - SEGMENTS[i]) / 100 * RECT_WIDTH);
  // Calculate arrow position, clamped to padding
  const arrowX = HORIZONTAL_PADDING + Math.max(0, Math.min(100, score)) / 100 * RECT_WIDTH;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {
        fontFamily: Fonts.title,
        color: colors.text
      }]}>
        {strings[language].averageGrade}
      </Text>
      <Text style={[styles.scoreText, {
        fontFamily: Fonts.title,
        color: colors.text
      }]}>{score}%</Text>
      <View style={{ marginTop: 10, alignItems: 'center', width: RECT_WIDTH + 2 * HORIZONTAL_PADDING, height: RECT_HEIGHT + 38 }}>
        <Svg width={RECT_WIDTH + 2 * HORIZONTAL_PADDING} height={RECT_HEIGHT + 38}>
          {/* Labels above breakpoints */}
          {SEGMENTS.map((val, i) => (
            <SvgText
              key={val}
              x={HORIZONTAL_PADDING + (val / 100) * RECT_WIDTH}
              y={10}
              fontSize={10}
              fill={colors.text}
              fontFamily={Fonts.bodyMedium}
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
            fill={segmentColors[segmentColors.length - 1]}
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
              fill={segmentColors[0]}
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
                fill={segmentColors[i + 1]}
              />
            ))}
            {/* Last segment: round right corners only */}
            <Rect
              x={HORIZONTAL_PADDING + SEGMENTS[5] / 100 * RECT_WIDTH}
              y={18}
              width={segmentWidths[5]}
              height={RECT_HEIGHT}
              fill={segmentColors[5]}
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
            fill={colors.text}
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
    textAlign: 'center',
    lineHeight: 30,
  },
  scoreText: {
    fontSize: 48,
    textAlign: 'center',
  },
}); 