import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { images } from "../../assets";
import PrimaryButton from "../shared/PrimaryButton";
import commonStyles, { colors } from "../shared/commonStyles";
import responsive, { rms, rs, rvs } from "@/src/utils/responsive";
import { useUserStore } from "../stores/userStore";

export default function WelcomeScreen() {
  // const {isAuthenticated, isLoading} = useAuth();
  const clearUser = useUserStore((state) => state.clearUser);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const reset = async () => {
      clearUser();
    };

    reset();
  }, []);

  const handleContinue = () => {
    try {
      // 2-2-2026: hiding this route as per the requirement now. Enable based on future request
      // router.push("/components/user-guide");
      router.push("/components/Logintype");
      // router.push("/components/verify-details");
    } catch (error) {
      console.error("Error navigating to terms:", error);
    }
  };

  return (
    // <View style={{ flex: 1, backgroundColor: colors.white}}>

    <View style={[styles.container]}>
      {/* <StatusBar
        backgroundColor={colors.bg_primary}
        barStyle={"dark-content"}
        translucent={false}
        animated
      /> */}
      <StatusBar style="dark" backgroundColor={colors.bg_primary} animated />
      <ScrollView
        style={[
          styles.scrollView,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Welcome Image */}
          <Image
            source={images.welcome1}
            style={styles.welcomeImage}
            resizeMode="contain"
          />

          {/* Welcome To Text */}
          <Text style={styles.welcomeText}>WELCOME TO</Text>

          {/* Logo */}
          <Image
            source={images.logoFull1}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <images.curonnLogo style={styles.logo} /> */}

          {/* Support Message */}
          <Text style={styles.supportText}>
            HelloKidney.ai offers a convenient smartphone-powered urine ACR test
            for early kidney disease detection.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Let's Get Start"
            onPress={handleContinue}
            style={{ width: "100%" }}
          />
        </View>
      </ScrollView>
    </View>
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    ...commonStyles.container_layout,
    backgroundColor: colors.bg_primary,
  },
  header: {
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    // backgroundColor: '#2B2C43'
  },
  welcomeImage: {
    width: "100%",
    height: responsive.isSmallPhone() ? rvs(350) : "70%",
    marginBottom: rvs(10),
    // backgroundColor: 'red'
  },
  welcomeText: {
    fontSize: rms(22),
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
    marginBottom: responsive.getResponsiveSpacing(20),
  },
  logo: {
    width: "100%",
    height: responsive.scaleHeight(50),
    // height: hp(15),
    // resizeMode: "contain",
    marginBottom: responsive.getResponsiveSpacing(22),
  },
  supportText: {
    fontSize: responsive.getResponsiveFontSize(13),
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 20,
    marginBottom: responsive.getResponsiveSpacing(20),
    flexWrap: "wrap",
    width: "100%",
  },
  buttonContainer: {
    alignItems: "center",
    // paddingBottom: getResponsiveSpacing(20),
    width: "100%",
    // backgroundColor: '#1A82F7'
  },
});
