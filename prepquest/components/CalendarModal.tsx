import React, { useState, useContext } from 'react';
import { StyleSheet, Animated, Dimensions, View, Text, TouchableOpacity } from 'react-native';
import { ModalButton } from './ModalButton';
import { MenuContext } from '@/app/(tabs)/_layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFilter = 'today' | 'week' | 'month' | 'all' | null;

interface CalendarModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  onDone?: (selectedFilter: TimeFilter) => void;
}

export function CalendarModal({ 
  visible,
  opacity = new Animated.Value(0),
  onDone
}: CalendarModalProps) {
  const { handleDismissMenu } = useContext(MenuContext);
  // Persistent selection that's remembered between modal opens
  const [confirmedFilter, setConfirmedFilter] = useState<TimeFilter>('all');
  // Temporary selection while modal is open
  const [currentFilter, setCurrentFilter] = useState<TimeFilter>('all');

  // Reset current selection to confirmed selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentFilter(confirmedFilter);
    }
  }, [visible]);

  const handleDone = () => {
    // If no selection is made, default to 'all'
    const finalFilter = currentFilter === null ? 'all' : currentFilter;
    setConfirmedFilter(finalFilter);
    if (onDone) {
      onDone(finalFilter);
    }
    handleDismissMenu();
  };

  const handleButtonPress = (filter: TimeFilter) => {
    // If the same button is pressed again, deselect it
    setCurrentFilter(currentFilter === filter ? null : filter);
  };

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
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.doneButton}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <ModalButton 
            text="Today"
            selected={currentFilter === 'today'}
            onPress={() => handleButtonPress('today')}
          />
          <ModalButton 
            text="This Week"
            selected={currentFilter === 'week'}
            onPress={() => handleButtonPress('week')}
          />
        </View>
        <View style={styles.buttonRow}>
          <ModalButton 
            text="This Month"
            selected={currentFilter === 'month'}
            onPress={() => handleButtonPress('month')}
          />
          <ModalButton 
            text="All Time"
            selected={currentFilter === 'all'}
            onPress={() => handleButtonPress('all')}
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