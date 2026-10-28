import { images } from "@/assets";
import { STEP1_SVG, STEP2_SVG } from "./userGuideSvgs";

export const steps = [
  {
    id: 1,
    topText: "Collect your urine sample in\n the provided container",
    bottomText:
      "Collect urine in the container from the\n Midpoint of urination until it reaches the top",
    svg: STEP1_SVG,
    buttonText: "Urine Collected",
  },
  {
    id: 2,
    topText: "",
    bottomText: "Open the pouch seal and take out\n the UACR test Card",
    image: images.userGuide?.step1,
    buttonText: "Card taken out",
  },
  {
    id: 3,
    topText:
      "Dip the test card in the urine sample\n for 2 seconds, then remove",
    bottomText:
      "tap or shake the card gently\n in order to remove excess droplets",
    svg: STEP2_SVG,
    buttonText: "Card dipped and shaken",
  },
  {
    id: 4,
    topText: "Now, place the test card on the control\n pad & start the timer",
    bottomText: "Align the test card on the\n control pad centre",
    image: images.userGuide?.step3,
    buttonText: "Start the timer",
  },
  {
    id: 5,
    topText: "Take the clear photo and upload it",
    bottomText:
      "If an invalid image error appears after upload,\ntake another photo and try uploading again",
    image: images.userGuide?.step4,
    buttonText: "Click the photo and upload",
  },
  {
    id: 6,
    topText: "Results will appear after a few seconds",
    bottomText: "View the Results",
    image: images.userGuide?.step5,
    buttonText: "Test completed",
  },
];
