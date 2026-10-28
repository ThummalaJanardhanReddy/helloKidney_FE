import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { useDoubleBackExit } from "@/src/services/useDoubleBackExit";
import { useUserStore } from "../stores/userStore";
import FloatingTabBar from "@/src/navigation/FloatingTabBar";
import { TabBarVisibilityProvider } from "@/src/navigation/tabBarVisibility";

// ── Replace with your real auth store / context ───────────────────────────────
// e.g. const { userType } = useAuthStore();
// const userType: "healthworker" | "patient" = "healthworker";

export default function MainLayout() {
  const userType = useUserStore((s) => s.user?.userType);
  const hasHydrated = useUserStore((s) => s.hasHydrated);

  if (!hasHydrated) return null;
  const isHealthWorker = userType === "healthworker";
  useDoubleBackExit();

  return (
    <TabBarVisibilityProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="home"
      >
      {/* ── Home — all users ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={21} color={color} />
          ),
        }}
      />

      {/* ── Tests — all users ── */}
      <Tabs.Screen
        name="tests"
        options={{
          title: "Tests",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flask" : "flask-outline"} size={21} color={color} />
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={21} color={color} />
          ),
        }}
      />

      {/* ── Profile — all users ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={21} color={color} />
          ),
        }}
      />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
