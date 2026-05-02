import { colors } from "@/app/shared/commonStyles";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { savePatient } from "@/src/services/healthworkerService";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Toast from "@/app/shared/Toast";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useUserStore } from "@/app/stores/userStore";

const { width } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (width / 390));

// ── Constants ─────────────────────────────────────────────────────────────────
const GOOGLE_PLACES_API_KEY = "AIzaSyBJstUqo2LcNszVQIhopKWWOoXHyWeaQZI";
const PHONE_MAX_LENGTH = 15;
const AGE_MAX_LENGTH = 3;
const PINCODE_MAX_LENGTH = 10;
const AUTOCOMPLETE_DEBOUNCE = 500;
const AUTOCOMPLETE_MIN_LENGTH = 2;

// ── Types ─────────────────────────────────────────────────────────────────────
type Gender = "Male" | "Female" | "Other";

interface FormState {
  patientId: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  phone: string;
  age: string;
  gender: Gender;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  hwId: string | number;
  locality?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  age?: string;
  address?: string;
  pincode?: string;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

// ── Utility Functions ─────────────────────────────────────────────────────────
const sanitizeInput = (value: string): string => value.trim();

const sanitizeNumericInput = (value: string): string =>
  value.replace(/[^0-9]/g, "");

const validatePhone = (phone: string): boolean => {
  const cleanPhone = sanitizeNumericInput(phone);
  return cleanPhone.length >= 7 && cleanPhone.length <= PHONE_MAX_LENGTH;
};

const validateAge = (age: string): boolean => {
  const ageNum = Number(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum <= 100;
};

const validatePincode = (pincode: string): boolean => {
  if (!pincode) return true; // Optional field
  return /^\d{4,10}$/.test(pincode);
};

// ── Reusable Components ───────────────────────────────────────────────────────
function FieldLabel({
  text,
  required = false,
}: {
  text: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
  );
}

interface InputFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "phone-pad";
  error?: string;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
}

function InputField({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  error,
  maxLength,
  autoCapitalize = "sentences",
  editable = true,
}: InputFieldProps) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#AABBD0"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        editable={editable}
        accessibilityLabel={placeholder}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AddPatientScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const placesRef = useRef<any>(null);

  // ── State ──
  const [form, setForm] = useState<FormState>({
    patientId: 0,
    firstName: "",
    lastName: "",
    countryCode: "+91",
    phone: "",
    age: "",
    gender: "Male",
    address: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    hwId: user?.userId || "",
    locality: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastState, setToastState] = useState<ToastState>({
    message: "",
    type: "success",
  });

  const { data: patientData } = useLocalSearchParams();
  console.log("🔍 Local search params:", patientData);

  useEffect(() => {
    if (patientData) {
      try {
        const parsed = JSON.parse(patientData);
        console.log("📊 Parsed patient data from search params:", parsed);
        const mobile = parsed.mobile_no || "";

        const [countryCode, phone] = mobile.includes("-")
          ? mobile.split("-")
          : ["+91", mobile];

        setForm((prev) => ({
          ...prev,
          patientId: parsed.patient_id || prev.patientId,
          firstName: parsed.full_name
            ? parsed.full_name.split(" ")[0]
            : prev.firstName,
          lastName: parsed.full_name
            ? parsed.full_name.split(" ").slice(1).join(" ")
            : prev.lastName,
          countryCode: countryCode || prev.countryCode,
          phone: phone || prev.phone,
          age: parsed.age ? parsed.age.toString() : prev.age,
          gender: parsed.gender || prev.gender,
          address: parsed.address || prev.address,
          city: parsed.city || prev.city,
          district: parsed.district || prev.district,
          state: parsed.state || prev.state,
          pincode: parsed.pincode || prev.pincode,
          locality: parsed.locality || prev.locality,
        }));
      } catch (error) {
        console.error("❌ Error parsing patient data:", error);
      }
    }
  }, [patientData]);

  // ── Handlers ──
  const updateField = useCallback(
    (key: keyof FormState) => (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear error when user starts typing
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const updateNumericField = useCallback(
    (key: keyof FormState) => (value: string) => {
      const sanitized = sanitizeNumericInput(value);
      updateField(key)(sanitized);
    },
    [updateField],
  );

  // ── Validation ──
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!sanitizeInput(form.firstName)) {
      newErrors.firstName = "First name is required";
    } else if (form.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!sanitizeInput(form.lastName)) {
      newErrors.lastName = "Last name is required";
    } else if (form.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!validatePhone(form.phone)) {
      newErrors.phone = "Enter a valid phone number (7-10 digits)";
    }

    if (!form.age || !validateAge(form.age)) {
      newErrors.age = "Enter a valid age (1-100)";
    }

    if (!sanitizeInput(form.address)) {
      newErrors.address = "Address is required";
    }

    if (form.pincode && !validatePincode(form.pincode)) {
      newErrors.pincode = "Enter a valid pincode (4-10 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // ── Submit ──
  const handleSave = useCallback(async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    if (!validateForm()) {
      setToastState({
        message: "Please validate before submitting",
        type: "error",
      });
      setShowToast(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize all inputs before sending
      const sanitizedForm: FormState = {
        ...form,
        firstName: sanitizeInput(form.firstName),
        lastName: sanitizeInput(form.lastName),
        phone: sanitizeNumericInput(form.phone),
        age: sanitizeInput(form.age),
        address: sanitizeInput(form.address),
        city: sanitizeInput(form.city),
        district: sanitizeInput(form.district),
        state: sanitizeInput(form.state),
        pincode: sanitizeInput(form.pincode),
        locality: sanitizeInput(form.locality || ""),
      };

      const savedPatient = await savePatient(sanitizedForm);

      console.log("✅ Patient saved successfully:", savedPatient);

      setToastState({
        message: "Patient registered successfully!",
        type: "success",
      });
      setShowToast(true);

      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Failed to save patient:", error);

      setToastState({
        message: error?.message || "Failed to save patient. Please try again.",
        type: "error",
      });
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, validateForm, router]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const handleGenderSelect = useCallback((gender: Gender) => {
    setForm((prev) => ({ ...prev, gender }));
  }, []);

  // ── Address Selection ──
  const handleAddressSelect = useCallback(
    (data: any, details: any) => {
      console.log("📍 Place selected:", { data, details });

      if (!details?.address_components) {
        console.warn("⚠️ No address components in details");
        return;
      }

      const components = details.address_components;

      // Helper to extract component by type
      const getComponent = (type: string): string => {
        const component = components.find((c: any) => c.types.includes(type));
        return component?.long_name || "";
      };

      // Update form with address details
      setForm((prev) => ({
        ...prev,
        address: details.formatted_address || "",
        city:
          getComponent("locality") ||
          getComponent("sublocality") ||
          getComponent("administrative_area_level_3"),
        district:
          getComponent("administrative_area_level_2") ||
          getComponent("administrative_area_level_3"),
        state: getComponent("administrative_area_level_1"),
        pincode: getComponent("postal_code"),
        locality:
          getComponent("sublocality") ||
          getComponent("neighborhood") ||
          getComponent("sublocality_level_1"),
      }));

      // Clear address error if it exists
      if (errors.address) {
        setErrors((prev) => ({ ...prev, address: undefined }));
      }

      // Clear the search input
      placesRef.current?.setAddressText("");
    },
    [errors.address],
  );

  // ── Gender Radio Component ──
  const GenderOption = useCallback(
    ({ label }: { label: Gender }) => (
      <TouchableOpacity
        onPress={() => handleGenderSelect(label)}
        style={styles.radioOption}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityState={{ checked: form.gender === label }}
        accessibilityLabel={`Select ${label}`}
      >
        <View
          style={[
            styles.radioOuter,
            form.gender === label && styles.radioOuterActive,
          ]}
        >
          {form.gender === label && <View style={styles.radioInner} />}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
      </TouchableOpacity>
    ),
    [form.gender, handleGenderSelect],
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Patient Registration</Text>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          activeOpacity={0.8}
          accessibilityLabel="Close"
          accessibilityRole="button"
          disabled={isSubmitting}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Form ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 5 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Personal Details ── */}
          <SectionTitle text="Personal Details" />

          <FieldLabel text="First Name" required />
          <InputField
            placeholder="Enter first name"
            value={form.firstName.trim()}
            onChangeText={updateField("firstName")}
            error={errors.firstName}
            autoCapitalize="words"
          />

          <FieldLabel text="Last Name" required />
          <InputField
            placeholder="Enter last name"
            value={form.lastName}
            onChangeText={updateField("lastName")}
            error={errors.lastName}
            autoCapitalize="words"
          />

          {/* Phone with country code */}
          <FieldLabel text="Phone" required />
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryCodeBtn}
              activeOpacity={0.7}
              disabled={true} // Disable for now, can enable country picker later
            >
              <Text style={styles.flagEmoji}>🇮🇳</Text>
              <Text style={styles.countryCodeText}>{form.countryCode}</Text>
              <Text style={styles.dropdownArrow}>▾</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.phoneInputWrapper,
                errors.phone ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={styles.phoneInput}
                placeholder="0000000000"
                placeholderTextColor="#AABBD0"
                value={form.phone}
                onChangeText={updateNumericField("phone")}
                keyboardType="phone-pad"
                maxLength={PHONE_MAX_LENGTH}
                accessibilityLabel="Phone number"
              />
            </View>
          </View>
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}

          <FieldLabel text="Age" required />
          <InputField
            placeholder="Enter age"
            value={form.age}
            onChangeText={updateNumericField("age")}
            keyboardType="numeric"
            maxLength={AGE_MAX_LENGTH}
            error={errors.age}
          />

          {/* Gender */}
          <FieldLabel text="Gender" required />
          <View style={styles.genderRow}>
            <GenderOption label="Male" />
            <GenderOption label="Female" />
            <GenderOption label="Other" />
          </View>

          {/* ── Address ── */}
          <SectionTitle text="Address" />

          <FieldLabel text="Search Address" required />
          <View style={styles.addressSearchContainer}>
            <GooglePlacesAutocomplete
              ref={placesRef}
              placeholder="Type to search address..."
              fetchDetails={true}
              debounce={AUTOCOMPLETE_DEBOUNCE}
              minLength={AUTOCOMPLETE_MIN_LENGTH}
              keyboardShouldPersistTaps="handled"
              disableScroll={true}
              enablePoweredByContainer={false}
              onPress={handleAddressSelect}
              onFail={(error) => {
                console.error("❌ Places API Error:", error);
                setToastState({
                  message: "Failed to fetch address. Please try again.",
                  type: "error",
                });
                setShowToast(true);
              }}
              query={{
                key: GOOGLE_PLACES_API_KEY,
                language: "en",
                components: "country:in",
              }}
              styles={{
                container: {
                  flex: 0,
                  zIndex: 1000,
                },
                textInputContainer: {
                  backgroundColor: "transparent",
                },
                textInput: {
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: errors.address ? ACCENT : BORDER,
                  height: 50,
                  borderRadius: 4,
                  paddingHorizontal: 14,
                  fontSize: rf(14),
                  color: "#1A2B3C",
                },
                listView: {
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: BORDER,
                  borderRadius: 4,
                  marginTop: 4,
                  maxHeight: 300,
                },
                row: {
                  backgroundColor: "#FFFFFF",
                  padding: 13,
                  minHeight: 44,
                },
                separator: {
                  height: 1,
                  backgroundColor: "#E0EAF5",
                },
                description: {
                  fontSize: rf(14),
                  color: "#1A2B3C",
                },
                predefinedPlacesDescription: {
                  color: "#6B82A0",
                },
              }}
              textInputProps={{
                accessibilityLabel: "Search address",
                returnKeyType: "search",
              }}
            />
          </View>
          {errors.address ? (
            <Text style={styles.errorText}>{errors.address}</Text>
          ) : null}

          <FieldLabel text="Full Address" />
          <InputField
            placeholder="Selected address will appear here"
            value={form.address}
            onChangeText={updateField("address")}
            // editable={false}
          />

          <FieldLabel text="Village/Area" />
          <InputField
            placeholder="Enter village or area"
            value={form.city}
            onChangeText={updateField("city")}
          />

          <FieldLabel text="District" />
          <InputField
            placeholder="Enter district"
            value={form.district}
            onChangeText={updateField("district")}
          />

          <FieldLabel text="State" />
          <InputField
            placeholder="Enter state"
            value={form.state}
            onChangeText={updateField("state")}
          />

          <FieldLabel text="Pincode" />
          <InputField
            placeholder="Enter pincode"
            value={form.pincode}
            onChangeText={updateNumericField("pincode")}
            keyboardType="numeric"
            maxLength={PINCODE_MAX_LENGTH}
            error={errors.pincode}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Save Button ── */}
      <View style={[styles.footer, { paddingBottom: 15 }]}>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Save patient"
          accessibilityState={{ disabled: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Patient</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Toast ── */}
      {showToast && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          onClose={() => setShowToast(false)}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_BG = colors.HEADER_BG;
const ACCENT = colors.ACCENT;
const BORDER = colors.BORDER;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4FA",
  },

  // Header
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: rf(20),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E2D42",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: rf(14),
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 0,
  },

  // Section title
  sectionTitle: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.DARKBLUE,
    marginTop: 16,
    marginBottom: 0,
    letterSpacing: -0.2,
  },

  // Label
  label: {
    fontSize: rf(12),
    fontWeight: "600",
    color: "#1A2B3C",
    marginBottom: 4,
    marginTop: 14,
  },
  requiredStar: {
    color: ACCENT,
    fontSize: rf(14),
  },

  // Input
  inputWrapper: {
    marginBottom: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
    fontSize: rf(14),
    color: "#1A2B3C",
  },
  inputError: {
    borderColor: ACCENT,
  },
  inputDisabled: {
    backgroundColor: "#F5F7FA",
    color: "#6B82A0",
  },
  errorText: {
    fontSize: rf(11.5),
    color: ACCENT,
    marginTop: 4,
    marginLeft: 2,
    marginBottom: 2,
  },

  // Address search
  addressSearchContainer: {
    marginBottom: 2,
    zIndex: 1000,
  },

  // Phone row
  phoneRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 8 : 8,
    gap: 6,
  },
  flagEmoji: {
    fontSize: rf(18),
  },
  countryCodeText: {
    fontSize: rf(14),
    color: "#1A2B3C",
    fontWeight: "600",
  },
  dropdownArrow: {
    fontSize: rf(11),
    color: "#6B82A0",
  },
  phoneInputWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  phoneInput: {
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
    fontSize: rf(14),
    color: "#1A2B3C",
  },

  // Gender
  genderRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 6,
    marginBottom: 4,
    alignItems: "center",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#2E7BE0",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E7BE0",
  },
  radioLabel: {
    fontSize: rf(14),
    color: "#1A2B3C",
    fontWeight: "500",
  },

  // Footer / Save
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0EAF5",
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    // minHeight: 48,
  },
  saveBtnDisabled: {
    backgroundColor: "#AABBD0",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: rf(16),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
