/**
 * TimerCameraUploader.tsx
 *
 * Kidney-care urine strip scanner.
 *
 * Flow
 *  1. Wait screen  – 60-second reaction timer with progress ring
 *  2. Camera screen – QR scan → strip align → auto-capture → preview → upload
 *     Camera stays live after every capture; user can retake indefinitely.
 *
 * Frame quality pipeline (runs every 900 ms while QR is locked):
 *   low byte-variance  → BLUR
 *   high mean brightness → REFLECTION
 *   2+ consecutive clean ticks → STABLE → 3-second auto-capture countdown
 *
 * Packages used (no react-native-vision-camera):
 *   expo-camera, expo-image-manipulator,
 *   react-native-svg, react-native-safe-area-context
 */

import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { router, useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import * as ImageManipulator from "expo-image-manipulator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import axiosClient from "../services/axiosClient";
import { colors } from "../../app/shared/commonStyles";
import BackButton from "../../app/shared/BackButton";
import PrimaryButton from "../../app/shared/PrimaryButton";
import CommonModal from "../../app/shared/CommonModel";
import WarningModal from "../../app/shared/WarningModal";
import { useUserStore } from "../../app/stores/userStore";

// ─── Layout constants ────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get("window");
const STRIP_WIDTH        = SW * 0.28;
const STRIP_HEIGHT_RAW   = STRIP_WIDTH * 5;          // 5:1 ratio (10 cm : 2 cm)
const STRIP_HEIGHT       = Math.min(STRIP_HEIGHT_RAW, SH * 0.68);
const FRAME_TOP_OFFSET   = 50;

// ─── Timing constants ────────────────────────────────────────────────────────

const TOTAL_WAIT         = 60;   // seconds before camera opens
const CAMERA_TIMEOUT     = 60;   // seconds on camera before accuracy warning
const AUTO_CAPTURE_DELAY = 3;    // stable-frame countdown before shutter fires
const ANALYSIS_INTERVAL  = 900;  // ms between probe frames
const STABLE_TICKS_NEEDED = 2;   // consecutive clean ticks to reach STABLE

// ─── Frame state machine ─────────────────────────────────────────────────────

type FrameState =
  | "IDLE"         // camera just opened, waiting for QR
  | "STRIP_ALIGN"  // QR locked – user aligning strip
  | "BLUR"         // strip detected but blurry
  | "REFLECTION"   // strip detected but overexposed
  | "STABLE"       // strip clean – auto-capture counting down
  | "CAPTURING";   // shutter in progress

interface FrameVisual {
  color: string;
  label: string;
}

const FRAME_VISUAL: Record<FrameState, FrameVisual> = {
  IDLE:        { color: "#F59E0B", label: "Scan QR code on strip card"           },
  STRIP_ALIGN: { color: "#38BDF8", label: "Align strip inside the frame"         },
  BLUR:        { color: "#F87171", label: "Image blurry – hold steady"           },
  REFLECTION:  { color: "#FB923C", label: "Reflection detected – adjust angle"   },
  STABLE:      { color: "#4ADE80", label: "Strip detected – hold still"          },
  CAPTURING:   { color: "#FFFFFF", label: "Capturing…"                           },
};

// ─── Timer-circle constants ───────────────────────────────────────────────────

const C_SIZE   = 180;
const C_STROKE = 16;
const C_RADIUS = (C_SIZE - C_STROKE) / 2;
const C_CIRC   = 2 * Math.PI * C_RADIUS;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lightweight frame-quality check on a base64-encoded JPEG. */
function analyseFrameQuality(b64: string): "ok" | "blur" | "reflection" {
  try {
    // Sample bytes from the middle of the image
    const slice = b64.slice(1000, 6000);
    const bytes = atob(slice).split("").map((c) => c.charCodeAt(0));
    if (bytes.length === 0) return "ok";
    const mean     = bytes.reduce((a, b) => a + b, 0) / bytes.length;
    const variance = bytes.reduce((a, b) => a + (b - mean) ** 2, 0) / bytes.length;
    if (variance < 180) return "blur";       // too uniform → blurry
    if (mean    > 220)  return "reflection"; // too bright  → overexposed
    return "ok";
  } catch {
    return "ok";
  }
}

/** Map raw API error to a human-readable string. */
function parseApiError(error: any): string {
  const detail = error?.response?.data?.detail;
  if (!detail) return "Something went wrong. Please wait and try again.";
  try {
    if (Array.isArray(detail))       return detail.map((d: any) => d.msg).join(", ");
    if (typeof detail === "string") {
      try { const p = JSON.parse(detail); return p?.detail || p?.message || detail; }
      catch { return detail; }
    }
    return detail?.detail || detail?.message || "Unknown error";
  } catch {
    return "Something went wrong. Please wait and try again.";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated glow dot shown next to the status label. */
function GlowDot({ color }: { color: string }) {
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
  return <Animated.View style={[styles.statusDot, { backgroundColor: color, opacity }]} />;
}

/** Four corner brackets around the strip frame. */
function CornerBrackets({ color }: { color: string }) {
  const positions = [
    { top: -2,    left:  -2 },
    { top: -2,    right: -2 },
    { bottom: -2, left:  -2 },
    { bottom: -2, right: -2 },
  ] as const;
  return (
    <>
      {positions.map((pos, i) => (
        <View key={i} style={[styles.corner, pos, { borderColor: color }]} />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TimerCameraUploader2() {

  // ── External context
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const user       = useUserStore((s) => s.user);
  const patient    = useUserStore((s) => s.patient);
  const userType   = useUserStore((s) => s.user?.userType);

  // ── Camera permission
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => { if (!permission?.granted) requestPermission(); }, []);

  // ── Screen phase
  const [phase, setPhase] = useState<"WAIT" | "CAMERA">("WAIT");

  // ── Wait-screen state
  const [waitStarted,   setWaitStarted]   = useState(false);
  const [waitCountdown, setWaitCountdown] = useState(TOTAL_WAIT);

  // ── Camera-screen state
  const [cameraTimeout, setCameraTimeout] = useState(CAMERA_TIMEOUT);
  const [qrData,        setQrData]        = useState<string | null>(null);
  const [qrLocked,      setQrLocked]      = useState(false);
  const [frameState,    setFrameState]    = useState<FrameState>("IDLE");
  const [autoCount,     setAutoCount]     = useState(AUTO_CAPTURE_DELAY);
  const [previewUri,    setPreviewUri]    = useState<string | null>(null);

  // ── Modal state
  const [showExitModal,     setShowExitModal]     = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [showResultModal,   setShowResultModal]   = useState(false);
  const [uploading,         setUploading]         = useState(false);
  const [resultStatus, setResultStatus] = useState<{
    message: string; type: "success" | "error";
  } | null>(null);

  // ── Refs that must never trigger re-renders
  const cameraRef       = useRef<CameraView | null>(null);
  const layoutRef       = useRef<{ width: number; height: number } | null>(null);
  const stableTicksRef  = useRef(0);
  const capturingRef    = useRef(false);   // prevents concurrent capture calls
  const analysisRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── Derived ─────────────────────────────────────────────────────────────

  const visual = FRAME_VISUAL[frameState];
  const strokeDashoffset = C_CIRC - C_CIRC * (waitCountdown / TOTAL_WAIT);

  // ─── Wait countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!waitStarted || waitCountdown === 0) return;
    const t = setTimeout(() => setWaitCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [waitStarted, waitCountdown]);

  useEffect(() => {
    if (waitStarted && waitCountdown === 0) {
      setWaitStarted(false);
      setPhase("CAMERA");
    }
  }, [waitStarted, waitCountdown]);

  // ─── Camera timeout → accuracy warning ───────────────────────────────────

  useEffect(() => {
    if (phase !== "CAMERA" || previewUri) return;
    if (cameraTimeout === 0) { setShowAccuracyModal(true); return; }
    const t = setTimeout(() => setCameraTimeout((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, cameraTimeout, previewUri]);

  // ─── Pulse animation (only when STABLE) ──────────────────────────────────

  useEffect(() => {
    if (frameState !== "STABLE") {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [frameState]);

  // ─── Frame analysis loop ──────────────────────────────────────────────────
  //
  // Starts when QR is locked and camera is visible.
  // Restarts whenever qrLocked changes (e.g. after a retake).
  // The interval reads the LATEST frameState via a ref to avoid stale closures.

  const frameStateRef = useRef<FrameState>("IDLE");
  useEffect(() => { frameStateRef.current = frameState; }, [frameState]);

  const stopAnalysis = useCallback(() => {
    if (analysisRef.current) {
      clearInterval(analysisRef.current);
      analysisRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase !== "CAMERA" || !qrLocked || previewUri) {
      stopAnalysis();
      return;
    }

    // Start fresh interval
    stopAnalysis();
    analysisRef.current = setInterval(async () => {
      // Skip if we're in the middle of a full capture
      if (capturingRef.current) return;
      if (!cameraRef.current)   return;

      try {
        const probe = await cameraRef.current.takePictureAsync({
          quality:         0.08,
          skipProcessing:  true,
          base64:          true,
          exif:            false,
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

        // Clean frame
        stableTicksRef.current += 1;
        if (stableTicksRef.current >= STABLE_TICKS_NEEDED) {
          setFrameState("STABLE");
        } else {
          setFrameState("STRIP_ALIGN");
        }
      } catch {
        // Camera momentarily busy – ignore this tick
      }
    }, ANALYSIS_INTERVAL);

    return stopAnalysis;
  }, [phase, qrLocked, previewUri]);

  // ─── Auto-capture countdown ───────────────────────────────────────────────
  //
  // Resets whenever we leave STABLE. Fires triggerCapture at 0.

  useEffect(() => {
    if (frameState !== "STABLE") {
      setAutoCount(AUTO_CAPTURE_DELAY);
      return;
    }
    if (autoCount === 0) {
      triggerCapture();
      return;
    }
    const t = setTimeout(() => setAutoCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [frameState, autoCount]);

  // ─── QR scanned ───────────────────────────────────────────────────────────

  const onBarcodeScanned = useCallback(
    ({ data, type }: BarcodeScanningResult) => {
      if (qrLocked || type !== "qr") return;
      setQrLocked(true);
      setQrData(data);
      setFrameState("STRIP_ALIGN");
      stableTicksRef.current = 0;
    },
    [qrLocked]
  );

  // ─── Capture ──────────────────────────────────────────────────────────────

  const triggerCapture = useCallback(async () => {
    if (capturingRef.current)   return;
    if (!cameraRef.current)     return;
    if (!layoutRef.current)     return;

    capturingRef.current = true;
    setFrameState("CAPTURING");

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality:        1,
        skipProcessing: true,
        base64:         false,
      });
      const cropped = await cropToStripFrame(photo, layoutRef.current);
      setPreviewUri(cropped.uri);
      // Frame analysis pauses while preview is shown (see analysis useEffect).
    } catch (e) {
      console.error("Capture error:", e);
    } finally {
      capturingRef.current = false;
      // If capture failed, return to STRIP_ALIGN so analysis resumes
      setFrameState((prev) => (prev === "CAPTURING" ? "STRIP_ALIGN" : prev));
    }
  }, []);

  const handleManualCapture = useCallback(() => {
    if (capturingRef.current || frameState === "CAPTURING") return;
    triggerCapture();
  }, [frameState, triggerCapture]);

  // ─── Retake: dismiss preview, resume analysis ─────────────────────────────

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
    // Reset stable state so analysis restarts cleanly
    stableTicksRef.current = 0;
    setFrameState("STRIP_ALIGN");
    setAutoCount(AUTO_CAPTURE_DELAY);
    // Analysis useEffect will re-fire because previewUri changed to null
  }, []);

  // ─── Crop utility ─────────────────────────────────────────────────────────

  const cropToStripFrame = async (
    photo: any,
    layout: { width: number; height: number }
  ) => {
    const { width: pW, height: pH } = layout;
    const { width: iW, height: iH } = photo;

    const previewAspect = pW / pH;
    const imageAspect   = iW / iH;

    let scaleX: number, scaleY: number, offsetX = 0, offsetY = 0;
    if (imageAspect > previewAspect) {
      scaleY = iH / pH; scaleX = scaleY; offsetX = (iW - pW * scaleX) / 2;
    } else {
      scaleX = iW / pW; scaleY = scaleX; offsetY = (iH - pH * scaleY) / 2;
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
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    setShowResultModal(true);
    setResultStatus(null);
    try {
      const formData = new FormData();
      formData.append("image",      { uri, name: "urine_test.jpg", type: "image/jpeg" } as any);
      formData.append("email_id",   user?.userEmail            || "test");
      formData.append("qr_code",    qrData                     || "");
      formData.append("role",       userType                   || "patient");
      formData.append("hw_id",      user?.userId               || "unknown");
      formData.append("patient_id", patient?.patient_id?.toString() || "null");

      const response = await axiosClient.post("/users/process-test", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResultStatus({ message: "Successfully Completed", type: "success" });
      router.replace({
        pathname: "/components/test-result",
        params: {
          result:   JSON.stringify(response),
          refresh:  "true",
          patient:  JSON.stringify(patient),
        },
      });
    } catch (error: any) {
      setResultStatus({ message: parseApiError(error), type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // ─── Reset helpers ────────────────────────────────────────────────────────

  /** Full reset back to wait screen. */
  const resetAll = useCallback(() => {
    stopAnalysis();
    capturingRef.current  = false;
    stableTicksRef.current = 0;
    setPhase("WAIT");
    setWaitStarted(false);
    setWaitCountdown(TOTAL_WAIT);
    setCameraTimeout(CAMERA_TIMEOUT);
    setQrData(null);
    setQrLocked(false);
    setFrameState("IDLE");
    setAutoCount(AUTO_CAPTURE_DELAY);
    setPreviewUri(null);
    setShowResultModal(false);
    setResultStatus(null);
  }, [stopAnalysis]);

  /** Reset only camera state so user can retake after an upload error. */
  const resetCameraOnly = useCallback(() => {
    capturingRef.current  = false;
    stableTicksRef.current = 0;
    setQrData(null);
    setQrLocked(false);
    setFrameState("IDLE");
    setAutoCount(AUTO_CAPTURE_DELAY);
    setPreviewUri(null);
    setShowResultModal(false);
    setResultStatus(null);
    setCameraTimeout(CAMERA_TIMEOUT);
  }, []);

  const handleBack = useCallback(() => {
    const active = waitStarted || (phase === "CAMERA" && !previewUri);
    if (active) { setShowExitModal(true); return; }
    navigation.goBack();
  }, [waitStarted, phase, previewUri, navigation]);

  // ─── Permission gate ──────────────────────────────────────────────────────

  if (!permission?.granted) {
    return (
      <View style={[styles.root, styles.centred, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="camera-lock" size={64} color="#38BDF8" />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ═══════════════════════════════════════════════════
          WAIT SCREEN
      ═══════════════════════════════════════════════════ */}
      {phase === "WAIT" && (
        <View style={styles.waitScreen}>
          <BackButton
            title="Back" onPress={handleBack}
            arrowColor="#fff" color="#fff"
            style={{ paddingTop: 24, paddingHorizontal: 20 }}
          />

          <View style={styles.waitBody}>
            {/* Header */}
            <View style={styles.row}>
              <MaterialCommunityIcons name="test-tube" size={26} color="#38BDF8" />
              <Text style={styles.screenTitle}>Urine Strip Analysis</Text>
            </View>

            {/* Timer ring */}
            <View style={styles.ringWrapper}>
              <Svg width={C_SIZE} height={C_SIZE}>
                <Defs>
                  <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%"   stopColor="#38BDF8" />
                    <Stop offset="100%" stopColor="#4ADE80" />
                  </LinearGradient>
                </Defs>
                <Circle stroke="#1E2D45" fill="none"
                  cx={C_SIZE / 2} cy={C_SIZE / 2} r={C_RADIUS} strokeWidth={C_STROKE} />
                <Circle stroke="url(#grad)" fill="none"
                  cx={C_SIZE / 2} cy={C_SIZE / 2} r={C_RADIUS} strokeWidth={C_STROKE}
                  strokeDasharray={C_CIRC} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" rotation="270"
                  origin={`${C_SIZE / 2}, ${C_SIZE / 2}`} />
              </Svg>
              <View style={styles.ringInner}>
                <Text style={styles.ringNum}>{waitCountdown}</Text>
                <Text style={styles.ringSub}>seconds</Text>
              </View>
            </View>

            {/* Steps */}
            <View style={styles.stepCard}>
              {STEPS.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[
                    styles.stepIcon,
                    { opacity: waitStarted && i > 0 ? 0.35 : 1 },
                  ]}>
                    <MaterialCommunityIcons name={step.icon as any} size={18} color="#38BDF8" />
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <PrimaryButton
            onPress={() => setWaitStarted(true)}
            title={waitStarted ? "Timer Running…" : "Start Timer"}
            disabled={waitStarted}
            style={[styles.startBtn, { marginBottom: insets.bottom + 20 }]}
            textStyle={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
          />
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          CAMERA SCREEN  (stays mounted even during preview)
      ═══════════════════════════════════════════════════ */}
      {phase === "CAMERA" && (
        <View style={styles.cameraScreen}>
          <View
            style={StyleSheet.absoluteFill}
            onLayout={(e) => { layoutRef.current = e.nativeEvent.layout; }}
          >
            {/* Live camera – always mounted so it stays warm */}
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={qrLocked ? undefined : onBarcodeScanned}
            />

            {/* Overlay – hidden during preview to avoid visual flash */}
            {!previewUri && layoutRef.current && (
              <CameraOverlay
                layout={layoutRef.current}
                frameState={frameState}
                visual={visual}
                qrLocked={qrLocked}
                autoCount={autoCount}
                cameraTimeout={cameraTimeout}
                pulseAnim={pulseAnim}
                insets={insets}
                onBack={handleBack}
                onCapture={handleManualCapture}
              />
            )}
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          PREVIEW SHEET  (slide-up over camera)
      ═══════════════════════════════════════════════════ */}
      <Modal transparent visible={!!previewUri} animationType="slide">
        <View style={styles.previewOverlay}>
          <View style={[styles.previewSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.previewTitle}>Review Strip Image</Text>
            <Text style={styles.previewSub}>
              Verify the strip is sharp and fully inside the frame.
            </Text>
            <Image
              source={{ uri: previewUri! }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <View style={styles.qualityRow}>
              {QUALITY_HINTS.map((h, i) => (
                <View key={i} style={styles.qualityHint}>
                  <MaterialCommunityIcons name={h.icon as any} size={15} color={h.color} />
                  <Text style={[styles.qualityText, { color: h.color }]}>{h.text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                <Ionicons name="refresh" size={18} color="#94A3B8" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => {
                  const uri = previewUri!;
                  setPreviewUri(null);
                  uploadPhoto(uri);
                }}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#050E1A" />
                <Text style={styles.uploadBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          RESULT MODAL
      ═══════════════════════════════════════════════════ */}
      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={[styles.centred, { flex: 1, backgroundColor: "rgba(0,0,0,0.88)" }]}>
          <View style={styles.resultBox}>
            {uploading && (
              <>
                <ActivityIndicator size="large" color="#38BDF8" style={{ marginBottom: 16 }} />
                <Text style={styles.resultTitle}>Analysing…</Text>
                <Text style={styles.resultSub}>Please keep the app open.</Text>
              </>
            )}

            {!uploading && resultStatus?.type === "success" && (
              <>
                <View style={[styles.resultIcon, { borderColor: "#4ADE80" }]}>
                  <Ionicons name="checkmark" size={36} color="#4ADE80" />
                </View>
                <Text style={[styles.resultTitle, { color: "#4ADE80" }]}>Test Complete</Text>
                <Text style={styles.resultSub}>Your results are being processed.</Text>
              </>
            )}

            {!uploading && resultStatus?.type === "error" && (
              <>
                <View style={[styles.resultIcon, { borderColor: "#F87171" }]}>
                  <Ionicons name="warning-outline" size={36} color="#F87171" />
                </View>
                <Text style={[styles.resultTitle, { color: "#F87171" }]}>Upload Failed</Text>
                <Text style={styles.resultSub}>{resultStatus.message}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={resetCameraOnly}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          EXIT CONFIRMATION
      ═══════════════════════════════════════════════════ */}
      <CommonModal
        visible={showExitModal}
        title="Exit Test?"
        message="Progress will be lost. Are you sure you want to exit?"
        confirmText="Stay"
        cancelText="Exit"
        onConfirm={() => setShowExitModal(false)}
        onCancel={() => { setShowExitModal(false); resetAll(); navigation.goBack(); }}
        confirmButtonStyle={{ backgroundColor: colors.blue }}
        confirmTextStyle={{ color: "#fff" }}
        cancelButtonStyle={{ backgroundColor: "#334155" }}
        cancelTextStyle={{ color: "#fff" }}
      />

      {/* ═══════════════════════════════════════════════════
          ACCURACY WARNING
      ═══════════════════════════════════════════════════ */}
      <WarningModal
        visible={showAccuracyModal}
        onRetry={() => { setShowAccuracyModal(false); resetAll(); }}
        onContinue={() => { setShowAccuracyModal(false); setCameraTimeout(CAMERA_TIMEOUT); }}
      />
    </View>
  );
}

// ─── CameraOverlay (pure display component) ───────────────────────────────────

interface OverlayProps {
  layout:        { width: number; height: number };
  frameState:    FrameState;
  visual:        FrameVisual;
  qrLocked:      boolean;
  autoCount:     number;
  cameraTimeout: number;
  pulseAnim:     Animated.Value;
  insets:        { bottom: number };
  onBack:        () => void;
  onCapture:     () => void;
}

function CameraOverlay({
  layout, frameState, visual, qrLocked,
  autoCount, cameraTimeout, pulseAnim,
  insets, onBack, onCapture,
}: OverlayProps) {
  const fL = (layout.width  - STRIP_WIDTH)  / 2;
  const fT = (layout.height - STRIP_HEIGHT) / 2 - FRAME_TOP_OFFSET;
  const isCapturing = frameState === "CAPTURING";
  const canCapture  = qrLocked && !isCapturing;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dark masks */}
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: fT }]} />
      <View style={[styles.mask, { top: fT + STRIP_HEIGHT, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.mask, { top: fT, left: 0,  width: fL, height: STRIP_HEIGHT }]} />
      <View style={[styles.mask, { top: fT, right: 0, width: fL, height: STRIP_HEIGHT }]} />

      {/* Strip frame */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stripFrame,
          {
            top: fT, left: fL,
            width: STRIP_WIDTH, height: STRIP_HEIGHT,
            borderColor: visual.color,
            shadowColor: visual.color,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <CornerBrackets color={visual.color} />
        {frameState === "STABLE" && (
          <View style={styles.autoChip}>
            <Text style={styles.autoChipText}>Auto-capture in {autoCount}s</Text>
          </View>
        )}
      </Animated.View>

      {/* Status label */}
      <View
        pointerEvents="none"
        style={[styles.statusRow, { top: fT + STRIP_HEIGHT + 14 }]}
      >
        <GlowDot color={visual.color} />
        <Text style={[styles.statusText, { color: visual.color }]}>{visual.label}</Text>
      </View>

      {/* HUD chips */}
      <View style={styles.hudLeft} pointerEvents="none">
        <Ionicons name="time-outline" size={13} color="#94A3B8" />
        <Text style={styles.hudText}>{cameraTimeout}s</Text>
      </View>
      {/* {qrLocked && (
        <View style={styles.hudRight} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={13} color="#4ADE80" />
          <Text style={[styles.hudText, { color: "#4ADE80" }]}>QR Locked</Text>
        </View>
      )} */}

      {/* Back button */}
      <BackButton
        title="Back" onPress={onBack}
        arrowColor="#fff" color="#fff"
        style={{ position: "absolute", top: 28, left: 16, zIndex: 30 }}
      />

      {/* Capture button */}
      <View style={[styles.captureRow, { bottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[
            styles.captureBtn,
            { backgroundColor: canCapture ? visual.color : "#334155" },
          ]}
          disabled={!canCapture}
          onPress={onCapture}
          activeOpacity={0.8}
        >
          {isCapturing
            ? <ActivityIndicator color="#fff" />
            : <MaterialCommunityIcons name="camera-iris" size={30} color={canCapture ? "#050E1A" : "#64748B"} />
          }
        </TouchableOpacity>
        <Text style={styles.captureBtnLabel}>
          {!qrLocked ? "Scan QR first" : frameState === "STABLE" ? "Tap or wait" : "Manual capture"}
        </Text>
      </View>
    </View>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const STEPS = [
  { icon: "timer-outline",              text: "Wait 60 seconds for the reaction" },
  { icon: "qrcode-scan",                text: "Scan QR code on the strip card"   },
  { icon: "image-filter-center-focus",  text: "Align strip inside the frame"     },
  { icon: "camera-iris",                text: "Auto-capture fires when stable"    },
];

const QUALITY_HINTS = [
  { icon: "check-circle-outline", color: "#4ADE80", text: "Strip visible"    },
  { icon: "check-circle-outline", color: "#4ADE80", text: "QR scanned"       },
  { icon: "alert-circle-outline", color: "#F59E0B", text: "Verify sharpness" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#050E1A" },
  centred: { justifyContent: "center", alignItems: "center" },

  // Permission
  permissionText:    { color: "#94A3B8", fontSize: 16, textAlign: "center", maxWidth: 260, marginTop: 16 },
  permissionBtn:     { marginTop: 20, backgroundColor: "#38BDF8", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10 },
  permissionBtnText: { color: "#050E1A", fontWeight: "700" },

  // Wait screen
  waitScreen: { flex: 1, backgroundColor: "#050E1A" },
  waitBody:   { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 12, gap: 24 },
  row:        { flexDirection: "row", alignItems: "center", gap: 10 },
  screenTitle: { color: "#E2E8F0", fontSize: 20, fontWeight: "700", letterSpacing: 0.4 },

  ringWrapper: { justifyContent: "center", alignItems: "center" },
  ringInner:   { position: "absolute", alignItems: "center" },
  ringNum:     { color: "#F1F5F9", fontSize: 48, fontWeight: "800", letterSpacing: -2 },
  ringSub:     { color: "#64748B", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginTop: -4 },

  stepCard: {
    width: "100%", backgroundColor: "#0F1E30",
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#1E3A52", gap: 14,
  },
  stepRow:  { flexDirection: "row", alignItems: "center", gap: 14 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#0D2035", borderWidth: 1, borderColor: "#1E3A52",
    justifyContent: "center", alignItems: "center",
  },
  stepText: { color: "#94A3B8", fontSize: 14, flex: 1, lineHeight: 20 },

  startBtn: { marginHorizontal: 24, borderRadius: 14, paddingVertical: 16, backgroundColor: "#38BDF8" },

  // Camera
  cameraScreen: { flex: 1, backgroundColor: "#000" },
  mask: { position: "absolute", backgroundColor: "rgba(5,14,26,0.72)" },

  // Strip frame
  stripFrame: {
    position: "absolute",
    borderWidth: 2, borderRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 14,
    elevation: 10, backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 18, height: 18,
    borderWidth: 3, borderRadius: 3,
  },
  autoChip: {
    position: "absolute", bottom: -34, alignSelf: "center",
    backgroundColor: "#4ADE8018", borderColor: "#4ADE80",
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  autoChipText: { color: "#4ADE80", fontSize: 12, fontWeight: "600" },

  // Status label
  statusRow: {
    position: "absolute", left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },

  // HUD chips
  hudLeft: {
    position: "absolute", top: 80, left: 16,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(15,30,48,0.85)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#1E3A52",
  },
  hudRight: {
    position: "absolute", top: 80, right: 16,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#0F3020", borderColor: "#4ADE80",
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  hudText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },

  // Capture button
  captureRow: {
    position: "absolute", left: 0, right: 0,
    alignItems: "center", gap: 8,
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  captureBtnLabel: { color: "#64748B", fontSize: 12, letterSpacing: 0.3 },

  // Preview sheet
  previewOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", justifyContent: "flex-end" },
  previewSheet: {
    backgroundColor: "#0A1628",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1, borderColor: "#1E3A52",
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: "#334155",
    borderRadius: 2, alignSelf: "center", marginBottom: 20,
  },
  previewTitle: { color: "#E2E8F0", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  previewSub:   { color: "#64748B", fontSize: 13, marginBottom: 16, lineHeight: 18 },
  previewImage: {
    width: "100%", height: 360, borderRadius: 12,
    backgroundColor: "#0F1E30", marginBottom: 14,
  },
  qualityRow:  { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  qualityHint: { flexDirection: "row", alignItems: "center", gap: 5 },
  qualityText: { fontSize: 12, fontWeight: "600" },
  previewActions: { flexDirection: "row", gap: 12 },
  retakeBtn: {
    flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#1E2D45", borderWidth: 1, borderColor: "#334155",
  },
  retakeBtnText: { color: "#94A3B8", fontWeight: "600", fontSize: 15 },
  uploadBtn: {
    flex: 1.6, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: "#38BDF8",
  },
  uploadBtnText: { color: "#050E1A", fontWeight: "700", fontSize: 15 },

  // Result modal
  resultBox: {
    width: "86%", backgroundColor: "#0A1628",
    borderRadius: 20, padding: 32, alignItems: "center",
    borderWidth: 1, borderColor: "#1E3A52",
  },
  resultIcon: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  resultTitle: { color: "#E2E8F0", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  resultSub:   { color: "#64748B", fontSize: 14, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  retryBtn: {
    marginTop: 24, backgroundColor: "#1E2D45",
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 10, borderWidth: 1, borderColor: "#334155",
  },
  retryBtnText: { color: "#94A3B8", fontWeight: "600" },
});