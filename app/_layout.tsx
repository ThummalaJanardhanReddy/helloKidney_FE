import { AuthProvider } from "@/src/services/authContext";
import { checkForUpdates } from "@/src/utils/helper";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
    "Poppins-ExtraBold": Poppins_800ExtraBold,
    "Poppins-Black": Poppins_900Black,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    // Hide splash when fonts and app are ready
    SplashScreen.hideAsync();
    checkForUpdates();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <KeyboardProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            {/* Bottom-sheet style "who is this test for?" picker — overlays
                the screen it was opened from instead of covering it. */}
            <Stack.Screen
              name="components/start-test"
              options={{
                presentation: "transparentModal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </KeyboardProvider>
    </AuthProvider>
  );
}
