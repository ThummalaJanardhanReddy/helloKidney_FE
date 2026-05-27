// import * as FileSystem from "expo-file-system";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
// import { images } from "@/assets";
import dayjs from "dayjs";
import { images } from "@/assets";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

export const getBase64Image = async (imageModule: any) => {
  const asset = Asset.fromModule(imageModule);
  await asset.downloadAsync();

  if (!asset.localUri) return "";

  const response = await fetch(asset.localUri);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const detailRow = (label: string, value?: string) => `
  <div class="detailRow">
    <div class="detailLabel">${label}:</div>
    <div>${value || "N/A"}</div>
  </div>
`;

const valueRow = (label: string, value?: string, highlight = false) => `
  <div class="row">
    <div class="label">${label}</div>
    <div class="${highlight ? "highlight" : ""}">
      ${value || "N/A"}
    </div>
  </div>
`;
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

export const generatePDF = async (report: any) => {
  const logoBase64 = await getBase64Image(images.loginType.report_logo);
  const iconBase64 = await getBase64Image(images.todayTests);

  const html = `
<html>

<head>
    <style>
        // @page {
        //   size: A4;
        // }
         html {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: #ffffff;
    }

        body {
            font-family: poppins, arial, sans-serif;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
        print-color-adjust: exact;

        }

        /* ---------- APP HEADER ---------- */

        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #0E1833 !important;
            padding: 30px 20px;
            margin-bottom: 24px;
        }

        .brand-section {
            display: flex;
            align-items: flex-start;
        }

        .brand-logo {
            height: 32px;
            margin-right: 10px;
        }

        .brand-name {
            display: flex;
            align-items: center;
        }

        .brand-text {
            font-size: 24px;
            font-weight: 700;
            color: #FFFFFF;
        }

        .brand-kidney {
            font-size: 24px;
            font-weight: 700;
            color: #E74C3C;
        }

        .report-icon {
            width: 40px;
            height: 40px;
        }

        /* ---------- PATIENT HEADER ---------- */

        .header-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .header-item {
            width: 48%;
            line-height: 1.5;
        }

        .body-section {
            padding: 0px 20px;
        }

        /* ---------- SECTION ---------- */

        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #2C3E50;
            padding-bottom: 5px;
            padding-top: 15px;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        /* ---------- TABLE ---------- */

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
        }

        .table th {
            background-color: #F4F6F8;
            font-weight: bold;
            text-align: left;
            border: 1px solid #DADADA;
            padding: 10px 8px;
        }

        .table td {
            border: 1px solid #DADADA;
            padding: 9px 8px;
            vertical-align: middle;
        }

        .group-title {
            background-color: #F9FAFB;
            font-weight: bold;
            color: #2C3E50;
            padding: 10px !important;
        }

        .highlight-result {
            font-weight: normal;
            color: #000;
        }

        /* ---------- NOTES ---------- */

        .note {
            margin-top: 16px;
            line-height: 1.8;
            font-size: 12px;
        }

        .reference-text {
            color: #808080;
        }

        /* ---------- FOOTER ---------- */

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #666;
        }

        .signature {
            margin-top: 50px;
            text-align: right;
            font-weight: bold;
        }
    </style>
</head>

<body>

    <!-- APP HEADER -->
    <div class="top-header">
        <div class="brand-section">
            <img src="${logoBase64}" class="brand-logo" />

        </div>

        <img src="${iconBase64}" class="report-icon" />
    </div>

    <!-- PATIENT DETAILS -->
    <div class="body-section" style="position: relative">
        <div class="header-row">
            <div class="header-item">
                <b>Name: </b> ${report?.patientName || "N/A"}
            </div>

            <div class="header-item" style="text-align:right;">
                <b>Test ID: </b> ${report?.testId || "N/A"}
            </div>
        </div>

        <div class="header-row">
            <div class="header-item">
                <b>Age: </b> ${report?.age || "N/A"} Years
            </div>

            <div class="header-item" style="text-align:right;">
                <b>Report Date and Time: </b> ${report?.date ? report.date : "N/A"}
            </div>
        </div>

        <div class="header-row">
            <div class="header-item">
                <b>Gender: </b> ${report?.gender || "N/A"}
            </div>
            <div class="header-item" style="text-align:right;">
                <b>Test done by: </b> ${report?.testedBy || "N/A"}
            </div>
        </div>

        <!-- SECTION TITLE -->

        <div class="section-title">
            Urine Test Result
        </div>

        <!-- TABLE -->

        <table class="table">
            <thead>
                <tr>
                    <th>Investigation</th>
                    <th>Observed Values</th>
                    <th>Units</th>
                    <th>Reference Range</th>
                </tr>
            </thead>

            <tbody>

                <tr>
                    <td colspan="4" class="group-title">
                        URINE ALBUMIN / CREATININE RATIO
                    </td>
                </tr>

                <tr>
                    <td>
                        uACR
                    </td>

                    <td class="highlight-result">
                        ${report?.uacr || "N/A"}
                    </td>

                    <td>mg/g</td>

                    <td class="reference-text">
                        Normal : A1 (&lt; 30 mg/g)
                        <br />
                        Slightly Abnormal : A2 (30 - 300 mg/g)
                        <br />

                        Abnormal : A3 (&gt; 300 mg/g)
                    </td>
                </tr>
                <tr>
                    <td>Microalbumin</td>
                    <td>${report?.albumin || "N/A"}</td>
                    <td>mg/L</td>
                    <td class="reference-text">&lt; 20 mg/L</td>
                </tr>

                <tr>
                    <td>Creatinine</td>
                    <td>${report?.creatinine || "N/A"}</td>
                    <td>mg/dL</td>
                    <td class="reference-text">10 - 300 mg/dL</td>
                </tr>

            </tbody>
        </table>

        <!-- FOOTER -->

        <div class="footer">
            *** End of Report ***
        </div>

        <div style="margin-top: auto">
            <h3 style="margin-bottom: 10px;">Note</h3>

            <ul style="padding-left: 20px;">
                <li>
                    The urine routine is a screening test.
                </li>

                <li>
                    Pre-test conditions to be observed while testing:
                    first void, mid-stream urine, collected in a clean, dry, sterile container
                    is recommended for routine urine analysis to avoid contamination with any
                    discharge from the vagina and urethra.
                </li>

                <li>
                    During interpretation, points to be considered:
                    Negative nitrite test does not exclude the presence of bacteria or urinary
                    tract infections.
                </li>

                <li>
                    Trace proteinuria can be seen with many physiological conditions like
                    prolonged recumbency, exercise, high protein diet, etc.
                </li>

                <li>
                    False reactions for bile pigments, proteins, glucose, and nitrites can be
                    caused by peroxidase-like activity by disinfectants, therapeutic dyes,
                    ascorbic acid, and certain drugs, etc.
                </li>

                <li>
                    Physiological variations may affect the test results.
                </li>

                <li>
                    When trace results occur, it is recommended to retest using a fresh
                    specimen from the same patient.
                </li>

                <li>
                    Ketones may occur in urine during fasting, pregnancy, and frequent
                    strenuous exercise.
                </li>

                <li>
                    Blood is often, but not invariably, found in the urine of menstruating
                    females.
                </li>
            </ul>
        </div>

        <!-- <div style="border: 5px solid #0E1833; "></div> -->
    </div>
</body>

</html>
`;

  const { uri } = await Print.printToFileAsync({ html });
  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(uri);
  } else {
    throw new Error("Sharing is not available on this platform");
  }
  // await Sharing.shareAsync(uri);
};

export const formatDate = (date: string): string => {
  try {
    const fixed = date.includes(".")
      ? date.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}).*$/, "$1")
      : date;

    const normalized = fixed.endsWith("Z") ? fixed : `${fixed}Z`;
    return dayjs(normalized).format("DD MMM YYYY: hh:mm A");
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

export const clearAppCache = async () => {
  try {
    // AsyncStorage
    await AsyncStorage.clear();

    // FileSystem cache
    if (FileSystem.cacheDirectory) {
      await FileSystem.deleteAsync(
        FileSystem.cacheDirectory,
        { idempotent: true }
      );
    }

    // SecureStore keys
    const keys = [
      "token",
      "user",
      "session",
    ];

    for (const key of keys) {
      await SecureStore.deleteItemAsync(key);
    }

    console.log("Cache cleared");
  } catch (error) {
    console.log("Cache clear error", error);
  }
};

const VERSION_KEY = "APP_VERSION";
export const checkVersionAndClearCache =
  async () => {
    const currentVersion =
      Constants.expoConfig?.version;

    const savedVersion =
      await AsyncStorage.getItem(VERSION_KEY);

    if (savedVersion !== currentVersion) {
      await clearAppCache();

      await AsyncStorage.setItem(
        VERSION_KEY,
        currentVersion || ""
      );
    }
  };

  export const checkForUpdates = async () => {
  try {
     if (__DEV__) return;
    const update =
      await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      Alert.alert(
        "Update Available",
        "A new update is ready.",
        [
          {
            text: "Update",
            onPress: async () => {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            },
          },
        ]
      );
    }
  } catch (e) {
    console.log(e);
  }
};