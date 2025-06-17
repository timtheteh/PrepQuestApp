import { Dimensions, Platform, View, ScrollView, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { RoundedContainer } from '@/components/RoundedContainer';
import { useState } from 'react';
import { SmallGreenBinaryToggle } from '@/components/SmallGreenBinaryToggle';

export default function StatisticsScreen() {
  const [isPerformance, setIsPerformance] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const topPadding = screenHeight < 670 ? 40 : 65;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={{ marginTop: topPadding, paddingHorizontal: 16 }}>
        <RoundedContainer
          leftLabel="Decks / Flashcards"
          leftLabelStyle={{ fontSize: 16, fontFamily: 'Satoshi-Medium' }}
          rightLabel="Performance"
          onToggle={setIsPerformance}
          initialPosition={isPerformance ? 'right' : 'left'}
        />
      </View>
      {!isPerformance && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* ReviewSection */}
          <View style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Neuton-Regular', fontSize: 24, textAlign: 'center' }}>
              Decks / Flashcards Reviewed
            </Text>
            <SmallGreenBinaryToggle
              leftLabel="Day"
              rightLabel="Month"
              style={{ marginTop: 15 }}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
} 