# FinBoost - Financial Education and Rewards Platform

## Overview

FinBoost is a comprehensive financial education platform that combines learning with rewards. Users earn points by completing educational modules, taking quizzes, and uploading proof of financial actions. Premium members compete for monthly cash rewards distributed through a collective pool funded by membership fees. The project's vision is to empower users through financial literacy and incentivized action, aiming for significant market potential by fostering real-world financial habit changes.

## Recent Changes (January 2025)

**Comprehensive Cache Invalidation + Data Sync Fix Completed** (January 2025) - Successfully resolved critical frontend cache invalidation issue where Excel import changes (750+ records updated in database) weren't displaying in admin UI. Root cause: browser caching + token expiration preventing fresh data fetch. Comprehensive solution implemented:

**Backend Enhancements:**
- Added `Cache-Control: no-store` headers to `/api/admin/winners/data/:cycleId` endpoint
- Enhanced authentication error logging with user tracking
- Comprehensive debug logging with timestamps for troubleshooting

**Frontend Cache Busting:**
- Updated `loadEnhancedWinners()` with `forceFresh` parameter + query timestamp (`?t=${Date.now()}`)
- Implemented 403 session expiry handling with user notifications
- Added Force Refresh button for manual cache invalidation

**Import Workflow Fix:**
- Excel import success handler now calls `loadEnhancedWinners(true)` with forced cache bust
- Corrected field mapping: `pointsAtSelection` properly displays Cycle Points data
- Removed pagination completely - single scrollable table eliminates cache inconsistencies

**Result**: Excel imports now display updated data immediately across all winner records with correct Cycle Points values. No more stale cache issues.

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
- **React 18** with TypeScript for type safety
- **Vite** for build and development
- **Wouter** for client-side routing
- **TailwindCSS** with shadcn/ui for styling
- **Tanstack Query** for server state management
- **React Hook Form** for form validation
- **Framer Motion** for animations
- UI/UX decisions prioritize a clean, professional aesthetic with consistent white cards, subtle gray borders, and a cohesive typography hierarchy. Subtle color accents are used for distinction (e.g., stats cards, tier stats) while avoiding bright, game-like schemes. The design emphasizes mobile-first responsiveness and unified component architecture across all screen sizes.

### Backend
- **Express.js** with TypeScript for the REST API
- **PostgreSQL** database with **Drizzle ORM** for data persistence and migrations
- **JWT** for authentication and authorization; **bcrypt** for password hashing
- **Multer** for file upload handling
- Core features include:
    - **Authentication System**: Email/password and Google OAuth, password reset, role-based access control.
    - **Points and Rewards System**: Configurable actions, proof-based awards, tier system based on points, monthly reward pool distribution, referral system. Dynamic percentile-based tier calculations are used. Cycle-based system for flexible reward periods (weekly/bi-weekly/custom). Minimum pool guarantee system implemented.
    - **Learning Management**: Rich content modules, interactive quizzes, progress tracking, free/premium content access.
    - **Payment Processing**: Subscription management and reward disbursements.
    - **Admin Portal**: Content management, user/analytics management, points configuration, winner selection, reporting. Features include flexible winner selection (point-weighted random, top performers, pure random, manual), configurable tier pools, and individual payout adjustments. Comprehensive Excel export/import for winner data.
    - **Prediction System**: Skill-based prediction questions with configurable points, deadline management, and results determination. Supports a workflow where admins define questions, users submit predictions, and admins determine results and allocate custom points per option for nuanced scoring.

### Data Storage Solutions
- **Primary Database**: PostgreSQL for all core application data.
- **File Storage**: Local file system for user uploads.
- **Session Storage**: JWT tokens stored in localStorage.

## External Dependencies

- **Stripe**: Subscription billing and payment processing.
- **PayPal**: Bulk payout disbursements for reward winners.
- **Google OAuth**: Social login integration.
- **Google Analytics**: User behavior tracking.
- **Google Tag Manager**: Event tracking and conversion monitoring.