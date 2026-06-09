// /**
//  * TimerCameraUploader.tsx  (Entry point – replaces the original file)
//  *
//  * Orchestrates:
//  *   1. 60-second countdown (dip strip, wait)
//  *   2. Camera screen with auto-capture + quality checks
//  *   3. Navigation to result screen
//  *
//  * The heavy camera logic lives in CameraScreen.tsx so this file stays clean.
//  */

// import { router } from "expo-router";
// import { useNavigation } from "expo-router";
// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import {
//   Animated,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Svg, { Circle } from "react-native-svg";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// import BackButton from "../../shared/BackButton";
// import PrimaryButton from "../../shared/PrimaryButton";
// import CommonModal from "../../shared/CommonModel";
// import WarningModal from "../../shared/WarningModal";
// import CameraScreen from "./CameraScreen";
// import { colors } from "../../shared/commonStyles";
// import { useUserStore } from "../../stores/userStore";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const TOTAL_TIME = 60;

// // ─── Progress circle helpers ──────────────────────────────────────────────────

// const CIRCLE_SIZE = 180;
// const STROKE_WIDTH = 18;
// const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
// const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// // ─── Component ────────────────────────────────────────────────────────────────

// type Screen = "timer" | "camera";

// export default function TimerCameraUploader() {
//   const insets = useSafeAreaInsets();
//   const navigation = useNavigation();
//   const patient = useUserStore((s) => s.patient);

//   const [screen, setScreen] = useState<Screen>("timer");
//   const [started, setStarted] = useState(false);
//   const [countdown, setCountdown] = useState(TOTAL_TIME);
//   const [showExitModal, setShowExitModal] = useState(false);

//   // ── Countdown ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!started || countdown === 0) return;
//     const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
//     return () => clearTimeout(t);
//   }, [started, countdown]);

//   useEffect(() => {
//     if (started && countdown === 0) {
//       setStarted(false);
//       setScreen("camera");
//     }
//   }, [countdown, started]);

//   const progress = countdown / TOTAL_TIME;
//   const strokeDashoffset = CIRCUMFERENCE - CIRCUMFERENCE * progress;

//   // ── Handlers ───────────────────────────────────────────────────────────────

//   const handleStartTimer = () => {
//     setCountdown(TOTAL_TIME);
//     setStarted(true);
//   };

//   const handleBackPress = useCallback(() => {
//     if (started || screen === "camera") {
//       setShowExitModal(true);
//     } else {
//       navigation.goBack();
//     }
//   }, [started, screen]);

//   const handleExitConfirm = useCallback(() => {
//     setShowExitModal(false);
//     setScreen("timer");
//     setStarted(false);
//     setCountdown(TOTAL_TIME);
//   }, []);

//   const handleSuccess = useCallback(
//     (resultData: any, patientData: any) => {
//       router.replace({
//         pathname: "/components/test-result",
//         params: {
//           result: JSON.stringify(resultData),
//           refresh: "true",
//           patient: JSON.stringify(patientData),
//         },
//       });
//     },
//     []
//   );

//   const handleCameraBack = useCallback(() => {
//     setShowExitModal(true);
//   }, []);

//   // ── Camera screen ───────────────────────────────────────────────────────────
//   if (screen === "camera") {
//     return (
//       <>
//         <CameraScreen onBack={handleCameraBack} onSuccess={handleSuccess} />
//         <CommonModal
//           visible={showExitModal}
//           title="Leave Test?"
//           message="Going back will cancel the current test session."
//           confirmText="Stay"
//           cancelText="Exit"
//           onConfirm={() => setShowExitModal(false)}
//           onCancel={() => {
//             setShowExitModal(false);
//             setScreen("timer");
//             setStarted(false);
//             setCountdown(TOTAL_TIME);
//           }}
//           confirmButtonStyle={{
//             backgroundColor: colors.blue,
//             borderWidth: 1,
//             borderColor: colors.blue,
//           }}
//           confirmTextStyle={{ color: colors.white }}
//           cancelButtonStyle={{ backgroundColor: colors.gray }}
//           cancelTextStyle={{ color: colors.black }}
//         />
//       </>
//     );
//   }

//   // ── Timer screen ────────────────────────────────────────────────────────────
//   return (
//     <View style={[styles.root, { paddingTop: insets.top }]}>
//       <BackButton
//         title="Back"
//         onPress={handleBackPress}
//         arrowColor={colors.white}
//         color={colors.white}
//         style={styles.backBtn}
//       />

//       <View style={styles.body}>
//         {/* ── Heading ── */}
//         <Text style={styles.heading}>Kidney Strip Test</Text>
//         <Text style={styles.subheading}>
//           Dip the test strip and wait for the timer to complete before scanning.
//         </Text>

//         {/* ── Progress circle ── */}
//         <View style={styles.circleWrapper}>
//           <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
//             {/* Track */}
//             <Circle
//               stroke="#1E293B"
//               fill="none"
//               cx={CIRCLE_SIZE / 2}
//               cy={CIRCLE_SIZE / 2}
//               r={RADIUS}
//               strokeWidth={STROKE_WIDTH}
//             />
//             {/* Progress */}
//             <Circle
//               stroke={started ? "#22D3EE" : "#334155"}
//               fill="none"
//               cx={CIRCLE_SIZE / 2}
//               cy={CIRCLE_SIZE / 2}
//               r={RADIUS}
//               strokeWidth={STROKE_WIDTH}
//               strokeDasharray={CIRCUMFERENCE}
//               strokeDashoffset={strokeDashoffset}
//               strokeLinecap="round"
//               rotation="90"
//               origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
//               scaleX={-1}
//             />
//           </Svg>

//           {/* Centre text */}
//           <View style={styles.circleCenter}>
//             <Text style={[styles.countdownNum, started && styles.countdownActive]}>
//               {countdown}
//             </Text>
//             <Text style={styles.countdownLabel}>sec</Text>
//           </View>
//         </View>

//         {/* ── Status pills ── */}
//         <View style={styles.pillRow}>
//           <StatusPill
//             icon="⏱"
//             label="Wait 60s"
//             active={!started && countdown === TOTAL_TIME}
//           />
//           <View style={styles.pillDivider} />
//           <StatusPill icon="📷" label="Scan strip" active={false} />
//           <View style={styles.pillDivider} />
//           <StatusPill icon="✅" label="Upload" active={false} />
//         </View>
//       </View>

//       {/* ── Instruction card ── */}
//       <View style={styles.instructionCard}>
//         <View style={styles.instructionRow}>
//           <View style={styles.instructionBullet}><Text style={styles.bulletText}>1</Text></View>
//           <Text style={styles.instructionText}>
//             Dip the test strip in urine for <Text style={styles.bold}>2 seconds</Text>
//           </Text>
//         </View>
//         <View style={styles.instructionRow}>
//           <View style={styles.instructionBullet}><Text style={styles.bulletText}>2</Text></View>
//           <Text style={styles.instructionText}>
//             Lay flat and press <Text style={styles.bold}>Start Timer</Text>
//           </Text>
//         </View>
//         <View style={styles.instructionRow}>
//           <View style={styles.instructionBullet}><Text style={styles.bulletText}>3</Text></View>
//           <Text style={styles.instructionText}>
//             When timer ends, scan the <Text style={styles.bold}>QR code</Text> then auto-photo fires
//           </Text>
//         </View>
//       </View>

//       {/* ── CTA ── */}
//       <PrimaryButton
//         title={started ? `Waiting… ${countdown}s` : "Start Timer"}
//         onPress={handleStartTimer}
//         disabled={started}
//         style={[styles.cta, { marginBottom: insets.bottom + 20 }]}
//         textStyle={{ color: "#fff", fontWeight: "700" }}
//       />

//       {/* ── Exit modal ── */}
//       <CommonModal
//         visible={showExitModal}
//         title="Cancel Test?"
//         message="Are you sure you want to leave? The timer will reset."
//         confirmText="Stay"
//         cancelText="Exit"
//         onConfirm={() => setShowExitModal(false)}
//         onCancel={() => {
//           setShowExitModal(false);
//           navigation.goBack();
//         }}
//         confirmButtonStyle={{
//           backgroundColor: colors.blue,
//           borderWidth: 1,
//           borderColor: colors.blue,
//         }}
//         confirmTextStyle={{ color: colors.white }}
//         cancelButtonStyle={{ backgroundColor: colors.gray }}
//         cancelTextStyle={{ color: colors.black }}
//       />
//     </View>
//   );
// }

// // ─── Status Pill ──────────────────────────────────────────────────────────────

// function StatusPill({
//   icon,
//   label,
//   active,
// }: {
//   icon: string;
//   label: string;
//   active: boolean;
// }) {
//   return (
//     <View style={[styles.pill, active && styles.pillActive]}>
//       <Text style={styles.pillIcon}>{icon}</Text>
//       <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
//         {label}
//       </Text>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: "#020817",
//   },
//   backBtn: {
//     paddingTop: 16,
//     paddingHorizontal: 20,
//   },
//   body: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 24,
//   },
//   heading: {
//     color: "#F1F5F9",
//     fontSize: 26,
//     fontWeight: "800",
//     letterSpacing: -0.5,
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   subheading: {
//     color: "#64748B",
//     fontSize: 14,
//     textAlign: "center",
//     lineHeight: 22,
//     marginBottom: 36,
//     maxWidth: 300,
//   },
//   circleWrapper: {
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 32,
//   },
//   circleCenter: {
//     position: "absolute",
//     alignItems: "center",
//   },
//   countdownNum: {
//     fontSize: 48,
//     fontWeight: "800",
//     color: "#334155",
//   },
//   countdownActive: {
//     color: "#22D3EE",
//   },
//   countdownLabel: {
//     fontSize: 14,
//     color: "#475569",
//     marginTop: -4,
//     fontWeight: "600",
//   },
//   pillRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   pill: {
//     alignItems: "center",
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//     gap: 4,
//   },
//   pillActive: {
//     backgroundColor: "rgba(34,211,238,0.1)",
//   },
//   pillDivider: {
//     width: 24,
//     height: 1,
//     backgroundColor: "#1E293B",
//   },
//   pillIcon: {
//     fontSize: 20,
//   },
//   pillLabel: {
//     fontSize: 11,
//     color: "#475569",
//     fontWeight: "600",
//   },
//   pillLabelActive: {
//     color: "#22D3EE",
//   },
//   instructionCard: {
//     marginHorizontal: 20,
//     marginBottom: 20,
//     backgroundColor: "#0F172A",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "rgba(148,163,184,0.1)",
//     gap: 14,
//   },
//   instructionRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//   },
//   instructionBullet: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "#1E293B",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 1,
//   },
//   bulletText: {
//     color: "#22D3EE",
//     fontSize: 12,
//     fontWeight: "700",
//   },
//   instructionText: {
//     flex: 1,
//     color: "#94A3B8",
//     fontSize: 14,
//     lineHeight: 22,
//   },
//   bold: {
//     color: "#F1F5F9",
//     fontWeight: "600",
//   },
//   cta: {
//     marginHorizontal: 20,
//     borderRadius: 12,
//     backgroundColor: "#0EA5E9",
//   },
// });
