import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { getAnimationConfig } from '@/utils/animationConfig';

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
const HIGH_END_FPS = 60;
const LOW_END_FPS = 30; // Reduced FPS for low-end devices

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

  // Get performance-based animation config
  const animationConfig = useMemo(() => getAnimationConfig(), []);
  
  // Performance-based FPS selection
  const fps = useMemo(() => {
    return animationConfig.duration <= 100 ? LOW_END_FPS : HIGH_END_FPS;
  }, [animationConfig]);

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

  // Memoized function to load data
  const loadData = useCallback(async () => {
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
  }, []);

  // Fetch data on component mount and when screen comes into focus
  useEffect(() => {
    loadData();
  }, [isFocused, loadData]); // Refresh data when screen comes into focus

  useEffect(() => {
    // Skip physics engine for empty data or low-end devices with too many bubbles
    if (data.length === 0 || (animationConfig.duration <= 100 && data.length > 6)) {
      return;
    }

    // Clean up previous engine if any
    if (engineRef.current) {
      Engine.clear(engineRef.current);
      engineRef.current = null;
      bodiesRef.current = [];
      worldRef.current = null;
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    // Create engine and world with optimized settings for low-end devices
    const engine = Engine.create({ 
      enableSleeping: animationConfig.duration <= 100, // Enable sleeping for low-end devices
      timing: {
        timeScale: animationConfig.duration <= 100 ? 0.5 : 1.0 // Slower physics for low-end devices
      }
    });
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
        restitution: animationConfig.duration <= 100 ? 0.6 : 0.8, // Lower restitution for low-end devices
        friction: animationConfig.duration <= 100 ? 0.3 : 0.1, // Higher friction for low-end devices
        frictionAir: animationConfig.duration <= 100 ? 0.05 : 0.01, // Higher air resistance for low-end devices
        label: d.label,
        render: { fillStyle: d.color },
        sleepingAllowed: animationConfig.duration <= 100, // Allow sleeping for low-end devices
      });
      
      // Give a random slow velocity (reduced for low-end devices)
      const angle = Math.random() * 2 * Math.PI;
      const speed = animationConfig.duration <= 100 ? BOUNCE_SPEED * 0.7 : BOUNCE_SPEED;
      Body.setVelocity(body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
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

    // Optimized update loop with performance-based settings
    let frameCount = 0;
    intervalRef.current = setInterval(() => {
      Engine.update(engine, 1000 / fps);
      
      // Skip expensive calculations for low-end devices on some frames
      const shouldUpdateBoundaries = animationConfig.duration > 100 || frameCount % 3 === 0;
      const shouldUpdateVelocity = animationConfig.duration > 100 || frameCount % 5 === 0;
      
      if (shouldUpdateBoundaries || shouldUpdateVelocity) {
        // Optimized boundary enforcement and velocity control
        bodiesRef.current.forEach(b => {
          const radius = b.circleRadius;
          
          // Enforce boundaries - if bubble escapes, bring it back
          if (shouldUpdateBoundaries) {
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
          }
          
          // Maintain constant speed (less frequent for low-end devices)
          if (shouldUpdateVelocity) {
            const vx = b.velocity.x;
            const vy = b.velocity.y;
            const speed = Math.sqrt(vx * vx + vy * vy);
            const targetSpeed = animationConfig.duration <= 100 ? BOUNCE_SPEED * 0.7 : BOUNCE_SPEED;
            if (Math.abs(speed - targetSpeed) > 0.1) {
              const scale = targetSpeed / speed;
              Body.setVelocity(b, { x: vx * scale, y: vy * scale });
            }
          }
        });
      }
      
      // Update positions less frequently for low-end devices
      const shouldUpdatePositions = animationConfig.duration > 100 || frameCount % 2 === 0;
      if (shouldUpdatePositions) {
        setPositions(bodiesRef.current.map(b => ({ x: b.position.x, y: b.position.y, r: b.circleRadius })));
      }
      
      frameCount++;
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Engine.clear(engine);
      engineRef.current = null;
      bodiesRef.current = [];
      worldRef.current = null;
    };
     
  }, [data, getRadius, containerWidth, containerHeight, fps, animationConfig]);

  // Optimized fade animation with performance-based durations
  useEffect(() => {
    if (isFlashcards === renderedIsFlashcards) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: animationConfig.duration, // Use performance-based duration
      useNativeDriver: true,
    }).start(() => {
      setRenderedIsFlashcards(isFlashcards);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationConfig.duration * 1.5, // Slightly longer fade in
        useNativeDriver: true,
      }).start();
    });
  }, [isFlashcards, fadeAnim, animationConfig]);

  // Memoized static bubble positions for low-end devices
  const staticPositions = useMemo(() => {
    if (data.length === 0) return [];
    
    // Create static grid positions for low-end devices
    const cols = Math.min(3, Math.ceil(Math.sqrt(data.length)));
    const rows = Math.ceil(data.length / cols);
    const cellWidth = containerWidth / cols;
    const cellHeight = containerHeight / rows;
    
    return data.map((d, i) => {
      const radius = getRadius(d.value);
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: col * cellWidth + cellWidth / 2,
        y: row * cellHeight + cellHeight / 2,
        r: radius
      };
    });
  }, [data, getRadius, containerWidth, containerHeight]);

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
            // Use static positions for low-end devices or when physics engine is disabled
            const pos = (animationConfig.duration <= 100 && data.length > 6) || positions.length === 0 
              ? staticPositions[i] || { x: containerWidth / 2, y: containerHeight / 2 }
              : positions[i] || { x: containerWidth / 2, y: containerHeight / 2 };
            
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