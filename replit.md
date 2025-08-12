# FinBoost - Financial Education and Rewards Platform

## Overview

FinBoost is a financial education platform that combines learning with rewards. Its core purpose is to empower users through financial literacy and incentivized action. Users earn points by completing educational modules, taking quizzes, and uploading proof of financial actions. Premium members compete for monthly cash rewards distributed from a collective pool funded by membership fees. The project aims for significant market potential by fostering real-world financial habit changes.

## User Preferences

Preferred communication style: Simple, everyday language.

**Development Standards:**
- NO SHORTCUTS EVER - Always implement complete, production-ready solutions
- Never use placeholders or temporary fixes in production code
- Use realistic test data when needed for testing, but never fake data in production features
- Always trace issues to root cause rather than applying surface-level patches
- Verify every fix with actual testing and data validation
- Document exact changes made for transparency and accountability
- Use systematic debugging approach - identify, isolate, fix, verify

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Wouter for routing, TailwindCSS with shadcn/ui for styling, Tanstack Query for server state management, React Hook Form for form validation, Framer Motion for animations.
- **UI/UX Decisions**: Emphasizes a clean, professional aesthetic using consistent white cards, subtle gray borders, and a cohesive typography hierarchy. Subtle color accents are used, avoiding bright, game-like schemes. The design prioritizes mobile-first responsiveness and a unified component architecture across all screen sizes. Recent enhancements include a unified blue→purple gradient theme for consistency and an interactive phone preview system on the landing page. The Leaderboard UI is redesigned to match the Overview tab's aesthetic.

### Backend
- **Technology Stack**: Express.js with TypeScript, PostgreSQL database with Drizzle ORM, JWT for authentication, bcrypt for password hashing, Multer for file upload handling.
- **Core Features**:
    - **Authentication System**: Email/password, Google OAuth, password reset, role-based access control.
    - **Points and Rewards System**: Configurable actions, proof-based awards, percentile-based tier system, monthly reward pool distribution, referral system. Supports cycle-based rewards and a minimum pool guarantee.
    - **Learning Management**: Rich content modules, interactive quizzes, progress tracking, free/premium content access.
    - **Payment Processing**: Subscription management and reward disbursements.
    - **Admin Portal**: Content management, user/analytics management, points configuration, flexible winner selection (point-weighted random, top performers, pure random, manual), configurable tier pools, individual payout adjustments, and Excel export/import for winner data.
    - **Prediction System**: Skill-based prediction questions with configurable points, deadline management, results determination, and nuanced scoring.
    - **Winner Celebration Notification System**: Backend infrastructure to track and manage winner notifications.
- **Data Storage Solutions**: PostgreSQL for all core application data; Local file system for user uploads; JWT tokens in localStorage for session management.

## External Dependencies

- **Stripe**: Subscription billing and payment processing.
- **PayPal**: Bulk payout disbursements for reward winners.
- **Google OAuth**: Social login integration.
- **Google Analytics**: User behavior tracking.
- **Google Tag Manager**: Event tracking and conversion monitoring.