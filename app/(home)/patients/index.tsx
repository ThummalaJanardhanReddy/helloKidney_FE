import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getAllPatients } from "@/src/services/healthworkerService";
import { useUserStore } from "@/app/stores/userStore";
import commonStyles, { colors } from "@/app/shared/commonStyles";

const { width } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (width / 390));

// ── Placeholder API data ──────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  {
    address: null,
    age: 90,
    city: null,
    created_on: "2026-04-06T17:59:06.249485",
    district: null,
    email_id: null,
    full_name: "Jana T",
    gender: "Male",
    locality: null,
    mobile_no: "+918978298289",
    patient_id: 1,
    patient_uniqueid: null,
    pincode: null,
    state: null,
    user_name: null,
  },
];

type Patient = (typeof MOCK_PATIENTS)[0];

// ── Initials avatar ───────────────────────────────────────────────────────────
function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View style={styles.initialsAvatar}>
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  );
}

// ── Single patient row ────────────────────────────────────────────────────────
function PatientRow({ item, onPress }: { item: Patient; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.row}>
      {/* {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : ( */}
        <InitialsAvatar name={item.full_name} />
      {/* )} */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.full_name}</Text>
        <Text style={styles.rowMeta}>
          {String(item.patient_uniqueid ?? item.patient_id)?.padStart(4, "0") || '--'} | {item.age} years, {item.gender}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PatientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [loading, setLoading] = useState(false);
  const { user } = useUserStore();

  useFocusEffect(
    React.useCallback(() => {
      getPatients();
    }, []),
  );

  const getPatients = async () => {
    try {
      setLoading(true);
      const res = (await getAllPatients(
        Number.parseInt(user?.userId || "0"),
        query,
      )) as any;
      console.log("Fetched patients:", res);
      setPatients(res.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(query.toLowerCase()) ||
      p.mobile_no.toLowerCase().includes(query.toLowerCase()),
  );

  const handlePatientPress = (patient: Patient) => {
    // Pass patient data as a JSON string via search params
    router.push({
      pathname: "/patients/[id]",
      params: { id: patient.patient_id, data: JSON.stringify(patient) },
    });
  };

  //   const handleAddPatient = () => {
  //     router.push("/patients/add");
  //   };
  const handleAddPatient = () => router.push("/patients/add");

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.bg_home} barStyle={"light-content"}/>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Patient List</Text>
        <TouchableOpacity onPress={handleAddPatient} activeOpacity={0.75}>
          <Text style={styles.addBtn}>+ Add Patient</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          {/* <Text style={styles.searchIcon}>🔍</Text> */}
          <Ionicons name="search" size={18} color="#7F7F7F" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile number"
            placeholderTextColor="#7F7F7F"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.patient_id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PatientRow item={item} onPress={() => handlePatientPress(item)} />
        )}
        
        ListEmptyComponent={
          <View style={styles.empty}>
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
  container: { flex: 1, backgroundColor: colors.white },

  header: {
    backgroundColor: colors.bg_home,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: commonStyles.headerText,
  addBtn: {
    fontSize: rf(14),
    fontWeight: "700",
    color: colors.DARKBLUE,
  },

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
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: { fontSize: rf(15) },
  searchInput: { flex: 1, fontSize: rf(14), color: "#7F7F7F", padding: 0 },
  clearBtn: { fontSize: rf(13), color: "#9BADC4", paddingHorizontal: 4 },

  listContent: { backgroundColor: "#FFFFFF", paddingBottom: 20 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: 14,
    borderColor: colors.BORDER1,
    borderWidth: 0.5
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#EEF3FA",
  },
  initialsAvatar: {
    width: 32,
    height: 32,
    borderRadius: 28,
    backgroundColor: "#DDE6F5",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { fontSize: rf(12), fontWeight: "700", color: "#3A6BA8" },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: rf(14), fontWeight: "700", color: colors.black, marginBottom: 3 },
  rowMeta: { fontSize: rf(12), color: colors.black },
  chevron: { fontSize: rf(22), color: "#B0C0D8", lineHeight: rf(26) },
  separator: { height: 1, backgroundColor: "#EEF3FA", marginLeft: 90 },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: rf(15), color: "#9BADC4", fontWeight: "500" },
});
