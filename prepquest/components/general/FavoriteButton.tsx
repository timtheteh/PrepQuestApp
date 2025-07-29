import React, { useState, useMemo, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

interface FavoriteButtonProps {
  isSelectMode?: boolean;
  size?: number;
  favorited?: boolean;
  onPress?: () => void;
  onFavoriteToggle?: () => void;
}

export const FavoriteButton = React.memo(({ 
  isSelectMode = false, 
  size = 30, 
  favorited: externalFavorited,
  onPress: externalOnPress,
  onFavoriteToggle
}: FavoriteButtonProps) => {
  const [internalFavorited, setInternalFavorited] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const favorited = externalFavorited !== undefined ? externalFavorited : internalFavorited;
  const setFavorited = onFavoriteToggle || externalOnPress || (() => setInternalFavorited(f => !f));
  
  const borderWidth = 2;
  
  // Star points (5-pointed star) - memoized calculation
  const getStarPoints = useCallback((cx: number, cy: number, outerR: number, innerR: number) => {
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
  }, []);
  
  // Memoize star geometry calculations
  const starGeometry = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const outerR = (size - borderWidth) / 2;
    const innerR = outerR * 0.5;
    const starPoints = getStarPoints(cx, cy, outerR, innerR);
    return { cx, cy, outerR, innerR, starPoints };
  }, [size, borderWidth, getStarPoints]);
  
  const { starPoints } = starGeometry;
  // Memoize press handler
  const handlePress = useCallback(() => {
    if (!isSelectMode) {
      setFavorited();
    }
  }, [isSelectMode, setFavorited]);
  
  // Memoize style object
  const buttonStyle = useMemo(() => ({ width: size, height: size }), [size]);
  
  // Memoize polygon colors
  const polygonColors = useMemo(() => ({
    fill: favorited ? '#F7CE45' : '#fff',
    stroke: favorited ? '#F7CE45' : '#D5D4DD'
  }), [favorited]);
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={isSelectMode ? 1 : 0.7}
      style={buttonStyle}
      disabled={isSelectMode}
    >
      <Svg width={size} height={size}>
        <Polygon
          points={starPoints}
          fill={polygonColors.fill}
          stroke={polygonColors.stroke}
          strokeWidth={borderWidth}
        />
      </Svg>
    </TouchableOpacity>
  );
}); 