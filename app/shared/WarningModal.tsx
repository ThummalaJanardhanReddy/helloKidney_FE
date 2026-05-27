// WarningModal.tsx

import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface WarningModalProps {
  visible: boolean;
  onRetry: () => void;
  onContinue: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({
  visible,
  onRetry,
  onContinue,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* TITLE */}
          <Text style={styles.title}>
            Warning!
          </Text>

          {/* ICON */}
          <Text style={styles.icon}>⏱️</Text>

          {/* MAIN MESSAGE */}
          <Text style={styles.mainMessage}>
            The card has been activated for more
            than{" "}
            <Text style={styles.redText}>
              2 mins now.
            </Text>
          </Text>

          {/* BULLETS */}
          <View style={styles.bulletContainer}>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>

              <Text style={styles.bulletText}>
                Delay in scanning could cause
                inaccurate results
              </Text>
            </View>

            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>

              <Text style={styles.bulletText}>
                We recommend you to take the test
                again with a new card.
              </Text>
            </View>
          </View>

          {/* BUTTONS */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              Test with a new card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>
              Continue with current card
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default WarningModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#DDE0F0",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 26,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },

  icon: {
    fontSize: 54,
    textAlign: "center",
    marginBottom: 18,
  },

  mainMessage: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#111",
    lineHeight: 30,
    marginBottom: 20,
  },

  redText: {
    color: "#FF3B30",
  },

  bulletContainer: {
    marginBottom: 28,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingRight: 10,
  },

  bullet: {
    fontSize: 18,
    marginRight: 10,
    lineHeight: 24,
    color: "#111",
  },

  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#222",
  },

  primaryButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#4A4A68",
    borderRadius: 8,
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#1E1E2D",
    fontSize: 16,
    fontWeight: "500",
  },
});