import { StyleSheet, Text as RNText, TextProps } from "react-native";

// Custom TrueType fonts loaded via expo-font (like Poppins here) don't get
// synthetic bold/weight faking the way system fonts do — setting
// `fontWeight` alongside `fontFamily: "Poppins-Regular"` silently does
// nothing. Map the requested weight to the matching loaded Poppins face
// instead, unless the caller already picked an explicit fontFamily.
const WEIGHT_TO_POPPINS_FAMILY: Record<string, string> = {
  "100": "Poppins-Regular",
  "200": "Poppins-Regular",
  "300": "Poppins-Regular",
  normal: "Poppins-Regular",
  "400": "Poppins-Regular",
  "500": "Poppins-Medium",
  "600": "Poppins-SemiBold",
  bold: "Poppins-Bold",
  "700": "Poppins-Bold",
  "800": "Poppins-ExtraBold",
  "900": "Poppins-Black",
};

export default function Text({ style, ...rest }: TextProps) {
  const flattened = StyleSheet.flatten(style) ?? {};
  const fontFamily =
    flattened.fontFamily ??
    WEIGHT_TO_POPPINS_FAMILY[String(flattened.fontWeight ?? "400")] ??
    "Poppins-Regular";

  return <RNText style={[{ fontFamily }, style]} {...rest} />;
}
