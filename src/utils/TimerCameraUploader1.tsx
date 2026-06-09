import {
  CameraView,
  BarcodeScanningResult,
  useCameraPermissions,
} from "expo-camera";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as ImageManipulator from "expo-image-manipulator";
import { Dimensions } from "react-native";
import axiosClient from "../services/axiosClient";
import { colors } from "../../app/shared/commonStyles";
import BackButton from "../../app/shared/BackButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "../../app/stores/userStore";
import { IPatient } from "@/src/utils/constants";
import PrimaryButton from "../../app/shared/PrimaryButton";
import CommonModal from "../../app/shared/CommonModel";
import WarningModal from "../../app/shared/WarningModal";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Physical dimensions: 10cm height × 2cm width = 5:1 ratio
const ASPECT_RATIO = 5; // height:width = 10:2
const STRIP_WIDTH = SCREEN_WIDTH * 0.3; // ~2cm equivalent on screen
const STRIP_HEIGHT = STRIP_WIDTH * ASPECT_RATIO; // 10cm equivalent
const FINAL_STRIP_HEIGHT = Math.min(STRIP_HEIGHT, SCREEN_HEIGHT * 0.72);
const FRAME_TOP_OFFSET = 40;
const TOTAL_TIME = 60;
const STRIP_WAITING_TIME = 60;

export default function TimerCameraUploader1() {
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(TOTAL_TIME); //60
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultStatus, setResultStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);

  const [cameraOpenedAt, setCameraOpenedAt] = useState(STRIP_WAITING_TIME); // 60 seconds until camera auto-closes for accuracy check

  const cameraRef = useRef<CameraView | null>(null);
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

  // Circle Config
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const FRAME_TOP_OFFSET = 60;
  // Progress
  const progress = countdown / TOTAL_TIME;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const strokeDashoffset = useMemo(() => {
    return circumference - circumference * progress;
  }, [progress]);

  const frameWidth = STRIP_WIDTH;

  const frameHeight = FINAL_STRIP_HEIGHT;

  const frameLeft = previewLayout ? (previewLayout.width - frameWidth) / 2 : 0;

  const frameTop = previewLayout
    ? (previewLayout.height - frameHeight) / 2 - FRAME_TOP_OFFSET
    : 0;

  // -----------------------------------------
  // COUNTDOWN TIMER
  // -----------------------------------------
  useEffect(() => {
    if (!started) return;
    if (countdown === 0) {
      setShowCamera(true);
      setStarted(false);
    }
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, started]);

  useEffect(() => {
    if (!showCamera) {
      return;
    }
    if (cameraOpenedAt === 0) {
      setShowAccuracyModal(true);
      // setCameraOpenedAt(null);
    }
    if (cameraOpenedAt > 0) {
      const timer = setTimeout(
        () => setCameraOpenedAt(cameraOpenedAt - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [showCamera, cameraOpenedAt]);

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

      router.replace({
        pathname: "/components/test-result",
        params: {
          result: JSON.stringify(response),
          refresh: "true",
          patient: JSON.stringify(patient),
        },
      });
    } catch (error: any) {

      let message =
        "Something went wrong. Please wait for 10 seconds and try again.";

      const detail = error?.response?.data?.detail;

      try {
        if (Array.isArray(detail)) {
          message = detail.map((d) => d.msg).join(", ");
        } else if (typeof detail === "string") {
          // Try parsing JSON string
          try {
            const parsed = JSON.parse(detail);

            if (parsed?.detail) {
              message = parsed.detail;
            } else if (parsed?.message) {
              message = parsed.message;
            } else {
              message = detail;
            }
          } catch {
            message = detail;
          }
        } else if (detail?.detail) {
          message = detail.detail;
        } else if (detail?.message) {
          message = detail.message;
        }
      } catch (e) {
        console.error("Error parsing API error response:", e);
      }

      setResultStatus({
        message,
        type: "error",
      });
    } finally {
      setLoading(false);
      setQrLocked(false);
      setQrData(null);
      setShowCamera(true);
      setTakePhotoDisabled(true);
      setPreviewPhoto(null);
    }
  };

  // -----------------------------------------
  // TAKE PHOTO
  // -----------------------------------------
  const handleTakePhoto = async () => {
    try {
      if (!cameraRef.current || !previewLayout) return;

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
        base64: false,
      });

      const croppedImage = await cropToStripFrame(photo);

      setPreviewPhoto(croppedImage.uri);
    } catch (error) {
      console.log("Capture Error:", error);
    }
  };

  if (!permission?.granted) {
    return <Text>Waiting for camera permission...</Text>;
  }

  const cropToStripFrame = async (photo: any) => {
    if (!previewLayout) return photo;

    const previewWidth = previewLayout.width;
    const previewHeight = previewLayout.height;

    const imageWidth = photo.width;
    const imageHeight = photo.height;

    const frameWidth = STRIP_WIDTH;

    const frameHeight = FINAL_STRIP_HEIGHT;

    const frameLeft = (previewWidth - frameWidth) / 2;

    const frameTop = (previewHeight - frameHeight) / 2 - FRAME_TOP_OFFSET;

    // Calculate scale factors - the camera may crop to fit 4:3
    const previewAspect = previewWidth / previewHeight;
    const imageAspect = imageWidth / imageHeight;

    let scaleX,
      scaleY,
      offsetX = 0,
      offsetY = 0;

    if (imageAspect > previewAspect) {
      // Image is wider - height matches, width is cropped
      scaleY = imageHeight / previewHeight;
      scaleX = scaleY;
      offsetX = (imageWidth - previewWidth * scaleX) / 2;
    } else {
      // Image is taller - width matches, height is cropped
      scaleX = imageWidth / previewWidth;
      scaleY = scaleX;
      offsetY = (imageHeight - previewHeight * scaleY) / 2;
    }

    // Frame position in preview coordinates
    const frameX = (previewWidth - STRIP_WIDTH) / 2;
    const frameY = (previewHeight - FINAL_STRIP_HEIGHT) / 2;

    // Convert to image coordinates
    const cropX = Math.round(frameLeft * scaleX + offsetX);

    const cropY = Math.round(frameTop * scaleY + offsetY);

    const cropWidth = Math.round(frameWidth * scaleX);

    const cropHeight = Math.round(frameHeight * scaleY);

    const safeCropX = Math.max(0, cropX);

    const safeCropY = Math.max(0, cropY);

    const safeCropWidth = Math.min(cropWidth, imageWidth - safeCropX);

    const safeCropHeight = Math.min(cropHeight, imageHeight - safeCropY);

    return await ImageManipulator.manipulateAsync(
      photo.uri,
      [
        {
          crop: {
            originX: safeCropX,
            originY: safeCropY,
            width: safeCropWidth,
            height: safeCropHeight,
          },
        },
      ],
      {
        compress: 0,
        format: ImageManipulator.SaveFormat.WEBP,
      },
    );
  };

  const onBarcodeScanned = ({ data, type }: any) => {
    if (qrLocked) return;

    if (type === "qr") {
      setQrLocked(true); // lock scanning
      setQrData(data);
      setTakePhotoDisabled(false);
    }
  };

  const handleBackPress = () => {
    if (started || (showCamera && !previewPhoto)) setShowPopup(true);
    else navigation.goBack();
  };
  const handleBackPressCamera = () => {
    if (showCamera) {
      setShowCamera(false);
      setCountdown(TOTAL_TIME);
      setStarted(false);
    } else {
      navigation.goBack();
    }
  };

  const handleWarningRetry = () => {
    setShowAccuracyModal(false);
    setShowCamera(false);
    setCountdown(TOTAL_TIME);
    setStarted(false);
  };

  const handleResultPopup = () => {
    setShowResultPopup(false);
    setResultStatus(null);
    setCountdown(TOTAL_TIME);
    setStarted(false);
    setShowCamera(true);
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
        <View style={{ flex: 1, backgroundColor: colors.bg_home }}>
          <BackButton
            title="Back"
            onPress={handleBackPress}
            arrowColor={colors.white}
            color={colors.white}
            style={{
              paddingTop: 30,
              paddingHorizontal: 20,
            }}
          />

          <View style={styles.timerContainer}>
            {/* PROGRESS CIRCLE */}
            <View style={styles.circleWrapper}>
              <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                  stroke="#3A4665"
                  fill="none"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                />

                {/* Animated Progress */}
                <Circle
                  stroke="#4ADE80"
                  fill="none"
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="90"
                  origin={`${size / 2}, ${size / 2}`}
                  scaleX={-1}
                />
              </Svg>

              {/* CENTER BUTTON */}
              <TouchableOpacity style={styles.circleButton}>
                <Text style={styles.timerText}>{countdown}</Text>

                {/* <Text style={styles.secondsText}>seconds</Text> */}
              </TouchableOpacity>
            </View>

            {/* WAIT BOX */}
            <Text
              style={[styles.waitText, { marginTop: 20, color: colors.white }]}
            >
              Please wait for{" "}
              <Text style={{ color: colors.white, fontWeight: "600" }}>
                60 seconds
              </Text>
            </Text>
          </View>
          <View style={styles.waitBox}>
            <Text style={styles.waitText}>
              Scan the card immediatly after the timer ends.
            </Text>
          </View>
          <PrimaryButton
            onPress={() => setStarted(true)}
            title="Start Timer"
            style={[
              {
                bottom: 0,
                width: "90%",
                alignSelf: "center",
                marginBottom: insets.bottom + 20,
                borderRadius: 6,
              },
            ]}
            textStyle={started ? { color: "#fff" } : { color: "#fff" }}
            disabled={started}
          />
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
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={onBarcodeScanned}
            />

            {previewLayout && (
              <View style={StyleSheet.absoluteFill}>
                <BackButton
                  title="Back"
                  onPress={handleBackPress}
                  arrowColor={colors.white}
                  color={colors.white}
                  style={{
                    paddingTop: 30,
                    paddingHorizontal: 20,
                    zIndex: 10,
                  }}
                />
                {/* TOP MASK */}
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: frameTop,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* BOTTOM MASK */}
                <View
                  style={{
                    position: "absolute",
                    top: frameTop + frameHeight,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* SIDE MASKS */}
                <View
                  style={{
                    position: "absolute",
                    top: frameTop,
                    left: 0,
                    width: frameLeft,
                    height: frameHeight,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: frameTop,
                    right: 0,
                    width: frameLeft,
                    height: frameHeight,
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* FRAME + TEXT */}
                <View
                  style={{
                    position: "absolute",
                    top: frameTop,
                    left: frameLeft,
                    width: frameWidth,
                    height: frameHeight,
                  }}
                >
                  <View
                    style={[
                      styles.stripFrame,
                      {
                        width: STRIP_WIDTH,
                        height: FINAL_STRIP_HEIGHT,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.frameText,
                    {
                      top:
                        (previewLayout.height - FINAL_STRIP_HEIGHT) / 2 -
                        FRAME_TOP_OFFSET +
                        FINAL_STRIP_HEIGHT -
                        50,
                    },
                  ]}
                >
                  Align full strip inside the frame
                </Text>

                <PrimaryButton
                  title="Take Photo"
                  disabled={takePhotoDisabled}
                  style={{
                    position: "absolute",
                    bottom: insets.bottom + 20,
                    alignSelf: "center",
                    width: "50%",
                    borderRadius: 6,
                    backgroundColor: takePhotoDisabled
                      ? "gray"
                      : colors.primary,
                    opacity: takePhotoDisabled ? 0.6 : 1,
                  }}
                  textStyle={{ color: "#fff", fontWeight: "700" }}
                  onPress={handleTakePhoto}
                />
              </View>
            )}
          </View>
        </View>
      )}

      {/* RESULT POPUP */}
      <Modal visible={showResultPopup} animationType="fade" transparent>
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
              <View style={styles.errorContainer}>
              
                <Ionicons name="warning-outline" size={60} color="#DC3545" />

                <Text style={styles.errorTitle}>Test Failed</Text>

                <Text style={styles.errorMessage}>
                  {resultStatus?.message ||
                    "Something went wrong. Please wait for 10 seconds and try again."}
                </Text>
              </View>
            )}

            {!loading && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleResultPopup}
              >
                <Text style={styles.closeBtnText}>Retake</Text>
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

            <Image
              source={{ uri: previewPhoto }}
              style={styles.previewImage}
              resizeMode="contain"
            />

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

      {/* Exit Confirmation Modal */}
      <CommonModal
        visible={showPopup}
        title="Warning"
        message="Are you sure you want to exit the test?"
        confirmText="Stay"
        cancelText="Exit"
        onConfirm={() => {
          setShowPopup(false);
        }}
        onCancel={() => {
          setShowPopup(false);
          handleBackPressCamera();
        }}
        confirmButtonStyle={{
          backgroundColor: colors.blue,
          borderWidth: 1,
          borderColor: colors.blue,
        }}
        confirmTextStyle={{ color: colors.white }}
        cancelButtonStyle={{
          backgroundColor: colors.gray,
          borderWidth: 1,
          borderColor: colors.gray,
        }}
        cancelTextStyle={{ color: colors.black }}
      />

      <WarningModal
        visible={showAccuracyModal}
        onRetry={handleWarningRetry}
        onContinue={() => {
          setShowAccuracyModal(false);
        }}
      />
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
    backgroundColor: colors.bg_home,
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
    width: "90%",
    padding: 25,
    // marginTop: 22,
    marginBottom: 30,
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 10,
    backgroundColor: "#f6f7f7",
  },

  waitText: {
    fontSize: 18,
    textAlign: "center",
    color: colors.black,
  },

  circleWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },

  circleButton: {
    position: "absolute",
    width: 145,
    height: 145,
    borderRadius: 145,
    // backgroundColor: "#3A4665",
    justifyContent: "center",
    alignItems: "center",
  },

  timerText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  secondsText: {
    marginTop: 4,
    fontSize: 14,
    color: "#CBD5E1",
  },

  previewBox: {
    width: "90%",
    maxHeight: "85%",
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
    height: 500,
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
    backgroundColor: "transparent",
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
    backgroundColor: "rgba(0,0,0,0.8)",
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
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 12,
  },

  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

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

  stripWrapper: {
    width: STRIP_WIDTH,
    alignItems: "center",
  },

  stripFrame: {
    // width: STRIP_WIDTH,
    // height: STRIP_HEIGHT,
    borderWidth: 3,
    borderColor: "#00E5FF",
    borderRadius: 18,
    backgroundColor: "transparent",
  },

  frameText: {
    marginTop: 8,
    color: "#00E5FF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginVertical: 5,
  },

  errorImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#DC3545",
    marginBottom: 8,
  },

  errorMessage: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    lineHeight: 24,
  },

  retakeBtn: {
    backgroundColor: "#0D6EFD",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },

  retakeBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
