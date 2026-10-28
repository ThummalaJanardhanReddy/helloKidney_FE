import React, { createContext, useContext, useMemo } from "react";
import type { NativeScrollEvent } from "react-native";
import {
  SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/**
 * Shared "collapse progress" (0 = full floating tab bar, 1 = collapsed to the
 * center items only) that every scrollable tab screen feeds via the scroll
 * helpers below, and that FloatingTabBar reads to drive its animation.
 */

const HIDE_DELTA_THRESHOLD = 6;
const TOP_OFFSET = 8;
const ANIM_DURATION = 220;

export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_BOTTOM_MARGIN = 0;

type TabBarVisibilityContextValue = {
  progress: SharedValue<number>;
};

const TabBarVisibilityContext =
  createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);
  const value = useMemo(() => ({ progress }), [progress]);
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarProgress(): SharedValue<number> {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    throw new Error(
      "useTabBarProgress must be used within a TabBarVisibilityProvider",
    );
  }
  return ctx.progress;
}

function applyScrollOffset(
  y: number,
  prevY: SharedValue<number>,
  progress: SharedValue<number>,
) {
  "worklet";
  const delta = y - prevY.value;

  if (y <= TOP_OFFSET) {
    progress.value = withTiming(0, { duration: ANIM_DURATION });
  } else if (delta > HIDE_DELTA_THRESHOLD) {
    progress.value = withTiming(1, { duration: ANIM_DURATION });
  } else if (delta < -HIDE_DELTA_THRESHOLD) {
    progress.value = withTiming(0, { duration: ANIM_DURATION });
  }

  prevY.value = y;
}

/** For plain Animated.ScrollView / Animated.FlatList `onScroll` props. */
export function useTabBarScrollHandler() {
  const progress = useTabBarProgress();
  const prevY = useSharedValue(0);
  return useAnimatedScrollHandler({
    onScroll: (event) => {
      applyScrollOffset(event.contentOffset.y, prevY, progress);
    },
  });
}

/** For @codeherence/react-native-header's `onScrollWorklet` prop. */
export function useTabBarScrollWorklet() {
  const progress = useTabBarProgress();
  const prevY = useSharedValue(0);
  return (evt: NativeScrollEvent) => {
    "worklet";
    applyScrollOffset(evt.contentOffset.y, prevY, progress);
  };
}
