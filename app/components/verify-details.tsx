// import useKeyboardVisible from "@/src/hooks/useKeyboardVisible";
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
import commonStyles, { colors } from "../shared/commonStyles";
import { login } from "../shared/services/auth";

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
  // const keyboardVisible = useKeyboardVisible();
  const insets = useSafeAreaInsets();

  // const theme = useTheme();
  // const customTheme = {
  //   ...theme,
  //   roundness: 8,
  // };

  const bottomAnim = useRef(new Animated.Value(0)).current;

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
        `Password must be between ${VALIDATION_RULES.PASSWORD.minLength} and ${VALIDATION_RULES.PASSWORD.maxLength} characters`
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
      const res = await login(email.trim(), password);
      console.log("✅ Logged in", res);
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

  const isFormValid =
    email.trim() &&
    !emailError &&
    !commonError;

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F6FF" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Login to</Text>
              <Image source={images.logoFull} />
            </View>

            {/* FORM */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>User Email</Text>

              <TextInput
                placeholder="Email id"
                placeholderTextColor="#9D9D9F"
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

              <TextInput
                placeholder="Enter password"
                secureTextEntry
                placeholderTextColor="#9D9D9F"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setCommonError("");
                }}
                onBlur={() => validatePassword(password)}
                style={styles.textInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="visible-password"
              />
              {commonError ? (
                <Text role="log" style={styles.commonError}>
                  {commonError}
                </Text>
              ) : null}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <PrimaryButton
                  title={isLoading ? "Verifying..." : "Log In"}
                  onPress={handleContinue}
                  disabled={!isFormValid || isLoading}
                  style={styles.continueButton}
                />
              </View>
              <Text
                style={{ textAlign: "center", marginTop: 20 }}
                onPress={() => {
                  console.log("forgot password pressed!");
                }}
              >
                Forgot Password?
              </Text>
            </View>

            {/* ⭐ FORM FOOTER — Now Part of the Form Layout */}
            <View style={styles.bottomContainer}>
              {/* Terms */}
              <Text style={styles.termsText}>
                By signing up, you are agreeing to our{"\n"}
                <Text
                  style={styles.linkText}
                  onPress={handleTermsAndConditions}
                >
                  Terms and Conditions.
                </Text>
              </Text>
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: "#F2F6FF", // '#ffffff',
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
    marginTop: 70,
    marginBottom: 30,
  },
  image: {
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2C43",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.black,
    textAlign: "center",
  },
  formContainer: {
    // paddingHorizontal: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.black,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    // paddingVertical: 1,
    marginBottom: 8,
    borderRadius: 8,
    height: 50,
  },
  textInputContent: {
    borderRadius: 50,
    paddingHorizontal: 2,
    height: 50,
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
    color: "#1A82F7",
    // textDecorationLine: "underline",
    // fontWeight: '500',
  },
  commonError: {
    marginTop: 8,
    textAlign: "center",
    color: colors.error,
  },
  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: "#F5F4F9",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    // borderTopWidth: 1,
    // borderTopColor: "#E2E2E4",
  },
  formFooter: {
    marginTop: 40,
    paddingBottom: 40,
  },

  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },

  buttonContainer: {
    flexDirection: "row",
    // justifyContent: "space-between",
    paddingTop: 10,
    width: "100%",
    // gap: 16,
    // backgroundColor: '#2B2C43'
  },

  backButton: {
    flex: 0.3,
  },

  continueButton: {
    // flex: 0.7,
    borderRadius: 8,
    width: "100%",
    // backgroundColor: '#da2626ff'
  },
});
