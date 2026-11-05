import { images } from "@/assets";
import { STEP1_SVG, STEP2_SVG } from "./userGuideSvgs";

export const steps = [
  {
    id: 1,
    topText: "Collect your urine sample in\n the provided container",
    bottomText:
      "Collect your urine sample in\n the container",
    svg: STEP1_SVG,
    image: images.userGuide?.urineContainer,
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
      "Dip the Test card in the urine sample \n for 2 sec and remove it",
    svg: STEP2_SVG,
    buttonText: "Card dipped and shaken",
  },
  {
    id: 4,
    topText: "Now, place the test card on the control\n pad & start the timer",
    bottomText: "Now, place the test card on the\ncontrol pad & Start the timer",
    image: images.userGuide?.step3,
    buttonText: "Start the timer",
  },
  {
    id: 5,
    topText: "Take the clear photo and upload it",
    bottomText:
      "Take the Clear Photo\n and upload it",
    image: images.userGuide?.step4,
    buttonText: "Click the photo and upload",
  },
  {
    id: 6,
    topText: "Results will appear after a few seconds",
    bottomText: "Results will appear \n after a few seconds",
    image: images.userGuide?.step5,
    buttonText: "Test completed",
  },
];
