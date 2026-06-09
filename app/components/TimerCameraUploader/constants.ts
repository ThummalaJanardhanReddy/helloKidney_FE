import { Dimensions } from "react-native";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Strip frame layout ───────────────────────────────────────────────────────

export const STRIP_WIDTH      = SW * 0.3;
export const STRIP_HEIGHT     = Math.min(STRIP_WIDTH * 5, SH * 0.72); // 5:1 ratio
export const FRAME_TOP_OFFSET = 40;

// ─── Timing ───────────────────────────────────────────────────────────────────

export const TOTAL_WAIT          = 60;   // seconds on wait screen
export const CAMERA_TIMEOUT      = 60;   // seconds before accuracy warning
export const AUTO_CAPTURE_DELAY  = 5;    // stable countdown before shutter
export const ANALYSIS_INTERVAL   = 900;  // ms between probe frames
export const STABLE_TICKS_NEEDED = 2;    // consecutive clean ticks → STABLE

// ─── Timer circle ─────────────────────────────────────────────────────────────

export const C_SIZE   = 180;
export const C_STROKE = 12;
export const C_RADIUS = (C_SIZE - C_STROKE) / 2;
export const C_CIRC   = 2 * Math.PI * C_RADIUS;

// ─── Frame state machine ──────────────────────────────────────────────────────

export type FrameState =
  | "IDLE"         // waiting for QR
  | "STRIP_ALIGN"  // QR locked, aligning strip
  | "BLUR"         // image too blurry
  | "REFLECTION"   // overexposed / reflective
  | "STABLE"       // clean frame, counting down
  | "CAPTURING";   // shutter firing

export interface FrameVisual {
  color: string;
  label: string;
}

export const FRAME_VISUAL: Record<FrameState, FrameVisual> = {
  IDLE:        { color: "#F59E0B", label: "Scan QR code on strip card"         },
  STRIP_ALIGN: { color: "#00E5FF", label: "Align strip inside the frame"       },
  BLUR:        { color: "#F87171", label: "Image blurry – hold steady"         },
  REFLECTION:  { color: "#FB923C", label: "Reflection detected – adjust angle" },
  STABLE:      { color: "#4ADE80", label: "Strip detected – hold still"        },
  CAPTURING:   { color: "#FFFFFF", label: "Capturing…"                         },
};

// ─── Step list (wait screen) ──────────────────────────────────────────────────

export const STEPS = [
  { icon: "timer-outline",                text: "Wait 60 s for the reaction"    },
  { icon: "qrcode-scan",                  text: "Scan QR code on the card"      },
  { icon: "image-filter-center-focus",    text: "Align strip in the frame"      },
  { icon: "camera-iris",                  text: "Auto-capture fires when stable" },
] as const;

// ─── Quality hints (preview sheet) ───────────────────────────────────────────

export const QUALITY_HINTS = [
  { icon: "check-circle-outline", color: "#4ADE80", text: "Strip visible"    },
  { icon: "check-circle-outline", color: "#4ADE80", text: "QR scanned"       },
  // { icon: "alert-circle-outline", color: "#F59E0B", text: "Verify sharpness" },
] as const;
