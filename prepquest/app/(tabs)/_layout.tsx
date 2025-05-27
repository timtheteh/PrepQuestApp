import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { NavBar } from '@/components/NavBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={() => <NavBar />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="account" />
        <Tabs.Screen name="statistics" />
        <Tabs.Screen name="awards" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
