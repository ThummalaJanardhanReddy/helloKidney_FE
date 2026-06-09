import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

// ─── GlowDot ──────────────────────────────────────────────────────────────────

/** Pulsing dot shown next to the camera status label. */
export function GlowDot({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[dotStyles.dot, { backgroundColor: color, opacity }]}
    />
  );
}

const dotStyles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
});

// ─── CornerBrackets ───────────────────────────────────────────────────────────

type CornerPos =
  | { top: number;    left:  number; bottom?: never; right?: never }
  | { top: number;    right: number; bottom?: never; left?: never  }
  | { bottom: number; left:  number; top?: never;    right?: never }
  | { bottom: number; right: number; top?: never;    left?: never  };

/** Four L-shaped corner brackets drawn inside the strip frame. */
export function CornerBrackets({ color }: { color: string }) {
  const positions: CornerPos[] = [
    { top: -2,    left:  -2 },
    { top: -2,    right: -2 },
    { bottom: -2, left:  -2 },
    { bottom: -2, right: -2 },
  ];

  return (
    <>
      {positions.map((pos, i) => (
        <View key={i} style={[bracketStyles.corner, pos, { borderColor: color }]} />
      ))}
    </>
  );
}

const bracketStyles = StyleSheet.create({
  corner: {
    position: "absolute",
    width: 18,
    height: 18,
    borderWidth: 3,
    borderRadius: 3,
  },
});
