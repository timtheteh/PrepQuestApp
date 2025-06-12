import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CircleSVGIconButton } from './CircleSVGIconButton';
import ImageIconFilled from '@/assets/icons/imageIconFilled.svg';
import ImageIconFilledWhite from '@/assets/icons/imageIconFilledWhite.svg';
import CameraIconFilled from '@/assets/icons/cameraIconFilled.svg';
import CameraIconFilledWhite from '@/assets/icons/cameraIconFilledWhite.svg';
import MarkerIcon from '@/assets/icons/markerIcon.svg';
import MarkerIconWhite from '@/assets/icons/markerIconWhite.svg';
import MicIcon from '@/assets/icons/micIcon.svg';
import MicIconWhite from '@/assets/icons/micIconWhite.svg';
import TextIcon from '@/assets/icons/textIcon.svg';
import TextIconWhite from '@/assets/icons/textIconWhite.svg';

type ButtonType = 'image' | 'camera' | 'marker' | 'mic' | 'text';

interface TopBarManualHeaderProps {
  onImagePress?: () => void;
  onCameraPress?: () => void;
  onMarkerPress?: () => void;
  onMicPress?: () => void;
  onTextPress?: () => void;
}

export function TopBarManualHeader({
  onImagePress,
  onCameraPress,
  onMarkerPress,
  onMicPress,
  onTextPress
}: TopBarManualHeaderProps) {
  const [selectedButton, setSelectedButton] = useState<ButtonType | null>(null);

  const renderIcon = (Icon: any, WhiteIcon: any, type: ButtonType) => {
    const isSelected = selectedButton === type;
    return isSelected ? WhiteIcon : Icon;
  };

  const handlePress = (type: ButtonType, callback?: () => void) => {
    setSelectedButton(selectedButton === type ? null : type);
    if (callback) {
      callback();
    }
  };

  return (
    <View style={styles.container}>
      <CircleSVGIconButton
        Icon={renderIcon(ImageIconFilled, ImageIconFilledWhite, 'image')}
        size={20}
        onPress={() => handlePress('image', onImagePress)}
        style={selectedButton === 'image' ? styles.selectedButton : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(CameraIconFilled, CameraIconFilledWhite, 'camera')}
        size={30}
        onPress={() => handlePress('camera', onCameraPress)}
        style={selectedButton === 'camera' ? styles.selectedButton : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(MarkerIcon, MarkerIconWhite, 'marker')}
        size={25}
        onPress={() => handlePress('marker', onMarkerPress)}
        style={selectedButton === 'marker' ? styles.selectedButton : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(MicIcon, MicIconWhite, 'mic')}
        size={25}
        onPress={() => handlePress('mic', onMicPress)}
        style={selectedButton === 'mic' ? styles.selectedButton : undefined}
      />
      <CircleSVGIconButton
        Icon={renderIcon(TextIcon, TextIconWhite, 'text')}
        size={30}
        onPress={() => handlePress('text', onTextPress)}
        style={selectedButton === 'text' ? styles.selectedButton : undefined}
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
    backgroundColor: '#4F41D8',
  },
}); 