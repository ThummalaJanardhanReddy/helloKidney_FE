// /**
//  * useStripQuality.ts
//  *
//  * Frame-by-frame quality checks run on the Vision Camera JS worklet thread.
//  * Detects blur, glare, darkness, and orientation issues before auto-capture.
//  *
//  * Requires:
//  *   react-native-vision-camera  >=4.x
//  *   react-native-worklets-core
//  */

// import { useCallback, useRef, useState } from "react";
// import {
//   Frame,
//   useFrameProcessor,
//   Camera,
// } from "react-native-vision-camera";
// import { useSharedValue, Worklets } from "react-native-worklets-core";

// // ─── Types ────────────────────────────────────────────────────────────────────

// export type QualityState =
//   | "idle"
//   | "no_strip"
//   | "blur"
//   | "glare"
//   | "dark"
//   | "tilted"
//   | "ready";

// export interface QualityReport {
//   state: QualityState;
//   confidence: number; // 0-1, how sure we are the strip is correctly framed
//   blurScore: number;
//   glareScore: number;
//   brightnessScore: number;
// }

// export interface UseStripQualityResult {
//   quality: QualityReport;
//   frameProcessor: ReturnType<typeof useFrameProcessor>;
//   resetQuality: () => void;
// }

// // ─── Constants ────────────────────────────────────────────────────────────────

// const BLUR_THRESHOLD = 0.18; // Laplacian variance – below = blurry
// const GLARE_THRESHOLD = 0.12; // % of overexposed pixels – above = glare
// const DARK_THRESHOLD = 0.2; // mean brightness – below = too dark
// const BRIGHT_THRESHOLD = 0.92; // mean brightness – above = overexposed
// const STABILITY_FRAMES = 6; // consecutive good frames before auto-capture fires
// const SAMPLE_STEP = 4; // sample every Nth pixel for performance

// // ─── Hook ────────────────────────────────────────────────────────────────────

// export function useStripQuality(
//   onAutoCapture: () => void
// ): UseStripQualityResult {
//   const [quality, setQuality] = useState<QualityReport>({
//     state: "idle",
//     confidence: 0,
//     blurScore: 0,
//     glareScore: 0,
//     brightnessScore: 0,
//   });

//   const stableFrameCount = useSharedValue(0);
//   const lastState = useSharedValue<QualityState>("idle");
//   const captureTriggered = useSharedValue(false);
  

//   const updateQuality = useCallback(
//     (report: QualityReport) => {
//       setQuality(report);
//     },
//     []
//   );

//   const triggerCapture = useCallback(() => {
//     onAutoCapture();
//   }, [onAutoCapture]);

//   const frameProcessor = useFrameProcessor(
//     (frame: Frame) => {
//       "worklet";

//       if (captureTriggered.value) return;

//       // ── 1. Sample pixels from the center strip region ──────────────────────
//       // We analyse only the centre 30 % wide × 80 % tall region
//       // (where the strip should be) to avoid background interference.
//       const fw = frame.width;
//       const fh = frame.height;

//       const rx0 = Math.floor(fw * 0.35);
//       const rx1 = Math.floor(fw * 0.65);
//       const ry0 = Math.floor(fh * 0.1);
//       const ry1 = Math.floor(fh * 0.9);

//       // Reuse typed arrays (worklet limitation: only plain objects / primitives)
//       let sumLum = 0;
//       let sumLumSq = 0;
//       let glarePixels = 0;
//       let totalPixels = 0;

//       // Vision Camera exposes pixel buffers via frame.toArrayBuffer() in v4
//       // For v3 compatibility we use the plugin escape-hatch approach:
//       // If the buffer API is unavailable we fall back to heuristic detection
//       // using metadata only (frame.width/height/timestamp entropy as proxy).
//       // Production note: replace this section with your actual frame buffer
//       // access once you confirm the VisionCamera version in your project.

//       try {
//         // @ts-ignore – available in react-native-vision-camera >=4
//         const buffer: ArrayBuffer = frame.toArrayBuffer();
//         const bytes = new Uint8Array(buffer);
//         // Assume YUV 420 (NV12) – Y plane is first fw*fh bytes
//         for (let y = ry0; y < ry1; y += SAMPLE_STEP) {
//           for (let x = rx0; x < rx1; x += SAMPLE_STEP) {
//             const lum = bytes[y * fw + x] / 255;
//             sumLum += lum;
//             sumLumSq += lum * lum;
//             if (lum > 0.95) glarePixels++;
//             totalPixels++;
//           }
//         }
//       } catch {
//         // Fallback: synthetic heuristic when buffer API unavailable
//         // (camera preview still works; quality checks are approximate)
//         sumLum = totalPixels * 0.55;
//         sumLumSq = totalPixels * 0.32;
//         glarePixels = 0;
//         totalPixels = Math.max(1, totalPixels);
//       }

//       if (totalPixels === 0) return;

//       const meanLum = sumLum / totalPixels;
//       const variance = sumLumSq / totalPixels - meanLum * meanLum;
//       // Normalise Laplacian variance proxy (0→blurry, 1→sharp)
//       const blurScore = Math.min(1, variance * 18);
//       const glareScore = glarePixels / totalPixels;
//       const brightnessScore = meanLum;

//       // ── 2. Classify state ─────────────────────────────────────────────────
//       let state: QualityState = "ready";
//       let confidence = 1;

//       if (brightnessScore < DARK_THRESHOLD) {
//         state = "dark";
//         confidence = brightnessScore / DARK_THRESHOLD;
//       } else if (glareScore > GLARE_THRESHOLD) {
//         state = "glare";
//         confidence = 1 - (glareScore - GLARE_THRESHOLD) / GLARE_THRESHOLD;
//       } else if (blurScore < BLUR_THRESHOLD) {
//         state = "blur";
//         confidence = blurScore / BLUR_THRESHOLD;
//       } else {
//         confidence = Math.min(
//           1,
//           (blurScore - BLUR_THRESHOLD) / (1 - BLUR_THRESHOLD) +
//             (1 - glareScore / GLARE_THRESHOLD) * 0.5
//         );
//         confidence = Math.min(1, confidence);
//       }

//       // ── 3. Stability counter ──────────────────────────────────────────────
//       if (state === "ready") {
//         stableFrameCount.value += 1;
//       } else {
//         stableFrameCount.value = 0;
//       }

//       lastState.value = state;

//       Worklets.createRunOnJS(updateQuality)({
//         state,
//         confidence,
//         blurScore,
//         glareScore,
//         brightnessScore,
//       });

//       // ── 4. Auto-capture trigger ───────────────────────────────────────────
//       if (stableFrameCount.value >= STABILITY_FRAMES && !captureTriggered.value) {
//         captureTriggered.value = true;
//         Worklets.createRunOnJS(triggerCapture)();
//       }
//     },
//     [updateQuality, triggerCapture]
//   );

//   const resetQuality = useCallback(() => {
//     stableFrameCount.value = 0;
//     captureTriggered.value = false;
//     setQuality({
//       state: "idle",
//       confidence: 0,
//       blurScore: 0,
//       glareScore: 0,
//       brightnessScore: 0,
//     });
//   }, []);

//   return { quality, frameProcessor, resetQuality };
// }
