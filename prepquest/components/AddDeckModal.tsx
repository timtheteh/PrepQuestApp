import React from 'react';
import { StyleSheet, Animated, Dimensions, View, Text } from 'react-native';
import { InterviewStudyToggle } from './InterviewStudyToggle';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddDeckModalProps {
  visible: boolean;
  opacity?: Animated.Value;
}

export function AddDeckModal({ 
  visible,
  opacity = new Animated.Value(0)
}: AddDeckModalProps) {
  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacity
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.column}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add Deck</Text>
          </View>
          <View style={styles.toggleRow}>
            <InterviewStudyToggle />
          </View>
          <View style={styles.row}>
            {/* Third row content will be added here */}
          </View>
          <View style={styles.row}>
            {/* Fourth row content will be added here */}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: '50%',
    width: 355,
    height: 388,
    marginLeft: -177.5, // Half of width
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 10,
    borderColor: '#4F41D8',
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  column: {
    flex: 1,
    flexDirection: 'column',
  },
  titleRow: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Neuton-Regular',
    fontSize: 32,
    textAlign: 'center',
  },
  toggleRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  row: {
    marginBottom: 24,
  },
}); 