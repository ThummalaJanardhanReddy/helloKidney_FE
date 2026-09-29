/**
 * ArUco-based card framing check — ported from the Ionic app's
 * ArucoDetectorService (src/app/services/aruco-detector.service.ts), the
 * "bounds" validator that app actually gates on.
 *
 * The card carries printed ArUco corner markers. The Ionic page only lets a
 * photo through when at least 3 of the 4 outer corner markers are found, so
 * the backend always receives an image where the markers it reads the strip
 * against are visible. (This RN app previously used a generic edge-box guess
 * instead, which passes on almost any busy scene.)
 *
 * Same library (js-aruco2, dictionary ARUCO_MIP_36h12), same classification:
 * markers are placed in a quadrant relative to the markers' own centroid and,
 * because this card has 8 markers (4 outer + 4 flanking the strip chamber),
 * the one farthest from the centroid is kept per quadrant.
 */
import type { DecodedImage, QualityResult } from "./imageQuality";

// The vendored library is plain CommonJS JavaScript (patched copy of js-aruco2,
// MIT — see vendor/js-aruco2/LICENSE.txt). It is required rather than imported
// so no .d.ts has to sit next to it (Metro would try to bundle that file).
interface ArucoDetectorInstance {
  detect(image: { width: number; height: number; data: ArrayLike<number> }): {
    id: number;
    corners: { x: number; y: number }[];
  }[];
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AR } = require("./vendor/js-aruco2/aruco") as {
  AR: { Detector: new (config?: { dictionaryName?: string }) => ArucoDetectorInstance };
};

interface Point2D { x: number; y: number }

export interface ArucoMarker {
  id: number;
  corners: Point2D[];
  center: Point2D;
}

export interface ClassifiedCorners {
  topLeft: ArucoMarker | null;
  topRight: ArucoMarker | null;
  bottomLeft: ArucoMarker | null;
  bottomRight: ArucoMarker | null;
}

// Ionic drops candidates under 400 px² (calibration swatches are ~100 px²,
// real markers ~1600 px² at its working resolution, ~1080 px wide). Here the
// image short side varies between the live samples and the final photo, so
// the floor is scaled by (short side / 1080)² — the same physical marker
// size threshold, whatever resolution the frame was decoded at.
const MIN_MARKER_AREA = 400;
const REFERENCE_SHORT_SIDE = 1080;

let detector: ArucoDetectorInstance | null = null;
function getDetector(): ArucoDetectorInstance {
  if (!detector) detector = new AR.Detector({ dictionaryName: "ARUCO_MIP_36h12" });
  return detector;
}

function computeCenter(corners: Point2D[]): Point2D {
  const sum = corners.reduce((acc, c) => ({ x: acc.x + c.x, y: acc.y + c.y }), { x: 0, y: 0 });
  return { x: sum.x / corners.length, y: sum.y / corners.length };
}

function markerArea(corners: Point2D[]): number {
  let area = 0;
  const n = corners.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += (corners[j].x + corners[i].x) * (corners[j].y - corners[i].y);
  }
  return Math.abs(area) / 2;
}

export function detectMarkers(image: DecodedImage): ArucoMarker[] {
  try {
    const raw = getDetector().detect({
      width: image.width,
      height: image.height,
      data: image.data,
    });
    const scale = Math.min(image.width, image.height) / REFERENCE_SHORT_SIDE;
    const minArea = MIN_MARKER_AREA * scale * scale;

    return raw
      .map((m) => {
        const corners = m.corners.map((c) => ({ x: c.x, y: c.y }));
        return { id: m.id, corners, center: computeCenter(corners) };
      })
      .filter((m) => markerArea(m.corners) >= minArea);
  } catch (e) {
    console.error("[ArUco] marker detection error:", e);
    return [];
  }
}

export function detectCorners(image: DecodedImage): { corners: ClassifiedCorners; confidence: number } {
  const markers = detectMarkers(image);

  let midX = image.width / 2;
  let midY = image.height / 2;
  if (markers.length > 0) {
    midX = markers.reduce((sum, m) => sum + m.center.x, 0) / markers.length;
    midY = markers.reduce((sum, m) => sum + m.center.y, 0) / markers.length;
  }

  const corners: ClassifiedCorners = {
    topLeft: null, topRight: null, bottomLeft: null, bottomRight: null,
  };

  const distSq = (m: ArucoMarker) => (m.center.x - midX) ** 2 + (m.center.y - midY) ** 2;
  const preferFarther = (slot: keyof ClassifiedCorners, m: ArucoMarker) => {
    const current = corners[slot];
    if (!current || distSq(m) > distSq(current)) corners[slot] = m;
  };

  for (const m of markers) {
    const { x, y } = m.center;
    if (x < midX && y < midY)       preferFarther("topLeft", m);
    else if (x >= midX && y < midY) preferFarther("topRight", m);
    else if (x < midX && y >= midY) preferFarther("bottomLeft", m);
    else                            preferFarther("bottomRight", m);
  }

  const found = [corners.topLeft, corners.topRight, corners.bottomLeft, corners.bottomRight]
    .filter(Boolean).length;

  return { corners, confidence: Math.round((found / 4) * 100) };
}

/**
 * Ionic's validateBoundsViaAruco(): pass when at least 3 of the 4 outer
 * corner markers are found. 3/4 (not 4/4) is deliberate in the source — hand
 * movement between the last live check and the actual shutter can drop one
 * marker out of frame on an otherwise well-framed card.
 */
export function validateBoundsViaAruco(image: DecodedImage): QualityResult {
  const { corners, confidence } = detectCorners(image);
  const cornersDetected = [
    corners.topLeft, corners.topRight, corners.bottomLeft, corners.bottomRight,
  ].filter(Boolean).length;

  const pass = cornersDetected >= 3;

  return {
    pass,
    score: confidence,
    message: pass
      ? "All edges visible"
      : cornersDetected === 0
        ? "Cannot detect card. Move closer."
        : `Only ${cornersDetected}/4 corner markers found. \nAdjust framing.`,
  };
}
