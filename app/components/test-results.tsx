import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../shared/commonStyles";

const rgbStringToColor = (rgb: string) =>
  rgb.replace("RGB", "rgb").replace(/\s/g, "");

const TestResults = () => {
  const router = useRouter();
  const { result, refresh } = useLocalSearchParams<any>();

  const parsedResult = JSON.parse(result);

  const { creatinineInfo, microalbuminInfo, uacrInfo } = parsedResult?.result;

  const handleBackPress = () => {
    if (refresh === "true") {
      router.replace({
        pathname: "/(home)/tests",
        params: { refresh: refresh || undefined },
      });
      return;
    }
    router.back();
    // router.replace({pathname:'/(home)/tests', params: { refresh: refresh || undefined }});
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={26} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.header}>Urine ACR Test Results</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F2f6ff' }}
      >
        <Text style={[styles.sectionTitle, { fontSize: 18 }]}>Parameters</Text>
        {/* Creatinine + Microalbumin */}
        <View style={styles.row}>
          {/* Creatinine */}
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: rgbStringToColor(creatinineInfo.rgb_value),
              },
            ]}
          >
            <Text style={[styles.metricTitle, { fontWeight: 400 }]}>
              Creatinine
            </Text>
            <Text style={styles.metricTitle}>{creatinineInfo.pod_color}</Text>
            <View style={styles.metricBottom}>
              <Text style={styles.metricValue}>{creatinineInfo.value}</Text>
              <Text style={styles.metricUnit}>Leu/µL</Text>
            </View>
          </View>

          {/* Microalbumin */}
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: rgbStringToColor(microalbuminInfo.rgb_value),
              },
            ]}
          >
            <Text style={[styles.metricTitle, { fontWeight: 400 }]}>
              Microalbumin
            </Text>
            <Text style={styles.metricTitle}>{microalbuminInfo.pod_color}</Text>
            <View style={styles.metricBottom}>
              <Text style={styles.metricValue}>{microalbuminInfo.value}</Text>
              <Text style={styles.metricUnit}>Mg/dL</Text>
            </View>
          </View>
        </View>

        {/* UACR */}
        <View style={styles.uacrCard}>
          <Text style={[styles.sectionTitle, {color: '#fd6e05'}]}>UACR VALUE</Text>
          <Text style={styles.uacrValue}>{uacrInfo.value} Mg/dL</Text>
          {/* <Text style={styles.uacrUnit}>mg/g</Text> */}
        </View>

        {/* <View style={{ alignItems: "center" }}>
          <TouchableOpacity style={styles.downloadBtn}>
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.downloadText}>Download Report</Text>
          </TouchableOpacity>
        </View> */}

        {/* <View style={{ height: 30 }} /> */}
      </ScrollView>

      <TouchableOpacity style={styles.done} onPress={handleBackPress}>
        <Text style={{color: 'white', fontSize: 18}}>Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default TestResults;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#F2f6ff",
    backgroundColor: 'white'
    // paddingHorizontal: 20,
    // paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    // marginBottom: 20,
    backgroundColor: colors.bg_home,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  testName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: "#333",
  },
  testId: {
    fontSize: 14,
    color: "#777",
    marginBottom: 10,
  },

  label: {
    color: "#777",
    fontSize: 14,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    // marginTop: 10,
    color: "black",
  },
  paramCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECEC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paramName: {
    fontSize: 16,
    fontWeight: "600",
  },
  paramValue: {
    fontSize: 14,
    color: "#555",
    marginTop: 3,
  },

  // Status Badge
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  normal: { backgroundColor: "#4CAF50" },
  high: { backgroundColor: "#E53935" },
  low: { backgroundColor: "#FB8C00" },

  notesCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  notesText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },

  downloadBtn: {
    marginTop: 25,
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  downloadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  subText: {
    fontSize: 13,
    color: "#333",
    marginTop: 4,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metricCard: {
    width: "48%",
    height: 140,
    borderRadius: 8,
    padding: 16,
    justifyContent: "space-between",
    elevation: 2,
  },

  metricTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    textTransform: "uppercase",
  },

  metricBottom: {
    // alignItems: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap"
  },

  metricValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },

  metricUnit: {
    fontSize: 13,
    color: "#333",
  },

  uacrCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 24,
    paddingVertical: 10,
    alignItems: "flex-start",
    marginTop: 15,
    borderColor: '#d3d0d0',
    borderWidth: 1,
    flexWrap: 'wrap'
  },

  uacrValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "black",
  },

  uacrUnit: {
    fontSize: 14,
    marginTop: 4,
    color: "#555",
  },

  done: {
    backgroundColor: "red",
    paddingVertical: 10,
    position: "fixed",
    bottom: 0,
    // marginHorizontal:25,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
    width: 150,
    margin: 'auto',
    color: 'white'
  },
});
