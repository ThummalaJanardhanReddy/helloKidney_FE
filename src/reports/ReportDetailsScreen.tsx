import { useUserStore } from "@/app/stores/userStore";
import { images } from "@/assets";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Share,
  Platform,
} from "react-native";
import { generatePDF } from "../utils/helper";

// Format date and time
const formatDateTime = (timestamp: string | number) => {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "N/A";
  }
};

export default function ReportDetails({ report }: { report: any }) {
  //   const { report } = route.params;
  const user = useUserStore((s) => s.user);

  const shareReport = async () => {
    try {
      await Share.share({
        message: `
UACR Report

Patient ID: ${report.patientId}
Test ID: ${report.testId}

Albumin: ${report.albumin}
Creatinine: ${report.creatinine}
UACR: ${report.uacr}

Stage: ${report.stage}
Reference: ${report.reference}
Confidence: ${report.confidence}%
        `,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handlegeneratePDF = async () => {
    generatePDF(report);
  };

  // Reusable Components
  const DetailRow = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || "N/A"}</Text>
    </View>
  );

  const headerSection = (
    <View style={styles.reportContainer}>
      {/* Patient Details Section */}
      <View style={styles.section}>
        <View style={styles.patientDetailsGrid}>
          <DetailRow label="Name" value={report?.patientName} />
          <DetailRow label="Age" value={`${report?.age || "N/A"} years`} />
          <DetailRow label="Gender" value={report?.gender} />
          <DetailRow label="Patient ID" value={String(report?.patientId)?.padStart(4, "0")} />
          <DetailRow label="Test ID" value={report?.testId} />
          <DetailRow
            label="Report Date & Time"
            value={report?.date ? report.date  : "N/A"}
          />
          {report?.testedBy && (
            <DetailRow label="Test done by" value={report.testedBy} />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.card, { padding: 0, margin: 5 }]}>
        {/* Logo Header */}
        <View style={styles.logoHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={images.loginType.logo}
              style={{ width: 20, height: 30, marginRight: 10 }}
            />
            <Text style={styles.logoText}>hello</Text>
            <Text style={[styles.logoText, styles.logoKidney]}>kidney</Text>
          </View>
          {/* <View style={styles.logoIcon}> */}
          {/* <View style={styles.kidneyIcon} /> */}
          <Image source={images.todayTests} style={{ width: 35, height: 35 }} />
          {/* </View> */}
        </View>

        <View style={[styles.card, { margin: 10 }]}>
          {/* Header */}
          {headerSection}
          {/* Report Details */}
          <View style={{ backgroundColor: "#fff", borderRadius: 8 }}>
            <Text
              style={[
                styles.title,
                { paddingHorizontal: 5, paddingVertical: 5 },
              ]}
            >
              Urine ACR test results
            </Text>
            {/* Divider */}
            {/* <View style={styles.divider} /> */}

            {/* Values */}
            <View style={styles.row}>
              <Text style={styles.label}>MicroAlbumin</Text>
              <Text style={styles.value}>{report.albumin}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Creatinine</Text>
              <Text style={styles.value}>{report.creatinine}</Text>
            </View>
            <View style={[styles.divider, {marginVertical: 5}]} />
            <View style={styles.row}>
              <Text style={styles.label}>UACR</Text>
              <Text style={styles.value}>{report.uacr}</Text>
            </View>

            {/* <View style={styles.row}>
              <Text style={styles.label}>Stage</Text>
              <Text style={[styles.value, styles.highlight]}>
                {report.stage}
              </Text>
            </View> */}

            <View style={styles.row}>
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.value}>{report.reference}</Text>
            </View>

            {/* <View style={styles.row}>
              <Text style={styles.label}>Confidence</Text>
              <Text style={styles.value}>{report.confidence}%</Text>
            </View> */}

            {/* Image */}
            {/* {report.image && (
              <Image source={{ uri: report.image }} style={styles.image} />
            )} */}
          </View>
          {/* Share Button */}
          <Text style={styles.shareBtn} onPress={handlegeneratePDF}>
            Share Report
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F7FB",
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 10,
    // elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    backgroundColor: "#E8F0FE",
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: "#555",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    // marginVertical: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  value: {
    color: "#111",
  },
  highlight: {
    color: "#2E7BE0",
    fontWeight: "700",
  },
  image: {
    height: 200,
    marginTop: 20,
    borderRadius: 8,
  },
  shareBtn: {
    marginTop: 20,
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#2E7BE0",
    padding: 12,
    borderRadius: 6,
    fontWeight: "600",
  },

  // Logo Header
  logoHeader: {
    backgroundColor: "#2C3E50",
    paddingVertical: 10,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  logoKidney: {
    color: "#E74C3C",
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
  },
  kidneyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  // Section
  section: {
    // paddingHorizontal: 24,
    // paddingVertical: 20,
    // borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionHeader: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: -24,
    marginTop: -20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  // Patient Details
  patientDetailsGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    width: 150,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  // Report Container (for screenshot)
  reportContainer: {
    backgroundColor: "#ffffff",
    // margin: 16,
    // marginVertical: 10,
    paddingBottom: 10,
    borderRadius: 8,
    // overflow: "hidden",
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 8,
    //   },
    //   android: {
    //     elevation: 4,
    //   },
    // }),
  },
});
