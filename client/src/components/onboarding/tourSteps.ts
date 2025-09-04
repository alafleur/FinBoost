import { Step } from "react-joyride";

export const tourSteps: Step[] = [
  {
    target: "#nav-overview",
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

// Keep existing exports for compatibility
import type { TourStep } from './types';

export const dashboardTourSteps: TourStep[] = [
  {
    target: '#nav-overview',
    title: 'Welcome to Your Dashboard! 👋',
    content: 'This is your command center. Here you can see your progress, stats, and current tier status. Think of it as your financial growth scoreboard.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#nav-learn',
    title: 'Learn & Earn Points 📚',
    content: 'Complete bite-sized lessons on budgeting, credit, investing, and more. Each lesson earns you points toward monthly cash prizes.',
    placement: 'bottom',
  },
  {
    target: '#nav-actions',
    title: 'Take Real Action 💪',
    content: 'Upload proof of real financial actions like paying off debt or opening a savings account. These earn the most points!',
    placement: 'bottom',
  },
  {
    target: '#nav-rewards',
    title: 'Track Your Winnings 🏆',
    content: 'See your reward history and upcoming prize pools. Premium members compete for real cash rewards every month.',
    placement: 'bottom',
  },
  {
    target: '#nav-leaderboard',
    title: 'See How You Rank 📊',
    content: 'Check your position against other members. Higher tiers have better odds of winning monthly prizes.',
    placement: 'bottom',
  },
  {
    target: '#nav-predictions',
    title: 'Bonus Predictions 🎯',
    content: 'Answer prediction questions about markets and trends to earn extra points beyond lessons and actions.',
    placement: 'bottom',
  },
  {
    target: '#nav-referrals',
    title: 'Earn Together 🤝',
    content: 'Invite friends and family. You both earn bonus points when they join and start learning.',
    placement: 'bottom',
  },
];

// Desktop tour steps (uses desktop nav IDs)
export const desktopTourSteps: TourStep[] = dashboardTourSteps.map(step => ({
  ...step,
  target: step.target + '-desktop'
}));