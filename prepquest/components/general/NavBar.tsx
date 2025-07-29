import React, { useEffect, useImperativeHandle, forwardRef , useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Text, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const EllipseForNavBar = ({ fillColor }: { fillColor: string }) => (
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
    <Path d="M133 0C93.4009 0 103.227 38 66.5 38C29.7731 38 39.5991 0 0 0C39.5991 0 29.7731 0 66.5 0C103.227 0 93.4009 0 133 0Z" fill={fillColor} />
  </Svg>
);

const ICON_SIZE = 28;
const SCREEN_WIDTH = Dimensions.get('window').width;
const NAV_HEIGHT = 80;
const BOTTOM_SPACING = 20;
const CIRCLE_SIZE = ICON_SIZE * 2;
const WHITE_CIRCLE_SIZE = CIRCLE_SIZE * 1.5;
const TAB_WIDTH = (SCREEN_WIDTH - 56) / 4; // 56 is total horizontal padding (28 * 2)

const BASE_SPRING_CONFIG = {
  damping: 10,
  stiffness: 120,
  mass: 0.1,
  velocity: 0.8,
};

// Optimized for Android sliding
const SPRING_CONFIG = Platform.OS === 'ios' ? BASE_SPRING_CONFIG : {
  damping: 12,
  stiffness: 50,
  mass: 0.1,
  velocity: 1,
  overshootClamping: false,
};

const ANDROID_SPRING = {
  damping: 15,
  stiffness: 40,
  mass: 0.3,
  velocity: 0.3,
  overshootClamping: true,
};

const LABEL_SPRING = Platform.OS === 'ios' ? BASE_SPRING_CONFIG : {
  damping: 15,
  stiffness: 35,
  mass: 0.3,
  velocity: 0.3,
  overshootClamping: true,
};

type IconType = 'ionicons' | 'material';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  iconType: IconType;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'account', icon: 'person', route: '/(tabs)/account', iconType: 'ionicons' },
  { name: 'decks', icon: 'library-books', route: '/(tabs)', iconType: 'material' },
  { name: 'statistics', icon: 'stats-chart', route: '/(tabs)/statistics', iconType: 'ionicons' },
  { name: 'awards', icon: 'trophy', route: '/(tabs)/awards', iconType: 'ionicons' },
];

export interface NavBarRef {
  resetAnimation: () => void;
  setDecksTab: () => void;
}

export const NavBar = forwardRef<NavBarRef>((_, ref) => {
  const pathname = usePathname();
  const slideAnimation = useSharedValue(1);
  const isFirstRender = useSharedValue(true);
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Move useAnimatedStyle hooks to top level
  const animatedStyle0 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 0;
    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            Platform.OS === 'ios' ? SPRING_CONFIG : ANDROID_SPRING
          )
        }
      ]
    };
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 1;
    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            Platform.OS === 'ios' ? SPRING_CONFIG : ANDROID_SPRING
          )
        }
      ]
    };
  }, []);

  const animatedStyle2 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 2;
    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            Platform.OS === 'ios' ? SPRING_CONFIG : ANDROID_SPRING
          )
        }
      ]
    };
  }, []);

  const animatedStyle3 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 3;
    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            Platform.OS === 'ios' ? SPRING_CONFIG : ANDROID_SPRING
          )
        }
      ]
    };
  }, []);

  const labelAnimatedStyle0 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 0;
    const progress = isSelected ? 1 : 0;

    return {
      position: 'absolute',
      width: 133,
      alignItems: 'center',
      opacity: withSpring(progress, LABEL_SPRING),
      bottom: -1,
      transform: [
        {
          translateY: withSpring(
            progress === 1 ? 0 : 20,
            LABEL_SPRING
          )
        }
      ]
    };
  }, []);

  const labelAnimatedStyle1 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 1;
    const progress = isSelected ? 1 : 0;

    return {
      position: 'absolute',
      width: 133,
      alignItems: 'center',
      opacity: withSpring(progress, LABEL_SPRING),
      bottom: -1,
      transform: [
        {
          translateY: withSpring(
            progress === 1 ? 0 : 20,
            LABEL_SPRING
          )
        }
      ]
    };
  }, []);

  const labelAnimatedStyle2 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 2;
    const progress = isSelected ? 1 : 0;

    return {
      position: 'absolute',
      width: 133,
      alignItems: 'center',
      opacity: withSpring(progress, LABEL_SPRING),
      bottom: -1,
      transform: [
        {
          translateY: withSpring(
            progress === 1 ? 0 : 20,
            LABEL_SPRING
          )
        }
      ]
    };
  }, []);

  const labelAnimatedStyle3 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 3;
    const progress = isSelected ? 1 : 0;

    return {
      position: 'absolute',
      width: 133,
      alignItems: 'center',
      opacity: withSpring(progress, LABEL_SPRING),
      bottom: -1,
      transform: [
        {
          translateY: withSpring(
            progress === 1 ? 0 : 20,
            LABEL_SPRING
          )
        }
      ]
    };
  }, []);

  const circleStyle0 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 0;
    const backgroundColor = isFirstRender.value && !isSelected
      ? 'transparent'
      : colors.brandColor2;

    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            SPRING_CONFIG
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
      opacity: withSpring(isSelected ? 1 : 0, SPRING_CONFIG),
      zIndex: 4
    };
  }, [colors.brandColor2]);

  const circleStyle1 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 1;
    const backgroundColor = isFirstRender.value && !isSelected
      ? 'transparent'
      : colors.brandColor2;

    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            SPRING_CONFIG
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
      opacity: withSpring(isSelected ? 1 : 0, SPRING_CONFIG),
      zIndex: 4
    };
  }, [colors.brandColor2]);

  const circleStyle2 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 2;
    const backgroundColor = isFirstRender.value && !isSelected
      ? 'transparent'
      : colors.brandColor2;

    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            SPRING_CONFIG
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
      opacity: withSpring(isSelected ? 1 : 0, SPRING_CONFIG),
      zIndex: 4
    };
  }, [colors.brandColor2]);

  const circleStyle3 = useAnimatedStyle(() => {
    const isSelected = slideAnimation.value === 3;
    const backgroundColor = isFirstRender.value && !isSelected
      ? 'transparent'
      : colors.brandColor2;

    return {
      transform: [
        {
          translateY: withSpring(
            isSelected ? -CIRCLE_SIZE * 0.6 : 0,
            SPRING_CONFIG
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
      opacity: withSpring(isSelected ? 1 : 0, SPRING_CONFIG),
      zIndex: 4
    };
  }, [colors.brandColor2]);

  const resetAnimation = () => {
    if (Platform.OS === 'ios') {
      slideAnimation.value = withSpring(-2, SPRING_CONFIG);
    } else {
      slideAnimation.value = withTiming(-2, {
        duration: 0,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
    isFirstRender.value = true;
  };

  const setDecksTab = () => {
    if (Platform.OS === 'ios') {
      slideAnimation.value = withSpring(1, SPRING_CONFIG);
    } else {
      slideAnimation.value = withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };

  useImperativeHandle(ref, () => ({
    resetAnimation,
    setDecksTab
  }));

  useEffect(() => {
    // Trigger animation for Decks tab on first render
    if (Platform.OS === 'ios') {
      slideAnimation.value = withSpring(1, SPRING_CONFIG);
    } else {
      // Use timing for more predictable sliding on Android
      slideAnimation.value = withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, []);

  const getIconComponent = useCallback((item: NavItem) => {
    return item.iconType === 'material' ? MaterialIcons : Ionicons;
  }, []);

  const getWhiteCircleStyle = useAnimatedStyle(() => {
    const numTabs = 4;
    const tabWidth = ICON_SIZE * 2;
    const horizontalPadding = 28;
    const availableSpace = SCREEN_WIDTH - (horizontalPadding * 2);
    const gap = (availableSpace - (tabWidth * numTabs)) / (numTabs - 1);

    // Precompute tab centers
    const tabCenters = Array.from({ length: numTabs }, (_, i) =>
      horizontalPadding + (tabWidth / 2) + i * (tabWidth + gap)
    );

    // Interpolate the center based on slideAnimation.value
    const currentTabCenter = interpolate(
      slideAnimation.value,
      [0, 1, 2, 3],
      tabCenters
    );

    const whiteCircleCenterOffset = 133 / 2;
    const basePosition = currentTabCenter - whiteCircleCenterOffset;

    return {
      position: 'absolute',
      width: 133,
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 1,
      zIndex: 0,
      bottom: 23,
      transform: [
        {
          translateX: Platform.OS === 'ios' 
            ? withSpring(basePosition, SPRING_CONFIG)
            : withTiming(basePosition, {
                duration: 200,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              })
        }
      ]
    };
  }, []);

  const handleTabPress = (index: number) => {
    if (isFirstRender.value) {
      isFirstRender.value = false;
    }
    
    if (Platform.OS === 'ios') {
      slideAnimation.value = withSpring(index, SPRING_CONFIG);
    } else {
      slideAnimation.value = withTiming(index, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };

  // Get tab labels from string constants
  const getTabLabel = (name: string) => {
    const navItems = strings[language || 'English'].navItems;
    
    if (name === 'statistics') {
      return navItems.stats;
    }
    
    return navItems[name as keyof typeof navItems] || name;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={getWhiteCircleStyle}>
          <EllipseForNavBar fillColor={colors.background} />
        </Animated.View>
        {NAV_ITEMS.map((item, index) => {
          const IconComponent = getIconComponent(item);
          const isActive = pathname === item.route;
          
          // Get the correct animated styles based on index
          const animatedStyle = [animatedStyle0, animatedStyle1, animatedStyle2, animatedStyle3][index];
          const labelAnimatedStyle = [labelAnimatedStyle0, labelAnimatedStyle1, labelAnimatedStyle2, labelAnimatedStyle3][index];
          const circleStyle = [circleStyle0, circleStyle1, circleStyle2, circleStyle3][index];
          
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
                <Animated.View style={labelAnimatedStyle}>
                  <Text style={styles.accountLabel}>
                    {getTabLabel(item.name)}
                  </Text>
                </Animated.View>
                <Animated.View style={circleStyle} />
                <Animated.View
                  style={[
                    styles.iconContainer,
                    animatedStyle,
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
});

NavBar.displayName = 'NavBar';

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    height: NAV_HEIGHT,
    backgroundColor: colors.brandColor2,
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
    color: colors.background,
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  }
}); 