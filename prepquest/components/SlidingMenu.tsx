import React from 'react';
import { StyleSheet, Animated, View, Platform, Dimensions, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SlidingMenuProps {
  visible: boolean;
  translateX: Animated.Value;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function SlidingMenu({ 
  visible,
  translateX
}: SlidingMenuProps) {
  
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.menu,
        {
          transform: [{ translateX }]
        }
      ]}
    >
      <View style={styles.menuContent}>
        <View style={styles.menuItem}>
          <FontAwesome name="folder" size={30} color="white" />
          <Text style={styles.menuText}>View Folders</Text>
        </View>
        <View style={[styles.menuItem, styles.secondItem]}>
          <FontAwesome name="star" size={30} color="white" />
          <Text style={styles.menuText}>View Favorites</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: SCREEN_HEIGHT <= 670 ? 40 : 70,
    left: 0,
    width: 171,
    height: 152,
    backgroundColor: '#4F41D8',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1001, // Higher than the grey overlay
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    left: 15
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondItem: {
    marginTop: 33,
  },
  menuText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  },
}); 