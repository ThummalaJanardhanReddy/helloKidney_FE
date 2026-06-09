// /**
//  * StripOverlay.tsx
//  *
//  * Animated camera overlay that:
//  *  - Draws the strip alignment frame
//  *  - Shows animated corner brackets
//  *  - Pulses green when quality is "ready"
//  *  - Shows contextual quality hint text
//  *  - Displays a progress ring for auto-capture countdown
//  */

// import React, { useEffect, useRef } from "react";
// import {
//   Animated,
//   Dimensions,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
// import type { QualityReport } from "./useStripQuality";
// import {
//   STRIP_WIDTH,
//   FINAL_STRIP_HEIGHT,
//   FRAME_TOP_OFFSET,
// } from "./imageUtils";

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface StripOverlayProps {
//   previewWidth: number;
//   previewHeight: number;
//   quality: QualityReport;
//   qrScanned: boolean;
//   /** 0–1: how close to auto-capture */
//   captureProgress: number;
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// const QUALITY_HINTS: Record<string, string> = {
//   idle: "Scan the QR code on the test card first",
//   no_strip: "Place the strip inside the frame",
//   blur: "Hold steady – image is blurry",
//   glare: "Reduce glare – move away from bright light",
//   dark: "Too dark – move to better lighting",
//   tilted: "Straighten the strip inside the frame",
//   ready: "Perfect – hold still…",
// };

// const FRAME_COLORS: Record<string, string> = {
//   idle: "#475569",
//   no_strip: "#94A3B8",
//   blur: "#F59E0B",
//   glare: "#F59E0B",
//   dark: "#F59E0B",
//   tilted: "#F59E0B",
//   ready: "#22D3EE",
// };

// // ─── Corner bracket ───────────────────────────────────────────────────────────

// const CORNER = 18;
// const THICK = 3;

// function Corner({
//   position,
//   color,
// }: {
//   position: "tl" | "tr" | "bl" | "br";
//   color: string;
// }) {
//   const isTop = position.startsWith("t");
//   const isLeft = position.endsWith("l");
//   return (
//     <View
//       style={{
//         position: "absolute",
//         top: isTop ? -2 : undefined,
//         bottom: !isTop ? -2 : undefined,
//         left: isLeft ? -2 : undefined,
//         right: !isLeft ? -2 : undefined,
//         width: CORNER,
//         height: CORNER,
//         borderTopWidth: isTop ? THICK : 0,
//         borderBottomWidth: !isTop ? THICK : 0,
//         borderLeftWidth: isLeft ? THICK : 0,
//         borderRightWidth: !isLeft ? THICK : 0,
//         borderColor: color,
//       }}
//     />
//   );
// }

// // ─── Progress ring ───────────────────────────────────────────────────────────

// const RING_SIZE = 64;
// const RING_SW = 5;
// const RING_R = (RING_SIZE - RING_SW) / 2;
// const RING_C = 2 * Math.PI * RING_R;

// function CaptureRing({ progress }: { progress: number }) {
//   return (
//     <Svg width={RING_SIZE} height={RING_SIZE}>
//       <Circle
//         cx={RING_SIZE / 2}
//         cy={RING_SIZE / 2}
//         r={RING_R}
//         stroke="#1E293B"
//         strokeWidth={RING_SW}
//         fill="none"
//       />
//       <Circle
//         cx={RING_SIZE / 2}
//         cy={RING_SIZE / 2}
//         r={RING_R}
//         stroke="#22D3EE"
//         strokeWidth={RING_SW}
//         fill="none"
//         strokeDasharray={RING_C}
//         strokeDashoffset={RING_C - RING_C * progress}
//         strokeLinecap="round"
//         rotation="-90"
//         origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
//       />
//     </Svg>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────────────────────

// export default function StripOverlay({
//   previewWidth,
//   previewHeight,
//   quality,
//   qrScanned,
//   captureProgress,
// }: StripOverlayProps) {
//   const frameWidth = STRIP_WIDTH;
//   const frameHeight = FINAL_STRIP_HEIGHT;
//   const frameLeft = (previewWidth - frameWidth) / 2;
//   const frameTop =
//     (previewHeight - frameHeight) / 2 - FRAME_TOP_OFFSET;

//   const frameColor = FRAME_COLORS[quality.state] ?? "#475569";
//   const hint = !qrScanned
//     ? QUALITY_HINTS.idle
//     : QUALITY_HINTS[quality.state] ?? "";

//   // Pulse animation when ready
//   const pulseAnim = useRef(new Animated.Value(0.7)).current;
//   const glowAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (quality.state === "ready") {
//       Animated.loop(
//         Animated.sequence([
//           Animated.timing(pulseAnim, {
//             toValue: 1,
//             duration: 600,
//             useNativeDriver: true,
//           }),
//           Animated.timing(pulseAnim, {
//             toValue: 0.7,
//             duration: 600,
//             useNativeDriver: true,
//           }),
//         ])
//       ).start();
//       Animated.timing(glowAnim, {
//         toValue: 1,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       pulseAnim.stopAnimation();
//       pulseAnim.setValue(0.7);
//       glowAnim.setValue(0);
//     }
//   }, [quality.state]);

//   return (
//     <View style={StyleSheet.absoluteFill} pointerEvents="none">
//       {/* ── Masks ── */}
//       {/* Top */}
//       <View
//         style={[
//           styles.mask,
//           { top: 0, left: 0, right: 0, height: frameTop },
//         ]}
//       />
//       {/* Bottom */}
//       <View
//         style={[
//           styles.mask,
//           { top: frameTop + frameHeight, bottom: 0, left: 0, right: 0 },
//         ]}
//       />
//       {/* Left */}
//       <View
//         style={[
//           styles.mask,
//           {
//             top: frameTop,
//             left: 0,
//             width: frameLeft,
//             height: frameHeight,
//           },
//         ]}
//       />
//       {/* Right */}
//       <View
//         style={[
//           styles.mask,
//           {
//             top: frameTop,
//             right: 0,
//             width: frameLeft,
//             height: frameHeight,
//           },
//         ]}
//       />

//       {/* ── Frame border + corners ── */}
//       <View
//         style={{
//           position: "absolute",
//           top: frameTop,
//           left: frameLeft,
//           width: frameWidth,
//           height: frameHeight,
//         }}
//       >
//         <Animated.View
//           style={[
//             styles.frameBorder,
//             {
//               borderColor: frameColor,
//               opacity: pulseAnim,
//             },
//           ]}
//         />
//         <Corner position="tl" color={frameColor} />
//         <Corner position="tr" color={frameColor} />
//         <Corner position="bl" color={frameColor} />
//         <Corner position="br" color={frameColor} />
//       </View>

//       {/* ── Scan line (moves up-down inside frame when ready) ── */}
//       {quality.state === "ready" && (
//         <ScanLine frameTop={frameTop} frameHeight={frameHeight} frameLeft={frameLeft} frameWidth={frameWidth} />
//       )}

//       {/* ── Hint text ── */}
//       <View
//         style={[
//           styles.hintContainer,
//           {
//             top: frameTop + frameHeight + 14,
//             left: 0,
//             right: 0,
//           },
//         ]}
//       >
//         <View
//           style={[
//             styles.hintBadge,
//             {
//               backgroundColor:
//                 quality.state === "ready"
//                   ? "rgba(34,211,238,0.18)"
//                   : "rgba(0,0,0,0.55)",
//               borderColor:
//                 quality.state === "ready" ? "#22D3EE" : "transparent",
//             },
//           ]}
//         >
//           <Text
//             style={[
//               styles.hintText,
//               { color: quality.state === "ready" ? "#22D3EE" : "#E2E8F0" },
//             ]}
//           >
//             {hint}
//           </Text>
//         </View>
//       </View>

//       {/* ── QR badge ── */}
//       {qrScanned && (
//         <View style={[styles.qrBadge, { top: frameTop - 40, left: frameLeft }]}>
//           <Text style={styles.qrBadgeText}>✓ QR Scanned</Text>
//         </View>
//       )}

//       {/* ── Capture progress ring ── */}
//       {captureProgress > 0 && (
//         <View
//           style={[
//             styles.ringContainer,
//             { top: frameTop + frameHeight / 2 - RING_SIZE / 2, left: frameLeft + frameWidth / 2 - RING_SIZE / 2 },
//           ]}
//         >
//           <CaptureRing progress={captureProgress} />
//         </View>
//       )}
//     </View>
//   );
// }

// // ─── Scan Line ────────────────────────────────────────────────────────────────

// function ScanLine({
//   frameTop,
//   frameHeight,
//   frameLeft,
//   frameWidth,
// }: {
//   frameTop: number;
//   frameHeight: number;
//   frameLeft: number;
//   frameWidth: number;
// }) {
//   const anim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(anim, {
//           toValue: 1,
//           duration: 1800,
//           useNativeDriver: true,
//         }),
//         Animated.timing(anim, {
//           toValue: 0,
//           duration: 1800,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();
//     return () => anim.stopAnimation();
//   }, []);

//   const translateY = anim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0, frameHeight - 2],
//   });

//   return (
//     <Animated.View
//       style={{
//         position: "absolute",
//         top: frameTop,
//         left: frameLeft,
//         width: frameWidth,
//         height: 2,
//         backgroundColor: "#22D3EE",
//         opacity: 0.7,
//         transform: [{ translateY }],
//         shadowColor: "#22D3EE",
//         shadowOffset: { width: 0, height: 0 },
//         shadowOpacity: 0.9,
//         shadowRadius: 6,
//       }}
//     />
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   mask: {
//     position: "absolute",
//     backgroundColor: "rgba(2,8,23,0.65)",
//   },
//   frameBorder: {
//     ...StyleSheet.absoluteFillObject,
//     borderWidth: 2,
//     borderRadius: 14,
//   },
//   hintContainer: {
//     position: "absolute",
//     alignItems: "center",
//   },
//   hintBadge: {
//     paddingHorizontal: 14,
//     paddingVertical: 6,
//     borderRadius: 20,
//     borderWidth: 1,
//   },
//   hintText: {
//     fontSize: 13,
//     fontWeight: "600",
//     letterSpacing: 0.2,
//   },
//   qrBadge: {
//     position: "absolute",
//     backgroundColor: "rgba(34,197,94,0.2)",
//     borderWidth: 1,
//     borderColor: "#22C55E",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   qrBadgeText: {
//     color: "#22C55E",
//     fontSize: 11,
//     fontWeight: "700",
//   },
//   ringContainer: {
//     position: "absolute",
//   },
// });
