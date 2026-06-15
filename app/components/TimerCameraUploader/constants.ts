import { Dimensions } from "react-native";

const { height: SH } = Dimensions.get("window");

// ─── Strip frame layout (UACR card: 3 cm wide × 15 cm tall) ──────────────────
// Mirror Angular's approach: height = 70% of screen, width derived from ratio.
// Angular uses bw = bh * (4/15) which gives a practical scanning width.

export const STRIP_HEIGHT     = SH * 0.70;
export const STRIP_WIDTH      = STRIP_HEIGHT * (7/ 15);
export const FRAME_TOP_OFFSET = 0;           // strip is centred vertically

// ─── Timing ───────────────────────────────────────────────────────────────────

export const TOTAL_WAIT          = 60;   // seconds on wait screen
export const CAMERA_TIMEOUT      = 120;   // seconds before deadline warning (matches Angular 20 000 ms)
export const AUTO_CAPTURE_DELAY  = 0;    // unused (manual capture only)
export const ANALYSIS_INTERVAL   = 900;  // ms between probe frames
export const STABLE_TICKS_NEEDED = 2;    // consecutive clean ticks → STABLE
export const STABLE_TICKS_PENALTY = 1;   // ticks deducted on blur/reflection

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
  IDLE:        { color: "#F59E0B", label: "Scan the strip card"         },
  STRIP_ALIGN: { color: "#4ADE80", label: "Align strip inside the frame"       },
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
  { icon: "camera-iris",                  text: "Tap Take Picture when ready"   },
] as const;

// ─── Quality hints (preview sheet) ───────────────────────────────────────────

export const QUALITY_HINTS = [
  { icon: "check-circle-outline", color: "#4ADE80", text: "Strip visible" },
  { icon: "check-circle-outline", color: "#4ADE80", text: "QR scanned"    },
] as const;
