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
import { useUserStore } from "../stores/userStore";

const rgbStringToColor = (rgb: string) =>
  rgb.replace("RGB", "rgb").replace(/\s/g, "");

const TestResult = () => {
  const router = useRouter();
  const { result, refresh, patient } = useLocalSearchParams<any>();
  const userType = useUserStore((s) => s.user?.userType);

  const parsedResult = JSON.parse(result);

  const parsed =
    typeof parsedResult?.result === "string"
      ? JSON.parse(parsedResult.result)
      : parsedResult?.result || {};

  const { creatinineInfo, microalbuminInfo, uacrInfo, retestRecommendation } =
    parsed;

  const handleBackPress = () => {
    if (refresh === "true") {
      //   router.replace({
      //     pathname: "/(home)/tests",
      //     params: { refresh: refresh || undefined },
      //   });
      if (userType === "healthworker") {
        router.replace({
          pathname: "/(home)/patients/[id]",
          params: {
            id: patient?.patient_id || 0,
            data: patient,
          },
        });

        return;
      } else {
        router.replace({
          pathname: "/(home)/tests",
          params: { refresh: refresh || undefined },
        });
      }
    }

    router.back();
    // router.replace({pathname:'/(home)/tests', params: { refresh: refresh || undefined }});
  };

  const handleRetakeTest = () => {
    router.replace({
      pathname: "/components/TimerCameraUploader",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={26} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.header}>uACR Results</Text>
        {/* <View style={{ width: 26 }} /> */}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: "#F2f6ff",
        }}
      >
        {/* <Text style={[styles.sectionTitle, { fontSize: 18 }]}>Parameters</Text> */}
        {/* Creatinine + Microalbumin */}
        <View style={styles.row}>
          {/* Creatinine */}
          <View style={{ gap: 6, width: "48%" }}>
            <Text style={[styles.metricTitle]}>Creatinine</Text>
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: rgbStringToColor(creatinineInfo?.rgb_value),
                },
              ]}
            >
              {/* <Text style={styles.metricTitle}>{creatinineInfo?.pod_color}</Text> */}
              <View style={styles.metricBottom}>
                <Text style={styles.metricValue}>
                  {creatinineInfo?.value
                    ? creatinineInfo?.value
                    : "Result not available"}
                </Text>
              </View>
            </View>
          </View>

          {/* Microalbumin */}
          <View style={{ gap: 6, width: "48%" }}>
            <Text style={[styles.metricTitle]}>Microalbumin</Text>
            <View
              style={[
                styles.metricCard,
                {
                  backgroundColor: rgbStringToColor(
                    microalbuminInfo?.rgb_value,
                  ),
                },
              ]}
            >
              {/* <Text style={styles.metricTitle}>
                {microalbuminInfo?.pod_color}
              </Text> */}
              <View style={styles.metricBottom}>
                <Text style={styles.metricValue}>
                  {microalbuminInfo?.value
                    ? microalbuminInfo?.value
                    : "Result not available"}
                </Text>
                {/* <Text style={styles.metricUnit}>Mg/dL</Text> */}
              </View>
            </View>
          </View>
        </View>

        {/* UACR */}
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle]}>uACR</Text>
          <View style={styles.uacrCard}>
            {uacrInfo?.stage ? (
              <Text style={[styles.metricTitle, { color: "#449126" }]}>
                Stage {uacrInfo.stage}
              </Text>
            ) : (
              <Text style={[styles.metricTitle, { color: "#fd6e05" }]}>
                Stage unavailable
              </Text>
            )}
            {uacrInfo?.value !== undefined ? (
              <Text style={styles.uacrValue}>{uacrInfo.value}</Text>
            ) : (
              <Text style={styles.uacrValue}>Result not available</Text>
            )}
            {uacrInfo?.reference_range !== undefined && (
              <Text style={styles.referenceRange}>
                Reference: {uacrInfo.reference_range}
              </Text>
            )}
          </View>
        </View>

        {/* Recommendation */}
        {retestRecommendation?.retest_required && (
          <>
            <View style={styles.warningCard}>
              <View style={styles.warningHeader}>
                <Text style={styles.warningIcon}>⚠</Text>

                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>
                    {retestRecommendation.guidance}
                  </Text>

                  {retestRecommendation?.reason?.map(
                    (item: string, index: number) => (
                      <Text key={index} style={styles.warningReason}>
                        • {item}
                      </Text>
                    ),
                  )}

                  <TouchableOpacity
                    style={[styles.retake, ]}
                    onPress={handleRetakeTest}
                  >
                    <Text style={styles.retakeText}>Retake test</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.done, { backgroundColor: colors.success }]}
        onPress={handleBackPress}
      >
        <Text style={{ color: "white", fontSize: 18 }}>Complete uACR test</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default TestResult;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#F2f6ff",
    backgroundColor: "white",
    // paddingHorizontal: 20,
    // paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    height: 60,
    gap: 20,
    // marginBottom: 20,
    backgroundColor: colors.bg_home,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
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
    fontWeight: "600",
    marginBottom: 6,
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
    // width: "48%",
    // height: 140,
    borderRadius: 8,
    padding: 16,
    justifyContent: "space-evenly",
    elevation: 2,
  },

  metricTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.black,
    textTransform: "capitalize",
  },

  metricBottom: {
    // alignItems: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    // gap: 4,
    flexWrap: "wrap",
  },

  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
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
    // marginTop: 15,
    borderColor: "#d3d0d0",
    borderWidth: 1,
    flexWrap: "wrap",
    gap: 6,
  },

  uacrValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "black",
  },

  uacrUnit: {
    fontSize: 14,
    marginTop: 4,
    color: "#555",
  },

  done: {
    // backgroundColor: "red",
    paddingVertical: 10,
    position: "fixed",
    bottom: 0,
    // marginHorizontal:25,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
    // width: 150,
    paddingHorizontal: 25,
    margin: "auto",
    color: "white",
  },
  retake: {
    backgroundColor: "red",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
    marginLeft: 0,
    width: 120,
    margin: "auto",
    color: "white",
  },

  retakeText: {
    color: "white",
    fontSize: 14,
  },
  referenceRange: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
  },
  warningCard: {
    backgroundColor: "#FDF1EB",
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#D89A52",
  },

  warningHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  warningIcon: {
    fontSize: 28,
    color: "#D89A52",
    marginRight: 12,
    marginTop: -2,
  },

  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E2E2E",
    lineHeight: 24,
    marginBottom: 10,
  },

  warningReason: {
    fontSize: 14,
    color: "#C58A4A",
    lineHeight: 22,
    marginBottom: 4,
  },
});
