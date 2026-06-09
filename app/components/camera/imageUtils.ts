// /**
//  * imageUtils.ts
//  *
//  * Crop helpers and upload logic extracted from the main screen.
//  */

// import * as ImageManipulator from "expo-image-manipulator";
// import { Dimensions } from "react-native";
// import axiosClient from "../../../src/services/axiosClient";

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// // ─── Strip frame geometry (must match StripOverlay) ──────────────────────────
// export const STRIP_WIDTH = SCREEN_WIDTH * 0.3;
// export const STRIP_HEIGHT = STRIP_WIDTH * 5; // 10:2 physical ratio
// export const FINAL_STRIP_HEIGHT = Math.min(STRIP_HEIGHT, SCREEN_HEIGHT * 0.72);
// export const FRAME_TOP_OFFSET = 60;

// // ─── Crop ────────────────────────────────────────────────────────────────────

// export interface PreviewLayout {
//   width: number;
//   height: number;
// }

// /**
//  * Crops a full camera photo down to just the strip frame region shown in the
//  * viewfinder overlay, accounting for the difference between preview and sensor
//  * aspect ratios.
//  */
// export async function cropToStripFrame(
//   photo: { uri: string; width: number; height: number },
//   previewLayout: PreviewLayout
// ): Promise<{ uri: string }> {
//   const { width: previewWidth, height: previewHeight } = previewLayout;
//   const { width: imageWidth, height: imageHeight } = photo;

//   const frameWidth = STRIP_WIDTH;
//   const frameHeight = FINAL_STRIP_HEIGHT;
//   const frameLeft = (previewWidth - frameWidth) / 2;
//   const frameTop =
//     (previewHeight - frameHeight) / 2 - FRAME_TOP_OFFSET;

//   // Compute scale between sensor and preview
//   const previewAspect = previewWidth / previewHeight;
//   const imageAspect = imageWidth / imageHeight;

//   let scaleX: number,
//     scaleY: number,
//     offsetX = 0,
//     offsetY = 0;

//   if (imageAspect > previewAspect) {
//     scaleY = imageHeight / previewHeight;
//     scaleX = scaleY;
//     offsetX = (imageWidth - previewWidth * scaleX) / 2;
//   } else {
//     scaleX = imageWidth / previewWidth;
//     scaleY = scaleX;
//     offsetY = (imageHeight - previewHeight * scaleY) / 2;
//   }

//   const cropX = Math.round(frameLeft * scaleX + offsetX);
//   const cropY = Math.round(frameTop * scaleY + offsetY);
//   const cropWidth = Math.round(frameWidth * scaleX);
//   const cropHeight = Math.round(frameHeight * scaleY);

//   const safeCropX = Math.max(0, cropX);
//   const safeCropY = Math.max(0, cropY);
//   const safeCropWidth = Math.min(cropWidth, imageWidth - safeCropX);
//   const safeCropHeight = Math.min(cropHeight, imageHeight - safeCropY);

//   return ImageManipulator.manipulateAsync(
//     photo.uri,
//     [
//       {
//         crop: {
//           originX: safeCropX,
//           originY: safeCropY,
//           width: safeCropWidth,
//           height: safeCropHeight,
//         },
//       },
//     ],
//     { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
//   );
// }

// // ─── Upload ──────────────────────────────────────────────────────────────────

// export interface UploadPayload {
//   photoUri: string;
//   userEmail: string;
//   userId: string;
//   userType: string;
//   qrData: string;
//   patientId: string;
// }

// export interface UploadResult {
//   success: boolean;
//   data?: any;
//   message: string;
// }

// export async function uploadStripPhoto(
//   payload: UploadPayload
// ): Promise<UploadResult> {
//   const formData = new FormData();

//   formData.append("image", {
//     uri: payload.photoUri,
//     name: "urine_test.jpg",
//     type: "image/jpeg",
//   } as any);
//   formData.append("email_id", payload.userEmail);
//   formData.append("qr_code", payload.qrData);
//   formData.append("role", payload.userType);
//   formData.append("hw_id", payload.userId);
//   formData.append("patient_id", payload.patientId);

//   try {
//     const response = await axiosClient.post("/users/process-test", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//     return { success: true, data: response, message: "Successfully Completed" };
//   } catch (error: any) {
//     const message = extractErrorMessage(error);
//     return { success: false, message };
//   }
// }

// function extractErrorMessage(error: any): string {
//   const fallback =
//     "Something went wrong. Please wait 10 seconds and try again.";
//   const detail = error?.response?.data?.detail;
//   if (!detail) return fallback;

//   try {
//     if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(", ");
//     if (typeof detail === "string") {
//       try {
//         const parsed = JSON.parse(detail);
//         return parsed?.detail || parsed?.message || detail;
//       } catch {
//         return detail;
//       }
//     }
//     return detail?.detail || detail?.message || fallback;
//   } catch {
//     return fallback;
//   }
// }
