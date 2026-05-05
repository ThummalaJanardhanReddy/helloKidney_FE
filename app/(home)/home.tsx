import { images } from "@/assets";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import RoundButton from "../shared/RoundButton";
import { colors } from "../shared/commonStyles";
import { useUserStore } from "../stores/userStore";
import {
  getAllPatients,
  getPatientsCount,
  getPatientsWithStatus,
  getTodaysTestsCount,
} from "@/src/services/healthworkerService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (screenWidth / 390));

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

// ── User guide steps ──────────────────────────────────────────────────────────
const steps = [
  {
    id: 1,
    topText: "Collect your urine sample in\n the provided container",
    bottomText:
      "Collect urine in the container from the\n Midpoint of urination until it reaches the top",
    image: images.userGuide?.step1,
    buttonText: "Urine Collected",
  },
  {
    id: 2,
    topText:
      "Dip the test card in the urine sample\n for 2 seconds, then remove",
    bottomText:
      "tap or shake the card gently\n in order to remove excess droplets",
    image: images.userGuide?.step2,
    buttonText: "Card dipped and shaken",
  },
  {
    id: 3,
    topText: "Now, place the test card on the control\n pad & start the timer",
    bottomText: "Align the test card on the\n control pad centre",
    image: images.userGuide?.step3,
    buttonText: "Start the timer",
  },
  {
    id: 4,
    topText: "Take the clear photo and upload it",
    bottomText:
      "If an invalid image error appears after upload,\ntake another photo and try uploading again",
    image: images.userGuide?.step4,
    buttonText: "Click the photo and upload",
  },
  {
    id: 5,
    topText: "Results will appear after a few seconds",
    bottomText: "View the Results",
    image: images.userGuide?.step5,
    buttonText: "Test completed",
  },
];

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
        <SafeAreaView style={{ flex: 0, backgroundColor: "transparent" }}>
          <Animated.View
            style={[
              shared.modalContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={shared.modalHeader}>
              <Text style={shared.modalTitle}>User Guide</Text>
              <TouchableOpacity onPress={close}>
                <Image source={images.close} style={shared.closeIcon} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }} {...panResponder.panHandlers}>
              <Animated.View
                style={{
                  flexDirection: "row",
                  width: screenWidth * steps.length,
                  transform: [{ translateX: stepSlide }],
                }}
              >
                {steps.map((step, index) => (
                  <View key={step.id} style={shared.stepCard}>
                    <Text style={shared.stepCounter}>Step {index + 1}</Text>
                    <Text style={shared.stepTopText}>{step.topText}</Text>
                    <Image
                      source={step.image}
                      style={shared.stepImage}
                      resizeMode="contain"
                    />
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
        </SafeAreaView>
      </View>
    </Modal>
  );
}

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

function HealthWorkerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showGuide, setShowGuide] = useState(false);
  const { user } = useUserStore();
  const [totalPatients, setTotalPatients] = useState(0);
  const [todaysTests, setTodaysTests] = useState(0);
  const [registeredPatients, setRegisteredPatients] = useState<IPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      getTotalPatientsCount();
      getTotalTestsCount();
      fetchRegisteredPatients();
    }, []),
  );

  const getTotalPatientsCount = async () => {
    try {
      setLoadingPatients(true);
      const res = (await getPatientsCount(user?.userId || "")) as any;
      console.log("Total patients count:", res);
      setTotalPatients(res.count || 0);
    } catch (error) {
      console.error("Error fetching total patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const getTotalTestsCount = async () => {
    try {
      setLoadingPatients(true);
      const res = (await getTodaysTestsCount(user?.userId || "")) as any;
      setTodaysTests(res.count || 0);
    } catch (error) {
      console.error("Error fetching today's tests:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchRegisteredPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = (await getPatientsWithStatus(
        Number.parseInt(user?.userId || "0"),
        3,
      )) as any;
      console.log("Registered patients:", res);
      setRegisteredPatients(res?.patients || []);
    } catch (error) {
      console.error("Error fetching registered patients:", error);
    } finally {
      setLoadingPatients(false);
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

  const capitalizeName = (name?: string) =>
    name
      ?.trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const handleUserGuidePress = () => {
    setShowGuide(true);
    console.log("User guide opened");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg_primary,
        paddingTop: insets.top,
      }}
    >
      <StatusBar backgroundColor={colors.bg_home} barStyle={"light-content"}/>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={hw.header}>
          <View style={hw.headerLeft}>
            <View style={[hw.profileAvatar, hw.initialsAvatar]}>
              <Text style={hw.initialsText}>
                {user?.userName
                  ?.split(" ")
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={hw.welcomeText}>Welcome</Text>
              <Text style={hw.nameText}>{capitalizeName(user?.userName)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/patients/add")}
            activeOpacity={0.8}
          >
            <Text style={hw.addPatientBtn}>+ Add Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Light section */}
        <View style={hw.lightSection}>
          {/* Stats */}
          <View style={hw.statsRow}>
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
                    {String(totalPatients).padStart(2, "0")}
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
                  <Text style={hw.statLabel}>Today's Tests</Text>
                  <Text style={hw.statValue}>
                    {String(todaysTests).padStart(2, "0")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Registered Patient — single card */}
          {!Array.isArray(registeredPatients) ||
          registeredPatients.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push("/patients/add")}
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
                <Text style={{ fontSize: 13, fontWeight: "800" }}>
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
                const initials = patient?.full_name
                  ? patient.full_name
                      .split(" ")
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "NA";

                return (
                  <View key={patient.patient_id} style={hw.patientCard}>
                    {/* Card Click */}
                    <TouchableOpacity
                      onPress={() => handlePatientPress(patient)}
                      activeOpacity={0.85}
                    >
                      <View style={hw.cardTopRow}>
                        <View style={[hw.profileAvatar, hw.initialsAvatar]}>
                          <Text style={hw.initialsText}>{initials}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={hw.cardName}>{patient.full_name}</Text>
                          <Text style={hw.cardMeta}>
                            {patient?.patient_uniqueid
                              ? String(patient.patient_uniqueid).padStart(
                                  4,
                                  "0",
                                )
                              : "NA"}{" "}
                            | {""}
                            {patient.age ?? "--"} years,{" "}
                            {patient.gender ?? "--"}
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
                            fontWeight: "500",
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
            style={{ fontSize: 13, fontWeight: "800", color: colors.black }}
          >
            Other Links
          </Text>
          <UserGuideCard onPress={handleUserGuidePress} />
        </View>
      </ScrollView>
      {/* <View style={pt.bottomBackground}>
        <Text style={pt.bottomTitle}>{`Screen Early-Act Early`}</Text>
        <View style={{ alignItems: "center", flexDirection: "row" }}>
          <Text style={[pt.subtitle, { marginRight: 10 }]}>
            Detects Kidney Disease in 60 seconds.
          </Text>
        </View>
      </View> */}
      {/* Patient uses the same UserGuideCard but positioned absolutely */}
      {/* <View style={pt.infoCardWrapper}>
        <UserGuideCard onPress={() => setShowGuide(true)} />
      </View>*/}
      <UserGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT HOME  (original code — completely untouched)
// ─────────────────────────────────────────────────────────────────────────────
function PatientHome() {
  const [showGuide, setShowGuide] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.statusbar,
        paddingTop: insets.top,
      }}
    >
      <View style={pt.container}>
        <View style={pt.logoSection}>
          <Image
            source={images.logoFull}
            resizeMode="contain"
            style={pt.logoImage}
          />
        </View>
        <View style={pt.startSection}>
          <RoundButton
            size={200}
            borderWidth={22}
            content="START TEST"
            backgroundColor="#ffffff"
            textColor="red"
            borderColor="#3A4665"
            onPress={() => {}}
          />
        </View>
        <View style={pt.bottomBackground}>
          <Text style={pt.bottomTitle}>{`Screen Early-Act Early`}</Text>
          <View style={{ alignItems: "center", flexDirection: "row" }}>
            <Text style={[pt.subtitle, { marginRight: 10 }]}>
              Detects Kidney Disease in 60 seconds.
            </Text>
          </View>
        </View>
        {/* Patient uses the same UserGuideCard but positioned absolutely */}
        <View style={pt.infoCardWrapper}>
          <UserGuideCard onPress={() => setShowGuide(true)} />
        </View>
      </View>
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
    height: screenHeight * 0.65,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#b0b2b8",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0e1833" },
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
    fontWeight: "500",
    marginBottom: 10,
    textAlign: "center",
    color: "#0e1833",
  },
  stepImage: {
    width: 276,
    height: 176,
    marginBottom: 0,
    backgroundColor: "red",
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
    borderRadius: 40,
    marginBottom: 10,
  },
  stepButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
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
  infoText: { fontSize: 16, fontWeight: "500" },
  userGuideBtn: {
    marginTop: 6,
    backgroundColor: "white",
    paddingVertical: 4,
    paddingHorizontal: 22,
    borderRadius: 50,
    alignSelf: "flex-start",
    borderColor: "#EF3024",
    borderWidth: 1,
  },
  userGuideBtnText: { color: "red", fontWeight: "700", fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH WORKER STYLES
// ─────────────────────────────────────────────────────────────────────────────
const hw = StyleSheet.create({
  header: {
    backgroundColor: colors.bg_home,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
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
    borderColor: "rgba(255,255,255,0.6)",
  },
  // initialsAvatar: {
  //   backgroundColor: "rgba(255,255,255,0.35)",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  // initialsText: { fontSize: rf(22), fontWeight: "700", color: "#FFFFFF" },
  profileName: {
    fontSize: rf(20),
    fontWeight: "800",
    color: "#0D1B2E",
    letterSpacing: -0.3,
  },
  welcomeText: { fontSize: rf(13), color: colors.white, fontWeight: "500" },
  nameText: {
    fontSize: rf(17),
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  addPatientBtn: {
    fontSize: rf(14),
    fontWeight: "700",
    color: colors.DARKBLUE,
  },

  lightSection: {
    backgroundColor: "#EEF3FA",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 10,
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
  statLabel: { fontSize: rf(12), color: colors.black },
  statValue: {
    fontSize: rf(20),
    fontWeight: "800",
    color: colors.black,
    letterSpacing: -0.5,
  },

  sectionTitle: { fontSize: rf(16), fontWeight: "800", color: "#0D1B2E" },

  // Empty state
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 36,
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#DDE6F5",
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
  emptyText: { fontSize: rf(15), fontWeight: "700", color: "#1A2B3C" },

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
    paddingVertical:4,
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
  initialsText: { fontSize: rf(16), fontWeight: "700", color: "#3A6BA8" },
  cardName: {
    fontSize: rf(16),
    fontWeight: "400",
    color: "#0D1B2E",
    marginBottom: 3,
  },
  cardMeta: { fontSize: rf(11), color: colors.black },

  startTestBtn: {
    backgroundColor: "#8252A8",
    paddingVertical: 10,
    alignItems: "center",
  },
  startTestBtnText: {
    fontSize: rf(15),
    fontWeight: "700",
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
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT STYLES (original — untouched)
// ─────────────────────────────────────────────────────────────────────────────
const pt = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  logoSection: { alignItems: "center", paddingTop: "18%" },
  logoImage: { width: 200 },
  startSection: { alignItems: "center", marginVertical: 20, marginTop: 55 },
  bottomBackground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "35%",
    backgroundColor: colors.bg_home,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 18,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 80,
  },
  bottomTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#454d69",
    textAlign: "center",
  },
  subtitle: { fontSize: 18, fontWeight: "400", color: "white" },
  infoCardWrapper: {
    position: "absolute",
    bottom: "28%",
    width: "85%",
    alignSelf: "center",
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
});
