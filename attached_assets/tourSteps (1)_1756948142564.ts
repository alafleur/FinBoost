
import { Step } from "react-joyride";

export const tourSteps: Step[] = [
  {
    target: "#nav-dashboard",
    content: "This is your Dashboard — see your progress, tickets, and current cycle.",
    disableBeacon: true,
  },
  {
    target: "#nav-learn",
    content: "Head to Learn to complete lessons and earn tickets.",
  },
  {
    target: "#tickets-badge, [data-el='tickets-badge']",
    content: "Your Tickets — the more you earn, the higher your chances in weekly drawings.",
  },
  {
    target: "#rewards-card, [data-el='rewards-card']",
    content: "Rewards board shows winners, pool details, and payout history.",
  },
  {
    target: "#cta-start-lesson, [data-el='cta-start-lesson']",
    content: "Start here — your first lesson is just a click away.",
  },
];
