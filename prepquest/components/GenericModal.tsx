import React from 'react';
import { StyleSheet, Animated, View, Text } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { GenericModalButton } from './GenericModalButton';

interface GenericModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  Icon?: React.FC<SvgProps>;
  text: string;
  subtitle?: string;
  textStyle?: {
    highlightWord?: string;
    highlightColor?: string;
  };
  buttons?: 'none' | 'single' | 'double';
  hasAnimation?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function GenericModal({ 
  visible,
  opacity = new Animated.Value(0),
  Icon,
  text,
  subtitle,
  textStyle,
  buttons = 'none',
  hasAnimation = false,
  onConfirm,
  onCancel
}: GenericModalProps) {
  if (!visible) return null;

  // Split text to highlight specific word if needed
  const renderText = () => {
    if (!textStyle?.highlightWord) {
      return (
        <View>
          <Text style={styles.text}>{text}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      );
    }

    const parts = text.split(textStyle.highlightWord);
    return (
      <View>
        <Text style={styles.text}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Text style={[styles.text, { color: textStyle.highlightColor }]}>
                  {textStyle.highlightWord}
                </Text>
              )}
              {part}
            </React.Fragment>
          ))}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderButtons = () => {
    if (buttons === 'double') {
      return (
        <View style={styles.buttonRow}>
          <GenericModalButton
            text="No"
            backgroundColor="#F8F8F8"
            textColor="#000000"
            onPress={onCancel || (() => {})}
          />
          <GenericModalButton
            text="Yes"
            backgroundColor="#4F41D8"
            textColor="#FFFFFF"
            onPress={onConfirm || (() => {})}
          />
        </View>
      );
    }
    return null;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacity
        }
      ]}
    >
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon width={24} height={24} />
        </View>
      )}
      <View style={styles.content}>
        <View style={[
          styles.textRow,
          (!buttons || buttons === 'none') && !hasAnimation && styles.textRowOnly
        ]}>
          {renderText()}
        </View>
        {((buttons && buttons !== 'none') || hasAnimation) && (
          <View style={styles.actionRow}>
            {renderButtons()}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 305,
    height: 233,
    marginLeft: -152.5, // Half of width
    marginTop: -116.5, // Half of height
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 10,
    borderColor: '#4F41D8',
    zIndex: 1001, // Higher than GreyOverlayBackground
  },
  iconContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 50,
    paddingHorizontal: 12,
    flexDirection: 'column',
  },
  textRow: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  textRowOnly: {
    justifyContent: 'center',
  },
  actionRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    color: '#666666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 33,
  },
}); 