import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
// import { getResponsiveFontSize, getResponsiveSpacing, wp } from '../utils/responsive';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  width?: number;
  height?: number;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  width = 80, // 80% of screen width
  height = 45,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width,
          height,
        },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#eb0000ff',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.22,
    // shadowRadius: 2.22,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
    // elevation: 0,
    // shadowOpacity: 0,
  },
  buttonTextDisabled: {
    color: '#999999',
  },
});
