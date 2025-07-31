# FinBoost - Financial Education and Rewards Platform

## Overview
FinBoost is a comprehensive financial education platform that combines learning with rewards. Users earn points by completing educational modules, taking quizzes, and uploading proof of financial actions. Premium members compete for monthly cash rewards distributed through a collective pool funded by membership fees. The platform aims to foster financial literacy and offer tangible incentives for financial growth.

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
- **React 18** with TypeScript
- **Vite** for build and development
- **Wouter** for client-side routing
- **TailwindCSS** with shadcn/ui for styling
- **Tanstack Query** for server state management
- **React Hook Form** for form validation
- **Framer Motion** for animations
- **UI/UX Decisions:** Modern, professional aesthetic with a clean and consistent design across mobile and desktop. Subtle color accents are used to enhance readability without being overwhelming, prioritizing a financial platform appearance over a game-like feel. Color schemes are unified, utilizing a professional palette (e.g., slate, indigo, teal for tiers; blue accents). Typography hierarchy is clear, and icons are designed for clarity rather than decoration.

### Backend
- **Express.js** with TypeScript for REST API
- **PostgreSQL** for data persistence
- **Drizzle ORM** for database operations and migrations
- **JWT** for authentication and authorization
- **bcrypt** for password hashing
- **Multer** for file upload handling

### Core Features and Design Patterns
- **Authentication System:** Email/password, Google OAuth, JWT-based, with password reset and role-based access control.
- **Points and Rewards System:** Configurable point actions, proof-based awards with admin approval, tier system based on point accumulation, monthly reward pool distribution, and referral bonuses. A flexible cycle-based system allows for configurable durations (weekly, bi-weekly, custom) with dynamic percentile-based tier calculations.
- **Learning Management:** Rich content modules, interactive quizzes, progress tracking, and content access control.
- **Payment Processing:** Stripe for subscriptions, PayPal for reward disbursements, multi-currency support.
- **Admin Portal:** Content, user, and point system management; winner selection and payout management; real-time statistics. Includes robust tools for cycle management, user enrollment, and Excel export/import for winner data.
- **Prediction System:** Skill-based prediction questions with configurable point awards, deadline management, and result determination. Features a comprehensive admin interface for question management and a user interface for submission and history tracking.
- **Minimum Pool Guarantee System:** Ensures reward consistency by allowing the company to back a minimum reward pool amount.

## External Dependencies

### Payment Services
- **Stripe**: Subscription billing and payment processing.
- **PayPal**: Bulk payout disbursements.

### Authentication
- **Google OAuth**: Social login integration.

### Development Tools
- **Drizzle Kit**: Database schema management and migrations.
- **ESBuild**: Production bundle optimization.
- **TypeScript**: Type checking and development experience.

### Monitoring and Analytics
- **Google Analytics**: User behavior tracking.
- **Google Tag Manager**: Event tracking and conversion monitoring.