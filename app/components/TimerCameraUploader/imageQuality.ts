/**
 * Post-capture image quality gate — ported from the Ionic app's
 * ImageQualityValidatorService (src/app/services/image-quality-validator.service.ts).
 *
 * expo-camera has no live per-frame pixel access (unlike the Ionic app's
 * CameraPreview.captureSample() loop), so these checks run once, on the
 * full-resolution photo, right after the shutter fires — not continuously
 * while framing. The math itself (grayscale downsample, Laplacian variance
 * for sharpness, histogram for exposure/contrast, Sobel edge bounding-box
 * for card bounds) is the same pure-pixel algorithm as the source app; only
 * the "ArUco marker" bounds variant was left out in favor of the source
 * app's own generic Sobel fallback (validateCardBounds), since ArUco
 * requires a native/heavy detector this port intentionally skips.
 */
import { decode as decodeJpeg } from "jpeg-js";
import { toByteArray as base64ToByteArray } from "base64-js";

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

const BOUNDS_EDGE_MAG_THRESHOLD = 45;
const BOUNDS_MIN_AREA_PERCENT = 15;
const BOUNDS_LARGE_AREA_PERCENT = 80;

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

// ─── Card bounds (Sobel edge bounding-box) ─────────────────────────────────

export function validateCardBounds(image: DecodedImage): QualityResult {
  const { gray, width, height } = toGrayscaleDownsampled(image, 500);

  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx = gray[idx + 1] - gray[idx - 1];
      const gy = gray[idx + width] - gray[idx - width];
      if (Math.hypot(gx, gy) > BOUNDS_EDGE_MAG_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) {
    return { pass: false, score: 0, message: "Card not detected in frame. Move camera to center card." };
  }

  const areaPercent = Math.round(((maxX - minX) * (maxY - minY) / (width * height)) * 100);

  const margin = Math.round(Math.min(width, height) * 0.02);
  const touchingSides = [
    minX <= margin,
    maxX >= width - 1 - margin,
    minY <= margin,
    maxY >= height - 1 - margin,
  ].filter(Boolean).length;

  const tooSmall = areaPercent < BOUNDS_MIN_AREA_PERCENT;
  const fillsFrame = areaPercent >= BOUNDS_LARGE_AREA_PERCENT;
  const pass = !tooSmall && (fillsFrame || touchingSides <= 1);
  const cornersDetected = pass ? 4 : Math.max(0, 4 - touchingSides);
  const score = Math.round((cornersDetected / 4) * 100);

  let message = "All edges visible";
  if (tooSmall) {
    message = `Card too small in frame (${areaPercent}% of frame). Move closer.`;
  } else if (!pass) {
    message = "Card edges cut off. Move back or adjust position.";
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

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface QualityGateResult {
  pass: boolean;
  /** Multi-line breakdown of every check that ran — pass/fail + score each. */
  summary: string;
  /** First failing check's user-facing message, if any. */
  failMessage?: string;
}

/**
 * Sharpness → exposure → bounds → contrast, matching the Ionic page's
 * runQualityChecks() order/timing. Unlike the Ionic version this runs ALL
 * four checks every time (doesn't stop at the first failure) so the caller
 * can show a full breakdown — useful while debugging on a device where
 * Metro logs aren't visible.
 *
 * `bounds` needs the FULL captured frame (it's checking whether the card is
 * well-positioned/sized within the whole shot), but sharpness/exposure/
 * contrast are run on `cardBase64` — the photo already cropped to just the
 * strip box — instead of the full frame. Measuring exposure/contrast against
 * the whole frame let background clutter around the card (a dim table, a
 * dark room past the card's edges) drag the reading down even when the card
 * itself was well-lit, causing "Image too dark" to fire far more than it
 * should have on real captures.
 */
export async function runQualityGate(
  fullBase64: string,
  cardBase64: string,
): Promise<QualityGateResult> {
  const decodeStart = Date.now();
  let fullImage: DecodedImage;
  let cardImage: DecodedImage;
  try {
    fullImage = decodeBase64Jpeg(fullBase64);
    cardImage = decodeBase64Jpeg(cardBase64);
  } catch (err) {
    console.error("[QualityGate] JPEG decode failed:", err);
    throw err;
  }
  const decodeMs = Date.now() - decodeStart;

  const steps: Array<[string, () => QualityResult]> = [
    ["sharpness", () => validateSharpness(cardImage)],
    ["exposure", () => validateExposure(cardImage)],
    ["bounds", () => validateCardBounds(fullImage)],
    ["contrast", () => validateContrast(cardImage)],
  ];

  const lines = [
    `Decoded full ${fullImage.width}x${fullImage.height} + card ${cardImage.width}x${cardImage.height} in ${decodeMs}ms`,
  ];
  let pass = true;
  let failMessage: string | undefined;

  for (const [key, check] of steps) {
    await delay(120);
    const result = check();
    lines.push(`${result.pass ? "PASS" : "FAIL"} ${key} (score ${result.score}): ${result.message}`);
    console.log(`[QualityGate] ${key}: ${result.pass ? "PASS" : "FAIL"} score=${result.score} — ${result.message}`);
    if (!result.pass) {
      pass = false;
      if (!failMessage) failMessage = result.message;
    }
    await delay(150);
  }

  if (pass) await delay(300);

  return { pass, summary: lines.join("\n"), failMessage };
}
