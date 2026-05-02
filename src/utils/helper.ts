import * as FileSystem from "expo-file-system";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import { images } from "@/assets";
import dayjs from "dayjs";

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
  const logoBase64 = await getBase64Image(images.loginType.logo);
  const iconBase64 = await getBase64Image(images.todayTests);

  const html1 = `
  <html>
    <head>
      <style>
        body {
          font-family: poppings, sans-serif;
          background-color: #F5F7FB;
          padding: 10px;
        }

        .card {
          background: #fff;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          margin-bottom: 15px;
          overflow: hidden;
        }

        .logoHeader {
          background-color: #2C3E50;
          color: #fff;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logoText {
          font-size: 22px;
          font-weight: bold;
        }

        .logoKidney {
          color: #E74C3C;
        }

        .section {
          padding: 15px;
        }

        .detailRow {
          display: flex;
          margin-bottom: 8px;
        }

        .detailLabel {
          width: 150px;
          font-weight: bold;
        }

        .title {
          background-color: #E8F0FE;
          padding: 8px;
          font-size: 18px;
          font-weight: bold;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }

        .label {
          font-weight: bold;
        }

        .highlight {
          color: #2E7BE0;
          font-weight: bold;
        }

        .image {
          margin-top: 15px;
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }

      </style>
    </head>

    <body>

      <div class="card">
        <!-- Header -->
        <div class="logoHeader">
          <div>
          <img src="${logoBase64}" style="width: 20px; height: 30px; margin-right: 10px;" />
            <span class="logoText">hello</span>
            <span class="logoText logoKidney">kidney</span>
          </div>
        
          <img src="${iconBase64}" style="width: 35px; height: 35px;" />
        </div>

        <!-- Patient Details -->
        <div class="section">
          ${detailRow("Name", report?.patientName)}
          ${detailRow("Age", report?.age ? report.age + " years" : "N/A")}
          ${detailRow("Gender", report?.gender)}
          ${detailRow("Patient ID", report?.patientId?.toString().padStart(4, "0"))}
          ${detailRow("Test ID", report?.testId)}
          ${detailRow(
            "Report Date & Time",
            report?.date ? formatDateTime(report.date) : "N/A",
          )}
          ${report?.testedBy ? detailRow("Test done by", report.testedBy) : ""}
        </div>

        <!-- Report Section -->
        <div class="section">
          <div class="title">Urine ACR test results</div>

          ${valueRow("MicroAlbumin", report.albumin)}
          ${valueRow("Creatinine", report.creatinine)}
          <div style="border-top: 1px solid #E0E0E0; margin: 5px 0;"></div>
          ${valueRow("UACR", report.uacr)}
          ${valueRow("Reference", report.reference)}

          ${report.image ? `<img src="${report.image}" class="image" />` : ""}
        </div>

      </div>

    </body>
  </html>
  `;

  const html = `
<html>
<head>
  <style>
    @page {
      size: A4;
      margin: 40px;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #000;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .section-title {
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 5px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .table th,
    .table td {
      border: 1px solid #000;
      padding: 6px;
      text-align: left;
    }

    .table th {
      font-weight: bold;
    }

    .group-title {
      font-weight: bold;
      margin-top: 10px;
    }

    .note {
      margin-top: 10px;
      line-height: 1.5;
    }

    .footer {
      margin-top: 30px;
      text-align: center;
    }

    .signature {
      margin-top: 40px;
      text-align: right;
    }
  </style>
</head>

<body>

  <!-- Header -->
  <div class="header-row">
    <div><b>Patient Name :</b> ${report?.patientName || "N/A"}</div>
    <div><b>Registration Date :</b> ${formatDateTime(report?.date)}</div>
  </div>

  <div class="header-row">
    <div><b>Age/Sex :</b> ${report?.age || "N/A"} Y / ${report?.gender || "N/A"}</div>
    <div><b>UHID No :</b> ${report?.patientId || "N/A"}</div>
  </div>

  <div class="header-row">
    <div><b>Department :</b> NEPHROLOGY</div>
    <div><b>Visit No :</b> ${report?.testId || "N/A"}</div>
  </div>

  <div class="header-row">
    <div><b>Doctor :</b> ${report?.testedBy || "N/A"}</div>
    <div><b>Report Date :</b> ${formatDateTime(report?.date)}</div>
  </div>

  <!-- Section -->
  <div class="section-title">Biochemistry</div>

  <!-- Table -->
  <table class="table">
    <thead>
      <tr>
        <th>Test Description</th>
        <th>Result</th>
        <th>Units</th>
        <th>Reference Range</th>
      </tr>
    </thead>
    <tbody>

      <tr>
        <td colspan="4" class="group-title">
          URINE ALBUMIN/CREATININE/RATIO
        </td>
      </tr>

      <tr>
        <td>URINE ALBUMIN</td>
        <td>${report.albumin || "N/A"}</td>
        <td>mg/L</td>
        <td>&lt; 20 mg/L</td>
      </tr>

      <tr>
        <td>URINE CREATININE</td>
        <td>${report.creatinine || "N/A"}</td>
        <td>mg/dl</td>
        <td>10 - 300 mg/dl</td>
      </tr>

      <tr>
        <td><b>URINE ALBUMIN/CREATININE RATIO</b></td>
        <td><b>${report.uacr || "N/A"}</b></td>
        <td>mg/g</td>
        <td>Normal &lt; 30 mg/g</td>
      </tr>

    </tbody>
  </table>

  <!-- Interpretation -->
  <div class="note">
    <b>Slightly Abnormal :</b> 30 - 300 mg/g <br/>
    <b>Abnormal :</b> &gt; 300 mg/g
  </div>

  <!-- Footer -->
  <div class="footer">
    *** End of Report ***
  </div>

  <div class="signature">
    Lab Incharge
  </div>

</body>
</html>
`;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
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