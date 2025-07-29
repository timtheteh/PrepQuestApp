import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TouchableOpacity } from 'react-native';
import MarkerIcon from '@/assets/icons/markerIcon.svg';
import MarkerIconWhite from '@/assets/icons/markerIconWhite.svg';
import UndoIcon from '@/assets/icons/undoIcon.svg';
import ForwarddoIcon from '@/assets/icons/forwarddoIcon.svg';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ResizeSlider } from './ResizeSlider';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';

interface DrawableOptionsRowProps {
  onMarkerPress?: () => void;
  onEraserPress?: () => void;
  onResizePress?: () => void;
  onResizeValueChange?: (value: number) => void;
  onUndoPress?: () => void;
  onForwarddoPress?: () => void;
  onClearPress?: () => void;
  currentMarkerSize?: number; // Current marker size (1-10)
  selectedTool?: 'marker' | 'eraser'; // Control which tool is selected
  onSelectTool?: (tool: 'marker' | 'eraser') => void;
}

export function DrawableOptionsRow({
  onMarkerPress,
  onEraserPress,
  onResizePress,
  onResizeValueChange,
  onUndoPress,
  onForwarddoPress,
  onClearPress,
  currentMarkerSize = 3,
  selectedTool = 'marker',
  onSelectTool
}: DrawableOptionsRowProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { language } = useLanguage();
  const [isResizeSliderVisible, setIsResizeSliderVisible] = useState(false);

  const handleMarkerPress = () => {
    onMarkerPress?.();
    onSelectTool?.('marker');
  };

  const handleEraserPress = () => {
    setIsResizeSliderVisible(false);
    onEraserPress?.();
    onSelectTool?.('eraser');
  };

  const handleResizePress = () => {
    setIsResizeSliderVisible(prev => !prev);
    onResizePress?.();
    onSelectTool?.('marker');
  };

  return (
    <View>
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.background },
            selectedTool === 'marker' ? { backgroundColor: colors.brandColor2 } : pressed && { backgroundColor: colors.brandColor2, transform: [{ scale: 0.95 }] }
          ]}
          onPress={handleMarkerPress}
        >
          {selectedTool === 'marker' ? <MarkerIconWhite width={20} height={20} /> : <MarkerIcon width={20} height={20} />}
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.background },
            selectedTool === 'eraser' ? { backgroundColor: colors.brandColor2 } : pressed && { backgroundColor: colors.brandColor2, transform: [{ scale: 0.95 }] }
          ]}
          onPress={handleEraserPress}
        >
          {selectedTool === 'eraser' ? <FontAwesome5 name="eraser" size={20} color="white" /> : <FontAwesome5 name="eraser" size={20} color={colors.text} />}
        </Pressable>
        
        {/* Resize Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.circleButton,
            { backgroundColor: colors.background, borderColor: colors.text },
            isResizeSliderVisible && { borderColor: colors.brandColor2 },
            pressed && { backgroundColor: colors.secondaryShade, transform: [{ scale: 0.95 }] }
          ]}
          onPress={handleResizePress}
        />
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.background },
            pressed && { backgroundColor: colors.secondaryShade, transform: [{ scale: 0.95 }] }
          ]}
          onPress={onUndoPress}
        >
          <UndoIcon width={20} height={20} />
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.background },
            pressed && { backgroundColor: colors.secondaryShade, transform: [{ scale: 0.95 }] }
          ]}
          onPress={onForwarddoPress}
        >
          <ForwarddoIcon width={20} height={20} />
        </Pressable>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={onClearPress}
        >
          <Text style={[styles.clearButtonText, { color: colors.text }]}>{strings[language].clear}</Text>
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.resizeSliderContainer}>
    {isResizeSliderVisible && <ResizeSlider onValueChange={onResizeValueChange} initialValue={currentMarkerSize} />}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    width: 25,
    height: 25,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeSliderContainer: {
    position: 'absolute',
    left: 2,
    right: 0,
    top: 35,
    bottom: 0,
  },
  clearButton: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
}); 