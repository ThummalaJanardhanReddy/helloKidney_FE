import { useAuth } from "@/src/services/authContext";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import { images } from "../../assets";

export default function AppSplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log("SplashScreen component mounted");
    if (isLoading) return;

    const initializeApp = async () => {
      try {
        // Wait a bit for the app to be ready
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (isAuthenticated) {
          console.log("User already logged in → Home");
          router.replace("/home");
        } else {
          console.log("User not logged in → Welcome");
          router.replace("/components/welcome");
        }

        console.log("Navigation command sent");
      } catch (error) {
        console.error("Error during app initialization:", error);
        // Fallback navigation
        router.replace("/components/welcome");
      }
    };

    initializeApp();
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <Image
        source={images.splashscreen}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EF3024",
    justifyContent: "center",
    alignItems: "center",
    // paddingTop: 0,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    // width: wp(100),
    // height: hp(100),
    // resizeMode: 'stretch',
  },
});
