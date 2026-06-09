/**
 * analyseFrameQuality
 *
 * Lightweight quality probe using byte statistics from a base64-encoded JPEG.
 * - Low byte variance  → blurry (uniform pixel values)
 * - High mean brightness → overexposed / reflective
 *
 * A proper implementation would use native pixel access (e.g. vision-camera
 * frame processor), but this is a good-enough heuristic for expo-camera.
 */
export function analyseFrameQuality(
  b64: string
): "ok" | "blur" | "reflection" {
  try {
    const slice = b64.slice(1000, 6000);
    const bytes = atob(slice)
      .split("")
      .map((c) => c.charCodeAt(0));
    if (bytes.length === 0) return "ok";
    const mean     = bytes.reduce((a, b) => a + b, 0) / bytes.length;
    const variance = bytes.reduce((a, b) => a + (b - mean) ** 2, 0) / bytes.length;
    if (variance < 180) return "blur";
    if (mean    > 220)  return "reflection";
    return "ok";
  } catch {
    return "ok";
  }
}

/**
 * parseApiError
 *
 * Normalises FastAPI / arbitrary HTTP error responses into a single string.
 */
export function parseApiError(error: any): string {
  const fallback = "Something went wrong. Please wait and try again.";
  const detail   = error?.response?.data?.detail;
  if (!detail) return fallback;
  try {
    if (Array.isArray(detail))      return detail.map((d: any) => d.msg).join(", ");
    if (typeof detail === "string") {
      try {
        const p = JSON.parse(detail);
        return p?.detail || p?.message || detail;
      } catch {
        return detail;
      }
    }
    return detail?.detail || detail?.message || fallback;
  } catch {
    return fallback;
  }
}
