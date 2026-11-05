import * as Haptics from "expo-haptics";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, AppState, AppStateStatus, StyleSheet, View } from "react-native";
import Text from "../Text";
import Svg, { Rect } from "react-native-svg";
import { colors } from "../../shared/commonStyles";

// Caps how large the ring can grow on tablets/large phones — callers pass a
// `size` tuned for phones, this just stops it ballooning further.
const MAX_SIZE = 320;

// Number of radial tick marks drawn around the ring — fixed independent of
// durationSec, purely a visual density choice (matches the reference design).
const TICK_COUNT = 60;

export interface CountdownRingHandle {
  start: () => void;
  reset: () => void;
}

export interface CountdownRingProps {
  durationSec?: number;
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  trackColor?: string;
  onComplete?: () => void;
  autoStart?: boolean;
  // Switches progressColor to amber for the final 10 seconds. Off by
  // default — opt in per screen.
  warnLastTenSeconds?: boolean;
}

const CountdownRing = forwardRef<CountdownRingHandle, CountdownRingProps>(
  function CountdownRing(
    {
      durationSec = 60,
      size = 260,
      strokeWidth = 18,
      progressColor = "#2E8B5E",
      trackColor = "#E3ECE6",
      onComplete,
      autoStart = false,
      warnLastTenSeconds = false,
    },
    ref,
  ) {
    const ringSize = Math.min(size, MAX_SIZE);
    const cx = ringSize / 2;
    const cy = ringSize / 2;
    const outerRadius = ringSize / 2 - 2;
    const innerRadius = outerRadius - strokeWidth;
    const tickWidth = Math.max(2.5, ringSize * 0.022);

    const [remainingSec, setRemainingSec] = useState(durationSec);
    const [isRunning, setIsRunning] = useState(false);

    // The source of truth for "how much time is left" is always this
    // timestamp, never a decrementing counter — a counter drifts under
    // JS-thread jank and has no way to recover after the app was
    // backgrounded for a while.
    const endTimestampRef = useRef<number | null>(null);
    const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completedRef = useRef(false);

    const clearTick = useCallback(() => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }, []);

    const finish = useCallback(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      clearTick();
      setRemainingSec(0);
      setIsRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      AccessibilityInfo.announceForAccessibility(
        "Timer finished, scan the card now",
      );
      onComplete?.();
    }, [clearTick, onComplete]);

    const tick = useCallback(() => {
      if (!endTimestampRef.current) return;
      const remainingMs = endTimestampRef.current - Date.now();
      if (remainingMs <= 0) {
        finish();
        return;
      }
      setRemainingSec(Math.ceil(remainingMs / 1000));
    }, [finish]);

    const start = useCallback(() => {
      completedRef.current = false;
      setIsRunning(true);
      setRemainingSec(durationSec);
      endTimestampRef.current = Date.now() + durationSec * 1000;

      clearTick();
      // Ticks are discrete (on/off), so a 200ms resync is plenty smooth —
      // no per-frame UI-thread animation needed for this visual.
      tickIntervalRef.current = setInterval(tick, 200);
    }, [clearTick, durationSec, tick]);

    const reset = useCallback(() => {
      clearTick();
      completedRef.current = false;
      endTimestampRef.current = null;
      setIsRunning(false);
      setRemainingSec(durationSec);
    }, [clearTick, durationSec]);

    useImperativeHandle(ref, () => ({ start, reset }), [start, reset]);

    useEffect(() => {
      if (autoStart) start();
      return () => clearTick();
      // Only ever auto-starts once, on mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // setInterval/setTimeout both pause (or otherwise can't be trusted) while
    // the app is backgrounded, so recompute everything from the stored end
    // timestamp the moment it comes back.
    useEffect(() => {
      const onChange = (state: AppStateStatus) => {
        if (state !== "active" || !isRunning || !endTimestampRef.current) {
          return;
        }
        const remainingMs = endTimestampRef.current - Date.now();
        if (remainingMs <= 0) {
          finish();
          return;
        }
        setRemainingSec(Math.ceil(remainingMs / 1000));
      };
      const sub = AppState.addEventListener("change", onChange);
      return () => sub.remove();
    }, [isRunning, finish]);

    const ringColor =
      warnLastTenSeconds && isRunning && remainingSec <= 10 && remainingSec > 0
        ? "#F59E0B"
        : progressColor;

    // Driven directly by remainingSec (not a separately-tracked progress
    // fraction) so the ticks and the number always change in the same
    // render, on the same whole-second step — never out of sync with each
    // other.
    const filledCount = Math.round(
      Math.max(0, Math.min(1, remainingSec / durationSec)) * TICK_COUNT,
    );

    const ticks = useMemo(() => {
      return Array.from({ length: TICK_COUNT }, (_, i) => {
        const angleDeg = (360 / TICK_COUNT) * i;
        return { key: i, angleDeg, filled: i < filledCount };
      });
    }, [filledCount]);

    return (
      <View
        style={{
          width: ringSize,
          height: ringSize,
          alignItems: "center",
          justifyContent: "center",
        }}
        accessible
        accessibilityRole="timer"
        accessibilityValue={{ min: 0, max: durationSec, now: remainingSec }}
      >
        <Svg width={ringSize} height={ringSize}>
          {ticks.map(({ key, angleDeg, filled }) => (
            <Rect
              key={key}
              x={cx - tickWidth / 2}
              y={cy - outerRadius}
              width={tickWidth}
              height={outerRadius - innerRadius}
              rx={tickWidth / 2}
              fill={filled ? ringColor : trackColor}
              rotation={angleDeg}
              origin={`${cx}, ${cy}`}
            />
          ))}
        </Svg>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.centerContent}>
            <Text
              style={[styles.timerText, { fontSize: Math.round(ringSize * 0.23) }]}
            >
              {remainingSec}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

export default CountdownRing;

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontWeight: "700",
    color: colors.black,
    fontVariant: ["tabular-nums"],
  },
});
