import BackButton from "@/app/shared/BackButton";
import { colors } from "@/app/shared/commonStyles";
import PrimaryButton from "@/app/shared/PrimaryButton";
import { useUserStore } from "@/app/stores/userStore";
import axiosClient from "@/src/services/axiosClient";
import { Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

dayjs.extend(utc);
dayjs.extend(timezone);

const { width } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (width / 390));

// ── Placeholder reports data ──────────────────────────────────────────────────
const MOCK_REPORTS = [
  {
    created_timestamp: "2026-04-12T11:54:50.661308",
    id: 880,
    input_image_path:
      "hellokidneydata/uacr/input/c07298a465194fe5a1857b358963e419.png",
    output_image_name: "composite_d73fe0.png",
    output_image_path: "hellokidneydata/uacr/output/composite_d73fe0.png",
    output_metrics:
      '{"microalbuminInfo": {"rgb_value": "RGB(124, 127, 114)", "value": "80.0 mg/L"}, "creatinineInfo": {"rgb_value": "RGB(89, 101, 83)", "value": "150.0 mg/dl"}, "uacrInfo": {"value": "53.33 mg/G", "stage": "A2 Proteinuria", "reference_range": "30 - 300 mg/G", "confidence_pct": 55.0, "confidence_bucket": "Low", "stage_adjustment_reason": null}, "traceData": {"uacr_legacy_value": 58.33, "uacr_corrected_value": 53.33, "uacr_delta_legacy_minus_corrected": 5.0, "uacr_legacy_trace": {"albumin_used_mg_l": 86.726, "creatinine_used_mg_dl": 148.689, "uacr_formula_mg_g": 58.33, "source": "legacy_calibrated_continuous"}, "uacr_corrected_trace": {"albumin_used_mg_l": 80.0, "creatinine_used_mg_dl": 150.0, "uacr_formula_mg_g": 53.33, "source": "corrected_snapped_displayed"}, "uacr_trace_quality": {"legacy_stage": "A2 Proteinuria", "corrected_stage": "A2 Proteinuria", "raw_formula_value": 58.33, "corrected_formula_value": 53.33, "uacr_confidence_pct": 55.0}}, "qualityData": {"creatinine": {"confidence": 0.9827, "confidence_pct": 98.3, "confidence_bucket": "High", "penalties": {"p_non_uniform": 0.0385, "p_glare": 0.0, "p_mask": 0.0}, "flag_non_uniform": 0, "flag_glare": 0, "flag_mask_quality": 0, "sigma_L": 5.8634, "mad_ab": 2.2145, "de_p90": 10.4622, "texture_score": 7.3878, "glare_area_ratio": 0.0, "glare_cluster_max_ratio": 0.0, "white_spot_count": 0, "glare_pixels": 0, "mask_area_ratio": 0.00292, "edge_touch_ratio": 0.0, "eccentricity": 0.0, "mask_quality_reasons": [], "trace": {"raw_regression": 148.689, "raw_color_chart": 200.0, "fused": 149.5767, "corrected": 149.5767, "snapped": 150.0, "alpha": 0.0, "correction_reason": "No correction required", "boundary_distance": 0.4233}, "raw_regression_value": 148.68900000000008, "raw_color_chart_value": 200.0, "raw_color_chart_label": "200", "final_display_value": 150.0, "low_end_snap_label": null}, "microalbumin": {"confidence": 0.55, "confidence_pct": 55.0, "confidence_bucket": "Low", "penalties": {"p_non_uniform": 1.0, "p_glare": 0.0, "p_mask": 0.0}, "flag_non_uniform": 0, "flag_glare": 0, "flag_mask_quality": 0, "sigma_L": 11.0867, "mad_ab": 2.4585, "de_p90": 25.3644, "texture_score": 5.4778, "glare_area_ratio": 0.0, "glare_cluster_max_ratio": 0.0, "white_spot_count": 0, "glare_pixels": 0, "mask_area_ratio": 0.003987, "edge_touch_ratio": 0.0, "eccentricity": 0.460675, "mask_quality_reasons": [], "trace": {"raw_regression": 86.726, "raw_color_chart": 80.0, "fused": 83.6993, "corrected": 83.6993, "snapped": 80.0, "alpha": 0.0, "correction_reason": "No correction required", "boundary_distance": 3.6993}, "raw_regression_value": 86.72600000000003, "raw_color_chart_value": 80.0, "raw_color_chart_label": 80, "final_display_value": 80.0, "low_end_snap_label": null}}}',
    patient_id: "PL0002",
    request_id: "edd58d92",
    test_id: "UAT01",
  },
];

export interface Patient {
  address: string | null;
  age: number;
  city: string | null;
  created_on: string; // ISO date string
  district: string | null;
  email_id: string | null;
  full_name: string;
  gender: "Male" | "Female" | "Other" | string;
  locality: string | null;
  mobile_no: string;
  patient_id: number;
  patient_uniqueid: string | null;
  pincode: string | null;
  state: string | null;
  user_name: string | null;
}

type Report = (typeof MOCK_REPORTS)[0];

// ── PDF icon ──────────────────────────────────────────────────────────────────
function PdfIcon() {
  return (
    <View style={styles.pdfBox}>
      <View style={styles.pdfFold} />
      <Text style={styles.pdfLabel}>PDF</Text>
    </View>
  );
}

// Utility Functions
const formatDate = (date: string): string => {
  try {
    const fixed = date.includes(".")
      ? date.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}).*$/, "$1")
      : date;

    const normalized = fixed.endsWith("Z") ? fixed : `${fixed}Z`;
    return dayjs(normalized).format("DD MMM YYYY: hh:mm A");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

// ── Report row ────────────────────────────────────────────────────────────────
function ReportRow({ item, onPress }: { item: Report; onPress: () => void }) {
  // const created_timestamp = formatDate(item?.created_timestamp);
  const date = item.created_timestamp ? formatDate(item.created_timestamp) : formatDate(item.created_on);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.reportCard}
    >
      <PdfIcon />
      <View style={styles.reportInfo}>
        <Text style={styles.reportTestId}>
          Test Id: <Text style={styles.bold}>{item.test_id}</Text>
        </Text>
        <Text style={styles.reportDate}>
          Test Date:{" "}
          <Text style={styles.bold}>{date}</Text>
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PatientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useLocalSearchParams<{ data: string }>();
  const [reports, setReports] = React.useState([]);
  const [loadingReports, setLoadingReports] = React.useState(false);

  // Parse patient passed from list screen, fallback to mock
  const patient = data
    ? JSON.parse(data)
    : {
        address: null,
        age: 0,
        city: null,
        created_on: "",
        district: null,
        email_id: null,
        full_name: "",
        gender: "Male",
        locality: null,
        mobile_no: "",
        patient_id: 1,
        patient_uniqueid: null,
        pincode: null,
        state: null,
        user_name: null,
      };

  // Card entrance animation
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoadingReports(true);

        const data = await fetchReports(); // ✅ wait for API
        setReports(data); // ✅ set actual array

        console.log("Fetched reports:", data);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoadingReports(false);
      }
    };

    loadReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axiosClient.get(`/healthworker/tests-by-patient`, {
        params: { patient_id: patient.patient_id },
      });
      console.log("Fetched reports:", response);
      return response;
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      return [];
    }
  };

  const handleReportPress = (report: Report) => {
    router.push({
      pathname: "/components/test-results",
      params: {
        data: JSON.stringify(report),
        patientData: JSON.stringify(patient),
      },
    });
  };

  const handleStartNewTest = () => {
    useUserStore.getState().setSelectedPatient(patient);
    router.push({
      pathname: "/components/TimerCameraUploader",
    });
  };

  // ── Stat block ──
  const Stat = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const handleEdit = () => {
    router.push({
      pathname: "/patients/add",
      params: { data: JSON.stringify(patient) },
    });
  };

  return (
    <View style={styles.container}>
      {/* ── Dark header ── */}
      <View style={[styles.headerBg, { paddingTop: insets.top + 2 }]}>
        {/* Back */}

        <BackButton title="Back" onPress={() => router.back()} color="white" />

        {/* Profile card */}
        <Animated.View
          style={[
            styles.profileCard,
            { opacity: cardAnim, transform: [{ translateY: cardSlide }] },
          ]}
        >
          {/* Avatar + name */}
          <View style={styles.profileTop}>
            {/* {patient.avatar ? (
              <Image
                source={{ uri: patient.avatar }}
                style={styles.profileAvatar}
              />
            ) : ( */}
            <View style={[styles.profileAvatar, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>
                {patient.full_name
                  .split(" ")
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
            {/* )} */}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.profileName}>{patient.full_name}</Text>
              <Text style={styles.profileMeta}>
                {String(
                  patient.patient_uniqueid ?? patient.patient_id,
                ).padStart(4, "0")}{" "}
                | {patient.age} yrs, {patient.gender}
              </Text>
            </View>
            <View style={{ gap: 6, alignItems: "flex-end" }}>
              <TouchableOpacity
                onPress={handleEdit}
                activeOpacity={0.75}
                style={{ padding: 6 }}
              >
                <Feather
                  name="edit"
                  size={25}
                  color={colors.blue}
                  onPress={handleEdit}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          {/* <View style={styles.cardDivider} /> */}
        </Animated.View>
      </View>

      {/* ── Reports list ── */}
      {loadingReports ? (
        <ActivityIndicator size="large" color={ACCENT} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item?.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>List of Reports</Text>
          }
          renderItem={({ item }) => (
            <ReportRow item={item} onPress={() => handleReportPress(item)} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No reports available</Text>
          }
        />
      )}

      {/* ── Start New Test CTA ── */}
      <View style={[styles.footer, { paddingBottom: 10 }]}>
        <TouchableOpacity
          onPress={handleStartNewTest}
          activeOpacity={0.85}
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>Start New Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_BG = colors.HEADER_BG;
const CARD_BG = colors.CARD_BG;
const ACCENT = colors.ACCENT;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF3FA" },

  headerBg: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backArrow: { fontSize: rf(20), color: "#FFFFFF", lineHeight: rf(22) },
  backLabel: { fontSize: rf(16), color: "#FFFFFF", fontWeight: "500" },

  profileCard: {
    backgroundColor: "#EFADE5",
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  initialsAvatar: {
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { fontSize: rf(22), fontWeight: "700", color: "#FFFFFF" },
  profileName: {
    fontSize: rf(20),
    fontWeight: "800",
    color: "#0D1B2E",
    letterSpacing: -0.3,
  },
  profileMeta: { fontSize: rf(13), color: "#2D3E50", fontWeight: "500" },

  cardDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBlock: { flex: 1, alignItems: "center", gap: 4 },
  statSep: { width: 1, height: 36, backgroundColor: "rgba(0,0,0,0.12)" },
  statLabel: { fontSize: rf(12.5), color: "#3D5068", fontWeight: "500" },
  statValue: { fontSize: rf(15), fontWeight: "800", color: "#0D1B2E" },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    // paddingBottom: 20,
    gap: 0,
  },
  sectionTitle: {
    fontSize: rf(16),
    fontWeight: "800",
    color: "#0D1B2E",
    marginBottom: 8,
  },

  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    gap: 14,
    shadowColor: "#7090C0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // elevation: 3,
    borderWidth: 1,
    borderColor: "#E8EFF8",
    marginBottom: 10,
  },

  pdfBox: {
    width: 38,
    height: 44,
    backgroundColor: "#FFF0EB",
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  pdfFold: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: ACCENT,
    borderBottomLeftRadius: 6,
  },
  pdfLabel: {
    fontSize: rf(9),
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: 0.5,
    marginTop: 4,
  },

  reportInfo: { flex: 1, gap: 4 },
  reportTestId: { fontSize: rf(13.5), color: "#4A5E74" },
  reportDate: { fontSize: rf(13), color: "#4A5E74" },
  bold: { fontWeight: "800", color: "#0D1B2E" },

  chevron: { fontSize: rf(22), color: "#B0C0D8", lineHeight: rf(26) },
  emptyText: {
    textAlign: "center",
    color: "#9BADC4",
    fontSize: rf(14),
    marginTop: 40,
  },

  ctaWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  ctaBtn: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 12,
    // paddingHorizontal: "20%",
    // shadowColor: ACCENT,
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.35,
    // shadowRadius: 14,
    // elevation: 8,
  },
  ctaLabel: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0EAF5",
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
