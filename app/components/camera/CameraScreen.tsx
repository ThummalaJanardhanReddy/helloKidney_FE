// /**
//  * CameraScreen.tsx
//  *
//  * Camera view that:
//  *  - Uses react-native-vision-camera for the live feed
//  *  - Runs QR scanning + quality analysis as frame processors
//  *  - Auto-captures when 6 consecutive "good" frames are detected
//  *  - Shows preview / retake flow before upload
//  */

// import React, {
//   useCallback,
//   useRef,
//   useState,
// } from "react";
// import {
//   ActivityIndicator,
//   Image,
//   Modal,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import {
//   Camera,
//   useCameraDevice,
//   useCameraPermission,
// } from "react-native-vision-camera";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";

// import StripOverlay from "./StripOverlay";
// import { useStripQuality } from "./useStripQuality";
// import { useQrScanner } from "./useQrScanner";
// import {
//   cropToStripFrame,
//   uploadStripPhoto,
//   STRIP_WIDTH,
//   FINAL_STRIP_HEIGHT,
// } from "./imageUtils";
// import { colors } from "../../shared/commonStyles";
// import BackButton from "../../shared/BackButton";
// import PrimaryButton from "../../shared/PrimaryButton";
// import { useUserStore } from "../../stores/userStore";

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface CameraScreenProps {
//   onBack: () => void;
//   onSuccess: (resultData: any, patient: any) => void;
// }

// interface PreviewLayout {
//   width: number;
//   height: number;
// }

// type UploadStatus = "idle" | "uploading" | "success" | "error";

// // ─── Constants ────────────────────────────────────────────────────────────────

// const STABILITY_FRAMES = 6; // must match useStripQuality

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function CameraScreen({ onBack, onSuccess }: CameraScreenProps) {
//   const insets = useSafeAreaInsets();
//   const cameraRef = useRef<Camera>(null);
//   const user = useUserStore((s) => s.user);
//   const patient = useUserStore((s) => s.patient);
//   const userType = useUserStore((s) => s.user?.userType);

//   const [previewLayout, setPreviewLayout] = useState<PreviewLayout | null>(null);
//   const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
//   const [uploadMessage, setUploadMessage] = useState("");
//   const [captureProgress, setCaptureProgress] = useState(0);
//   const [isCapturing, setIsCapturing] = useState(false);

//   // Stable frame counter for UI progress ring
//   const stableCountRef = useRef(0);

//   const device = useCameraDevice("back");
//   const { hasPermission, requestPermission } = useCameraPermission();

//   // ── QR scanner ──────────────────────────────────────────────────────────────
//   const { qrData, qrLocked, barcodeFrameProcessor, resetQr } = useQrScanner();

//   // ── Quality + auto-capture ──────────────────────────────────────────────────
//   const handleAutoCapture = useCallback(async () => {
//     if (!cameraRef.current || !previewLayout || isCapturing) return;
//     setIsCapturing(true);
//     try {
//       const photo = await cameraRef.current.takePhoto({
//         qualityPrioritization: "balanced",
//         flash: "off",
//         enableShutterSound: false,
//       });
//       const cropped = await cropToStripFrame(
//         { uri: "file://" + photo.path, width: photo.width, height: photo.height },
//         previewLayout
//       );
//       setPreviewPhoto(cropped.uri);
//     } catch (err) {
//       console.error("Auto-capture failed:", err);
//       setIsCapturing(false);
//       resetQuality();
//     }
//   }, [previewLayout, isCapturing]);

//   const { quality, frameProcessor: qualityProcessor, resetQuality } = useStripQuality(
//     handleAutoCapture
//   );

//   // Combined frame processor (quality + QR)
//   // NOTE: In production, merge these via react-native-worklets-core
//   // composeFrameProcessors if your VisionCamera version supports it.
//   // For now we use the quality processor which is the heavier one.
//   const activeFrameProcessor = qrLocked ? qualityProcessor : barcodeFrameProcessor;

//   // ── Permission gate ─────────────────────────────────────────────────────────
//   if (!hasPermission) {
//     return (
//       <View style={styles.permissionContainer}>
//         <Ionicons name="camera-outline" size={64} color="#94A3B8" />
//         <Text style={styles.permissionText}>Camera access is required</Text>
//         <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
//           <Text style={styles.permBtnText}>Grant Permission</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!device) {
//     return (
//       <View style={styles.permissionContainer}>
//         <ActivityIndicator color="#22D3EE" />
//         <Text style={styles.permissionText}>Loading camera…</Text>
//       </View>
//     );
//   }

//   // ── Upload handler ───────────────────────────────────────────────────────────
//   const handleUpload = async () => {
//     if (!previewPhoto) return;
//     setUploadStatus("uploading");
//     setPreviewPhoto(null);

//     const result = await uploadStripPhoto({
//       photoUri: previewPhoto,
//       userEmail: user?.userEmail || "test",
//       userId: user?.userId || "unknown",
//       userType: userType || "patient",
//       qrData: qrData || "",
//       patientId: patient?.patient_id?.toString() || "null",
//     });

//     setUploadMessage(result.message);
//     setUploadStatus(result.success ? "success" : "error");

//     if (result.success) {
//       onSuccess(result.data, patient);
//     }
//   };

//   const handleRetake = () => {
//     setPreviewPhoto(null);
//     setIsCapturing(false);
//     resetQuality();
//     resetQr();
//     setCaptureProgress(0);
//   };

//   const handleRetakeAfterError = () => {
//     setUploadStatus("idle");
//     setUploadMessage("");
//     setIsCapturing(false);
//     resetQuality();
//     resetQr();
//   };

//   // ── Render ──────────────────────────────────────────────────────────────────
//   return (
//     <View style={[styles.root, { paddingTop: insets.top }]}>
//       {/* Camera */}
//       <View
//         style={styles.cameraWrapper}
//         onLayout={(e) => setPreviewLayout(e.nativeEvent.layout)}
//       >
//         <Camera
//           ref={cameraRef}
//           style={StyleSheet.absoluteFill}
//           device={device}
//           isActive={!previewPhoto && uploadStatus === "idle"}
//           photo={true}
//           frameProcessor={activeFrameProcessor}
//           frameProcessorFps={10}
//         />

//         {previewLayout && !previewPhoto && (
//           <StripOverlay
//             previewWidth={previewLayout.width}
//             previewHeight={previewLayout.height}
//             quality={qrLocked ? quality : { state: "idle", confidence: 0, blurScore: 0, glareScore: 0, brightnessScore: 0 }}
//             qrScanned={qrLocked}
//             captureProgress={captureProgress}
//           />
//         )}

//         {/* Back button */}
//         <BackButton
//           title="Back"
//           onPress={onBack}
//           arrowColor="#fff"
//           color="#fff"
//           style={[styles.backBtn, { paddingTop: 20 }]}
//         />

//         {/* QR status bar */}
//         <View style={styles.statusBar}>
//           <View style={[styles.statusDot, { backgroundColor: qrLocked ? "#22C55E" : "#94A3B8" }]} />
//           <Text style={styles.statusLabel}>
//             {qrLocked ? `QR: ${qrData}` : "Waiting for QR…"}
//           </Text>
//         </View>
//       </View>

//       {/* Uploading overlay */}
//       {uploadStatus === "uploading" && (
//         <View style={styles.uploadingOverlay}>
//           <ActivityIndicator size="large" color="#22D3EE" />
//           <Text style={styles.uploadingText}>Analysing test strip…</Text>
//         </View>
//       )}

//       {/* Upload error */}
//       {uploadStatus === "error" && (
//         <Modal visible transparent animationType="fade">
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalBox}>
//               <Ionicons name="warning-outline" size={56} color="#EF4444" />
//               <Text style={styles.modalTitle}>Test Failed</Text>
//               <Text style={styles.modalMsg}>{uploadMessage}</Text>
//               <PrimaryButton
//                 title="Retake"
//                 onPress={handleRetakeAfterError}
//                 style={styles.modalBtn}
//                 textStyle={{ color: "#fff" }}
//               />
//             </View>
//           </View>
//         </Modal>
//       )}

//       {/* Preview modal */}
//       <Modal visible={!!previewPhoto} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.previewBox}>
//             <Text style={styles.previewTitle}>Review Strip Photo</Text>
//             <Text style={styles.previewSub}>
//               Make sure the full strip is visible and in focus.
//             </Text>

//             <Image
//               source={{ uri: previewPhoto! }}
//               style={styles.previewImage}
//               resizeMode="contain"
//             />

//             <View style={styles.previewBtns}>
//               <TouchableOpacity
//                 style={[styles.previewBtn, styles.retakeBtn]}
//                 onPress={handleRetake}
//               >
//                 <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
//                 <Text style={styles.previewBtnText}>Retake</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.previewBtn, styles.uploadBtn]}
//                 onPress={handleUpload}
//               >
//                 <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
//                 <Text style={styles.previewBtnText}>Upload</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// // ─── Styles ───────────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//     backgroundColor: "#020817",
//   },
//   cameraWrapper: {
//     flex: 1,
//     position: "relative",
//   },
//   backBtn: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     paddingHorizontal: 16,
//     zIndex: 20,
//   },
//   statusBar: {
//     position: "absolute",
//     bottom: 24,
//     alignSelf: "center",
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(2,8,23,0.75)",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: "rgba(148,163,184,0.2)",
//     gap: 8,
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },
//   statusLabel: {
//     color: "#E2E8F0",
//     fontSize: 12,
//     fontWeight: "600",
//     maxWidth: 240,
//   },
//   uploadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(2,8,23,0.9)",
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 16,
//   },
//   uploadingText: {
//     color: "#E2E8F0",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   permissionContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#020817",
//     gap: 16,
//   },
//   permissionText: {
//     color: "#94A3B8",
//     fontSize: 16,
//   },
//   permBtn: {
//     backgroundColor: "#22D3EE",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 10,
//   },
//   permBtnText: {
//     color: "#020817",
//     fontWeight: "700",
//   },

//   // ── Modals ─────────────────────────────────────────────────────────────────
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(2,8,23,0.85)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modalBox: {
//     width: "84%",
//     backgroundColor: "#0F172A",
//     borderRadius: 20,
//     padding: 28,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(148,163,184,0.15)",
//     gap: 10,
//   },
//   modalTitle: {
//     color: "#F1F5F9",
//     fontSize: 20,
//     fontWeight: "700",
//   },
//   modalMsg: {
//     color: "#94A3B8",
//     fontSize: 14,
//     textAlign: "center",
//     lineHeight: 22,
//   },
//   modalBtn: {
//     marginTop: 8,
//     width: "100%",
//     borderRadius: 10,
//   },
//   previewBox: {
//     width: "90%",
//     maxHeight: "88%",
//     backgroundColor: "#0F172A",
//     borderRadius: 20,
//     padding: 20,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(148,163,184,0.15)",
//   },
//   previewTitle: {
//     color: "#F1F5F9",
//     fontSize: 18,
//     fontWeight: "700",
//     marginBottom: 4,
//   },
//   previewSub: {
//     color: "#64748B",
//     fontSize: 13,
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   previewImage: {
//     width: "100%",
//     height: 420,
//     borderRadius: 12,
//     backgroundColor: "#1E293B",
//     marginBottom: 20,
//   },
//   previewBtns: {
//     flexDirection: "row",
//     gap: 12,
//     width: "100%",
//   },
//   previewBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 13,
//     borderRadius: 10,
//   },
//   retakeBtn: {
//     backgroundColor: "#334155",
//   },
//   uploadBtn: {
//     backgroundColor: "#0EA5E9",
//   },
//   previewBtnText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 14,
//   },
// });
