import { images } from "@/assets";

export const steps = [
  { 
    id: 1,
    topText: "Collect your urine sample in\n the provided container",
    bottomText:
      "Collect urine in the container from the\n Midpoint of urination until it reaches the top",
    image: images.userGuide?.step1,
    buttonText: "Urine Collected",
  },
  {
    id: 2,
    topText:
      "Dip the test card in the urine sample\n for 2 seconds, then remove",
    bottomText:
      "tap or shake the card gently\n in order to remove excess droplets",
    image: images.userGuide?.step2,
    buttonText: "Card dipped and shaken",
  },
  {
    id: 3,
    topText: "Now, place the test card on the control\n pad & start the timer",
    bottomText: "Align the test card on the\n control pad centre",
    image: images.userGuide?.step3,
    buttonText: "Start the timer",
  },
  {
    id: 4,
    topText: "Take the clear photo and upload it",
    bottomText:
      "If an invalid image error appears after upload,\ntake another photo and try uploading again",
    image: images.userGuide?.step4,
    buttonText: "Click the photo and upload",
  },
  {
    id: 5,
    topText: "Results will appear after a few seconds",
    bottomText: "View the Results",
    image: images.userGuide?.step5,
    buttonText: "Test completed",
  },
];
