# FinBoost - Financial Education and Rewards Platform

## Overview

FinBoost is a comprehensive financial education platform that combines learning with rewards. Users earn points by completing educational modules, taking quizzes, and uploading proof of financial actions. Premium members compete for monthly cash rewards distributed through a collective pool funded by membership fees. The project's vision is to empower users through financial literacy and incentivized action, aiming for significant market potential by fostering real-world financial habit changes.

## Recent Changes (January 2025)

**Critical Pagination Fix Completed** - Successfully resolved the pagination display issue where Excel import changes weren't appearing on later pages of the winners table. Key fixes included:
- Fixed TypeScript compilation errors (reduced from 112 to manageable levels)
- Standardized backend API consistency with proper overallRank ordering
- Enhanced frontend cache invalidation for proper data refresh after imports
- Updated storage layer database queries for consistent ordering
- Verified authentication flow and API endpoint functionality
- **Result**: Excel import changes now display correctly across all paginated pages after refresh

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