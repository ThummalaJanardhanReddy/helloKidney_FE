import { Tabs } from "expo-router";
import React from "react";
import { Image } from "react-native";

import { useDoubleBackExit } from "@/src/services/useDoubleBackExit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabsImages } from "../../assets";
import { colors } from "../shared/commonStyles";
import { useUserStore } from "../stores/userStore";

// ── Replace with your real auth store / context ───────────────────────────────
// e.g. const { userType } = useAuthStore();
// const userType: "healthworker" | "patient" = "healthworker";

export default function MainLayout() {
  const insets = useSafeAreaInsets();
  const userType = useUserStore((s) => s.user?.userType);
  const hasHydrated = useUserStore((s) => s.hasHydrated);

  if (!hasHydrated) return null;
  const isHealthWorker = userType === "healthworker";
  useDoubleBackExit();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarIconStyle: {
          justifyContent: "center",
          alignItems: "center",
          marginTop: 0,
        },
        tabBarLabelStyle: {
          // marginTop: 2,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: colors.bg_home,
          borderTopWidth: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
          // paddingTop: 7,
        },
      }}
      initialRouteName="home"
    >
      {/* ── Home — all users ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={tabsImages.home}
              style={{ width: 18, height: 18, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* ── Tests — all users ── */}
      <Tabs.Screen
        name="tests"
        options={{
          title: "Tests",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={tabsImages.tests}
              style={{ width: 18, height: 18, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* ── Patients — healthworker only ── */}
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          // null hides it from tab bar; screen still exists in the router
          href: isHealthWorker ? "/patients" : null,
          tabBarIcon: ({ color, size }) => (
            <Image
              source={tabsImages.patients}
              style={{ width: 18, height: 18, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* ── Profile — all users ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={tabsImages.profile}
              style={{ width: 18, height: 18, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
