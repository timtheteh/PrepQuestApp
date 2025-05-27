import { StyleSheet, View } from 'react-native';
import { CircleIconButton } from './CircleIconButton';

interface HeaderIconButtonsProps {
  onAIPress?: () => void;
  onCalendarPress?: () => void;
  onFilterPress?: () => void;
  onSearchPress?: () => void;
}

export function HeaderIconButtons({
  onAIPress,
  onCalendarPress,
  onFilterPress,
  onSearchPress
}: HeaderIconButtonsProps) {
  return (
    <View style={styles.container}>
      <CircleIconButton iconName="sparkles" size={20} onPress={onAIPress} />
      <CircleIconButton iconName="calendar" onPress={onCalendarPress} />
      <CircleIconButton iconName="filter" onPress={onFilterPress} />
      <CircleIconButton iconName="search" onPress={onSearchPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
  },
}); 