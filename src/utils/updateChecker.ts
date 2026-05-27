import * as Application from "expo-application";
import { Alert, Linking, Platform } from "react-native";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.yourapp";

const APP_STORE_URL = "https://apps.apple.com/app/idYOUR_APP_ID";

export const checkAppUpdate = async () => {
  try {
    // Current app version
    const currentVersion = Application.nativeApplicationVersion;

    // Backend API call
    const response = await fetch("https://yourapi.com/app-version");

    const data = await response.json();

    const latestVersion = data.latestVersion;

    const forceUpdate = data.forceUpdate;

    // Compare
    if (currentVersion !== latestVersion) {
      Alert.alert(
        "Update Available",
        forceUpdate
          ? "Please update the app to continue."
          : "A new version is available.",

        [
          {
            text: "Update",
            onPress: () => {
              Linking.openURL(
                Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL,
              );
            },
          },
        ],

        {
          cancelable: !forceUpdate,
        },
      );
    }
  } catch (error) {
    console.log("Update check failed", error);
  }
};

export const isUpdateRequired = (current: string, latest: string) => {
  const c = current.split(".").map(Number);

  const l = latest.split(".").map(Number);

  for (let i = 0; i < l.length; i++) {
    if ((l[i] || 0) > (c[i] || 0)) {
      return true;
    }

    if ((l[i] || 0) < (c[i] || 0)) {
      return false;
    }
  }

  return false;
};
