import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';

const SIZE = 300;
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
  // Localized labels
  const LABELS = language === 'Chinese'
    ? ['再来', '困难', '良好', '简单']
    : ['Again', 'Hard', 'Good', 'Easy'];
  const title = language === 'Chinese' ? '按难度分布的卡片' : 'Breakdown of Flashcards by Difficulty';
  const emptyText = language === 'Chinese' ? '暂无难度数据' : 'No difficulty data available';
  const emptySubtext = language === 'Chinese' ? '完成一些卡片以查看分布' : 'Complete some flashcards to see your breakdown';
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
        <Text style={[styles.title, 
          // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
          ]}>{title}</Text>
        <View style={styles.container}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Text style={styles.emptySubtext}>{emptySubtext}</Text>
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
      <Text style={[styles.title, 
        // language === 'Chinese' && { fontFamily: 'NotoSansSC-Medium' }
        ]}>{title}</Text>
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
                    // fontFamily={language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'}
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
                    // fontFamily={language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'}
                    fill="#111"
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
  emptyText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 18,
    textAlign: 'center',
    color: '#111',
  },
  emptySubtext: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#111',
  },
});

export default BreakdownByDifficultyPie; 