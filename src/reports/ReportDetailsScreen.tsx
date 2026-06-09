import { useUserStore } from "@/app/stores/userStore";
import { images } from "@/assets";
import React, { useState } from "react";
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
import PrimaryButton from "@/app/shared/PrimaryButton";
import Toast from "@/app/shared/Toast";

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
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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
    try {
      await generatePDF(report);
    } catch (error) {
      setToast({ message: "Failed to generate PDF", type: "error" });
      console.log("Error generating PDF:", error);
    }
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
          <DetailRow
            label="Age"
            value={`${report?.age ? report.age + " years" : "N/A"}`}
          />
          <DetailRow label="Gender" value={report?.gender} />
          <DetailRow
            label="Patient ID"
            value={String(report?.patientId)?.padStart(4, "0")}
          />
          <DetailRow label="Test ID" value={report?.testId} />
          <DetailRow
            label="Report Date & Time"
            value={report?.date ? report.date : "N/A"}
          />
          {report?.testedBy && (
            <DetailRow label="Test done by" value={report.testedBy} />
          )}
        </View>
      </View>
    </View>
  );

  const NoteItem = ({ text }: { text: string }) => (
    <View style={styles.noteRow}>
      <Text style={styles.bullet}>{`\u2022`}</Text>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.card, { padding: 0, margin: 5 }]}>
        <View style={styles.content}>
          {/* TITLE */}
          <Text style={styles.sectionTitle}>Urine Test Result</Text>

          {/* TABLE */}
          <View style={styles.table}>
            {/* TABLE HEADER */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.headerCell, { flex: 2 }]}>
                Investigation
              </Text>
              <Text style={styles.headerCell}>Observed Values</Text>
              <Text style={styles.headerCell}>Units</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>
                Reference Range
              </Text>
            </View>

            {/* GROUP TITLE */}
            <View style={styles.groupTitleRow}>
              <Text style={styles.groupTitleText}>
                URINE ALBUMIN / CREATININE RATIO
              </Text>
            </View>

            {/* UACR */}
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>uACR</Text>

              <Text style={styles.cell}>{report?.uacr || "N/A"}</Text>

              <Text style={styles.cell}>mg/g</Text>

              <View style={[styles.cell, { flex: 2 }]}>
                <Text style={styles.referenceText}>
                  Normal : A1 (&lt; 30 mg/g)
                </Text>

                <Text style={styles.referenceText}>
                  Slightly Abnormal : A2 (30 - 300 mg/g)
                </Text>

                <Text style={styles.referenceText}>
                  Abnormal : A3 (&gt; 300 mg/g)
                </Text>
              </View>
            </View>

            {/* MICROALBUMIN */}
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>Microalbumin</Text>

              <Text style={styles.cell}>{report?.albumin || "N/A"}</Text>

              <Text style={styles.cell}>mg/L</Text>

              <Text style={[styles.cell, { flex: 2 }]}>&lt; 20 mg/L</Text>
            </View>

            {/* CREATININE */}
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>Creatinine</Text>

              <Text style={styles.cell}>{report?.creatinine || "N/A"}</Text>

              <Text style={styles.cell}>mg/dL</Text>

              <Text style={[styles.cell, { flex: 2 }]}>10 - 300 mg/dL</Text>
            </View>
          </View>

          {/* NOTES */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>Note</Text>

            <NoteItem text="The urine routine is a screening test." />

            <NoteItem text="Pre-test conditions to be observed while testing: first void, mid-stream urine, collected in a clean, dry, sterile container is recommended for routine urine analysis to avoid contamination with any discharge from the vagina and urethra." />

            <NoteItem text="Negative nitrite test does not exclude the presence of bacteria or urinary tract infections." />

            <NoteItem text="Trace proteinuria can be seen with many physiological conditions like prolonged recumbency, exercise, high protein diet, etc." />

            {/* <NoteItem text="False reactions for bile pigments, proteins, glucose, and nitrites can be caused by disinfectants, therapeutic dyes, ascorbic acid, and certain drugs." /> */}

            <NoteItem text="Physiological variations may affect the test results." />

            {/* <NoteItem text="When trace results occur, it is recommended to retest using a fresh specimen from the same patient." /> */}

            {/* <NoteItem text="Ketones may occur in urine during fasting, pregnancy, and strenuous exercise." /> */}

            {/* <NoteItem text="Blood is often, but not invariably, found in the urine of menstruating females." /> */}
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>*** End of Report ***</Text>
          </View>
        </View>
        <PrimaryButton
          title="Share Report"
          onPress={handlegeneratePDF}
          style={[styles.shareBtn, { width: "100%" }]}
        />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
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
    borderWidth: 0,
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
  // sectionTitle: {
  //   fontSize: 16,
  //   fontWeight: "700",
  //   color: "#333",
  // },

  // Patient Details
  patientDetailsGrid: {
    gap: 10,
  },
  // detailRow: {
  //   flexDirection: "row",
  //   alignItems: "flex-start",
  // },
  // detailLabel: {
  //   fontSize: 15,
  //   fontWeight: "700",
  //   color: "#333",
  //   width: 150,
  // },
  // detailValue: {
  //   fontSize: 15,
  //   color: "#333",
  //   flex: 1,
  // },
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

  topHeader: {
    backgroundColor: "#0E1833",
    paddingVertical: 28,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  brandText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },

  brandKidney: {
    color: "#E74C3C",
  },

  reportTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  content: {
    padding: 16,
  },

  patientSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },

  patientGrid: {
    gap: 10,
  },

  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  detailLabel: {
    fontWeight: "700",
    color: "#222",
    marginRight: 5,
  },

  detailValue: {
    color: "#444",
    flexShrink: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#2C3E50",
    marginBottom: 18,
  },

  table: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  tableHeader: {
    backgroundColor: "#F4F6F8",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DADADA",
  },

  headerCell: {
    flex: 1,
    padding: 10,
    fontWeight: "700",
    fontSize: 12,
    color: "#222",
  },

  cell: {
    flex: 1,
    padding: 10,
    fontSize: 12,
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: "#DADADA",
  },

  groupTitleRow: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DADADA",
  },

  groupTitleText: {
    fontWeight: "700",
    color: "#2C3E50",
    fontSize: 13,
  },

  referenceText: {
    color: "#666",
    fontSize: 11,
    marginBottom: 4,
  },

  noteContainer: {
    marginTop: 28,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },

  noteTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#2C3E50",
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  bullet: {
    fontSize: 14,
    marginRight: 8,
    lineHeight: 20,
  },

  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: "#444",
  },

  footer: {
    marginTop: 30,
    marginBottom: 40,
    alignItems: "center",
  },

  footerText: {
    fontSize: 11,
    color: "#666",
  },
});
