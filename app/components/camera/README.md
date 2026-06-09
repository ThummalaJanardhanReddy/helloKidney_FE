# Strip Camera – Auto-Capture Module

Rewritten camera module for the kidney urinalysis strip scanner.  
Replaces the original `TimerCameraUploader.tsx`.

---

## File Map

```
strip-camera/
├── TimerCameraUploader.tsx   ← Entry point (replaces original)
├── CameraScreen.tsx          ← Camera + preview + upload UI
├── StripOverlay.tsx          ← Animated viewfinder overlay
├── useStripQuality.ts        ← Frame-processor quality analysis
├── useQrScanner.ts           ← QR scanning frame processor
└── imageUtils.ts             ← Crop math + upload API call
```

---

## Install Dependencies

```bash
npm install react-native-vision-camera
npm install vision-camera-code-scanner
npm install react-native-worklets-core
npm install expo-image-manipulator
npm install react-native-svg
```

Then rebuild the native layer:
```bash
npx expo prebuild --clean
npx expo run:ios   # or run:android
```

---

## Babel Config

Add the worklets plugin **first** in `babel.config.js`:

```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['react-native-worklets-core/plugin'],  // ← must be first
    // ... other plugins
  ],
};
```

---

## Key Features

### Auto-Capture
`useStripQuality` runs a frame processor on the JS worklet thread at 10 fps.  
It analyses the **centre 30% × 80%** region of each frame for:

| Check | Threshold | Hint shown |
|-------|-----------|------------|
| Blur (Laplacian variance) | < 0.18 | "Hold steady" |
| Glare (% overexposed px) | > 12% | "Reduce glare" |
| Darkness (mean lumen) | < 0.20 | "Move to better lighting" |

After **6 consecutive good frames**, `onAutoCapture` fires automatically.

### QR Scanning
`useQrScanner` wraps `vision-camera-code-scanner`.  
Once a QR is locked, the processor switches to quality-only mode.  
The Take Photo button (and auto-capture) are gated behind a successful QR scan.

### Frame Processor Note
`useStripQuality` calls `frame.toArrayBuffer()` which requires  
`react-native-vision-camera >= 4.0`.  
For v3, the hook falls back to a synthetic heuristic – replace the  
`try` block in `useStripQuality.ts` with your preferred pixel-access approach.

### Combining Frame Processors
The camera currently alternates between QR and quality processors.  
To run both simultaneously (lower latency), use:

```ts
import { composeFrameProcessors } from 'react-native-vision-camera';
const combined = composeFrameProcessors([barcodeFrameProcessor, qualityProcessor]);
```

---

## Drop-in Replacement

1. Copy this folder into your project.
2. Update the import paths in each file to match your project structure  
   (look for `../../src/`, `../../app/`).
3. Replace the original `TimerCameraUploader.tsx` route file with  
   `TimerCameraUploader.tsx` from this folder (or re-export from it).

---

## Architecture

```
TimerCameraUploader
  └─ [timer screen]  ──60s──►  CameraScreen
                                  ├─ useQrScanner        (frame processor)
                                  ├─ useStripQuality     (frame processor)
                                  ├─ StripOverlay        (UI overlay)
                                  └─ imageUtils          (crop + upload)
```
