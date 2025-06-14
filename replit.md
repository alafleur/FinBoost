# FinBoost - Financial Education and Rewards Platform

## Overview

FinBoost is a comprehensive financial education platform that combines learning with rewards. Users earn points by completing educational modules, taking quizzes, and uploading proof of financial actions. Premium members compete for monthly cash rewards distributed through a collective pool funded by membership fees.

The application features a modern React frontend with TypeScript, Express.js backend, PostgreSQL database with Drizzle ORM, and integrations with Stripe for payments and PayPal for reward disbursements.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Wouter** for client-side routing
- **TailwindCSS** for styling with shadcn/ui component library
- **Tanstack Query** for server state management
- **React Hook Form** for form validation
- **Framer Motion** for animations

### Backend Architecture
- **Express.js** with TypeScript for the REST API
- **PostgreSQL** database for data persistence
- **Drizzle ORM** for database operations and migrations
- **JWT** for authentication and authorization
- **bcrypt** for password hashing
- **Multer** for file upload handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL with comprehensive schema for users, learning modules, points system, rewards, and admin functionality
- **File Storage**: Local file system for user uploads (proof documents, profile pictures)
- **Session Storage**: JWT tokens stored in localStorage on client

## Key Components

### Authentication System
- Email/password authentication with JWT tokens
- Google OAuth integration for social login
- Password reset functionality with secure token-based flow
- Role-based access control (admin vs. regular users)

### Points and Rewards System
- Configurable point actions with daily/monthly limits
- Proof-based point awards requiring admin approval
- Tier system based on monthly point accumulation
- Monthly reward pool distribution to winners
- Referral system with bonus points

### Learning Management
- Rich content modules with HTML support
- Interactive quizzes with explanations
- Progress tracking and completion certificates
- Category-based organization (budgeting, investing, debt, etc.)
- Free vs. premium content access control

### Payment Processing
- Stripe integration for subscription management
- PayPal integration for reward disbursements
- Multi-currency support (USD/CAD)
- Automated billing and subscription lifecycle management

### Admin Portal
- Content management for learning modules
- User management and analytics
- Points system configuration
- Winner selection and payout management
- Real-time statistics and reporting

## Data Flow

### User Journey
1. **Registration**: User signs up with email or Google OAuth
2. **Learning**: Complete modules and quizzes to earn theoretical points
3. **Subscription**: Upgrade to premium to claim points and compete for rewards
4. **Engagement**: Upload proof of financial actions for bonus points
5. **Rewards**: Participate in monthly winner selection and receive payouts

### Points System Flow
1. User completes action (lesson, quiz, proof upload)
2. System validates action against configured limits
3. Points awarded (immediately for lessons/quizzes, after approval for proof)
4. Monthly totals calculated for tier assignment
5. Winner selection algorithm distributes rewards based on performance

### Admin Workflow
1. Configure point values and reward pool percentages
2. Review and approve user-submitted proof documents
3. Run monthly winner selection algorithm
4. Process PayPal disbursements to winners
5. Monitor system health and user engagement

## External Dependencies

### Payment Services
- **Stripe**: Subscription billing and payment processing
- **PayPal**: Bulk payout disbursements to reward winners

### Authentication
- **Google OAuth**: Social login integration

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production bundle optimization
- **TypeScript**: Type checking and development experience

### Monitoring and Analytics
- **Google Analytics**: User behavior tracking
- **Google Tag Manager**: Event tracking and conversion monitoring

## Deployment Strategy

### Development Environment
- Replit-based development with hot module replacement
- Local PostgreSQL database for development
- Environment variables for API keys and secrets

### Production Deployment
- Autoscale deployment target on Replit
- Build process compiles frontend and backend separately
- Database migrations run automatically on deployment
- Static assets served from CDN

### Environment Configuration
- Separate configurations for development/production
- Secure environment variable management
- SSL/TLS termination at proxy level
- Database connection pooling for performance

## Changelog
- June 13, 2025. Initial setup
- June 13, 2025. Added Profile tab to mobile navigation with comprehensive subscription payment details display including amount, payment method, dates, and PayPal configuration for reward disbursements. Implemented admin endpoints for managing user payment information with automatic next billing date calculation (last day of month).
- June 13, 2025. Session interrupted during desktop dashboard restoration work. Missing components identified include: LeaderboardSidebar positioning, community growth metrics, proper tier system (Tier 1/2/3), and complete desktop layout structure. Work in progress to restore full desktop dashboard functionality.
- June 14, 2025. Completed desktop dashboard migration to 5-tab structure matching mobile exactly (Overview, Learn, Referrals, Rewards, Board). Removed Profile tab from navigation (functionality remains in header). Fixed Board tab leaderboard to show all members with pagination instead of 20-user limit. Implemented complete Overview tab with all mobile content including stats grid, community growth dial, learning modules preview, and rewards history. Desktop now has full consistency with mobile interface.
- June 14, 2025. Fixed three critical desktop dashboard issues: 1) Corrected tier naming system to display "Tier 1/2/3" instead of outdated "Bronze" terminology on both mobile and desktop, 2) Unified color schemes between platforms using mobile's preferred warm orange/yellow palette, 3) Optimized desktop layout with efficient 2x2 stats grid plus sidebar Community Growth component, eliminating excessive whitespace and improving space utilization.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Status
- Desktop dashboard fully functional with 5 tabs matching mobile
- Board tab pagination working for all members
- Overview tab includes complete mobile content
- Profile functionality accessible via header button on both platforms
- Learn tab has minor formatting inconsistencies with Education page (deferred)