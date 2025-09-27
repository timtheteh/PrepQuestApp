import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
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
import { statisticsCache, CACHE_KEYS } from '@/utils/statisticsCache';

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

const BOUNCE_SPEED = 2.0; // Same speed for both iOS and Android
const ANDROID_OPTIMIZED_FPS = 60; // Keep 60 FPS for smooth Android animations
const ANDROID_UPDATE_INTERVAL = Platform.OS === 'android' ? 16.67 : 16; // Optimized for Android

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
  const [showBalls, setShowBalls] = useState(false); // New state for 2-second delay
  const data = renderedIsFlashcards ? flashcardsData : decksData;
  const screenWidth = Dimensions.get('window').width;
  const containerHeight = 440;
  const containerWidth = screenWidth;
  const isFocused = useIsFocused();

  // Get performance-based animation config
  const animationConfig = useMemo(() => getAnimationConfig(), []);
  
  // Optimized FPS for smooth Android animations
  const fps = useMemo(() => {
    return ANDROID_OPTIMIZED_FPS; // Always use 60 FPS for smooth animations
  }, []);

  // Android-specific optimizations
  const isAndroid = Platform.OS === 'android';
  const updateInterval = isAndroid ? ANDROID_UPDATE_INTERVAL : 16;

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

  // Pre-calculate initial positions to prevent clumping
  const initialPositions = useMemo(() => {
    if (data.length === 0) return [];
    
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    const maxDistanceFromCenter = Math.min(containerWidth, containerHeight) * 0.35;
    const positions: { x: number; y: number; r: number }[] = [];
    
    data.forEach((d, i) => {
      const radius = getRadius(d.value);
      let x = centerX;
      let y = centerY;
      
      if (data.length > 1) {
        // Distribute in expanding spiral pattern for better initial spread
        const angle = (i / data.length) * 2 * Math.PI + (i * 0.5); // Add spiral offset
        const distance = (i / data.length) * maxDistanceFromCenter + radius * 1.5;
        
        x = centerX + Math.cos(angle) * distance;
        y = centerY + Math.sin(angle) * distance;
        
        // Ensure within bounds with padding
        x = Math.max(radius + 15, Math.min(containerWidth - radius - 15, x));
        y = Math.max(radius + 15, Math.min(containerHeight - radius - 15, y));
        
        // Collision avoidance with previously placed balls
        let attempts = 0;
        while (attempts < 15) {
          let hasCollision = false;
          
          for (const existing of positions) {
            const dx = x - existing.x;
            const dy = y - existing.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = radius + existing.r + 25; // Extra spacing
            
            if (dist < minDist) {
              // Move away from collision
              const pushAngle = Math.atan2(dy, dx);
              const pushDistance = minDist - dist + 5;
              x += Math.cos(pushAngle) * pushDistance;
              y += Math.sin(pushAngle) * pushDistance;
              
              // Keep in bounds
              x = Math.max(radius + 15, Math.min(containerWidth - radius - 15, x));
              y = Math.max(radius + 15, Math.min(containerHeight - radius - 15, y));
              
              hasCollision = true;
              break;
            }
          }
          
          if (!hasCollision) break;
          attempts++;
        }
      }
      
      positions.push({ x, y, r: radius });
    });
    
    return positions;
  }, [data, getRadius, containerWidth, containerHeight]);

  // Physics engine setup - initialize with pre-calculated positions
  const [positions, setPositions] = useState<{ x: number; y: number; }[]>(() => initialPositions);
  const engineRef = useRef<any>(null);
  const bodiesRef = useRef<any[]>([]);
  const worldRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  // Update positions immediately when data changes
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  // Data loading with delayed ball reveal and caching
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setShowBalls(false); // Hide balls during loading
    try {
      // Try to get cached data first, fallback to database fetch
      const breakdownData = await statisticsCache.getCachedOrFetch(
        CACHE_KEYS.BREAKDOWN_DATA,
        fetchBreakdownData
      );
      
      setDecksData(breakdownData.decksData);
      setFlashcardsData(breakdownData.flashcardsData);
      
      // Add 2-second delay to allow physics engine to settle before showing balls
      setTimeout(() => {
        setShowBalls(true);
      }, 2000);
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
    // Skip physics engine for empty data
    if (data.length === 0) {
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

    // Create engine and world optimized for smooth Android performance
    const engine = Engine.create({ 
      enableSleeping: false, // Disable sleeping for consistent smooth motion
      timing: {
        timeScale: isAndroid ? 0.9 : 1.0, // Slightly slower for Android stability
        timestamp: 0
      }
    });
    
    // Android-specific engine optimizations
    if (isAndroid) {
      engine.constraintIterations = 3; // Reduced iterations for better performance
      engine.positionIterations = 6; // Balanced position accuracy
      engine.velocityIterations = 4; // Optimized velocity calculations
    }
    const world = engine.world;
    engine.gravity.y = 0;
    engine.gravity.x = 0;
    worldRef.current = world;
    engineRef.current = engine;

    // Create bubbles using pre-calculated positions to eliminate clumping
    const bubbles = data.map((d, i) => {
      const radius = getRadius(d.value);
      
      // Use pre-calculated positions for immediate proper placement
      const initialPos = initialPositions[i] || { 
        x: containerWidth / 2, 
        y: containerHeight / 2, 
        r: radius 
      };
      
      const x = initialPos.x;
      const y = initialPos.y;
      
      const body = Bodies.circle(x, y, radius, {
        restitution: isAndroid ? 0.75 : 0.8, // Slightly less bouncy on Android for stability
        friction: isAndroid ? 0.08 : 0.1, // Optimized friction for Android
        frictionAir: isAndroid ? 0.008 : 0.01, // Slightly less air resistance on Android
        label: d.label,
        render: { 
          fillStyle: theme === 'dark' ? colors.background : d.color,
          strokeStyle: theme === 'dark' ? d.color : 'transparent',
          lineWidth: theme === 'dark' ? 3 : 0
        },
        sleepingAllowed: false, // Never allow sleeping for consistent motion
        inertia: Infinity, // Prevent rotation for better performance
      });
      
      // Give initial velocity for natural movement (no outward bias needed since positions are pre-spread)
      const angle = Math.random() * 2 * Math.PI;
      const speed = BOUNCE_SPEED;
      
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

    // High-performance Android-optimized animation loop
    let lastTime = performance.now();
    let frameId: number;
    
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      // Use requestAnimationFrame for smoother Android performance
      if (deltaTime >= updateInterval) {
        // Update physics with consistent timestep
        Engine.update(engine, updateInterval);
        
        // Optimized boundary enforcement and velocity control
        bodiesRef.current.forEach(b => {
          const radius = b.circleRadius;
          
          // Smooth boundary enforcement with velocity dampening
          if (b.position.x - radius < 0) {
            Body.setPosition(b, { x: radius, y: b.position.y });
            Body.setVelocity(b, { x: Math.abs(b.velocity.x) * 0.9, y: b.velocity.y * 0.95 });
          }
          if (b.position.x + radius > containerWidth) {
            Body.setPosition(b, { x: containerWidth - radius, y: b.position.y });
            Body.setVelocity(b, { x: -Math.abs(b.velocity.x) * 0.9, y: b.velocity.y * 0.95 });
          }
          if (b.position.y - radius < 0) {
            Body.setPosition(b, { x: b.position.x, y: radius });
            Body.setVelocity(b, { x: b.velocity.x * 0.95, y: Math.abs(b.velocity.y) * 0.9 });
          }
          if (b.position.y + radius > containerHeight) {
            Body.setPosition(b, { x: b.position.x, y: containerHeight - radius });
            Body.setVelocity(b, { x: b.velocity.x * 0.95, y: -Math.abs(b.velocity.y) * 0.9 });
          }
          
          // Maintain target speed with smooth adjustments
          const vx = b.velocity.x;
          const vy = b.velocity.y;
          const currentSpeed = Math.sqrt(vx * vx + vy * vy);
          const targetSpeed = BOUNCE_SPEED;
          
          if (Math.abs(currentSpeed - targetSpeed) > 0.05) {
            const scale = targetSpeed / currentSpeed;
            const smoothScale = isAndroid ? 
              0.95 + (scale - 0.95) * 0.1 : // Gradual adjustment for Android
              0.9 + (scale - 0.9) * 0.2;     // Faster adjustment for iOS
            Body.setVelocity(b, { x: vx * smoothScale, y: vy * smoothScale });
          }
        });
        
        // Update positions for smooth rendering
        setPositions(bodiesRef.current.map(b => ({ 
          x: b.position.x, 
          y: b.position.y, 
          r: b.circleRadius 
        })));
        
        lastTime = currentTime;
      }
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (intervalRef.current) clearInterval(intervalRef.current);
      Engine.clear(engine);
      engineRef.current = null;
      bodiesRef.current = [];
      worldRef.current = null;
    };
     
  }, [data, getRadius, containerWidth, containerHeight, fps, animationConfig, initialPositions, isAndroid, updateInterval]);

  // Optimized fade animation with performance-based durations
  useEffect(() => {
    if (isFlashcards === renderedIsFlashcards) return;
    
    // Hide balls during transition to prevent clumping
    setShowBalls(false);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: animationConfig.duration, // Use performance-based duration
      useNativeDriver: true,
    }).start(() => {
      setRenderedIsFlashcards(isFlashcards);
      fadeAnim.setValue(0);
      
      // Show balls after 2-second delay to ensure smooth spread
      setTimeout(() => {
        setShowBalls(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animationConfig.duration * 1.5, // Slightly longer fade in
          useNativeDriver: true,
        }).start();
      }, 2000);
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
  if (isLoading || !showBalls) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, {
          fontFamily: Fonts.title,
          color: colors.text
        }]}>{strings[language].breakdownOfDecksFlashcards}</Text>
        {!isLoading && (
          <View style={{ alignItems: 'center', marginTop: 15 }}>
            <SmallGreenBinaryToggle
              leftLabel={strings[language].breakdownDecks}
              rightLabel={strings[language].breakdownFlashcards}
              onToggle={setIsFlashcards}
              initialPosition={isFlashcards ? 'right' : 'left'}
            />
          </View>
        )}
        <Text style={[{
          fontFamily: Fonts.bodyMedium,
          fontSize: 16,
          textAlign: 'center',
          marginTop: 20,
          color: colors.unselectedText
        }]}>
          {isLoading ? strings[language].loading : strings[language].preparingAnimation}
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
        {!showBalls && data.length > 0 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={[{
              fontFamily: Fonts.bodyMedium,
              fontSize: 16,
              textAlign: 'center',
              color: colors.unselectedText
            }]}>
              {strings[language].preparingAnimation}
            </Text>
          </View>
        )}
        <Animated.View style={{ flex: 1, width: '100%', height: '100%', opacity: fadeAnim }}>
          {showBalls && data.map((d: BreakdownDatum, i: number) => {
            const radius = getRadius(d.value);
            // Use physics positions for smooth animations on all devices
            const pos = positions[i] || { x: containerWidth / 2, y: containerHeight / 2 };
            
            return (
              <View
                key={d.label}
                style={[
                  styles.bubble,
                  {
                    backgroundColor: theme === 'dark' ? colors.background : d.color,
                    borderWidth: theme === 'dark' ? 3 : 0,
                    borderColor: theme === 'dark' ? d.color : 'transparent',
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
                    color: theme === 'dark' 
                      ? colors.text 
                      : (d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : colors.text),
                    fontSize: (d.label == 'Case study' || d.label == 'Brainteasers') ? 12 : 16
                  }
                ]}>{
                  language === 'Chinese'
                    ? CATEGORY_LABELS[d.label]?.zh || d.label
                    : CATEGORY_LABELS[d.label]?.en || d.label
                }</Text>
                <Text style={[styles.bubbleText, {
                  fontFamily: Fonts.bodyMedium,
                  color: theme === 'dark' 
                    ? colors.text 
                    : (d.label == 'Technical' || d.label == 'Others' || d.label == 'Brainteasers' ? '#FFFFFF' : colors.text)
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