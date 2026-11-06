import * as Application from "expo-application";
import { Alert, Linking, Platform } from "react-native";

const IOS_APP_ID = "1619042064";
const IOS_BUNDLE_ID = "ai.hellokidney";
const ANDROID_PACKAGE_NAME = "ai.hellokidney";

const IOS_STORE_URL = `https://apps.apple.com/in/app/hellokidney/id${IOS_APP_ID}`;
const ANDROID_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;

// Returns 1 when `latest` is newer than `current`, -1 when older, 0 when equal.
const compareVersions = (current: string, latest: string) => {
  const c = current.split(".").map((n) => parseInt(n, 10) || 0);
  const l = latest.split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(c.length, l.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return 1;
    if (lv < cv) return -1;
  }
  return 0;
};

const fetchIosLatestVersion = async (): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${IOS_BUNDLE_ID}&_=${Date.now()}`,
    );
    const json = await res.json();
    return json?.results?.[0]?.version ?? null;
  } catch (e) {
    console.log("iOS store version lookup failed", e);
    return null;
  }
};

// Play Store has no public version-lookup API, so the listing page itself is
// fetched and the version is pulled out of the embedded page data.
const fetchAndroidLatestVersion = async (): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}&hl=en&gl=US`,
    );
    const html = await res.text();
    const match = html.match(/\[\[\["(\d+(?:\.\d+)+)"\]\]/);
    return match?.[1] ?? null;
  } catch (e) {
    console.log("Android store version lookup failed", e);
    return null;
  }
};

// Prompts the user to update when the version published on the App
// Store / Play Store is newer than the installed native build.
export const checkForStoreUpdate = async () => {
  try {
    if (__DEV__) return;

    const currentVersion = Application.nativeApplicationVersion;
    if (!currentVersion) return;

    const latestVersion =
      Platform.OS === "ios"
        ? await fetchIosLatestVersion()
        : await fetchAndroidLatestVersion();
    if (!latestVersion) return;

    if (compareVersions(currentVersion, latestVersion) > 0) {
      const storeUrl = Platform.OS === "ios" ? IOS_STORE_URL : ANDROID_STORE_URL;
      Alert.alert(
        "Update Available",
        `A new version (${latestVersion}) of HelloKidney is available. Update now for the latest features and fixes.`,
        [
          { text: "Later", style: "cancel" },
          { text: "Update", onPress: () => Linking.openURL(storeUrl) },
        ],
      );
    }
  } catch (e) {
    console.log("Store update check failed", e);
  }
};
