import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import * as Animatable from "react-native-animatable";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={400}
      style={[
        styles.toast,
        { backgroundColor: type === "success" ? "#2ecc71" : "#e74c3c" },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    elevation: 4,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Toast;
