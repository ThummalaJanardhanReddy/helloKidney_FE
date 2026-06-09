// import { useCallback, useRef, useState } from "react";
// import { useFrameProcessor } from "react-native-vision-camera";
// import { useBarcodeScanner } from "react-native-vision-camera-barcode-scanner";
// import { runOnJS } from "react-native-reanimated";

// export function useQrScanner(onScanned?: (data: string) => void) {
//   const [qrData, setQrData] = useState<string | null>(null);
//   const [qrLocked, setQrLocked] = useState(false);
//   const lockedRef = useRef(false);

//   const handleQr = useCallback((data: string) => {
//     if (lockedRef.current) return;
//     lockedRef.current = true;
//     setQrLocked(true);
//     setQrData(data);
//     onScanned?.(data);
//   }, [onScanned]);

//   const { scanBarcodes } = useBarcodeScanner({ barcodeTypes: ["qr"] });

//   const frameProcessor = useFrameProcessor((frame) => {
//     "worklet";
//     const barcodes = scanBarcodes(frame);
//     if (barcodes.length > 0 && barcodes[0].value) {
//       runOnJS(handleQr)(barcodes[0].value);
//     }
//   }, [scanBarcodes, handleQr]);

//   const resetQr = useCallback(() => {
//     lockedRef.current = false;
//     setQrLocked(false);
//     setQrData(null);
//   }, []);

//   return { qrData, qrLocked, frameProcessor, resetQr };
// }