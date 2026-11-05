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
          title: "Test List",
          tabBarLabel: "Tests",
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

      {/* ── Profile — hidden from the tab bar for every role; reached via
          the menu icon on Home instead (see handleMenuPress / the header
          menu button in home.tsx, for both healthworker and patient). The
          floating tab bar itself is also hidden while inside it — same as
          Help Center below — since the screen has its own back button. ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          // null hides it from tab bar; screen still exists in the router
          href: null,
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={21} color={color} />
          ),
        }}
      />

      {/* ── Help Center — reachable from the Home header, not shown in the tab bar,
          and the floating tab bar itself is hidden while inside it ── */}
      <Tabs.Screen
        name="help"
        options={{
          title: "Help",
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
