// import useKeyboardVisible from "@/src/hooks/useKeyboardVisible";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
// import { HelperText, TextInput, useTheme } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { images } from "../../assets";
import PrimaryButton from "../shared/PrimaryButton";
// import { useUser } from "../shared/context/UserContext";
import { hw_login, login } from "../../src/services/auth";
import commonStyles, { colors } from "../shared/commonStyles";
import { useUserStore } from "../stores/userStore";
import BackButton from "../shared/BackButton";
import { rms, rs, rvs } from "@/src/utils/responsive";

// Validation constants
const VALIDATION_RULES = {
  EMPLOYEE_ID_MIN_LENGTH: 3,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: { minLength: 6, maxLength: 20 },
} as const;

// API Response interface
interface ValidationResponse {
  isSuccess?: boolean;
  message?: string;
  data?: any;
}

export default function VerifyDetailsScreen() {
  // const { userData, setUserData } = useUser();
  const [employeeId, setEmployeeId] = useState(""); // useState(userData.employeeId || "");
  const [email, setEmail] = useState(""); // useState(userData.email || "");
  const [password, setPassword] = useState("");
  const [employeeIdError, setEmployeeIdError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [commonError, setCommonError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const bottomAnim = useRef(new Animated.Value(0)).current;
  const userType = useUserStore((s) => s.user?.userType);
  console.log("UserType in VerifyDetailsScreen:", userType);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(bottomAnim, {
        toValue: -e.endCoordinates.height + 40, // Move UP smoothly
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(bottomAnim, {
        toValue: 0, // Move DOWN smoothly
        duration: 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!VALIDATION_RULES.EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setCommonError("Password is required");
      return false;
    }
    if (
      password.length < VALIDATION_RULES.PASSWORD.minLength ||
      password.length > VALIDATION_RULES.PASSWORD.maxLength
    ) {
      setCommonError(
        `Password must be between ${VALIDATION_RULES.PASSWORD.minLength} and ${VALIDATION_RULES.PASSWORD.maxLength} characters`,
      );
      return false;
    }
    setCommonError("");
    return true;
  };

  const handleContinue = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setIsLoading(true);
    setCommonError("");

    try {
      if (userType === "patient") {
        const response = await login(email.trim(), password);
      } else if (userType === "healthworker") {
        // For non-patient users, you might want to implement a different login flow or validation
        // For now, we'll just set the user in the store without an API call
        await hw_login(email.trim(), password);
      }
      router.replace("/(home)/home");
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        setCommonError(err.response.data.detail);
      } else {
        setCommonError("Unable to connect to server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleTermsAndConditions = () => {
    router.push("/components/terms");
  };

  const isFormValid = email.trim() && !emailError && !commonError;

  const handleSignup = () => {
    router.push("/components/register");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg_primary }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        > */}
          <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BackButton
              title="Back"
              onPress={handleBack}
              arrowColor={colors.black}
              color={colors.black}
            />
            {/* Header */}
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  { fontSize: rms(25), textAlign: 'left', fontWeight: "600", marginBottom: rvs(25), color: "#2B2C4380" },
                ]}
              >
                Sign in as{" "}
                {userType === "patient" ? "Patient" : "Healthcare Professional"}
              </Text>
              <Image
                source={images.logoFull1}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* FORM */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>User Name</Text>

              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#8b94a9"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                  setCommonError("");
                }}
                onBlur={() => validateEmail(email)}
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {/* EMAIL */}
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter your password"
                  secureTextEntry={!isPasswordVisible}
                  placeholderTextColor="#8b94a9"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setCommonError("");
                  }}
                  onBlur={() => validatePassword(password)}
                  style={[
                    styles.textInput,
                    styles.passwordInput,
                    { color: "black" },
                  ]}
                  // autoCapitalize="none"
                  // autoCorrect={false}
                  // keyboardType="default"
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  style={styles.eyeIcon}
                  accessibilityLabel={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  <Ionicons
                    name={isPasswordVisible ? "eye-off" : "eye"}
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
              {commonError ? (
                <Text role="log" style={styles.commonError}>
                  {commonError}
                </Text>
              ) : null}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <PrimaryButton
                  title={isLoading ? "Verifying..." : "Sign In"}
                  onPress={handleContinue}
                  disabled={!isFormValid || isLoading}
                  style={styles.continueButton}
                />
              </View>
              
              <TouchableOpacity
                onPress={() => router.push("/components/forgot-password")}
              >
                <Text
                  style={{
                    color: colors.black,
                    marginTop: rvs(20),
                    textAlign: "center",
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              {/* To-Do: un comment once the signup ready */}
              {userType === "patient" && (
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>
                    Don&apos;t have an account?{" "}
                    <Text style={styles.signupLinkText} onPress={handleSignup}>
                      Sign up
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* ⭐ FORM FOOTER — Now Part of the Form Layout */}
            <View style={styles.bottomContainer}>
              {/* Terms */}
              <Text style={styles.termsText}>
                By Signing up, you agree to HelloKidney{"\n"} Terms & Services
                and Privacy Policy.
              </Text>
            </View>
          </KeyboardAwareScrollView>
        {/* </KeyboardAvoidingView> */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container_layout,
    flex: 1,
    // minHeight: 100,
    // paddingBottom: getResponsivePadding(40),
    backgroundColor: "#F2F6FF",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: "flex-start",
    marginTop: rvs(40),
    marginBottom: rvs(10),
  },
  image: {
    marginBottom: rvs(20),
    resizeMode: "contain",
  },
  logo: {
    width: "80%",
    height: rvs(60),
  },
  title: {
    fontSize: rms(22),
    fontWeight: "700",
    color: "#2B2C43",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: rms(13),
    color: colors.black,
    textAlign: "center",
  },
  formContainer: {
    // paddingHorizontal: 0,
  },
  label: {
    fontSize: rms(16),
    fontWeight: "400",
    color: colors.black,
    marginBottom: rvs(3),
    marginTop: rvs(12),
  },
  textInput: {
    backgroundColor: "#fff",
    paddingHorizontal: rs(16),
    // paddingVertical: 1,
    marginBottom: 0,
    borderRadius: 8,
    height: rvs(40),
    borderWidth: 1,
    borderColor: "#c3c4c6",
  },
  textInputContent: {
    borderRadius: 50,
    paddingHorizontal: 2,
    height: rvs(50),
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  // termsText: {
  //   fontSize: 14,
  //   color: colors.textSecondary,
  //   lineHeight: 20,
  //   textAlign: "center",
  // },
  linkText: {
    fontSize: 14,
    color: "#8b94a9",
    // textDecorationLine: "underline",
    // textDecorationColor: "#da0f0fff",
    // textDecorationStyle: "dashed",
    // fontWeight: '500',
  },
  commonError: {
    marginTop: 8,
    textAlign: "center",
    color: colors.error,
  },
  bottomContainer: {
    position: 'absolute',
    
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: rvs(10),
    alignItems: "center",
    bottom: 0

    // borderTopWidth: 1,
    // borderTopColor: "#E2E2E4",
  },

  termsText: {
    fontSize: rms(14),
    color: "#8b94a9", // colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: rvs(16),
  },

  buttonContainer: {
    flexDirection: "row",
    paddingTop: rvs(20),
    width: "100%",
  },

  backButton: {
    flex: 0.3,
  },

  continueButton: {
    // flex: 0.7,
    borderRadius: 8,
    width: "100%",
  },
  signupContainer: {
    marginTop: rvs(20),
    alignItems: "center",
  },
  signupText: {
    fontSize: rms(14),
    color: colors.black,
    lineHeight: 20,
    textAlign: "center",
  },
  signupLinkText: {
    fontSize: rvs(14),
    fontWeight: "600",
    color: "#196ff8",
  },

  passwordContainer: {
    position: "relative",
    width: "100%",
  },

  passwordInput: {
    paddingRight: 45, // space for eye icon
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
});
