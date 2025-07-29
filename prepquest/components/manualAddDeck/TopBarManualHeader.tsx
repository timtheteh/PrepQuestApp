import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleSVGIconButton } from '../general/CircleSVGIconButton';
import CameraIconFilled from '@/assets/icons/cameraIconFilled.svg';
import CameraIconFilledWhite from '@/assets/icons/cameraIconFilledWhite.svg';
import MarkerIcon from '@/assets/icons/markerIcon.svg';
import MarkerIconWhite from '@/assets/icons/markerIconWhite.svg';
import MicIcon from '@/assets/icons/micIcon.svg';
import MicIconWhite from '@/assets/icons/micIconWhite.svg';
import TextIcon from '@/assets/icons/textIcon.svg';
import TextIconWhite from '@/assets/icons/textIconWhite.svg';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

type ButtonType = 'camera' | 'marker' | 'mic' | 'text' | 'none';

interface TopBarManualHeaderProps {
  onCameraPress?: () => void;
  onMarkerPress?: () => void;
  onMicPress?: () => void;
  onTextPress?: () => void;
  selectedButton?: ButtonType;
  onButtonChange?: (buttonType: ButtonType | null) => void;
}

export function TopBarManualHeader({
  onCameraPress,
  onMarkerPress,
  onMicPress,
  onTextPress,
  selectedButton: externalSelectedButton,
  onButtonChange
}: TopBarManualHeaderProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [internalSelectedButton, setInternalSelectedButton] = useState<ButtonType>('none');
  
  // Use external state if provided, otherwise use internal state
  const selectedButton = externalSelectedButton !== undefined ? externalSelectedButton : internalSelectedButton;

  const renderIcon = (Icon: any, WhiteIcon: any, type: ButtonType) => {
    const isSelected = selectedButton === type;
    return isSelected ? WhiteIcon : Icon;
  };

  const handlePress = (type: ButtonType, callback?: () => void) => {
    // Don't allow deselection - if same button is clicked, do nothing
    if (selectedButton === type) {
      return;
    }
    
    if (externalSelectedButton !== undefined) {
      // If external state is provided, use the callback
      onButtonChange?.(type);
    } else {
      // Otherwise use internal state
      setInternalSelectedButton(type);
    }
    
    if (callback) {
      callback();
    }
  };

  return (
    <View style={styles.container}>
      <CircleSVGIconButton
        Icon={renderIcon(CameraIconFilled, CameraIconFilledWhite, 'camera')}
        size={30}
        onPress={() => handlePress('camera', onCameraPress)}
        style={selectedButton === 'camera' ? { backgroundColor: colors.brandColor2 } : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(MarkerIcon, MarkerIconWhite, 'marker')}
        size={25}
        onPress={() => handlePress('marker', onMarkerPress)}
        style={selectedButton === 'marker' ? { backgroundColor: colors.brandColor2 } : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(MicIcon, MicIconWhite, 'mic')}
        size={25}
        onPress={() => handlePress('mic', onMicPress)}
        style={selectedButton === 'mic' ? { backgroundColor: colors.brandColor2 } : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(TextIcon, TextIconWhite, 'text')}
        size={30}
        onPress={() => handlePress('text', onTextPress)}
        style={selectedButton === 'text' ? { backgroundColor: colors.brandColor2 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
  },
  selectedButton: {
    // Background color will be set dynamically
  },
}); 