import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Title } from '@/components/Title';
import { useState } from 'react';

export default function DecksScreen() {
  const [isInterviewMode, setIsInterviewMode] = useState(false);

  const handleToggle = (isRightSide: boolean) => {
    setIsInterviewMode(isRightSide);
  };

  const handleFabPress = () => {
    // Handle FAB press
    console.log('FAB pressed');
  };

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
          <Title style={styles.title}>
            {isInterviewMode ? 'My Interview Decks' : 'My Study Decks'}
          </Title>
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
  title: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 15, // Positioned above navbar
    right: 16,
  },
});
