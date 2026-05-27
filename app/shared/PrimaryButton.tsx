import responsive from "@/src/utils/responsive";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
// import { getResponsiveFontSize, getResponsiveSpacing, wp } from '../utils/responsive';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  width?: number | string; // Allow percentage or fixed width
  height?: number;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  width = 80, // 80% of screen width
  height = responsive.getResponsiveFontSize(45),
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { width, height } as ViewStyle,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.buttonText,
          disabled && styles.buttonTextDisabled,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#eb0000ff",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#FFFFFF",
    fontSize: responsive.getResponsiveFontSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
    // elevation: 0,
    // shadowOpacity: 0,
  },
  buttonTextDisabled: {
    color: "#999999",
  },
});
