// ─── Strip frame layout (UACR card) ────────────────────────────────────────────
// Ported verbatim from the Ionic page's stripBox()/BOX_*_MM constants
// (uacr-scan-card.page.ts) — the box is a FIXED physical size (doesn't scale
// with screen height), converted with the CSS spec's fixed 96px = 1in = 25.4mm
// ratio, same as the reference app. Previously this was 70% of screen height,
// which made the box far larger than the real card and didn't match the
// Ionic app's framing at all.
//
// Physical card measurements (measured off the printed card):
//   dotted box  53.148mm × 113.69mm — rounded to 53.5mm × 114mm for margin
const BOX_WIDTH_MM   = 53.5;
const BOX_HEIGHT_MM  = 114;
const CSS_PX_PER_MM  = 96 / 25.4;

export const STRIP_WIDTH  = BOX_WIDTH_MM  * CSS_PX_PER_MM;
export const STRIP_HEIGHT = BOX_HEIGHT_MM * CSS_PX_PER_MM;

// Space reserved below the box for the Take Picture button, so the box sits
// anchored toward the bottom rather than centred (matches BOX_BOTTOM_RESERVED_PX).
export const BOX_BOTTOM_RESERVED = 190;
// Minimum top offset, leaving room for the header + status banner underneath it
// (Ionic's BOX_TOP_MIN_PX is 110, but that assumes a single-line banner —
// bumped up here since the banner can wrap to two lines, e.g. the exposure
// messages, and shouldn't ever overlap the box).
export const BOX_TOP_MIN = 150;

/** Ported from the Ionic page's stripBox(W, H) — same centred-horizontally,
 * bottom-anchored positioning, so the drawn frame and the crop region always
 * agree on where the box actually is. */
export function getStripBoxPosition(containerWidth: number, containerHeight: number) {
  const left = (containerWidth - STRIP_WIDTH) / 2;
  const top = Math.max(BOX_TOP_MIN, containerHeight - STRIP_HEIGHT - BOX_BOTTOM_RESERVED);
  return { left, top };
}

// ─── Timing ───────────────────────────────────────────────────────────────────

export const TOTAL_WAIT          = 60;   // seconds on wait screen
export const CAMERA_TIMEOUT      = 20;   // seconds before deadline warning (matches Ionic's CARD_DEADLINE_MS = 20_000)
export const AUTO_CAPTURE_DELAY  = 0;    // unused (manual capture only)
export const ANALYSIS_INTERVAL   = 900;  // ms between probe frames
export const STABLE_TICKS_NEEDED = 2;    // consecutive clean ticks → STABLE
export const STABLE_TICKS_PENALTY = 1;   // ticks deducted on blur/reflection

// ─── Timer circle ─────────────────────────────────────────────────────────────

export const C_SIZE   = 150;
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
