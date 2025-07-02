import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SmallGreenBinaryToggle } from './SmallGreenBinaryToggle';
import { Engine, World, Bodies, Body, Events } from 'matter-js';
import { db } from '@/db/index';
import { useIsFocused } from '@react-navigation/native';

interface BreakdownDatum {
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface BreakdownOfDecksFlashcardsProps {
  onContentReady?: () => void;
}

// Function to fetch real data from database
const fetchBreakdownData = async (): Promise<{ decksData: BreakdownDatum[], flashcardsData: BreakdownDatum[] }> => {
  try {
    // Single optimized query with JOINs to get both deck counts and flashcard counts
    const result = await db.getAllAsync(`
      WITH deck_categories AS (
        SELECT 
          CASE 
            WHEN deckType = 'interview' THEN interviewType 
            ELSE deckType 
          END as categoryType,
          deckID 
        FROM decks 
        WHERE deckType IS NOT NULL
        UNION ALL
        SELECT 
          CASE 
            WHEN deckType = 'interview' THEN interviewType 
            ELSE deckType 
          END as categoryType,
          deckID 
        FROM AIDecks 
        WHERE deckType IS NOT NULL
      ),
      category_counts AS (
        SELECT 
          categoryType,
          COUNT(*) as deck_count,
          GROUP_CONCAT(deckID) as deck_ids
        FROM deck_categories
        GROUP BY categoryType
      ),
      flashcard_counts AS (
        SELECT 
          cc.categoryType,
          cc.deck_count,
          COALESCE(SUM(flashcard_count), 0) as total_flashcards
        FROM category_counts cc
        LEFT JOIN (
          SELECT 
            dc.categoryType,
            COUNT(*) as flashcard_count
          FROM deck_categories dc
          LEFT JOIN flashcards f ON dc.deckID = f.deckID
          GROUP BY dc.categoryType
          UNION ALL
          SELECT 
            dc.categoryType,
            COUNT(*) as flashcard_count
          FROM deck_categories dc
          LEFT JOIN AIFlashcards af ON dc.deckID = af.deckID
          GROUP BY dc.categoryType
        ) fc ON cc.categoryType = fc.categoryType
        GROUP BY cc.categoryType
      )
      SELECT 
        categoryType,
        deck_count,
        total_flashcards
      FROM flashcard_counts
      ORDER BY deck_count DESC
    `);

    // Define colors for each type
    const typeColors = {
      'study': '#5CC8BE',
      'technical': '#D7191C',
      'case study': '#C3EB79',
      'behavioral': '#FDAE61',
      'brainteasers': '#357AF6',
      'others': '#AF52DE'
    };

    // Calculate totals
    const totalDecks = result.reduce((sum: number, row: any) => sum + row.deck_count, 0);
    const totalFlashcards = result.reduce((sum: number, row: any) => sum + row.total_flashcards, 0);

    // Create decks data
    const decksData: BreakdownDatum[] = result.map((row: any) => ({
      label: row.categoryType.charAt(0).toUpperCase() + row.categoryType.slice(1),
      value: row.deck_count,
      percent: totalDecks > 0 ? Math.round((row.deck_count / totalDecks) * 100) : 0,
      color: typeColors[row.categoryType as keyof typeof typeColors] || '#98CE7F'
    }));

    // Create flashcards data
    const flashcardsData: BreakdownDatum[] = result.map((row: any) => ({
      label: row.categoryType.charAt(0).toUpperCase() + row.categoryType.slice(1),
      value: row.total_flashcards,
      percent: totalFlashcards > 0 ? Math.round((row.total_flashcards / totalFlashcards) * 100) : 0,
      color: typeColors[row.categoryType as keyof typeof typeColors] || '#98CE7F'
    }));

    return { decksData, flashcardsData };
  } catch (error) {
    console.error('Error fetching breakdown data:', error);
    // Return empty data if there's an error
    return { decksData: [], flashcardsData: [] };
  }
};

const BOUNCE_SPEED = 2.0; // slightly faster speed
const FPS = 60;

export function BreakdownOfDecksFlashcards({ onContentReady }: BreakdownOfDecksFlashcardsProps) {
  const [isFlashcards, setIsFlashcards] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [renderedIsFlashcards, setRenderedIsFlashcards] = useState(false);
  const [decksData, setDecksData] = useState<BreakdownDatum[]>([]);
  const [flashcardsData, setFlashcardsData] = useState<BreakdownDatum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const data = renderedIsFlashcards ? flashcardsData : decksData;
  const screenWidth = Dimensions.get('window').width;
  const containerHeight = 440;
  const containerWidth = screenWidth;
  const isFocused = useIsFocused();

  // Bubble sizes (relative to value or percent)
  const maxRadius = 80;
  const minRadius = 40;
  
  // Memoized calculations to prevent recalculation on every render
  const { maxValue, getRadius } = useMemo(() => {
    const maxValue = Math.max(...data.map(d => d.value));
    const getRadius = (value: number) => {
      if (data.length === 0) return minRadius;
      if (maxValue === 0) return minRadius;
      return minRadius + ((value / maxValue) * (maxRadius - minRadius));
    };
    return { maxValue, getRadius };
  }, [data, minRadius, maxRadius]);

  // Physics engine setup
  const [positions, setPositions] = useState<{ x: number; y: number; }[]>([]);
  const engineRef = useRef<any>(null);
  const bodiesRef = useRef<any[]>([]);
  const worldRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  // Function to load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { decksData: fetchedDecksData, flashcardsData: fetchedFlashcardsData } = await fetchBreakdownData();
      setDecksData(fetchedDecksData);
      setFlashcardsData(fetchedFlashcardsData);
    } catch (error) {
      console.error('Error loading breakdown data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when screen comes into focus
  useEffect(() => {
    loadData();
  }, [isFocused]); // Refresh data when screen comes into focus

  useEffect(() => {
    // Clean up previous engine if any
    if (engineRef.current) {
      Engine.clear(engineRef.current);
      engineRef.current = null;
      bodiesRef.current = [];
      worldRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    // Create engine and world
    const engine = Engine.create({ enableSleeping: false });
    const world = engine.world;
    engine.gravity.y = 0;
    engine.gravity.x = 0;
    worldRef.current = world;
    engineRef.current = engine;

    // Create bubbles as circular bodies with optimized placement
    const bubbles = data.map((d, i) => {
      const radius = getRadius(d.value);
      
      // Optimized placement algorithm - use grid-based placement instead of random
      let x = 0, y = 0;
      const gridSize = Math.max(radius * 2 + 10, 60);
      const cols = Math.floor(containerWidth / gridSize);
      const rows = Math.floor(containerHeight / gridSize);
      
      // Try grid positions first, then fall back to random
      let placed = false;
      let tries = 0;
      const maxTries = Math.min(100, cols * rows); // Limit tries to prevent infinite loop
      
      while (!placed && tries < maxTries) {
        if (tries < cols * rows) {
          // Grid-based placement
          const col = tries % cols;
          const row = Math.floor(tries / cols);
          x = col * gridSize + radius + 10;
          y = row * gridSize + radius + 10;
        } else {
          // Fallback to random placement
          x = Math.random() * (containerWidth - 2 * radius) + radius;
          y = Math.random() * (containerHeight - 2 * radius) + radius;
        }
        
        placed = true;
        // Only check collision with previously placed bubbles
        for (let j = 0; j < i; j++) {
          const other = bodiesRef.current[j];
          if (other) {
            const dx = x - other.position.x;
            const dy = y - other.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + other.circleRadius + 5) { // Increased buffer for better spacing
              placed = false;
              break;
            }
          }
        }
        tries++;
      }
      
      // If still not placed, use center position
      if (!placed) {
        x = containerWidth / 2;
        y = containerHeight / 2;
      }
      
      const body = Bodies.circle(x, y, radius, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        label: d.label,
        render: { fillStyle: d.color },
        sleepingAllowed: false,
      });
      
      // Give a random slow velocity
      const angle = Math.random() * 2 * Math.PI;
      Body.setVelocity(body, {
        x: Math.cos(angle) * BOUNCE_SPEED,
        y: Math.sin(angle) * BOUNCE_SPEED,
      });
      return body;
    });
    bodiesRef.current = bubbles;
    World.add(world, bubbles);

    // Add walls
    const wallThickness = 10;
    const walls = [
      // top
      Bodies.rectangle(containerWidth / 2, -wallThickness / 2, containerWidth, wallThickness, { isStatic: true }),
      // bottom
      Bodies.rectangle(containerWidth / 2, containerHeight + wallThickness / 2, containerWidth, wallThickness, { isStatic: true }),
      // left
      Bodies.rectangle(-wallThickness / 2, containerHeight / 2, wallThickness, containerHeight, { isStatic: true }),
      // right
      Bodies.rectangle(containerWidth + wallThickness / 2, containerHeight / 2, wallThickness, containerHeight, { isStatic: true }),
    ];
    World.add(world, walls);

    // Update positions on each tick with optimized velocity enforcement
    intervalRef.current = setInterval(() => {
      Engine.update(engine, 1000 / FPS);
      
      // Optimized velocity enforcement - only update if needed
      bodiesRef.current.forEach(b => {
        const vx = b.velocity.x;
        const vy = b.velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (Math.abs(speed - BOUNCE_SPEED) > 0.1) { // Only update if significantly different
          const scale = BOUNCE_SPEED / speed;
          Body.setVelocity(b, { x: vx * scale, y: vy * scale });
        }
      });
      
      setPositions(bodiesRef.current.map(b => ({ x: b.position.x, y: b.position.y, r: b.circleRadius })));
    }, 1000 / FPS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Engine.clear(engine);
      engineRef.current = null;
      bodiesRef.current = [];
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, getRadius, containerWidth, containerHeight]);

  // Fade out, then switch data, then fade in
  useEffect(() => {
    if (isFlashcards === renderedIsFlashcards) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setRenderedIsFlashcards(isFlashcards);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlashcards]);

  // Show loading or empty state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Breakdown of Number of {'\n'}Decks / Flashcards</Text>
        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' }}>
          Loading breakdown data...
        </Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Breakdown of Number of {'\n'}Decks / Flashcards</Text>
        <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 16, textAlign: 'center', marginTop: 20, color: '#666' }}>
          No data available yet. Create some decks to see the breakdown!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Breakdown of Number of {'\n'}Decks / Flashcards</Text>
      <View style={{ alignItems: 'center', marginTop: 15 }}>
        <SmallGreenBinaryToggle
          leftLabel="Decks"
          rightLabel="Flashcards"
          onToggle={setIsFlashcards}
          initialPosition={isFlashcards ? 'right' : 'left'}
        />
      </View>
      <View style={{ height: containerHeight, width: '100%', marginTop: 15 }}>
        <Animated.View style={{ flex: 1, width: '100%', height: '100%', opacity: fadeAnim }}>
          {data.map((d: BreakdownDatum, i: number) => {
            const radius = getRadius(d.value);
            const pos = positions[i] || { x: containerWidth / 2, y: containerHeight / 2 };
            return (
              <View
                key={d.label}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: d.color,
                    width: radius * 2,
                    height: radius * 2,
                    borderRadius: radius,
                    position: 'absolute',
                    top: pos.y - radius,
                    left: pos.x - radius,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={[
                  styles.bubbleLabel, 
                  {
                    color: d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : '#000000',
                    fontSize: (d.label == 'Case study' || d.label == 'Brainteasers') ? 12 : 16
                  }
                ]}>{d.label}</Text>
                <Text style={[styles.bubbleText, {color: d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : '#000000'}]}>{`${d.value} (${d.percent}%)`}</Text>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    textAlign: 'center',
  },
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#000',
    textAlign: 'center',
  },
  bubbleLabel: {
    fontSize: 16,
    fontFamily: 'Satoshi-Variable',
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 2,
  },
}); 