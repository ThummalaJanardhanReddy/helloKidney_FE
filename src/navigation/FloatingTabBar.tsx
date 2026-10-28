import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/app/shared/commonStyles";
import { useUserStore } from "@/app/stores/userStore";
import {
  FLOATING_TAB_BAR_BOTTOM_MARGIN,
  useTabBarProgress,
} from "./tabBarVisibility";

// The active tab shows icon + label side by side; every other tab shows
// just its icon, so each needs a different "rest" width.
const COMPACT_ITEM_WIDTH = 48;
const EXPANDED_ITEM_WIDTH = 92;
const ITEM_GAP = 2;
// Extra distance past the screen edge so items fully clear the viewport
// instead of just touching it before they're fully faded out.
const EDGE_BUFFER = 40;
const ACTIVE_TINT = colors.primary;
const INACTIVE_TINT = "#8A8F99";

type ExitDirection = "left" | "right" | "down";

type FloatingTabBarItemProps = {
  exitDirection: ExitDirection;
  progress: SharedValue<number>;
  // Measured geometry of the pill, used to compute how far this item has to
  // travel to actually reach the screen's edge (rather than a fixed guess).
  pillX: SharedValue<number>;
  pillWidth: SharedValue<number>;
  pillHeight: SharedValue<number>;
  screenWidth: number;
  bottomEdgeGap: number;
  isFocused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  icon: React.ReactNode;
};

function FloatingTabBarItem({
  exitDirection,
  progress,
  pillX,
  pillWidth,
  pillHeight,
  screenWidth,
  bottomEdgeGap,
  isFocused,
  label,
  onPress,
  onLongPress,
  icon,
}: FloatingTabBarItemProps) {
  const isEdge = exitDirection !== "down";
  const restWidth = isFocused ? EXPANDED_ITEM_WIDTH : COMPACT_ITEM_WIDTH;

  const itemStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP);

    if (exitDirection === "down") {
      // Travel far enough past the pill's bottom to clear the screen's
      // bottom edge entirely.
      const travel = bottomEdgeGap + pillHeight.value + EDGE_BUFFER;
      return {
        opacity,
        transform: [
          {
            translateY: interpolate(progress.value, [0, 1], [0, travel], Extrapolation.CLAMP),
          },
        ],
      };
    }

    const travel =
      exitDirection === "left"
        ? -(pillX.value + EDGE_BUFFER)
        : screenWidth - (pillX.value + pillWidth.value) + EDGE_BUFFER;

    return {
      opacity,
      width: interpolate(progress.value, [0, 1], [restWidth, 0], Extrapolation.CLAMP),
      marginHorizontal: interpolate(
        progress.value,
        [0, 1],
        [ITEM_GAP, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [0, travel], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.item,
        itemStyle,
        !isEdge && { width: restWidth, marginHorizontal: ITEM_GAP },
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={8}
        style={[styles.touchable, isFocused && styles.touchableActive]}
      >
        {icon}
        {isFocused && (
          <Animated.Text numberOfLines={1} style={[styles.label, { color: ACTIVE_TINT }]}>
            {label}
          </Animated.Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const progress = useTabBarProgress();
  const [hidden, setHidden] = useState(false);
  const router = useRouter();
  const isHealthWorker = useUserStore((s) => s.user?.userType) === "healthworker";
  const showFab = isHealthWorker;

  const handleAddPatient = () => {
    // Save/Close on the Add Patient form reads `from` to decide where to
    // return: back to Home if that's where the FAB was pressed, otherwise
    // it falls through to the Patients list (the nested stack's root).
    const activeTabName = state.routes[state.index].name;
    const params = activeTabName === "home" ? { from: "home" } : undefined;
    router.push({ pathname: "/patients/add", params });
  };

  // Measured once at rest (progress === 0, before anything has animated) so
  // the edge-travel math below isn't thrown off by the pill's own width
  // shrinking mid-animation.
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);
  const hasMeasuredPill = useRef(false);

  const handlePillLayout = (event: LayoutChangeEvent) => {
    if (hasMeasuredPill.current) return;
    hasMeasuredPill.current = true;
    const { x, width, height } = event.nativeEvent.layout;
    pillX.value = x;
    pillWidth.value = width;
    pillHeight.value = height;
  };

  const bottomEdgeGap = insets.bottom + FLOATING_TAB_BAR_BOTTOM_MARGIN;

  useAnimatedReaction(
    () => progress.value > 0.6,
    (isHidden, wasHidden) => {
      if (isHidden !== wasHidden) {
        runOnJS(setHidden)(isHidden);
      }
    },
  );

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [1, 0.9], Extrapolation.CLAMP),
      },
    ],
  }));

  // Match the FAB's size to the pill's measured height so both controls
  // sit at the same height regardless of font-scale/padding changes.
  const fabSizeStyle = useAnimatedStyle(() => {
    const size = pillHeight.value || 52;
    return { width: size, height: size, borderRadius: size / 2 };
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + FLOATING_TAB_BAR_BOTTOM_MARGIN,
          justifyContent: showFab ? "space-between" : "flex-end",
        },
      ]}
    >
      <Animated.View
        onLayout={handlePillLayout}
        pointerEvents={hidden ? "none" : "auto"}
        style={[styles.pill, pillStyle]}
      >
        {state.routes
          .map((route, index) => ({ route, index }))
          // expo-router's `href: null` shortcut (e.g. hiding "Patients" for
          // non-healthworker users) never actually reaches `options.href` —
          // it's stripped out and translated into `tabBarItemStyle: {
          // display: 'none' }` + a no-op `tabBarButton` before the navigator
          // builds `descriptors`. The default tab bar honors those two
          // automatically; a custom one has to check for them itself.
          .filter(
            ({ route }) =>
              StyleSheet.flatten(descriptors[route.key].options.tabBarItemStyle)
                ?.display !== "none",
          )
          .map(({ route, index }, visiblePos, visibleRoutes) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const lastVisibleIndex = visibleRoutes.length - 1;
            const exitDirection: ExitDirection =
              visiblePos === 0 ? "left" : visiblePos === lastVisibleIndex ? "right" : "down";
            const label =
              typeof options.title === "string" ? options.title : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                // "patients" is a nested stack (index/[id]/add); navigating
                // to it by name alone reopens whatever screen it was last
                // left on (e.g. "add") instead of resetting to the list.
                if (route.name === "patients") {
                  navigation.navigate("patients", { screen: "index" });
                } else {
                  navigation.navigate(route.name);
                }
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? ACTIVE_TINT : INACTIVE_TINT,
              size: 20,
            });

            return (
              <FloatingTabBarItem
                key={route.key}
                exitDirection={exitDirection}
                progress={progress}
                pillX={pillX}
                pillWidth={pillWidth}
                pillHeight={pillHeight}
                screenWidth={screenWidth}
                bottomEdgeGap={bottomEdgeGap}
                isFocused={isFocused}
                label={label}
                onPress={onPress}
                onLongPress={onLongPress}
                icon={icon}
              />
            );
          })}
      </Animated.View>
      {showFab && (
        <Animated.View
          pointerEvents={hidden ? "none" : "auto"}
          style={[styles.fab, fabSizeStyle, pillStyle]}
        >
          <Pressable onPress={handleAddPatient} hitSlop={8} style={styles.fabTouchable}>
            <Feather name="plus" size={24} color={colors.white} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  fab: {
    backgroundColor: ACTIVE_TINT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: Platform.OS === "android" ? 10 : 0,
  },
  fabTouchable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: Platform.OS === "android" ? 10 : 0,
  },
  item: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  touchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  touchableActive: {
    backgroundColor: "#FDF4F7",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
