import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getAllPatients } from "@/src/services/healthworkerService";
import { useUserStore } from "@/app/stores/userStore";
import commonStyles, { colors } from "@/app/shared/commonStyles";

const { width } = Dimensions.get("window");
const rf = (size: number) => Math.round(size * (width / 390));

const SKELETON_ROW_COUNT = 6;

interface Patient {
  address: string | null;
  age: number;
  city: string | null;
  created_on: string;
  district: string | null;
  email_id: string | null;
  full_name: string;
  gender: string;
  locality: string | null;
  mobile_no: string;
  patient_id: number;
  patient_uniqueid: string | null;
  pincode: string | null;
  state: string | null;
  user_name: string | null;
}

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
        <Text style={styles.rowName}>
          {item.full_name?.replaceAll(",", "")}
          <Text style={styles.rowMetaInline}>
            , {item.age} years, {item.gender}
          </Text>
        </Text>
        <Text style={styles.rowMeta}>
          {String(item.patient_id).padStart(4, "0")} | {item.mobile_no}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );
}

// ── Skeleton row (pulses while the list is loading) ───────────────────────────
function SkeletonRow() {
  return (
    <Animatable.View
      animation="pulse"
      easing="ease-out"
      iterationCount="infinite"
      style={styles.row}
    >
      <View style={[styles.initialsAvatar, styles.skeletonBlock]} />
      <View style={styles.rowInfo}>
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View style={[styles.skeletonLine, { width: "40%", marginTop: 8 }]} />
      </View>
    </Animatable.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PatientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
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
      <StatusBar style="dark" backgroundColor={colors.white} animated/>
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
      {loading ? (
        <View style={styles.listContent}>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.patient_id.toString()}
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyListContent : styles.listContent
          }
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
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_BG = colors.white;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000000" },
  addBtn: {
    fontSize: rf(14),
    fontWeight: "700",
    color: colors.DARKBLUE,
  },

  searchWrapper: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.BORDER1,
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
  emptyListContent: { flexGrow: 1, backgroundColor: "#FFFFFF", paddingBottom: 20 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: 14,
    borderColor: colors.BORDER1,
    borderWidth: 0,
    borderBottomWidth: 0.8
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
  rowMetaInline: { fontSize: rf(12), fontWeight: "400", color: colors.black },
  rowMeta: { fontSize: rf(12), color: colors.black },
  chevron: { fontSize: rf(22), color: "#B0C0D8", lineHeight: rf(26) },
  separator: { height: 1, backgroundColor: "#EEF3FA", marginLeft: 90 },

  skeletonBlock: { backgroundColor: "#DDE6F5" },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: "#E2E8F0" },

  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: rf(15), color: "#9BADC4", fontWeight: "500" },
});
