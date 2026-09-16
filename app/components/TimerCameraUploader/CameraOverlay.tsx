import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EdgeInsets } from "react-native-safe-area-context";

import {
  STRIP_WIDTH,
  STRIP_HEIGHT,
  getStripBoxPosition,
  FrameState,
  FrameVisual,
} from "./constants";
import { CornerBrackets } from "./Atoms";
import BackButton from "../../shared/BackButton";
import { colors } from "@/app/shared/commonStyles";
import PrimaryButton from "@/app/shared/PrimaryButton";

// ─── Props ────────────────────────────────────────────────────────────────────

export type MessageTone = "idle" | "success" | "error";

interface CameraOverlayProps {
  layout: { width: number; height: number };
  frameState: FrameState;
  visual?: FrameVisual;
  message: string;
  messageTone: MessageTone;
  captureLabel: string;
  captureDisabled: boolean;
  cameraTimeout: number;
  insets: EdgeInsets;
  onBack: () => void;
  onCapture: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Mirrors the Ionic page's single status-banner (.status-banner /
// .banner-success / .banner-error in uacr-scan-card.page.scss) — one message
// surface for QR-through-contrast feedback, live and post-capture alike —
// plus the dotted strip guide (overlay-canvas) and the take-picture-fab,
// whose label/handler the parent swaps to "Retake" during a failed
// post-capture quality gate rather than hiding the whole overlay.

export function CameraOverlay({
  layout,
  frameState,
  visual,
  message,
  messageTone,
  captureLabel,
  captureDisabled,
  cameraTimeout,
  insets,
  onBack,
  onCapture,
}: CameraOverlayProps) {
  const { left: fL, top: fT } = getStripBoxPosition(layout.width, layout.height);

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
      </Animated.View>

      {/* ── Status banner — sits right below the "Capture Image" header.
          NOTE: no insets.top here — this component already renders inside a
          container the screen root already padded by insets.top once, so
          adding it again (like the old code did) pushed the banner down an
          extra insets.top and into the dotted box. Same coordinate space as
          screenTitle/BackButton below, which don't add insets.top either. ── */}
      <View
        pointerEvents="none"
        style={[s.banner, s[`banner_${messageTone}`], { top: 64 }]}
      >
        <Text style={s.bannerText}>{message}</Text>
      </View>

      {/* ── HUD: camera timeout (top-left) ── */}
      {cameraTimeout > 0 && (
        <View style={s.hudLeft} pointerEvents="none">
          <Ionicons name="time-outline" size={13} color="#b6b7b7" />
          <Text style={s.hudText}>{cameraTimeout}s</Text>
        </View>
      )}

      {/* ── Back button ── */}
      <BackButton
        title="Back"
        onPress={onBack}
        arrowColor="#fff"
        color="#fff"
        style={{ position: "absolute", top: 28, left: 16, zIndex: 30 }}
      />

      {/* ── Title (matches Ionic's "Capture Image" toolbar title) ── */}
      <Text style={s.screenTitle} pointerEvents="none">
        Capture Image
      </Text>

      {/* ── Capture / Retake button — same position, label+handler swapped by parent ── */}
      <View style={[s.captureRow, { bottom: insets.bottom + 20 }]}>
        <PrimaryButton
          title={captureLabel}
          onPress={onCapture}
          disabled={captureDisabled}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 30,
            width: 200,
            height: 52,
            backgroundColor: captureDisabled ? colors.gray : colors.primary,
          }}
          textStyle={{ fontSize: 16, fontWeight: "600", color: captureDisabled ? "#ddd" : colors.white }}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screenTitle: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    zIndex: 20,
  },
  mask: {
    position: "absolute",
    backgroundColor: colors.black + "90",
  },

  stripFrame: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 18,
    backgroundColor: "transparent",
  },

  // Matches .status-banner / .banner-success / .banner-error 1:1
  banner: {
    position: "absolute",
    left: 20,
    right: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    zIndex: 20,
  },
  banner_idle: { backgroundColor: "rgba(0,0,0,0.78)" },
  banner_success: { backgroundColor: "rgba(76,175,80,0.9)" },
  banner_error: { backgroundColor: "rgba(200,50,50,0.88)" },
  bannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

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
  hudText: { color: "#b6b7b7", fontSize: 12, fontWeight: "600" },

  captureRow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
});
