import { StyleSheet, View, ViewProps, Text } from 'react-native';

interface RoundedContainerProps extends ViewProps {
  children?: React.ReactNode;
}

export function RoundedContainer({ style, ...props }: RoundedContainerProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.innerContainer}>
        <View style={styles.toggleBackground} />
        <View style={styles.labelContainer}>
          <View style={styles.labelSection}>
            <Text style={styles.label}>Study</Text>
          </View>
          <View style={styles.labelSection}>
            <Text style={styles.label}>Interview</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
  },
  innerContainer: {
    flex: 1,
  },
  toggleBackground: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#4F41D8',
    borderRadius: 30,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
  },
  labelSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontFamily: 'Satoshi-Medium',
    color: '#D5D4DD'
  },
}); 