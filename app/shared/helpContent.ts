export type HelpAudience = "healthworker" | "patient" | "both";

export interface HelpVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  youtubeId: string;
  audience: HelpAudience;
}

// YouTube's thumbnail CDN serves a frame grab for any public video id —
// no API key required.
export const getYoutubeThumbnail = (youtubeId: string) =>
  `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

export interface HelpTopic {
  id: string;
  question: string;
  answer: string;
  audience: HelpAudience;
}

export const helpVideos: HelpVideo[] = [
  {
    id: "intro",
    title: "Hellokidney.ai - New Age Kidney Care Model",
    description:
      "Open the patient's profile and start a new UACR test. Place the dipped test strip inside the guide frame shown on screen and capture the photo. The app reads the strip automatically and saves the result to the patient's record.",
    videoUrl: "https://www.youtube.com/watch?v=4LZpgzJqzjo",
    youtubeId: "4LZpgzJqzjo",
    audience: "healthworker",
  },
  {
    id: "patient-self-test",
    title: "How to take your kidney test at home",
    description:
      "Tap 'Start Test' on your home screen, then follow the on-screen steps to collect your sample and capture the photo when prompted. The app guides you through each step and lets you know as soon as your result is ready.",
    videoUrl: "https://www.youtube.com/watch?v=4LZpgzJqzjo",
    youtubeId: "4LZpgzJqzjo",
    audience: "patient",
  },
];

export const helpTopics: HelpTopic[] = [
  {
    id: "egfr-meter",
    question: "What is the eGFR creatinine meter and how accurate is it?",
    answer:
      "It's a handheld, battery-operated, CE/IVDR-certified enzymatic creatinine analyser. From a single fingerstick, it delivers whole-blood creatinine and eGFR results in under 30 seconds. Results sync automatically to the HelloKidney app via Bluetooth. It is KDIGO 2024 endorsed, listed on the WHO Essential Diagnostics List, and validated across India, Sub-Saharan Africa, and Europe.",
    audience: "healthworker",
  },
  {
    id: "uacr-test",
    question: "How does the urine ACR test work with a smartphone?",
    answer:
      "Dip the UACR test card in the patient's urine sample, place it on the control pad, and start the in-app timer. Once the timer ends, capture a photo of the card using your phone's camera. The app reads the colour strip automatically and calculates the Albumin-Creatinine Ratio, saving the result directly to the patient's record.",
    audience: "healthworker",
  },
  {
    id: "who-is-it-for",
    question: "Who is HelloKidney designed for?",
    answer:
      "HelloKidney is built for community health workers, clinics, and primary care providers screening patients for chronic kidney disease. It's especially suited for low-resource and remote settings where lab access is limited, enabling fast, point-of-care eGFR and UACR testing without sending samples to an external lab.",
    audience: "healthworker",
  },
  {
    id: "what-is-hellokidney",
    question: "What is HelloKidney.ai?",
    answer:
      "HelloKidney.ai is a point-of-care kidney screening platform that combines a handheld creatinine/eGFR meter with a smartphone-based UACR test reader. Together they let health workers and patients screen, track, and manage chronic kidney disease quickly and accurately, right at the point of care.",
    audience: "healthworker",
  },
   {
    id: "UACR-test-kit",
    question: "Where can I buy the UACR test kit?",
    answer:
      "UACR test kits are available directly from our website, through partner pharmacies, and at participating healthcare facilities. Contact us to find the nearest distributor in your area.",
    audience: "patient",
  },
  {
    id: "patient-how-to-test",
    question: "Who should take the Urine ACR test?",
    answer:
      "The test is recommended for anyone at risk of Chronic Kidney Disease (CKD) — including people with diabetes, hypertension, a family history of kidney disease, or those over 60. Regular screening helps detect kidney problems early, when treatment is most effective.",
    audience: "patient",
  },
  {
    id: "patient-is-it-painful",
    question: "Is the Nephkare app really free?",
    answer:
      "Yes. The Nephkare app is free to download and use. You only pay for the UACR test kit, available from our website or partner pharmacies.",
    audience: "patient",
  },
  {
    id: "patient-results-time",
    question: "How accurate is the test?",
    answer:
      "The HelloKidney UACR test offers 99% specificity and 96% sensitivity — comparable to traditional lab-based testing. Results are clinically validated for accurate CKD risk assessment.",
    audience: "patient",
  },
  {
    id: "patient-understand-results",
    question: "How often should I test?",
    answer:
      "For high-risk individuals (diabetes, hypertension), testing every 3–6 months is recommended. For general screening, annual testing is typically sufficient. Always follow your physician's specific recommendation.",
    audience: "patient",
  },
 
   {
    id: "UACR-test-matter",
    question: "What is Urine ACR — and why does it matter?",
    answer:
      "Urine Albumin-to-Creatinine Ratio (UACR) measures the amount of albumin in your urine relative to creatinine. Elevated levels indicate possible kidney damage — one of the earliest signs of CKD, often appearing before any symptoms do.",
    audience: "patient",
  },
];

// Displayed to the user — the mailto: link actually routes to
// HELP_SUPPORT_MAILTO below.
export const HELP_SUPPORT_EMAIL = "support@hellokidney.ai";
export const HELP_SUPPORT_MAILTO = "info@4p.health";
