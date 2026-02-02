import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../../src/services/axiosClient";
import { useSessionStore } from "../stores/sessionStore";
import { colors } from "../shared/commonStyles";

export default function TimerCameraUploader() {
  const [countdown, setCountdown] = useState(60); //60
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultStatus, setResultStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // -----------------------------------------
  // COUNTDOWN TIMER
  // -----------------------------------------
  useEffect(() => {
    if (countdown === 0) {
      setShowCamera(true);
    }
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // -----------------------------------------
  // UPLOAD API FUNCTION
  // -----------------------------------------
  const uploadPhoto = async (photoUri: string, email: string) => {
    setLoading(true);
    setShowResultPopup(true);
    setResultStatus(null);

    try {
      // Simulated delay
      //await new Promise((res) => setTimeout(res, 2000));

      // Simulated API success/failure
      //const isValid = Math.random() > 0.5;

      const formData = new FormData();

      formData.append("image", {
        uri: photoUri,
        name: "urine_test.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("email_id", session?.userEmail || "test");

      const response = await axiosClient.post("/users/process-test", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response);

      setResultStatus({ message: "Successfully Completed", type: "success" });
      router.replace({
        pathname: "/components/test-results",
        params: { result: JSON.stringify(response), refresh: "true" },
      });
    } catch (error) {
      if (error && error.response && error?.response?.data?.detail)
        setResultStatus({
          message: JSON.parse(error.response.data.detail).error,
          type: "error",
        });
      else
        setResultStatus({
          message: "Invalid image. Please try again.",
          type: "error",
        });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // TAKE PHOTO
  // -----------------------------------------
  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
    });

    setPreviewPhoto(photo.uri);
    // uploadPhoto(photo.uri, user_mail); // replace with actual patientId and testId
  };

  if (!permission?.granted) {
    return <Text>Waiting for camera permission...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* TIMER */}
      {!showCamera && (
        <View style={styles.timerContainer}>
          <TouchableOpacity style={styles.circleButton}>
            <Text style={styles.timerText}>{countdown}</Text>
          </TouchableOpacity>

          <View style={styles.waitBox}>
            <Text style={styles.waitText}>
              Please wait for 60 seconds to ensure your test results are
              accurate.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.primary, marginVertical: 40 },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CAMERA */}
      {showCamera && !previewPhoto && (
        <View style={styles.cameraScreen}>
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#444" }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.actionText}>Back to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "red" }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* RESULT POPUP */}
      <Modal transparent visible={showResultPopup} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {loading && (
              <>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.modalText}>
                  Please wait, result in progress...
                </Text>
              </>
            )}

            {!loading && resultStatus?.type === "success" && (
              <View style={[styles.statusBox, { backgroundColor: "#28A745" }]}>
                <Text style={styles.statusText}>
                  🎉 Your test was successfully completed!
                </Text>
              </View>
            )}

            {!loading && resultStatus?.type === "error" && (
              <View style={[styles.statusBox, { backgroundColor: "#DC3545" }]}>
                <Text style={styles.statusText}>
                  {resultStatus.message
                    ? resultStatus.message
                    : `❌ Invalid image. Please try again.`}
                </Text>
              </View>
            )}

            {!loading && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowResultPopup(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal transparent visible={!!previewPhoto} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Preview</Text>

            <Image source={{ uri: previewPhoto }} style={styles.previewImage} />

            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.previewBtn, { backgroundColor: "#666" }]}
                onPress={() => setPreviewPhoto(null)}
              >
                <Text style={styles.previewText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewBtn, { backgroundColor: "#28A745" }]}
                onPress={() => {
                  uploadPhoto(previewPhoto!, session?.userEmail || "test");
                  setPreviewPhoto(null);
                }}
              >
                <Text style={styles.previewText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// -----------------------------------------
// STYLES
// -----------------------------------------
const styles = StyleSheet.create({
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f2f6ff",
  },

  cameraScreen: {
    flex: 1,
    backgroundColor: "#000",
  },

  cameraContainer: {
    flex: 5,
    width: "100%",
  },

  camera: { flex: 1 },

  waitBox: {
    borderColor: "#b6b7b7",
    borderWidth: 1,
    padding: 25,
    marginTop: 22,
    borderRadius: 10,
    backgroundColor: "#f6f7f7",
  },

  circleButton: {
    width: 180,
    height: 180,
    borderRadius: 180,
    borderWidth: 22,
    borderColor: "#3A4665",
    justifyContent: "center",
    alignItems: "center",
  },

  timerText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#1A82F7",
  },

  waitText: {
    fontSize: 18,
    textAlign: "center",
  },
  previewBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  previewImage: {
    width: "100%",
    height: "80%",
    borderRadius: 10,
    marginBottom: 15,
  },

  previewButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  previewBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  previewText: {
    color: "#fff",
    fontWeight: "700",
  },

  buttonsContainer: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#ffffff20",
  },

  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  actionText: {
    color: "#fff",
    fontWeight: "700",
  },

  // ----------------- MODAL -----------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 14,
    alignItems: "center",
  },

  modalText: {
    marginTop: 18,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },

  statusBox: {
    padding: 18,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 10,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },

  closeBtn: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 12,
  },

  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
