import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  Platform,
} from "react-native";

const { width } = Dimensions.get("window");
const scale = width / 390;
const rf = (size) => Math.round(size * scale);

// ── Placeholder API response ──────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: "1", name: "Dinesh Kumar",  mrNumber: "MR23876", age: 34, gender: "Male",   avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "2", name: "Surender",      mrNumber: "MR23877", age: 50, gender: "Female", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: "3", name: "Ravi Kumar",    mrNumber: "MR23878", age: 39, gender: "Male",   avatar: null },
  { id: "4", name: "Kiran",         mrNumber: "MR23876", age: 34, gender: "Male",   avatar: "https://randomuser.me/api/portraits/men/33.jpg" },
  { id: "5", name: "Lalitha",       mrNumber: "MR23877", age: 50, gender: "Female", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "6", name: "Ravi Sk",       mrNumber: "MR23878", age: 39, gender: "Male",   avatar: null },
  { id: "7", name: "Hari Gopal",    mrNumber: "MR23878", age: 39, gender: "Male",   avatar: null },
  { id: "8", name: "Vikas P",       mrNumber: "MR23878", age: 39, gender: "Male",   avatar: null },
];

// ── Avatar placeholder (initials) ────────────────────────────────────────────
function AvatarPlaceholder({ name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View style={styles.avatarPlaceholder}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

// ── Patient row item ──────────────────────────────────────────────────────────
function PatientItem({ item, index, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      delay: index * 55,
      useNativeDriver: true,
    }).start();
  }, []);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, tension: 120, friction: 8 }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }).start()
        }
        onPress={() => onPress(item)}
        style={styles.patientRow}
      >
        {/* Avatar */}
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <AvatarPlaceholder name={item.name} />
        )}

        {/* Info */}
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientMeta}>
            {item.mrNumber} | {item.age} years, {item.gender}
          </Text>
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PatientListScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [patients] = useState(MOCK_PATIENTS);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.mrNumber.toLowerCase().includes(query.toLowerCase())
  );

  const handlePatientPress = (patient) => {
    navigation?.navigate?.("PatientProfile", { patient });
    console.log("Patient pressed:", patient.name);
  };

  const handleAddPatient = () => {
    navigation?.navigate?.("AddPatient");
    console.log("Add Patient pressed");
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient List</Text>
        <TouchableOpacity onPress={handleAddPatient} activeOpacity={0.75}>
          <Text style={styles.addBtn}>+ Add Patient</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for patient name, mobile number"
            placeholderTextColor="#9BADC4"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <PatientItem item={item} index={index} onPress={handlePatientPress} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_BG = "#0D1B2E";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4FA",
  },

  // Header
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: rf(22),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  addBtn: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#4DB8FF",
    letterSpacing: 0.2,
  },

  // Search
  searchWrapper: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  searchIcon: {
    fontSize: rf(15),
  },
  searchInput: {
    flex: 1,
    fontSize: rf(14),
    color: "#1A2B3C",
    padding: 0,
  },
  clearIcon: {
    fontSize: rf(13),
    color: "#9BADC4",
    paddingHorizontal: 4,
  },

  // List
  listContent: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 20,
  },

  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },

  // Avatar
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#EEF3FA",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DDE6F5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: rf(18),
    fontWeight: "700",
    color: "#3A6BA8",
  },

  // Patient info
  patientInfo: {
    flex: 1,
    gap: 3,
  },
  patientName: {
    fontSize: rf(15.5),
    fontWeight: "700",
    color: "#0D1B2E",
    letterSpacing: -0.1,
  },
  patientMeta: {
    fontSize: rf(13),
    color: "#6B82A0",
    fontWeight: "400",
  },

  chevron: {
    fontSize: rf(22),
    color: "#B0C0D8",
    fontWeight: "300",
    lineHeight: rf(26),
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF3FA",
    marginLeft: 90,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: rf(15),
    color: "#9BADC4",
    fontWeight: "500",
  },
});