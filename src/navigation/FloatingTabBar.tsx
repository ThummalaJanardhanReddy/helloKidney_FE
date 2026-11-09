import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/app/shared/commonStyles";
import { useUserStore } from "@/app/stores/userStore";
import {
  FLOATING_TAB_BAR_BOTTOM_MARGIN,
  useTabBarProgress,
} from "./tabBarVisibility";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Every tab shows icon + label side by side, in full (no ellipsis/
// truncation). With 4 tabs (healthworker: Home/Tests/Patients/Profile) that
// only fits beside the FAB if every dimension below is kept tight; with 3
// (patient role) that same tight sizing leaves far more slack than content,
// which `pillGrow`'s space-between then stretches into odd-looking gaps —
// so sizing is picked per tab count instead of being one fixed set of
// constants. See COMPACT_SIZES/REGULAR_SIZES below.
const REGULAR_SIZES = {
  itemGap: 2,
  iconSize: 20,
  touchableGap: 4,
  // Wider than the icon+label strictly need — this is what the active tab's
  // pill-shaped background indicator sizes itself to, so this is really the
  // knob for how much breathing room that selected background gets.
  touchablePaddingH: 16,
  labelFontSize: 11,
  // Tightened from the original 8/14/16 — on narrower screens (iPhone
  // SE/XS/mini) the 3-tab pill at full label size was running out of room
  // beside the FAB and clipping "Patients". Shrinking the pill's own
  // padding and nudging the whole bar left (less edge padding, less gap
  // before the FAB) frees up width for the tab content itself without
  // touching each tab's own icon/label/padding sizing.
  pillPaddingH: 4,
  fabWidthMultiplier: 2.5,
  wrapperGap: 6,
  wrapperPaddingLeft: 6,
};
const COMPACT_SIZES = {
  itemGap: 1,
  iconSize: 16,
  touchableGap: 3,
  touchablePaddingH: 5,
  labelFontSize: 10,
  pillPaddingH: 4,
  fabWidthMultiplier: 2.15,
  wrapperGap: 10,
  wrapperPaddingLeft: 12,
};
// Extra distance past the screen edge so the bar fully clears the viewport
// instead of just touching it before it's fully faded out.
const EDGE_BUFFER = 40;
// Same corner radius as the tab pill, reused on the FAB's rounded (left)
// side so the two read as one consistent rounding language.
const PILL_RADIUS = 28;
const screenWidth = Dimensions.get("window").width;
// Only the selected tab's own background is a theme-color gradient, so
// just that tab's icon/label render white; the rest of the pill stays
// white with the original gray inactive tint.
const ACTIVE_TINT = colors.white;
const INACTIVE_TINT = "#8A8F99";
// Gradient fill for the selected-tab indicator.
const TAB_BAR_GRADIENT = ["#E01F16", "#A21D17"] as const;
// Gradient fill for the add-patient/start-test FAB.
const FAB_GRADIENT = ["#0E1833", "#20346C"] as const;
// Kidney/test icon shown on the FAB for the "add test" (patient) action,
// in place of the generic plus-circle icon.
const ADD_TEST_ICON = require("@/assets/images/kidney_test_ic.png");

type FloatingTabBarItemProps = {
  isFocused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  icon: React.ReactNode;
  onLayout: (event: LayoutChangeEvent) => void;
  sizes: typeof REGULAR_SIZES;
};

function FloatingTabBarItem({
  isFocused,
  label,
  onPress,
  onLongPress,
  icon,
  onLayout,
  sizes,
}: FloatingTabBarItemProps) {
  return (
    <View onLayout={onLayout} style={[styles.item, { marginHorizontal: sizes.itemGap }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        hitSlop={8}
        style={[
          styles.touchable,
          { gap: sizes.touchableGap, paddingHorizontal: sizes.touchablePaddingH },
        ]}
      >
        {icon}
        <Animated.Text
          style={[
            styles.label,
            { fontSize: sizes.labelFontSize, color: isFocused ? ACTIVE_TINT : INACTIVE_TINT },
          ]}
        >
          {label}
        </Animated.Text>
      </Pressable>
    </View>
  );
}

export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const progress = useTabBarProgress();
  const [hidden, setHidden] = useState(false);
  const router = useRouter();

  // expo-router's `href: null` shortcut (e.g. hiding "Patients" for
  // non-healthworker users) never actually reaches `options.href` — it's
  // stripped out and translated into `tabBarItemStyle: { display: 'none' }`
  // + a no-op `tabBarButton` before the navigator builds `descriptors`. The
  // default tab bar honors those two automatically; a custom one has to
  // check for them itself.
  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(
      ({ route }) =>
        StyleSheet.flatten(descriptors[route.key].options.tabBarItemStyle)
          ?.display !== "none",
    );
  // 4 tabs (healthworker) need the tight sizing to fit full labels beside
  // the FAB; 3 (patient role) look better at the original, roomier sizing
  // — see REGULAR_SIZES/COMPACT_SIZES above.
  const sizes = visibleRoutes.length > 3 ? COMPACT_SIZES : REGULAR_SIZES;
  // With only 2 tabs, a `pillGrow` (flex:1) pill leaves so much slack that
  // it shows up either as one huge gap between the 2 items (space-between)
  // or, if centered instead, as oversized left/right edge margins that no
  // longer match the 3-tab pill's tight (paddingHorizontal-only) edges. So
  // for exactly 2 tabs the pill instead sizes itself to its own content —
  // same edge padding as the 3-tab case, modest fixed gap between the two
  // items — and the wrapper pins it to the left with the FAB still flush
  // against the right edge.
  const onlyTwoTabs = visibleRoutes.length === 2;
  const isHealthWorker = useUserStore((s) => s.user?.userType) === "healthworker";
  // Every signed-in user gets the FAB — a healthworker adds a patient, a
  // patient starts their own test — just with different icon/action.
  const showFab = true;
  const fabIcon = isHealthWorker ? "user-plus" : "plus-circle";

  const handleFabPress = () => {
    if (isHealthWorker) {
      // Save/Close on the Add Patient form reads `from` to decide where to
      // return: back to Home if that's where the FAB was pressed, otherwise
      // it falls through to the Patients list (the nested stack's root).
      const activeTabName = state.routes[state.index].name;
      const params = activeTabName === "home" ? { from: "home" } : undefined;
      router.push({ pathname: "/patients/add", params });
    } else {
      router.push({ pathname: "/components/start-test" });
    }
  };

  // Measured once at rest so the FAB can match the pill's height exactly
  // and the hide animation can travel exactly past the bar's own height.
  const pillHeight = useSharedValue(0);
  const hasMeasuredPill = useRef(false);

  const handlePillLayout = (event: LayoutChangeEvent) => {
    if (hasMeasuredPill.current) return;
    hasMeasuredPill.current = true;
    pillHeight.value = event.nativeEvent.layout.height;
  };

  // Elastic/stretchy active-tab indicator: its two edges are sprung with
  // different configs, so the leading edge arrives first and the trailing
  // edge catches up — stretching the pill toward the new tab before it
  // snaps back to the target width, instead of just sliding evenly.
  const indicatorLeft = useSharedValue(0);
  const indicatorRight = useSharedValue(0);
  // Faded out while the current route is one that's hidden from the tab
  // bar itself (e.g. Profile/Help, opened via a menu icon rather than a
  // tab press) — otherwise the indicator just stayed stuck on whatever tab
  // was last pressed, looking like that tab was still selected.
  const indicatorOpacity = useSharedValue(1);
  const hasPositionedIndicator = useRef(false);
  const itemLayouts = useRef<{ x: number; width: number }[]>([]);

  const moveIndicatorTo = (x: number, width: number) => {
    const targetLeft = x;
    const targetRight = x + width;
    // Whenever the indicator actually has a real tab to sit on, make sure
    // it's visible — covers both this function's callers: the state.index
    // effect below (which can run before the newly-focused item's onLayout
    // has fired, e.g. right after login, and would otherwise leave opacity
    // at the 0 it set moments earlier) and handleItemLayout's own direct
    // call once that layout does land.
    indicatorOpacity.value = withTiming(1, { duration: 150 });

    if (!hasPositionedIndicator.current) {
      hasPositionedIndicator.current = true;
      indicatorLeft.value = targetLeft;
      indicatorRight.value = targetRight;
      return;
    }

    const movingRight = targetLeft > indicatorLeft.value;
    const leadConfig = { damping: 14, stiffness: 180, mass: 0.7 };
    const lagConfig = { damping: 20, stiffness: 90, mass: 1 };

    if (movingRight) {
      indicatorRight.value = withSpring(targetRight, leadConfig);
      indicatorLeft.value = withSpring(targetLeft, lagConfig);
    } else {
      indicatorLeft.value = withSpring(targetLeft, leadConfig);
      indicatorRight.value = withSpring(targetRight, lagConfig);
    }
  };

  const handleItemLayout = (index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    itemLayouts.current[index] = { x, width };
    if (index === state.index) {
      moveIndicatorTo(x, width);
    }
  };

  // Every item now renders icon + label at all times, so its own layout no
  // longer changes width when it becomes focused — the onLayout above (which
  // used to re-fire and drive the indicator on every tab switch) stays
  // silent. Re-position explicitly whenever the focused tab changes instead,
  // using whatever layout was already measured for it.
  useEffect(() => {
    const layout = itemLayouts.current[state.index];
    if (layout) {
      moveIndicatorTo(layout.x, layout.width);
    } else {
      // state.index points at a route with no rendered tab item (hidden via
      // href: null, e.g. Profile/Help) — there's nothing for the indicator
      // to sit on, so hide it instead of leaving it on the last tab.
      indicatorOpacity.value = withTiming(0, { duration: 150 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ translateX: indicatorLeft.value }],
    width: indicatorRight.value - indicatorLeft.value,
  }));

  useAnimatedReaction(
    () => progress.value > 0.6,
    (isHidden, wasHidden) => {
      if (isHidden !== wasHidden) {
        runOnJS(setHidden)(isHidden);
      }
    },
  );

  // The pill and the FAB hide independently: the pill slides straight down
  // off the bottom edge, while the FAB slides off to the right edge.
  const pillAnimatedStyle = useAnimatedStyle(() => {
    const travel =
      (pillHeight.value || 52) + insets.bottom + FLOATING_TAB_BAR_BOTTOM_MARGIN + EDGE_BUFFER;
    return {
      opacity: interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [0, travel], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const travel = screenWidth + EDGE_BUFFER;
    return {
      opacity: interpolate(progress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [0, travel], Extrapolation.CLAMP),
        },
      ],
    };
  });

  // Match the FAB's height to the pill's measured height. Only the left
  // edge is rounded (stadium-style); the right edge — flush against the
  // screen's edge — stays square, so it reads as a half-button attached to
  // the corner rather than a floating full pill.
  const fabSizeStyle = useAnimatedStyle(() => {
    const size = pillHeight.value || 52;
    return {
      // The flat right (square) section is sized to match the left rounded
      // cap's width (PILL_RADIUS), instead of scaling with the pill's
      // height, so both halves read as equal width. Shrunk only when the
      // pill needs every spare px for the 4 healthworker tabs' full labels.
      width: PILL_RADIUS * sizes.fabWidthMultiplier,
      height: size,
      borderTopLeftRadius: PILL_RADIUS,
      borderBottomLeftRadius: PILL_RADIUS,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    };
  });

  // Screens like Help Center opt out of the floating tab bar entirely via
  // `tabBarStyle: { display: "none" }` on their Tabs.Screen options — unlike
  // the scroll-driven hide above, this is a hard, route-based opt-out.
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const hideTabBarForRoute =
    StyleSheet.flatten(focusedOptions.tabBarStyle as any)?.display === "none";

  if (hideTabBarForRoute) return null;

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "box-none"}
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + FLOATING_TAB_BAR_BOTTOM_MARGIN,
          justifyContent: "center",
          gap: showFab ? sizes.wrapperGap : 0,
          paddingLeft: sizes.wrapperPaddingLeft,
          // The FAB sits flush against the screen's right edge, no inset —
          // only the pill keeps the left-side edge padding.
          paddingRight: showFab ? 0 : sizes.wrapperPaddingLeft,
        },
      ]}
    >
      {/* This slot always fills the space between the wrapper's left edge
          and the FAB. For 3+ tabs the pill itself grows (pillGrow) to fill
          it completely, same as before. For exactly 2 tabs the pill stays
          auto-sized to its own content (so its edges keep the 3-tab pill's
          own paddingHorizontal, not a stretched one) and this slot centers
          it within that space instead of leaving it pinned to the left. */}
      <View style={styles.pillSlot}>
        <Animated.View
          onLayout={handlePillLayout}
          style={[
            styles.pill,
            { paddingHorizontal: sizes.pillPaddingH },
            showFab && !onlyTwoTabs && styles.pillGrow,
            onlyTwoTabs && styles.pillTwoTabs,
            pillAnimatedStyle,
          ]}
        >
        <AnimatedLinearGradient
          colors={TAB_BAR_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.indicator, indicatorStyle]}
        />
        {visibleRoutes.map(({ route, index }) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : typeof options.title === "string"
                  ? options.title
                  : route.name;

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
              size: sizes.iconSize,
            });

            return (
              <FloatingTabBarItem
                key={route.key}
                isFocused={isFocused}
                label={label}
                onPress={onPress}
                onLongPress={onLongPress}
                icon={icon}
                onLayout={(event) => handleItemLayout(index, event)}
                sizes={sizes}
              />
            );
          })}
        </Animated.View>
      </View>
      {/* Previous plain-circle FAB (white circle, soft-pink inner highlight,
          sized to match the pill's height) — commented out, not deleted, so
          it can be swapped back in by uncommenting this and fabSizeStyle
          above.
      {showFab && (
        <Animated.View style={[styles.fab, fabSizeStyle]}>
          <View style={styles.fabInnerBg} />
          <Pressable onPress={handleAddPatient} hitSlop={8} style={styles.fabTouchable}>
            <Feather name="user-plus" size={22} color={ACTIVE_TINT} />
          </Pressable>
        </Animated.View>
      )}
      */}
      {showFab && (
        <Animated.View style={[styles.fabAttached, fabSizeStyle, fabAnimatedStyle]}>
          {/* The gradient fill gets the same corner-radius as its parent —
              relying on the parent's `overflow: hidden` alone to clip a
              square child to an asymmetric (left-rounded, right-square)
              radius isn't reliable, so the radii are applied directly here
              too (width/height stay flex: 1, unlike the parent). */}
          <LinearGradient
            colors={FAB_GRADIENT}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.fabAttachedFill, styles.fabAttachedFillRadius]}
          >
            <Pressable onPress={handleFabPress} hitSlop={8} style={styles.fabTouchable}>
              {isHealthWorker ? (
                <Feather name={fabIcon} size={22} color={colors.white} />
              ) : (
                <Image
                  source={ADD_TEST_ICON}
                  style={{ width: 26, height: 26 }}
                  resizeMode="contain"
                />
              )}
            </Pressable>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  // --- Previous plain-circle FAB styles — commented out, not deleted ---
  // fab: {
  //   backgroundColor: colors.white,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 6 },
  //   shadowOpacity: 0.12,
  //   shadowRadius: 14,
  //   elevation: Platform.OS === "android" ? 10 : 0,
  // },
  // // Same soft highlight as the selected tab, inset from the FAB's edge so
  // // the outer circle stays white — mirrors the pill's indicator treatment.
  // fabInnerBg: {
  //   position: "absolute",
  //   top: 4,
  //   left: 4,
  //   right: 4,
  //   bottom: 4,
  //   backgroundColor: ACTIVE_BG,
  //   borderRadius: 999,
  // },
  // --- New FAB: a gradient circle attached directly to the pill's edge
  // (no gap, white ring for separation) rather than floating above it. ---
  fabAttached: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderColor: colors.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: Platform.OS === "android" ? 10 : 0,
  },
  fabAttachedFill: {
    flex: 1,
  },
  fabAttachedFillRadius: {
    borderTopLeftRadius: PILL_RADIUS,
    borderBottomLeftRadius: PILL_RADIUS,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
   
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
    borderRadius: PILL_RADIUS,
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: Platform.OS === "android" ? 10 : 0,
  },
  // Always fills the space between the wrapper's left edge and the FAB —
  // see the comment above where it's used for what each case does with it.
  pillSlot: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  // Stretches the pill to fill the remaining width next to the FAB, so the
  // pill + FAB together span the exact same edge-to-edge width as the
  // cards above (same paddingHorizontal as the wrapper). Items spread out
  // evenly across that extra width instead of bunching at the left.
  pillGrow: {
    flex: 1,
    justifyContent: "space-between",
  },
  // For exactly 2 tabs (pillGrow is skipped): no flex/justifyContent
  // override — the pill is left to its own auto width, so its edges keep
  // the same paddingHorizontal the 3-tab pill has, with just a modest fixed
  // gap between the 2 items instead of them touching. pillSlot above then
  // centers this auto-width pill within the available space.
  pillTwoTabs: {
    gap: 20,
  },
  indicator: {
    position: "absolute",
    left: 0,
    // Match the pill's own vertical padding exactly, instead of a
    // percentage-based center, so top/bottom space stays equal and
    // doesn't drift depending on Yoga's intrinsic-height timing.
    top: 8,
    bottom: 8,
    borderRadius: 18,
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
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
  },
});
