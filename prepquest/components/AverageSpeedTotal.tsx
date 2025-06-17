import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import GaugeIcon from '../assets/icons/gaugeIcon.svg';

const WIDTH = 320;
const HEIGHT = 180;
const CX = WIDTH / 2;
const CY = HEIGHT - 20;
const R = 110;
const STROKE_WIDTH = 20;
const VALUE = 60; // dummy value
const LABELS = [0, 10, 35, 60];
const COLORS = ['#CBC7ED', '#8E85E3', '#685CDD'];

// Helper to get angle for a value (0-60s maps to 180deg, -90deg to +90deg)
function valueToAngle(value: number) {
  return (value / 60) * 180 - 90;
}

// Helper to describe arc path (for thick arc, use two radii and connect ends)
function describeArc(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', rInner, rInner, 0, largeArcFlag, 0, endInner.x, endInner.y,
    'Z'
  ].join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function AverageSpeedTotal() {
  // Arc segments: [start, end, color]
  const segments = [
    { start: 0, end: 10, color: COLORS[0] },
    { start: 10, end: 35, color: COLORS[1] },
    { start: 35, end: 60, color: COLORS[2] },
  ];
  // Convert to angles
  const arcSegments = segments.map(seg => ({
    startAngle: valueToAngle(seg.start),
    endAngle: valueToAngle(seg.end),
    color: seg.color,
  }));
  // Gauge rotation
  const gaugeAngle = valueToAngle(VALUE);
  // Label positions (slightly outside arc)
  const labelPositions = LABELS.map(v => polarToCartesian(CX-7, CY -8, R+8, valueToAngle(v)));

  // For gaugeIcon.svg: its tip (0,0) should be at the arc center (CX,CY), so translate and rotate accordingly
  // The SVG is 12x80, tip at (6,0), so offset x by -6, y by -10 (to move tip to center)

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Average time per flashcard</Text>
      <View style={styles.svgWrap}>
        <Svg width={WIDTH} height={HEIGHT}>
          <G>
            {/* Arc segments */}
            {arcSegments.map((seg, i) => (
              <Path
                key={i}
                d={describeArc(CX, CY, R, R - STROKE_WIDTH, seg.startAngle, seg.endAngle)}
                fill={seg.color}
              />
            ))}
            {/* Value labels at breakpoints */}
            {LABELS.map((v, i) => (
              <SvgText
                key={v}
                x={labelPositions[i].x}
                y={labelPositions[i].y + 8}
                fontSize={22}
                fontFamily="Satoshi-Medium"
                fill="#000"
                textAnchor={i === 0 ? 'end' : i === LABELS.length - 1 ? 'start' : 'middle'}
              >
                {v + 's'}
              </SvgText>
            ))}
          </G>
        </Svg>
        {/* Gauge icon overlay, absolutely positioned and rotated */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: WIDTH,
            height: HEIGHT,
            alignItems: 'center',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: CX - 6,
              top: CY - 50,
              width: 12,
              height: 80,
              alignItems: 'center',
              justifyContent: 'flex-end',
              transform: [{ rotate: `${gaugeAngle}deg` }],
              transformOrigin: '6px 70px',
            }}
          >
            <GaugeIcon width={40} height={100} />
          </View>
        </View>
        {/* Value at bottom center */}
        <Text style={styles.valueText}>{VALUE}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  title: {
    fontFamily: 'Neuton-Regular',
    fontSize: 24,
    textAlign: 'center',
    color: '#000',
    includeFontPadding: false,
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: WIDTH,
    height: HEIGHT + 40,
    position: 'relative',
    marginTop: -20,
  },
  valueText: {
    position: 'absolute',
    left: 5,
    right: 0,
    bottom: -2,
    textAlign: 'center',
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    fontSize: 24,
    color: '#111',
  },
}); 