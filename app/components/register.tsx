import { registerUser } from "@/src/services/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BackButton from "../shared/BackButton";
import commonStyles, { colors } from "../shared/commonStyles";
import Toast from "../shared/Toast";

type RegisterFormData = {
  full_name: string;
  email_id: string;
  mobile_no: string;
  password: string;
  role: string;
  age: string;
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

  // useEffect(() => {
  //   setToast({
  //     message: "Registration Screen - Under Development",
  //     type: "success",
  //   });
  // }, []);

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
    // Call register API
    const result = await registerUser(formData);

    if ((result as any).type === "success") {
      setToast({
        message: "Registration successful! Please log in.",
        type: "success",
      });
      setFormData({
        full_name: "",
        age: "",
        gender: "",
        mobile_no: "",
        email_id: "",
        password: "",
        role: "patient",
      });
      setTimeout(() => {
        router.replace("/components/verify-details");
      }, 3000);
    } else {
      setToast({
        message: (result as any).message || "Registration failed. Try again.",
        type: "error",
      });
    }
  };
  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.layout_container}>
          <BackButton
            title="Back"
            onPress={() => router.back()}
            arrowColor={colors.primary}
          />
          {/* TO-DO: Add age, gender, address. Order: Name, Age, Gender, Phone number, email, password */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome to HelloKidney</Text>

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
                value={formData.age}
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
              <TextInput
                style={styles.input}
                placeholder="Enter"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={formData.mobile_no}
                onChangeText={(value) => handleChange("mobile_no", value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Id (User Name)</Text>
              <TextInput
                style={styles.input}
                placeholder="name@companyname.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                value={formData.email_id}
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
              <Text style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                (8–16 characters, At least 1 uppercase letter, 1 number, 1
                special character)
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.signupLinkText} onPress={handleBack}>
                Log in
              </Text>
            </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  layout_container: {
    ...commonStyles.container_layout,
    flex: 1,
    // padding: 30,
    backgroundColor: colors.bg_primary,
  },
  formContainer: {
    // padding: 32,
    // backgroundColor: "white",
    marginTop: 20,
    // marginHorizontal: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: colors.black,
  },
  placeholder_text: {
    color: "#9ca3af",
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  signupContainer: {
    marginTop: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    // backgroundColor: colors.bg_secondary,
  },
  signupText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    marginTop: 6,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
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
    borderColor: "#d1d5db",
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
