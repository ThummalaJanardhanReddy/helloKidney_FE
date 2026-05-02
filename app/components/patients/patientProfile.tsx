import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");
const scale = width / 390;
const rf = (size) => Math.round(size * scale);

// ── Placeholder API response ──────────────────────────────────────────────────
const MOCK_PROFILE = {
  id: "1",
  name: "Dinesh Kumar",
  mrNumber: "MR23876",
  age: 33,
  gender: "Male",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  height: "5.6 ft",
  weight: "64.5 KG",
  bmi: "120 mg/dl",
};

const MOCK_REPORTS = [
  { id: "r1", testId: "#23576", testDate: "12th Sep 2024, 5:20 PM" },
  { id: "r2", testId: "#23575", testDate: "29th Mar 2024 10:40 PM" },
  { id: "r3", testId: "#23574", testDate: "15th Jan 2024 9:00 AM" },
];

// ── PDF icon (SVG-style via View) ─────────────────────────────────────────────
function PdfIcon() {
  return (
    <View style={styles.pdfIconContainer}>
      <View style={styles.pdfIconBody}>
        <View style={styles.pdfIconFold} />
        <Text style={styles.pdfIconText}>PDF</Text>
      </View>
    </View>
  );
}

// ── Report row item ───────────────────────────────────────────────────────────
function ReportItem({ item, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 300 + index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: 300 + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 120, friction: 8 }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }).start()
        }
        onPress={() => onPress(item)}
        style={styles.reportCard}
      >
        <PdfIcon />

        <View style={styles.reportInfo}>
          <Text style={styles.reportTestId}>
            Test Id: <Text style={styles.reportTestIdBold}>{item.testId}</Text>
          </Text>
          <Text style={styles.reportDate}>
            Test Date: <Text style={styles.reportDateBold}>{item.testDate}</Text>
          </Text>
        </View>

        <Text style={styles.reportChevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PatientProfileScreen({ navigation, route }) {
  // Accept passed patient or fall back to mock
  const passedPatient = route?.params?.patient;
  const profile = passedPatient
    ? { ...MOCK_PROFILE, ...passedPatient }
    : MOCK_PROFILE;
  const reports = MOCK_REPORTS;

  // Animations
  const cardAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardAnim, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleBack = () => {
    navigation?.goBack?.();
  };

  const handleReportPress = (report) => {
    navigation?.navigate?.("ReportDetail", { report });
    console.log("Report pressed:", report.testId);
  };

  const handleStartNewTest = () => {
    navigation?.navigate?.("NewTest", { patient: profile });
    console.log("Start New Test pressed for:", profile.name);
  };

  // Stat block
  const StatBlock = ({ label, value }) => (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Dark header area ── */}
      <View style={styles.headerBg}>
        {/* Back button */}
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        {/* Profile card */}
        <Animated.View
          style={[
            styles.profileCard,
            {
              opacity: cardAnim,
              transform: [{ translateY: cardSlide }],
            },
          ]}
        >
          {/* Top row: avatar + name */}
          <View style={styles.profileTopRow}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileNameBlock}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileMeta}>
                {profile.mrNumber} | {profile.age} yrs, {profile.gender}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBlock label="Height" value={profile.height ?? MOCK_PROFILE.height} />
            <View style={styles.statSep} />
            <StatBlock label="Weight" value={profile.weight ?? MOCK_PROFILE.weight} />
            <View style={styles.statSep} />
            <StatBlock label="BMI" value={profile.bmi ?? MOCK_PROFILE.bmi} />
          </View>
        </Animated.View>
      </View>

      {/* ── Reports list ── */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>List of Reports</Text>
        }
        renderItem={({ item, index }) => (
          <ReportItem item={item} index={index} onPress={handleReportPress} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No reports available</Text>
        }
      />

      {/* ── Start New Test CTA ── */}
      <View style={styles.ctaWrapper}>
        <TouchableOpacity
          onPress={handleStartNewTest}
          activeOpacity={0.85}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaLabel}>Start New Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_BG = "#0D1B2E";
const CARD_BG = "#DFA8E4"; // lavender-pink matching design
const ACCENT = "#E05A3A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3FA",
  },

  // Header
  headerBg: {
    backgroundColor: HEADER_BG,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backArrow: {
    fontSize: rf(20),
    color: "#FFFFFF",
    lineHeight: rf(22),
  },
  backLabel: {
    fontSize: rf(16),
    color: "#FFFFFF",
    fontWeight: "500",
  },

  // Profile card
  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: rf(22),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileNameBlock: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: rf(20),
    fontWeight: "800",
    color: "#0D1B2E",
    letterSpacing: -0.3,
  },
  profileMeta: {
    fontSize: rf(13),
    color: "#2D3E50",
    fontWeight: "500",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginBottom: 14,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statSep: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  statLabel: {
    fontSize: rf(12.5),
    color: "#3D5068",
    fontWeight: "500",
  },
  statValue: {
    fontSize: rf(15),
    fontWeight: "800",
    color: "#0D1B2E",
    letterSpacing: -0.2,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
    gap: 12,
  },
  sectionTitle: {
    fontSize: rf(16),
    fontWeight: "800",
    color: "#0D1B2E",
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  // Report card
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
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8EFF8",
    marginBottom: 12,
  },

  // PDF icon
  pdfIconContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  pdfIconBody: {
    width: 38,
    height: 44,
    backgroundColor: "#FFF0EB",
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "#E05A3A",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  pdfIconFold: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    backgroundColor: "#E05A3A",
    borderBottomLeftRadius: 6,
  },
  pdfIconText: {
    fontSize: rf(9),
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: 0.5,
    marginTop: 4,
  },

  reportInfo: {
    flex: 1,
    gap: 4,
  },
  reportTestId: {
    fontSize: rf(13.5),
    color: "#4A5E74",
    fontWeight: "400",
  },
  reportTestIdBold: {
    fontWeight: "800",
    color: "#0D1B2E",
  },
  reportDate: {
    fontSize: rf(13),
    color: "#4A5E74",
    fontWeight: "400",
  },
  reportDateBold: {
    fontWeight: "700",
    color: "#0D1B2E",
  },
  reportChevron: {
    fontSize: rf(22),
    color: "#B0C0D8",
    fontWeight: "300",
    lineHeight: rf(26),
  },

  emptyText: {
    textAlign: "center",
    color: "#9BADC4",
    fontSize: rf(14),
    marginTop: 40,
  },

  // CTA
  ctaWrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  ctaBtn: {
    backgroundColor: "#C0392B",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 60,
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaLabel: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});