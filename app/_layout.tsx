import { AuthProvider } from "@/src/services/authContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash when app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <KeyboardProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </KeyboardProvider>
    </AuthProvider>
  );
}
