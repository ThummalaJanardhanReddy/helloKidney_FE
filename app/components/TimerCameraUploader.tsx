import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosClient from "../shared/services/axiosClient";

export default function TimerCameraUploader() {
  const [countdown, setCountdown] = useState(60);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultStatus, setResultStatus] = useState(null); // "success" | "error" | null

  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();

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
      const timer = setTimeout(() => setCountdown(countdown - 1), 100);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // -----------------------------------------
  // UPLOAD API FUNCTION
  // -----------------------------------------
  const uploadPhoto = async (
    photoUri: string,
    patientId: number,
    testId: number
  ) => {
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

      formData.append("patient_id", patientId.toString());
      formData.append("test_id", testId.toString());

      // if (!isValid) {
      //   setResultStatus("error");
      //   return;
      // }

      const response = await axiosClient.post(
        "http://192.168.1.8:8082/users/process-test",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response);
      
      setResultStatus("success");
      router.replace({
        pathname: "/components/test-results",
        params: {result: JSON.stringify(response), refresh: 'true' },
      });
    } catch (error) {
      console.log(error);
      setResultStatus("error");
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

    uploadPhoto(photo.uri, 123, 456); // replace with actual patientId and testId
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
        </View>
      )}

      {/* CAMERA */}
      {showCamera && (
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

            {!loading && resultStatus === "success" && (
              <View style={[styles.statusBox, { backgroundColor: "#28A745" }]}>
                <Text style={styles.statusText}>
                  🎉 Your test was successfully completed!
                </Text>
              </View>
            )}

            {!loading && resultStatus === "error" && (
              <View style={[styles.statusBox, { backgroundColor: "#DC3545" }]}>
                <Text style={styles.statusText}>
                  ❌ Invalid image. Please try again.
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
  },

  cameraScreen: {
    flex: 1,
    backgroundColor: "#000",
  },

  cameraContainer: {
    flex: 4,
    width: "100%",
  },

  camera: { flex: 1 },

  waitBox: {
    borderColor: "#3563d6",
    borderWidth: 1,
    padding: 25,
    marginTop: 22,
    borderRadius: 10,
  },

  circleButton: {
    width: 180,
    height: 180,
    borderRadius: 180,
    borderWidth: 15,
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
