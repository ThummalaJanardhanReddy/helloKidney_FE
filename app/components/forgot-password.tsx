import { updateUserPassword, validateUserEmail } from "@/src/services/auth";
import { getAccessToken } from "@/src/services/tokenStorage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import BackButton from "../shared/BackButton";
import { colors } from "../shared/commonStyles";
import Toast from "../shared/Toast";

// To-Do:
// Author: Janardhan
// Date: 21-01-2026
// Issue: Need to implement otp flow as the current implementation can be exploited by trying random mail ids and set passwords.
export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const insets = useSafeAreaInsets();

  // 🔐 Password rules
  const passwordRules = {
    length: password.length >= 8 && password.length <= 16,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const isConfirmValid =
    password === confirmPassword && confirmPassword.length > 0;

  // 📧 Email validation API (mock)
  const validateEmailDebounced = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (!value) return;

      setEmailLoading(true);
      try {
        const response = await validateUserEmail(value);
        const isValid = (response as any).exists;
        setIsEmailValid(isValid);
      } catch {
        setIsEmailValid(false);
      } finally {
        setEmailLoading(false);
      }
    }, 600); // 600ms debounce
  };

  const validateUserData = async () => {
    const userEmail = await getAccessToken();
    console.log("User email from token:", userEmail);
  };

  const onSubmit = async () => {
    if (!isEmailValid || !isPasswordValid || !isConfirmValid) return;

    try {
      setSubmitting(true);

      const result = await updateUserPassword(email, password);

      if ((result as any).type === "success") {
        setToast({
          message: "Password updated successfully. Please login.",
          type: "success",
        });

        setTimeout(() => {
          router.replace("/components/verify-details");
        }, 1500);
      } else {
        throw new Error();
      }
    } catch {
      setToast({
        message: "Failed to update password. Try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.statusbar }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              validateEmailDebounced(email);
            }}
            accessible={false}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.container}>
                <BackButton
                  title="Back"
                  onPress={() => router.back()}
                  arrowColor={colors.primary}
                />

                <Text style={styles.title}>Reset Password</Text>

                {/* 📧 Email */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Enter Registered Email"
                    placeholderTextColor={colors.black}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t.toLowerCase());
                      setIsEmailValid(null);
                      validateEmailDebounced(t);
                    }}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailLoading ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    isEmailValid !== null && (
                      <Ionicons
                        name={
                          isEmailValid ? "checkmark-circle" : "close-circle"
                        }
                        size={22}
                        color={isEmailValid ? "green" : "red"}
                      />
                    )
                  )}
                </View>

                {/* 🔑 New Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="New Password"
                    placeholderTextColor={colors.black}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                {/* 🔁 Confirm Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.black}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                {/* ✅ Password Rules */}
                <View style={styles.rulesContainer}>
                  <Rule text="8–16 characters" valid={passwordRules.length} />
                  <Rule
                    text="At least 1 uppercase letter"
                    valid={passwordRules.uppercase}
                  />
                  <Rule text="At least 1 number" valid={passwordRules.number} />
                  <Rule
                    text="At least 1 special character"
                    valid={passwordRules.special}
                  />
                  <Rule text="Passwords match" valid={isConfirmValid} />
                </View>

                {/* 🚀 Submit */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    !(isEmailValid && isPasswordValid && isConfirmValid) && {
                      opacity: 0.5,
                    },
                  ]}
                  disabled={
                    !(isEmailValid && isPasswordValid && isConfirmValid)
                  }
                  onPress={onSubmit}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>

                {toast && (
                  <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                  />
                )}
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/* 🔹 Rule Item */
function Rule({ text, valid }: { text: string; valid: boolean }) {
  return (
    <View style={styles.ruleItem}>
      <Ionicons
        name={valid ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={valid ? "green" : "#999"}
      />
      <Text style={[styles.ruleText, valid && { color: "green" }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 20,
    backgroundColor: "#F2F6FF",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4d4d9",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: "white",
    color: colors.black,
  },
  rulesContainer: {
    marginTop: 14,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ruleText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#555",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#EF3024",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
