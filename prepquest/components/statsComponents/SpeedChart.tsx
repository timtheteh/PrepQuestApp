import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, Animated, TouchableOpacity, ScrollView, Text, Platform } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText, G, Rect, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { SmallGreenBinaryToggle } from '../general/SmallGreenBinaryToggle';
import { getCompleteDailySpeeds, getMonthlySpeeds, DaySpeed, MonthSpeed } from '@/db/grades';
import { useIsFocused } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { statisticsCache, CACHE_KEYS } from '@/utils/statisticsCache';

const GRAPH_HEIGHT = 280;
const PADDING = 32;
const X_AXIS_LABEL_GAP = -5; // gap from bottom of graph to day label
const X_AXIS_DATE_GAP = 2; // gap between day and date label
const X_AXIS_EXTRA_HEIGHT = 28; // extra height to fit both labels

type SpeedChartProps = {
  onContentReady?: () => void;
};

export function SpeedChart({ onContentReady }: SpeedChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const GRAPH_WIDTH = Math.round(windowWidth * 0.93);
  const X_STEP = (GRAPH_WIDTH - 2 * PADDING) / 3 - 16;
  const SVG_HEIGHT = GRAPH_HEIGHT + X_AXIS_EXTRA_HEIGHT;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMonth, setIsMonth] = useState(false);
  const [pendingFadeIn, setPendingFadeIn] = useState(false);
  const [data, setData] = useState<DaySpeed[]>([]);
  const [monthData, setMonthData] = useState<MonthSpeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const graphFadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const isFocused = useIsFocused();

  // Fetch speed data with caching
  const fetchSpeedData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch daily speeds with caching
      const dailySpeeds = await statisticsCache.getCachedOrFetch(
        CACHE_KEYS.SPEED_CHART_DAILY,
        getCompleteDailySpeeds
      );
      
      // Fetch monthly speeds with caching
      const monthlySpeeds = await statisticsCache.getCachedOrFetch(
        CACHE_KEYS.SPEED_CHART_MONTHLY,
        getMonthlySpeeds
      );
      
      setData(dailySpeeds);
      setMonthData(monthlySpeeds);
    } catch (error) {
      console.error('Error fetching speed chart data:', error);
      setData([]);
      setMonthData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      fetchSpeedData();
    }
  }, [isFocused]);

  // Use correct data
  const currentData = isMonth ? monthData : data;

  // Calculate total width needed for all data points
  const totalWidth = Math.max(GRAPH_WIDTH, PADDING + (currentData.length - 1) * X_STEP + PADDING);

  const yMaxRaw = currentData.length > 0 ? Math.max(...currentData.map(d => isNaN(d.time) ? 0 : d.time)) : 0;
  const Y_MAX = Math.max(1, Math.ceil(yMaxRaw / 10) * 10); // Ensure minimum value of 1
  const Y_STEP = isMonth ? 10 : 5;

  function getY(value: number, graphHeight: number) {
    // Invert y for SVG
    const usableHeight = graphHeight - 2 * PADDING;
    // Prevent division by zero or NaN values
    if (Y_MAX <= 0 || isNaN(Y_MAX) || isNaN(value)) {
      return PADDING + usableHeight; // Return bottom of graph
    }
    const result = PADDING + usableHeight - (value / Y_MAX) * usableHeight;
    // Final safety check to ensure result is a valid number
    return isNaN(result) ? PADDING + usableHeight : result;
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

  const handleDataPointClick = (index: number) => {
    setSelectedIndex(index);
  };

  // For the fixed (non-scrollable) case, call onContentReady after mount
  useEffect(() => {
    if (currentData.length <= 4 && onContentReady && !isLoading) {
      onContentReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData.length <= 4, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <View>
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <Text style={{ fontFamily: Fonts.title, fontSize: 24, textAlign: 'center', lineHeight: 30, color: colors.text }}>
            {strings[language].speedChart}
          </Text>
          <SmallGreenBinaryToggle
            leftLabel={strings[language].reviewDay}
            rightLabel={strings[language].reviewMonth}
            style={{ marginTop: 15 }}
            onToggle={handleToggle}
          />
        </View>
        <View style={{ 
          width: GRAPH_WIDTH, 
          height: SVG_HEIGHT, 
          alignSelf: 'center', 
          marginLeft: 15, 
          marginTop: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 16, color: colors.unselectedText }}>
            {strings[language].loadingSpeedData}
          </Text>
        </View>
      </View>
    );
  }

  // Show empty state
  if (currentData.length === 0) {
    return (
      <View>
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <Text style={{ fontFamily: Fonts.title, fontSize: 24, textAlign: 'center', lineHeight: 30, color: colors.text }}>
            {strings[language].speedChart}
          </Text>
          <SmallGreenBinaryToggle
            leftLabel={strings[language].reviewDay}
            rightLabel={strings[language].reviewMonth}
            style={{ marginTop: 15 }}
            onToggle={handleToggle}
          />
        </View>
        <View style={{ 
          width: GRAPH_WIDTH, 
          height: SVG_HEIGHT, 
          alignSelf: 'center', 
          marginLeft: 15, 
          marginTop: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 16, color: colors.unselectedText }}>
            {strings[language].noSpeedDataAvailable}
          </Text>
          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: 14, color: colors.unselectedText, marginTop: 8 }}>
            {strings[language].studyOrQuizToSeeSpeedTrends}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
    <View style={{ marginTop: 30, alignItems: 'center' }}>
        <Text style={{ fontFamily: Fonts.title, fontSize: 24, textAlign: 'center', lineHeight: 30, color: colors.text }}>
            {strings[language].speedChart}
        </Text>
        <SmallGreenBinaryToggle
            leftLabel={strings[language].reviewDay}
            rightLabel={strings[language].reviewMonth}
            style={{ marginTop: 15}}
            onToggle={handleToggle}
        />
    </View>
    
    <Animated.View
      style={{
        width: GRAPH_WIDTH,
        height: SVG_HEIGHT,
        alignSelf: 'center',
        marginLeft: 15,
        marginTop: 0,
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
          stroke={colors.graphLineColor}
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
              stroke={colors.graphLineColor}
              strokeDasharray={y === 0 ? undefined : y % Y_STEP === 0 ? '4,4' : undefined}
              strokeWidth={1}
            />
            {y % 10 === 0 && (
              <SvgText
                x={GRAPH_WIDTH - PADDING + 8}
                y={getY(y, GRAPH_HEIGHT) + 5}
                fontSize={12}
                fill={colors.unselectedText}
                fontFamily={Fonts.bodyMedium}
                textAnchor="start"
              >
                {y + strings[language].seconds}
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
              <Stop offset="0%" stopColor={colors.brandColor2} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="deckGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.brandColor2} stopOpacity="0.6" />
              <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Calculate right-aligned X positions */}
          {(() => {
            const n = currentData.length;
            const minPoints = 4;
            let step = 0
            if (n=== 2) {
                step = (GRAPH_WIDTH ) / (n-1) - 110;
            }
            if (n=== 3) {
                step = (GRAPH_WIDTH ) / (n-1) - 58;
            }
            if (n=== 4) {
                step = (GRAPH_WIDTH ) / (n-1) - 37;
            }
            let xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH - PADDING - 40 - (n - 1 - i) * step);
            if (n === 1){
                xs =Array.from({ length: n }, (_, i) => GRAPH_WIDTH / 2 - 10)
            }
            // Helper to get x for index i
            const getX = (i: number) => xs[i];
            // Polygon for flashcards area
            const flashPoly = [
              ...currentData.map((d, i) => `${getX(i)},${getY(d.time, GRAPH_HEIGHT)}`),
              `${getX(n - 1)},${GRAPH_HEIGHT-30}`,
              `${getX(0)},${GRAPH_HEIGHT-30}`
            ].join(' ');
            // Polygon for decks area
            const deckPoly = [
              ...currentData.map((d, i) => `${getX(i)},${getY(d.time, GRAPH_HEIGHT)}`),
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
                    y={getY(d.time, GRAPH_HEIGHT) - 12}
                    fontSize={12}
                    fill={colors.brandColor1}
                    fontFamily={Fonts.bodyBold}
                    textAnchor="middle"
                  >
                    {d.time + strings[language].seconds}
                  </SvgText>
                ))}
                {/* Decks value labels */}
                {currentData.map((d, i) => (
                  <SvgText
                    key={`deck-label-${i}`}
                    x={getX(i)}
                    y={getY(d.time, GRAPH_HEIGHT) - 12}
                    fontSize={12}
                    fill={colors.brandColor2}
                    fontFamily={Fonts.bodyBold}
                    textAnchor="middle"
                  >
                    {d.time + strings[language].seconds}
                  </SvgText>
                ))}
                {/* Flashcards line and area */}
                <Polyline
                  points={currentData.map((d, i) => `${getX(i)},${getY(d.time, GRAPH_HEIGHT)}`).join(' ')}
                  fill="none"
                  stroke={colors.brandColor1}
                  strokeWidth={2}
                />
                {/* Decks line */}
                <Polyline
                  points={currentData.map((d, i) => `${getX(i)},${getY(d.time, GRAPH_HEIGHT)}`).join(' ')}
                  fill="none"
                  stroke={colors.brandColor2}
                  strokeWidth={2}
                />
                {/* Flashcards circles */}
                {currentData.map((d, i) => (
                  <G key={`fc-${i}`}>
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.time, GRAPH_HEIGHT)}
                      r={30}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.time, GRAPH_HEIGHT)}
                      r={7}
                      fill={colors.brandColor1}
                    />
                  </G>
                ))}
                {/* Decks circles */}
                {currentData.map((d, i) => (
                  <G key={`deck-${i}`}>
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.time, GRAPH_HEIGHT)}
                      r={30}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.time, GRAPH_HEIGHT)}
                      r={7}
                      fill={colors.brandColor2}
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
                          fill={colors.unselectedText}
                          fontFamily={Fonts.bodyMedium}
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
                          fill={colors.unselectedText}
                          fontFamily={Fonts.bodyMedium}
                          textAnchor="middle"
                        >
                          {d.day}
                        </SvgText>
                        <SvgText
                          x={getX(i)}
                          y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + X_AXIS_DATE_GAP + 14}
                          fontSize={12}
                          fill={colors.unselectedText}
                          fontFamily={Fonts.bodyMedium}
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
                <Stop offset="0%" stopColor={colors.brandColor2} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="deckGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.brandColor2} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {/* Flashcards faded area */}
            <Polygon
              points={
                [
                  ...currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.time, GRAPH_HEIGHT)}`),
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
                  ...currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.time, GRAPH_HEIGHT)}`),
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
                y={getY(d.time, GRAPH_HEIGHT) - 12}
                fontSize={12}
                fill={colors.brandColor1}
                fontFamily={Fonts.bodyBold}
                textAnchor="middle"
              >
                {d.time + 's'}
              </SvgText>
            ))}
            {/* Decks value labels */}
            {currentData.map((d, i) => (
              <SvgText
                key={`deck-label-${i}`}
                x={PADDING + 10 + i * X_STEP}
                y={getY(d.time, GRAPH_HEIGHT) - 12}
                fontSize={12}
                fill={colors.brandColor2}
                fontFamily={Fonts.bodyBold}
                textAnchor="middle"
              >
                {d.time + 's'}
              </SvgText>
            ))}
            {/* Flashcards line and area */}
            <Polyline
              points={currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.time, GRAPH_HEIGHT)}`).join(' ')}
              fill="none"
              stroke={colors.brandColor1}
              strokeWidth={2}
            />
            {/* Decks line */}
            <Polyline
              points={currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.time, GRAPH_HEIGHT)}`).join(' ')}
              fill="none"
              stroke={colors.brandColor2}
              strokeWidth={2}
            />
            {/* Flashcards circles */}
            {currentData.map((d, i) => (
              <G key={`fc-${i}`}>
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.time, GRAPH_HEIGHT)}
                  r={30}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
                />
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.time, GRAPH_HEIGHT)}
                  r={7}
                  fill={colors.brandColor1}
                />
              </G>
            ))}
            {/* Decks circles */}
            {currentData.map((d, i) => (
              <G key={`deck-${i}`}>
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.time, GRAPH_HEIGHT)}
                  r={30}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
                />
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.time, GRAPH_HEIGHT)}
                  r={7}
                  fill={colors.brandColor2}
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
                    fill={colors.unselectedText}
                    fontFamily={Fonts.bodyMedium}
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
                      fill={colors.unselectedText}
                      fontFamily={Fonts.bodyMedium}
                      textAnchor="middle"
                    >
                      {d.day}
                    </SvgText>
                    <SvgText
                      x={PADDING + 10 + i * X_STEP}
                      y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + X_AXIS_DATE_GAP + 14}
                      fontSize={12}
                      fill={colors.unselectedText}
                      fontFamily={Fonts.bodyMedium}
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