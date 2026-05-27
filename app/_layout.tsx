import { AuthProvider } from "@/src/services/authContext";
import { checkForUpdates } from "@/src/utils/helper";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash when app is ready
    SplashScreen.hideAsync();
    checkForUpdates();
  }, []);

  return (
    <AuthProvider>
      <KeyboardProvider>
        {/* <SafeAreaProvider> */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        {/* </SafeAreaProvider> */}
      </KeyboardProvider>
    </AuthProvider>
  );
}
