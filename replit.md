# FinBoost - Financial Education and Rewards Platform

## Overview

FinBoost is a comprehensive financial education platform that combines learning with rewards. Users earn points by completing educational modules, taking quizzes, and uploading proof of financial actions. Premium members compete for monthly cash rewards distributed through a collective pool funded by membership fees. The project's vision is to empower users through financial literacy and incentivized action, aiming for significant market potential by fostering real-world financial habit changes.

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

**Current Priority Tasks (January 2025):**
- ✅ Fix upload functionality to properly connect frontend to backend for proof submissions (COMPLETE - January 7, 2025)
- Eliminate duplicate mobile/desktop components in favor of single responsive components
- Update landing page phone images with actual application screenshots for marketing purposes

**Recent Upload System Fixes (January 7, 2025):**
- Fixed critical actionId type mismatch bug in proof submission endpoint - backend now handles both string and number actionIds
- Implemented secure file upload endpoint (/api/upload/proof) with authentication, validation, and audit logging
- Added secure file serving endpoint (/api/uploads/:filename) with multi-layer security protection
- Updated PointsActions component to dynamically select appropriate proof-requiring actions instead of hardcoding actionId
- Integrated FileUpload component properly with backend endpoints for complete end-to-end workflow
- Fixed admin portal "View Proof File" authentication issue with secure blob-based file viewing system

**Recent Landing Page Optimizations (January 2025):**
- Enhanced lesson cards section with desktop scroll showing 2.5 rows for better conversion flow
- Implemented unified scroll interaction pattern across mobile and desktop
- Added professional polish with staggered animations, enhanced depth effects, and icon micro-interactions
- Updated key messaging from "Half of Members Earn Rewards Each Cycle" to "Not Winner Take All — Members at All Stages Win" for better positioning against lottery-style models

**Recent Content Updates (January 2025):**
- Added 3 new modules: student loan forgiveness (policy changes), strategic loan repayment, and daily spending analysis ("latte effect") 
- Updated "What You'll Master" section with horizontal scrolling design and refined mobile layout
- Expanded curriculum to 14 published modules across 7 categories
- Current distribution: Debt (5), Credit (3), Budgeting (2), Investing (1), Real Estate (1), Saving (1), Career (1)

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Wouter for routing, TailwindCSS with shadcn/ui for styling, Tanstack Query for server state management, React Hook Form for form validation, Framer Motion for animations.
- **UI/UX Decisions**: Prioritizes a clean, professional aesthetic with consistent white cards, subtle gray borders, and a cohesive typography hierarchy. Subtle color accents (e.g., stats cards, tier stats) are used while avoiding bright, game-like schemes. The design emphasizes mobile-first responsiveness and unified component architecture across all screen sizes. Recent enhancements include a unified blue→purple gradient theme for consistency across landing page and dashboard elements (buttons, navigation tabs, tier badges) and an interactive phone preview system on the landing page. The Leaderboard UI has also been redesigned for a professional look, matching the Overview tab's aesthetic.

**Recent UI Improvements (January 2025):**
- Added "Actions" tab between Learn and Board tabs with professional styling
- Implemented proof upload functionality with FileUpload component integration
- Enhanced PointsActions component with inspiring messaging and refined aesthetics
- Removed redundant description text when it matches action titles
- Applied consistent blue→purple gradient styling throughout Actions interface
- Added responsive grid layout and improved card hover effects

### Backend
- **Technology Stack**: Express.js with TypeScript, PostgreSQL database with Drizzle ORM, JWT for authentication, bcrypt for password hashing, Multer for file upload handling.
- **Core Features**:
    - **Authentication System**: Email/password, Google OAuth, password reset, role-based access control.
    - **Points and Rewards System**: Configurable actions, proof-based awards, percentile-based tier system, monthly reward pool distribution, referral system. Supports cycle-based rewards and a minimum pool guarantee.
    - **Learning Management**: Rich content modules, interactive quizzes, progress tracking, free/premium content access.
    - **Payment Processing**: Subscription management and reward disbursements.
    - **Admin Portal**: Content management, user/analytics management, points configuration, flexible winner selection (point-weighted random, top performers, pure random, manual), configurable tier pools, individual payout adjustments, and Excel export/import for winner data.
    - **Prediction System**: Skill-based prediction questions with configurable points, deadline management, results determination, and nuanced scoring.
    - **Winner Celebration Notification System**: Backend infrastructure to track and manage winner notifications, including database schema enhancements and dedicated API endpoints.
- **Data Storage Solutions**: PostgreSQL for all core application data; Local file system for user uploads; JWT tokens in localStorage for session management.

## External Dependencies

- **Stripe**: Subscription billing and payment processing.
- **PayPal**: Bulk payout disbursements for reward winners.
- **Google OAuth**: Social login integration.
- **Google Analytics**: User behavior tracking.
- **Google Tag Manager**: Event tracking and conversion monitoring.