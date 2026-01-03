import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { tabsImages as images } from '../../assets';
import { colors } from './commonStyles';

interface BackButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  arrowColor?: string;
}

export default function BackButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  color = colors.primary,
  arrowColor,
}: BackButtonProps) {
  const finalArrowColor = arrowColor || color;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* <images.icons.arrow_left
        width={15}
        height={15}
        style={styles.arrowIcon}
        fill={finalArrowColor}
        color={finalArrowColor}
      /> */}
      <Text style={[styles.buttonText, { color }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    verticalAlign: 'middle',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    // paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  arrowIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'left',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
});
