import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { router, useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as ImageManipulator from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import axiosClient from "../../../src/services/axiosClient";
import { colors } from "../../shared/commonStyles";
import BackButton from "../../shared/BackButton";
import PrimaryButton from "../../shared/PrimaryButton";
import CommonModal from "../../shared/CommonModel";
import WarningModal from "../../shared/WarningModal";
import { useUserStore } from "../../stores/userStore";

import {
  STRIP_WIDTH,
  STRIP_HEIGHT,
  FRAME_TOP_OFFSET,
  TOTAL_WAIT,
  CAMERA_TIMEOUT,
  AUTO_CAPTURE_DELAY,
  ANALYSIS_INTERVAL,
  STABLE_TICKS_NEEDED,
  STABLE_TICKS_PENALTY,
  C_SIZE,
  C_STROKE,
  C_RADIUS,
  C_CIRC,
  FRAME_VISUAL,
  STEPS,
  FrameState,
  QUALITY_HINTS,
} from "./constants";
import { analyseFrameQuality, parseApiError } from "./utils";
import { CameraOverlay } from "./CameraOverlay";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimerCameraUploader() {
  // ── Stores / navigation
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const patient = useUserStore((s) => s.patient);
  const userType = useUserStore((s) => s.user?.userType);

  // ── Camera permission
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // ── Wait-screen state
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState(TOTAL_WAIT);
  const [showCamera, setShowCamera] = useState(false);

  // ── Camera state
  const [cameraOpenedAt, setCameraOpenedAt] = useState(CAMERA_TIMEOUT);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLocked, setQrLocked] = useState(false);
  const [frameState, setFrameState] = useState<FrameState>("IDLE");
  const [autoCount, setAutoCount] = useState(AUTO_CAPTURE_DELAY);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [takePhotoDisabled, setTakePhotoDisabled] = useState(true);

  // ── Modal state
  const [showPopup, setShowPopup] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Refs
  const cameraRef = useRef<CameraView | null>(null);
  const layoutRef = useRef<{ width: number; height: number } | null>(null);
  const stableTicksRef = useRef(0);
  const capturingRef = useRef(false);
  const analysisRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref mirror of previewPhoto so interval closures always read the latest value
  const previewRef = useRef<string | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────

  const visual = FRAME_VISUAL[frameState];
  const strokeDashoffset = C_CIRC - C_CIRC * (countdown / TOTAL_WAIT);

  const [previewLayout, setPreviewLayout] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const frameLeft = useMemo(
    () => (previewLayout ? (previewLayout.width - STRIP_WIDTH) / 2 : 0),
    [previewLayout],
  );
  const frameTop = useMemo(
    () =>
      previewLayout
        ? (previewLayout.height - STRIP_HEIGHT) / 2 - FRAME_TOP_OFFSET
        : 0,
    [previewLayout],
  );

  // ─── Keep previewRef in sync ──────────────────────────────────────────────

  useEffect(() => {
    previewRef.current = previewPhoto;
  }, [previewPhoto]);

  // ─── Wait countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!started) return;
    if (countdown === 0) {
      setShowCamera(true);
      setStarted(false);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [started, countdown]);

  // ─── Camera timeout ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!showCamera || previewPhoto) return;
    if (cameraOpenedAt === 0) {
      setShowAccuracyModal(true);
      setCameraOpenedAt(-1);
      return;
    }
    const t = setTimeout(() => setCameraOpenedAt((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showCamera, cameraOpenedAt, previewPhoto]);

  // ─── Frame analysis loop ──────────────────────────────────────────────────
  //
  // Restarts each time qrLocked flips to true (including after a retake).
  // Uses previewRef (not previewPhoto state) so the interval closure always
  // reads the current value without needing to be recreated on every render.

  const stopAnalysis = useCallback(() => {
    if (analysisRef.current) {
      clearInterval(analysisRef.current);
      analysisRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!showCamera || !qrLocked || previewPhoto || loading) {
      stopAnalysis();
      return;
    }

    stopAnalysis();
    analysisRef.current = setInterval(async () => {
      // Do not probe while a full capture is in progress or preview is showing
      if (capturingRef.current) return;
      if (previewRef.current) return; // ← stale-closure-safe check
      if (!cameraRef.current) return;

      try {
        const probe = await cameraRef.current.takePictureAsync({
          quality: 0.92,
          skipProcessing: true,
          base64: true,
          exif: false,
        });
        if (!probe?.base64) return;

        const quality = analyseFrameQuality(probe.base64);

        if (quality === "blur") {
          stableTicksRef.current = 0;
          setFrameState("BLUR");
          return;
        }
        if (quality === "reflection") {
          stableTicksRef.current = 0;
          setFrameState("REFLECTION");
          return;
        }

        stableTicksRef.current += 1;
        setFrameState(
          stableTicksRef.current >= STABLE_TICKS_NEEDED
            ? "STABLE"
            : "STRIP_ALIGN",
        );
      } catch {
        /* camera momentarily busy – skip tick */
      }
    }, ANALYSIS_INTERVAL);

    return stopAnalysis;
  }, [showCamera, qrLocked, previewPhoto]);

  // ─── Auto-capture countdown ───────────────────────────────────────────────
  //
  // BUG FIX: we also guard on previewPhoto so the countdown cannot reach 0
  // while the preview sheet is already open. Without this, the interval above
  // stops but the setTimeout chain in this effect can still fire triggerCapture
  // a second time because frameState is still "STABLE" when previewPhoto is set.

  useEffect(() => {
    if (frameState !== "STABLE" || previewPhoto || loading) {
      setAutoCount(AUTO_CAPTURE_DELAY);
      return;
    }
    if (autoCount === 0) {
      triggerCapture();
      return;
    }
    const t = setTimeout(() => setAutoCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [frameState, autoCount, previewPhoto, loading]); // previewPhoto and loading in deps are intentional

  // ─── QR scanned ───────────────────────────────────────────────────────────

  const onBarcodeScanned = useCallback(
    ({ data, type }: BarcodeScanningResult) => {
      if (qrLocked || type !== "qr") return;
      setQrLocked(true);
      setQrData(data);
      setTakePhotoDisabled(false);
      setFrameState("STRIP_ALIGN");
      stableTicksRef.current = 0;
    },
    [qrLocked],
  );

  // ─── Capture ──────────────────────────────────────────────────────────────

  const triggerCapture = useCallback(async () => {
    // Guard 1: only one capture at a time
    if (capturingRef.current) return;
    // Guard 2: never fire if preview is already showing
    if (previewRef.current) return;
    if (!cameraRef.current) return;
    if (!layoutRef.current) return;

    capturingRef.current = true;
    setFrameState("CAPTURING");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: true,
        base64: false,
      });
      const cropped = await cropToStripFrame(photo, layoutRef.current);
      setPreviewPhoto(cropped.uri);
    } catch (e) {
      console.error("Capture error:", e);
    } finally {
      capturingRef.current = false;
      // Return to STRIP_ALIGN only if no preview was set (capture failed)
      setFrameState((prev) => (prev === "CAPTURING" ? "STRIP_ALIGN" : prev));
    }
  }, []);

  const handleTakePhoto = useCallback(() => {
    if (capturingRef.current || frameState === "CAPTURING") return;
    triggerCapture();
  }, [frameState, triggerCapture]);

  // ─── Retake ───────────────────────────────────────────────────────────────

  const handleRetake = useCallback(() => {
    setPreviewPhoto(null); // previewRef updated by its own useEffect
    stableTicksRef.current = 0;
    setFrameState("STRIP_ALIGN");
    setAutoCount(AUTO_CAPTURE_DELAY);
    setQrLocked(false); // keep QR locked to avoid re-triggering analysis
    // analysis useEffect re-fires because qrLocked is still true and
    // previewRef.current becomes null on the next tick, allowing probes again
  }, []);

  // ─── Crop utility ─────────────────────────────────────────────────────────

  const cropToStripFrame = async (
    photo: any,
    layout: { width: number; height: number },
  ) => {
    const { width: pW, height: pH } = layout;
    const { width: iW, height: iH } = photo;

    const previewAspect = pW / pH;
    const imageAspect = iW / iH;

    let scaleX: number,
      scaleY: number,
      offsetX = 0,
      offsetY = 0;
    if (imageAspect > previewAspect) {
      scaleY = iH / pH;
      scaleX = scaleY;
      offsetX = (iW - pW * scaleX) / 2;
    } else {
      scaleX = iW / pW;
      scaleY = scaleX;
      offsetY = (iH - pH * scaleY) / 2;
    }

    const fLeft = (pW - STRIP_WIDTH) / 2;
    const fTop = (pH - STRIP_HEIGHT) / 2 - FRAME_TOP_OFFSET;

    const cropX = Math.max(0, Math.round(fLeft * scaleX + offsetX));
    const cropY = Math.max(0, Math.round(fTop * scaleY + offsetY));
    const cropW = Math.min(Math.round(STRIP_WIDTH * scaleX), iW - cropX);
    const cropH = Math.min(Math.round(STRIP_HEIGHT * scaleY), iH - cropY);

    return ImageManipulator.manipulateAsync(
      photo.uri,
      [
        {
          crop: { originX: cropX, originY: cropY, width: cropW, height: cropH },
        },
      ],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
    );
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  const uploadPhoto = async (uri: string) => {
    setLoading(true);
    setShowResultPopup(true);
    setResultStatus(null);
    setTakePhotoDisabled(true);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri,
        name: "urine_test.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("email_id", user?.userEmail || "test");
      formData.append("qr_code", qrData || "");
      formData.append("role", userType || "patient");
      formData.append("hw_id", user?.userId || "unknown");
      formData.append("patient_id", patient?.patient_id?.toString() || "null");

      const response = await axiosClient.post("/users/process-test", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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
      setResultStatus({ message: parseApiError(error), type: "error" });
    } finally {
      setLoading(false);
      // On error: unlock scanning so user can try again
      setQrLocked(false);
      setQrData(null);
      setShowCamera(true);
      setTakePhotoDisabled(true);
      setPreviewPhoto(null);
    }
  };

  // ─── Reset helpers ────────────────────────────────────────────────────────

  const resetCameraState = useCallback(() => {
    stopAnalysis();
    capturingRef.current = false;
    stableTicksRef.current = 0;
    setQrData(null);
    setQrLocked(false);
    setFrameState("IDLE");
    setAutoCount(AUTO_CAPTURE_DELAY);
    setPreviewPhoto(null);
    setTakePhotoDisabled(true);
    setCameraOpenedAt(CAMERA_TIMEOUT);
    setShowResultPopup(false);
    setResultStatus(null);
  }, [stopAnalysis]);

  const handleBackPress = useCallback(() => {
    if (started || (showCamera && !previewPhoto)) {
      setShowPopup(true);
      return;
    }
    navigation.goBack();
  }, [started, showCamera, previewPhoto, navigation]);

  const handleBackPressCamera = useCallback(() => {
    if (showCamera) {
      resetCameraState();
      setShowCamera(false);
      setCountdown(TOTAL_WAIT);
      setStarted(false);
    } else {
      navigation.goBack();
    }
  }, [showCamera, resetCameraState, navigation]);

  const handleWarningRetry = useCallback(() => {
    setShowAccuracyModal(false);
    resetCameraState();
    setShowCamera(false);
    setCountdown(TOTAL_WAIT);
    setStarted(false);
  }, [resetCameraState]);

  const handleResultPopup = useCallback(() => {
    setShowResultPopup(false);
    setResultStatus(null);
    resetCameraState();
    setCountdown(TOTAL_WAIT);
    setStarted(false);
    setShowCamera(true);
  }, [resetCameraState]);

  // ─── Permission gate ──────────────────────────────────────────────────────

  if (!permission?.granted) {
    return <Text>Waiting for camera permission…</Text>;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.statusbar,
        paddingTop: insets.top,
      }}
    >
      {/* ══════════════════════════════════════════════
          WAIT / TIMER SCREEN
      ══════════════════════════════════════════════ */}
      {!showCamera && (
        <View style={{ flex: 1, backgroundColor: colors.bg_home }}>
          <BackButton
            title="Back"
            onPress={handleBackPress}
            arrowColor={colors.white}
            color={colors.white}
            style={{ paddingTop: 30, paddingHorizontal: 20 }}
          />

          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.circleWrapper}>
              <Svg width={C_SIZE} height={C_SIZE}>
                <Circle
                  stroke="#3A4665"
                  fill="none"
                  cx={C_SIZE / 2}
                  cy={C_SIZE / 2}
                  r={C_RADIUS}
                  strokeWidth={C_STROKE}
                />
                <Circle
                  stroke="#4ADE80"
                  fill="none"
                  cx={C_SIZE / 2}
                  cy={C_SIZE / 2}
                  r={C_RADIUS}
                  strokeWidth={C_STROKE}
                  strokeDasharray={C_CIRC}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="90"
                  origin={`${C_SIZE / 2}, ${C_SIZE / 2}`}
                  scaleX={-1}
                />
              </Svg>
              <TouchableOpacity style={styles.circleButton}>
                <Text style={styles.timerText}>{countdown}</Text>
              </TouchableOpacity>
            </View>

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
              Scan the card immediately after the timer ends.
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
            textStyle={{ color: "#fff" }}
            disabled={started}
          />
        </View>
      )}

      {/* ══════════════════════════════════════════════
          CAMERA SCREEN
          CameraView stays mounted even when preview is
          showing so the sensor stays warm for retakes.
      ══════════════════════════════════════════════ */}
      {showCamera && (
        <View style={styles.cameraScreen}>
          <View
            style={styles.cameraContainer}
            onLayout={(e) => {
              layoutRef.current = e.nativeEvent.layout;
              setPreviewLayout(e.nativeEvent.layout);
            }}
          >
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={qrLocked ? undefined : onBarcodeScanned}
            />

            {/* Overlay hidden while preview sheet is open */}
            {!previewPhoto && previewLayout && (
              <CameraOverlay
                layout={previewLayout}
                frameState={frameState}
                visual={visual}
                qrLocked={qrLocked}
                autoCount={autoCount}
                cameraTimeout={cameraOpenedAt}
                insets={insets}
                onBack={handleBackPress}
                onCapture={handleTakePhoto}
              />
            )}
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════
          PREVIEW MODAL
      ══════════════════════════════════════════════ */}
      <Modal transparent visible={!!previewPhoto} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Preview</Text>

            <Image
              source={{ uri: previewPhoto! }}
              style={styles.previewImage}
              resizeMode="contain"
            />

            {/* Quality hints */}
            <View style={styles.qualityRow}>
              {QUALITY_HINTS.map((h, i) => (
                <View key={i} style={styles.qualityHint}>
                  <MaterialCommunityIcons
                    name={h.icon as any}
                    size={16}
                    color={h.color}
                  />
                  <Text style={[styles.qualityText, { color: h.color }]}>
                    {h.text}
                  </Text>
                </View>
              ))}
              <View key="custom" style={styles.qualityHint}>
                <MaterialCommunityIcons
                  name={frameState === "BLUR" || frameState === "REFLECTION" ? "alert-circle-outline" : "check-circle-outline"}
                  size={16}
                  color={frameState === "BLUR" || frameState === "REFLECTION" ? "#F87171" : colors.green}
                />
                <Text style={[styles.qualityText, { color: frameState === "BLUR" || frameState === "REFLECTION" ? "#F87171" : colors.green }]}>
                  {frameState === "BLUR"
                    ? "Image is blurry"
                    : frameState === "REFLECTION"
                      ? "Glare detected"
                      : "Image looks good"}
                </Text>
              </View>
            </View>

            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.previewBtn, { backgroundColor: "#666" }]}
                onPress={handleRetake}
              >
                <Text style={styles.previewText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewBtn, { backgroundColor: "#28A745" }]}
                onPress={() => {
                  const uri = previewPhoto!;
                  setPreviewPhoto(null);
                  uploadPhoto(uri);
                }}
              >
                <Text style={styles.previewText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          RESULT POPUP
      ══════════════════════════════════════════════ */}
      <Modal visible={showResultPopup} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {loading && (
              <>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={styles.modalText}>
                  Please wait, result in progress…
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
                <Text style={styles.errorMessage}>{resultStatus.message}</Text>
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

      {/* ══════════════════════════════════════════════
          EXIT CONFIRMATION
      ══════════════════════════════════════════════ */}
      <CommonModal
        visible={showPopup}
        title="Warning"
        message="Are you sure you want to exit the test?"
        confirmText="Stay"
        cancelText="Exit"
        onConfirm={() => setShowPopup(false)}
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

      {/* ══════════════════════════════════════════════
          ACCURACY WARNING
      ══════════════════════════════════════════════ */}
      <WarningModal
        visible={showAccuracyModal}
        onRetry={handleWarningRetry}
        onContinue={() => {
          setShowAccuracyModal(false);
          // setCameraOpenedAt(CAMERA_TIMEOUT);
        }}
      />
    </View>
  );
}

// ─── Styles (original from source) ───────────────────────────────────────────

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
  waitBox: {
    borderColor: "#b6b7b7",
    borderWidth: 1,
    width: "90%",
    padding: 25,
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
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Preview
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
  qualityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 12,
  },
  qualityHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.green,
  },

  // Modals
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
  closeBtnText: { color: "#fff", fontWeight: "700" },

  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginVertical: 5,
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
});
