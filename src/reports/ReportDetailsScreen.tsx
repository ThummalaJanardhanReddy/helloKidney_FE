import { useUserStore } from "@/app/stores/userStore";
import { images } from "@/assets";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import Text from "../../app/components/Text";
import { generatePDF } from "../utils/helper";
import Toast from "@/app/shared/Toast";
import { colors } from "@/app/shared/commonStyles";

// ── Hero "dome" shape: a blue gradient block whose top edge dips then arches
// up around the kidney illustration. HERO_CURVE is traced directly from the
// reference design (sampled pixel-by-pixel off the mockup, then normalized
// to width/height fractions), so the dip/rise/peak proportions match it
// exactly rather than being hand-guessed. The path is built from the card's
// real measured width (via onLayout), so the rounded corners stay perfectly
// circular on every device instead of being squashed by non-uniform scaling.
const HERO_H = 108; // 20px below the icon/title row's bottom (heroArch+18 top + 40 icon height + 20)
// arch height as a fraction of the card's own width (105/734 measured off the
// reference mockup) — tying it to width, the same way HERO_CURVE's x values
// are fractions of width, keeps the dome's proportions correct at any device
// size instead of distorting when the real width differs from a fixed guess.
const HERO_ARCH_RATIO = 0.1431;
const HERO_RADIUS = 22;
const HERO_PEAK_FRAC = 0.6254; // x-fraction of HERO_CURVE's peak point
const KIDNEY_W_RATIO = 0.52; // kidney art width as a fraction of card width (padded in from the edges)
const KIDNEY_ASPECT = 1536 / 1024; // source asset aspect ratio
const KIDNEY_H_SCALE = 0.8; // shrinks the art's height a bit shorter than its natural aspect

// [fractionOfWidth, fractionOfArchHeight] pairs tracing the dome's rise,
// peak, and fall — everything outside this range is the flat baseline.
// These sit on a raised-cosine ease (y = (1 - cos(pi * t)) / 2 going up to
// the peak, mirrored coming down), which has zero slope at the rise/fall
// start, at the peak, and at the fall's end by construction — a curve built
// this way can't kink at the joins no matter how it's sampled/interpolated.
// The rise/fall span (0.30 to 0.97) is deliberately wide so the dome reads
// as one broad mountain rather than a narrow, contained hump, with enough
// flat run-up on the left before the icon/title row for it not to feel cramped.
const HERO_CURVE: [number, number][] = [
  [0.3, 0.0],
  [0.325, 0.0145],
  [0.3501, 0.0573],
  [0.3751, 0.1257],
  [0.4001, 0.216],
  [0.4252, 0.3227],
  [0.4502, 0.4397],
  [0.4752, 0.5603],
  [0.5002, 0.6773],
  [0.5253, 0.784],
  [0.5503, 0.8743],
  [0.5753, 0.9427],
  [0.6004, 0.9855],
  [0.6254, 1.0],
  [0.6519, 0.9855],
  [0.6784, 0.9427],
  [0.7049, 0.8743],
  [0.7314, 0.784],
  [0.7579, 0.6773],
  [0.7844, 0.5603],
  [0.811, 0.4397],
  [0.8375, 0.3227],
  [0.864, 0.216],
  [0.8905, 0.1257],
  [0.917, 0.0573],
  [0.9435, 0.0145],
  [0.97, 0.0],
];

// Catmull-Rom → cubic-bezier through a point list — gives a C1-continuous
// (truly smooth, no faceting) curve through every sample, unlike drawing a
// quadratic to each midpoint.
const smoothThroughPoints = (pts: number[][]) => {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)} `;
  }
  return d;
};

// evenly-spaced flat (y=0) points strictly between x0 and x1, exclusive
const buildHeroPath = (w: number, arch: number) => {
  const r = HERO_RADIUS;
  const curvePts = HERO_CURVE.map(([fx, fy]) => [fx * w, -fy * arch]);
  // the curve itself has zero slope at its first/last points (cosine ease),
  // so a single flat anchor on each side joins cleanly with no kink.
  const pts = [[r, 0], ...curvePts, [w - r, 0]];

  let d = `M ${r},0 `;
  d += smoothThroughPoints(pts);
  d += `A ${r},${r} 0 0 1 ${w},${r} `;
  d += `L ${w},${HERO_H} L 0,${HERO_H} L 0,${r} `;
  d += `A ${r},${r} 0 0 1 ${r},0 Z`;
  return d;
};

// ── uACR stage → risk label/color/explanation ──────────────────────────────
type StageKey = "A1" | "A2" | "A3";

const STAGE_INFO: Record<
  StageKey,
  { label: string; color: string; tint: string; meaning: string }
> = {
  A1: {
    label: "Low Risk",
    color: "#1A9F5C",
    tint: "#E3F8EC",
    meaning:
      "Your uACR is in the A1 range, which indicates normal kidney function.",
  },
  A2: {
    label: "Slightly Abnormal",
    color: "#D98B1F",
    tint: "#FDF1DE",
    meaning:
      "Your uACR is in the A2 range, which indicates mildly increased albumin — worth keeping an eye on.",
  },
  A3: {
    label: "High Risk",
    color: colors.primary,
    tint: "#FBE6E4",
    meaning:
      "Your uACR is in the A3 range, which indicates high risk of kidney problem.",
  },
};

const getStageKey = (stage?: string): StageKey => {
  const match = stage?.toUpperCase().match(/A[123]/);
  return (match?.[0] as StageKey) || "A1";
};

// value/unit come through as a single "40.0 mg/g" string — split for display
const splitValue = (raw?: string) => {
  const [value, unit] = (raw || "").split(" ");
  return { value: value || "N/A", unit: unit || "" };
};

export default function ReportDetails({ report }: { report: any }) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const { width: winWidth } = useWindowDimensions();
  const [heroWidth, setHeroWidth] = useState(winWidth - 36);
  const heroArch = heroWidth * HERO_ARCH_RATIO;
  const kidneyImgW = heroWidth * KIDNEY_W_RATIO;
  const kidneyImgH = (kidneyImgW / KIDNEY_ASPECT) * KIDNEY_H_SCALE;
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const stageKey = getStageKey(report?.stage);
  const stageInfo = STAGE_INFO[stageKey];

  const uacr = splitValue(report?.uacr);
  const uacrSi = splitValue(report?.si?.value);
  const albumin = splitValue(report?.albumin);
  const creatinine = splitValue(report?.creatinine);
  // report.date is "DD MMM YYYY: hh:mm A" — the pill only shows the date part
  const dateOnly = (report?.date || "N/A").split(":")[0].trim();

  const shareReport = async () => {
    try {
      await Share.share({
        message: `
HelloKidney — uACR Test

Patient: ${report?.patientName || "N/A"}
Date: ${report?.date || "N/A"}

uACR: ${report?.uacr || "N/A"}${report?.si?.value ? ` (${report.si.value})` : ""}
Microalbumin: ${report?.albumin || "N/A"}
Creatinine: ${report?.creatinine || "N/A"}

Stage ${stageKey} — ${stageInfo.label}
        `.trim(),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      await generatePDF(report);
    } catch (error) {
      setToast({ message: "Failed to generate PDF", type: "error" });
      console.log("Error generating PDF:", error);
    }
  };

  const handleTestAgain = () => {
    router.push({ pathname: "/components/TimerCameraUploader" });
  };

  const MetricRow = ({
    icon,
    iconColor,
    label,
    value,
    unit,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    label: string;
    value: string;
    unit: string;
  }) => (
    <View style={styles.metricRow}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  );

  const RangeChip = ({ stage, range }: { stage: StageKey; range: string }) => {
    const info = STAGE_INFO[stage];
    return (
      <View style={[styles.rangeChip, { backgroundColor: info.tint }]}>
        <Text style={[styles.rangeChipStage, { color: info.color }]}>{stage}</Text>
        <Text style={styles.rangeChipText}>{range}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <View
        style={styles.reportCard}
        onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
      >
        {/* ── Hero dome: curved blue gradient background the kidney art sits on ── */}
        <Svg
          width={heroWidth}
          height={HERO_H + heroArch}
          viewBox={`0 ${-heroArch} ${heroWidth} ${HERO_H + heroArch}`}
          style={styles.heroSvg}
        >
          <Defs>
            <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.bg_home} />
              <Stop offset="1" stopColor={colors.blue} />
            </SvgLinearGradient>
          </Defs>
          <Path d={buildHeroPath(heroWidth, heroArch)} fill="url(#heroGrad)" />
        </Svg>

        {/* ── White result body, flush below the dome's flat rectangle ── */}
        <View style={styles.cardBody}>
          <View style={styles.riskRow}>
            <View style={[styles.riskCircle, { borderColor: stageInfo.color }]}>
              <Text style={[styles.riskStage, { color: stageInfo.color }]}>{stageKey}</Text>
              <Text style={styles.riskLabel}>{stageInfo.label}</Text>
            </View>

            <View style={styles.metricsCol}>
              <View>
                <MetricRow
                  icon="clipboard-outline"
                  iconColor="#6B5FD3"
                  label="uACR"
                  value={uacr.value}
                  unit={uacr.unit}
                />
                {report?.si?.value && (
                  <Text style={styles.metricSubValue}>
                    {uacrSi.value} {uacrSi.unit}
                  </Text>
                )}
              </View>
              <MetricRow
                icon="water-outline"
                iconColor={colors.primary}
                label="Microalbumin"
                value={albumin.value}
                unit={albumin.unit}
              />
              <MetricRow
                icon="flask-outline"
                iconColor={colors.blue}
                label="Creatinine"
                value={creatinine.value}
                unit={creatinine.unit}
              />
            </View>
          </View>

          {/* ── Reference range legend ── */}
          <View style={styles.refCard}>
            <View style={styles.refHeaderRow}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.refHeaderText}>uACR Reference Range</Text>
            </View>
            <View style={styles.refChipsRow}>
              <RangeChip stage="A1" range="< 30 mg/g" />
              <RangeChip stage="A2" range="30 – 300 mg/g" />
              <RangeChip stage="A3" range="> 300 mg/g" />
            </View>
          </View>

          {/* ── What it means ── */}
          <View style={styles.meaningCard}>
            <View style={styles.meaningIconWrap}>
              <Ionicons name="medical-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.meaningTitle}>What it means?</Text>
              <Text style={styles.meaningText}>{stageInfo.meaning}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>

          {/* ── Share / Download ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.8}
              onPress={shareReport}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.blue} />
              <Text style={styles.outlineBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filledBtn}
              activeOpacity={0.85}
              onPress={handleGeneratePDF}
            >
              <Ionicons name="download-outline" size={18} color={colors.white} />
              <Text style={styles.filledBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Overlays on top of the dome: title row + kidney art ──
            heroTopRow's right edge stops a little left of the kidney art's
            horizontal center (its narrow tube/neck, not the wide blobs up
            top, which sit higher than this row anyway) — enough room for
            the date pill to be pushed to that edge via space-between, the
            same way "40.0 mg/g" is pushed to the right of its metric row,
            without the row's own content wrapping. */}
        <View
          style={[
            styles.heroTopRow,
            {
              top: heroArch + 18,
              right: heroWidth * (1 - HERO_PEAK_FRAC) + 24,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="flask-outline" size={20} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTestName}>uACR Test</Text>
            <View style={styles.nameDateRow}>
              <Text
                style={styles.heroPatientName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {report?.patientName || user?.userName || "N/A"}
              </Text>
              <View style={styles.datePill}>
                <Ionicons name="calendar-outline" size={11} color={colors.black} />
                <Text style={styles.dateText}>{dateOnly}</Text>
              </View>
            </View>
          </View>
        </View>

        <Image
          source={images.kidneyGlow}
          style={[
            styles.heroKidneyImage,
            {
              width: kidneyImgW,
              height: kidneyImgH,
              right: heroWidth * (1 - HERO_PEAK_FRAC) - kidneyImgW / 2,
            },
          ]}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        style={styles.testAgainBtn}
        activeOpacity={0.88}
        onPress={handleTestAgain}
      >
        <Ionicons name="refresh" size={20} color={colors.white} />
        <Text style={styles.testAgainText}>Test Again</Text>
      </TouchableOpacity>
      </ScrollView>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: colors.bg_primary,
  },
  reportCard: {
    position: "relative",
    marginTop: 12,
  },
  heroSvg: {
    // the dome itself; overlays below are positioned absolutely on top of it
  },
  heroKidneyImage: {
    // the dome's peak sits at reportCard's own top edge (y=0); this offset
    // is the halo's breathing room above it, into the page background.
    // width/height/right are set inline (they depend on the measured
    // heroWidth).
    
    position: "absolute",
    top: 10,
    left:130,
    zIndex: 5,
  },
  heroTopRow: {
    // top/right are set inline (depend on the measured heroArch/heroWidth)
    position: "absolute",
    left: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTestName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  nameDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    
  },
  heroPatientName: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "absolute",
    right: 30,
    
  },
  dateText: {
    fontSize: 8,
    fontWeight: "600",
    color: colors.black,
  },

  // ── White result body, flush below the dome ──
  cardBody: {
    // sits directly below the Svg, which already occupies HERO_H + heroArch
    // of normal-flow space above it — no extra margin needed here.
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: HERO_RADIUS,
    borderBottomRightRadius: HERO_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    padding: 18,
    paddingTop: 26,
    gap: 16,
  },
  riskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  riskCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  riskStage: {
    fontSize: 26,
    fontWeight: "800",
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.black,
    textAlign: "center",
    marginTop: 2,
  },
  metricsCol: {
    flex: 1,
    gap: 10,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  metricSubValue: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: "#1A1A1A",
    marginTop: 1,
  },

  // ── Reference range ──
  refCard: {
    backgroundColor: "#F4F5FB",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  refHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.black,
  },
  refChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  rangeChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
  },
  rangeChipStage: {
    fontSize: 15,
    fontWeight: "800",
  },
  rangeChipText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#1A1A1A",
  },

  // ── What it means ──
  meaningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F4F5FB",
    borderRadius: 14,
    padding: 14,
  },
  meaningIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  meaningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 2,
  },
  meaningText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#1A1A1A",
  },

  // ── Share / Download ──
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 24,
    paddingVertical: 13,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.blue,
  },
  filledBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.blue,
    borderRadius: 24,
    paddingVertical: 13,
  },
  filledBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },

  // ── Test again ──
  testAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 15,
    marginTop: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  testAgainText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});
