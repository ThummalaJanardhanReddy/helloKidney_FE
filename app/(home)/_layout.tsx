import { router, Tabs, usePathname } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image } from "react-native";

import { useDoubleBackExit } from "@/src/services/useDoubleBackExit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabsImages } from "../../assets";
import { colors } from "../shared/commonStyles";

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState(0);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  // const { isAuthenticated, isLoading } = useAuth();
  useDoubleBackExit();
  // Tab configuration
  const tabs = useMemo(
    () => [
      { key: "home", title: "Home", image: tabsImages.home, route: "/home" },
      {
        key: "tests",
        title: "Tests",
        image: tabsImages.tests,
        route: "/tests",
      },
      {
        key: "profile",
        title: "Profile",
        image: tabsImages.profile,
        route: "/profile",
      },
    ],
    [],
  );

  // Update active tab based on current route
  useEffect(() => {
    const currentTabIndex = tabs.findIndex((tab) => tab.route === pathname);
    if (currentTabIndex !== -1) {
      setActiveTab(currentTabIndex);
    }
  }, [pathname, tabs]);

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveTab(index);
      const tab = tabs[index];

      // Navigate to the tab's route
      router.push(tab.route as any);
    },
    [tabs],
  );

  // useEffect(() => {
  //   if (isLoading) console.log("Auth loading...");
  //   if (!isAuthenticated)
  //     console.log("User not authenticated, redirecting to welcome...");
  // }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        // tabBarInactiveTintColor: "#FFFFFF70",
        // 🔥 Forced centering at the ICON CONTAINER level
        tabBarIconStyle: {
          justifyContent: "center",
          alignItems: "center",
          marginTop: 0,
          // borderWidth: 1,
          // borderColor: "red",
        },

        // 🔥 Align label close to icon
        tabBarLabelStyle: {
          marginTop: 2,
          // color: '#fff'
        },

        // 🔥 Outer tab item container
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },

        // 🔥 Entire tab bar styling with dynamic bottom inset
        tabBarStyle: {
          backgroundColor: colors.bg_home,
          borderTopWidth: 0,

          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 7,
        },
      }}
      initialRouteName="home"
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.key}
          name={tab.key}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) =>
              typeof tab.image === "function" ? (
                // SVG component
                <tab.image
                  width={size}
                  height={size}
                  stroke={color}
                  strokeWidth={2}
                />
              ) : (
                // PNG/JPG
                <Image
                  source={tab.image}
                  style={{ width: size, height: size, tintColor: color }}
                  resizeMode="contain"
                />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   content: {
//     flex: 1,
//   },
//   bottomTabContainer: {
//     flexDirection: "row",
//     backgroundColor: "#5F4660",
//   },
//   tabItem: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: getResponsiveSpacing(16),
//     marginHorizontal: getResponsiveSpacing(4),
//   },
//   tabIcon: {
//     ...getResponsiveImageSize(22, 22),
//   },
//   tabText: {
//     fontSize: getResponsiveFontSize(12),
//     fontWeight: "500",
//     marginTop: getResponsiveSpacing(4),
//     textAlign: "center",
//   },
// });
