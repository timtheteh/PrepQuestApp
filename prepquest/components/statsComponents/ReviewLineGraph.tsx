import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, useWindowDimensions, Animated, TouchableOpacity, ScrollView, Text, Platform } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText, G, Rect, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { SmallGreenBinaryToggle } from '../general/SmallGreenBinaryToggle';
import { db } from '@/db/index';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';


// Interface for the data structure
interface DayData {
  day: string;
  date: string;
  flashcards: number;
  decks: number;
}

interface MonthData {
  month: string;
  flashcards: number;
  decks: number;
}

// Function to get day name from date
const getDayName = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Function to format date as "DD MMM YYYY"
const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Function to format month as "MMM YYYY"
const formatMonth = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

// Helper function to get current userID from AsyncStorage
async function getCurrentUserID(): Promise<string> {
  try {
    const userID = await AsyncStorage.getItem('userID');
    return userID || '1'; // Default to '1' if not found
  } catch (error) {
    // console.error('Error getting userID from AsyncStorage:', error);
    return '1'; // Default to '1' on error
  }
}

// Function to fetch real data from database
const fetchReviewData = async (): Promise<{ dayData: DayData[], monthData: MonthData[] }> => {
  try {
    const userID = await getCurrentUserID();
    
    // Single optimized query with SQL aggregation - fixed to handle ISO date format
    const result = await db.getAllAsync(`
      WITH all_dates AS (
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'deck' as type
        FROM decks 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'deck' as type
        FROM decks 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'deck' as type
        FROM AIDecks 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'deck' as type
        FROM AIDecks 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'flashcard' as type
        FROM flashcards 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'flashcard' as type
        FROM flashcards 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastStudiedDate) as activity_date,
          'flashcard' as type
        FROM AIFlashcards 
        WHERE lastStudiedDate IS NOT NULL AND userID = ?
        UNION ALL
        SELECT 
          strftime('%Y-%m-%d', lastQuizzedDate) as activity_date,
          'flashcard' as type
        FROM AIFlashcards 
        WHERE lastQuizzedDate IS NOT NULL AND userID = ?
      )
      SELECT 
        activity_date,
        SUM(CASE WHEN type = 'deck' THEN 1 ELSE 0 END) as deck_count,
        SUM(CASE WHEN type = 'flashcard' THEN 1 ELSE 0 END) as flashcard_count
      FROM all_dates
      WHERE activity_date IS NOT NULL
      GROUP BY activity_date
      ORDER BY activity_date
    `, [userID, userID, userID, userID, userID, userID, userID, userID]);

    // Create maps for quick lookup
    const dateCountMap = new Map<string, { decks: number; flashcards: number }>();
    
    result.forEach((row: any) => {
      dateCountMap.set(row.activity_date, {
        decks: isNaN(row.deck_count) ? 0 : (row.deck_count || 0),
        flashcards: isNaN(row.flashcard_count) ? 0 : (row.flashcard_count || 0)
      });
    });

    // Pre-calculate today and date ranges
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    
    // Generate day data for the last 30 days
    const dayData: DayData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const counts = dateCountMap.get(dateKey) || { decks: 0, flashcards: 0 };
      
      dayData.push({
        day: getDayName(date),
        date: formatDate(date),
        flashcards: isNaN(counts.flashcards) ? 0 : counts.flashcards,
        decks: isNaN(counts.decks) ? 0 : counts.decks,
      });
    }

    // Generate month data for the last 12 months
    const monthData: MonthData[] = [];
    const monthCountMap = new Map<string, { flashcards: number; decks: number }>();

    // Aggregate data by month using the existing dateCountMap
    for (const [dateKey, counts] of dateCountMap) {
      const date = new Date(dateKey);
      const monthKey = formatMonth(date);
      const current = monthCountMap.get(monthKey) || { flashcards: 0, decks: 0 };
      current.decks += counts.decks;
      current.flashcards += counts.flashcards;
      monthCountMap.set(monthKey, current);
    }

    // Generate month data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      const monthKey = formatMonth(date);
      const monthCount = monthCountMap.get(monthKey) || { flashcards: 0, decks: 0 };
      
      monthData.push({
        month: monthKey,
        flashcards: isNaN(monthCount.flashcards) ? 0 : monthCount.flashcards,
        decks: isNaN(monthCount.decks) ? 0 : monthCount.decks,
      });
    }

    return { dayData, monthData };
  } catch (error) {
    console.error('Error fetching review data:', error);
    // Return empty data if there's an error
    return { dayData: [], monthData: [] };
  }
};

const GRAPH_HEIGHT = 280;
const PADDING = 32;
const X_AXIS_LABEL_GAP = -5; // gap from bottom of graph to day label
const X_AXIS_DATE_GAP = 2; // gap between day and date label
const X_AXIS_EXTRA_HEIGHT = 28; // extra height to fit both labels

type ReviewLineGraphProps = {
  onContentReady?: () => void;
};

export function ReviewLineGraph({ onContentReady }: ReviewLineGraphProps) {
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
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [monthData, setMonthData] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { dayData: fetchedDayData, monthData: fetchedMonthData } = await fetchReviewData();
      setDayData(fetchedDayData);
      setMonthData(fetchedMonthData);
    } catch (error) {
      console.error('Error loading review data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when screen comes into focus
  useEffect(() => {
    loadData();
  }, [isFocused]); // Refresh data when screen comes into focus

  // Use correct data
  const currentData = isMonth ? monthData : dayData;

  // Memoized calculations to prevent recalculation on every render
  const { totalWidth, Y_MAX, Y_STEP } = useMemo(() => {
    // Calculate total width needed for all data points
    const totalWidth = Math.max(GRAPH_WIDTH, PADDING + (currentData.length - 1) * X_STEP + PADDING);

    const yMaxRaw = Math.max(...currentData.map((d: DayData | MonthData) => Math.max(
      isNaN(d.flashcards) ? 0 : d.flashcards, 
      isNaN(d.decks) ? 0 : d.decks
    )));
    const Y_MAX = Math.max(1, Math.ceil(yMaxRaw / 10) * 10); // Ensure minimum value of 1
    const Y_STEP = isMonth ? 10 : 5;

    return { totalWidth, Y_MAX, Y_STEP };
  }, [currentData, isMonth, GRAPH_WIDTH, X_STEP]);

  // Memoized Y calculation function
  const getY = useMemo(() => {
    return (value: number, graphHeight: number) => {
      // Invert y for SVG
      const usableHeight = graphHeight - 2 * PADDING;
      // Prevent division by zero or NaN values
      if (Y_MAX <= 0 || isNaN(Y_MAX) || isNaN(value)) {
        return PADDING + usableHeight; // Return bottom of graph
      }
      const result = PADDING + usableHeight - (value / Y_MAX) * usableHeight;
      // Final safety check to ensure result is a valid number
      return isNaN(result) ? PADDING + usableHeight : result;
    };
  }, [Y_MAX]);

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

  // Points for lines - using all data
//   const flashcardPoints = currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(isMonth ? d.flashcards : d.flashcards, GRAPH_HEIGHT)}`).join(' ');
//   const deckPoints = currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(isMonth ? d.decks : d.decks, GRAPH_HEIGHT)}`).join(' ');

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

  // Show loading or empty state
  if (isLoading) {
    return (
      <View style={{ marginTop: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center' }}>
          {language === 'Chinese' ? '已复习卡组 / 卡片' : 'Decks / Flashcards Reviewed'}
        </Text>
        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' }}>
          {language === 'Chinese' ? '正在加载复习数据...' : 'Loading review data...'}
        </Text>
      </View>
    );
  }

  if (currentData.length === 0) {
    return (
      <View style={{ marginTop: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center' }}>
          {language === 'Chinese' ? '已复习卡组 / 卡片' : 'Decks / Flashcards Reviewed'}
        </Text>
        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' }}>
          {language === 'Chinese' ? '暂无复习数据，开始学习以查看进度！' : 'No review data available yet. Start studying to see your progress!'}
        </Text>
      </View>
    );
  }

  return (
    <View>
    <View style={{ marginTop: 0, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center' }}>
            {language === 'Chinese' ? '已复习卡组 / 卡片' : 'Decks / Flashcards Reviewed'}
        </Text>
        <SmallGreenBinaryToggle
            leftLabel={language === 'Chinese' ? '日' : 'Day'}
            rightLabel={language === 'Chinese' ? '月' : 'Month'}
            style={{ marginTop: 15}}
            onToggle={handleToggle}
        />
        {/* Legend Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 15, marginLeft: 30 }}>
          {/* Decks Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
            <View style={{ width: 20, height: 3, borderRadius: 10, backgroundColor: '#4F41D8' }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F41D8', marginLeft: -1 }} />
            <Text style={{ marginLeft: 6, fontFamily: 'Satoshi-Medium', fontSize: 16, color: '#4F41D8' }}>{language === 'Chinese' ? '卡组' : 'Decks'}</Text>
          </View>
          {/* Flashcards Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 20, height: 3, borderRadius: 10, backgroundColor: '#44B88A' }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#44B88A', marginLeft: -1 }} />
            <Text style={{ marginLeft: 6, fontFamily: 'Satoshi-Medium', fontSize: 16, color: '#44B88A' }}>{language === 'Chinese' ? '卡片' : 'Flashcards'}</Text>
          </View>
        </View>
    </View>
    
    <Animated.View
      style={{
        width: GRAPH_WIDTH,
        height: SVG_HEIGHT,
        alignSelf: 'center',
        marginLeft: 15,
        marginTop: -16,
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
          stroke="#E5E4EA"
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
              stroke="#E5E4EA"
              strokeDasharray={y === 0 ? undefined : y % Y_STEP === 0 ? '4,4' : undefined}
              strokeWidth={1}
            />
            {y % 10 === 0 && (
              <SvgText
                x={GRAPH_WIDTH - PADDING + 8}
                y={getY(y, GRAPH_HEIGHT) + 5}
                fontSize={isMonth ? 10 : 12}
                fill="#D5D4DD"
                fontFamily="Satoshi-Medium"
                textAnchor="start"
              >
                {y}
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
              <Stop offset="0%" stopColor="#5CFFBE" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="deckGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#5C4BFF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
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
              ...currentData.map((d, i) => `${getX(i)},${getY(d.flashcards, GRAPH_HEIGHT)}`),
              `${getX(n - 1)},${GRAPH_HEIGHT-30}`,
              `${getX(0)},${GRAPH_HEIGHT-30}`
            ].join(' ');
            // Polygon for decks area
            const deckPoly = [
              ...currentData.map((d, i) => `${getX(i)},${getY(d.decks, GRAPH_HEIGHT)}`),
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
                {currentData.map((d: DayData | MonthData, i: number) => (
                  <SvgText
                    key={`fc-label-${i}`}
                    x={getX(i)}
                    y={getY(d.flashcards, GRAPH_HEIGHT) - 12}
                    fontSize={12}
                    fill="#44B88A"
                    fontFamily="Satoshi-Bold"
                    textAnchor="middle"
                  >
                    {d.flashcards}
                  </SvgText>
                ))}
                {/* Decks value labels */}
                {currentData.map((d: DayData | MonthData, i: number) => (
                  <SvgText
                    key={`deck-label-${i}`}
                    x={getX(i)}
                    y={getY(d.decks, GRAPH_HEIGHT) - 12}
                    fontSize={12}
                    fill="#4F41D8"
                    fontFamily="Satoshi-Bold"
                    textAnchor="middle"
                  >
                    {d.decks}
                  </SvgText>
                ))}
                {/* Flashcards line and area */}
                <Polyline
                  points={currentData.map((d, i) => `${getX(i)},${getY(d.flashcards, GRAPH_HEIGHT)}`).join(' ')}
                  fill="none"
                  stroke="#44B88A"
                  strokeWidth={2}
                />
                {/* Decks line */}
                <Polyline
                  points={currentData.map((d, i) => `${getX(i)},${getY(d.decks, GRAPH_HEIGHT)}`).join(' ')}
                  fill="none"
                  stroke="#4F41D8"
                  strokeWidth={2}
                />
                {/* Flashcards circles */}
                {currentData.map((d: DayData | MonthData, i: number) => (
                  <G key={`fc-${i}`}>
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.flashcards, GRAPH_HEIGHT)}
                      r={30}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.flashcards, GRAPH_HEIGHT)}
                      r={7}
                      fill="#44B88A"
                    />
                  </G>
                ))}
                {/* Decks circles */}
                {currentData.map((d: DayData | MonthData, i: number) => (
                  <G key={`deck-${i}`}>
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.decks, GRAPH_HEIGHT)}
                      r={30}
                      fill="transparent"
                    //   onPressIn={() => handleDataPointClick(i)}
                    />
                    <Circle
                      cx={getX(i)}
                      cy={getY(d.decks, GRAPH_HEIGHT)}
                      r={7}
                      fill="#4F41D8"
                    />
                  </G>
                ))}
                {/* X axis labels */}
                {currentData.map((d: DayData | MonthData, i: number) => (
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
          onContentSizeChange={handleContentSizeChange}
        >
          <Svg width={totalWidth + PADDING} height={SVG_HEIGHT}>
            {/* Gradient Defs */}
            <Defs>
              <LinearGradient id="flashcardGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#5CFFBE" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="deckGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#5C4BFF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {/* Flashcards faded area */}
            <Polygon
              points={
                [
                  ...currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.flashcards, GRAPH_HEIGHT)}`),
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
                  ...currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.decks, GRAPH_HEIGHT)}`),
                  `${PADDING + 10 + (currentData.length - 1) * X_STEP},${GRAPH_HEIGHT-30}`,
                  `${PADDING + 10},${GRAPH_HEIGHT-30}`
                ].join(' ')
              }
              fill="url(#deckGradient)"
              stroke="none"
            />
            {/* Flashcards value labels */}
            {currentData.map((d: DayData | MonthData, i: number) => (
              <SvgText
                key={`fc-label-${i}`}
                x={PADDING + 10 + i * X_STEP}
                y={getY(d.flashcards, GRAPH_HEIGHT) - 12}
                fontSize={12}
                fill="#44B88A"
                fontFamily="Satoshi-Bold"
                textAnchor="middle"
              >
                {d.flashcards}
              </SvgText>
            ))}
            {/* Decks value labels */}
            {currentData.map((d: DayData | MonthData, i: number) => (
              <SvgText
                key={`deck-label-${i}`}
                x={PADDING + 10 + i * X_STEP}
                y={getY(d.decks, GRAPH_HEIGHT) - 12}
                fontSize={12}
                fill="#4F41D8"
                fontFamily="Satoshi-Bold"
                textAnchor="middle"
              >
                {d.decks}
              </SvgText>
            ))}
            {/* Flashcards line and area */}
            <Polyline
              points={currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.flashcards, GRAPH_HEIGHT)}`).join(' ')}
              fill="none"
              stroke="#44B88A"
              strokeWidth={2}
            />
            {/* Decks line */}
            <Polyline
              points={currentData.map((d, i) => `${PADDING + 10 + i * X_STEP},${getY(d.decks, GRAPH_HEIGHT)}`).join(' ')}
              fill="none"
              stroke="#4F41D8"
              strokeWidth={2}
            />
            {/* Flashcards circles */}
            {currentData.map((d: DayData | MonthData, i: number) => (
              <G key={`fc-${i}`}>
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.flashcards, GRAPH_HEIGHT)}
                  r={30}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
                />
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.flashcards, GRAPH_HEIGHT)}
                  r={7}
                  fill="#44B88A"
                />
              </G>
            ))}
            {/* Decks circles */}
            {currentData.map((d: DayData | MonthData, i: number) => (
              <G key={`deck-${i}`}>
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.decks, GRAPH_HEIGHT)}
                  r={30}
                  fill="transparent"
                  onPressIn={() => handleDataPointClick(i)}
                />
                <Circle
                  cx={PADDING + 10 + i * X_STEP}
                  cy={getY(d.decks, GRAPH_HEIGHT)}
                  r={7}
                  fill="#4F41D8"
                />
              </G>
            ))}
            {/* X axis labels */}
            {currentData.map((d: DayData | MonthData, i: number) => (
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