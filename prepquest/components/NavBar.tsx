import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Link, usePathname } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';

const EllipseForNavBar = () => (
  <Svg 
    width={133} 
    height={38} 
    viewBox="0 0 133 38" 
    fill="none"
    style={{
      position: 'absolute',
      bottom: 0,
      left: -0.5
    }}
  >
    <Path d="M133 0C93.4009 0 103.227 38 66.5 38C29.7731 38 39.5991 0 0 0C39.5991 0 29.7731 0 66.5 0C103.227 0 93.4009 0 133 0Z" fill="white" />
  </Svg>
);

const ICON_SIZE = 28;
const SCREEN_WIDTH = Dimensions.get('window').width;
const NAV_HEIGHT = 80;
const BOTTOM_SPACING = 20;
const CIRCLE_SIZE = ICON_SIZE * 2;
const WHITE_CIRCLE_SIZE = CIRCLE_SIZE * 1.5;
const TAB_WIDTH = (SCREEN_WIDTH - 56) / 4; // 56 is total horizontal padding (28 * 2)
const SPRING_CONFIG = {
  damping: 10,
  stiffness: 150,
  mass: 0.1,
  velocity: 0.8
};

type IconType = 'ionicons' | 'material';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  iconType: IconType;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Account', icon: 'person', route: '/(tabs)/account', iconType: 'ionicons' },
  { name: 'Decks', icon: 'library-books', route: '/(tabs)', iconType: 'material' },
  { name: 'Statistics', icon: 'stats-chart', route: '/(tabs)/statistics', iconType: 'ionicons' },
  { name: 'Awards', icon: 'trophy', route: '/(tabs)/awards', iconType: 'ionicons' },
];

export function NavBar() {
  const pathname = usePathname();
  const slideAnimation = useSharedValue(1);
  const isFirstRender = useSharedValue(true);

  useEffect(() => {
    // Trigger animation for Decks tab on first render
    slideAnimation.value = withSpring(1, SPRING_CONFIG);
  }, []);

  const getIconComponent = useCallback((item: NavItem) => {
    return item.iconType === 'material' ? MaterialIcons : Ionicons;
  }, []);

  const getAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const isSelected = slideAnimation.value === index;
      return {
        transform: [
          {
            translateY: interpolate(
              isSelected ? 1 : 0,
              [0, 1],
              [0, -CIRCLE_SIZE * 0.6]
            )
          }
        ]
      };
    });
  };

  const getWhiteCircleStyle = useAnimatedStyle(() => {
    // Calculate offset based on the current tab
    const offset = (() => {
      if (slideAnimation.value === 0) {
        if (SCREEN_WIDTH <= 375) {
          return -10
        }
        else if (SCREEN_WIDTH <= 390) {
          return -10
        }
        else if (SCREEN_WIDTH <= 428) {
          return -10
        }
        else {
          return -10
        }
      }; // Account tab
      if (slideAnimation.value === 1) {
        if (SCREEN_WIDTH <= 375) {
          return -2
        }
        else if (SCREEN_WIDTH <= 390) {
          return 0
        }
        else if (SCREEN_WIDTH <= 428) {
          return 0
        }
        else {
          return 3
        }
      }; // Account tab
      if (slideAnimation.value === 2) {
        if (SCREEN_WIDTH <= 375) {
          return 6
        }
        else if (SCREEN_WIDTH <= 390) {
          return 9
        }
        else if (SCREEN_WIDTH <= 428) {
          return 9
        }
        else {
          return 15
        }
      };// Awards tab
      if (slideAnimation.value === 3) {
        if (SCREEN_WIDTH <= 375) {
          return 13
        }
        else if (SCREEN_WIDTH <= 390) {
          return 18
        }
        else if (SCREEN_WIDTH <= 428) {
          return 18
        }
        else {
          return 27
        }
      };
      return 0; // Other tabs
    })();

    return {
      position: 'absolute',
      width: 133,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 1,
      zIndex: 0,
      bottom: 22,
      transform: [
        {
          translateX: withSpring(slideAnimation.value * TAB_WIDTH + offset, SPRING_CONFIG)
        }
      ]
    };
  });

  const getLabelAnimatedStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const isSelected = slideAnimation.value === index;
      const progress = isSelected ? 1 : 0;

      const opacity = interpolate(
        progress,
        [0, 0.5, 1],
        [0, 0.5, 1]
      );

      const translateY = interpolate(
        progress,
        [0, 1],
        [20, 0]
      );

      return {
        position: 'absolute',
        width: 133,
        alignItems: 'center',
        opacity: withSpring(opacity, SPRING_CONFIG),
        bottom: -1,
        transform: [
          {
            translateY: withSpring(translateY, SPRING_CONFIG)
          }
        ]
      };
    });
  };

  const getCircleStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const isSelected = slideAnimation.value === index;
      const backgroundColor = isFirstRender.value && !isSelected
        ? 'transparent'
        : '#4F41D8';

      const progress = isSelected ? 1 : 0;
      const translateY = interpolate(
        progress,
        [0, 1],
        [0, -CIRCLE_SIZE * 0.6]
      );

      const opacity = interpolate(
        progress,
        [0, 0.5, 1],
        [0, 0.5, 1]
      );

      return {
        transform: [
          {
            translateY: withSpring(translateY, SPRING_CONFIG)
          }
        ],
        backgroundColor,
        borderRadius: CIRCLE_SIZE,
        position: 'absolute',
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: withSpring(opacity, SPRING_CONFIG),
        zIndex: 4
      };
    });
  };

  const handleTabPress = (index: number) => {
    if (isFirstRender.value) {
      isFirstRender.value = false;
    }
    
    slideAnimation.value = withSpring(index, SPRING_CONFIG);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={getWhiteCircleStyle}>
          <EllipseForNavBar />
        </Animated.View>
        {NAV_ITEMS.map((item, index) => {
          const IconComponent = getIconComponent(item);
          const isActive = pathname === item.route;
          
          return (
            <Link
              key={item.name}
              href={item.route as any}
              asChild
            >
              <TouchableOpacity 
                style={styles.tab}
                activeOpacity={1}
                onPress={() => handleTabPress(index)}
              >
                <Animated.View style={getLabelAnimatedStyle(index)}>
                  <Text style={styles.accountLabel}>
                    {item.name === 'Statistics' ? 'Stats' : item.name}
                  </Text>
                </Animated.View>
                <Animated.View style={getCircleStyle(index)} />
                <Animated.View
                  style={[
                    styles.iconContainer,
                    getAnimatedStyle(index),
                    { zIndex: 5 }
                  ]}
                >
                  <IconComponent 
                    name={item.icon as any}
                    size={ICON_SIZE} 
                    color="#FFFFFF"
                  />
                </Animated.View>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: NAV_HEIGHT,
    backgroundColor: '#4F41D8',
    justifyContent: 'flex-end',
    paddingBottom: BOTTOM_SPACING,
    zIndex: 0,
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 0,
  },
  tab: {
    width: ICON_SIZE * 2,
    height: ICON_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  }
}); 