import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import MarkerIcon from '@/assets/icons/markerIcon.svg';
import MarkerIconWhite from '@/assets/icons/markerIconWhite.svg';
import EraserIcon from '@/assets/icons/eraserIcon.svg';
import UndoIcon from '@/assets/icons/undoIcon.svg';
import ForwarddoIcon from '@/assets/icons/forwarddoIcon.svg';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ResizeSlider } from './ResizeSlider';

interface DrawableOptionsRowProps {
  onMarkerPress?: () => void;
  onEraserPress?: () => void;
  onResizePress?: () => void;
  onUndoPress?: () => void;
  onForwarddoPress?: () => void;
}

export function DrawableOptionsRow({
  onMarkerPress,
  onEraserPress,
  onResizePress,
  onUndoPress,
  onForwarddoPress
}: DrawableOptionsRowProps) {
  const [selectedTool, setSelectedTool] = useState<'marker' | 'eraser'>('marker');
  const [isResizeSliderVisible, setIsResizeSliderVisible] = useState(false);

  const handleMarkerPress = () => {
    setSelectedTool('marker');
    onMarkerPress?.();
  };

  const handleEraserPress = () => {
    setSelectedTool('eraser');
    onEraserPress?.();
  };

  const handleResizePress = () => {
    setIsResizeSliderVisible(prev => !prev);
    onResizePress?.();
  };

  return (
    <View>
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            selectedTool === 'marker' ? styles.selectedButton : pressed && styles.markerEraserbuttonPressed
          ]}
          onPress={handleMarkerPress}
        >
          {selectedTool === 'marker' ? <MarkerIconWhite width={20} height={20} /> : <MarkerIcon width={20} height={20} />}
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            selectedTool === 'eraser' ? styles.selectedButton : pressed && styles.markerEraserbuttonPressed
          ]}
          onPress={handleEraserPress}
        >
          {selectedTool === 'eraser' ? <FontAwesome5 name="eraser" size={20} color="white" /> : <FontAwesome5 name="eraser" size={20} color="black" />}
        </Pressable>
        
        {/* Resize Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.circleButton,
            isResizeSliderVisible && styles.resizeButtonSelected,
            pressed && styles.buttonPressed
          ]}
          onPress={handleResizePress}
        />
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onUndoPress}
        >
          <UndoIcon width={20} height={20} />
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onForwarddoPress}
        >
          <ForwarddoIcon width={20} height={20} />
        </Pressable>
      </View>
    </View>
    <View style={styles.resizeSliderContainer}>
    {isResizeSliderVisible && <ResizeSlider />}
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
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    width: 25,
    height: 25,
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resizeButtonSelected: {
    borderColor: '#4F41D8',
  },
  buttonPressed: {
    backgroundColor: '#F0F0F0',
    transform: [{ scale: 0.95 }],
  },
  selectedButton: {
    backgroundColor: '#4F41D8',
  },
  markerEraserbuttonPressed: {
    backgroundColor: '#4F41D8',
    transform: [{ scale: 0.95 }],
  },
  resizeSliderContainer: {
    position: 'absolute',
    left: 2,
    right: 0,
    top: 35,
    bottom: 0,
  },
}); 