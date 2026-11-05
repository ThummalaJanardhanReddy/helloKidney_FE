import { registerUser } from "@/src/services/auth";
import { COUNTRIES, Country } from "@/src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Text from "./Text";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CustomCountryPickerModal } from "./CustomCountryPickerModal";
import BackButton from "../shared/BackButton";
import commonStyles, { colors } from "../shared/commonStyles";
import Toast from "../shared/Toast";

const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.dial_code === "+91") ?? {
    name: "India",
    dial_code: "+91",
    code: "IN",
    flag: "🇮🇳",
  };

type RegisterFormData = {
  full_name: string;
  email_id: string;
  mobile_no: string;
  password: string;
  role: string;
  age: string | Number;
  gender: string;
};

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: "",
    age: "",
    gender: "",
    mobile_no: "",
    email_id: "",
    password: "",
    role: "patient",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const insets = useSafeAreaInsets();

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const passwordRules = {
    length: formData.password.length >= 8 && formData.password.length <= 16,
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async () => {
    const { full_name, age, gender, mobile_no, email_id, password } = formData;

    if (!full_name || !age || !gender || !mobile_no || !email_id || !password) {
      setToast({ message: "Please fill all the fields", type: "error" });
      return;
    }

    const fullPhoneNumber = `${selectedCountry.dial_code}${mobile_no}`;
    const parsedPhone = parsePhoneNumberFromString(fullPhoneNumber);
    if (!parsedPhone?.isValid()) {
      setToast({ message: "Enter a valid phone number", type: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_id)) {
      setToast({ message: "Enter a valid email address", type: "error" });
      return;
    }

    if (!isPasswordValid) {
      setToast({
        message: "Password does not meet requirements",
        type: "error",
      });
      return;
    }

    if (Number(age) < 1 || Number(age) > 120) {
      setToast({ message: "Enter a valid age", type: "error" });
      return;
    }

    setIsSubmitting(true);

    let result;
    try {
      result = await registerUser({
        ...formData,
        age: Number(age),
        email_id: email_id.trim().toLowerCase(),
        mobile_no: fullPhoneNumber,
      });
    } catch {
      setIsSubmitting(false);
      setToast({
        message: "Network error. Please try again.",
        type: "error",
      });
      return;
    }

    if ((result as any).type === "success") {
      setToast({
        message: "Registration successful! Please log in.",
        type: "success",
      });

      // Keep the loader spinning until we navigate away so the button
      // doesn't flash back to its idle state right before the redirect.
      setTimeout(() => {
        router.replace({
          pathname: "/components/verify-details",
          params: {
            prefillEmail: email_id.trim().toLowerCase(),
            prefillPassword: password,
          },
        });
      }, 1500);
    } else {
      setIsSubmitting(false);
      setToast({
        message:
          (result as any)?.response?.data?.detail ||
          (result as any)?.message?.[0]?.msg ||
          (result as any)?.message ||
          "Registration failed. Try again.",
        type: "error",
      });
    }
  };
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg_primary }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={[
              {
                flexGrow: 1,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.layout_container]}>
              <BackButton
                title="Back"
                onPress={handleBack}
                arrowColor={colors.primary}
              />
              {/* TO-DO: Add age, gender, address. Order: Name, Age, Gender, Phone number, email, password */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome to Nephkare</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter"
                    placeholderTextColor="#9ca3af"
                    value={formData.full_name}
                    onChangeText={(value) => handleChange("full_name", value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={formData.age.toString()}
                    onChangeText={(value) =>
                      handleChange("age", value.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.genderRow}>
                    {["Male", "Female", "Other"].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderButton,
                          formData.gender === g && styles.genderSelected,
                        ]}
                        onPress={() => handleChange("gender", g)}
                      >
                        <Text
                          style={[
                            styles.genderText,
                            formData.gender === g && { color: "#fff" },
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.phoneRow}>
                    <TouchableOpacity
                      style={styles.countryCodeBtn}
                      activeOpacity={0.7}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCodeText}>
                        {selectedCountry.dial_code}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color="#374151"
                        style={{ marginLeft: 2 }}
                      />
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.input, styles.phoneInput]}
                      placeholder="Enter"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      maxLength={15}
                      value={formData.mobile_no}
                      onChangeText={(value) =>
                        handleChange("mobile_no", value.replace(/[^0-9]/g, ""))
                      }
                    />
                  </View>
                </View>

                <CustomCountryPickerModal
                  visible={showCountryPicker}
                  onClose={() => setShowCountryPicker(false)}
                  selectedCountry={selectedCountry}
                  onSelect={(country) => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                    handleChange("mobile_no", "");
                  }}
                />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Id (User Name)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@companyname.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={formData.email_id ?? ""}
                    onChangeText={(value) => handleChange("email_id", value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(value) => handleChange("password", value)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}
                  >
                    (8–16 characters, At least 1 uppercase letter, 1 number, 1
                    special character)
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Submit</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={handleBack}>
                    <Text style={styles.signupLinkText} onPress={handleBack}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {toast && (
                <Toast
                  message={toast.message}
                  type={toast.type}
                  onClose={() => setToast(null)}
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    flexGrow: 1,
  },
  layout_container: {
    // ...commonStyles.container_layout,
    paddingTop: 10,
    paddingHorizontal: 30,
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  formContainer: {
    flex: 1,
    marginTop: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
    marginBottom: 24,
    color: colors.black,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: "#D2D2D5",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: colors.black,
    textAlignVertical: "center",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#D2D2D5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 0,
    gap: 4,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
  },
  phoneInput: {
    flex: 1,
  },
  placeholder_text: {
    color: "#9ca3af",
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    // paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    height: 45,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  signupContainer: {
    marginTop: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    fontSize: 16,
    color: colors.textBlack,
    lineHeight: 20,
    textAlign: "center",
  },
  signupLinkText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A82F7",
  },
  genderRow: {
    flexDirection: "row",
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D2D2D5",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  genderSelected: {
    backgroundColor: "#EF3024",
    borderColor: "#EF3024",
  },
  genderText: {
    color: "#374151",
    fontWeight: "500",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D2D2D5",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
});
