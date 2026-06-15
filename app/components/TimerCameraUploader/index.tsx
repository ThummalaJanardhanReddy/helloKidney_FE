import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { router, useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import axiosClient from "../../../src/services/axiosClient";
import { colors } from "../../shared/commonStyles";
import BackButton from "../../shared/BackButton";
import PrimaryButton from "../../shared/PrimaryButton";
import CommonModal from "../../shared/CommonModel";
import { useUserStore } from "../../stores/userStore";

import {
  STRIP_WIDTH,
  STRIP_HEIGHT,
  FRAME_TOP_OFFSET,
  TOTAL_WAIT,
  CAMERA_TIMEOUT,
  C_SIZE,
  C_STROKE,
  C_RADIUS,
  C_CIRC,
  FRAME_VISUAL,
  FrameState,
} from "./constants";
import { CameraOverlay } from "./CameraOverlay";

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimerCameraUploader() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const user       = useUserStore((s) => s.user);
  const patient    = useUserStore((s) => s.patient);
  const userType   = useUserStore((s) => s.user?.userType);

  // ── Camera permission
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => { if (!permission?.granted) requestPermission(); }, []);

  // ── Wait screen
  const [started,    setStarted]    = useState(false);
  const [countdown,  setCountdown]  = useState(TOTAL_WAIT);
  const [showCamera, setShowCamera] = useState(false);

  // ── Camera / capture
  const [qrData,        setQrData]        = useState<string | null>(null);
  const [qrLocked,      setQrLocked]      = useState(false);
  const [frameState,    setFrameState]    = useState<FrameState>("IDLE");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Preview
  const [previewUri,     setPreviewUri]     = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Modals
  const [showExitModal,     setShowExitModal]     = useState(false);
  const [showTimingWarning, setShowTimingWarning] = useState(false);
  const [showRetakeWarning, setShowRetakeWarning] = useState(false);
  const [retakeErrorMsg,    setRetakeErrorMsg]    = useState("");

  // ── Refs
  const cameraRef       = useRef<CameraView | null>(null);
  const layoutRef       = useRef<{ width: number; height: number } | null>(null);
  const capturingRef    = useRef(false);
  const previewUriRef   = useRef<string | null>(null);
  const qrDataRef       = useRef<string | null>(null);
  const deadlineRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningDismissedRef = useRef(false);

  const [previewLayout, setPreviewLayout] = useState<{ width: number; height: number } | null>(null);

  const visual           = FRAME_VISUAL[frameState];
  const strokeDashoffset = C_CIRC - C_CIRC * (countdown / TOTAL_WAIT);

  // Keep refs in sync with state
  useEffect(() => { previewUriRef.current = previewUri; }, [previewUri]);
  useEffect(() => { qrDataRef.current = qrData; }, [qrData]);

  // ─── Wait countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!started) return;
    if (countdown === 0) { setShowCamera(true); setStarted(false); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [started, countdown]);

  // ─── Deadline timer (20 s after camera opens) ─────────────────────────────

  const clearDeadline = useCallback(() => {
    if (deadlineRef.current) { clearTimeout(deadlineRef.current); deadlineRef.current = null; }
  }, []);

  const startDeadline = useCallback(() => {
    clearDeadline();
    warningDismissedRef.current = false;
    deadlineRef.current = setTimeout(() => {
      if (!previewUriRef.current && !warningDismissedRef.current) {
        setShowTimingWarning(true);
      }
    }, CAMERA_TIMEOUT * 1000);
  }, [clearDeadline]);

  useEffect(() => {
    if (showCamera) startDeadline();
    return clearDeadline;
  }, [showCamera]);

  // ─── QR scanned ───────────────────────────────────────────────────────────

  const onBarcodeScanned = useCallback(({ data, type }: BarcodeScanningResult) => {
    if (qrLocked || type !== "qr") return;
    setQrLocked(true);
    setQrData(data);
    setFrameState("STRIP_ALIGN");
  }, [qrLocked]);

  // ─── Crop to strip frame ──────────────────────────────────────────────────

  const cropToStripFrame = useCallback(async (
    photo: any,
    layout: { width: number; height: number },
  ) => {
    const { width: pW, height: pH } = layout;
    const { width: iW, height: iH } = photo;

    const previewAspect = pW / pH;
    const imageAspect   = iW / iH;

    let scaleX: number, scaleY: number, offsetX = 0, offsetY = 0;
    if (imageAspect > previewAspect) {
      scaleY = iH / pH; scaleX = scaleY;
      offsetX = (iW - pW * scaleX) / 2;
    } else {
      scaleX = iW / pW; scaleY = scaleX;
      offsetY = (iH - pH * scaleY) / 2;
    }

    const fLeft = (pW - STRIP_WIDTH)  / 2;
    const fTop  = (pH - STRIP_HEIGHT) / 2 - FRAME_TOP_OFFSET;

    const cropX = Math.max(0, Math.round(fLeft * scaleX + offsetX));
    const cropY = Math.max(0, Math.round(fTop  * scaleY + offsetY));
    const cropW = Math.min(Math.round(STRIP_WIDTH  * scaleX), iW - cropX);
    const cropH = Math.min(Math.round(STRIP_HEIGHT * scaleY), iH - cropY);

    return ImageManipulator.manipulateAsync(
      photo.uri,
      [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG },
    );
  }, []);

  // ─── Take picture ─────────────────────────────────────────────────────────

  const handleTakePhoto = useCallback(async () => {
    if (capturingRef.current || !cameraRef.current || !layoutRef.current) return;
    if (!qrLocked) {
      Alert.alert("QR Not Scanned", "Please scan the QR code on the card first.");
      return;
    }

    capturingRef.current = true;
    setActionLoading(true);
    setFrameState("CAPTURING");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9, skipProcessing: false, base64: false, exif: false,
      });
      const cropped = await cropToStripFrame(photo, layoutRef.current!);

      clearDeadline();
      setPreviewUri(cropped.uri);
      setFrameState("STRIP_ALIGN");
    } catch (e) {
      console.error("[Camera] Capture error:", e);
      Alert.alert("Capture Failed", "Failed to capture image. Please try again.");
      setFrameState("STRIP_ALIGN");
    } finally {
      capturingRef.current = false;
      setActionLoading(false);
    }
  }, [qrLocked, clearDeadline, cropToStripFrame]);

  // ─── Retake ───────────────────────────────────────────────────────────────

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
    setQrLocked(false);
    setQrData(null);
    setFrameState("IDLE");
    startDeadline();
  }, [startDeadline]);

  // ─── Upload — same endpoint & payload as original RN code ─────────────────

  const handleContinue = useCallback(async () => {
    if (!previewUri || !patient) return;
    setPreviewLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri:  previewUri,
        name: "urine_test.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("email_id",   user?.userEmail   || "test");
      formData.append("qr_code",    qrDataRef.current || "");
      formData.append("role",       userType           || "patient");
      formData.append("hw_id",      user?.userId       || "unknown");
      formData.append("patient_id", patient.patient_id?.toString() || "null");

      const response = await axiosClient.post("/users/process-test", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      router.replace({
        pathname: "/components/test-result",
        params: {
          result:  JSON.stringify(response),
          refresh: "true",
          patient: JSON.stringify(patient),
        },
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const errorMsg = parseUploadError(error);

      if (status === 400) {
        clearDeadline();
        warningDismissedRef.current = true;
        setRetakeErrorMsg(errorMsg);
        setShowRetakeWarning(true);
      } else {
        Alert.alert("Error", errorMsg);
        handleRetake();
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [previewUri, patient, user, userType, clearDeadline, handleRetake]);

  // ─── Error parser ─────────────────────────────────────────────────────────

  function parseUploadError(error: any): string {
    const fallback = "Something went wrong. Please wait and try again.";
    const detail   = error?.response?.data?.detail;
    if (!detail) return fallback;
    try {
      if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(", ");
      if (typeof detail === "string") {
        try { const p = JSON.parse(detail); return p?.detail || p?.message || detail; }
        catch { return detail; }
      }
      return detail?.detail || detail?.message || fallback;
    } catch { return fallback; }
  }

  // ─── Navigation / reset ───────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    clearDeadline();
    capturingRef.current = false;
    setQrData(null);
    setQrLocked(false);
    setFrameState("IDLE");
    setPreviewUri(null);
    setShowTimingWarning(false);
    setShowRetakeWarning(false);
    warningDismissedRef.current = false;
  }, [clearDeadline]);

  const handleBackPress = useCallback(() => {
    if (started || showCamera) { setShowExitModal(true); }
    else { navigation.goBack(); }
  }, [started, showCamera, navigation]);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    resetAll();
    setShowCamera(false);
    setCountdown(TOTAL_WAIT);
    setStarted(false);
    navigation.goBack();
  }, [resetAll, navigation]);

  // ─── Permission gate ──────────────────────────────────────────────────────

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff", marginBottom: 12 }}>Camera access required</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={{ color: "#020817", fontWeight: "700" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.statusbar, paddingTop: insets.top }}>

      {/* ════════════════════════════════════════════
          WAIT / TIMER SCREEN
      ════════════════════════════════════════════ */}
      {!showCamera && (
        <View style={{ flex: 1, backgroundColor: colors.bg_home }}>
          <BackButton
            title="Back"
            onPress={handleBackPress}
            arrowColor={colors.white}
            color={colors.white}
            style={{ paddingTop: 30, paddingHorizontal: 20 }}
          />

          <View style={styles.timerContainer}>
            <View style={styles.circleWrapper}>
              <Svg width={C_SIZE} height={C_SIZE}>
                <Circle
                  stroke="#3A4665" fill="none"
                  cx={C_SIZE / 2} cy={C_SIZE / 2} r={C_RADIUS} strokeWidth={C_STROKE}
                />
                <Circle
                  stroke="#4ADE80" fill="none"
                  cx={C_SIZE / 2} cy={C_SIZE / 2} r={C_RADIUS} strokeWidth={C_STROKE}
                  strokeDasharray={C_CIRC} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(90, ${C_SIZE / 2}, ${C_SIZE / 2}) scale(-1, 1) translate(-${C_SIZE}, 0)`}
                />
              </Svg>
              <TouchableOpacity style={styles.circleButton}>
                <Text style={styles.timerText}>{countdown}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.waitText, { marginTop: 20, color: colors.white }]}>
              Please wait for{" "}
              <Text style={{ color: colors.white, fontWeight: "600" }}>60 seconds</Text>
            </Text>
          </View>

          <View style={styles.waitBox}>
            <Text style={styles.waitText}>Scan the card immediately after the timer ends.</Text>
          </View>

          <PrimaryButton
            onPress={() => setStarted(true)}
            title="Start Timer"
            style={[{ bottom: 0, width: "90%", alignSelf: "center", marginBottom: insets.bottom + 20, borderRadius: 6 }]}
            textStyle={{ color: "#fff" }}
            disabled={started}
          />
        </View>
      )}

      {/* ════════════════════════════════════════════
          CAMERA SCREEN
          CameraView stays mounted so sensor stays
          warm during the preview step.
      ════════════════════════════════════════════ */}
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
              flash="off"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={qrLocked ? undefined : onBarcodeScanned}
            />

            {/* Camera overlay (frame + capture button) – hidden during preview */}
            {!previewUri && previewLayout && (
              <CameraOverlay
                layout={previewLayout}
                frameState={frameState}
                visual={visual}
                qrLocked={qrLocked}
                autoCount={0}
                cameraTimeout={0}
                insets={insets}
                onBack={handleBackPress}
                onCapture={handleTakePhoto}
              />
            )}

            {/* Status banner */}
            {/* {!previewUri && (
              <View style={[styles.statusBanner, qrLocked && styles.statusBannerSuccess]}>
                <Text style={styles.statusBannerText} numberOfLines={1}>
                  {qrLocked ? "QR Detected — Tap Take Picture" : "Position card and scan QR code"}
                </Text>
              </View>
            )} */}

            {/* Capturing overlay */}
            {actionLoading && (
              <View style={styles.capturingOverlay}>
                <View style={styles.capturingCard}>
                  <ActivityIndicator color="#1E90FF" />
                  <Text style={styles.capturingText}>Capturing image…</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ════════════════════════════════════════════
          PREVIEW SCREEN
      ════════════════════════════════════════════ */}
      {showCamera && !!previewUri && (
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.previewHeader, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.previewHeaderText}>Preview Image</Text>
          </View>

          <View style={styles.previewImageWrap}>
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          </View>

          <View style={[styles.previewFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnRetake]}
              disabled={previewLoading}
              onPress={handleRetake}
            >
              <Text style={styles.previewBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnContinue]}
              disabled={previewLoading}
              onPress={handleContinue}
            >
              {previewLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.previewBtnText}>Continue</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Full-screen loader while uploading */}
          {previewLoading && (
            <View style={styles.previewLoader}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.previewLoaderText}>
                Please wait{"\n"}Analyzing your urine strip…
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ════════════════════════════════════════════
          TIMING WARNING MODAL  (shown after 120 s)
      ════════════════════════════════════════════ */}
      <Modal visible={showTimingWarning} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Warning!</Text>
            <Text style={styles.warningIcon}>⏱</Text>
            <Text style={styles.warningMessage}>
              The card has been activated for more than{" "}
              <Text style={{ color: "#e53935" }}>120 secs now.</Text>
            </Text>
            <Text style={styles.warningBullet}>• Delay in scanning could cause inaccurate results</Text>
            <Text style={styles.warningBullet}>• We recommend taking the test again with a new card.</Text>
            <TouchableOpacity
              style={[styles.warningActionBtn, { backgroundColor: "#EF3024" }]}
              onPress={() => { setShowTimingWarning(false); navigation.goBack(); }}
            >
              <Text style={styles.warningActionBtnText}>Test with a new card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.warningActionBtn, styles.warningActionBtnOutline]}
              onPress={() => { setShowTimingWarning(false); warningDismissedRef.current = true; }}
            >
              <Text style={[styles.warningActionBtnText, { color: "#1a2340" }]}>Continue with current card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════
          RETAKE WARNING MODAL  (shown on 400 errors)
      ════════════════════════════════════════════ */}
      <Modal visible={showRetakeWarning} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF3024" />
            <Text style={[styles.warningMessage, { color: "#EF3024", marginTop: 8 }]}>
              {retakeErrorMsg}
            </Text>
            <TouchableOpacity
              style={[styles.warningActionBtn, { backgroundColor: "#EF3024" }]}
              onPress={() => { setShowRetakeWarning(false); handleRetake(); }}
            >
              <Text style={styles.warningActionBtnText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════
          EXIT CONFIRMATION
      ════════════════════════════════════════════ */}
      <CommonModal
        visible={showExitModal}
        title="Warning"
        message="Are you sure you want to exit the uACR Test?"
        confirmText="Stay"
        cancelText="Exit"
        onConfirm={() => setShowExitModal(false)}
        onCancel={handleConfirmExit}
        confirmButtonStyle={{ backgroundColor: colors.blue, borderWidth: 1, borderColor: colors.blue }}
        confirmTextStyle={{ color: colors.white }}
        cancelButtonStyle={{ backgroundColor: colors.gray, borderWidth: 1, borderColor: colors.gray }}
        cancelTextStyle={{ color: colors.black }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020817",
  },
  permBtn: {
    backgroundColor: "#008000", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },

  // ── Timer screen
  timerContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 20, backgroundColor: colors.bg_home,
  },
  circleWrapper:  { justifyContent: "center", alignItems: "center" },
  circleButton: {
    position: "absolute", width: 145, height: 145, borderRadius: 72.5,
    justifyContent: "center", alignItems: "center",
  },
  timerText:  { fontSize: 42, fontWeight: "700", color: "#FFFFFF" },
  waitBox: {
    borderColor: "#b6b7b7", borderWidth: 1, width: "90%", padding: 25,
    marginBottom: 30, alignItems: "center", alignSelf: "center",
    borderRadius: 10, backgroundColor: "#f6f7f7",
  },
  waitText: { fontSize: 18, textAlign: "center", color: colors.black },

  // ── Camera screen
  cameraScreen:    { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 1, width: "100%" },

  // Status banner
  statusBanner: {
    position: "absolute", top: 16, alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, zIndex: 30, maxWidth: "80%",
  },
  statusBannerSuccess: { backgroundColor: "rgba(34,197,94,0.88)" },
  statusBannerText:    { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Capturing overlay
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center", alignItems: "center", zIndex: 50,
  },
  capturingCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  capturingText: { fontSize: 14, fontWeight: "500", color: "#000" },

  // ── Preview screen
  previewHeader: {
    backgroundColor: "#0E1833", paddingHorizontal: 20,
    paddingBottom: 12, alignItems: "center",
  },
  previewHeaderText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  previewImageWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "#f1f4ff", padding: 16,
  },
  previewImage: { width: "100%", height: "100%", borderRadius: 8 },

  previewFooter: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 20, paddingTop: 16, backgroundColor: "#fff",
  },
  previewBtn: {
    flex: 1, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  previewBtnRetake:   { backgroundColor: "#555" },
  previewBtnContinue: { backgroundColor: "#EF3024" },
  previewBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  previewLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center", alignItems: "center", gap: 16, zIndex: 20,
  },
  previewLoaderText: {
    color: "#fff", fontSize: 15, fontWeight: "500", textAlign: "center", lineHeight: 22,
  },

  // ── Modals
  modalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  warningCard: {
    backgroundColor: "#dde3f8", borderRadius: 20,
    padding: 28, width: "100%", maxWidth: 360,
    alignItems: "center", gap: 12,
  },
  warningTitle:   { fontSize: 22, fontWeight: "700", color: "#e53935" },
  warningIcon:    { fontSize: 60, lineHeight: 72 },
  warningMessage: { fontSize: 15, fontWeight: "700", color: "#1a2340", textAlign: "center" },
  warningBullet:  { fontSize: 13, color: "#1a2340", alignSelf: "flex-start", lineHeight: 20 },

  warningActionBtn: {
    width: "100%", height: 52, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  warningActionBtnOutline: {
    backgroundColor: "transparent", borderWidth: 1, borderColor: "#1a2340",
  },
  warningActionBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
