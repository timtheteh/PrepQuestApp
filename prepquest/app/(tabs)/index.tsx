import { StyleSheet, TouchableOpacity, View, SafeAreaView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Feather } from '@expo/vector-icons';
import { HeaderIconButtons } from '@/components/HeaderIconButtons';
import { RoundedContainer } from '@/components/RoundedContainer';

export default function DecksScreen() {
  const handleToggle = (isRightSide: boolean) => {
    // Handle navigation or state changes based on toggle
    console.log(isRightSide ? 'Interview Mode' : 'Study Mode');
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
        </View>
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
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    marginTop: 16,
  }
});
