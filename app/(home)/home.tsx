import { images } from "@/assets";
import { Ionicons } from "@expo/vector-icons";
import {
  FadingView,
  Header as PinnedHeader,
  ScrollViewWithHeaders,
} from "@codeherence/react-native-header";
import { LinearGradient } from "expo-linear-gradient";
import ReanimatedAnimated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_MARGIN,
  useTabBarScrollHandler,
  useTabBarScrollWorklet,
} from "@/src/navigation/tabBarVisibility";
import { router, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, Image, Linking, Modal, PanResponder, StyleSheet, TouchableOpacity, View, Animated, StatusBar, Platform } from "react-native";
import Text from "../components/Text";
import * as Animatable from "react-native-animatable";
import { SvgXml } from "react-native-svg";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
// import { StatusBar } from "expo-status-bar";
import RoundButton from "../shared/RoundButton";
import { colors, pageTitle } from "../shared/commonStyles";
import { useUserStore } from "../stores/userStore";
import { steps } from "../shared/userGuideSteps";
import { KIDNEY_RESULT_SVG } from "../shared/resultSvgs";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import axiosClient from "@/src/services/axiosClient";
import {
  getAllPatients,
  getPatientsCount,
  getPatientsWithStatus,
  getTodaysTestsCount,
} from "@/src/services/healthworkerService";

dayjs.extend(advancedFormat);

type LatestUacrResult = {
  uacr?: string;
  stage?: string;
  albumin?: string;
  creatinine?: string;
  date?: string;
  raw?: any;
};

const UACR_STAGE_META: Record<string, { label: string; color: string }> = {
  A1: { label: "Normal", color: "#1FA24A" },
  A2: { label: "Slightly Abnormal", color: "#F5A623" },
  A3: { label: "Abnormal", color: "#D51E16" },
};

// Stage derived from the observed uACR value itself (mg/g): <30 Normal,
// 30–300 Slightly Abnormal, >300 Abnormal.
const getUacrStage = (uacrText?: string): "A1" | "A2" | "A3" | undefined => {
  if (!uacrText) return undefined;
  const value = parseFloat(uacrText);
  if (Number.isNaN(value)) return undefined;
  if (value < 30) return "A1";
  if (value <= 300) return "A2";
  return "A3";
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (screenWidth / 390));

// TODO: replace with the real care-team support number before release.
const SUPPORT_PHONE_NUMBER = "+917660009100";

// Dedicated to the Home screen's background only — change this to re-theme
// just this section without touching other screens/colors.
const HOME_BG_COLOR = "#FCF2ED";

// Separate decorative accent for just the top-right corner of the header
// (roughly half the screen's width) — its own color vars, independent of
// the page background above. Fades out via alpha, not a hand-matched solid
// color, so it blends cleanly no matter what the background colors are.
const CORNER_ACCENT_COLORS = ["rgba(250, 227, 228, 0.1)", "#FAE3E4"] as const;
const CORNER_ACCENT_WIDTH = screenWidth * 0.4;
const CORNER_ACCENT_HEIGHT = 130;

interface IPatient {
  address: null;
  age: 90;
  city: null;
  created_on: "2026-04-06T17:59:06.249485";
  district: null;
  email_id: null;
  full_name: "Jana T";
  gender: "Male";
  locality: null;
  mobile_no: "+918978298289";
  patient_id: 1;
  patient_uniqueid: null;
  pincode: null;
  state: null;
  user_name: null;
  test_count?: 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: User Guide Modal
// ─────────────────────────────────────────────────────────────────────────────
function UserGuideModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const open = () =>
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

  const close = () => {
    setCurrentStep(0);
    Animated.timing(stepSlide, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 280,
      useNativeDriver: true,
    }).start(onClose);
  };

  React.useEffect(() => {
    if (visible) open();
  }, [visible]);

  const goToStep = (index: number) => {
    Animated.timing(stepSlide, {
      toValue: -index * screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setCurrentStep(index);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -40 && currentStep < steps.length - 1)
        goToStep(currentStep + 1);
      else if (g.dx > 40 && currentStep > 0) goToStep(currentStep - 1);
    },
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={shared.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={close} />
        <View>
          <Animated.View
            style={[
              shared.modalContainer,
              { paddingBottom: insets.bottom },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={shared.modalHeader}>
              <Text style={shared.modalTitle}>User Guide</Text>
              <TouchableOpacity onPress={close}>
                <Image source={images.close} style={shared.closeIcon} />
              </TouchableOpacity>
            </View>
            <View {...panResponder.panHandlers}>
              <Animated.View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  width: screenWidth * steps.length,
                  transform: [{ translateX: stepSlide }],
                }}
              >
                {steps.map((step, index) => (
                  <View key={step.id} style={shared.stepCard}>
                    <Text style={shared.stepCounter}>Step {index + 1}</Text>
                    <Text style={shared.stepTopText}>{step.topText}</Text>
                    {step.svg ? (
                      <SvgXml xml={step.svg} width="100%" height={170} />
                    ) : (
                      <Image
                        source={step.image}
                        style={shared.stepImage}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={shared.stepBottomText}>{step.bottomText}</Text>
                    <TouchableOpacity
                      style={shared.stepButton}
                      onPress={() =>
                        index === steps.length - 1
                          ? close()
                          : goToStep(index + 1)
                      }
                    >
                      <Text style={shared.stepButtonText}>
                        {step.buttonText}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </Animated.View>
              <View style={shared.dotContainer}>
                {steps.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      shared.dot,
                      currentStep === idx && shared.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Menu icon — three bars, middle one longer than top/bottom
// ─────────────────────────────────────────────────────────────────────────────
function MenuIcon({
  size = 28,
  color = colors.black,
}: {
  size?: number;
  color?: string;
}) {
  const barHeight = Math.max(3, Math.round(size * 0.12));
  const gap = Math.round(size * 0.2);
  const barStyle = { height: barHeight, borderRadius: barHeight / 2, backgroundColor: color };
  return (
    <View style={{ width: size, justifyContent: "center", gap }}>
      <View style={[barStyle, { width: "70%" }]} />
      <View style={[barStyle, { width: "100%" }]} />
      <View style={[barStyle, { width: "55%" }]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: capitalize a full name — used by both HealthWorkerHome and
// PatientHome's header
// ─────────────────────────────────────────────────────────────────────────────
const capitalizeName = (name?: string) =>
  name
    ?.trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: User Guide Info Card  ← identical look for both user types
// ─────────────────────────────────────────────────────────────────────────────
function UserGuideCard({ onPress }: { onPress: () => void }) {
  return (
    <View style={shared.infoCard}>
      <Image
        source={images.cust_rep}
        resizeMode="contain"
        style={shared.infoImage}
      />
      <View style={{ flex: 1 }}>
        <Text style={shared.infoText}>
          Before starting the test, {"\n"}view the user guide.
        </Text>
        <TouchableOpacity
          style={shared.userGuideBtn}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={shared.userGuideBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH WORKER HOME
// ─────────────────────────────────────────────────────────────────────────────

const REGISTERED_PATIENTS_SKELETON_COUNT = 2;

function StatCardSkeleton() {
  return (
    <Animatable.View
      animation="pulse"
      easing="ease-out"
      iterationCount="infinite"
      style={hw.statCard}
    >
      <View style={[hw.statIcon, hw.skeletonBlock]} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={[hw.skeletonLine, { width: "70%" }]} />
        <View style={[hw.skeletonLine, { width: "40%", height: 16 }]} />
      </View>
    </Animatable.View>
  );
}

function PatientCardSkeleton() {
  return (
    <Animatable.View
      animation="pulse"
      easing="ease-out"
      iterationCount="infinite"
      style={hw.patientCard}
    >
      <View style={hw.cardTopRow}>
        <View style={[hw.profileAvatar, hw.initialsAvatar, hw.skeletonBlock]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[hw.skeletonLine, { width: "65%" }]} />
          <View style={[hw.skeletonLine, { width: "45%" }]} />
        </View>
      </View>
    </Animatable.View>
  );
}

// WhatsApp/Help "assist" cards share one shape — same skeleton with the
// real card's own container style passed in so the pulse matches its size.
function AssistCardSkeleton({ cardStyle }: { cardStyle: any }) {
  return (
    <Animatable.View
      animation="pulse"
      easing="ease-out"
      iterationCount="infinite"
      style={[cardStyle, { backgroundColor: colors.white }]}
    >
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[hw.skeletonLine, { width: "70%", height: 16 }]} />
        <View style={[hw.skeletonLine, { width: "90%" }]} />
        <View style={[hw.skeletonBlock, hw.skeletonBtn]} />
      </View>
      <View style={[hw.assistCardImage, hw.skeletonBlock, { borderRadius: 12 }]} />
    </Animatable.View>
  );
}

// ── Search bar — hoisted to module scope (NOT defined inside the screen
// component) so it keeps a stable component identity across renders. A
// component defined inline inside a parent's render body gets treated by
// React as a brand-new component type on every render, which would force
// anything stateful inside it (e.g. a focused TextInput) to unmount/remount
// on every keystroke elsewhere in the screen. ──────────────────────────────
function SearchBar({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={hw.searchBar} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name="search" size={18} color="#8A8A8E" />
      <Text style={hw.searchPlaceholder}>
        Search for patient name, test id
      </Text>
    </TouchableOpacity>
  );
}

// ── Pinned header content — also hoisted for the same reason as SearchBar
// above. paddingTop animates with the library's own showNavBar value (0 at
// rest, 1 once scrolled past the large header), so it's 0 while nothing has
// scrolled and eases up to the device's actual safe-area top inset (not a
// hardcoded number — that over-clears on devices with a smaller status bar,
// e.g. notch vs Dynamic Island) only once the header actually docks at the
// top. ───────────────────────────────────────────────────────────────────
function PinnedSearchHeader({
  showNavBar,
  insetsTop,
  onSearchPress,
}: {
  showNavBar: SharedValue<number>;
  insetsTop: number;
  onSearchPress: () => void;
}) {
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    paddingTop: interpolate(showNavBar.value, [0, 1], [0, insetsTop]),
  }));

  return (
    <PinnedHeader
      showNavBar={showNavBar}
      ignoreTopSafeArea
      headerStyle={animatedHeaderStyle}
      headerCenter={
        <View style={{ flex: 1 }}>
          <SearchBar onPress={onSearchPress} />
        </View>
      }
      headerCenterStyle={{ flex: 1, paddingHorizontal: 0 }}
      headerLeftStyle={{ width: 0 }}
      headerRightStyle={{ width: 0 }}
      noBottomBorder
      SurfaceComponent={() => (
        <FadingView
          opacity={showNavBar}
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: HOME_BG_COLOR },
          ]}
        />
      )}
    />
  );
}

function HealthWorkerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarScrollWorklet = useTabBarScrollWorklet();
  const [showGuide, setShowGuide] = useState(false);
  const { user } = useUserStore();
  const isReturningUser = useUserStore((s) => s.isReturningUser);
  const [totalPatients, setTotalPatients] = useState(0);
  const [todaysTests, setTodaysTests] = useState(0);
  const [registeredPatients, setRegisteredPatients] = useState<IPatient[]>([]);
  // Two separate flags, one per section — the stat cards and the registered-
  // patients list are fetched independently, and sharing a single loading
  // flag between them meant whichever request finished first hid BOTH
  // sections' skeletons, even while the other was still loading.
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRegisteredPatients, setLoadingRegisteredPatients] = useState(true);
  // Only the very first load should show skeletons — refetching on every
  // focus (e.g. returning from a patient's detail page) shouldn't wipe out
  // the already-loaded stats/list.
  const didInitialStatsLoadRef = useRef(false);
  const didInitialPatientsLoadRef = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
      fetchRegisteredPatients();
    }, []),
  );

  // Total patients + today's tests feed the same stats row, so they share
  // one loading flag — Promise.allSettled means a slow one doesn't block the
  // other's result, but the flag only clears once both have settled.
  const fetchStats = async () => {
    if (!didInitialStatsLoadRef.current) {
      setLoadingStats(true);
    }
    const [countsRes, testsRes] = await Promise.allSettled([
      getPatientsCount(user?.userId || ""),
      getTodaysTestsCount(user?.userId || ""),
    ]);

    if (countsRes.status === "fulfilled") {
      setTotalPatients((countsRes.value as any)?.count || 0);
    } else {
      console.error("Error fetching total patients:", countsRes.reason);
    }

    if (testsRes.status === "fulfilled") {
      setTodaysTests((testsRes.value as any)?.count || 0);
    } else {
      console.error("Error fetching today's tests:", testsRes.reason);
    }

    setLoadingStats(false);
    didInitialStatsLoadRef.current = true;
  };

  const fetchRegisteredPatients = async () => {
    try {
      if (!didInitialPatientsLoadRef.current) {
        setLoadingRegisteredPatients(true);
      }
      const res = (await getPatientsWithStatus(
        Number.parseInt(user?.userId || "0"),
        3,
      )) as any;
      console.log("Registered patients:", res);
      setRegisteredPatients(res?.patients || []);
    } catch (error) {
      console.error("Error fetching registered patients:", error);
    } finally {
      setLoadingRegisteredPatients(false);
      didInitialPatientsLoadRef.current = true;
    }
  };

  const handlePatientPress = (patient: IPatient) => {
    router.push({
      pathname: "/patients/[id]",
      params: { id: patient.patient_id, data: JSON.stringify(patient) },
    });
  };

  const handleStartTest = (patient: IPatient) => {
    router.push({
      pathname: "/components/TimerCameraUploader",
      params: { patientId: patient.patient_uniqueid },
    });
  };

  const handleTotalPatientsClick = () => {
    router.push("/patients");
  };

  const handleTodaysTestClick = () => {
    router.push("/(home)/tests");
  };

  const getGenderAvatar = (gender?: string | null) => {
    const g = gender?.trim().toLowerCase();
    if (g === "male") return images.maleProfile;
    if (g === "female") return images.femaleProfile;
    return images.noProfile;
  };

  const handleUserGuidePress = () => {
    setShowGuide(true);
    console.log("User guide opened");
  };

  const handleSearchPress = () => {
    router.push("/patients");
  };

  const handleMenuPress = () => {
    router.push("/profile");
  };

  const handleAddPatient = () => {
    router.push({ pathname: "/patients/add", params: { from: "home" } });
  };

  const handleChatCareTeam = () => {
    Linking.openURL(`https://wa.me/${SUPPORT_PHONE_NUMBER.replace("+", "")}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: HOME_BG_COLOR }}>
      <StatusBar translucent backgroundColor="transparent" barStyle={"dark-content"} />

      {/* Blinkit-style collapsing header: the welcome/add-patient row scrolls
          away with the content (LargeHeaderComponent), while the search bar
          settles into a pinned header once it's scrolled under (HeaderComponent). */}
      <ScrollViewWithHeaders
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_MARGIN,
        }}
        showsVerticalScrollIndicator={false}
        headerFadeInThreshold={0.9}
        initialAbsoluteHeaderHeight={60}
        disableAutoFixScroll
        onScrollWorklet={tabBarScrollWorklet}
        absoluteHeader
        LargeHeaderComponent={() => (
          // `absoluteHeader` already reserves ~60px of space above this
          // (the collapsed, invisible pinned search header's own height —
          // see PinnedSearchHeader/SearchBar below, height:40 + marginBottom:20)
          // before this View ever renders, so adding `insets.top` again here
          // double-clears the status bar — this just needs its own breathing
          // room on top of that.
          <View style={{ paddingTop: 12 }}>
            <LinearGradient
              pointerEvents="none"
              colors={CORNER_ACCENT_COLORS}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={hw.cornerAccent}
            />
            <View style={hw.header}>
              <View style={hw.headerLeft}>
                <TouchableOpacity activeOpacity={0.7} hitSlop={10} onPress={handleMenuPress}>
                  <MenuIcon size={28} color={colors.black} />
                </TouchableOpacity>
                <View style={hw.headerTextWrap}>
                  <Text style={hw.welcomeText}>
                    {isReturningUser ? "Welcome back!" : "Welcome!"}
                  </Text>
                  <Text style={hw.nameText}>
                    {capitalizeName(user?.userName)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={10}
                style={hw.helpBtn}
                onPress={() => router.push("/help")}
              >
                <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                <Text style={hw.helpBtnText}>Help</Text>
              </TouchableOpacity>
            </View>
            <SearchBar onPress={handleSearchPress} />
          </View>
        )}
        HeaderComponent={(props) => (
          <PinnedSearchHeader
            {...props}
            insetsTop={insets.top}
            onSearchPress={handleSearchPress}
          />
        )}
      >
        {/* Light section */}
        <View style={hw.lightSection}>
          {/* Stats */}
          <View style={hw.statsRow}>
            {loadingStats ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleTotalPatientsClick}
                  style={{ flex: 1 }}
                >
                  <View style={hw.statCard}>
                    <Image
                      source={images.totalPatients}
                      style={hw.statIcon}
                      resizeMode="contain"
                    />
                    <View>
                      <Text style={hw.statLabel}>Total Patient</Text>
                      <Text style={hw.statValue}>
                        {totalPatients > 0
                          ? String(totalPatients).padStart(2, "0")
                          : 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTodaysTestClick}
                  style={{ flex: 1 }}
                >
                  <View style={hw.statCard}>
                    <Image
                      source={images.todayTests}
                      style={hw.statIcon}
                      resizeMode="contain"
                    />
                    <View>
                      <Text style={hw.statLabel}>Today&apos;s Tests</Text>
                      <Text style={hw.statValue}>
                        {todaysTests > 0 ? String(todaysTests).padStart(2, "0") : 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Registered Patient — single card */}
          {loadingRegisteredPatients ? (
            <>
              {Array.from({ length: REGISTERED_PATIENTS_SKELETON_COUNT }).map(
                (_, i) => (
                  <PatientCardSkeleton key={i} />
                ),
              )}
            </>
          ) : !Array.isArray(registeredPatients) ||
          registeredPatients.length === 0 ? (
            <TouchableOpacity
              onPress={handleAddPatient}
              style={hw.emptyCard}
              activeOpacity={0.75}
            >
              <View style={hw.emptyCircle}>
                <Text style={hw.emptyPlus}>＋</Text>
              </View>
              <Text style={hw.emptyText}>Add Patient</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 0,
                  margin: 0,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600" }}>
                  Registered Patients
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/patients")}
                  activeOpacity={0.8}
                  style={{ marginRight: 8 }}
                >
                  <Text
                    style={{
                      color: colors.DARKBLUE,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    View All
                  </Text>
                </TouchableOpacity>
              </View>

              {registeredPatients.map((patient) => {
                return (
                  <View key={patient.patient_id} style={hw.patientCard}>
                    {/* Card Click */}
                    <TouchableOpacity
                      onPress={() => handlePatientPress(patient)}
                      activeOpacity={0.85}
                    >
                      <View style={hw.cardTopRow}>
                        <Image
                          source={getGenderAvatar(patient.gender)}
                          style={hw.profileAvatar}
                          resizeMode="cover"
                        />

                        <View style={{ flex: 1 }}>
                          <Text style={hw.cardName}>
                            {patient.full_name?.replaceAll(",", "")}
                            <Text style={hw.cardMetaInline}>
                              , {patient.age ?? "--"} years,{" "}
                              {patient.gender ?? "--"}
                            </Text>
                          </Text>
                          <Text style={hw.cardMeta}>
                            {String(patient.patient_id).padStart(4, "0")} |{" "}
                            {patient.mobile_no}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {patient?.test_count != null && (
                      <Text
                        style={[
                          {
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: "400",
                            paddingLeft: 71,
                            marginBottom: 6,
                          },
                          patient.test_count > 0
                            ? { color: "#49A70F" }
                            : { color: "#FFA619" },
                        ]}
                      >
                        {patient.test_count > 0
                          ? "Screening Completed"
                          : "Screening Pending"}
                      </Text>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>
        <View style={[hw.lightSection, { paddingTop: 0 }]}>
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: colors.black }}
          >
            Other Links
          </Text>
          {/* User guide card hidden on Home */}
          {/* <UserGuideCard onPress={handleUserGuidePress} /> */}

          {loadingRegisteredPatients ? (
            <>
              <AssistCardSkeleton cardStyle={hw.whatsappCard} />
              <AssistCardSkeleton cardStyle={hw.helpCard} />
            </>
          ) : (
            <>
              <View style={hw.whatsappCard}>
                <View style={{ flex: 1 }}>
                  <Text style={hw.assistCardTitle}>Need further assistance?</Text>
                  <Text style={hw.assistCardSubtitle}>
                    We are here to help you!
                  </Text>
                  <TouchableOpacity
                    style={hw.whatsappBtn}
                    activeOpacity={0.8}
                    onPress={handleChatCareTeam}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                    <Text style={hw.whatsappBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={images.whatsappSupportAgent}
                  resizeMode="contain"
                  style={hw.assistCardImage}
                />
              </View>

              {/* <View style={hw.helpCard}>
                <View style={{ flex: 1 }}>
                  <Text style={hw.assistCardTitle}>Need help getting started?</Text>
                  <Text style={hw.assistCardSubtitle}>
                    Browse our FAQs and guides
                  </Text>
                  <TouchableOpacity
                    style={hw.helpCardBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push("/help")}
                  >
                    <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                    <Text style={hw.helpCardBtnText}>Help Center</Text>
                  </TouchableOpacity>
                </View>
                <View style={hw.helpCardIconWrap}>
                  <Ionicons name="help-circle" size={56} color={colors.primary} />
                </View>
              </View> */}
            </>
          )}
        </View>

        {/* Footer tagline */}
        <View style={hw.footerTagline}>
          <Text style={hw.footerTaglineTitle}>Screen Early – Act Early</Text>
          <Text style={hw.footerTaglineSubtitle}>
            Prevention ❤️ Is better than Cure.
          </Text>
        </View>
      </ScrollViewWithHeaders>
      <UserGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT HOME
// ─────────────────────────────────────────────────────────────────────────────

// PLACEHOLDER content — swap in real patient testimonials (and photos, if
// available) before shipping; these are not real quotes.
const TESTIMONIALS = [
  {
    name: "Asha R.",
    role: "Kukatpally",
    quote:
      "The UACR test was so easy to do at home. Results came back within minutes and gave me real peace of mind.",
    avatar: images.femaleProfile,
  },
  {
    name: "Rajesh K.",
    role: "Guntur",
    quote:
      "I was worried about my kidney health, but HelloKidney made it simple to track and understand my results.",
    avatar: images.maleProfile,
  },
  {
    name: "Priya M.",
    role: "Miyapur",
    quote:
      "Quick, reliable and affordable. I recommend this to anyone managing diabetes who wants to stay on top of things.",
    avatar: images.femaleProfile,
  },
  {
    name: "Suresh V.",
    role: "Hydrabad",
    quote:
      "The app guided me step by step through the test. No need to visit a lab every time — huge time saver.",
    avatar: images.maleProfile,
  },
] as const;

// The carousel sits inside the screen's ScrollView, which has
// paddingHorizontal: 22 (see pt.scrollContent) — that's the FlatList's own
// rendered width, i.e. the "viewport" each card snaps within.
const TESTIMONIAL_VIEWPORT_WIDTH = screenWidth - 44;
const TESTIMONIAL_CARD_GAP = 10;
// Sized so one snapped card fills ~90% of the viewport, leaving ~10% of the
// next card peeking in at the edge.
const TESTIMONIAL_CARD_WIDTH =
  Math.round(TESTIMONIAL_VIEWPORT_WIDTH * 0.9) - TESTIMONIAL_CARD_GAP;
const TESTIMONIAL_AUTOSCROLL_MS = 3500;

function TestimonialsCarousel() {
  const listRef = useRef<FlatList>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % TESTIMONIALS.length;
      listRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
    }, TESTIMONIAL_AUTOSCROLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <FlatList
      ref={listRef}
      data={TESTIMONIALS}
      keyExtractor={(item) => item.name}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={TESTIMONIAL_CARD_WIDTH + TESTIMONIAL_CARD_GAP}
      decelerationRate="fast"
      contentContainerStyle={{ gap: TESTIMONIAL_CARD_GAP }}
      onScrollToIndexFailed={(info) => {
        listRef.current?.scrollToOffset({
          offset: info.index * (TESTIMONIAL_CARD_WIDTH + TESTIMONIAL_CARD_GAP),
          animated: true,
        });
      }}
      renderItem={({ item }) => (
        <View style={[pt.testimonialCard, { width: TESTIMONIAL_CARD_WIDTH }]}>
          <View style={{ flexDirection: "row", gap: 2, marginBottom: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Ionicons key={i} name="star" size={14} color="#FFC107" />
            ))}
          </View>
          <Text style={pt.testimonialQuote}>"{item.quote}"</Text>
          <View style={pt.testimonialFooter}>
            <Image source={item.avatar} style={pt.testimonialAvatar} />
            <View>
              <Text style={pt.testimonialName}>{item.name}</Text>
              <Text style={pt.testimonialRole}>{item.role}</Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}

function PatientHome() {
  const [showGuide, setShowGuide] = useState(false);
  const [kitContentHeight, setKitContentHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const tabBarScrollHandler = useTabBarScrollHandler();
  const { user } = useUserStore();
  const isReturningUser = useUserStore((s) => s.isReturningUser);
  // This screen has no data fetch of its own — the brief skeleton here is
  // purely to avoid the WhatsApp/Help cards popping in right as the screen
  // mounts, matching the loading treatment used on the health-worker Home.
  const [linksReady, setLinksReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLinksReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const [latestResult, setLatestResult] = useState<LatestUacrResult | null>(null);
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchLatestResult = async () => {
        if (!user?.userId) return;
        try {
          const data = await axiosClient.get("/users/tests", {
            params: { patient_id: user.userId, page: 1, limit: 1 },
          });
          const item = Array.isArray(data) ? data[0] : null;
          if (!item || !isActive) return;
          const metrics = JSON.parse(item.output_metrics || "{}");
          setLatestResult({
            uacr: metrics?.uacrInfo?.value,
            stage: metrics?.uacrInfo?.stage,
            albumin: metrics?.microalbuminInfo?.value,
            creatinine: metrics?.creatinineInfo?.value,
            date: item.created_timestamp,
            raw: item,
          });
        } catch (error) {
          console.error("Failed to fetch latest uACR result:", error);
        }
      };
      fetchLatestResult();
      return () => {
        isActive = false;
      };
    }, [user?.userId]),
  );

  const startTest = () => {
    router.push({
      pathname: "/components/start-test",
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg_primary,
        paddingTop: insets.top + 12,
      }}
    >
      {/* <StatusBar backgroundColor={colors.bg_home} barStyle={"light-content"} /> */}
      <StatusBar barStyle={"dark-content"} backgroundColor={colors.bg_home} animated />
      <View style={hw.header}>
        <View style={hw.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={10}
            onPress={() => router.push("/profile")}
          >
            <MenuIcon size={28} color={colors.black} />
          </TouchableOpacity>
          <View style={hw.headerTextWrap}>
            <Text style={hw.welcomeText}>
              {isReturningUser ? "Welcome back!" : "Welcome!"}
            </Text>
            <Text style={hw.nameText}>{capitalizeName(user?.userName)}</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={10}
          style={hw.helpBtn}
          onPress={() => router.push("/help")}
        >
          <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
          <Text style={hw.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>
      <ReanimatedAnimated.ScrollView
        style={pt.container}
        contentContainerStyle={pt.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={tabBarScrollHandler}
        scrollEventThrottle={16}
      >
        <View style={pt.startSection}>
          {/* Previous circular "START TEST" button — replaced with the card below */}
          {/* <RoundButton
            size={200}
            borderWidth={22}
            content="START TEST"
            backgroundColor="#ffffff"
            textColor="red"
            borderColor="#3A4665"
            onPress={startTest}
          /> */}
          {/* TEMP: both "Start uACR Test" card designs shown together for
              manager review — once a design is picked, delete the other
              block (and its unused _Old or non-_Old styles). */}
          {!latestResult && (
            <View style={pt.startCard}>
              <Text style={pt.startCardTitleSmall}>Check your</Text>
              <Text style={pt.startCardTitleLarge}>Kidney Health</Text>
              <Text style={pt.startCardSubtitle}>in 60 seconds</Text>
              <Image
                source={images.kidneyThemeTest}
                resizeMode="contain"
                style={pt.startCardImage}
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={startTest}
                style={pt.startCardCtaWrapper}
              >
                <LinearGradient
                  colors={["#E1121B", "#BA1A22"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={pt.startCardCta}
                >
                  <Text style={pt.startCardCtaText}>Start uACR Test</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          {/* <TouchableOpacity activeOpacity={0.85} onPress={startTest} style={pt.startCardWrapperOld}>
            <LinearGradient
              colors={[colors.primary, "#FF7A63"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={pt.startCardOld}
            >
              <View style={pt.startCardIconWrapOld}>
                <Ionicons name="pulse" size={28} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pt.startCardTitleOld}>Check your Kidney health</Text>
                <Text style={pt.startCardSubtitleOld}>in 60 seconds</Text>
                <View style={pt.startCardCtaOld}>
                  <Text style={pt.startCardCtaTextOld}>Start uACR Test</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity> */}
        </View>

        {latestResult && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={pt.resultCard}
            onPress={() => {
              const patientData = {
                address: null,
                age: user?.age ? Number(user.age) : null,
                city: null,
                created_on: "",
                district: null,
                email_id: null,
                full_name: user?.userName || "",
                gender: user?.gender || "",
                locality: null,
                mobile_no: user?.phone || "",
                patient_id: user?.userId,
                patient_uniqueid: null,
                pincode: null,
                state: null,
                user_name: user?.userName || null,
              };
              router.push({
                pathname: "/components/test-results",
                params: {
                  data: JSON.stringify(latestResult.raw || {}),
                  patientData: JSON.stringify(patientData),
                },
              });
            }}
          >
            <View style={pt.resultCardHeader}>
              <SvgXml xml={KIDNEY_RESULT_SVG} width={48} height={65} />
              <View style={{ flex: 1 }}>
                <Text style={pt.resultCardTitle}>uACR test results</Text>
                <Text style={pt.resultCardPatientName} numberOfLines={1}>
                  {user?.userName || ""}
                </Text>
                <Text style={pt.resultCardDate}>
                  {latestResult.date
                    ? dayjs(latestResult.date).format("Do MMM, YYYY")
                    : ""}
                </Text>

                <View style={pt.resultPrimaryBox}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "baseline",
                      marginRight: 8,
                    }}
                  >
                    <Text
                      style={[
                        pt.resultStageValue,
                        {
                          color:
                            UACR_STAGE_META[
                              getUacrStage(latestResult.uacr) || ""
                            ]?.color ?? colors.black,
                        },
                      ]}
                    >
                      {getUacrStage(latestResult.uacr) || "—"}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        pt.resultStageLabel,
                        {
                          flexShrink: 1,
                          color:
                            UACR_STAGE_META[
                              getUacrStage(latestResult.uacr) || ""
                            ]?.color ?? "#1a1a1a",
                        },
                      ]}
                    >
                      {UACR_STAGE_META[getUacrStage(latestResult.uacr) || ""]
                        ?.label ?? ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text numberOfLines={1} style={pt.resultStatLabel}>uACR</Text>
                    <Text numberOfLines={1} style={pt.resultStatValue}>
                      {latestResult.uacr || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={pt.resultStatRow}>
                  <View style={pt.resultStatBox}>
                    <Text numberOfLines={1} style={pt.resultStatLabel}>Microalbumin</Text>
                    <Text numberOfLines={1} style={pt.resultStatValue}>
                      {latestResult.albumin || "N/A"}
                    </Text>
                  </View>
                  <View style={pt.resultStatBox}>
                    <Text numberOfLines={1} style={pt.resultStatLabel}>Creatinine</Text>
                    <Text numberOfLines={1} style={pt.resultStatValue}>
                      {latestResult.creatinine || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.black,
            marginTop: 14,
          }}
        >
          Get your Kit
        </Text>
        <View style={pt.kitCard}>
          <Image
            source={images.uacrKit}
            resizeMode="contain"
            style={[
              pt.kitCardImage,
              {
                height: (kitContentHeight || 135) - 15,
                width: ((kitContentHeight || 135) - 15) * (870 / 1178),
              },
            ]}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View
              onLayout={(e) => setKitContentHeight(e.nativeEvent.layout.height)}
            >
              <Text style={pt.kitCardTitle}>
                Early Kidney Health Screening, Right at Home!
              </Text>
              <Text style={pt.kitCardSubtitle}>
                Detect Early Signs of Kidney Damage at Home with HelloKidney UACR Kit.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Linking.openURL("https://hellokidney.ai/uacr.html")}
              style={pt.kitCardBtnWrapper}
            >
              <LinearGradient
                colors={["#E1121B", "#BA1A22"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={pt.kitCardBtn}
              >
                <Text style={pt.kitCardBtnText}>Buy Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.black,
            marginTop: 14,
          }}
        >
          Other Links
        </Text>
        {/* <UserGuideCard onPress={() => setShowGuide(true)} /> */}

        {!linksReady ? (
          <>
            <AssistCardSkeleton cardStyle={hw.whatsappCard} />
            <AssistCardSkeleton cardStyle={hw.helpCard} />
          </>
        ) : (
          <>
            <View style={hw.whatsappCard}>
              <View style={{ flex: 1 }}>
                <Text style={hw.assistCardTitle}>Need further assistance?</Text>
                <Text style={hw.assistCardSubtitle}>We are here to help you!</Text>
                <TouchableOpacity
                  style={hw.whatsappBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${SUPPORT_PHONE_NUMBER.replace("+", "")}`
                    )
                  }
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={hw.whatsappBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={images.whatsappSupportAgent}
                resizeMode="contain"
                style={hw.assistCardImage}
              />
            </View>

            {/* <View style={hw.helpCard}>
              <View style={{ flex: 1 }}>
                <Text style={hw.assistCardTitle}>Need help getting started?</Text>
                <Text style={hw.assistCardSubtitle}>Browse our FAQs and guides</Text>
                <TouchableOpacity
                  style={hw.helpCardBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push("/help")}
                >
                  <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                  <Text style={hw.helpCardBtnText}>Help Center</Text>
                </TouchableOpacity>
              </View>
              <View style={hw.helpCardIconWrap}>
                <Ionicons name="help-circle" size={56} color={colors.primary} />
              </View>
            </View> */}
          </>
        )}

        <View style={hw.rateCard}>
          <View style={hw.rateCardIconWrap}>
            <Ionicons name="star" size={28} color="#F5A623" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={hw.assistCardTitle}>Enjoying Nephkare?</Text>
            <Text style={hw.assistCardSubtitle}>
              Your review helps us reach more people
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={hw.rateBtnWrapper}
              onPress={() => {
                const androidUrl =
                  "https://play.google.com/store/apps/details?id=ai.hellokidney";
                const iosUrl =
                  "https://apps.apple.com/in/app/hellokidney/id1619042064";
                Linking.openURL(Platform.OS === "ios" ? iosUrl : androidUrl);
              }}
            >
              <LinearGradient
                colors={["#E1121B", "#BA1A22"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={hw.rateBtn}
              >
                <Ionicons name="star" size={16} color={colors.white} />
                <Text style={hw.rateBtnText}>Rate our App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.black,
            marginTop: 14,
            marginBottom: 0,
          }}
        >
          What Our Patients Say
        </Text>
        <TestimonialsCarousel />
      </ReanimatedAnimated.ScrollView>
      <UserGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const userType = useUserStore((s) => s.user?.userType);
  const hasHydrated = useUserStore((s) => s.hasHydrated);

  if (!hasHydrated) return null;
  return userType === "healthworker" ? <HealthWorkerHome /> : <PatientHome />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────
const shared = StyleSheet.create({
  // User Guide modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalContainer: {
    backgroundColor: colors.bg_primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: screenHeight * 0.65,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#b0b2b8",
  },
  modalTitle: { ...pageTitle, color: "#0e1833" },
  closeIcon: { width: 26, height: 26 },
  stepCard: {
    width: screenWidth,
    alignItems: "center",
    padding: 24,
    paddingBottom: 0,
  },
  stepCounter: {
    fontSize: 18,
    fontWeight: "400",
    marginBottom: 10,
    color: "#0e1833",
  },
  stepTopText: {
    fontSize: 18,
    fontWeight: "400",
    marginBottom: 10,
    textAlign: "center",
    color: "#0e1833",
  },
  stepImage: {
    width: 276,
    height: 176,
    marginBottom: 0,
   
  },
  stepBottomText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#0e1833",
  },
  stepButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 8,
    marginBottom: 10,
  },
  stepButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  dotActive: { width: 10, height: 10, backgroundColor: "#0e1833" },

  // Info card — identical for both user types
  infoCard: {
    backgroundColor: "white",
    borderRadius: 10,
    borderColor: colors.BORDER1,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  infoImage: { height: 60, width: 60 },
  infoText: { fontSize: 16, fontWeight: "400" },
  userGuideBtn: {
    marginTop: 6,
    backgroundColor: "white",
    paddingVertical: 4,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderColor: "#EF3024",
    borderWidth: 1,
  },
  userGuideBtnText: { color: "red", fontWeight: "600", fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH WORKER STYLES
// ─────────────────────────────────────────────────────────────────────────────
const hw = StyleSheet.create({
  cornerAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: CORNER_ACCENT_WIDTH,
    height: CORNER_ACCENT_HEIGHT,
    // Large radius so the bottom-left corner reads as a soft curve/wave
    // instead of a hard rectangular edge cutting into the page.
    borderBottomLeftRadius: CORNER_ACCENT_HEIGHT,
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 0,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerTextWrap: {},
  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: Platform.OS === "android" ? 3 : 0,
  },
  helpBtnText: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.primary,
  },
  addPatientBtn: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.DARKBLUE,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#2A3F60",
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: "rgba(0,0,0,0.15)",
  },
  // initialsAvatar: {
  //   backgroundColor: "rgba(255,255,255,0.35)",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  // initialsText: { fontSize: rf(22), fontWeight: "600", color: "#FFFFFF" },
  profileName: {
    fontSize: rf(20),
    fontWeight: "600",
    color: "#0D1B2E",
    letterSpacing: -0.3,
  },
  welcomeText: { fontSize: rf(15), color: "#000000", fontWeight: "400" },
  nameText: {
    fontSize: rf(20),
    color: "#000000",
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.BORDER1,
    paddingHorizontal: 16,
    height: 40,
    marginHorizontal: 22,
    marginBottom: 20,
  },
  searchPlaceholder: { fontSize: rf(14), color: "#8A8A8E" },

  lightSection: {
    paddingHorizontal: 22,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 10,
  },

  // Shared "need assistance" card shape — WhatsApp and Help Center reuse the
  // same layout (title/subtitle/pill button on the left, illustration on
  // the right) with different background, button, and image per card.
  assistCardTitle: {
    fontSize: rf(16),
    fontWeight: "600",
    color: colors.black,
    marginBottom: 4,
  },
  assistCardSubtitle: {
    fontSize: rf(12),
    color: "#5B6170",
    marginBottom: 14,
  },
  assistCardImage: { width: 72, height: 72 },
  helpCardIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg_primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rateCard: {
    backgroundColor: "#FFF8E8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 14,
  },
  rateCardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rateBtnWrapper: {
    alignSelf: "flex-start",
    borderRadius: 19,
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
  },
  rateBtnText: { color: colors.white, fontWeight: "600", fontSize: rf(14) },
  whatsappCard: {
    backgroundColor: "#E8F5EC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#25D366",
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
  },
  whatsappBtnText: { color: colors.black, fontWeight: "600", fontSize: rf(14) },
  helpCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  helpCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
  },
  helpCardBtnText: { color: colors.primary, fontWeight: "600", fontSize: rf(14) },

  footerTagline: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 10,
  },
  footerTaglineTitle: {
    fontSize: rf(26),
    fontWeight: "600",
    color: "#F2B4BA",
    textAlign: "center",
  },
  footerTaglineSubtitle: {
    fontSize: rf(15),
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
  },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderColor: colors.BORDER1,
    borderWidth: 1,
    // shadowColor: "#7090C0",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 6,
    // elevation: 3,
  },
  statIcon: { width: 44, height: 44 },
  // No borderRadius here on purpose — this is layered on top of whatever
  // base style it's combined with (a circular avatar, a square icon), and
  // should inherit that shape rather than override it.
  skeletonBlock: { backgroundColor: "#DDE6F5" },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: "#E2E8F0" },
  skeletonBtn: { width: 130, height: 38, borderRadius: 30, marginTop: 4 },
  statLabel: { fontSize: rf(12), color: colors.black },
  statValue: {
    fontSize: rf(20),
    fontWeight: "600",
    color: colors.black,
    letterSpacing: -0.5,
  },

  sectionTitle: { fontSize: rf(16), fontWeight: "600", color: "#0D1B2E" },

  // Empty state
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 36,
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#D2D2D5",
    borderStyle: "dashed",
  },
  emptyCircle: {
    width: 32,
    height: 32,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#1A2B3C",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPlus: { fontSize: rf(22), color: "#1A2B3C", lineHeight: rf(26) },
  emptyText: { fontSize: rf(15), fontWeight: "600", color: "#1A2B3C" },

  // Single patient card
  patientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderColor: colors.BORDER1,
    borderWidth: 1,
    paddingVertical: 7,
    // shadowColor: "#7090C0",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.12,
    // shadowRadius: 12,
    // elevation: 5,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 8,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  initialsAvatar: {
    backgroundColor: "#DDE6F5",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: rf(16),
    fontWeight: "600",
    color: "#0D1B2E",
    marginBottom: 3,
  },
  cardMetaInline: { fontSize: rf(12), fontWeight: "400", color: colors.black },
  cardMeta: { fontSize: rf(11), color: colors.black },

  startTestBtn: {
    backgroundColor: "#8252A8",
    paddingVertical: 10,
    alignItems: "center",
  },
  startTestBtnText: {
    fontSize: rf(15),
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // Footer
  footerBanner: {
    backgroundColor: colors.bg_home,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: "center",
    gap: 12,
  },
  footerBig: {
    fontSize: rf(64),
    fontWeight: "900",
    color: "rgba(255,255,255,0.12)",
    textAlign: "center",
    lineHeight: rf(68),
    letterSpacing: -2,
  },
  footerSub: {
    fontSize: rf(16),
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT STYLES (original — untouched)
// ─────────────────────────────────────────────────────────────────────────────
const pt = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 5,
    paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_MARGIN,
    gap: 5,
  },
  startSection: { alignItems: "center", gap: 14 },
  startCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  startCardTitleSmall: {
    fontSize: rf(16),
    fontWeight: "600",
    color: colors.primary,
  },
  startCardTitleLarge: {
    fontSize: rf(26),
    fontWeight: "600",
    color: colors.primary,
    marginTop: 2,
  },
  startCardSubtitle: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.primary,
    marginTop: 6,
  },
  startCardImage: {
    width: 150,
    height: 150,
    marginTop: 10,
    marginBottom: 20,
  },
  startCardCtaWrapper: {
    borderRadius: 30,
  },
  startCardCta: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  // --- Previous red-gradient "Start uACR Test" card styles — kept for the
  // commented-out JSX above, not deleted. ---
  startCardWrapperOld: {
    width: "100%",
    borderRadius: 16,
  },
  startCardOld: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  startCardIconWrapOld: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  startCardTitleOld: {
    fontSize: rf(15),
    fontWeight: "600",
    color: colors.white,
    marginBottom: 4,
  },
  startCardSubtitleOld: {
    fontSize: rf(12),
    color: "rgba(255,255,255,0.85)",
    marginBottom: 14,
  },
  startCardCtaOld: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  startCardCtaTextOld: {
    fontSize: rf(12),
    fontWeight: "600",
    color: colors.primary,
  },
  startCardCtaText: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.white,
  },
  kitCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: colors.black,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  kitCardImage: { alignSelf: "flex-start", paddingRight: 8 },
  kitCardTitle: {
    fontSize: rf(15),
    fontWeight: "600",
    color: colors.white,
    marginBottom: 6,
  },
  kitCardSubtitle: {
    fontSize: rf(11),
    color: "rgba(255,255,255,0.7)",
    marginBottom: 14,
  },
  kitCardBtnWrapper: {
    alignSelf: "flex-start",
    borderRadius: 24,
  },
  kitCardBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  kitCardBtnText: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.white,
  },
  resultCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FAE3E4",
    padding: 16,
    borderColor: "#E3B3B3",
    borderWidth: 1,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  resultCardTitle: {
    fontSize: rf(15),
    fontWeight: "600",
    color: colors.black,
  },
  resultCardPatientName: {
    fontSize: rf(12),
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 1,
  },
  resultCardDate: {
    fontSize: rf(12),
    color: "#1a1a1a",
    marginTop: 2,
  },
  resultPrimaryBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 10,
  },
  resultStageValue: {
    fontSize: rf(20),
    fontWeight: "700",
  },
  resultStageLabel: {
    fontSize: rf(11),
    fontWeight: "600",
    color: "#1a1a1a",
    marginLeft: 6,
  },
  resultStatRow: {
    flexDirection: "row",
    gap: 10,
  },
  resultStatBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resultStatLabel: {
    fontSize: rf(11),
    color: "#1a1a1a",
    marginBottom: 4,
  },
  resultStatValue: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.black,
  },
  testimonialCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  testimonialQuote: {
    fontSize: rf(13),
    color: colors.text,
    lineHeight: rf(19),
  },
  testimonialFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  testimonialName: {
    fontSize: rf(13),
    fontWeight: "600",
    color: colors.black,
  },
  testimonialRole: {
    fontSize: rf(11),
    color: colors.textSecondary,
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
  initialsText: { fontSize: rf(22), fontWeight: "600", color: "#FFFFFF" },
  profileName: {
    fontSize: rf(20),
    fontWeight: "600",
    color: "#0D1B2E",
    letterSpacing: -0.3,
  },
});
