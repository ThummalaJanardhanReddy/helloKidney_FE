import React from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

interface RoundButtonProps {
  onPress?: () => void;
  borderWidth?: number;
  borderColor?: string;
  content?: string | React.ReactNode;
  textColor?: string;
  backgroundColor?: string;
  size?: number; // YOU pass this — circle stays perfect
}

const RoundButton: React.FC<RoundButtonProps> = ({
  onPress,
  borderWidth = 2,
  borderColor = "#000",
  content = "Btn",
  backgroundColor = "#fff",
  textColor = "#000",
  size = 60, // You decide based on text length
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {/* Outer circle: handles border without shrinking content */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner circle: stays perfect, unaffected by border */}
        <TouchableOpacity
          onPress={onPress}
          onPressIn={animateIn}
          onPressOut={animateOut}
          activeOpacity={0.8}
          style={{
            width: size - borderWidth * 2,
            height: size - borderWidth * 2,
            borderRadius: (size - borderWidth * 2) / 2,
            backgroundColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {typeof content === "string" ? (
            <Text
              style={{
                fontSize: 36,
                fontWeight: "bold",
                alignItems: "center",
                textAlign: "center",
                color: textColor,
              }}
            >
              {content}
            </Text>
          ) : (
            content
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default RoundButton;
