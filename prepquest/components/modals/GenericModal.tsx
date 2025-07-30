import React from 'react';
import { StyleSheet, Animated, View, Text } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { GenericModalButton } from './GenericModalButton';
import LottieView from 'lottie-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { strings } from '@/constants/strings';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

interface GenericModalProps {
  visible: boolean;
  opacity?: Animated.Value;
  Icon?: React.FC<SvgProps>;
  text: string | string[];
  subtitle?: string;
  textStyle?: {
    highlightWord?: string;
    highlightColor?: string;
  };
  buttons?: 'none' | 'single' | 'double';
  hasAnimation?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  animationSource?: any; // Lottie JSON source
  animationLoop?: boolean;
  contentMarginTop?: number; // marginTop for content section
  lottieMarginTop?: number; // marginTop for lottieContainer
  textMarginBottom?: number; // marginBottom for text
}

export function GenericModal({ 
  visible,
  opacity,
  Icon,
  text,
  subtitle,
  textStyle,
  buttons = 'none',
  hasAnimation = false,
  onConfirm,
  onCancel,
  animationSource,
  animationLoop = false,
  contentMarginTop = 0,
  lottieMarginTop = 0,
  textMarginBottom = 0,
}: GenericModalProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Split text to highlight specific word if needed
  const renderText = () => {
    if (!textStyle?.highlightWord) {
      const textLines = Array.isArray(text) ? text : [text];
      return (
        <View>
          {textLines.map((line, index) => (
            <Text key={index} style={[styles.text, index > 0 && styles.textLine, {
              fontFamily: Fonts.bodyMedium,
              color: colors.text
            }]}>
              {line}
            </Text>
          ))}
          {subtitle && <Text style={[styles.subtitle, {
            fontFamily: Fonts.bodyMedium,
            color: colors.text
          }]}>{subtitle}</Text>}
        </View>
      );
    }

    const parts = (Array.isArray(text) ? text.join(' ') : text).split(textStyle.highlightWord);
    return (
      <View>
        <Text style={[styles.text, { fontFamily: Fonts.bodyMedium, color: colors.text }]}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <Text style={[styles.text, { color: textStyle.highlightColor, fontFamily: Fonts.bodyMedium }]}>
                  {textStyle.highlightWord}
                </Text>
              )}
              {part}
            </React.Fragment>
          ))}
        </Text>
        {subtitle && <Text style={[styles.subtitle, {
          fontFamily: Fonts.bodyMedium,
          color: colors.text
        }]}>{subtitle}</Text>}
      </View>
    );
  };

  const renderButtons = () => {
    if (buttons === 'double') {
      return (
        <View style={styles.buttonRow}>
          <GenericModalButton
            text={strings[language].no}
            backgroundColor={colors.secondaryShade}
            textColor={colors.text}
            onPress={onCancel || (() => {})}
          />
          <GenericModalButton
            text={strings[language].yes}
            backgroundColor={colors.brandColor2}
            textColor={colors.background}
            onPress={onConfirm || (() => {})}
          />
        </View>
      );
    } else if (buttons === 'single') {
      return (
        <View style={styles.singleButtonRow}>
          <GenericModalButton
            text={strings[language].ok}
            backgroundColor={colors.brandColor2}
            textColor={colors.background}
            onPress={onConfirm || (() => {})}
          />
        </View>
      );
    }
    return null;
  };

  const modalStyle = opacity 
    ? [styles.container, { opacity }]
    : [styles.container, { opacity: 0 }];

  return (
    visible ? (
      <Animated.View style={[modalStyle, { backgroundColor: colors.background, borderColor: colors.brandColor2 }]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon width={24} height={24} />
          </View>
        )}
        <View style={[
          styles.content,
          { paddingVertical: buttons === 'none' ? 0 : 50, marginTop: contentMarginTop }
        ]}>
          <View style={[
            styles.textRow,
            (!buttons || buttons === 'none') && !hasAnimation && styles.textRowOnly, 
            {marginBottom: textMarginBottom}
          ]}>
            {renderText()}
          </View>
          {/* Lottie animation below text, above action row */}
          {animationSource && (
            <View style={[styles.lottieContainer, { marginTop: lottieMarginTop }] }>
              <LottieView
                source={animationSource}
                autoPlay
                loop={animationLoop}
                style={{ width: 100, height: 100 }}
              />
            </View>
          )}
          {((buttons && buttons !== 'none') || hasAnimation) && (
            <View style={styles.actionRow}>
              {renderButtons()}
            </View>
          )}
        </View>
      </Animated.View>
    ) : null
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
    borderRadius: 30,
    borderWidth: 10,
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
    fontSize: 20,
    textAlign: 'center',
  },
  textLine: {
    marginTop: 0,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 33,
  },
  singleButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 55,
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 100,
    height: 100,
  },
}); 