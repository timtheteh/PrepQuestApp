import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

export function FavoriteButton() {
  const [favorited, setFavorited] = useState(false);
  const size = 30;
  const borderWidth = 2;
  // Star points (5-pointed star)
  const getStarPoints = (cx: number, cy: number, outerR: number, innerR: number) => {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 5 * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push([
        cx + r * Math.cos(angle),
        cy + r * Math.sin(angle)
      ]);
    }
    return points.map(p => p.join(",")).join(" ");
  };
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size - borderWidth) / 2;
  const innerR = outerR * 0.5;
  const starPoints = getStarPoints(cx, cy, outerR, innerR);
  return (
    <TouchableOpacity
      onPress={() => setFavorited(f => !f)}
      activeOpacity={0.7}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Polygon
          points={starPoints}
          fill={favorited ? '#F7CE45' : '#fff'}
          stroke={favorited ? '#F7CE45' : '#D5D4DD'}
          strokeWidth={borderWidth}
        />
      </Svg>
    </TouchableOpacity>
  );
} 