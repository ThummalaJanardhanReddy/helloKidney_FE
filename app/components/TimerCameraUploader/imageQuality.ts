/**
 * Image quality checks — ported from the Ionic app's
 * ImageQualityValidatorService (src/app/services/image-quality-validator.service.ts)
 * and ArucoDetectorService.
 *
 * expo-camera has no live per-frame pixel access (unlike the Ionic app's
 * CameraPreview.captureSample() loop), so the live loop takes small stills and
 * the final gate runs once on the captured photo. The math for sharpness
 * (Laplacian variance), exposure and contrast (histogram / std-dev) is the same
 * pure-pixel algorithm as the source app. Framing ("bounds") is the Ionic
 * app's ArUco corner-marker check (see aruco.ts), not an edge heuristic.
 *
 * Order and stop rule match Ionic: sharpness, exposure, bounds, contrast,
 * stopping at the first failure.
 */
import { decode as decodeJpeg } from "jpeg-js";
import { toByteArray as base64ToByteArray } from "base64-js";
import { validateBoundsViaAruco } from "./aruco";

export interface DecodedImage {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface QualityResult {
  pass: boolean;
  score: number;
  message: string;
}

// ─── Thresholds (verbatim from ImageQualityValidatorService) ──────────────────

const BLUR_VARIANCE_THRESHOLD = 200;
const CONTRAST_MIN_SCORE = 30;

const EXPOSURE_DARK_MAX = 55;
const EXPOSURE_BRIGHT_MAX = 80;
const EXPOSURE_MID_MIN = 5;


// ─── Decoding ───────────────────────────────────────────────────────────────

export function decodeBase64Jpeg(base64: string): DecodedImage {
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const bytes = base64ToByteArray(raw);
  const { data, width, height } = decodeJpeg(bytes, { useTArray: true });
  return { data, width, height };
}

// ─── Shared helper: grayscale + downsample ─────────────────────────────────

function toGrayscaleDownsampled(
  image: DecodedImage,
  maxDim: number,
): { gray: Uint8ClampedArray; width: number; height: number } {
  const { data, width: sw, height: sh } = image;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const gray = new Uint8ClampedArray(width * height);
  for (let oy = 0; oy < height; oy++) {
    const sy = Math.min(sh - 1, Math.floor(oy / scale));
    for (let ox = 0; ox < width; ox++) {
      const sx = Math.min(sw - 1, Math.floor(ox / scale));
      const si = (sy * sw + sx) * 4;
      gray[oy * width + ox] =
        0.299 * data[si] + 0.587 * data[si + 1] + 0.114 * data[si + 2];
    }
  }

  return { gray, width, height };
}

// ─── Sharpness (Laplacian variance) ────────────────────────────────────────

export function validateSharpness(image: DecodedImage): QualityResult {
  const { gray, width, height } = toGrayscaleDownsampled(image, 800);

  const lap = new Float32Array(width * height);
  let sum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const val =
        gray[idx - width] + gray[idx + width] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
      lap[idx] = val;
      sum += val;
      count++;
    }
  }

  const mean = count ? sum / count : 0;
  let sumSq = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const d = lap[idx] - mean;
      sumSq += d * d;
    }
  }

  const variance = count ? sumSq / count : 0;
  const pass = variance > BLUR_VARIANCE_THRESHOLD;
  const score = Math.min(100, Math.round((variance / 300) * 100));

  return {
    pass,
    score,
    message: pass ? "Image sharp" : "Image is blurry. Keep phone steady.",
  };
}

// ─── Exposure (histogram) ──────────────────────────────────────────────────

export function validateExposure(image: DecodedImage): QualityResult {
  const { gray } = toGrayscaleDownsampled(image, 400);

  let dark = 0, mid = 0, bright = 0;
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i];
    if (v < 85) dark++;
    else if (v < 170) mid++;
    else bright++;
  }

  const total = gray.length || 1;
  const darkPercent = (dark / total) * 100;
  const midPercent = (mid / total) * 100;
  const brightPercent = (bright / total) * 100;

  const pass =
    darkPercent < EXPOSURE_DARK_MAX &&
    brightPercent < EXPOSURE_BRIGHT_MAX &&
    midPercent > EXPOSURE_MID_MIN;

  const score = Math.max(
    0,
    Math.round(
      100 -
        Math.max(0, darkPercent - EXPOSURE_DARK_MAX) -
        Math.max(0, brightPercent - EXPOSURE_BRIGHT_MAX),
    ),
  );

  // Line breaks match the Ionic source verbatim (image-quality-validator.service.ts).
  let message: string;
  if (darkPercent >= EXPOSURE_DARK_MAX) {
    message = "Image too dark.\nIncrease  lighting or move to a brighter area.";
  } else if (brightPercent >= EXPOSURE_BRIGHT_MAX) {
    message = "Image too bright. Reduce glare \nor move to a shaded area.";
  } else if (midPercent <= EXPOSURE_MID_MIN) {
    message = "Uneven lighting. Move to \nan area with more even light.";
  } else {
    message = "Lighting OK";
  }

  return { pass, score, message };
}

// ─── Contrast (standard deviation) ─────────────────────────────────────────

export function validateContrast(image: DecodedImage): QualityResult {
  const { gray } = toGrayscaleDownsampled(image, 400);

  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  const mean = gray.length ? sum / gray.length : 0;

  let sqSum = 0;
  for (let i = 0; i < gray.length; i++) {
    const d = gray[i] - mean;
    sqSum += d * d;
  }
  const stdDeviation = gray.length ? Math.sqrt(sqSum / gray.length) : 0;
  const score = Math.min(100, Math.round((stdDeviation / 127.5) * 100));
  const pass = score >= CONTRAST_MIN_SCORE;

  return {
    pass,
    score,
    message: pass ? "Colors clear" : "Colors washed out. Improve lighting.",
  };
}

// ─── Orchestration ──────────────────────────────────────────────────────────

export type QualityKey = "sharpness" | "exposure" | "bounds" | "contrast";

export interface OrderedChecksResult {
  pass: boolean;
  /** Which check failed first (undefined when everything passed). */
  failedKey?: QualityKey;
  /** The failing check's user-facing message. */
  message?: string;
  /** One line per check that ran — pass/fail + score. */
  lines: string[];
}

/**
 * Sharpness → exposure → bounds → contrast, stopping at the first failure —
 * the same order and stop rule as the Ionic page (both its live loop and its
 * post-capture gate). Used by both places here too.
 */
export function runChecksInOrder(image: DecodedImage): OrderedChecksResult {
  const steps: [QualityKey, () => QualityResult][] = [
    ["sharpness", () => validateSharpness(image)],
    ["exposure", () => validateExposure(image)],
    ["bounds", () => validateBoundsViaAruco(image)],
    ["contrast", () => validateContrast(image)],
  ];

  const lines: string[] = [];
  for (const [key, check] of steps) {
    const result = check();
    lines.push(`${result.pass ? "PASS" : "FAIL"} ${key} (score ${result.score}): ${result.message}`);
    if (!result.pass) {
      return { pass: false, failedKey: key, message: result.message, lines };
    }
  }
  return { pass: true, lines };
}

export interface QualityGateResult {
  pass: boolean;
  /** Multi-line breakdown of the checks that ran. */
  summary: string;
  /** First failing check's user-facing message, if any. */
  failMessage?: string;
}

/**
 * Post-capture gate. Like the Ionic page, ALL four checks read the same full
 * captured frame (not a crop of the strip), so what passes here is what the
 * live loop was judging.
 */
export async function runQualityGate(fullBase64: string): Promise<QualityGateResult> {
  // Let the "Capturing image…" overlay paint before the heavy synchronous
  // decode + marker search starts.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  const decodeStart = Date.now();
  let image: DecodedImage;
  try {
    image = decodeBase64Jpeg(fullBase64);
  } catch (err) {
    console.error("[QualityGate] JPEG decode failed:", err);
    throw err;
  }
  const decodeMs = Date.now() - decodeStart;

  const result = runChecksInOrder(image);
  const lines = [`Decoded ${image.width}x${image.height} in ${decodeMs}ms`, ...result.lines];
  lines.forEach((l) => console.log(`[QualityGate] ${l}`));

  return { pass: result.pass, summary: lines.join("\n"), failMessage: result.message };
}
