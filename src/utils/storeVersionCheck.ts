import * as Application from "expo-application";
import { Alert, Linking, Platform } from "react-native";

// Apple has no public API for TestFlight build numbers (itunes.apple.com's
// lookup API only reflects the live, publicly-released App Store listing),
// and comparing marketing version alone misses build-only bumps (e.g.
// 51 -> 52 with the same "2.1.18" version). So the "latest build" is read
// straight from this repo's app.json on `main` — the same file already
// bumped for every TestFlight/Play upload — instead of any store API.
const APP_JSON_URL =
  "https://raw.githubusercontent.com/ThummalaJanardhanReddy/helloKidney_FE/main/app.json";

const ANDROID_PACKAGE_NAME = "ai.hellokidney";
// iOS has no direct "open this app's TestFlight page" deep link (that needs
// a per-build public invite code) — itms-beta:// just opens the TestFlight
// app itself, which is the closest a tester can get to "go update".
const IOS_UPDATE_URL = "itms-beta://";
const ANDROID_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

// Prompts the user to update when the build number committed to app.json on
// `main` is newer than the installed native build.
export const checkForStoreUpdate = async () => {
  try {
    if (__DEV__) return;

    const currentBuild = parseInt(Application.nativeBuildVersion || "", 10);
    if (!currentBuild) return;

    const res = await fetch(APP_JSON_URL, {
      headers: { "Cache-Control": "no-cache" },
    });
    const json = await res.json();
    const expoConfig = json?.expo;
    const latestBuildRaw =
      Platform.OS === "ios"
        ? expoConfig?.ios?.buildNumber
        : expoConfig?.android?.versionCode;
    const latestBuild = parseInt(String(latestBuildRaw ?? ""), 10);
    if (!latestBuild || latestBuild <= currentBuild) return;

    const updateUrl = Platform.OS === "ios" ? IOS_UPDATE_URL : ANDROID_STORE_URL;
    Alert.alert(
      "Update Available",
      "A new build of HelloKidney is available. Update now for the latest features and fixes.",
      [
        { text: "Later", style: "cancel" },
        { text: "Update", onPress: () => Linking.openURL(updateUrl) },
      ],
    );
  } catch (e) {
    console.log("Store update check failed", e);
  }
};
