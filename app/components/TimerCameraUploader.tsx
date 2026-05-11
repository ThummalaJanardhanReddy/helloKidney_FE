import {
  CameraView,
  BarcodeScanningResult,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
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
import * as ImageManipulator from "expo-image-manipulator";
import { Dimensions } from "react-native";
import axiosClient from "../../src/services/axiosClient";
import { colors } from "../shared/commonStyles";
import BackButton from "../shared/BackButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "../stores/userStore";
import { IPatient } from "@/src/utils/constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STRIP_WIDTH = Math.max(160, Math.min(SCREEN_WIDTH * 0.48, 260));

const STRIP_HEIGHT = STRIP_WIDTH * 2.8;

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
  const user = useUserStore((state) => state.user);
  const userType = useUserStore((s) => s.user?.userType);
  const [previewLayout, setPreviewLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLocked, setQrLocked] = useState(false);
  const [takePhotoDisabled, setTakePhotoDisabled] = useState(true);
  const insets = useSafeAreaInsets();
  const patient = useUserStore((state) => state.patient);

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
    setTakePhotoDisabled(true);

    try {
      const formData = new FormData();
      console.log("photo uri: ", photoUri);
      const normalizedUri = photoUri.startsWith("file://")
        ? photoUri
        : `file://${photoUri}`;

      formData.append("image", {
        uri: photoUri,
        name: "urine_test.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("email_id", user?.userEmail || "test");
      formData.append("qr_code", qrData);
      formData.append("role", userType || "patient");
      formData.append("hw_id", user?.userId || "unknown");
      formData.append("patient_id", patient?.patient_id.toString() || "null");

      // await new Promise((r) => setTimeout(r, 5000));
      const response = await axiosClient.post("/users/process-test", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("process test response: ", response);

      setResultStatus({ message: "Successfully Completed", type: "success" });
      if (userType === "patient") {
        router.replace({
          pathname: "/components/test-results",
          params: { result: JSON.stringify(response), refresh: "true" },
        });
      } else {
        // router.replace({
        //   pathname: "/(home)/patients/[id]",
        //   params: {
        //     id: patient?.patient_id || 0,
        //     data: JSON.stringify(patient),
        //   },
        // });

        router.replace({
          pathname: "/components/test-result",
          params: {
            result: JSON.stringify(response),
            refresh: "true",
            patient: JSON.stringify(patient),
          },
        });
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      console.log("test result error: ", error);
      let message =
        "Something went wrong. Please wait for 10 seconds and try again.";

      if (Array.isArray(detail)) {
        message = detail.map((d) => d.msg).join(", ");
      } else if (typeof detail === "string") {
        message = detail?.detail;
      } else if (detail?.message) {
        message = detail.message;
      }
      setResultStatus({
        message: message,
        type: "error",
      });
    } finally {
      setLoading(false);
      setQrLocked(false);
      setQrData(null);
    }
  };

  // -----------------------------------------
  // TAKE PHOTO
  // -----------------------------------------
  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 1,
      skipProcessing: true,
    });
    const croppedStrip = await cropToStripFrame(photo);

    setPreviewPhoto(croppedStrip.uri);
    // uploadPhoto(photo.uri, user_mail); // replace with actual patientId and testId
  };

  if (!permission?.granted) {
    return <Text>Waiting for camera permission...</Text>;
  }

  const cropToStripFrame = async (photo: any) => {
    if (!previewLayout) return photo;

    const previewWidth = previewLayout.width;
    const previewHeight = previewLayout.height;

    // scale from preview → captured image
    const scaleX = photo.width / previewWidth;
    const scaleY = photo.height / previewHeight;

    // frame position inside preview
    const frameX = (previewWidth - STRIP_WIDTH) / 2;
    const frameY = (previewHeight - STRIP_HEIGHT) / 2;

    return ImageManipulator.manipulateAsync(
      photo.uri,
      [
        {
          crop: {
            originX: Math.round(frameX * scaleX),
            originY: Math.round(frameY * scaleY),
            width: Math.round(STRIP_WIDTH * scaleX),
            height: Math.round(STRIP_HEIGHT * scaleY),
          },
        },
      ],
      {
        compress: 0.95,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
  };

  const onBarcodeScanned = ({ data, type }: any) => {
    if (qrLocked) return;

    if (type === "qr") {
      console.log("QR VALUE:", data);
      setQrLocked(true); // lock scanning
      setQrData(data);
      setTakePhotoDisabled(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.statusbar,
        paddingTop: insets.top,
      }}
    >
      {/* TIMER */}
      {!showCamera && (
        <View style={{ flex: 1, backgroundColor: colors.bg_primary }}>
          <BackButton
            title="Back"
            onPress={() => navigation.goBack()}
            arrowColor={colors.primary}
            style={{
              paddingTop: 30,
              paddingHorizontal: 20,
            }}
          />
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

            {/* <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary, marginVertical: 40 },
              ]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.actionText}>Back to Home</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      )}

      {/* CAMERA */}
      {showCamera && !previewPhoto && (
        <View style={styles.cameraScreen}>
          <View
            style={styles.cameraContainer}
            onLayout={(e) => setPreviewLayout(e.nativeEvent.layout)}
          >
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={onBarcodeScanned}
            />

            {previewLayout && (
              <View style={StyleSheet.absoluteFill}>
                {/* TOP MASK */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: (previewLayout.height - STRIP_HEIGHT) / 2,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* BOTTOM MASK */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: (previewLayout.height - STRIP_HEIGHT) / 2,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* SIDE MASKS */}
                <View
                  style={{
                    position: "absolute",
                    top: (previewLayout.height - STRIP_HEIGHT) / 2,
                    bottom: (previewLayout.height - STRIP_HEIGHT) / 2,
                    left: 0,
                    width: (previewLayout.width - STRIP_WIDTH) / 2,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: (previewLayout.height - STRIP_HEIGHT) / 2,
                    bottom: (previewLayout.height - STRIP_HEIGHT) / 2,
                    right: 0,
                    width: (previewLayout.width - STRIP_WIDTH) / 2,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* FRAME + TEXT */}
                <View
                  style={{
                    position: "absolute",
                    top: (previewLayout.height - STRIP_HEIGHT) / 2,
                    left: (previewLayout.width - STRIP_WIDTH) / 2,
                    width: STRIP_WIDTH,
                    alignItems: "center",
                  }}
                >
                  <View style={styles.stripFrame} />
                  <Text style={styles.frameText}>
                    Align full strip inside the frame
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#444" }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.actionText}>Back to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: takePhotoDisabled ? "gray" : "red",
                  opacity: takePhotoDisabled ? 0.3 : 1,
                },
              ]}
              disabled={takePhotoDisabled}
              onPress={handleTakePhoto}
            >
              <Text style={styles.actionText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* RESULT POPUP */}
      <Modal visible={showResultPopup} animationType="fade">
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
                  {resultStatus?.message
                    ? resultStatus.message
                    : `❌ Something went wrong. Please wait for 10 seconds and try again.`}
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
                  uploadPhoto(previewPhoto!, user?.userEmail || "test");
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
    paddingBottom: 30,
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
  /* ================= OVERLAY ================= */
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Dark blur masks */
  topMask: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  bottomMask: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  middleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sideMask: {
    width: "50%",
    height: STRIP_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  /* ================= STRIP FRAME ================= */
  stripWrapper: {
    width: STRIP_WIDTH,
    alignItems: "center",
  },
  stripFrame: {
    width: STRIP_WIDTH,
    height: STRIP_HEIGHT,
    borderWidth: 2,
    borderColor: "#00E5FF",
    borderRadius: 12,
    // backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },

  frameText: {
    // position: "absolute",
    // bottom: -28,
    marginTop: 8,
    color: "#00E5FF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
