import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

const SIZE = Dimensions.get('window').width * 0.73;
const RADIUS = SIZE / 2;
const COLORS = ['#F8696B', '#FA9473', '#FFEB84', '#98CE7F']; // Again, Hard, Good, Easy

interface BreakdownByDifficultyPieProps {
  breakdown?: {
    Again: number;
    Hard: number;
    Good: number;
    Easy: number;
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // Handle the case where the slice covers the full circle
  if (Math.abs(endAngle - startAngle) >= 360) {
    // For a full circle, we need to draw it as two semicircles
    const start = polarToCartesian(cx, cy, r, 0);
    const end = polarToCartesian(cx, cy, r, 180);
    const end2 = polarToCartesian(cx, cy, r, 360);
    
    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 1 0 ${end.x} ${end.y}`,
      `A ${r} ${r} 0 1 0 ${end2.x} ${end2.y}`,
      'Z',
    ].join(' ');
  }
  
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export function BreakdownByDifficultyPie({ breakdown }: BreakdownByDifficultyPieProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  // Localized labels
  const LABELS = [
    strings[language].difficultyLabels.again,
    strings[language].difficultyLabels.hard,
    strings[language].difficultyLabels.good,
    strings[language].difficultyLabels.easy
  ];
  const title = strings[language].breakdownByDifficulty;
  const emptyText = strings[language].noDifficultyData;
  const emptySubtext = strings[language].completeSomeFlashcards;
  // Use breakdown data if provided, otherwise use default values
  const values = breakdown ? [
    breakdown.Again,
    breakdown.Hard,
    breakdown.Good,
    breakdown.Easy
  ] : [0, 0, 0, 0];
  
  const total = values.reduce((a, b) => a + b, 0);
  
  // If no data, show empty state
  if (total === 0) {
    return (
      <View style={styles.wrapper}>
        <Text style={[styles.title, {
          fontFamily: Fonts.title,
          color: colors.text
        }]}>{title}</Text>
        <View style={styles.container}>
          <Text style={[styles.emptyText, {
            fontFamily: Fonts.title,
            color: colors.text
          }]}>{emptyText}</Text>
          <Text style={[styles.emptySubtext, {
            fontFamily: Fonts.title,
            color: colors.text
          }]}>{emptySubtext}</Text>
        </View>
      </View>
    );
  }

  let cumulative = 0;
  const slices = values.map((value, i) => {
    const startAngle = (cumulative / total) * 360;
    const endAngle = ((cumulative + value) / total) * 360;
    const path = describeArc(RADIUS, RADIUS, RADIUS, startAngle, endAngle);
    // For label position, use the angle in the middle of the slice
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = RADIUS * 0.65;
    const labelPos = polarToCartesian(RADIUS, RADIUS, labelRadius, midAngle);
    const percent = Math.round((value / total) * 100);
    const label = `${LABELS[i]}\n${value} (${percent}%)`;
    cumulative += value;
    return { path, color: COLORS[i], label, labelPos, value, percent };
  });

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, {
        fontFamily: Fonts.title,
        color: colors.text
      }]}>{title}</Text>
      <View style={styles.container}>
        <Svg width={SIZE} height={SIZE}>
          <G>
            {slices.map((slice, i) => (
              <Path key={i} d={slice.path} fill={slice.color} />
            ))}
            {slices.map((slice, i) => (
              // Only show labels if the value is greater than 0
              slice.value > 0 && (
                <G key={`slice-labels-${i}`}>
                  <SvgText
                    x={slice.labelPos.x}
                    y={slice.labelPos.y - 10}
                    fontSize={16}
                    fontFamily={Fonts.bodyMedium}
                    fill={colors.text}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {LABELS[i]}
                  </SvgText>
                  <SvgText
                    x={slice.labelPos.x}
                    y={slice.labelPos.y + 10}
                    fontSize={16}
                    fontFamily={Fonts.bodyMedium}
                    fill={colors.text}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {`${slice.value} (${slice.percent}%)`}
                  </SvgText>
                </G>
              )
            ))}
          </G>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
  },
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BreakdownByDifficultyPie; 