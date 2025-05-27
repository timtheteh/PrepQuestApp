import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Link, usePathname } from 'expo-router';

const ICON_SIZE = 28;
const SCREEN_WIDTH = Dimensions.get('window').width;
const NAV_HEIGHT = 80;
const BOTTOM_SPACING = 20;

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

  const getIconComponent = useCallback((item: NavItem) => {
    return item.iconType === 'material' ? MaterialIcons : Ionicons;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {NAV_ITEMS.map((item) => {
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
                activeOpacity={0.7}
              >
                <IconComponent 
                  name={item.icon as any}
                  size={ICON_SIZE} 
                  color="#FFFFFF"
                  style={[
                    styles.icon,
                    isActive && styles.activeIcon
                  ]}
                />
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
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: {
    width: ICON_SIZE * 2,
    height: ICON_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    opacity: 1,
  },
  activeIcon: {
    opacity: 1,
  }
}); 