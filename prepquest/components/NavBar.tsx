import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
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

const ICON_SIZE = 28;
const SCREEN_WIDTH = Dimensions.get('window').width;
const NAV_HEIGHT = 80;
const BOTTOM_SPACING = 20;
const CIRCLE_SIZE = ICON_SIZE * 2;

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
  { name: 'stats-chart', icon: 'stats-chart', route: '/(tabs)/statistics', iconType: 'ionicons' },
  { name: 'Awards', icon: 'trophy', route: '/(tabs)/awards', iconType: 'ionicons' },
];

export function NavBar() {
  const pathname = usePathname();
  const accountAnimation = useSharedValue(0);
  const isFirstRender = useSharedValue(true);

  const getIconComponent = useCallback((item: NavItem) => {
    return item.iconType === 'material' ? MaterialIcons : Ionicons;
  }, []);

  const sharedAnimationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            accountAnimation.value,
            [0, 1],
            [0, -CIRCLE_SIZE * 1.2]
          )
        }
      ]
    };
  });

  const accountCircleStyle = useAnimatedStyle(() => {
    const backgroundColor = isFirstRender.value 
      ? 'transparent'
      : '#4F41D8';

    return {
      transform: [
        {
          translateY: interpolate(
            accountAnimation.value,
            [0, 1],
            [0, -CIRCLE_SIZE * 1.2]
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
        accountAnimation.value === 0 && isFirstRender.value ? 0 : 1,
        {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        }
      )
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = getIconComponent(item);
          const isActive = pathname === item.route;
          const isAccount = item.name === 'Account';
          
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
                  if (isAccount) {
                    if (isFirstRender.value) {
                      isFirstRender.value = false;
                    }
                    accountAnimation.value = withSpring(
                      accountAnimation.value === 0 ? 1 : 0,
                      {
                        damping: 20,
                        stiffness: 90,
                        mass: 0.5,
                        velocity: 0.4
                      }
                    );
                  }
                }}
              >
                {isAccount && (
                  <Animated.View style={accountCircleStyle} />
                )}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    isAccount && sharedAnimationStyle
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
  },
  content: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    alignItems: 'center',
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
  }
}); 