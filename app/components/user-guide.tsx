import { images } from "@/assets";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../shared/commonStyles";

const { width: screenWidth } = Dimensions.get("window");

const steps = [
  {
    id: 1,
    topText: `Collect your urine sample \nin the container`,
    bottomText:
      "Collect urine in the container from the midpoint \nof urination until it reaches the top",
    image: images.userGuide.step1,
    buttonText: "Next",
  },
  {
    id: 2,
    topText: "Dip the test card in the urine sample for 2 seconds, then remove",
    bottomText: "Tap or shake the card gently to remove \nexcess droplets.",
    image: images.userGuide.step2,
    buttonText: "Next",
  },
  {
    id: 3,
    topText: "Place the test card on the control pad & start the timer",
    bottomText: "Ensure the card is placed correctly.",
    image: images.userGuide.step3,
    buttonText: "Next",
  },
  {
    id: 4,
    topText: `Place the test card on the \ncontrol pad`,
    bottomText: "Click the photo and upload it.",
    image: images.userGuide.step4,
    buttonText: "Next",
  },
  {
    id: 5,
    topText: "Results",
    bottomText: "You will get the Urine ACR test results.",
    image: images.userGuide.step5,
    buttonText: "Finish",
  },
];

export const UserGuideScreen = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;

  const goToStep = (index: number) => {
    Animated.timing(slideX, {
      toValue: -index * screenWidth,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setCurrentStep(index);
  };

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

  const handleClose = () => {
    router.back();
  };

  const handleFinish = () => {
    // router.back();
    router.push("/components/verify-details");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.title}>User Guide</Text>
        <TouchableOpacity onPress={handleClose}>
          <Image source={images.close} style={styles.closeIcon} />
        </TouchableOpacity>
      </View> */}

      {/* Steps */}
      <View
        style={{ flex: 1, justifyContent: "center" }}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={{
            flexDirection: "row",
            width: screenWidth * steps.length,
            transform: [{ translateX: slideX }],
          }}
        >
          {steps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              total={steps.length}
              onNext={() =>
                index === steps.length - 1
                  ? handleFinish()
                  : goToStep(index + 1)
              }
            />
          ))}
        </Animated.View>

        {/* Dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UserGuideScreen;

const StepCard = ({ step, index, total, onNext }: any) => (
  <View style={styles.stepCard}>
    {/* <Text style={styles.counter}>
      Step {index + 1} of {total}
    </Text> */}

    {/*  */}

    <Image source={step.image} style={styles.image} resizeMode="contain" />
    <Text style={styles.topText}>{step.topText}</Text>
    <Text style={styles.bottomText}>{step.bottomText}</Text>

    <TouchableOpacity style={styles.button} onPress={onNext}>
      <Text style={styles.buttonText}>{step.buttonText}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6FF" },

  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  title: { fontSize: 20, fontWeight: "700" },
  closeIcon: { width: 24, height: 24 },

  stepCard: {
    width: screenWidth,
    alignItems: "center",
    padding: 20,
    // backgroundColor: "red",
  },

  counter: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  topText: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  image: { width: "45%", height: "45%", marginBottom: 15 },
  bottomText: { fontSize: 16, textAlign: "center", color: "#666" },

  button: {
    marginTop: 30,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 40,
  },

  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 20,
    // backgroundColor: 'red'
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
    backgroundColor: colors.primary,
  },
});
