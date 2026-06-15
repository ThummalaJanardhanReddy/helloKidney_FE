import React from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EdgeInsets } from "react-native-safe-area-context";

import {
  STRIP_WIDTH,
  STRIP_HEIGHT,
  FRAME_TOP_OFFSET,
  FrameState,
  FrameVisual,
} from "./constants";
import { GlowDot, CornerBrackets } from "./Atoms";
import BackButton from "../../shared/BackButton";
import { colors } from "@/app/shared/commonStyles";
import PrimaryButton from "@/app/shared/PrimaryButton";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CameraOverlayProps {
  layout: { width: number; height: number };
  frameState: FrameState;
  visual?: FrameVisual;
  qrLocked: boolean;
  autoCount: number;
  cameraTimeout: number;
  insets: EdgeInsets;
  onBack: () => void;
  onCapture: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CameraOverlay({
  layout,
  frameState,
  visual,
  qrLocked,
  autoCount,
  cameraTimeout,
  insets,
  onBack,
  onCapture,
}: CameraOverlayProps) {
  const fL = (layout.width - STRIP_WIDTH) / 2;
  const fT = (layout.height - STRIP_HEIGHT) / 2 - FRAME_TOP_OFFSET;

  const isCapturing = frameState === "CAPTURING";
  const canCapture = qrLocked && !isCapturing;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* ── Dark masks around the frame ── */}
      <View style={[s.mask, { top: 0, left: 0, right: 0, height: fT }]} />
      <View
        style={[
          s.mask,
          { top: fT + STRIP_HEIGHT, left: 0, right: 0, bottom: 0 },
        ]}
      />
      <View
        style={[s.mask, { top: fT, left: 0, width: fL, height: STRIP_HEIGHT }]}
      />
      <View
        style={[s.mask, { top: fT, right: 0, width: fL, height: STRIP_HEIGHT }]}
      />

      {/* ── Animated strip frame ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.stripFrame,
          {
            top: fT,
            left: fL,
            width: STRIP_WIDTH,
            height: STRIP_HEIGHT,
            borderColor: visual?.color,
            shadowColor: visual?.color,
          },
        ]}
      >
        <CornerBrackets color={visual?.color || colors.gray} />

        {frameState === "STABLE" && (
          <View style={s.autoChip}>
            <Text style={s.autoChipText}>Auto-capture in {autoCount}s</Text>
          </View>
        )}
      </Animated.View>

      {/* ── Status label below frame ── */}
      <View pointerEvents="none" style={[s.statusRow, { top: fT - 50 }]}>
        <GlowDot color={visual?.color || colors.gray} />
        <Text style={[s.statusText, { color: visual?.color }]}>
          {visual?.label}
        </Text>
      </View>

      {/* ── HUD: camera timeout (top-left) ── */}
      {cameraTimeout > 0 && (
        <View style={s.hudLeft} pointerEvents="none">
          <Ionicons name="time-outline" size={13} color="#b6b7b7" />
          <Text style={s.hudText}>{cameraTimeout}s</Text>
        </View>
      )}

      {/* ── HUD: QR locked badge (top-right) ── */}
      {/* {qrLocked && (
        <View style={s.hudRight} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={13} color="#4ADE80" />
          <Text style={[s.hudText, { color: "#4ADE80" }]}>QR Locked</Text>
        </View>
      )} */}

      {/* ── Back button ── */}
      <BackButton
        title="Back"
        onPress={onBack}
        arrowColor="#fff"
        color="#fff"
        style={{ position: "absolute", top: 28, left: 16, zIndex: 30 }}
      />

      {/* ── Manual capture button ── */}
      <View style={[s.captureRow, { bottom: insets.bottom + 20 }]}>
        {/* <TouchableOpacity
          style={[
            s.captureBtn,
            { backgroundColor: canCapture ? visual?.color : "gray" },
          ]}
          disabled={!canCapture}
          onPress={onCapture}
          activeOpacity={0.8}
        >
          {isCapturing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <MaterialCommunityIcons
              name="camera-iris"
              size={30}
              color="#fff"
            />
           
          )} */}

        {/* </TouchableOpacity> */}
        <PrimaryButton
          title="Take Photo"
          onPress={onCapture}
          disabled={!canCapture}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            width: 140,
            backgroundColor: canCapture ? colors.blue : colors.gray,
          }}
          textStyle={{ fontSize: 14, fontWeight: "600", color: canCapture ? colors.white : "#ddd" }}
        />
        {/* <Text style={s.captureBtnLabel}>
          {!qrLocked
            ? "Scan QR first"
            : frameState === "STABLE"
            ? "Tap or wait"
            : "Manual capture"}
        </Text> */}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  mask: {
    position: "absolute",
    backgroundColor: colors.black + "90",
  },

  stripFrame: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 18,
    backgroundColor: "transparent",
    // shadowOffset:    { width: 0, height: 0 },
    // shadowOpacity:   0.8,
    // shadowRadius:    2,
    // elevation:       2,
  },

  autoChip: {
    position: "absolute",
    top: -32,
    alignSelf: "center",
    backgroundColor: "#4ADE8020",
    borderColor: colors.white,
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: 160,
  },
  autoChipText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  statusRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  statusText: { fontSize: 13, fontWeight: "600" },

  hudLeft: {
    position: "absolute",
    top: 80,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#b6b7b7",
  },
  hudRight: {
    position: "absolute",
    top: 80,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "#4ADE80",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hudText: { color: "#b6b7b7", fontSize: 12, fontWeight: "600" },

  captureRow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  captureBtnLabel: { color: "#fff", fontSize: 12, letterSpacing: 0.3 },
});
