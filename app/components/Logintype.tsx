import { images } from "@/assets";
import { router } from "expo-router";
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "../shared/commonStyles";
import { useUserStore } from "../stores/userStore";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Responsive font scaling
const scale = width / 390;
const rf = (size: number) => Math.round(size * scale);

export default function LoginTypeScreen({ navigation }) {
  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState<{ id: Number } | null>();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = (scaleAnim, index: number) => {
    setPressed({ id: index });
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (scaleAnim) => {
    setPressed(null);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handleHealthWorkerPress = () => {
    const store = useUserStore.getState();

    if (!store.user) {
      store.setUser({
        userId: "",
        userEmail: "",
        token: "",
        userType: "healthworker",
      });
    } else {
      store.setUserType("healthworker");
    }
    router.push("/components/verify-details");
  };

  const handlePatientPress = () => {
    const store = useUserStore.getState();

    if (!store.user) {
      store.setUser({
        userId: "",
        userEmail: "",
        token: "",
        userType: "patient",
      });
    } else {
      store.setUserType("patient");
    }
    router.push("/components/verify-details");
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#F2F6FF" /> */}
      <StatusBar style="dark" backgroundColor={colors.bg_primary} animated />
      <Image
        source={images.loginType.logo}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Bottom content panel */}
      <View style={styles.contentPanel}>
        {/* Title */}
        <Animated.View
          style={{
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.title}>Who's signing in?</Text>
        </Animated.View>

        {/* Cards row */}
        <View style={styles.cardsRow}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(card1Scale, 1)}
            onPressOut={() => handlePressOut(card1Scale)}
            onPress={handleHealthWorkerPress}
            style={[
              styles.card,
              { justifyContent: "space-between" },
              pressed?.id === 1 && {
                borderColor: colors.ACCENT, // 🔥 your highlight color
                borderWidth: 2,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", width: "95%", }}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={images.loginType.socialWorker}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardLabelRow}>
                {/* <View style={styles.cardDot} /> */}
                <Text style={styles.cardLabel}>
                  I'm a Healthcare Professional
                </Text>
                <Text style={styles.cardLabelSub}>
                  Doctor, Nurse, or Technician
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(card2Scale, 2)}
            onPressOut={() => handlePressOut(card2Scale)}
            onPress={handlePatientPress}
            style={[
              styles.card,
              { justifyContent: "space-between" },
              pressed?.id === 2 && {
                borderColor: colors.ACCENT, // 🔥 your highlight color
                borderWidth: 2,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", width: "95%" }}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={images.loginType.patient}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardLabelRow}>
                <Text style={styles.cardLabel}>I'm a Patient</Text>
                <Text style={styles.cardLabelSub}>or Family caregiver</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = (width - 56) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // Logo
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  logo: {
    width: width * 0.65,
    height: width * 0.65,
    opacity: 0.1,
    tintColor: "#C0392B",
  },

  // Content panel
  contentPanel: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 28,
    backgroundColor: "transparent",
  },

  subtitle: {
    fontSize: rf(13),
    fontWeight: "500",
    color: "#E07080",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
    // fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },

  title: {
    fontSize: rf(30),
    fontWeight: "800",
    color: "#0D1B2A",
    lineHeight: rf(36),
    letterSpacing: -0.5,
    marginBottom: 24,
    // fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },

  // Cards
  cardsRow: {
    flexDirection: "column",
    width: "100%",
    justifyContent: "space-between",
    gap: 14,
    // marginBottom: 20,
    // backgroundColor: "red",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(220,230,245,0.8)",
    minHeight: 80,
    // justifyContent: "space-evenly",
  },

  cardAccent: {
    borderColor: "rgba(220, 170, 180, 0.5)",
    shadowColor: "#E07080",
  },

  cardImageContainer: {
    width: CARD_WIDTH * 0.4,
    height: CARD_WIDTH * 0.4,
    justifyContent: "center",
    // alignItems: "center",
    // marginBottom: 8,
  },

  cardImage: {
    width: "80%",
    height: "80%",
  },

  cardLabelRow: {
    // flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    width: "75%",
    // backgroundColor: "red",
  },

  cardDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#5B9BD5",
  },

  cardDotAccent: {
    backgroundColor: "#E07080",
  },

  cardLabel: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#1A2B3C",
    letterSpacing: 0.2,
  },
  cardLabelSub: {
    fontSize: rf(11),
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
});
