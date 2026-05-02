import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const generatePDF = async () => {
  const html = `
    <h1>UACR Report</h1>
    <p>Patient: ${'test'}</p>
    <p>UACR: ${'report.uacr'}</p>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};