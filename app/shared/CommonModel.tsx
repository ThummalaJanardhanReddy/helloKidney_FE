// components/CommonModal.tsx

import React from "react";
import {
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import PrimaryButton from "./PrimaryButton";
import { colors } from "./commonStyles";

interface CommonModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  // BUTTON STYLES
  confirmButtonStyle?: StyleProp<ViewStyle>;
  confirmTextStyle?: StyleProp<TextStyle>;

  cancelButtonStyle?: StyleProp<ViewStyle>;
  cancelTextStyle?: StyleProp<TextStyle>;
}

const CommonModal: React.FC<CommonModalProps> = ({
  visible,
  title = "Confirmation",
  message = "Are you sure?",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = true,
  confirmButtonStyle,
  confirmTextStyle,
  cancelButtonStyle,
  cancelTextStyle,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {showCancel && (
              <PrimaryButton
                title={cancelText}
                onPress={onCancel || (() => {})}
                style={[
                  {
                    backgroundColor: "transparent",
                    minWidth: 100,
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  },
                  cancelButtonStyle,
                ]}
                textStyle={[
                  {
                    color: colors.black,
                    fontWeight: "600",
                    fontSize: 15,
                  },
                  cancelTextStyle,
                ]}
              />
            )}

            <PrimaryButton
              title={confirmText}
              onPress={onConfirm || (() => {})}
              style={[
                {
                  minWidth: 100,
                  width: "40%",
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  borderRadius: 6,
                },
                confirmButtonStyle,
              ]}
              textStyle={[
                {
                  color: colors.white,
                  fontWeight: "600",
                  fontSize: 15,
                },
                confirmTextStyle,
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CommonModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    elevation: 5,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },

  message: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4B5563",
    marginBottom: 24,
    textAlign: "center",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  button: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
    alignItems: "center",
    marginLeft: 10,
  },

  cancelButton: {
    backgroundColor: "#E5E7EB",
  },

  confirmButton: {
    backgroundColor: "#0E1833",
  },

  cancelText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 15,
  },

  confirmText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
