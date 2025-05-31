import React, { useState } from 'react';
import { StyleSheet, Animated, Dimensions, View, Text, TouchableOpacity } from 'react-native';
import { ModalButton } from './ModalButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface CalendarModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  onDone?: () => void;
}

export function CalendarModal({ 
  visible,
  opacity = new Animated.Value(0),
  onDone
}: CalendarModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('week');

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
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            Filter decks based on{'\n'}date added
          </Text>
          <TouchableOpacity onPress={onDone}>
            <Text style={styles.doneButton}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <ModalButton 
            text="Today"
            selected={selectedFilter === 'today'}
            onPress={() => setSelectedFilter('today')}
          />
          <ModalButton 
            text="This Week"
            selected={selectedFilter === 'week'}
            onPress={() => setSelectedFilter('week')}
          />
        </View>
        <View style={styles.buttonRow}>
          <ModalButton 
            text="This Month"
            selected={selectedFilter === 'month'}
            onPress={() => setSelectedFilter('month')}
          />
          <ModalButton 
            text="All Time"
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 350,
    height: 504,
    marginLeft: -175, // Half of width
    marginTop: -252, // Half of height
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  content: {
    flex: 1,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    flex: 1,
    lineHeight: 28,
  },
  doneButton: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
    paddingTop: 2
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
}); 