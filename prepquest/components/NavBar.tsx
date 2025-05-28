import React from 'react';
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
const WHITE_CIRCLE_SIZE = CIRCLE_SIZE * 1.5; // Larger white circle

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
  const accountAnimation = useSharedValue(0);
  const decksAnimation = useSharedValue(0);
  const statisticsAnimation = useSharedValue(0);
  const awardsAnimation = useSharedValue(0);
  const isFirstRender = useSharedValue(true);

  const getIconComponent = useCallback((item: NavItem) => {
    return item.iconType === 'material' ? MaterialIcons : Ionicons;
  }, []);

  const getAnimatedStyle = (animationValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              animationValue.value,
              [0, 1],
              [0, -CIRCLE_SIZE * 0.6]
            )
          }
        ]
      };
    });
  };

  const getWhiteCircleStyle = (animationValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => {
      const opacity = interpolate(
        animationValue.value,
        [0, 0.2, 0.8, 1],
        [0, 0, 1, 1]
      );

      return {
        position: 'absolute',
        width: 133,
        height: 38,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        zIndex: 1,
        bottom: 22 // Position it just above the navbar
      };
    });
  };

  const getLabelAnimatedStyle = (animationValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => {
      const opacity = interpolate(
        animationValue.value,
        [0, 0.2, 0.8, 1],
        [0, 0, 1, 1]
      );

      return {
        position: 'absolute',
        width: 133,
        alignItems: 'center',
        opacity,
        bottom: -1,
        transform: [
          {
            translateY: interpolate(
              animationValue.value,
              [0, 1],
              [30, 0]
            )
          }
        ]
      };
    });
  };

  const getCircleStyle = (animationValue: Animated.SharedValue<number>) => {
    return useAnimatedStyle(() => {
      const backgroundColor = isFirstRender.value 
        ? 'transparent'
        : '#4F41D8';

      return {
        transform: [
          {
            translateY: interpolate(
              animationValue.value,
              [0, 1],
              [0, -CIRCLE_SIZE * 0.6]
            )
          }
        ],
        backgroundColor,
        borderRadius: CIRCLE_SIZE,
        position: 'absolute',
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: withTiming(
          animationValue.value === 0 && isFirstRender.value ? 0 : 1,
          {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }
        ),
        zIndex: 2
      };
    });
  };

  const handleTabPress = (tabName: string) => {
    if (isFirstRender.value) {
      isFirstRender.value = false;
    }

    const springConfig = {
      damping: 20,
      stiffness: 90,
      mass: 0.5,
      velocity: 0.4
    };

    // Reset all animations
    accountAnimation.value = withSpring(0, springConfig);
    decksAnimation.value = withSpring(0, springConfig);
    statisticsAnimation.value = withSpring(0, springConfig);
    awardsAnimation.value = withSpring(0, springConfig);

    // Animate the selected tab
    switch (tabName) {
      case 'Account':
        accountAnimation.value = withSpring(1, springConfig);
        break;
      case 'Decks':
        decksAnimation.value = withSpring(1, springConfig);
        break;
      case 'Statistics':
        statisticsAnimation.value = withSpring(1, springConfig);
        break;
      case 'Awards':
        awardsAnimation.value = withSpring(1, springConfig);
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = getIconComponent(item);
          const isActive = pathname === item.route;
          const isAccount = item.name === 'Account';
          const isDecks = item.name === 'Decks';
          const isStatistics = item.name === 'Statistics';
          const isAwards = item.name === 'Awards';
          
          const animationValue = isAccount 
            ? accountAnimation 
            : isDecks 
            ? decksAnimation 
            : isStatistics
            ? statisticsAnimation
            : isAwards
            ? awardsAnimation
            : null;
          
          const shouldAnimate = isAccount || isDecks || isStatistics || isAwards;
          
          return (
            <Link
              key={item.name}
              href={item.route as any}
              asChild
            >
              <TouchableOpacity 
                style={styles.tab}
                activeOpacity={1}
                onPress={() => {
                  if (shouldAnimate) {
                    handleTabPress(item.name);
                  }
                }}
              >
                {shouldAnimate && animationValue && (
                  <>
                    <Animated.View style={getWhiteCircleStyle(animationValue)}>
                      <EllipseForNavBar />
                    </Animated.View>
                    <Animated.View style={getLabelAnimatedStyle(animationValue)}>
                      <Text style={styles.accountLabel}>
                        {item.name === 'Statistics' ? 'Stats' : item.name}
                      </Text>
                    </Animated.View>
                    <Animated.View style={getCircleStyle(animationValue)} />
                  </>
                )}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    animationValue && getAnimatedStyle(animationValue),
                    shouldAnimate && { zIndex: 3 }
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