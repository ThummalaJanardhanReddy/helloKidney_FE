import { images } from "@/assets";
import { navigate } from "expo-router/build/global-state/routing";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RoundButton from "../shared/RoundButton";
import { colors } from "../shared/commonStyles";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const steps = [
  {
    id: 1,
    topText: "Collect your urine sample in the provided container",
    bottomText:
      "Collect urine in the container from the Midpoint of urination until it reaches the top",
    image: images.userGuide.step1,
    buttonText: "Urine Collected",
  },
  {
    id: 2,
    topText: "Dip the test card in the urine sample for 2 seconds, then remove",
    bottomText:
      "tap or shake the card gently in order to remove excess droplets.",
    image: images.userGuide.step2,
    buttonText: "Card dipped and shaken",
  },
  {
    id: 3,
    topText: "Now place the test card on the control pad & start the timer.",
    bottomText:
      "tap or shake the card gently in order to remove excess droplets.",
    image: images.userGuide.step3,
    buttonText: "Start the Timer",
  },
  {
    id: 4,
    topText: "Now place the test card on the control pad",
    bottomText:
      "tap or shake the card gently in order to remove excess droplets.",
    image: images.userGuide.step4,
    buttonText: "Click the Photo and upload",
  },
  {
    id: 5,
    topText: "",
    bottomText: "View the Results.",
    image: images.userGuide.step5,
    buttonText: "Share the Results",
  },
];

export default function Home() {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const slideAnim = useRef(new Animated.Value(90)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;

  // ───────────────────────────────────────────────
  // OPEN / CLOSE GUIDE MODAL
  // ───────────────────────────────────────────────
  const openGuide = () => {
    setShowGuide(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeGuide = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setShowGuide(false));
  };

  // ───────────────────────────────────────────────
  // STEP SLIDE ANIMATION
  // ───────────────────────────────────────────────
  const goToStep = (index) => {
    Animated.timing(stepSlide, {
      toValue: -index * screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setCurrentStep(index);
  };

  // ───────────────────────────────────────────────
  // SWIPE HANDLER
  // ───────────────────────────────────────────────
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,

    onPanResponderRelease: (_, g) => {
      if (g.dx < -40 && currentStep < steps.length - 1) {
        goToStep(currentStep + 1);
      } else if (g.dx > 40 && currentStep > 0) {
        goToStep(currentStep - 1);
      }
    },
  });

  // ───────────────────────────────────────────────
  // UI RENDER
  // ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ───────────────────────── Logo ───────────────────────── */}
      <View style={styles.logoSection}>
        <Image
          source={images.logoFull}
          resizeMode="contain"
          style={styles.logoImage}
        />
      </View>

      {/* ───────────────────────── Start Button ───────────────────────── */}
      <View style={styles.startSection}>
        <RoundButton
          size={200}
          borderWidth={20}
          content="START TEST"
          backgroundColor="#ffffff"
          textColor="red"
          borderColor="#3A4665"
          onPress={() => navigate('/components/TimerCameraUploader')}
        />
      </View>

      {/* ───────────────────────── Bottom BG ───────────────────────── */}
      <View style={styles.bottomBackground}>
        <Text style={styles.bottomTitle}>{`Live\nHealthy`}</Text>
        <Text style={styles.subtitle}>Prevention is better than Cure.</Text>
      </View>

      {/* ───────────────────────── Info Card ───────────────────────── */}
      <View style={styles.infoCard}>
        <Image
          source={images.cust_rep}
          resizeMode="contain"
          style={styles.infoImage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoText}>
            Before starting the test, {"\n"} please view the
          </Text>

          <TouchableOpacity style={styles.userGuideBtn} onPress={openGuide}>
            <Text style={styles.userGuideBtnText}>User Guide</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ───────────────────────── Modal ───────────────────────── */}
      <Modal visible={showGuide} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeGuide} />

          <SafeAreaView style={styles.modalSafeArea}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Guide</Text>

                <TouchableOpacity onPress={closeGuide}>
                  <Image source={images.close} style={styles.closeIcon} />
                </TouchableOpacity>
              </View>

              {/* Steps Slider */}
              <View style={{ flex: 1 }} {...panResponder.panHandlers}>
                <Animated.View
                  style={{
                    flexDirection: "row",
                    width: screenWidth * steps.length,
                    transform: [{ translateX: stepSlide }],
                  }}
                >
                  {steps.map((step, index) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      index={index}
                      total={steps.length}
                      goToStep={goToStep}
                      closeGuide={closeGuide}
                    />
                  ))}
                </Animated.View>

                {/* Dots */}
                <View style={styles.dotContainer}>
                  {steps.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        currentStep === idx && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ───────────────────────────────────────────────
// Step Card Component
// ───────────────────────────────────────────────
const StepCard = ({ step, index, total, goToStep, closeGuide }) => (
  <View style={styles.stepCard}>
    <Text style={styles.stepCounter}>
      Step {index + 1} of {total}
    </Text>

    <Text style={styles.stepTopText}>{step.topText}</Text>

    <Image source={step.image} style={styles.stepImage} resizeMode="contain" />

    <Text style={styles.stepBottomText}>{step.bottomText}</Text>

    <TouchableOpacity
      style={styles.stepButton}
      onPress={() => (index === total - 1 ? closeGuide() : goToStep(index + 1))}
    >
      <Text style={styles.stepButtonText}>
        {/* {index === total - 1 ? "Start Test" : "Continue"} */}
        {step.buttonText}
      </Text>
    </TouchableOpacity>
  </View>
);

//
// ───────────────────────── Styles ─────────────────────────
//

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },

  logoSection: { alignItems: "center", paddingTop: "18%" },

  logoImage: { width: 200 },

  startSection: { alignItems: "center", marginVertical: 20 },

  bottomBackground: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "35%",
    backgroundColor: colors.bg_home,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 30,
  },

  bottomTitle: {
    fontSize: 58,
    fontWeight: "800",
    color: "#3F465E",
    textAlign: "center",
    lineHeight: 62,
  },

  subtitle: { fontSize: 18, fontWeight: "700", color: "white" },

  infoCard: {
    position: "absolute",
    bottom: "28%",
    flexDirection: "row",
    width: "85%",
    alignSelf: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderColor: colors.blue,
    borderWidth: 1,
    padding: 16,
    gap: 20,
  },

  infoImage: { height: 60, width: 60 },

  infoText: { fontSize: 16, fontWeight: "500" },

  userGuideBtn: {
    marginTop: 6,
    backgroundColor: "red",
    paddingVertical: 8,
    paddingHorizontal: 26,
    borderRadius: 50,
    alignSelf: "flex-start",
  },

  userGuideBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },

  modalSafeArea: { flex: 0, backgroundColor: "transparent" },

  modalContainer: {
    // flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    height: screenHeight * 0.60,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    // padding: 18,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#d80606ff",
    position: "relative",
  },

  modalTitle: { fontSize: 20, fontWeight: "700", color: "#333" },

  closeIcon: { width: 26, height: 26 },

  // Steps
  stepCard: {
    width: screenWidth,
    alignItems: "center",
    padding: 24,
  },

  stepCounter: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1A82F7",
  },

  stepTopText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },

  stepImage: { width: 90, height: 90, marginBottom: 20 },

  stepBottomText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#666",
  },

  stepButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 40,
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

  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: colors.blue,
  },
});
