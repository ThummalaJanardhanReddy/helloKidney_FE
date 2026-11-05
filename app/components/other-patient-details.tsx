import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import Text from "./Text";
import { colors } from "../shared/commonStyles";

const ACCENT = colors.ACCENT;
const BORDER = colors.BORDER;

const AGE_MAX_LENGTH = 3;

type Gender = "Male" | "Female" | "Other";

const RELATIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Friend",
  "Relative",
  "Other",
];

interface FormState {
  relationType: string;
  fullName: string;
  age: string;
  gender: Gender | "";
}

interface FormErrors {
  relationType?: string;
  fullName?: string;
  age?: string;
  gender?: string;
}

const sanitizeInput = (value: string): string => value.trim();
const sanitizeNumericInput = (value: string): string =>
  value.replace(/[^0-9]/g, "");

const validateAge = (age: string): boolean => {
  const ageNum = Number(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum <= 120;
};

function FieldLabel({ text, required = false }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
  );
}

export default function OtherPatientDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<FormState>({
    relationType: "",
    fullName: "",
    age: "",
    gender: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showRelationPicker, setShowRelationPicker] = useState(false);

  const updateField = useCallback(
    (key: keyof FormState) => (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors],
  );

  const handleGenderSelect = useCallback((gender: Gender) => {
    setForm((prev) => ({ ...prev, gender }));
    setErrors((prev) => ({ ...prev, gender: undefined }));
  }, []);

  const handleRelationSelect = useCallback((relation: string) => {
    setForm((prev) => ({ ...prev, relationType: relation }));
    setErrors((prev) => ({ ...prev, relationType: undefined }));
    setShowRelationPicker(false);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.relationType) {
      newErrors.relationType = "Please select a relation";
    }
    if (!sanitizeInput(form.fullName)) {
      newErrors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }
    if (!form.age || !validateAge(form.age)) {
      newErrors.age = "Enter a valid age (1-120)";
    }
    if (!form.gender) {
      newErrors.gender = "Please select a gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    router.push({
      pathname: "/components/TimerCameraUploader",
      params: {
        subjectType: "other",
        relationType: form.relationType,
        fullName: sanitizeInput(form.fullName),
        age: form.age,
        gender: form.gender,
      },
    });
  }, [form, router, validateForm]);

  const GenderOption = ({ label }: { label: Gender }) => (
    <TouchableOpacity
      onPress={() => handleGenderSelect(label)}
      style={styles.radioOption}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: form.gender === label }}
      accessibilityLabel={`Select ${label}`}
    >
      <View style={[styles.radioOuter, form.gender === label && styles.radioOuterActive]}>
        {form.gender === label && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Other's Details</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.8}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={22} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <FieldLabel text="Relation Type" required />
        <TouchableOpacity
          style={[styles.input, styles.selectInput, errors.relationType ? styles.inputError : null]}
          activeOpacity={0.8}
          onPress={() => setShowRelationPicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Select relation type"
        >
          <Text style={form.relationType ? styles.selectValue : styles.selectPlaceholder}>
            {form.relationType || "Select relation"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#6B82A0" />
        </TouchableOpacity>
        {errors.relationType ? <Text style={styles.errorText}>{errors.relationType}</Text> : null}

        <FieldLabel text="Full Name" required />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.fullName ? styles.inputError : null]}
            placeholder="Enter full name"
            placeholderTextColor="#AABBD0"
            value={form.fullName}
            onChangeText={updateField("fullName")}
            autoCapitalize="words"
            accessibilityLabel="Full name"
          />
          {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
        </View>

        <FieldLabel text="Age" required />
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, errors.age ? styles.inputError : null]}
            placeholder="Enter age"
            placeholderTextColor="#AABBD0"
            value={form.age}
            onChangeText={(v) => updateField("age")(sanitizeNumericInput(v))}
            keyboardType="numeric"
            maxLength={AGE_MAX_LENGTH}
            accessibilityLabel="Age"
          />
          {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
        </View>

        <FieldLabel text="Gender" required />
        <View style={styles.genderRow}>
          <GenderOption label="Male" />
          <GenderOption label="Female" />
          <GenderOption label="Other" />
        </View>
        {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          style={styles.submitBtn}
          accessibilityRole="button"
          accessibilityLabel="Submit"
        >
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRelationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowRelationPicker(false)}
          />
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.handleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Select Relation</Text>
              <TouchableOpacity
                onPress={() => setShowRelationPicker(false)}
                style={styles.modalCloseBtn}
                hitSlop={10}
              >
                <Ionicons name="close" size={18} color="#6B82A0" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={RELATIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = form.relationType === item;
                return (
                  <TouchableOpacity
                    style={[styles.relationItem, isSelected && styles.relationItemSelected]}
                    onPress={() => handleRelationSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.relationText, isSelected && styles.relationTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#2E7BE0" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2B3C",
    marginBottom: 4,
    marginTop: 14,
  },
  requiredStar: {
    color: ACCENT,
    fontSize: 14,
  },
  inputWrapper: {
    marginBottom: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 44,
    fontSize: 14,
    color: "#1A2B3C",
    textAlignVertical: "center",
  },
  inputError: {
    borderColor: ACCENT,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 14,
    color: "#1A2B3C",
  },
  selectPlaceholder: {
    fontSize: 14,
    color: "#AABBD0",
  },
  errorText: {
    fontSize: 11.5,
    color: ACCENT,
    marginTop: 4,
    marginLeft: 2,
    marginBottom: 2,
  },
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
    fontSize: 14,
    color: "#1A2B3C",
    fontWeight: "500",
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0EAF5",
  },
  submitBtn: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Relation picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0EAF5",
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2B3C",
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F4FA",
    alignItems: "center",
    justifyContent: "center",
  },
  relationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  relationItemSelected: {
    backgroundColor: "#EBF5FF",
  },
  relationText: {
    fontSize: 15,
    color: "#1A2B3C",
    fontWeight: "500",
  },
  relationTextSelected: {
    color: "#2E7BE0",
  },
});
