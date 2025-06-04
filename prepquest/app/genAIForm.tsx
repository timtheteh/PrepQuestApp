import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function GenAIFormPage() {
  const { mode } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{mode} Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontFamily: 'Satoshi-Medium',
  },
}); 