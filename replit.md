# FinBoost - Financial Education and Rewards Platform

## Overview
FinBoost is a financial education platform that incentivizes learning through a reward system. Users earn points by engaging with educational content and demonstrating real-world financial actions. Premium members can compete for monthly cash rewards from a collective pool. The platform aims to foster financial literacy and drive positive financial habits, holding significant market potential through its unique incentivized approach.

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

## Recent Updates (January 14, 2025)
- **PayPal Disbursement UI Overhaul**: Fixed completely broken progress tracking UI
  - Replaced fake hardcoded 25% progress with real-time polling of batch status
  - Added live progress updates showing actual chunks/items processed
  - Fixed button state to remain disabled during processing
  - Added batch ID display for visibility
  - Modal now closes automatically on completion
  - Progress updates every 2 seconds with meaningful status messages
- **Previous Fix (Jan 13)**: Resolved critical bug where PayPal API was receiving null emails
  - Added missing `paypal_email` column to `cycle_winner_selections` table
  - Fixed field mapping mismatch between orchestrator and PayPal API (paypalEmail → email)
  - Successfully tested disbursement for cycle 18 with PayPal Batch ID 6J8QD5TRDZD5U

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Wouter for routing, TailwindCSS with shadcn/ui for styling, Tanstack Query for server state management, React Hook Form for form validation, Framer Motion for animations.
- **UI/UX Decisions**: The design prioritizes a clean, professional aesthetic with consistent white cards, subtle gray borders, and a cohesive typography hierarchy. It uses subtle color accents and avoids bright, game-like schemes. The platform emphasizes mobile-first responsiveness and a unified component architecture. Recent enhancements include a consistent blue-to-purple gradient theme across various elements (buttons, navigation tabs, tier badges) and an interactive phone preview system on the landing page. The Leaderboard UI is redesigned to match the professional aesthetic of the Overview tab.

### Backend
- **Technology Stack**: Express.js with TypeScript, PostgreSQL database with Drizzle ORM, JWT for authentication, bcrypt for password hashing, Multer for file upload handling.
- **Core Features**:
    - **Authentication System**: Supports email/password, Google OAuth, password reset, and role-based access control.
    - **Points and Rewards System**: Configurable actions, proof-based awards, percentile-based tier system, monthly reward pool distribution, and a referral system. It supports cycle-based rewards and a minimum pool guarantee.
    - **Learning Management**: Offers rich content modules, interactive quizzes, progress tracking, and manages free/premium content access.
    - **Payment Processing**: Handles subscription management and reward disbursements, including a robust PayPal disbursement system with two-phase transactions, idempotency, retry logic, comprehensive error handling, and advanced batch chunking optimization with 500-recipient chunks for enhanced API reliability.
    - **Admin Portal**: Provides tools for content management, user/analytics management, points configuration, flexible winner selection (point-weighted random, top performers, pure random, manual), configurable tier pools, individual payout adjustments, and Excel export/import for winner data.
    - **Prediction System**: Implements skill-based prediction questions with configurable points, deadline management, results determination, and nuanced scoring.
    - **Winner Celebration Notification System**: Manages notifications for reward winners.
- **System Design Choices**: The PayPal disbursement system features a comprehensive 5-layer defensive architecture with robust input validation, circuit breaker patterns, resource protection, timeout management, and fail-safe mechanisms. It ensures deterministic batch IDs, rate limiting, advisory locks, and extensive audit trails. STEP 7 COMPLETE: Centralized email validation service consolidates all email validation logic with multi-layer security architecture, disposable email detection, placeholder rejection, and comprehensive error classification.
- **Data Storage Solutions**: PostgreSQL for all core application data; Local file system for user uploads; JWT tokens in localStorage for session management.

## External Dependencies
- **Stripe**: Used for subscription billing and payment processing.
- **PayPal**: Utilized for bulk payout disbursements to reward winners.
- **Google OAuth**: Integrated for social login.
- **Google Analytics**: Employed for user behavior tracking.
- **Google Tag Manager**: Used for event tracking and conversion monitoring.