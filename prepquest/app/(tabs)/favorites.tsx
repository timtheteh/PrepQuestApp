import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';

export default function FavoritesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Content will be added later */}
      </View>
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
}); 