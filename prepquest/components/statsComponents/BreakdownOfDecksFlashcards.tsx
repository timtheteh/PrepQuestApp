import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SmallGreenBinaryToggle } from '../general/SmallGreenBinaryToggle';
import { Engine, World, Bodies, Body, Events } from 'matter-js';
import { getBreakdownData, BreakdownDatum } from '@/db/decks';
import { useIsFocused } from '@react-navigation/native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface BreakdownOfDecksFlashcardsProps {
  onContentReady?: () => void;
}

// Function to fetch real data from database
const fetchBreakdownData = async (): Promise<{ decksData: BreakdownDatum[], flashcardsData: BreakdownDatum[] }> => {
  try {
    return await getBreakdownData();
  } catch (error) {
    // Return empty data if there's an error
    return { decksData: [], flashcardsData: [] };
  }
};

const BOUNCE_SPEED = 2.0; // slightly faster speed
const FPS = 60;

// Mapping for category labels to Chinese/English
const CATEGORY_LABELS: Record<string, { en: string; zh: string }> = {
  'Study': { en: strings.English.breakdownCategoryLabels.study, zh: strings.Chinese.breakdownCategoryLabels.study },
  'Technical': { en: strings.English.breakdownCategoryLabels.technical, zh: strings.Chinese.breakdownCategoryLabels.technical },
  'Case study': { en: strings.English.breakdownCategoryLabels.caseStudy, zh: strings.Chinese.breakdownCategoryLabels.caseStudy },
  'Behavioral': { en: strings.English.breakdownCategoryLabels.behavioral, zh: strings.Chinese.breakdownCategoryLabels.behavioral },
  'Brainteasers': { en: strings.English.breakdownCategoryLabels.brainteasers, zh: strings.Chinese.breakdownCategoryLabels.brainteasers },
  'Others': { en: strings.English.breakdownCategoryLabels.others, zh: strings.Chinese.breakdownCategoryLabels.others },
};

export function BreakdownOfDecksFlashcards({ onContentReady }: BreakdownOfDecksFlashcardsProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
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
        restitution: 0.8, // Reduced restitution to prevent excessive bouncing
        friction: 0.1, // Added slight friction
        frictionAir: 0.01, // Added slight air resistance
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

    // Add walls with thicker boundaries and better collision detection
    const wallThickness = 20; // Increased wall thickness
    const walls = [
      // top
      Bodies.rectangle(containerWidth / 2, -wallThickness / 2, containerWidth, wallThickness, { 
        isStatic: true,
        label: 'wall-top',
        restitution: 0.8
      }),
      // bottom
      Bodies.rectangle(containerWidth / 2, containerHeight + wallThickness / 2, containerWidth, wallThickness, { 
        isStatic: true,
        label: 'wall-bottom',
        restitution: 0.8
      }),
      // left
      Bodies.rectangle(-wallThickness / 2, containerHeight / 2, wallThickness, containerHeight, { 
        isStatic: true,
        label: 'wall-left',
        restitution: 0.8
      }),
      // right
      Bodies.rectangle(containerWidth + wallThickness / 2, containerHeight / 2, wallThickness, containerHeight, { 
        isStatic: true,
        label: 'wall-right',
        restitution: 0.8
      }),
    ];
    World.add(world, walls);

    // Update positions on each tick with improved boundary enforcement
    intervalRef.current = setInterval(() => {
      Engine.update(engine, 1000 / FPS);
      
      // Improved boundary enforcement and velocity control
      bodiesRef.current.forEach(b => {
        const radius = b.circleRadius;
        
        // Enforce boundaries - if bubble escapes, bring it back
        if (b.position.x - radius < 0) {
          Body.setPosition(b, { x: radius, y: b.position.y });
          Body.setVelocity(b, { x: Math.abs(b.velocity.x), y: b.velocity.y });
        }
        if (b.position.x + radius > containerWidth) {
          Body.setPosition(b, { x: containerWidth - radius, y: b.position.y });
          Body.setVelocity(b, { x: -Math.abs(b.velocity.x), y: b.velocity.y });
        }
        if (b.position.y - radius < 0) {
          Body.setPosition(b, { x: b.position.x, y: radius });
          Body.setVelocity(b, { x: b.velocity.x, y: Math.abs(b.velocity.y) });
        }
        if (b.position.y + radius > containerHeight) {
          Body.setPosition(b, { x: b.position.x, y: containerHeight - radius });
          Body.setVelocity(b, { x: b.velocity.x, y: -Math.abs(b.velocity.y) });
        }
        
        // Maintain constant speed
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
        <Text style={[styles.title, {
          fontFamily: Fonts.title,
          color: colors.text
        }]}>{strings[language].breakdownOfDecksFlashcards}</Text>
        <Text style={[{
          fontFamily: Fonts.bodyMedium,
          fontSize: 16,
          textAlign: 'center',
          marginTop: 20,
          color: colors.unselectedText
        }]}>
          {strings[language].loading}
        </Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, {
          fontFamily: Fonts.title,
          color: colors.text
        }]}>{strings[language].breakdownOfDecksFlashcards}</Text>
        <Text style={[{
          fontFamily: Fonts.bodyMedium,
          fontSize: 16,
          textAlign: 'center',
          marginTop: 20,
          color: colors.unselectedText
        }]}>
          {strings[language].noDataAvailable}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {
        fontFamily: Fonts.title,
        color: colors.text
      }]}>{strings[language].breakdownOfDecksFlashcards}</Text>
      <View style={{ alignItems: 'center', marginTop: 15 }}>
        <SmallGreenBinaryToggle
          leftLabel={strings[language].breakdownDecks}
          rightLabel={strings[language].breakdownFlashcards}
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
                    fontFamily: Fonts.bodyBold,
                    color: d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : colors.text,
                    fontSize: (d.label == 'Case study' || d.label == 'Brainteasers') ? 12 : 16
                  }
                ]}>{
                  language === 'Chinese'
                    ? CATEGORY_LABELS[d.label]?.zh || d.label
                    : CATEGORY_LABELS[d.label]?.en || d.label
                }</Text>
                <Text style={[styles.bubbleText, {
                  fontFamily: Fonts.bodyMedium,
                  color: d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : colors.text
                }]}>{`${d.value} (${d.percent}%)`}</Text>
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
    textAlign: 'center',
  },
  bubbleLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 2,
  },
}); 