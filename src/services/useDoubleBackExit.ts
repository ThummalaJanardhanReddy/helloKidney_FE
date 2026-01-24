import { useEffect, useRef } from "react";
import { BackHandler, ToastAndroid } from "react-native";

export function useDoubleBackExit() {
  const backPressedOnce = useRef(false);

  useEffect(() => {
    const onBackPress = () => {
      if (backPressedOnce.current) {
        BackHandler.exitApp(); // ✅ Exit app (no logout)
        return true;
      }

      backPressedOnce.current = true;
      ToastAndroid.show("Press again to exit", ToastAndroid.SHORT);

      setTimeout(() => {
        backPressedOnce.current = false;
      }, 2000);

      return true; // ⛔ prevent default navigation
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => subscription.remove();
  }, []);
}
