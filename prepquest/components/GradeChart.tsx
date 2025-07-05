import React, { useState, useEffect, useRef } from 'react';
import { View, useWindowDimensions, Animated, TouchableOpacity, ScrollView, Text, Platform } from 'react-native';
import Svg, { Line, Rect as SvgRect, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SmallGreenBinaryToggle } from './SmallGreenBinaryToggle';
import { getCompleteDailyGrades, getMonthlyGrades, DayGrade, MonthGrade } from '../db/grades';
import { useIsFocused } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';

const GRAPH_HEIGHT = 280;
const PADDING = 32;
const X_AXIS_LABEL_GAP = -5;
const X_AXIS_DATE_GAP = 2;
const X_AXIS_EXTRA_HEIGHT = 28;
const BAR_WIDTH = 45;
const BAR_COLOR = '#CAC6F3';
const BAR_RADIUS = 10;

type GradeChartProps = {
  onContentReady?: () => void;
};

export function GradeChart({ onContentReady }: GradeChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { language } = useLanguage();
  const GRAPH_WIDTH = Math.round(windowWidth * 0.93);
  const X_STEP = (GRAPH_WIDTH - 2 * PADDING) / 3 - 16;
  const SVG_HEIGHT = GRAPH_HEIGHT + X_AXIS_EXTRA_HEIGHT;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMonth, setIsMonth] = useState(false);
  const [pendingFadeIn, setPendingFadeIn] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const graphFadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const isFocused = useIsFocused();

  // State for real data
  const [dayData, setDayData] = useState<DayGrade[]>([]);
  const [monthData, setMonthData] = useState<MonthGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch data
  const fetchData = async () => {
    try {
      console.log('🔄 GradeChart: Fetching fresh data...');
      setIsLoading(true);
      const [dailyGrades, monthlyGrades] = await Promise.all([
        getCompleteDailyGrades(),
        getMonthlyGrades()
      ]);
      
      console.log('📊 GradeChart: Daily grades received:', dailyGrades.length);
      console.log('📊 GradeChart: Monthly grades received:', monthlyGrades.length);
      
      setDayData(dailyGrades);
      setMonthData(monthlyGrades);
    } catch (error) {
      console.error('❌ GradeChart: Error fetching grade data:', error);
      // Fallback to empty arrays if there's an error
      setDayData([]);
      setMonthData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when screen comes into focus
  useEffect(() => {
    fetchData();
  }, [isFocused]); // Refresh data when screen comes into focus

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

  // Use correct data based on current state
  const currentData = isMonth ? monthData : dayData;

  // Calculate total width needed for all data points
  const totalWidth = Math.max(
    GRAPH_WIDTH,
    PADDING + (currentData.length - 1) * X_STEP + PADDING
  );

  // Y axis is always 0-100
  const Y_MAX = 100;
  const Y_STEP = 25;

  function getY(value: number, graphHeight: number) {
    // Invert y for SVG
    const usableHeight = graphHeight - 2 * PADDING;
    return PADDING + usableHeight - (value / Y_MAX) * usableHeight;
  }

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: selectedIndex !== null ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

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

  // Bar chart rendering
  const renderBars = (getX: (i: number) => number) =>
    currentData.map((d, i: number) => {
      const barX = getX(i) - BAR_WIDTH / 2;
      const barY = getY(d.score, GRAPH_HEIGHT);
      const barBottomY = getY(0, GRAPH_HEIGHT);
      const barHeight = barBottomY - barY;
      return (
        <G key={`bar-${i}`}>
          {/* Bar */}
          <SvgRect
            x={barX}
            y={barY}
            width={BAR_WIDTH}
            height={barHeight}
            fill={BAR_COLOR}
            rx={BAR_RADIUS}
            ry={BAR_RADIUS}
          />
          {/* Value label above bar */}
          <SvgText
            x={getX(i)-5}
            y={barY - 10}
            fontSize={14}
            fill="#4F41D8"
            fontFamily="Satoshi-Variable"
            fontWeight="700"
            textAnchor="middle"
          >
            {d.score}%
          </SvgText>
        </G>
      );
    });

  const handleDataPointClick = (index: number) => {
    setSelectedIndex(index);
  };

  // For the fixed (non-scrollable) case, call onContentReady after mount
  useEffect(() => {
    if (currentData.length <= 4 && onContentReady) {
      onContentReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData.length <= 4]);

  // Show loading state
  if (isLoading) {
    return (
      <View>
        <View style={{ marginTop: 0, alignItems: 'center', zIndex: 2 }}>
          <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center', lineHeight: 30 }}>
            {language === 'Chinese' ? '成绩图表 (%)' : 'Grade Chart (%)'}
          </Text>
          <SmallGreenBinaryToggle
            leftLabel={language === 'Chinese' ? '日' : 'Day'}
            rightLabel={language === 'Chinese' ? '月' : 'Month'}
            style={{ marginTop: 15 }}
            onToggle={handleToggle}
          />
        </View>
        <View style={{ 
          width: GRAPH_WIDTH, 
          height: SVG_HEIGHT, 
          alignSelf: 'center', 
          marginTop: 10,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 16, color: '#D5D4DD' }}>
            {language === 'Chinese' ? '正在加载成绩数据...' : 'Loading grade data...'}
          </Text>
        </View>
      </View>
    );
  }

  // Show empty state if no data
  if (currentData.length === 0) {
    return (
      <View>
        <View style={{ marginTop: 0, alignItems: 'center', zIndex: 2 }}>
          <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center', lineHeight: 30 }}>
            {language === 'Chinese' ? '成绩图表 (%)' : 'Grade Chart (%)'}
          </Text>
          <SmallGreenBinaryToggle
            leftLabel={language === 'Chinese' ? '日' : 'Day'}
            rightLabel={language === 'Chinese' ? '月' : 'Month'}
            style={{ marginTop: 15 }}
            onToggle={handleToggle}
          />
        </View>
        <View style={{ 
          width: GRAPH_WIDTH, 
          height: SVG_HEIGHT, 
          alignSelf: 'center', 
          marginTop: 10,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 16, color: '#D5D4DD' }}>
            {language === 'Chinese' ? '暂无成绩数据' : 'No grade data available'}
          </Text>
          <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#D5D4DD', marginTop: 8 }}>
            {language === 'Chinese' ? '学习或测验卡片以查看进度' : 'Study or quiz flashcards to see your progress'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Fixed header with title and toggle */}
      <View style={{ marginTop: 0, alignItems: 'center', zIndex: 2 }}>
        <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center', lineHeight: 30 }}>
          {language === 'Chinese' ? '成绩图表 (%)' : 'Grade Chart (%)'}
        </Text>
        <SmallGreenBinaryToggle
          leftLabel={language === 'Chinese' ? '日' : 'Day'}
          rightLabel={language === 'Chinese' ? '月' : 'Month'}
          style={{ marginTop: 15 }}
          onToggle={handleToggle}
        />
      </View>
      <Animated.View
        style={{
          width: GRAPH_WIDTH,
          height: SVG_HEIGHT,
          alignSelf: 'center',
          marginLeft: 0,
          marginTop: 10,
          zIndex: 1,
          opacity: graphFadeAnim,
        }}
      >
        {/* Fixed elements */}
        <Svg width={GRAPH_WIDTH+10} height={SVG_HEIGHT} style={{ position: 'absolute',}}>
          {/* Y axis vertical line */}
          <Line
            x1={GRAPH_WIDTH - 32}
            x2={GRAPH_WIDTH - 32}
            y1={PADDING - 15}
            y2={GRAPH_HEIGHT - 32}
            stroke="#E5E4EA"
            strokeWidth={1}
          />
          {/* Y axis dashed lines and labels at every 25% */}
          {[0, 25, 50, 75, 100].map((y) => (
            <G key={y}>
              <Line
                x1={PADDING - 30}
                x2={GRAPH_WIDTH - PADDING}
                y1={getY(y, GRAPH_HEIGHT)}
                y2={getY(y, GRAPH_HEIGHT)}
                stroke="#E5E4EA"
                strokeDasharray={y === 0 ? undefined : '4,4'}
                strokeWidth={1}
              />
              <SvgText
                x={GRAPH_WIDTH - PADDING + 8}
                y={getY(y, GRAPH_HEIGHT) + 5}
                fontSize={12}
                fill="#D5D4DD"
                fontFamily="Satoshi-Medium"
                textAnchor="start"
              >
                {y}%
              </SvgText>
            </G>
          ))}
        </Svg>
        {/* Scrollable or fixed elements */}
        {currentData.length <= 4 ? (
          // Fixed SVG, right-aligned
          <Svg width={GRAPH_WIDTH} height={SVG_HEIGHT}>
            {/* Calculate right-aligned X positions */}
            {(() => {
              const n = currentData.length;
              const minPoints = 4;
              let step = 0;
              if (n === 2) {
                step = GRAPH_WIDTH / (n - 1) - 205;
              }
              if (n === 3) {
                step = GRAPH_WIDTH / (n - 1) - 58;
              }
              if (n === 4) {
                step = GRAPH_WIDTH / (n - 1) - 37;
              }
              let xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH - PADDING - 40 - (n - 1 - i) * step);
              if (n === 1) {
                xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH / 2 - 10);
              }
              if (n === 2) {
                xs = Array.from({ length: n }, (_, i) => GRAPH_WIDTH - PADDING - 85 - (n - 1 - i) * step);
              }
              // Helper to get x for index i
              const getX = (i: number) => xs[i];
              return (
                <>
                  {renderBars(getX)}
                  {/* X axis labels */}
                  {currentData.map((d, i) => (
                    <G key={`xaxis-${i}`}>
                      <SvgRect
                        x={getX(i) - 30}
                        y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                        width={60}
                        height={50}
                        fill="transparent"
                      />
                      {'month' in d ? (
                        <SvgText
                          x={getX(i)}
                          y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP}
                          fontSize={16}
                          fill="#D5D4DD"
                          fontFamily="Satoshi-Medium"
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
                            fill="#D5D4DD"
                            fontFamily="Satoshi-Medium"
                            textAnchor="middle"
                          >
                            {d.day}
                          </SvgText>
                          <SvgText
                            x={getX(i)}
                            y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + X_AXIS_DATE_GAP + 14}
                            fontSize={12}
                            fill="#D5D4DD"
                            fontFamily="Satoshi-Medium"
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
            keyboardShouldPersistTaps="always"
            onContentSizeChange={handleContentSizeChange}
          >
            <Svg width={totalWidth + PADDING} height={SVG_HEIGHT}>
              {/* Bars */}
              {(() => {
                const n = currentData.length;
                const getX = (i: number) => PADDING + 10 + i * X_STEP;
                return renderBars(getX);
              })()}
              {/* X axis labels */}
              {currentData.map((d, i) => (
                <G key={`xaxis-${i}`}>
                  <SvgRect
                    x={PADDING + 10 + i * X_STEP - 30}
                    y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP - 20}
                    width={60}
                    height={50}
                    fill="transparent"
                  />
                  {'month' in d ? (
                    <SvgText
                      x={PADDING + 10 + i * X_STEP}
                      y={GRAPH_HEIGHT + X_AXIS_LABEL_GAP + 6}
                      fontSize={16}
                      fill="#D5D4DD"
                      fontFamily="Satoshi-Medium"
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