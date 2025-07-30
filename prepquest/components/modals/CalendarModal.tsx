import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ModalButton } from './ModalButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';


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
  const { theme } = useTheme();
  const colors = Colors[theme];

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
          <View style={[styles.container, { backgroundColor: colors.background }]} pointerEvents="auto">
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <View style={styles.subtitleRow}>
                  <Text style={[styles.subtitle, {
                    fontFamily: Fonts.title,
                    fontSize: language === 'Chinese' ? 14 : 16,
                    color: colors.text
                  }]}>
                    {strings[language].calendarSubtitle}
                  </Text>
                </View>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, {
                    fontFamily: Fonts.title,
                    fontSize: language === 'Chinese' ? 20 : 24,
                    color: colors.text
                  }]}>
                    {title}
                  </Text>
                  <TouchableOpacity onPress={handleDone}>
                    <Text style={[styles.doneButton, {
                      fontFamily: Fonts.bodyMedium,
                      fontSize: language === 'Chinese' ? 18 : 20,
                      color: colors.brandColor1
                    }]}>{strings[language].done}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                  <ModalButton 
                    text={strings[language].today}
                    selected={currentFilter === 'today'}
                    onPress={() => handleButtonPress('today')}
                    language={language}
                  />
                  <ModalButton 
                    text={strings[language].thisWeek}
                    selected={currentFilter === 'week'}
                    onPress={() => handleButtonPress('week')}
                  />
                </View>
                <View style={styles.buttonRow}>
                  <ModalButton 
                    text={strings[language].thisMonth}
                    selected={currentFilter === 'month'}
                    onPress={() => handleButtonPress('month')}
                  />
                  <ModalButton 
                    text={strings[language].all}
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
                        selectedColor: colors.brandColor2
                      }
                    }}
                    theme={{
                      backgroundColor: colors.background,
                      calendarBackground: colors.background,
                      textSectionTitleColor: colors.unselectedText,
                      selectedDayBackgroundColor: colors.brandColor2,
                      selectedDayTextColor: colors.background,
                      todayTextColor: colors.brandColor2,
                      dayTextColor: colors.text,
                      textDisabledColor: colors.unselectedText,
                      dotColor: colors.brandColor2,
                      monthTextColor: colors.text,
                      textMonthFontFamily: Fonts.bodyMedium,
                      textDayHeaderFontFamily: Fonts.bodyMedium,
                      textDayFontFamily: Fonts.bodyMedium,
                      textDayHeaderFontSize: 14,
                      textMonthFontSize: 20,
                      arrowColor: colors.text,
                    }}
                  />
                </View>
                {selectedDate && (
                  <View style={styles.dateDisplay}>
                    <Text style={[styles.dateText, { color: colors.text }]}>
                      {selectedDate.split('-').reverse().join(' / ')}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.chooseDateButton, { backgroundColor: colors.brandColor2 }]}
                      onPress={handleDone}
                    >
                      <Text style={[styles.chooseDateButtonText, {
                        fontFamily: Fonts.bodyMedium,
                        color: colors.background
                      }]}>{strings[language].chooseDate}</Text>
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
    width: '90%',
    height: 504,
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
    flex: 1,
    lineHeight: 24,
  },
  title: {
    fontSize: 24,
    flex: 1,
    lineHeight: 28,
  },
  doneButton: {
    fontSize: 20,
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
  },
  chooseDateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  chooseDateButtonText: {
    fontSize: 16,
  },
}); 