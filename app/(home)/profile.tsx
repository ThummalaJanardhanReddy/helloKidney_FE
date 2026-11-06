import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Image, Keyboard, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import Text from "../components/Text";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { logout } from "../../src/services/auth";
import { colors, pageTitle } from "../shared/commonStyles";
import { images } from "@/assets";
import { useUserStore } from "@/app/stores/userStore";
import { CustomCountryPickerModal } from "@/app/components/CustomCountryPickerModal";
import { COUNTRIES, Country } from "@/src/utils/constants";

const ProfileItems = [
  {
    title: "About HelloKidney",
    icon: "information-circle-outline",
    type: "about",
  },
  { title: "Rate The App", icon: "star-outline", type: "rate" },
  { title: "T&C", icon: "document-text-outline", type: "terms" },
  { title: "Privacy & Policy", icon: "lock-closed-outline", type: "privacy" },
];

type Gender = "Male" | "Female" | "Other";

const capitalizeName = (name?: string) =>
  name
    ?.trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

export default function ProfilePage() {
  const router = useRouter();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const isHealthWorker = user?.userType === "healthworker";

  const [editVisible, setEditVisible] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.dial_code === user?.countryCode) || {
      name: "India",
      dial_code: "+91",
      code: "IN",
      flag: "🇮🇳",
    },
  );
  const [editForm, setEditForm] = useState({
    fullName: user?.userName || "",
    age: user?.age || "",
    gender: (user?.gender as Gender) || "",
    phone: user?.phone || "",
    email: user?.userEmail || "",
  });
  const [nameError, setNameError] = useState("");

  const openEditProfile = () => {
    setEditForm({
      fullName: user?.userName || "",
      age: user?.age || "",
      gender: (user?.gender as Gender) || "",
      phone: user?.phone || "",
      email: user?.userEmail || "",
    });
    setSelectedCountry(
      COUNTRIES.find((c) => c.dial_code === user?.countryCode) ||
        selectedCountry,
    );
    setNameError("");
    setEditVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editForm.fullName.trim()) {
      setNameError("Full name is required");
      return;
    }
    Keyboard.dismiss();
    updateUser({
      userName: editForm.fullName.trim(),
      age: editForm.age,
      gender: editForm.gender,
      phone: editForm.phone,
      countryCode: selectedCountry.dial_code,
      userEmail: editForm.email.trim(),
    });
    setEditVisible(false);
  };

  const handleItemPress = (type: string) => {
    if (type === "rate") {
      const androidUrl =
        "https://play.google.com/store/apps/details?id=ai.hellokidney";

      const iosUrl = "https://apps.apple.com/in/app/hellokidney/id1619042064"; // 👈 App Store ID

      const url = Platform.OS === "ios" ? iosUrl : androidUrl;
      Linking.openURL(url);
      return;
    }
    getSheetContent(type);
  };

  const getSheetContent = (type: string) => {
    switch (type) {
      case "about":
        Linking.openURL("https://hellokidney.ai");
        return;
      case "terms":
        Linking.openURL("https://hellokidney.ai/terms-and-conditions.html");
        return;
      case "privacy":
        Linking.openURL("https://hellokidney.ai/privacy-policy.html");
        return;
      default:
        return {};
    }
  };

  const handleLogout = () => {
    setLogoutVisible(false);
    logout();
    // Add actual logout logic
  };

  const GenderOption = ({ label }: { label: Gender }) => (
    <TouchableOpacity
      onPress={() => setEditForm((prev) => ({ ...prev, gender: label }))}
      style={styles.radioOption}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: editForm.gender === label }}
      accessibilityLabel={`Select ${label}`}
    >
      <View
        style={[
          styles.radioOuter,
          editForm.gender === label && styles.radioOuterActive,
        ]}
      >
        {editForm.gender === label && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F4F4F4",
      }}
    >
      <StatusBar style="dark" backgroundColor={colors.white} animated />
      <View style={[styles.container]}>
        {/* Profile header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityLabel="Back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={22} color={colors.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Profile</Text>
          </View>

          <View style={styles.avatarWrap}>
            <Image source={images.noProfile} style={styles.avatar} />
            <TouchableOpacity
              style={styles.avatarEditBadge}
              activeOpacity={0.8}
              onPress={openEditProfile}
              accessibilityLabel="Change profile photo"
            >
              <Ionicons name="camera" size={16} color={colors.blue} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {capitalizeName(user?.userName) || "User"}
          </Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.8}
            onPress={openEditProfile}
          >
            <Text style={styles.editProfileBtnText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Settings</Text>
          <View style={styles.card}>
            {ProfileItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.item}
                onPress={() => handleItemPress(item.type)}
              >
                <View style={styles.itemLeft}>
                  <Ionicons name={item.icon as any} size={22} color="#888" />
                  <Text style={styles.itemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </TouchableOpacity>
            ))}

            {/* Logout Item */}
            <TouchableOpacity
              style={[styles.item, { borderBottomWidth: 0 }]}
              onPress={() => setLogoutVisible(true)}
            >
              <View style={styles.itemLeft}>
                <Ionicons name="log-out-outline" size={22} color="red" />
                <Text style={[styles.itemText, { color: "red" }]}>
                  Sign out
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <Text style={styles.version}>
            Version {Constants.expoConfig?.version || "1.0"}
          </Text>

          <View style={{ marginHorizontal: "auto", paddingVertical: 10 }}>
            <Text style={{ fontWeight: "600", color: "black" }}>
              © 4P Healthcare Pvt. Ltd.
            </Text>
          </View>
        </ScrollView>

        {/* Logout Popup */}
        <Modal transparent animationType="fade" visible={logoutVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Sign out</Text>
              <Text style={styles.modalMsg}>
                Are you sure you want to Sign out?
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setLogoutVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalBtn, styles.logoutBtn]}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutText}>Sign out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Profile Popup */}
        <Modal
          transparent
          animationType="slide"
          visible={editVisible}
          onRequestClose={() => setEditVisible(false)}
        >
          <View style={styles.editOverlay}>
            <View style={[styles.editSheet, { paddingTop: insets.top }]}>
              <View style={styles.editHeader}>
                <Text style={styles.editHeaderTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={() => setEditVisible(false)}
                  style={styles.editCloseBtn}
                  activeOpacity={0.8}
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color={colors.ACCENT} />
                </TouchableOpacity>
              </View>

              <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.editForm}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  placeholder="Enter"
                  placeholderTextColor="#AABBD0"
                  value={editForm.fullName}
                  onChangeText={(v) => {
                    setEditForm((prev) => ({ ...prev, fullName: v }));
                    if (nameError) setNameError("");
                  }}
                  autoCapitalize="words"
                />
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}

                {!isHealthWorker && (
                  <>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter"
                      placeholderTextColor="#AABBD0"
                      value={editForm.age}
                      onChangeText={(v) =>
                        setEditForm((prev) => ({
                          ...prev,
                          age: v.replace(/[^0-9]/g, ""),
                        }))
                      }
                      keyboardType="numeric"
                      maxLength={3}
                    />

                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.genderRow}>
                      <GenderOption label="Male" />
                      <GenderOption label="Female" />
                      <GenderOption label="Other" />
                    </View>
                  </>
                )}

                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryCodeBtn}
                    activeOpacity={0.7}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Text style={styles.flagEmoji}>
                      {selectedCountry.flag}
                    </Text>
                    <Text style={styles.countryCodeText}>
                      {selectedCountry.dial_code}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color="#1A2B3C"
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>

                  <View style={styles.phoneInputWrapper}>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Enter"
                      placeholderTextColor="#AABBD0"
                      value={editForm.phone}
                      onChangeText={(v) =>
                        setEditForm((prev) => ({
                          ...prev,
                          phone: v.replace(/[^0-9]/g, ""),
                        }))
                      }
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Email Id</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@companyname.com"
                  placeholderTextColor="#AABBD0"
                  value={editForm.email}
                  onChangeText={(v) =>
                    setEditForm((prev) => ({ ...prev, email: v }))
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </KeyboardAwareScrollView>

              <View
                style={[
                  styles.editFooter,
                  { paddingBottom: Math.max(insets.bottom, 16) },
                ]}
              >
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  activeOpacity={0.85}
                  style={styles.saveBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile"
                >
                  <Text style={styles.saveBtnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <CustomCountryPickerModal
          visible={showCountryPicker}
          onClose={() => setShowCountryPicker(false)}
          selectedCountry={selectedCountry}
          onSelect={(country) => {
            setSelectedCountry(country);
            setShowCountryPicker(false);
          }}
        />
      </View>
    </View>
  );
}

const ACCENT = colors.ACCENT;
const BORDER = colors.BORDER;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    position: "relative",
  },

  header: {
    backgroundColor: colors.bg_primary,
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    ...pageTitle,
    color: colors.black,
  },
  avatarWrap: {
    width: 104,
    height: 104,
    marginBottom: 14,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: colors.border,
  },
  avatarEditBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 14,
  },
  editProfileBtn: {
    backgroundColor: colors.bg_primary,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 4,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#D2D2D5",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itemText: {
    fontSize: 16,
    color: "#111827",
  },

  version: {
    marginTop: 25,
    textAlign: "center",
    color: "#6B7280",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 40,
  },

  modalBox: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 12,
    elevation: 5,
  },

  modalTitle: {
    ...pageTitle,
    color: colors.black,
  },

  modalMsg: {
    fontSize: 16,
    color: "#374151",
    marginVertical: 10,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 15,
  },

  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  cancelBtn: {
    backgroundColor: "#E5E7EB",
  },

  logoutBtn: {
    backgroundColor: "red",
  },

  cancelText: {
    color: "#111",
    fontSize: 15,
  },

  logoutText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Edit Profile (full screen) ──
  editOverlay: {
    flex: 1,
    backgroundColor: colors.white,
  },
  editSheet: {
    flex: 1,
    backgroundColor: colors.white,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  editHeaderTitle: {
    ...pageTitle,
    color: colors.black,
  },
  editCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  editForm: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 12,
  },
  editFooter: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "#E0EAF5",
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2B3C",
    marginBottom: 4,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: "#1A2B3C",
  },
  inputError: {
    borderColor: ACCENT,
  },
  errorText: {
    fontSize: 11.5,
    color: ACCENT,
    marginTop: 4,
    marginLeft: 2,
  },

  genderRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 6,
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
    borderColor: colors.blue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
  radioLabel: {
    fontSize: 14,
    color: "#1A2B3C",
    fontWeight: "400",
  },

  phoneRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 14,
    color: "#1A2B3C",
    fontWeight: "600",
  },
  phoneInputWrapper: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
  },
  phoneInput: {
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#1A2B3C",
  },

  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
