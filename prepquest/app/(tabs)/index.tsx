import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform, Text, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { useState, useRef } from 'react';

export default function DecksScreen() {
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = (isRightSide: boolean) => {
    setIsInterviewMode(isRightSide);
    
    Animated.timing(fadeAnim, {
      toValue: isRightSide ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleFabPress = () => {
    // Handle FAB press
    console.log('FAB pressed');
  };

  const handleSelect = () => {
    // Handle select press
    console.log('Select pressed');
  };

  const studyOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const interviewOpacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.menuButton}
            activeOpacity={0.5}
          >
            <Feather name="menu" size={30} color="black" />
          </TouchableOpacity>
          
          <HeaderIconButtons />
        </View>
        
        <View style={styles.content}>
          <RoundedContainer 
            leftLabel="Study"
            rightLabel="Interview"
            onToggle={handleToggle}
          />
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Title style={[styles.titleAbsolute]} animatedOpacity={studyOpacity}>
                My Study Decks
              </Title>
              <Title style={[styles.titleAbsolute]} animatedOpacity={interviewOpacity}>
                My Interview Decks
              </Title>
            </View>
            <TouchableOpacity onPress={handleSelect}>
              <Text style={styles.selectButton}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FloatingActionButton
          style={styles.fab}
          onPress={handleFabPress}
        >
          <Feather name="plus" size={38} color="white" />
        </FloatingActionButton>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 70 : 16,
  },
  menuButton: {
    padding: 0,
  },
  content: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  titleContainer: {
    position: 'relative',
    height: Platform.OS === 'android' ? 32 : 24,
  },
  titleAbsolute: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  selectButton: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#44B88A',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15,
    right: 16,
  },
});
