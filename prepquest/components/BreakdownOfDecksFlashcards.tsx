import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SmallGreenBinaryToggle } from './SmallGreenBinaryToggle';
import { Engine, World, Bodies, Body, Events } from 'matter-js';
import { db } from '@/db/index';

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
    // Get all decks with their types - use interviewType for interview decks, deckType for study decks
    const decks = await db.getAllAsync(`
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
    `);

    // Count decks by type
    const deckTypeCounts = new Map<string, number>();
    const deckIdsByType = new Map<string, number[]>();

    decks.forEach((deck: any) => {
      const type = deck.categoryType;
      deckTypeCounts.set(type, (deckTypeCounts.get(type) || 0) + 1);
      
      if (!deckIdsByType.has(type)) {
        deckIdsByType.set(type, []);
      }
      deckIdsByType.get(type)!.push(deck.deckID);
    });

    // Get flashcard counts for each deck type
    const flashcardTypeCounts = new Map<string, number>();

    for (const [type, deckIds] of deckIdsByType) {
      if (deckIds.length === 0) continue;

      const placeholders = deckIds.map(() => '?').join(',');
      const flashcardCount = await db.getFirstAsync(`
        SELECT COUNT(*) as count
        FROM (
          SELECT flashcardID FROM flashcards WHERE deckID IN (${placeholders})
          UNION ALL
          SELECT flashcardID FROM AIFlashcards WHERE deckID IN (${placeholders})
        )
      `, [...deckIds, ...deckIds]);

      flashcardTypeCounts.set(type, (flashcardCount as any)?.count || 0);
    }

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
    const totalDecks = Array.from(deckTypeCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalFlashcards = Array.from(flashcardTypeCounts.values()).reduce((sum, count) => sum + count, 0);

    // Create decks data
    const decksData: BreakdownDatum[] = Array.from(deckTypeCounts.entries()).map(([type, count]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percent: totalDecks > 0 ? Math.round((count / totalDecks) * 100) : 0,
      color: typeColors[type as keyof typeof typeColors] || '#98CE7F'
    }));

    // Create flashcards data
    const flashcardsData: BreakdownDatum[] = Array.from(flashcardTypeCounts.entries()).map(([type, count]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percent: totalFlashcards > 0 ? Math.round((count / totalFlashcards) * 100) : 0,
      color: typeColors[type as keyof typeof typeColors] || '#98CE7F'
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

  // Bubble sizes (relative to value or percent)
  const maxRadius = 80;
  const minRadius = 40;
  const maxValue = Math.max(...data.map(d => d.value));
  const getRadius = (value: number) => {
    if (data.length === 0) return minRadius;
    if (maxValue === 0) return minRadius;
    return minRadius + ((value / maxValue) * (maxRadius - minRadius));
  };

  // Physics engine setup
  const [positions, setPositions] = useState<{ x: number; y: number; }[]>([]);
  const engineRef = useRef<any>(null);
  const bodiesRef = useRef<any[]>([]);
  const worldRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  // Fetch data on component mount
  useEffect(() => {
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

    loadData();
  }, []);

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

    // Create bubbles as circular bodies
    const bubbles = data.map((d, i) => {
      const radius = getRadius(d.value);
      // Place bubbles randomly but not overlapping
      let placed = false;
      let x = 0, y = 0;
      let tries = 0;
      while (!placed && tries < 1000) {
        x = Math.random() * (containerWidth - 2 * radius) + radius;
        y = Math.random() * (containerHeight - 2 * radius) + radius;
        placed = true;
        for (let j = 0; j < i; j++) {
          const other = bodiesRef.current[j];
          if (other) {
            const dx = x - other.position.x;
            const dy = y - other.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + other.circleRadius + 2) {
              placed = false;
              break;
            }
          }
        }
        tries++;
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

    // Update positions on each tick
    intervalRef.current = setInterval(() => {
      Engine.update(engine, 1000 / FPS);
      // Enforce constant velocity for each bubble
      bodiesRef.current.forEach(b => {
        const vx = b.velocity.x;
        const vy = b.velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed !== BOUNCE_SPEED && speed > 0) {
          // Normalize to BOUNCE_SPEED, preserve direction
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
  }, [data]);

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
                <Text style={[styles.bubbleLabel, {color: d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : '#000000'}]}>{d.label}</Text>
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