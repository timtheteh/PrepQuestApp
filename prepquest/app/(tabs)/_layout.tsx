import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { NavBar } from '@/components/NavBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
