import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ModalButton } from './ModalButton';
import { useLanguage } from '@/contexts/LanguageContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type TimeFilter = 'today' | 'week' | 'month' | 'all' | 'custom' | null;

interface CalendarModalProps {
  visible: boolean;
  onDone?: (selectedFilter: TimeFilter, customDate?: string) => void;
  onDismiss?: () => void;
  title?: string;
}

export function CalendarModal({ 
  visible,
  onDone,
  onDismiss,
  title
}: CalendarModalProps) {
  const [confirmedFilter, setConfirmedFilter] = useState<TimeFilter>('all');
  const [currentFilter, setCurrentFilter] = useState<TimeFilter>('all');
  const [confirmedDate, setConfirmedDate] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { language } = useLanguage();

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }} pointerEvents="box-none">
        {/* Grey background, only pressable outside modal */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          onPress={onDismiss}
          pointerEvents="auto"
        />
        {/* Modal content */}
        <View style={styles.centeredContent} pointerEvents="box-none">
          <View style={styles.container} pointerEvents="auto">
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <View style={styles.subtitleRow}>
                  <Text style={[styles.subtitle, {
                    // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular', 
                    fontSize: language === 'Chinese' ? 14 : 16}]}>
                    {language === 'Chinese' ? '点击"确定"或"选择日期"应用您的选择。' : 'Press "Done" or "Choose Date" to apply your selection.'}
                  </Text>
                </View>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, {
                    // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Neuton-Regular', 
                    fontSize: language === 'Chinese' ? 20 : 24}]}>
                    {title}
                  </Text>
                  <TouchableOpacity onPress={handleDone}>
                    <Text style={[styles.doneButton, {
                      // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium', 
                      fontSize: language === 'Chinese' ? 18 : 20}]}>{language === 'Chinese' ? '确定' : 'Done'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                  <ModalButton 
                    text={language === 'Chinese' ? '今天' : 'Today'}
                    selected={currentFilter === 'today'}
                    onPress={() => handleButtonPress('today')}
                    language={language}
                  />
                  <ModalButton 
                    text={language === 'Chinese' ? '本周' : 'This Week'}
                    selected={currentFilter === 'week'}
                    onPress={() => handleButtonPress('week')}
                  />
                </View>
                <View style={styles.buttonRow}>
                  <ModalButton 
                    text={language === 'Chinese' ? '本月' : 'This Month'}
                    selected={currentFilter === 'month'}
                    onPress={() => handleButtonPress('month')}
                  />
                  <ModalButton 
                    text={language === 'Chinese' ? '全部' : 'All'}
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
                      <Text style={[styles.chooseDateButtonText, {
                        // fontFamily: language === 'Chinese' ? 'NotoSansSC-Medium' : 'Satoshi-Medium'
                        }]}>{language === 'Chinese' ? '选择日期' : 'Choose Date'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: 350,
    height: SCREEN_HEIGHT > 900 ? 600 : 504,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
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