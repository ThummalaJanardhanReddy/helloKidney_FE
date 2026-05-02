import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { logout } from "../../src/services/auth";
import { colors } from "../shared/commonStyles";

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

export default function ProfilePage() {
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState("");
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleItemPress = (type) => {
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

  const getSheetContent = (type) => {
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

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: colors.statusbar,
      }}
    >
      <View style={[styles.container]}>
        {/* Header */}
        <Text style={styles.header}>Profile</Text>

        <View style={styles.card}>
          {ProfileItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.item}
              onPress={() => handleItemPress(item.type)}
            >
              <View style={styles.itemLeft}>
                <Ionicons name={item.icon} size={22} color="#888" />
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
              <Text style={[styles.itemText, { color: "red" }]}>Logout</Text>
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

        {/* Logout Popup */}
        <Modal transparent animationType="fade" visible={logoutVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalMsg}>
                Are you sure you want to logout?
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
                  <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    position: "relative",
    // backgroundColor: "#db1557ff",
    // paddingTop: 60,
    // paddingHorizontal: 20,
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    padding: 20,
    backgroundColor: colors.bg_home,
    color: colors.white,
  },

  card: {
    backgroundColor: "white",
    // borderRadius: 12,
    paddingVertical: 10,
    elevation: 2,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
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
    fontSize: 22,
    fontWeight: "bold",
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

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "90%",
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    elevation: 20,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },

  sheetText: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20,
  },

  closeSheetBtn: {
    backgroundColor: "#1A82F7",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 10,
    alignItems: "center",
  },

  closeSheetText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
