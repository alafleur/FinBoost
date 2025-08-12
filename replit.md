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

## Recent Development Progress

**PayPal Disbursement System Enhancement (January 2025)**
- **Step 1 Complete**: Batch Intent & Idempotency Infrastructure - Added payoutBatches and payoutBatchItems tables with comprehensive foreign key relationships and 13 production-ready storage methods
- **Step 2 Complete**: Enhanced PayPal Response Parsing - Implemented pure parsing layer with typed results, comprehensive status mapping (success/failed/pending/unclaimed), robust error handling, and complete unit test coverage (7/7 tests passing). Zero TypeScript compilation errors.
- **Step 3 Complete**: Enhanced Storage Methods - Implemented 10 production-ready storage methods that integrate Step 2 parsed results with Step 1 database infrastructure. Includes main orchestrator method (processPaypalResponseResults), batch/item updates, user reward creation, cycle completion checking, and reconciliation capabilities. Full integration tested and verified.
- **Step 4 Complete**: Two-Phase Transaction Pattern - Implemented comprehensive transaction orchestrator with Phase 1 (Prepare/Intent) and Phase 2 (Commit/Execute) logic. Features atomic operations, automatic rollback capabilities, idempotency safeguards, comprehensive error handling, and integration with Steps 1-3. Added 3 additional storage methods (updatePayoutBatch, updatePayoutBatchItem, getPayoutBatchByChecksum) and admin route integration. Enterprise-grade transaction processing ready for production.
- **Step 5 Complete**: Dry-Run Preview Endpoint - Implemented comprehensive preview system (POST /api/admin/winner-cycles/:cycleId/preview-disbursements) that integrates with Step 4 orchestrator to execute only Phase 1 validation without PayPal API calls. Features complete recipient validation, amount calculations, PayPal payload preview, automatic cleanup of intent records, and detailed validation feedback. Adds 2 additional storage methods (deletePayoutBatch, deletePayoutBatchItems) for preview cleanup. Production-ready administrative safety system.
- **Step 6 Complete**: Re-Run Prevention & Retry Logic - Implemented comprehensive retry logic with exponential backoff, processing locks, duplicate detection, and cooldown periods. Enhanced transaction orchestrator with executeTransactionWithRetry(), retryTransaction(), and intelligent error classification. Added retry tracking database fields (retryCount, lastRetryAt, lastRetryError) and 8 additional storage methods for lock management and activity tracking. Includes 3 new admin routes for manual retry (POST /retry), status monitoring (GET /status), and override controls (POST /override-status). Enterprise-grade fault tolerance with automatic recovery and manual intervention capabilities.
- **Step 7 Complete**: Reconciliation Endpoint - Implemented POST /api/admin/payout-batches/:batchId/reconcile for re-fetching PayPal batch status for PENDING/UNCLAIMED items. Features comprehensive status synchronization using existing getEnhancedPayoutStatus() and processPaypalResponseResults() methods, before/after status comparison tracking, cycle completion checking, robust error handling for PayPal API failures, and detailed reconciliation reporting. Provides administrative control for manual status updates when PayPal items transition from pending to final states.
- **Step 8 Complete**: Guardrails & Observability - Implemented comprehensive structured logging system with createBatchLogger() utility, currency/amount validation with 2-decimal precision and USD-only enforcement, concurrency protection preventing simultaneous batch processing, and enhanced admin audit trail tracking all disbursement actions. Features include validateCurrencyAmount() function, checkConcurrentBatches() protection, getPayoutBatchesByCycle() storage method, enterprise-grade error handling, and detailed batch processing logs with timestamps and traceability. Enhanced disbursement endpoint now validates all amounts before PayPal processing, filters invalid recipients, and provides comprehensive response format with detailed failure reasons.
- **Architecture Decision**: Complete enhanced seven-layer architecture achieved - Step 1 (database infrastructure), Step 2 (pure parsing layer), Step 3 (integration layer), Step 4 (transaction orchestration), Step 5 (dry-run preview system), Step 6 (retry logic & re-run prevention), Step 7 (reconciliation system), Step 8 (guardrails & observability). Zero technical debt, comprehensive error handling, robust transaction processing with rollback capabilities, administrative safety through preview system, fault-tolerant retry mechanisms, manual reconciliation controls, enterprise-grade validation and logging, and production-ready implementation with complete operational controls and monitoring.

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
    - **Payment Processing**: Handles subscription management and reward disbursements.
    - **Admin Portal**: Provides tools for content management, user/analytics management, points configuration, flexible winner selection (point-weighted random, top performers, pure random, manual), configurable tier pools, individual payout adjustments, and Excel export/import for winner data.
    - **Prediction System**: Implements skill-based prediction questions with configurable points, deadline management, results determination, and nuanced scoring.
    - **Winner Celebration Notification System**: Manages notifications for reward winners.
- **Data Storage Solutions**: PostgreSQL for all core application data; Local file system for user uploads; JWT tokens in localStorage for session management.

## External Dependencies
- **Stripe**: Used for subscription billing and payment processing.
- **PayPal**: Utilized for bulk payout disbursements to reward winners.
- **Google OAuth**: Integrated for social login.
- **Google Analytics**: Employed for user behavior tracking.
- **Google Tag Manager**: Used for event tracking and conversion monitoring.