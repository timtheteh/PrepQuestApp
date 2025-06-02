import React, { useState, useContext } from 'react';
import { StyleSheet, Animated, Dimensions, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MenuContext } from '@/app/(tabs)/_layout';
import { ModalButton } from './ModalButton';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type TimeFilter = 'today' | 'week' | 'month' | 'all' | 'custom' | null;

interface CalendarModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  onDone?: (selectedFilter: TimeFilter, customDate?: string) => void;
  title?: string;
}

export function CalendarModal({ 
  visible,
  opacity = new Animated.Value(0),
  onDone,
  title = 'Filter decks based on\ndate added'
}: CalendarModalProps) {
  const { handleDismissMenu } = useContext(MenuContext);
  const [confirmedFilter, setConfirmedFilter] = useState<TimeFilter>('all');
  const [currentFilter, setCurrentFilter] = useState<TimeFilter>('all');
  const [confirmedDate, setConfirmedDate] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Reset to last confirmed selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setCurrentFilter(confirmedFilter);
      setSelectedDate(confirmedDate);
    }
  }, [visible, confirmedFilter, confirmedDate]);

  const handleDone = () => {
    const finalFilter = currentFilter === null ? 'all' : currentFilter;
    setConfirmedFilter(finalFilter);
    setConfirmedDate(finalFilter === 'custom' ? selectedDate : '');
    if (onDone) {
      onDone(finalFilter, finalFilter === 'custom' ? selectedDate : undefined);
    }
    handleDismissMenu();
  };

  const handleButtonPress = (filter: TimeFilter) => {
    setCurrentFilter(currentFilter === filter ? null : filter);
    if (filter !== 'custom') {
      setSelectedDate('');
    }
  };

  const handleDateSelect = (date: any) => {
    setSelectedDate(date.dateString);
    setCurrentFilter('custom');
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              Press Done or Choose Date to apply your selection.
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {title}
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
          <View style={styles.calendarContainer}>
            <Calendar
              current={selectedDate || undefined}
              onDayPress={handleDateSelect}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#4F41D8'
                }
              }}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#4F41D8',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#4F41D8',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#4F41D8',
                monthTextColor: '#000000',
                textMonthFontFamily: 'Satoshi-Medium',
                textDayHeaderFontFamily: 'Satoshi-Regular',
                textDayFontFamily: 'Satoshi-Regular',
                textDayHeaderFontSize: 14,
                textMonthFontSize: 20,
                arrowColor: '#000000',
              }}
            />
          </View>
          {selectedDate && (
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {selectedDate.split('-').reverse().join(' / ')}
              </Text>
              <TouchableOpacity 
                style={styles.chooseDateButton}
                onPress={handleDone}
              >
                <Text style={styles.chooseDateButtonText}>Choose Date</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 350,
    height: SCREEN_HEIGHT > 900 ? 600 : 504,
    marginLeft: -175,
    marginTop: SCREEN_HEIGHT > 900 ? -300 : -252,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    zIndex: 1001,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  subtitleRow: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Neuton-Regular',
    flex: 1,
    lineHeight: 24,
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
  calendarContainer: {
    marginTop: 0,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  dateDisplay: {
    marginTop: 16,
    paddingLeft: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: '#000000',
  },
  chooseDateButton: {
    backgroundColor: '#4F41D8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  chooseDateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  },
}); 