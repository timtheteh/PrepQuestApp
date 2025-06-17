import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

const SIZE = 300;
const RADIUS = SIZE / 2;
const COLORS = ['#F8696B', '#FA9473', '#98CE7F', '#FFEB84'];
const LABELS = ['Again', 'Hard', 'Easy', 'Good'];
const VALUES = [5, 40, 10, 45];
const TOTAL = VALUES.reduce((a, b) => a + b, 0);

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
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

export function BreakdownByDifficultyPie() {
  let cumulative = 0;
  const slices = VALUES.map((value, i) => {
    const startAngle = (cumulative / TOTAL) * 360;
    const endAngle = ((cumulative + value) / TOTAL) * 360;
    const path = describeArc(RADIUS, RADIUS, RADIUS, startAngle, endAngle);
    // For label position, use the angle in the middle of the slice
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = RADIUS * 0.65;
    const labelPos = polarToCartesian(RADIUS, RADIUS, labelRadius, midAngle);
    const percent = Math.round((value / TOTAL) * 100);
    const label = `${LABELS[i]}\n${value} (${percent}%)`;
    cumulative += value;
    return { path, color: COLORS[i], label, labelPos };
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Breakdown of Flashcards by Difficulty</Text>
      <View style={styles.container}>
        <Svg width={SIZE} height={SIZE}>
          <G>
            {slices.map((slice, i) => (
              <Path key={i} d={slice.path} fill={slice.color} />
            ))}
            {slices.map((slice, i) => (
              <G key={`slice-labels-${i}`}>
                <SvgText
                  x={slice.labelPos.x}
                  y={slice.labelPos.y - 10}
                  fontSize={16}
                  fontFamily="Satoshi-Medium"
                  fill="#111"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {LABELS[i]}
                </SvgText>
                <SvgText
                  x={slice.labelPos.x}
                  y={slice.labelPos.y + 10}
                  fontSize={16}
                  fontFamily="Satoshi-Medium"
                  fill="#111"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {`${VALUES[i]} (${Math.round((VALUES[i]/TOTAL)*100)}%)`}
                </SvgText>
              </G>
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
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    color: '#111',
    lineHeight: 30,
  },
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BreakdownByDifficultyPie; 