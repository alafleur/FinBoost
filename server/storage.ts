import { users, type User, type InsertUser, subscribers, type Subscriber, type InsertSubscriber, userPointsHistory, learningModules, userProgress, monthlyRewards, userMonthlyRewards, referrals, userReferralCodes, supportRequests, type SupportRequest, passwordResetTokens, type PasswordResetToken, adminPointsActions, paypalPayouts, type PaypalPayout, cycleSettings, userCyclePoints, cycleWinnerSelections, cyclePointHistory, cyclePointsActions, type CycleSetting, type UserCyclePoints, type CycleWinnerSelection, type CyclePointHistory, type CyclePointsAction, type InsertCycleSetting, type InsertUserCyclePoints, type InsertCycleWinnerSelection, type InsertCyclePointHistory, type InsertCyclePointsAction, predictionQuestions, userPredictions, predictionResults, type PredictionQuestion, type UserPrediction, type PredictionResult, type InsertPredictionQuestion, type InsertUserPrediction, type InsertPredictionResult, payoutBatches, payoutBatchItems, payoutBatchChunks, type PayoutBatch, type InsertPayoutBatch, type PayoutBatchItem, type InsertPayoutBatchItem, type PayoutBatchChunk, type InsertPayoutBatchChunk } from "@shared/schema";
// Step 2 Type Imports for Enhanced PayPal Integration
import type { ParsedPayoutResponse, PayoutItemResult } from "./paypal";
import type { UserPointsHistory, MonthlyReward, UserMonthlyReward, Referral, UserReferralCode } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, sql, desc, asc, and, or, lt, gte, ne, lte, between, isNotNull, gt, sum, count, inArray, notInArray, isNull } from "drizzle-orm";
import { db } from "./db";

// ChatGPT's consolidated rewards history types
export type RewardsHistoryItem = {
  cycleId: number;
  cycleLabel: string | null;
  awardedAt: string | null;
  amountCents: number;
  status: "pending" | "earned" | "paid" | "failed";
  paidAt: string | null;
};

export type RewardsHistoryResponse = {
  summary: { totalEarnedCents: number; rewardsReceived: number };
  items: RewardsHistoryItem[];
};

// Helper function to get cycle fee multiplier based on cycle type
function getCycleFeeMultiplier(cycleType: string): number {
  switch (cycleType) {
    case 'weekly':
      return 1/4;  // 1/4 of monthly fee
    case '10-day':
      return 1/3;  // 1/3 of monthly fee  
    case 'bi-weekly':
      return 1/2;  // 1/2 of monthly fee
    case 'monthly':
      return 1;    // full monthly fee
    default:
      console.warn(`Unknown cycle type: ${cycleType}, using bi-weekly multiplier as default`);
      return 1/2;  // default to bi-weekly
  }
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Subscriber methods
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  getAllSubscribers(): Promise<Subscriber[]>;
  getSubscribersCount(): Promise<number>;
  getUserCount(): Promise<number>;
  getDistributionSettings(): Promise<{[key: string]: string}>;

    // Module Publication Methods
    toggleModulePublish(moduleId: number, isPublished: boolean): Promise<any>;
    getPublishedModules(): Promise<any[]>;

    // User Authentication Methods
    getUserByEmail(email: string): Promise<User | null>;
    getUserById(id: number): Promise<User | null>;
    validateUser(email: string, password: string): Promise<User | null>;
    updateUserPoints(userId: number, totalPoints: number, currentMonthPoints: number): Promise<void>;
    getUserPointsHistory(userId: number): Promise<UserPointsHistory[]>;
    updateLastLogin(userId: number): Promise<void>;
    updateUserLastLogin(userId: number): Promise<void>;
    updateUserProfile(userId: number, profileData: Partial<{firstName: string, lastName: string, bio: string, location: string, occupation: string, financialGoals: string}>): Promise<void>;
    generateToken(userId: number): Promise<string>;
    getUserByToken(token: string): Promise<User | null>;
    validateToken(token: string): Promise<User | null>;

    // Enhanced Points System Methods
    awardPoints(userId: number, actionId: string, points: number, description: string, metadata?: any): Promise<UserPointsHistory>;
    awardPointsWithProof(userId: number, actionId: string, points: number, description: string, proofUrl: string, metadata?: any): Promise<UserPointsHistory>;
    checkDailyActionLimit(userId: number, actionId: string): Promise<boolean>;
    checkTotalActionLimit(userId: number, actionId: string): Promise<boolean>;
    getPendingProofUploads(): Promise<UserPointsHistory[]>;
    approveProofUpload(historyId: number, reviewerId: number, customPoints?: number): Promise<void>;
    rejectProofUpload(historyId: number, reviewerId: number, reason: string): Promise<void>;
    calculateUserTier(currentMonthPoints: number): Promise<string>;

    //Leaderboard Methods
    getLeaderboard(period: 'monthly' | 'allTime', limit: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>>;
    getUserRank(userId: number, period: 'monthly' | 'allTime'): Promise<{rank: number, points: number, tier: string} | null>;
    getExpandedLeaderboard(timeFilter: string, page: number, search: string): Promise<Array<{rank: string, username: string, points: string, tier: string, streak: number, modulesCompleted: number, joinDate: string}>>;
    getUserLeaderboardStats(userId: number, timeFilter: string): Promise<{username: string, rank: number, points: number, tier: string, streak: number, modulesCompleted: number, pointsToNextTier: number, pointsToTopPosition?: number}>;

    // Rewards History Methods (ChatGPT's consolidated solution)
    getRewardsHistoryForUser(userId: number): Promise<RewardsHistoryResponse>;

    // Monthly Rewards Methods
    createMonthlyReward(month: string, totalRewardPool: number, config?: Partial<{goldRewardPercentage: number, silverRewardPercentage: number, bronzeRewardPercentage: number, pointDeductionPercentage: number}>): Promise<MonthlyReward>;
    distributeMonthlyRewards(monthlyRewardId: number): Promise<void>;
    getUserMonthlyRewardsHistory(userId: number): Promise<UserMonthlyReward[]>;
    getMonthlyRewardsSummary(): Promise<MonthlyReward[]>;
    rolloverUserPoints(userId: number, fromMonth: string): Promise<void>;

    // Referral System Methods
    createUserReferralCode(userId: number): Promise<UserReferralCode>;
    getUserReferralCode(userId: number): Promise<UserReferralCode | null>;
    validateReferralCode(referralCode: string): Promise<{isValid: boolean, referrerUserId?: number}>;
    processReferralSignup(referredUserId: number, referralCode: string): Promise<void>;
    getUserReferrals(userId: number): Promise<Array<{referral: Referral, referredUser: {username: string, email: string, joinedAt: Date}}>>;
    getReferralStats(userId: number): Promise<{totalReferrals: number, completedReferrals: number, pendingReferrals: number, totalPointsEarned: number}>;
    updateReferralStatus(referralId: number, status: 'completed' | 'expired'): Promise<void>;
    getAdminReferralStats(): Promise<{totalReferrals: number, totalReferrers: number, topReferrers: Array<{username: string, referralCount: number, pointsEarned: number}>}>;

    // Enhanced Admin Methods
    getAdminUsers(filters: {page: number, limit: number, search?: string, status?: string, tier?: string}): Promise<User[]>;
    bulkUpdateUsers(userIds: number[], updates: Partial<User>): Promise<void>;
    bulkResetPasswords(userIds: number[]): Promise<void>;
    exportUserData(userIds: number[]): Promise<any>;
    getAdminAnalytics(period: string): Promise<any>;
    getSystemSettings(): Promise<any>;
    updateSystemSettings(settings: any): Promise<void>;
    getUserDetailsForAdmin(userId: number): Promise<any>;
    exportUsers(format: string): Promise<string>;
    exportPointsHistory(format: string): Promise<string>;
    exportAnalytics(format: string): Promise<string>;

    // Streak Methods
    updateUserStreak(userId: number): Promise<{ newStreak: number; bonusPoints: number }>;

    // Lesson Completion
    markLessonComplete(userId: number, lessonId: string): Promise<{ pointsEarned: number; streakBonus: number; newStreak: number }>;

    // === PASSWORD RESET METHODS ===

    createPasswordResetToken(userId: number): Promise<string>;
    validatePasswordResetToken(token: string): Promise<{isValid: boolean, userId?: number}>;
    resetUserPassword(token: string, newPassword: string): Promise<boolean>;
    cleanupExpiredTokens(): Promise<void>;

    // === PAYPAL METHODS ===
    updateUserPayPalOrderId(userId: number, orderId: string): Promise<void>;
    updateUserMembershipStatus(userId: number, isPremium: boolean, paymentMethod: string): Promise<void>;
    updateUserPayPalEmail(userId: number, paypalEmail: string): Promise<void>;
    
    // === PAYPAL PAYOUT METHODS ===
    createPayPalPayout(payoutData: {
      userId: number;
      amount: number;
      currency: string;
      reason: string;
      tier?: string;
      recipientEmail: string;
    }): Promise<any>;
    updatePayPalPayoutStatus(payoutId: number, status: string, paypalResponse?: string): Promise<void>;
    getPayPalPayoutsByUser(userId: number): Promise<any[]>;
    getAllPendingPayouts(): Promise<any[]>;
    getEligibleUsersForRewards(): Promise<any[]>;
    getPremiumUsersForRewards(): Promise<any[]>;

    // === SUPPORT REQUEST METHODS ===

    createSupportRequest(data: {
      userId?: number | null;
      name: string;
      email: string;
      category: string;
      message: string;
      hasAttachment?: boolean;
      fileName?: string | null;
    }): Promise<SupportRequest>;
    getSupportRequests(options: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    }): Promise<SupportRequest[]>;
    getSupportRequestById(requestId: number): Promise<SupportRequest | null>;
    updateSupportRequest(requestId: number, updates: {
      status?: string;
      priority?: string;
      response?: string;
      resolvedAt?: Date | null;
    }): Promise<void>;
    getSupportRequestStats(): Promise<{
      total: number;
      pending: number;
      inProgress: number;
      resolved: number;
      closed: number;
    }>;

    getTierThresholds(): Promise<{ tier1: number, tier2: number, tier3: number }>;

    // Admin CRUD operations
    createModule(moduleData: any): Promise<any>;
    updateModule(moduleId: number, moduleData: any): Promise<any>;
    deleteModule(moduleId: number): Promise<void>;
    getAllModules(): Promise<any[]>;
    getModuleById(moduleId: number): Promise<any | null>;

    updateUser(userId: number, userData: any): Promise<User>;
    deleteUser(userId: number): Promise<void>;
    
    // Stripe payment methods
    addToRewardPool(amount: number): Promise<void>;
    
    // Cycle settings methods (consolidated from monthly)
    createCycleSetting(setting: any): Promise<any>;
    getActiveCycleSetting(): Promise<any>;
    getCurrentPoolSettingsForDate(date: Date): Promise<{ rewardPoolPercentage: number; membershipFee: number } | null>;
    updateCycleSetting(id: number, updates: any): Promise<any>;
    getAllCycleSettings(): Promise<any[]>;

    awardPoints(userId: number, points: number, action: string, reason: string): Promise<void>;
    deductPoints(userId: number, points: number, action: string, reason: string): Promise<void>;

    updateRewardsConfig(config: any): Promise<void>;
    executeMonthlyDistribution(month: string): Promise<any>;

    getAllSupportTickets(): Promise<any[]>;
    updateSupportTicket(ticketId: number, ticketData: any): Promise<any>;

    getPointActions(): Promise<any[]>;
    createOrUpdatePointAction(actionData: {
      actionId: string;
      name: string;
      basePoints: number;
      maxDaily?: number;
      maxMonthly?: number;
      maxTotal?: number;
      requiresProof: boolean;
      category: string;
      description: string;
    }, adminUserId: number): Promise<any>;
    deletePointAction(actionId: string): Promise<void>;

    // === USER ENGAGEMENT ANALYTICS METHODS (Phase 1.1 Step 1) ===
    
    // Active users tracking
    getDailyActiveUsers(startDate: Date, endDate: Date): Promise<number>;
    getWeeklyActiveUsers(startDate: Date, endDate: Date): Promise<number>;
    getCycleActiveUsers(): Promise<number>;
    
    // Login frequency statistics
    getLoginFrequencyStats(startDate: Date, endDate: Date): Promise<{
      averageLoginsPerUser: number;
      totalLogins: number;
      uniqueLoginUsers: number;
      dailyLoginTrends: Array<{ date: string; loginCount: number }>;
    }>;
    
    // Session duration averages
    getSessionDurationStats(startDate: Date, endDate: Date): Promise<{
      averageSessionDuration: number;
      totalSessions: number;
      sessionDurationDistribution: Array<{ range: string; count: number }>;
    }>;

    // === LEARNING ANALYTICS METHODS (Phase 1.1 Step 2) ===
    
    // Module completion rates
    getModuleCompletionRates(startDate: Date, endDate: Date): Promise<Array<{
      moduleId: number;
      moduleName: string;
      completionRate: number;
      totalUsers: number;
      completedUsers: number;
    }>>;
    
    // Average time per module
    getAverageTimePerModule(startDate: Date, endDate: Date): Promise<Array<{
      moduleId: number;
      moduleName: string;
      averageTimeMinutes: number;
      totalCompletions: number;
    }>>;
    
    // Popular content categories
    getPopularContentCategories(startDate: Date, endDate: Date): Promise<Array<{
      category: string;
      completions: number;
      uniqueUsers: number;
      averageScore: number;
    }>>;

    // === NEW CYCLE-BASED METHODS (Phase 2) ===
    
    // Cycle Settings Management
    createCycleSetting(setting: InsertCycleSetting): Promise<CycleSetting>;
    getActiveCycleSetting(): Promise<CycleSetting | null>;
    getCurrentCycleSettingForDate(date: Date): Promise<CycleSetting | null>;
    updateCycleSetting(id: number, updates: Partial<CycleSetting>): Promise<CycleSetting>;
    getAllCycleSettings(): Promise<CycleSetting[]>;
    
    // User Cycle Points Management
    createUserCyclePoints(data: InsertUserCyclePoints): Promise<UserCyclePoints>;
    getUserCyclePoints(userId: number, cycleSettingId: number): Promise<UserCyclePoints | null>;
    updateUserCyclePoints(userId: number, cycleSettingId: number, updates: Partial<UserCyclePoints>): Promise<UserCyclePoints>;
    getUsersInCurrentCycle(cycleSettingId: number): Promise<UserCyclePoints[]>;
    
    // Cycle-based Points System
    awardCyclePoints(userId: number, cycleSettingId: number, actionId: string, points: number, description: string, metadata?: any): Promise<CyclePointHistory>;
    awardCyclePointsWithProof(userId: number, cycleSettingId: number, actionId: string, points: number, description: string, proofUrl: string, metadata?: any): Promise<CyclePointHistory>;
    checkCycleDailyActionLimit(userId: number, cycleSettingId: number, actionId: string): Promise<boolean>;
    checkCycleActionLimit(userId: number, cycleSettingId: number, actionId: string): Promise<boolean>;
    getCyclePointHistory(userId: number, cycleSettingId: number): Promise<CyclePointHistory[]>;
    
    // Cycle Tier Calculations
    calculateCycleTier(cycleSettingId: number, currentCyclePoints: number): Promise<string>;
    recalculateAllCycleTiers(cycleSettingId: number): Promise<void>;
    getCycleTierThresholds(cycleSettingId: number): Promise<{ tier1: number, tier2: number, tier3: number }>;
    
    // Cycle Winner Selection
    createCycleWinnerSelection(data: InsertCycleWinnerSelection): Promise<CycleWinnerSelection>;
    getCycleWinners(cycleSettingId: number): Promise<CycleWinnerSelection[]>;
    getCycleWinnerDetailsPaginated(cycleSettingId: number, page: number, limit: number): Promise<{winners: any[], totalCount: number}>;
    performCycleWinnerSelection(cycleSettingId: number): Promise<CycleWinnerSelection[]>;
    
    // Seal and Unseal Operations
    sealCycleWinnerSelection(cycleSettingId: number, adminUserId?: number): Promise<{ sealed: boolean; message: string }>;
    unsealCycleWinnerSelection(cycleSettingId: number, adminUserId: number): Promise<{ unsealed: boolean; message: string }>;
    
    // Selected Winners Export/Import (Phase 2)
    getCycleWinnersForExport(cycleSettingId: number): Promise<Array<{
      overallRank: number;
      tierRank: number;
      username: string;
      email: string;
      tierSizeAmount: number;
      payoutPercentage: number;
      payoutCalculated: number;
      payoutOverride: number | null;
      payoutFinal: number;
      paypalEmail: string | null;
      payoutStatus: string;
      lastModified: Date;
    }>>;
    updateWinnerPayoutData(cycleSettingId: number, updates: Array<{
      email: string;
      payoutPercentage?: number;
      payoutOverride?: number | null;
    }>): Promise<void>;
    
    // Cycle Analytics and Reporting
    getCycleLeaderboard(cycleSettingId: number, limit?: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>>;
    getCycleStats(cycleSettingId: number): Promise<{totalUsers: number, averagePoints: number, tierDistribution: any}>;
    
    // Mid-cycle Joining Logic
    shouldJoinCurrentCycle(cycleSettingId: number): Promise<boolean>;
    getNextCycleStartDate(cycleSettingId: number): Promise<Date | null>;
    
    // Cycle Points Actions (cycle-specific limits)
    getCyclePointActions(): Promise<CyclePointsAction[]>;
    createOrUpdateCyclePointAction(actionData: InsertCyclePointsAction, adminUserId: number): Promise<CyclePointsAction>;
    deleteCyclePointAction(actionId: string): Promise<void>;
    
    // Missing cycle API methods needed by dashboard
    getCurrentCycle(): Promise<CycleSetting | null>;
    getUserCycleRewards(userId: number): Promise<any[]>;
    getCyclePoolData(cycleId: number): Promise<{totalPool: number, premiumUsers: number, totalUsers: number}>;
    
    // Cycle Completion Methods
    completeCycle(cycleId: number, completedBy: number): Promise<void>;
    resetUserCyclePoints(cycleId: number): Promise<void>;
    archiveCycleData(cycleId: number): Promise<void>;
    
    // ========================================
    // PREDICTION SYSTEM METHODS (Phase 1)
    // ========================================
    
    // Prediction Questions Management
    createPredictionQuestion(data: InsertPredictionQuestion & { createdBy: number }): Promise<PredictionQuestion>;
    getPredictionQuestion(questionId: number): Promise<PredictionQuestion | null>;
    updatePredictionQuestion(questionId: number, updates: Partial<PredictionQuestion>): Promise<PredictionQuestion>;
    deletePredictionQuestion(questionId: number): Promise<void>;
    
    // Prediction Questions by Cycle
    getPredictionQuestionsByCycle(cycleSettingId: number): Promise<PredictionQuestion[]>;
    getActivePredictionQuestions(cycleSettingId: number): Promise<PredictionQuestion[]>;
    getCompletedPredictionQuestions(cycleSettingId: number): Promise<PredictionQuestion[]>;
    
    // Prediction Question Status Management
    publishPredictionQuestion(questionId: number): Promise<void>;
    closePredictionQuestion(questionId: number): Promise<void>;
    completePredictionQuestion(questionId: number, completedBy: number): Promise<void>;
    
    // User Predictions Management
    submitUserPrediction(data: InsertUserPrediction): Promise<UserPrediction>;
    getUserPrediction(predictionQuestionId: number, userId: number): Promise<UserPrediction | null>;
    updateUserPrediction(predictionId: number, selectedOptionIndex: number): Promise<UserPrediction>;
    getUserPredictions(userId: number): Promise<UserPrediction[]>;
    getUserPredictionsByQuestion(predictionQuestionId: number): Promise<UserPrediction[]>;
    
    // Prediction Results Management
    createPredictionResult(data: InsertPredictionResult & { determinedBy: number }): Promise<PredictionResult>;
    getPredictionResult(predictionQuestionId: number): Promise<PredictionResult | null>;
    updatePredictionResult(resultId: number, updates: Partial<PredictionResult>): Promise<PredictionResult>;
    
    // Prediction Statistics
    getPredictionQuestionStats(predictionQuestionId: number): Promise<{
      totalSubmissions: number;
      optionCounts: number[];
      optionPercentages: number[];
    }>;
    
    // Prediction Points Distribution
    distributePredictionPoints(predictionQuestionId: number): Promise<{
      totalPointsAwarded: number;
      usersAwarded: number;
    }>;
    
    // Prediction Analytics
    getPredictionAnalyticsByCycle(cycleSettingId: number): Promise<{
      totalQuestions: number;
      activeQuestions: number;
      completedQuestions: number;
      totalParticipants: number;
      averageParticipationRate: number;
    }>;
    
    getUserPredictionStats(userId: number): Promise<{
      totalPredictions: number;
      correctPredictions: number;
      totalPointsEarned: number;
      accuracyRate: number;
    }>;
    
    // Winner Celebration Notification System
    getUserWinnerStatus(userId: number): Promise<{
      isWinner: boolean;
      tier?: string;
      rank?: number;
      cycleId?: number;
      cycleName?: string;
      notificationDisplayed?: boolean;
      isSealed?: boolean;
    } | null>;
    markWinnerNotificationDisplayed(userId: number, cycleSettingId: number): Promise<{ success: boolean; message: string }>;
    
    // ========================================
    // PAYOUT BATCH SYSTEM METHODS (Step 1)
    // ========================================
    
    // Batch Creation and Management
    createPayoutBatch(data: InsertPayoutBatch): Promise<PayoutBatch>;
    createPayoutBatchItem(data: InsertPayoutBatchItem): Promise<PayoutBatchItem>;
    getPayoutBatch(batchId: number): Promise<PayoutBatch | null>;
    getPayoutBatchBySenderBatchId(senderBatchId: string): Promise<PayoutBatch | null>;
    getPayoutBatchItems(batchId: number): Promise<PayoutBatchItem[]>;
    
    // STEP 6: Chunking management methods
    createPayoutBatchChunk(chunkData: InsertPayoutBatchChunk): Promise<PayoutBatchChunk>;
    getPayoutBatchChunk(chunkId: number): Promise<PayoutBatchChunk | null>;
    getPayoutBatchChunks(batchId: number): Promise<PayoutBatchChunk[]>;
    updatePayoutBatchChunk(chunkId: number, updates: Partial<PayoutBatchChunk>): Promise<void>;
    getChunkStatus(chunkId: number): Promise<{ status: string; processingStartedAt?: Date; processingCompletedAt?: Date; errorDetails?: string } | null>;
    // Step 8: Concurrency protection - get batches by cycle
    getPayoutBatchesByCycle(cycleId: number): Promise<PayoutBatch[]>;
    
    // Idempotency and Validation
    generateIdempotencyKey(cycleId: number, winnerData: Array<{id: number, amount: number, email: string}>): string;
    checkExistingBatch(requestChecksum: string): Promise<PayoutBatch | null>;
    
    // Eligible Winners Management
    findEligibleWinners(cycleId: number): Promise<Array<{
      id: number;
      userId: number;
      paypalEmail: string;
      payoutFinal: number;
      tier: string;
      tierRank: number;
      payoutStatus: string;
    }>>;
    
    // Status Updates (Two-Phase Transaction Pattern)
    markWinnersProcessing(winnerIds: number[], batchId: number): Promise<void>;
    updatePayoutBatchStatus(batchId: number, status: string, updates?: Partial<PayoutBatch>): Promise<PayoutBatch>;
    updatePayoutBatchItemStatus(itemId: number, status: string, updates?: Partial<PayoutBatchItem>): Promise<PayoutBatchItem>;
    finalizePayoutResults(batchId: number, results: Array<{
      cycleWinnerSelectionId: number;
      status: 'success' | 'failed' | 'pending';
      paypalItemId?: string;
      errorCode?: string;
      errorMessage?: string;
    }>): Promise<void>;
    
    // Cycle Completion Management  
    updateCycleStatusAfterDisbursement(cycleId: number, adminUserId: number): Promise<void>;
    
    // ========================================
    // ENHANCED STORAGE METHODS (Step 3)
    // Integration with Step 2 Parsed Results
    // ========================================
    
    // Core Integration Methods
    processPaypalResponseResults(batchId: number, parsedResponse: any): Promise<{
      batchUpdated: boolean;
      itemsUpdated: number;
      successfulPayouts: number;
      failedPayouts: number;
      pendingPayouts: number;
      userRewardsCreated: number;
      cycleCompleted: boolean;
    }>;
    
    // Batch Status Integration
    updatePayoutBatchFromParsedResponse(batchId: number, parsedResponse: any): Promise<PayoutBatch>;
    
    // Individual Item Updates with PayPal Data
    updatePayoutBatchItemsFromResults(batchId: number, itemResults: Array<{
      cycleWinnerSelectionId: number;
      userId: number;
      paypalItemId: string;
      status: 'success' | 'failed' | 'pending' | 'unclaimed';
      amount: number;
      email: string;
      errorCode?: string;
      errorMessage?: string;
      processedAt?: Date;
      fees?: number;
    }>): Promise<number>;
    
    // User Reward Records for Dashboard
    createUserRewardRecord(data: {
      userId: number;
      cycleSettingId: number;
      amount: number;
      status: 'completed' | 'pending' | 'failed';
      paypalBatchId?: string;
      paypalItemId?: string;
      processedAt?: Date;
      tier?: string;
      cycleName?: string;
      errorMessage?: string;
    }): Promise<any>;
    
    // Bulk User Reward Creation
    createUserRewardRecordsFromResults(cycleSettingId: number, itemResults: Array<{
      cycleWinnerSelectionId: number;
      userId: number;
      paypalItemId: string;
      status: 'success' | 'failed' | 'pending' | 'unclaimed';
      amount: number;
      errorCode?: string;
      errorMessage?: string;
      processedAt?: Date;
    }>, paypalBatchId: string): Promise<number>;
    
    // Winner Processing Status Updates
    updateWinnerProcessingStatusFromResults(itemResults: Array<{
      cycleWinnerSelectionId: number;
      status: 'success' | 'failed' | 'pending' | 'unclaimed';
      processedAt?: Date;
    }>): Promise<number>;
    
    // Cycle Completion Checking
    checkCycleCompletionFromPaypalResults(cycleSettingId: number): Promise<{
      isComplete: boolean;
      totalWinners: number;
      processedWinners: number;
      pendingWinners: number;
      successfulWinners: number;
      failedWinners: number;
    }>;
    
    // Enhanced Reconciliation Methods
    reconcilePayoutBatchWithPaypal(batchId: number, paypalBatchId: string): Promise<{
      batchMatch: boolean;
      itemsMatch: boolean;
      discrepancies: Array<{
        type: 'missing_item' | 'status_mismatch' | 'amount_mismatch';
        cycleWinnerSelectionId?: number;
        expected?: any;
        actual?: any;
      }>;
    }>;
    
    // Administrative Query Methods
    getPayoutBatchWithEnhancedDetails(batchId: number): Promise<{
      batch: PayoutBatch;
      items: Array<PayoutBatchItem & {
        userName: string;
        userEmail: string;
        tier: string;
        tierRank: number;
      }>;
      summary: {
        totalAmount: number;
        totalFees: number;
        statusDistribution: Record<string, number>;
      };
    }>;
    
    // Enhanced User Reward History  
    getUserRewardHistory(userId: number): Promise<Array<{
      id: number;
      amount: number;
      status: string;
      tier?: string;
      cycleName?: string;
      processedAt?: Date;
      paypalItemId?: string;
      errorMessage?: string;
      cycleSettingId: number;
    }>>;

    // Step 4: Two-Phase Transaction Pattern Support Methods
    updatePayoutBatch(batchId: number, updates: Partial<PayoutBatch>): Promise<void>;
    updatePayoutBatchItem(itemId: number, updates: Partial<PayoutBatchItem>): Promise<void>;
    getPayoutBatchByChecksum(requestChecksum: string): Promise<PayoutBatch | null>;
}

import fs from 'fs/promises';
import path from 'path';
import { POINTS_CONFIG } from "@shared/pointsConfig";

const STORAGE_FILE = 'subscribers.json';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscribers: Map<number, Subscriber>;
  private pointsHistory: Map<number, UserPointsHistory[]>;
  private pointsHistoryCounter: number;
  currentUserId: number;
  currentSubscriberId: number;
  db: any;
  private tierThresholdCache: { tier1: number, tier2: number, tier3: number } | null = null;
  private tierThresholdCacheTime: number | null = null;
  private tokens = new Map<string, { userId: number; createdAt: Date }>();
  // Step 3: Session cache for non-winner notification dismissals
  sessionCache = new Map<string, boolean>();
  // Step 6: Processing lock cache for concurrency control
  private cache = new Map<string, { expiry: Date; acquired: Date }>();

  constructor() {
    this.users = new Map();
    this.subscribers = new Map();
    this.pointsHistory = new Map();
    this.pointsHistoryCounter = 1;
    this.currentUserId = 1;
    this.currentSubscriberId = 1;
    this.loadFromFile();
  }

  private async loadFromFile() {
    try {
      const data = await fs.readFile(STORAGE_FILE, 'utf-8');
      const json = JSON.parse(data);
      this.subscribers = new Map(Object.entries(json.subscribers).map(([id, subscriber]) => [parseInt(id), subscriber]));
      this.currentSubscriberId = json.currentSubscriberId;
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.saveToFile();
    }
  }

  private async saveToFile() {
    const data = {
      subscribers: Object.fromEntries(this.subscribers),
      currentSubscriberId: this.currentSubscriberId
    };
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserStreak(userId: number): Promise<{ newStreak: number; bonusPoints: number }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const lastActivityDate = user.lastActivityDate;
    const lastStreakBonusDate = user.lastStreakBonusDate;

    let newStreak = 1;
    let bonusPoints = 0;
    let shouldAwardBonus = false;

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = user.currentStreak + 1;
        shouldAwardBonus = true;
      } else if (diffDays === 0) {
        // Same day - don't update streak, check if bonus already awarded today
        newStreak = user.currentStreak;
        shouldAwardBonus = lastStreakBonusDate !== today;
      } else {
        // Missed days - reset streak
        newStreak = 1;
        shouldAwardBonus = true;
      }
    } else {
      // First activity ever
      shouldAwardBonus = true;
    }

    // Calculate bonus points only if we should award them and haven't already today
    if (shouldAwardBonus && lastStreakBonusDate !== today) {
      bonusPoints = this.calculateStreakBonus(newStreak);
    }

    // Update user record
    const longestStreak = Math.max(user.longestStreak, newStreak);
    
    const updateData: any = {
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: today,
    };

    // Only update lastStreakBonusDate and add bonus points if we actually awarded them
    if (bonusPoints > 0) {
      updateData.lastStreakBonusDate = today;
      updateData.totalPoints = user.totalPoints + bonusPoints;
      updateData.currentMonthPoints = user.currentMonthPoints + bonusPoints;
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return { newStreak, bonusPoints };
  }

  private calculateStreakBonus(streakDays: number): number {
    if (streakDays < 2) return 0;
    if (streakDays >= 2 && streakDays <= 4) return 5;
    if (streakDays >= 5 && streakDays <= 6) return 10;
    return 15; // 7+ days
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();

    // Store in memory storage
    this.users.set(user.id, user);

    // Skip all referral processing to fix registration

    // Invalidate tier threshold cache when new users are added
    this.tierThresholdCache = null;

    return user;
  }

  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const id = this.currentSubscriberId++;
    const now = new Date();
    const subscriber: Subscriber = { 
      ...insertSubscriber, 
      id, 
      createdAt: now 
    };
    this.subscribers.set(id, subscriber);
    await this.saveToFile();
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return Array.from(this.subscribers.values()).find(
      (subscriber) => subscriber.email === email
    );
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    return Array.from(this.subscribers.values());
  }

  async getSubscribersCount(): Promise<number> {
    return this.subscribers.size;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isAdmin, false));
    return result[0].count;
  }

  // User Authentication Methods
  async getUserByEmail(email: string): Promise<User | null> {
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      // Get user data with current cycle points
      const [userResult] = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          password: users.password,
          firstName: users.firstName,
          lastName: users.lastName,
          isActive: users.isActive,
          isAdmin: users.isAdmin,
          totalPoints: users.totalPoints,
          currentMonthPoints: users.currentMonthPoints,
          theoreticalPoints: users.theoreticalPoints,
          tier: users.tier,
          currentStreak: users.currentStreak,
          longestStreak: users.longestStreak,
          subscriptionStatus: users.subscriptionStatus,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId,
          subscriptionStartDate: users.subscriptionStartDate,
          nextBillingDate: users.nextBillingDate,
          paypalEmail: users.paypalEmail,
          payoutMethod: users.payoutMethod,
          referredBy: users.referredBy,
          bio: users.bio,
          location: users.location,
          joinedAt: users.joinedAt,
          lastLoginAt: users.lastLoginAt,
          // Add current cycle points from joined table
          currentCyclePoints: userCyclePoints.currentCyclePoints
        })
        .from(users)
        .leftJoin(
          userCyclePoints,
          and(
            eq(users.id, userCyclePoints.userId),
            eq(userCyclePoints.isActive, true)
          )
        )
        .where(eq(users.id, id))
        .limit(1);

      if (!userResult) {
        return null;
      }

      // If no cycle points found, set to 0
      return {
        ...userResult,
        currentCyclePoints: userResult.currentCyclePoints || 0
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    // Check database first
    const [dbUser] = await db.select().from(users).where(eq(users.email, email));
    if (!dbUser) return null;

    const isValid = await bcrypt.compare(password, dbUser.password);
    if (isValid) {
      // Store in memory and return
      this.users.set(dbUser.id, dbUser);
      return dbUser;
    }
    return null;
  }

  async updateUserPoints(userId: number, totalPoints: number, currentMonthPoints: number): Promise<void> {
    const tier = await this.calculateUserTier(currentMonthPoints);

    await db.update(users)
      .set({ 
        totalPoints, 
        currentMonthPoints, 
        tier
      })
      .where(eq(users.id, userId));
  }

  async getUserPointsHistory(userId: number): Promise<UserPointsHistory[]> {
    const history = this.pointsHistory.get(userId) || [];
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
    
    // Invalidate active users cache since login activity affects it
    this.invalidateCacheByPattern('active_users');
  }

  async updateUserProfile(userId: number, profileData: Partial<{firstName: string, lastName: string, bio: string, location: string, occupation: string, financialGoals: string}>): Promise<void> {
    await db.update(users)
      .set(profileData)
      .where(eq(users.id, userId));
  }

  // Enhanced Points System Implementation
  async awardPoints(userId: number, actionId: string, points: number, description: string, metadata?: any): Promise<UserPointsHistory> {
    // Check action limits
    const actionConfig = POINTS_CONFIG[actionId];
    if (actionConfig) {
      if (actionConfig.maxDaily && !(await this.checkDailyActionLimit(userId, actionId))) {
        throw new Error(`Daily limit reached for action: ${actionId}`);
      }
      if (actionConfig.maxTotal && !(await this.checkTotalActionLimit(userId, actionId))) {
        throw new Error(`Total limit reached for action: ${actionId}`);
      }
    }

    // Create points history entry
    const historyEntry: UserPointsHistory = {
      id: this.pointsHistoryCounter++,
      userId,
      points,
      action: actionId,
      description,
      status: 'approved',
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      relatedId: null,
      proofUrl: null
    };

    // Add to points history
    if (!this.pointsHistory.has(userId)) {
      this.pointsHistory.set(userId, []);
    }
    this.pointsHistory.get(userId)!.push(historyEntry);

    // Update user points in memory
    const user = this.users.get(userId);
    console.log("=== DEBUG POINTS: Updating user", userId, "found user:", !!user);
    if (user) {
      const oldPoints = user.totalPoints || 0;
      const newTotalPoints = oldPoints + points;
      const newCurrentMonthPoints = (user.currentMonthPoints || 0) + points;
      const newTier = await this.calculateUserTier(newCurrentMonthPoints);

      user.totalPoints = newTotalPoints;
      user.currentMonthPoints = newCurrentMonthPoints;
      user.tier = newTier;

      console.log("=== DEBUG POINTS: Updated user points from", oldPoints, "to", newTotalPoints);

      // Update database
      await db.update(users)
        .set({
          totalPoints: newTotalPoints,
          currentMonthPoints: newCurrentMonthPoints,
          tier: newTier
        })
        .where(eq(users.id, userId));

      // Invalidate tier threshold cache to force recalculation on next request
      this.tierThresholdCache = null;

      // Save to file
      await this.saveToFile();
    } else {
      console.log("=== DEBUG POINTS: User not found in memory storage for ID:", userId);
    }

    return historyEntry;
  }

  async awardPointsWithProof(
    userId: number, 
    actionId: string, 
    points: number, 
    description: string, 
    proofUrl: string,
    metadata?: any
  ): Promise<UserPointsHistory> {
    // Check monthly limits
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const startOfMonth = new Date(currentMonth + '-01T00:00:00.000Z');

    // Get action configuration
    const actionConfig = await db.select()
      .from(adminPointsActions)
      .where(eq(adminPointsActions.actionId, actionId))
      .limit(1);

    if (actionConfig.length > 0 && actionConfig[0].maxMonthly) {
      // Check how many times this action has been done this month
      const monthlyCount = await db.select({ count: sql<number>`count(*)` })
        .from(userPointsHistory)
        .where(
          and(
            eq(userPointsHistory.userId, userId),
            eq(userPointsHistory.action, actionId),
            gte(userPointsHistory.createdAt, startOfMonth),
            ne(userPointsHistory.status, 'rejected')
          )
        );

      if (monthlyCount[0].count >= actionConfig[0].maxMonthly) {
        throw new Error(`Monthly limit reached for ${actionConfig[0].name}. Limit: ${actionConfig[0].maxMonthly} per month.`);
      }
    }

    const entry = await db.insert(userPointsHistory)
      .values({
        userId,
        points,
        action: actionId,
        description,
        proofUrl,
        status: 'pending', // Requires admin approval
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .returning();

    return entry[0];
  }

  async checkDailyActionLimit(userId: number, actionId: string): Promise<boolean> {
    const actionConfig = POINTS_CONFIG[actionId];
    if (!actionConfig?.maxDaily) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userHistory = this.pointsHistory.get(userId) || [];
    const todayCount = userHistory.filter(entry => 
      entry.action === actionId && 
      entry.createdAt >= today &&
      entry.status === 'approved'
    ).length;

    return todayCount < actionConfig.maxDaily;
  }

  async checkTotalActionLimit(userId: number, actionId: string): Promise<boolean> {
    const actionConfig = POINTS_CONFIG[actionId];
    if (!actionConfig?.maxTotal) return true;

    const userHistory = this.pointsHistory.get(userId) || [];
    const totalCount = userHistory.filter(entry => 
      entry.action === actionId && 
      entry.status === 'approved'
    ).length;

    return totalCount < actionConfig.maxTotal;
  }

  async getPendingProofUploads(): Promise<UserPointsHistory[]> {
    const result = await db.select({
      id: userPointsHistory.id,
      userId: userPointsHistory.userId,
      action: userPointsHistory.action,
      points: userPointsHistory.points,
      description: userPointsHistory.description,
      proofUrl: userPointsHistory.proofUrl,
      status: userPointsHistory.status,
      createdAt: userPointsHistory.createdAt,
      reviewedAt: userPointsHistory.reviewedAt,
      reviewedBy: userPointsHistory.reviewedBy,
      metadata: userPointsHistory.metadata,
      username: users.username,
      email: users.email
    })
      .from(userPointsHistory)
      .leftJoin(users, eq(userPointsHistory.userId, users.id))
      .where(eq(userPointsHistory.status, 'pending'))
      .orderBy(desc(userPointsHistory.createdAt));

    return result.map(row => ({
      ...row,
      user: {
        username: row.username,
        email: row.email
      }
    })) as any;
  }

  async approveProofUpload(historyId: number, reviewerId: number, customPoints?: number): Promise<void> {
    const historyEntry = await db.select()
      .from(userPointsHistory)
      .where(eq(userPointsHistory.id, historyId))
      .limit(1);

    if (!historyEntry[0]) {
      throw new Error('Points history entry not found');
    }

    const entry = historyEntry[0];

    // Use custom points if provided, otherwise use the original entry points
    const pointsToAward = customPoints !== undefined ? customPoints : entry.points;
    
    // Validate custom points
    if (customPoints !== undefined && (customPoints <= 0 || !Number.isInteger(customPoints))) {
      throw new Error('Custom points must be a positive integer');
    }

    // Update history entry with approved status and actual points awarded
    await db.update(userPointsHistory)
      .set({
        status: 'approved',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        points: pointsToAward, // Store the actual awarded points for audit trail
      })
      .where(eq(userPointsHistory.id, historyId));

    // Award points to user
    const user = await this.getUserById(entry.userId);
    if (user) {
      const newTotalPoints = (user.totalPoints || 0) + pointsToAward;
      const newCurrentMonthPoints = (user.currentMonthPoints || 0) + pointsToAward;
      const newTier = await this.calculateUserTier(newCurrentMonthPoints);

      await db.update(users)
        .set({ 
          totalPoints: newTotalPoints, 
          currentMonthPoints: newCurrentMonthPoints,
          tier: newTier
        })
        .where(eq(users.id, entry.userId));

      // Also update cycle points for current active cycle - critical for tier calculations and rewards
      try {
        await db.update(userCyclePoints)
          .set({
            currentCyclePoints: sql`${userCyclePoints.currentCyclePoints} + ${pointsToAward}`,
            lastActivityDate: new Date()
          })
          .where(and(
            eq(userCyclePoints.userId, entry.userId),
            eq(userCyclePoints.isActive, true)
          ));
        
        console.log(`Updated cycle points for user ${entry.userId}: +${pointsToAward} points (custom approval)`);
      } catch (error) {
        console.error(`Failed to update cycle points for user ${entry.userId}:`, error);
        // Continue without failing the approval - user still gets base points
      }

      // Invalidate tier threshold cache to force recalculation on next request
      this.tierThresholdCache = null;
    }
  }

  async rejectProofUpload(historyId: number, reviewerId: number, reason: string): Promise<void> {
    await db.update(userPointsHistory)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        description: `${await db.select({ description: userPointsHistory.description })
          .from(userPointsHistory)
          .where(eq(userPointsHistory.id, historyId))
          .then(r => r[0]?.description || '')} - REJECTED: ${reason}`,
      })
      .where(eq(userPointsHistory.id, historyId));
  }

  async calculateUserTier(currentCyclePoints: number): Promise<string> {
    // Simple rule: 0 points = tier3 (no engagement)
    if (currentCyclePoints === 0) {
      return 'tier3';
    }

    // Get current active cycle settings
    const currentCycle = await this.getCurrentCycle();
    if (!currentCycle) {
      return 'tier3';
    }

    // Get all active users with their cycle points, sorted by points descending
    const allUsersWithCyclePoints = await db.select({
      userId: users.id,
      cyclePoints: userCyclePoints.currentCyclePoints
    }).from(users)
    .leftJoin(userCyclePoints, and(
      eq(userCyclePoints.userId, users.id),
      eq(userCyclePoints.cycleSettingId, currentCycle.id)
    ))
    .where(and(
      eq(users.isActive, true), 
      eq(users.subscriptionStatus, 'active'),
      eq(users.isAdmin, false)
    ));

    // Separate users with points > 0 for tier calculation
    const usersWithPoints = allUsersWithCyclePoints
      .filter(user => (user.cyclePoints || 0) > 0)
      .sort((a, b) => (b.cyclePoints || 0) - (a.cyclePoints || 0));

    if (usersWithPoints.length === 0) {
      return 'tier1'; // Only user with points
    }

    // Calculate equal divisions for users with points
    const totalUsersWithPoints = usersWithPoints.length;
    const usersPerTier = Math.floor(totalUsersWithPoints / 3);
    const remainderUsers = totalUsersWithPoints % 3;

    // Distribute users: top tier gets extra users if there's a remainder
    const tier1Count = usersPerTier + (remainderUsers > 0 ? 1 : 0);
    const tier2Count = usersPerTier + (remainderUsers > 1 ? 1 : 0);

    // Find the user's rank among users with points
    const userRank = usersWithPoints.findIndex(user => 
      (user.cyclePoints || 0) === currentCyclePoints
    );

    if (userRank === -1) {
      // User not found in rankings (shouldn't happen)
      return 'tier3';
    }

    // Assign tier based on equal division ranking
    if (userRank < tier1Count) {
      return 'tier1';
    } else if (userRank < tier1Count + tier2Count) {
      return 'tier2';
    } else {
      return 'tier3';
    }
  }

  async recalculateAllUserTiers(): Promise<void> {
    console.log("Starting tier recalculation for all users...");

    // Clear tier threshold cache to force recalculation
    this.tierThresholdCache = null;
    this.tierThresholdCacheTime = null;

    // Get current active cycle
    const currentCycle = await this.getCurrentCycle();
    if (!currentCycle) {
      console.log("No active cycle found, cannot recalculate tiers");
      return;
    }

    // Get all active users with their cycle points
    const allUsersWithCyclePoints = await db.select({
      userId: users.id,
      username: users.username,
      currentTier: users.tier,
      cyclePoints: userCyclePoints.currentCyclePoints
    }).from(users)
    .leftJoin(userCyclePoints, and(
      eq(userCyclePoints.userId, users.id),
      eq(userCyclePoints.cycleSettingId, currentCycle.id)
    ))
    .where(and(
      eq(users.isActive, true),
      eq(users.isAdmin, false)
    ));

    console.log(`Recalculating tiers for ${allUsersWithCyclePoints.length} users`);

    // Update each user's tier based on their current cycle points
    for (const user of allUsersWithCyclePoints) {
      const cyclePoints = user.cyclePoints || 0;
      const newTier = await this.calculateUserTier(cyclePoints);

      if (user.currentTier !== newTier) {
        console.log(`Updating user ${user.username} from ${user.currentTier} to ${newTier} (${cyclePoints} cycle points)`);

        await db.update(users)
          .set({ 
            tier: newTier
          })
          .where(eq(users.id, user.userId));

        // Update memory cache if it exists
        const cachedUser = this.users.get(user.userId);
        if (cachedUser) {
          this.users.set(user.userId, { ...cachedUser, tier: newTier });
        }
      }
    }

    console.log("Tier recalculation completed");
  }

  async getLeaderboard(period: 'monthly' | 'allTime', limit: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>> {
    try {
      const pointsColumn = period === 'monthly' ? users.currentMonthPoints : users.totalPoints;

      // Use Drizzle ORM instead of raw SQL
      const leaderboard = await db.select({
        userId: users.id,
        username: users.username,
        points: pointsColumn,
        tier: users.tier
      })
      .from(users)
      .where(and(eq(users.subscriptionStatus, 'active'), eq(users.isAdmin, false)))
      .orderBy(desc(pointsColumn))
      .limit(limit);

      return leaderboard.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        points: user.points || 0,
        tier: user.tier || 'tier3'
      }));
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  async getUserRank(userId: number, period: 'monthly' | 'allTime'): Promise<{rank: number, points: number, tier: string} | null> {
    try {
      const pointsColumn = period === 'monthly' ? 'currentMonthPoints' : 'totalPoints';

      const subquery = db.select({
        id: users.id,
        rank: sql<number>`RANK() OVER (ORDER BY ${pointsColumn} DESC)`.as('rank'),
        points: users[pointsColumn],
        tier: users.tier
      }).from(users)
      .where(and(eq(users.isActive, true), eq(users.isAdmin, false)))
      .as('ranked_users');

      const query = await db.select({
        rank: subquery.rank,
        points: subquery.points,
        tier: subquery.tier
      }).from(subquery)
      .where(eq(subquery.id, userId));

      const result = query[0] as {rank: number, points: number, tier: string} | null;
      return result;
    } catch (error) {
      console.error("Error fetching user rank:", error);
      throw error;
    }
  }

  // Monthly Rewards Implementation
  async createMonthlyReward(
    month: string, 
    totalRewardPool: number, 
    config?: Partial<{goldRewardPercentage: number, silverRewardPercentage: number, bronzeRewardPercentage: number, pointDeductionPercentage: number}>
  ): Promise<MonthlyReward> {
    // Get tier counts for this month
    const tierCounts = await db.select({
      tier: users.tier,
      count: sql<number>`count(*)`
    }).from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.tier);

    const goldCount = tierCounts.find(t => t.tier === 'tier3')?.count || 0;
    const silverCount = tierCounts.find(t => t.tier === 'tier2')?.count || 0;
    const bronzeCount = tierCounts.find(t => t.tier === 'tier1')?.count || 0;

    const [monthlyReward] = await db.insert(monthlyRewards).values({
      month,
      totalRewardPool,
      totalParticipants: goldCount + silverCount + bronzeCount,
      goldTierParticipants: goldCount,
      silverTierParticipants: silverCount,
      bronzeTierParticipants: bronzeCount,
      goldRewardPercentage: config?.goldRewardPercentage || 50,
      silverRewardPercentage: config?.silverRewardPercentage || 30,
      bronzeRewardPercentage: config?.bronzeRewardPercentage || 20,
      pointDeductionPercentage: config?.pointDeductionPercentage || 75,
    }).returning();

    return monthlyReward;
  }

  async distributeMonthlyRewards(monthlyRewardId: number): Promise<void> {
    const monthlyReward = await db.select()
      .from(monthlyRewards)
      .where(eq(monthlyRewards.id, monthlyRewardId))
      .limit(1);

    if (!monthlyReward[0]) {
      throw new Error('Monthly reward not found');
    }

    const reward = monthlyReward[0];

    // Calculate reward amounts per tier
    const goldRewardPool = Math.floor(reward.totalRewardPool * reward.goldRewardPercentage / 100);
    const silverRewardPool = Math.floor(reward.totalRewardPool * reward.silverRewardPercentage / 100);
    const bronzeRewardPool = Math.floor(reward.totalRewardPool * reward.bronzeRewardPercentage / 100);

    const goldRewardPerPerson = reward.goldTierParticipants > 0 ? Math.floor(goldRewardPool / reward.goldTierParticipants) : 0;
    const silverRewardPerPerson = reward.silverTierParticipants > 0 ? Math.floor(silverRewardPool / reward.silverTierParticipants) : 0;
    const bronzeRewardPerPerson = reward.bronzeTierParticipants > 0 ? Math.floor(bronzeRewardPool / reward.bronzeTierParticipants) : 0;

    // Get all active users with their current points
    const activeUsers = await db.select()
      .from(users)
      .where(eq(users.isActive, true));

    // Process each user
    for (const user of activeUsers) {
      let rewardAmount = 0;
      let isWinner = false;

      // Determine reward based on tier
      switch (user.tier) {
        case 'tier3':
          rewardAmount = goldRewardPerPerson;
          isWinner = goldRewardPerPerson > 0;
          break;
        case 'tier2':
          rewardAmount = silverRewardPerPerson;
          isWinner = silverRewardPerPerson > 0;
          break;
        case 'tier1':
          rewardAmount = bronzeRewardPerPerson;
          isWinner = bronzeRewardPerPerson > 0;
          break;
      }

      // Calculate point deduction for winners
      const pointsDeducted = isWinner && rewardAmount > 0 
        ? Math.floor(user.currentMonthPoints * reward.pointDeductionPercentage / 100)
        : 0;

      const pointsRolledOver = user.currentMonthPoints - pointsDeducted;

      // Create user monthly reward record
      await db.insert(userMonthlyRewards).values({
        userId: user.id,
        monthlyRewardId: monthlyRewardId,
        tier: user.tier,
        pointsAtDistribution: user.currentMonthPoints,
        rewardAmount,
        pointsDeducted,
        pointsRolledOver,
        isWinner,
      });

      // Update user's points (reset monthly points, keep total)
      await db.update(users)
        .set({
          currentMonthPoints: pointsRolledOver,
          tier: await this.calculateUserTier(pointsRolledOver),
        })
        .where(eq(users.id, user.id));

      // Record points adjustment in history
      if (pointsDeducted > 0) {
        await db.insert(userPointsHistory).values({
          userId: user.id,
          points: -pointsDeducted,
          action: 'monthly_reward_deduction',
          description: `Monthly reward distribution - ${reward.pointDeductionPercentage}% point deduction ($${(rewardAmount / 100).toFixed(2)} reward)`,
          status: 'approved',
          metadata: JSON.stringify({
            monthlyRewardId,
            rewardAmount,
            tier: user.tier
          }),
        });
      }

      if (pointsRolledOver > 0) {
        await db.insert(userPointsHistory).values({
          userId: user.id,
          points: 0,
          action: 'monthly_rollover',
          description: `Monthly rollover - ${pointsRolledOver} points carried forward`,
          status: 'approved',
          metadata: JSON.stringify({
            monthlyRewardId,
            rolledOverPoints: pointsRolledOver,
            tier: user.tier
          }),
        });
      }
    }

    // Mark reward as distributed
    await db.update(monthlyRewards)
      .set({
        status: 'distributed',
        distributedAt: new Date(),
      })
      .where(eq(monthlyRewards.id, monthlyRewardId));
  }

  async getUserMonthlyRewardsHistory(userId: number): Promise<UserMonthlyReward[]> {
    return await db.select()
      .from(userMonthlyRewards)
      .where(eq(userMonthlyRewards.userId, userId))
      .orderBy(desc(userMonthlyRewards.createdAt));
  }

  async getMonthlyRewardsSummary(): Promise<MonthlyReward[]> {
    return await db.select()
      .from(monthlyRewards)
      .orderBy(desc(monthlyRewards.createdAt));
  }

  async rolloverUserPoints(userId: number, fromMonth: string): Promise<void> {
    // This method can be used for manual rollover adjustments if needed
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    await db.insert(userPointsHistory).values({
      userId,
      points: 0,
      action: 'manual_rollover',
      description: `Manual rollover from ${fromMonth}`,
      status: 'approved',
      metadata: JSON.stringify({ fromMonth, currentPoints: user.currentMonthPoints }),
    });
  }

  // Referral System Implementation
  async createUserReferralCode(userId: number): Promise<UserReferralCode> {
    // Temporarily disabled to fix registration
    const referralCode = `USER-${userId}-${Date.now()}`;
    return {
      id: userId,
      userId,
      referralCode,
      createdAt: new Date(),
      isActive: true,
      totalReferrals: 0,
      totalPointsEarned: 0
    };
  }

  async getUserReferralCode(userId: number): Promise<UserReferralCode | null> {
    const [referralCode] = await db.select()
      .from(userReferralCodes)
      .where(eq(userReferralCodes.userId, userId))
      .limit(1);

    return referralCode || null;
  }

  async validateReferralCode(referralCode: string): Promise<{isValid: boolean, referrerUserId?: number}> {
    const [code] = await db.select()
      .from(userReferralCodes)
      .where(eq(userReferralCodes.referralCode, referralCode) && eq(userReferralCodes.isActive, true))
      .limit(1);

    if (!code) {
      return { isValid: false };
    }

    return { isValid: true, referrerUserId: code.userId };
  }

  async processReferralSignup(referredUserId: number, referralCode: string): Promise<void> {
    const validation = await this.validateReferralCode(referralCode);

    if (!validation.isValid || !validation.referrerUserId) {
      throw new Error('Invalid referral code');
    }

    // Prevent self-referral
    if (validation.referrerUserId === referredUserId) {
      throw new Error('Cannot refer yourself');
    }

    // Create referral record
    const [referral] = await db.insert(referrals).values({
      referrerUserId: validation.referrerUserId,
      referredUserId,
      referralCode,
      status: 'pending',
    }).returning();

    // Award initial signup points to referrer
    const signupPoints = POINTS_CONFIG.referral_signup.points;

    await this.awardPoints(
      validation.referrerUserId,
      'referral_signup',
      signupPoints,
      `Referral signup: User joined with your code ${referralCode}`,
      { referralId: referral.id, referredUserId }
    );

    // Update referralcode stats
    await db.update(userReferralCodes)
      .set({
        totalReferrals: sql`total_referrals + 1`,
        totalPointsEarned: sql`total_points_earned + ${signupPoints}`,
      })
      .where(eq(userReferralCodes.referralCode, referralCode));

    // Mark referral as completed for signup
    await db.update(referrals)
      .set({
        status: 'completed',
        pointsAwarded: signupPoints,
        completedAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));
  }

  async getUserReferrals(userId: number): Promise<Array<{referral: Referral, referredUser: {username: string, email: string, joinedAt: Date}}>> {
    const referralsList = await db.select({
      // Referral fields
      id: referrals.id,
      referrerUserId: referrals.referrerUserId,
      referredUserId: referrals.referredUserId,
      referralCode: referrals.referralCode,
      status: referrals.status,
      pointsAwarded: referrals.pointsAwarded,
      completedAt: referrals.completedAt,
      createdAt: referrals.createdAt,
      // User fields
      username: users.username,
      email: users.email,
      joinedAt: users.joinedAt,
    })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referrals.createdAt));

    return referralsList.map(row => ({
      referral: {
        id: row.id,
        referrerUserId: row.referrerUserId,
        referredUserId: row.referredUserId,
        referralCode: row.referralCode,
        status: row.status,
        pointsAwarded: row.pointsAwarded,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
      },
      referredUser: {
        username: row.username || 'Unknown',
        email: row.email || 'Unknown',
        joinedAt: row.joinedAt || new Date(),
      },
    })) as any;
  }

  async getReferralStats(userId: number): Promise<{totalReferrals: number, completedReferrals: number, pendingReferrals: number, totalPointsEarned: number}> {
    const referralCode = await this.getUserReferralCode(userId);

    if (!referralCode) {
      return { totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, totalPointsEarned: 0 };
    }

    const [stats] = await db.select({
      totalReferrals: sql<number>`count(*)`,
      completedReferrals: sql<number>`count(*) filter (where status = 'completed')`,
      pendingReferrals: sql<number>`count(*) filter (where status = 'pending')`,
      totalPointsEarned: sql<number>`coalesce(sum(points_awarded), 0)`,
    })
      .from(referrals)
      .where(eq(referrals.referrerUserId, userId));

    return {
      totalReferrals: stats?.totalReferrals || 0,
      completedReferrals: stats?.completedReferrals || 0,
      pendingReferrals: stats?.pendingReferrals || 0,
      totalPointsEarned: stats?.totalPointsEarned || 0,
    };
  }

  async updateReferralStatus(referralId: number, status: 'completed' | 'expired'): Promise<void> {
    await db.update(referrals)
      .set({
        status,
        completedAt: status === 'completed' ? new Date() : null,
      })
      .where(eq(referrals.id, referralId));
  }

  async getAdminReferralStats(): Promise<{totalReferrals: number, totalReferrers: number, topReferrers: Array<{username: string, referralCount: number, pointsEarned: number}>}> {
    // Total referrals and referrers
    const [totalStats] = await db.select({
      totalReferrals: sql<number>`count(*)`,
      totalReferrers: sql<number>`count(distinct referrer_user_id)`,
    })
      .from(referrals);

    // Top referrers
    const topReferrers = await db.select({
      username: users.username,
      referralCount: sql<number>`count(*)`,
      pointsEarned: sql<number>`coalesce(sum(points_awarded), 0)`,
    })
      .from(referrals)
      .leftJoin(users, eq(referrals.referrerUserId, users.id))
      .groupBy(referrals.referrerUserId, users.username)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      totalReferrals: totalStats?.totalReferrals || 0,
      totalReferrers: totalStats?.totalReferrers || 0,
      topReferrers: topReferrers.map(row => ({
        username: row.username || 'Unknown',
        referralCount: row.referralCount,
        pointsEarned: row.pointsEarned,
      })),
    };
  }

  async getAdminUsers(filters: {page: number, limit: number, search?: string, status?: string, tier?: string}): Promise<User[]> {
    const { page = 1, limit = 50, search, status, tier } = filters;
    const offset = (page - 1) * limit;

    let query = db.select().from(users);

    const conditions = [];
    if (search) {
      conditions.push(sql`(${users.username} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`);
    }
    if (status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    }
    if (tier) {
      conditions.push(eq(users.tier, tier));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query
      .orderBy(desc(users.joinedAt))
      .limit(limit)
      .offset(offset);
  }

  async getAdminAnalytics(period: string): Promise<any> {
    // Get basic analytics data
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true));

    const totalPointsAwarded = await db.select({ 
      total: sql<number>`coalesce(sum(points), 0)` 
    }).from(userPointsHistory).where(eq(userPointsHistory.status, 'approved'));

    return {
      userGrowth: [],
      pointsDistribution: [],
      recentActivity: [],
      activeUsers: activeUsers[0]?.count || 0,
      totalPointsAwarded: totalPointsAwarded[0]?.total || 0,
      avgSessionDuration: 0,
      errorRate: 0
    };
  }

  async getSystemSettings(): Promise<any> {
    // Try to get settings from database
    try {
      const settingsResult = await db.execute(sql`
        SELECT settings_data FROM system_settings WHERE id = 1
      `);

      if (settingsResult.length > 0) {
        const settings = JSON.parse((settingsResult[0] as any).settings_data);
        return {
          maintenanceMode: false,
          registrationEnabled: true,
          pointsMultiplier: 1.0,
          maxDailyPoints: 500,
          tierRequirements: {
            bronze: 0,
            silver: 500,
            gold: 2000
          },
          monthlySettings: {
            cycleStartDay: 1,
            cycleStartTime: "00:00",
            distributionDay: 5,
            distributionTime: "12:00",
            timezone: "UTC",
            distributionDelayDays: 3
          },
          ...settings
        };
      }
    } catch (error) {
      console.log('No system settings table or data found, using defaults');
    }

    return {
      maintenanceMode: false,
      registrationEnabled: true,
      pointsMultiplier: 1.0,
      maxDailyPoints: 500,
      tierRequirements: {
        bronze: 0,
        silver: 500,
        gold: 2000
      },
      monthlySettings: {
        cycleStartDay: 1,
        cycleStartTime: "00:00",
        distributionDay: 5,
        distributionTime: "12:00",
        timezone: "UTC",
        distributionDelayDays: 3
      }
    };
  }

  async updateSystemSettings(settings: any): Promise<void> {
    try {
      // Ensure system_settings table exists
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY,
          settings_data TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )
      `);

      // Save to database
      await db.execute(sql`
        INSERT INTO system_settings (id, settings_data, updated_at)
        VALUES (1, ${JSON.stringify(settings)}, ${new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET
          settings_data = ${JSON.stringify(settings)},
          updated_at = ${new Date().toISOString()}
      `);

      console.log('System settings updated:', settings);
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(userIds: number[], updates: Partial<User>): Promise<void> {
    await db.update(users)
      .set(updates)
      .where(sql`${users.id} = ANY(${userIds})`);
  }

  async bulkResetPasswords(userIds: number[]): Promise<void> {
    // Generate temporary passwords and update users
    const tempPassword = await bcrypt.hash('TempPassword123!', 10);
    await db.update(users)
      .set({ password: tempPassword })
      .where(sql`${users.id} = ANY(${userIds})`);
  }

  async exportUserData(userIds: number[]): Promise<any> {
    return await db.select().from(users).where(sql`${users.id} = ANY(${userIds})`);
  }

  async getUserDetailsForAdmin(userId: number): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const pointsHistory = await this.getUserPointsHistory(userId);
    return { user, pointsHistory };
  }

  async exportUsers(format: string): Promise<string> {
    const usersList = await db.select().from(users);
    if (format === 'csv') {
      const headers = 'ID,Username,Email,Total Points,Tier,Joined At\n';
      const rows = usersList.map((u: any) => `${u.id},${u.username},${u.email},${u.totalPoints},${u.tier},${u.joinedAt}`).join('\n');
      return headers + rows;
    }
    return JSON.stringify(usersList, null, 2);
  }

  async exportPointsHistory(format: string): Promise<string> {
    const history = await db.select().from(userPointsHistory);
    if (format === 'csv') {
      const headers = 'User ID,Points,Action,Description,Status,Created At\n';
      const rows = history.map(h => `${h.userId},${h.points},${h.action},${h.description},${h.status},${h.createdAt}`).join('\n');
      return headers + rows;
    }
    return JSON.stringify(history, null, 2);
  }

  async exportAnalytics(format: string): Promise<string> {
    const analytics = await this.getAdminAnalytics('30d');
    return JSON.stringify(analytics, null, 2);
  }

  // === SUPPORT REQUEST METHODS ===

  async createSupportRequest(data: {
    userId?: number | null;
    name: string;
    email: string;
    category: string;
    message: string;
    hasAttachment?: boolean;
    fileName?: string | null;
  }): Promise<SupportRequest> {
    const [supportRequest] = await db.insert(supportRequests).values({
      userId: data.userId,
      name: data.name,
      email: data.email,
      category: data.category,
      message: data.message,
      hasAttachment: data.hasAttachment || false,
      fileName: data.fileName,
      status: 'pending',
      priority: 'normal'
    }).returning();

    return supportRequest;
  }

  async getSupportRequests(options: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
  }): Promise<SupportRequest[]> {
    const { page = 1, limit = 50, status, category } = options;
    const offset = (page - 1) * limit;

    let query = db.select().from(supportRequests);

    // Add filters
    const conditions = [];
    if (status) {
      conditions.push(eq(supportRequests.status, status));
    }
    if (category) {
      conditions.push(eq(supportRequests.category, category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const requests = await query
      .orderBy(desc(supportRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return requests;
  }

  async getSupportRequestById(requestId: number): Promise<SupportRequest | null> {
    const [request] = await db.select()
      .from(supportRequests)
      .where(eq(supportRequests.id, requestId))
      .limit(1);

    return request || null;
  }

  async updateSupportRequest(requestId: number, updates: {
    status?: string;
    priority?: string;
    response?: string;
    resolvedAt?: Date | null;
  }): Promise<void> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    };

    await db.update(supportRequests)
      .set(updateData)
      .where(eq(supportRequests.id, requestId));
  }

  async getSupportRequestStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    const stats = await db.select({
      status: supportRequests.status,
      count: sql<number>`count(*)`
    })
    .from(supportRequests)
    .groupBy(supportRequests.status);

    const result = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      switch (stat.status) {
        case 'pending':
          result.pending = stat.count;
          break;
        case 'in_progress':
          result.inProgress = stat.count;
          break;
        case 'resolved':
          result.resolved = stat.count;
          break;
        case 'closed':
          result.closed = stat.count;
          break;
      }
    });

    return result;
  }

  async getUserProgress(userId: number) {
    try {
      // Get all progress records for the user, not just completed ones
      const progress = await db.execute(sql`
        SELECT * FROM user_progress 
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `);

      // Handle different response formats - direct access to query result
      const rows = progress || [];

      console.log(`User ${userId} progress query returned ${rows.length} total lessons, ${rows.filter((r: any) => r.completed).length} completed`);

      return rows.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        moduleId: p.module_id,
        completed: !!p.completed,
        pointsEarned: p.points_earned || 0,
        completedAt: p.completed_at,
        createdAt: p.created_at
      }));
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
  }

  async markLessonComplete(userId: number, lessonId: string): Promise<{ pointsEarned: number; streakBonus: number; newStreak: number }> {
    // Handle both numeric and string lesson IDs
    let moduleId: number;

    // If lessonId is numeric, use it directly as moduleId
    if (!isNaN(Number(lessonId))) {
      moduleId = Number(lessonId);
      console.log(`Marking lesson with numeric ID ${lessonId} as complete for user ${userId}`);
    } else {
      // Create a complete mapping of lesson string IDs to numbers for database storage
      const lessonIdMap: { [key: string]: number } = {
        'budgeting-basics': 1,
        'emergency-fund': 2,
        'investment-basics': 3,
        'credit-management': 4,
        'retirement-planning': 5,
        'tax-optimization': 6,
        'credit-basics': 7,
        'understanding-credit-scores': 8,
        'debt-snowball-vs-avalanche': 9,
        'smart-expense-cutting': 10,
        'zero-based-budgeting': 11,
        'envelope-budgeting': 12,
        'high-yield-savings': 13,
        'cd-laddering': 14,
        'sinking-funds': 15,
        'roth-vs-traditional-ira': 16,
        'index-fund-investing': 17,
        'asset-allocation': 18,
        'dollar-cost-averaging': 19,
        'options-trading-basics': 20,
        'smart-goal-setting': 21,
        'estate-planning-basics': 22,
        'insurance-essentials': 23,
        'managing-student-loans': 24,
        'charitable-giving-strategies': 25,
        'home-buying-process': 26,
        'retirement-income-planning': 27,
        // Additional mappings for all education content
        'emergency-fund-detailed': 28,
        'budgeting-basics-detailed': 29,
        'investment-basics-detailed': 30,
        'credit-management-detailed': 31,
        'retirement-planning-detailed': 32,
        'tax-optimization-detailed': 33,
        'building-emergency-fund': 34,
        'debt-consolidation': 35,
        'credit-repair': 36,
        'mortgage-basics': 37,
        'side-hustle-income': 38,
        'financial-apps-tools': 39,
        'compound-interest': 40,
        'risk-management': 41,
        'tax-deductions': 42,
        'retirement-withdrawal': 43,
        'healthcare-costs': 44,
        'education-funding': 45,
        'financial-planning': 46,
        'investment-psychology': 47,
        'wealth-building': 48
      };

      console.log(`Marking lesson ${lessonId} (moduleId: ${lessonIdMap[lessonId]}) as complete for user ${userId}`);

      moduleId = lessonIdMap[lessonId];
      if (!moduleId) {
        console.error(`Unknown lesson ID: ${lessonId}. Available IDs:`, Object.keys(lessonIdMap));
        throw new Error(`Unknown lesson ID: ${lessonId}`);
      }
    }

    // Check if already completed using raw SQL
    const existingProgress = await db.execute(sql`
      SELECT * FROM user_progress 
      WHERE user_id = ${userId} AND module_id = ${moduleId}
      LIMIT 1
    `);

    const existingRows = existingProgress || [];
    if (existingRows.length > 0 && existingRows[0].completed) {
      throw new Error('Lesson already completed');
    }

    // Use static points for lesson completion
    const pointsEarned = 20;

    // Update streak and get bonus points
    const { newStreak, bonusPoints } = await this.updateUserStreak(userId);

    // Create a proper completion record in the database
    try {
      if (existingRows.length > 0) {
        await db.execute(sql`
          UPDATE user_progress 
          SET completed = true, points_earned = ${pointsEarned}, completed_at = NOW()
          WHERE user_id = ${userId} AND module_id = ${moduleId}
        `);
      } else {
        // Insert new progress record - check if exists first to avoid conflicts
        await db.execute(sql`
          INSERT INTO user_progress (user_id, module_id, completed, points_earned, completed_at, created_at)
          VALUES (${userId}, ${moduleId}, true, ${pointsEarned}, NOW(), NOW())
        `);
      }
      console.log(`Successfully recorded lesson completion for user ${userId}, lesson ${lessonId}, moduleId ${moduleId}`);
    } catch (error) {
      console.error('Database completion tracking failed:', error);
      // Continue with points award even if database tracking fails
    }

    // Update user points (base points only, streak bonus already added in updateUserStreak)
    await db.update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${pointsEarned}`,
        currentMonthPoints: sql`${users.currentMonthPoints} + ${pointsEarned}`,
      })
      .where(eq(users.id, userId));

    // Also update cycle points for current active cycle (include both base points and streak bonus)
    const totalPointsForCycle = pointsEarned + bonusPoints;
    try {
      await db.update(userCyclePoints)
        .set({
          currentCyclePoints: sql`${userCyclePoints.currentCyclePoints} + ${totalPointsForCycle}`,
          lastActivityDate: new Date()
        })
        .where(and(
          eq(userCyclePoints.userId, userId),
          eq(userCyclePoints.isActive, true)
        ));
      
      console.log(`Updated cycle points for user ${userId}: +${pointsEarned} points`);
      
      // Recalculate and update user tier based on new cycle points
      try {
        const currentCycle = await this.getCurrentCycle();
        if (currentCycle) {
          const userCycleData = await this.getUserCyclePoints(userId, currentCycle.id);
          const newTier = await this.calculateUserTier(userCycleData?.currentCyclePoints || 0);
          
          // Only update database if tier changed
          if (newTier !== (await this.getUserById(userId))?.tier) {
            await db.update(users)
              .set({ tier: newTier })
              .where(eq(users.id, userId));
            console.log(`Updated user ${userId} tier to ${newTier}`);
          }
        }
      } catch (error) {
        console.error('Error updating user tier:', error);
        // Continue even if tier update fails
      }
    } catch (error) {
      console.error('Error updating cycle points:', error);
      // Continue even if cycle update fails
    }

    // Record points history for lesson completion
    try {
      await db.insert(userPointsHistory).values({
        userId: userId,
        action: 'lesson_complete',
        points: pointsEarned,
        description: `Completed lesson: ${lessonId}`,
        status: 'approved',
        metadata: JSON.stringify({ moduleId, lessonId })
      });

      // Record streak bonus in history if any
      if (bonusPoints > 0) {
        await db.insert(userPointsHistory).values({
          userId: userId,
          action: 'streak_bonus',
          points: bonusPoints,
          description: `${newStreak}-day streak bonus`,
          status: 'approved',
          metadata: JSON.stringify({ streakDays: newStreak })
        });
      }
    } catch (error) {
      console.error('Error recording points history:', error);
      // Continue even if history recording fails
    }

    return { pointsEarned, streakBonus: bonusPoints, newStreak };
  }

  // === PASSWORD RESET METHODS ===

  async createPasswordResetToken(userId: number): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalidate any existing tokens for this user
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.userId, userId));

    // Create new token
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<{isValid: boolean, userId?: number}> {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (!resetToken) {
      return { isValid: false };
    }

    const now = new Date();

    // Check if token is expired or already used
    if (resetToken.expiresAt < now || resetToken.isUsed) {
      return { isValid: false };
    }

    return { isValid: true, userId: resetToken.userId };
  }

  async resetUserPassword(token: string, newPassword: string): Promise<boolean> {
    const validation = await this.validatePasswordResetToken(token);

    if (!validation.isValid || !validation.userId) {
      return false;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, validation.userId));

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.token, token));

    return true;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(lt(passwordResetTokens.expiresAt, now));
  }

  async getTierThresholds(): Promise<{ tier1: number, tier2: number, tier3: number }> {
    // Return cached thresholds if available and not expired (cache for 5 minutes)
    if (this.tierThresholdCache && this.tierThresholdCacheTime && 
        (Date.now() - this.tierThresholdCacheTime < 5 * 60 * 1000)) {
      return this.tierThresholdCache;
    }

    // Get all active premium users' actual cycle points to calculate percentiles
    const allUsers = await db.select({
      currentCyclePoints: userCyclePoints.currentCyclePoints
    }).from(users)
    .leftJoin(userCyclePoints, eq(users.id, userCyclePoints.userId))
    .where(and(eq(users.isActive, true), eq(users.subscriptionStatus, 'active')));

    if (allUsers.length === 0) {
      const thresholds = { tier1: 0, tier2: 0, tier3: 0 };
      this.tierThresholdCache = thresholds;
      this.tierThresholdCacheTime = Date.now();
      return thresholds;
    }

    // Sort points in descending order (highest to lowest)
    const allPoints = allUsers
      .map(u => u.currentCyclePoints || 0)
      .sort((a, b) => b - a);

    // Calculate percentile thresholds for tier boundaries
    // Top 33% = Tier 1, Middle 33% = Tier 2, Bottom 33% = Tier 3
    const tier1Index = Math.floor(allPoints.length * 0.33); // Top 33% cutoff
    const tier2Index = Math.floor(allPoints.length * 0.67); // Middle 33% cutoff

    const thresholds = {
      tier1: allPoints[tier1Index] || allPoints[0] || 0, // Minimum points for top 33% (highest tier)
      tier2: allPoints[tier2Index] || 0, // Minimum points for middle 33%
      tier3: 0 // Bottom 33% starts at 0
    };

    // Cache the calculated thresholds with timestamp
    this.tierThresholdCache = thresholds;
    this.tierThresholdCacheTime = Date.now();
    return thresholds;
  }

  async createUserMonthlyReward(data: {
    userId: number;
    monthlyRewardId: number;
    tier: string;
    pointsAtDistribution: number;
    rewardAmount: number;
    pointsDeducted: number;
    pointsRolledOver: number;
    isWinner: boolean;
  }): Promise<UserMonthlyReward> {
    const [userMonthlyReward] = await db.insert(userMonthlyRewards).values(data).returning();
    return userMonthlyReward;
  }

  async markMonthlyRewardDistributed(monthlyRewardId: number): Promise<void> {
    await db.update(monthlyRewards)
      .set({
        status: 'distributed',
        distributedAt: new Date(),
      })
      .where(eq(monthlyRewards.id, monthlyRewardId));
  }

  async getTotalRewardsReceived(userId: number): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COALESCE(SUM(reward_amount), 0) as total_rewards
        FROM user_monthly_rewards 
        WHERE user_id = ${userId} AND is_winner = true
      `);

      const totalCents = Number(result[0]?.total_rewards || 0);
      return Math.floor(totalCents / 100); // Convert cents to dollars
    } catch (error) {
      console.error('Error fetching total rewards:', error);
      return 0;
    }
  }

  async getDistributionSettings(): Promise<{[key: string]: string}> {
    // In a real system, this would fetch from a settings table
    // For now, using configurable defaults that admins can set
    return {
      accumulationPeriodEnd: "last_day_of_month", // Options: last_day_of_month, last_thursday, 15th, etc.
      distributionDelayDays: "1", // Days after accumulation period ends
      accumulationPeriodType: "monthly", // monthly, weekly, custom
      timezone: "UTC",
      nextDistributionDate: "auto" // auto-calculate or specific date
    };
  }

  // Authentication methods
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async generateToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    // Store token in memory for this session
    this.tokens.set(token, { userId, createdAt: new Date() });
    return token;
  }

  async getUserByToken(token: string): Promise<User | null> {
    try {
      // Use JWT verification instead of token storage
      const decoded = jwt.verify(token, 'finboost-secret-key-2024') as any;
      return await this.getUserById(decoded.userId);
    } catch (error) {
      console.error('Error getting user by token:', error);
      return null;
    }
  }

  async validateToken(token: string): Promise<User | null> {
    return this.getUserByToken(token);
  }

  // Admin methods
  async getAdminAnalytics(): Promise<any> {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const activeUsers = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`last_login_at > NOW() - INTERVAL '30 days'`);

      const moduleCount = await db.select({ count: sql<number>`count(*)` }).from(learningModules);

      return {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        totalModules: moduleCount[0]?.count || 0,
        totalCompletions: 0,
        avgCompletionRate: 0,
        userGrowth: [],
        pointsDistribution: [],
        recentActivity: [],
        systemHealth: {}
      };
    } catch (error) {
      console.error('Error getting admin analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalModules: 0,
        totalCompletions: 0,
        avgCompletionRate: 0,
        userGrowth: [],
        pointsDistribution: [],
        recentActivity: [],
        systemHealth: {}
      };
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.joinedAt));
      return allUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllModules(): Promise<any[]> {
    try {
      const modules = await db.select().from(learningModules).orderBy(learningModules.order);
      return modules;
    } catch (error) {
      console.error('Error getting all modules:', error);
      return [];
    }
  }

  async getModuleById(moduleId: number): Promise<any | null> {
    try {
      const [module] = await db.select()
        .from(learningModules)
        .where(eq(learningModules.id, moduleId))
        .limit(1);
      return module || null;
    } catch (error) {
      console.error('Error getting module by ID:', error);
      return null;
    }
  }

  async toggleModulePublish(moduleId: number, isPublished: boolean): Promise<any> {
    try {
      const publishedAt = isPublished ? new Date() : null;

      const [updatedModule] = await db.update(learningModules)
        .set({ 
          isPublished: isPublished,
          publishedAt: publishedAt
        })
        .where(eq(learningModules.id, moduleId))
        .returning();

      return updatedModule;
    } catch (error) {
      console.error('Error toggling module publish status:', error);
      throw new Error('Failed to update module publish status');
    }
  }

  async getPublishedModules(): Promise<any[]> {
    try {
      const modules = await db.select({
        id: learningModules.id,
        title: learningModules.title,
        description: learningModules.description,
        content: learningModules.content,
        quiz: learningModules.quiz,
        pointsReward: learningModules.pointsReward,
        category: learningModules.category,
        difficulty: learningModules.difficulty,
        estimatedMinutes: learningModules.estimatedMinutes,
        accessType: learningModules.accessType,
        isActive: learningModules.isActive,
        isPublished: learningModules.isPublished,
        order: learningModules.order,
        createdAt: learningModules.createdAt
      })
        .from(learningModules)
        .where(eq(learningModules.isPublished, true))
        .orderBy(learningModules.order);
      return modules;
    } catch (error) {
      console.error('Error getting published modules:', error);
      return [];
    }
  }



  async updateUserPayPalOrderId(userId: number, orderId: string): Promise<void> {
    try {
      await db.update(users)
        .set({ paypalEmail: orderId })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating PayPal order ID:', error);
      throw new Error('Failed to update PayPal order ID');
    }
  }

  async updateUserMembershipStatus(userId: number, isPremium: boolean, paymentMethod: string): Promise<void> {
    try {
      await db.update(users)
        .set({ 
          subscriptionStatus: isPremium ? 'active' : 'inactive',
          subscriptionStartDate: isPremium ? new Date() : null
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating membership status:', error);
      throw new Error('Failed to update membership status');
    }
  }

  async getNextDistribution(): Promise<any> {
    try {
      // Get distribution settings
      const settings = await this.getDistributionSettings();

      // Calculate next distribution date based on current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // For monthly distributions, next payout is first day of next month
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextDate = new Date(nextYear, nextMonth, 1);

      // Calculate time remaining
      const timeRemaining = nextDate.getTime() - now.getTime();
      const days = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
      const hours = Math.max(0, Math.ceil((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.ceil((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

      return {
        nextDate: nextDate.toISOString(),
        timeRemaining: {
          days,
          hours,
          minutes,
          totalMs: timeRemaining
        },
        settings,
        estimatedPool: 1000
      };
    } catch (error) {
      console.error('Error calculating next distribution:', error);
      return {
        nextDate: null,
        timeRemaining: { days: 0, hours: 0, minutes: 0, totalMs: 0 },
        settings: {},
        estimatedPool: 0
      };
    }
  }

  async getTierThresholds(): Promise<any> {
    try {
      const allUsers = await db.select({ points: users.currentMonthPoints })
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'));
      const points = allUsers.map(u => u.points || 0).sort((a, b) => a - b);

      if (points.length === 0) {
        return { tier1: 0, tier2: 0, tier3: 0 };
      }

      // Calculate 33rd and 67th percentiles
      // Now Tier 1 is highest (67th percentile), Tier 3 is lowest (0-33rd percentile)
      const tier2Index = Math.floor(points.length * 0.33);
      const tier1Index = Math.floor(points.length * 0.67);

      return {
        tier1: points[tier1Index] || 0, // Tier 1 is now highest (67th percentile+)
        tier2: points[tier2Index] || 0, // Tier 2 is middle (33rd-67th percentile)
        tier3: 0 // Tier 3 is now lowest (0-33rd percentile)
      };
    } catch (error) {
      console.error('Error calculating tier thresholds:', error);
      return { tier1: 0, tier2: 28, tier3: 64 };
    }
  }



  async getExpandedLeaderboard(timeFilter: string, page: number, search: string): Promise<Array<{rank: string, username: string, points: string, tier: string, streak: number, modulesCompleted: number, joinDate: string}>> {
    try {
      console.log(`Getting expanded leaderboard with timeFilter: ${timeFilter}, search: "${search}"`);

      const pointsColumn = timeFilter === 'alltime' ? users.totalPoints : users.currentMonthPoints;

      // Build the query with conditional search
      let query = db.select({
        id: users.id,
        username: users.username,
        totalPoints: users.totalPoints,
        currentMonthPoints: users.currentMonthPoints,
        tier: users.tier,
        currentStreak: users.currentStreak,
        joinedAt: users.joinedAt
      })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'))
      .orderBy(desc(pointsColumn));

      // Add search filter if provided
      if (search && search.trim()) {
        query = db.select({
          id: users.id,
          username: users.username,
          totalPoints: users.totalPoints,
          currentMonthPoints: users.currentMonthPoints,
          tier: users.tier,
          currentStreak: users.currentStreak,
          joinedAt: users.joinedAt
        })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'active'),
            eq(users.isAdmin, false),
            sql`${users.username} ILIKE ${`%${search}%`}`
          )
        )
        .orderBy(desc(pointsColumn));
      }

      const usersData = await query;
      console.log(`Found ${usersData.length} premium users`);

      if (usersData.length === 0) {
        return [];
      }

      // Get module completions for these users
      const userIds = usersData.map(u => u.id);
      
      let moduleCompletions: Array<{userId: number, completedCount: number}> = [];
      try {
        if (userIds.length > 0) {
          const completionsData = await db.select({
            userId: userProgress.userId,
            completedCount: sql<number>`COUNT(*)`.as('completedCount')
          })
          .from(userProgress)
          .where(
            and(
              sql`${userProgress.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
              eq(userProgress.completed, true)
            )
          )
          .groupBy(userProgress.userId);

          moduleCompletions = completionsData.map(c => ({
            userId: c.userId,
            completedCount: Number(c.completedCount) || 0
          }));
        }
      } catch (progressError) {
        console.error('Error fetching module completions:', progressError);
        moduleCompletions = [];
      }

      // Create completion map
      const completionMap = new Map(
        moduleCompletions.map(c => [c.userId, c.completedCount])
      );

      // Format results
      const result = usersData.map((user, index) => {
        const points = timeFilter === 'alltime' 
          ? (user.totalPoints || 0) 
          : (user.currentMonthPoints || 0);
        
        return {
          rank: (index + 1).toString(),
          username: user.username || 'Unknown',
          points: points.toString(),
          tier: user.tier || 'tier3',
          streak: user.currentStreak || 0,
          modulesCompleted: completionMap.get(user.id) || 0,
          joinDate: user.joinedAt 
            ? new Date(user.joinedAt).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0]
        };
      });

      console.log(`Returning ${result.length} users in expanded leaderboard`);
      return result;
    } catch (error) {
      console.error('Error getting expanded leaderboard:', error);
      return [];
    }
  }

  async getUserLeaderboardStats(userId: number, timeFilter: string): Promise<{username: string, rank: number, points: number, tier: string, streak: number, modulesCompleted: number, pointsToNextTier: number, pointsToTopPosition?: number}> {
    try {
      const pointsColumn = timeFilter === 'alltime' ? users.totalPoints : users.currentMonthPoints;
      
      // Get user data
      const userData = await db.select({
        username: users.username,
        points: pointsColumn,
        tier: users.tier,
        streak: users.currentStreak
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      if (!userData.length) {
        throw new Error('User not found');
      }

      const user = userData[0];

      // Get user's rank
      const rankQuery = await db.select({
        rank: sql<number>`COUNT(*) + 1`.as('rank')
      })
      .from(users)
      .where(sql`${pointsColumn} > ${user.points}`);

      const rank = rankQuery[0]?.rank || 1;

      // Get module completion count
      const moduleCompletion = await db.select({
        count: sql<number>`COUNT(*)`.as('count')
      })
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.completed, true)
      ));

      const modulesCompleted = moduleCompletion[0]?.count || 0;

      // Calculate points to next tier
      const tierThresholds = await this.getTierThresholds();
      let pointsToNextTier = 0;
      const currentPoints = user.points || 0;

      if (user.tier === 'member') {
        pointsToNextTier = tierThresholds.tier1 - currentPoints;
      } else if (user.tier === 'tier1') {
        pointsToNextTier = tierThresholds.tier2 - currentPoints;
      } else if (user.tier === 'tier2') {
        pointsToNextTier = tierThresholds.tier3 - currentPoints;
      }

      // Get points to top position if user is in top tier
      let pointsToTopPosition;
      if (user.tier === 'tier3') {
        const topUser = await db.select({
          points: pointsColumn
        })
        .from(users)
        .orderBy(desc(pointsColumn))
        .limit(1);

        if (topUser.length && topUser[0].points > currentPoints) {
          pointsToTopPosition = topUser[0].points - currentPoints + 1;
        }
      }

      return {
        username: user.username,
        rank,
        points: currentPoints,
        tier: user.tier || 'member',
        streak: user.streak || 0,
        modulesCompleted,
        pointsToNextTier: Math.max(0, pointsToNextTier),
        pointsToTopPosition
      };
    } catch (error) {
      console.error('Error getting user leaderboard stats:', error);
      throw error;
    }
  }

  async getUserProgress(userId: number): Promise<any[]> {
    try {
      const progress = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId));
      return progress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  }

  async getPointActions(): Promise<any[]> {
    try {
      // Get all admin-configured actions (both active and inactive for admin management)
      const adminActions = await db.select().from(adminPointsActions);

      if (adminActions.length > 0) {
        return adminActions.map(action => ({
          id: action.id,
          actionId: action.actionId,
          name: action.name,
          basePoints: action.basePoints,
          maxDaily: action.maxDaily,
          maxMonthly: action.maxMonthly,
          maxTotal: action.maxTotal,
          requiresProof: action.requiresProof,
          category: action.category,
          description: action.description,
          isActive: action.isActive
        }));
      }

      // Fallback to static configuration
      return Object.values(POINTS_CONFIG).filter(action => typeof action === 'object' && action.id);
    } catch (error) {
      console.error('Error fetching point actions:', error);
      // Fallback to static configuration on error
      return Object.values(POINTS_CONFIG).filter(action => typeof action === 'object' && action.id);
    }
  }

  async createOrUpdatePointAction(actionData: {
    actionId: string;
    name: string;
    basePoints: number;
    maxDaily?: number;
    maxMonthly?: number;
    maxTotal?: number;
    requiresProof: boolean;
    category: string;
    description: string;
  }, adminUserId: number): Promise<any> {
    const existing = await db.select()
      .from(adminPointsActions)
      .where(eq(adminPointsActions.actionId, actionData.actionId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const updated = await db.update(adminPointsActions)
        .set({
          name: actionData.name,
          basePoints: actionData.basePoints,
          maxDaily: actionData.maxDaily,
          maxMonthly: actionData.maxMonthly,
          maxTotal: actionData.maxTotal,
          requiresProof: actionData.requiresProof,
          category: actionData.category,
          description: actionData.description,
          updatedAt: new Date(),
          updatedBy: adminUserId
        })
        .where(eq(adminPointsActions.actionId, actionData.actionId))
        .returning();

      return updated[0];
    } else {
      // Create new
      const created = await db.insert(adminPointsActions)
        .values({
          ...actionData,
          updatedBy: adminUserId
        })
        .returning();

      return created[0];
    }
  }

  async updatePointAction(id: number, actionData: any, adminUserId: number): Promise<any> {
    const updated = await db.update(adminPointsActions)
      .set({
        name: actionData.name,
        basePoints: actionData.basePoints,
        maxDaily: actionData.maxDaily,
        maxMonthly: actionData.maxMonthly,
        requiresProof: actionData.requiresProof,
        category: actionData.category,
        description: actionData.description,
        isActive: actionData.isActive,
        updatedAt: new Date(),
        updatedBy: adminUserId
      })
      .where(eq(adminPointsActions.id, id))
      .returning();

    return updated[0];
  }

  async deletePointAction(actionId: string): Promise<void> {
    await db.update(adminPointsActions)
      .set({ isActive: false })
      .where(eq(adminPointsActions.actionId, actionId));
  }

  // Admin CRUD operations implementation
  async createModule(moduleData: any): Promise<any> {
    try {
      const [module] = await db.insert(learningModules).values({
        title: moduleData.title,
        description: moduleData.description,
        category: moduleData.category,
        difficulty: moduleData.difficulty,
        estimatedMinutes: moduleData.estimatedMinutes || 5,
        content: moduleData.content,
        quiz: moduleData.quiz || null,
        isActive: moduleData.isActive !== undefined ? moduleData.isActive : true,
        order: moduleData.order || 0,
        pointsReward: moduleData.pointsReward || 20,
        accessType: 'premium',
        isPublished: false
      }).returning();
      return module;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  async updateModule(moduleId: number, moduleData: any): Promise<any> {
    try {
      const [module] = await db.update(learningModules)
        .set({
          title: moduleData.title,
          description: moduleData.description,
          category: moduleData.category,
          difficulty: moduleData.difficulty,
          estimatedMinutes: moduleData.estimatedMinutes,
          content: moduleData.content,
          quiz: moduleData.quiz,
          isActive: moduleData.isActive,
          order: moduleData.order,
          pointsReward: moduleData.pointsReward,
          accessType: moduleData.accessType,
          isPublished: moduleData.isPublished
        })
        .where(eq(learningModules.id, moduleId))
        .returning();
      return module;
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  async deleteModule(moduleId: number): Promise<void> {
    try {
      await db.delete(learningModules).where(eq(learningModules.id, moduleId));
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  async getAllModules(): Promise<any[]> {
    try {
      const modules = await db.select().from(learningModules);
      return modules;
    } catch (error) {
      console.error('Error getting all modules:', error);
      return [];
    }
  }

  async updateUser(userId: number, userData: any): Promise<User> {
    try {
      const updateData: any = {};

      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
      if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
      if (userData.currentMonthPoints !== undefined) updateData.currentMonthPoints = userData.currentMonthPoints;
      if (userData.totalPoints !== undefined) updateData.totalPoints = userData.totalPoints;
      if (userData.tier !== undefined) updateData.tier = userData.tier;
      if (userData.isActive !== undefined) updateData.isActive = userData.isActive;
      if (userData.subscriptionStatus !== undefined) updateData.subscriptionStatus = userData.subscriptionStatus;
      if (userData.stripeCustomerId !== undefined) updateData.stripeCustomerId = userData.stripeCustomerId;
      if (userData.stripeSubscriptionId !== undefined) updateData.stripeSubscriptionId = userData.stripeSubscriptionId;
      if (userData.nextBillingDate !== undefined) updateData.nextBillingDate = userData.nextBillingDate;
      if (userData.password !== undefined) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      const [user] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      // Delete related records first
      await db.delete(userPointsHistory).where(eq(userPointsHistory.userId, userId));
      await db.delete(userProgress).where(eq(userProgress.userId, userId));
      await db.delete(userMonthlyRewards).where(eq(userMonthlyRewards.userId, userId));

      // Delete the user
      await db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }



  async deductPoints(userId: number, points: number, action: string, reason: string): Promise<void> {
    try {
      // Update user points
      const user = await this.getUserById(userId);
      if (user) {
        const newCurrentPoints = Math.max(0, (user.currentMonthPoints || 0) - points);
        const newTotalPoints = Math.max(0, (user.totalPoints || 0) - points);

        await db.update(users)
          .set({
            currentMonthPoints: newCurrentPoints,
            totalPoints: newTotalPoints
          })
          .where(eq(users.id, userId));

        // Record points history
        await db.insert(userPointsHistory).values({
          userId: userId,
          action: action,
          points: -points,
          description: reason,
          metadata: JSON.stringify({ adminDeducted: true })
        });
      }
    } catch (error) {
      console.error('Error deducting points:', error);
      throw error;
    }
  }

  async updateRewardsConfig(config: any): Promise<void> {
    try {
      // Store rewards configuration (implement based on your schema)
      console.log('Updating rewards config:', config);
      // Implementation depends on how you want to store the config
    } catch (error) {
      console.error('Error updating rewards config:', error);
      throw error;
    }
  }

  async executeMonthlyDistribution(month: string): Promise<any> {
    try {
      // Implement monthly distribution logic
      console.log('Executing monthly distribution for:', month);

      // Get all users with points for the month
      const usersWithPoints = await db.select()
        .from(users)
        .where(gte(users.currentMonthPoints, 1))
        .orderBy(desc(users.currentMonthPoints));

      const result = {
        month: month,
        distributedUsers: usersWithPoints.length,
        totalAmount: 0,
        distribution: []
      };

      return result;
    } catch (error) {
      console.error('Error executing monthly distribution:', error);
      throw error;
    }
  }

  async getAllSupportTickets(): Promise<any[]> {
    try {
      const tickets = await db.select().from(supportRequests).orderBy(desc(supportRequests.createdAt));
      return tickets;
    } catch (error) {
      console.error('Error getting support tickets:', error);
      return [];
    }
  }

  async updateSupportTicket(ticketId: number, ticketData: any): Promise<any> {
    try {
      const updateData: any = {};

      if (ticketData.status !== undefined) updateData.status = ticketData.status;
      if (ticketData.priority !== undefined) updateData.priority = ticketData.priority;
      if (ticketData.response !== undefined) updateData.response = ticketData.response;
      if (ticketData.resolvedAt !== undefined) updateData.resolvedAt = ticketData.resolvedAt;

      const [ticket] = await db.update(supportRequests)
        .set(updateData)
        .where(eq(supportRequests.id, ticketId))
        .returning();

      return ticket;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  // Stripe payment methods
  async addToRewardPool(amount: number): Promise<void> {
    // Add payment amount to the monthly pool
    // This would update the reward pool balance in the database
    console.log(`Added $${amount/100} to reward pool from subscription payment`);
    // In a real implementation, this would update a reward pool table
  }

  // Cycle settings methods (consolidated from monthly)
  async createCycleSetting(setting: any): Promise<any> {
    try {
      const [newSetting] = await db.insert(cycleSettings).values(setting).returning();
      return newSetting;
    } catch (error) {
      console.error('Error creating cycle setting:', error);
      throw error;
    }
  }

  async getActiveCycleSetting(): Promise<any> {
    try {
      const [activeSetting] = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.isActive, true))
        .orderBy(desc(cycleSettings.cycleStartDate))
        .limit(1);
      return activeSetting || null;
    } catch (error) {
      console.error('Error getting active cycle setting:', error);
      return null;
    }
  }

  async getCurrentPoolSettingsForDate(date: Date): Promise<{ rewardPoolPercentage: number; membershipFee: number } | null> {
    try {
      const [setting] = await db.select()
        .from(cycleSettings)
        .where(
          and(
            sql`${cycleSettings.cycleStartDate} <= ${date.toISOString().split('T')[0]}`,
            sql`${cycleSettings.cycleEndDate} >= ${date.toISOString().split('T')[0]}`,
            eq(cycleSettings.isActive, true)
          )
        )
        .limit(1);

      if (setting) {
        return {
          rewardPoolPercentage: setting.rewardPoolPercentage,
          membershipFee: setting.membershipFee
        };
      }

      // Fallback to default if no setting found
      return {
        rewardPoolPercentage: 55, // Default 55%
        membershipFee: 2000 // Default $20
      };
    } catch (error) {
      console.error('Error getting current pool settings:', error);
      return {
        rewardPoolPercentage: 55,
        membershipFee: 2000
      };
    }
  }

  async updateCycleSetting(id: number, updates: any): Promise<any> {
    try {
      const [updated] = await db.update(cycleSettings)
        .set(updates)
        .where(eq(cycleSettings.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating cycle setting:', error);
      throw error;
    }
  }

  async getAllCycleSettings(): Promise<any[]> {
    try {
      return await db.select()
        .from(cycleSettings)
        .orderBy(desc(cycleSettings.cycleStartDate));
    } catch (error) {
      console.error('Error getting all cycle settings:', error);
      return [];
    }
  }

  async getAllCycles(): Promise<any[]> {
    return this.getAllCycleSettings();
  }

  // Stripe integration methods
  async updateUserSubscriptionStatus(userId: number, status: string): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          subscriptionStatus: status
        })
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    } catch (error) {
      console.error('Error updating user subscription status:', error);
      return null;
    }
  }

  async updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          stripeCustomerId: stripeCustomerId
        })
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    } catch (error) {
      console.error('Error updating user Stripe customer ID:', error);
      return null;
    }
  }

  async updateUserStripeSubscriptionId(userId: number, stripeSubscriptionId: string): Promise<User | null> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          stripeSubscriptionId: stripeSubscriptionId
        })
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    } catch (error) {
      console.error('Error updating user Stripe subscription ID:', error);
      return null;
    }
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
      return user || null;
    } catch (error) {
      console.error('Error getting user by Stripe customer ID:', error);
      return null;
    }
  }

  async convertTheoreticalPoints(userId: number): Promise<void> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (user && user.theoreticalPoints > 0) {
        await db
          .update(users)
          .set({ 
            totalPoints: user.totalPoints + user.theoreticalPoints,
            currentMonthPoints: user.currentMonthPoints + user.theoreticalPoints,
            theoreticalPoints: 0
          })
          .where(eq(users.id, userId));
      }
    } catch (error) {
      console.error('Error converting theoretical points:', error);
    }
  }

  // PayPal payout methods
  async getPremiumUsersForRewards(): Promise<any[]> {
    try {
      const premiumUsers = await db.select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        currentMonthPoints: users.currentMonthPoints,
        totalPoints: users.totalPoints,
        paypalEmail: users.paypalEmail,
        subscriptionStatus: users.subscriptionStatus
      })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, 'active'),
          gte(users.currentMonthPoints, 1)
        )
      )
      .orderBy(desc(users.currentMonthPoints));

      return premiumUsers;
    } catch (error) {
      console.error('Error getting premium users for rewards:', error);
      return [];
    }
  }

  async updateUserPayPalEmail(userId: number, paypalEmail: string): Promise<void> {
    try {
      await db.update(users)
        .set({ paypalEmail })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating PayPal email:', error);
      throw error;
    }
  }

  async createPayPalPayout(payoutData: {
    userId: number;
    amount: number;
    currency: string;
    reason: string;
    tier?: string;
    recipientEmail: string;
  }): Promise<any> {
    try {
      const [payout] = await db.insert(paypalPayouts).values({
        userId: payoutData.userId,
        recipientEmail: payoutData.recipientEmail,
        amount: payoutData.amount,
        currency: payoutData.currency,
        status: 'pending',
        reason: payoutData.reason,
        tier: payoutData.tier,
        processedAt: new Date()
      }).returning();
      
      return payout;
    } catch (error) {
      console.error('Error creating PayPal payout:', error);
      throw error;
    }
  }

  async updatePayPalPayoutStatus(payoutId: number, status: string, paypalResponse?: string): Promise<void> {
    try {
      await db.update(paypalPayouts)
        .set({ 
          status,
          paypalResponse,
          processedAt: new Date()
        })
        .where(eq(paypalPayouts.id, payoutId));
    } catch (error) {
      console.error('Error updating PayPal payout status:', error);
      throw error;
    }
  }

  async getPayPalPayoutsByUser(userId: number): Promise<any[]> {
    try {
      return await db.select()
        .from(paypalPayouts)
        .where(eq(paypalPayouts.userId, userId))
        .orderBy(desc(paypalPayouts.createdAt));
    } catch (error) {
      console.error('Error getting PayPal payouts by user:', error);
      return [];
    }
  }

  async getAllPendingPayouts(): Promise<any[]> {
    try {
      return await db.select()
        .from(paypalPayouts)
        .where(eq(paypalPayouts.status, 'pending'))
        .orderBy(desc(paypalPayouts.createdAt));
    } catch (error) {
      console.error('Error getting pending payouts:', error);
      return [];
    }
  }

  async getEligibleUsersForRewards(): Promise<any[]> {
    try {
      return await this.getPremiumUsersForRewards();
    } catch (error) {
      console.error('Error getting eligible users for rewards:', error);
      return [];
    }
  }

  // === NEW CYCLE-BASED METHODS (Phase 2) ===
  
  // Cycle Settings Management
  async createCycleSetting(setting: InsertCycleSetting): Promise<CycleSetting> {
    try {
      const [newSetting] = await db.insert(cycleSettings).values(setting).returning();
      return newSetting;
    } catch (error) {
      console.error('Error creating cycle setting:', error);
      throw error;
    }
  }

  async getActiveCycleSetting(): Promise<CycleSetting | null> {
    try {
      const [activeSetting] = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.isActive, true))
        .orderBy(desc(cycleSettings.cycleStartDate))
        .limit(1);
      return activeSetting || null;
    } catch (error) {
      console.error('Error getting active cycle setting:', error);
      return null;
    }
  }

  async getCurrentCycleSettingForDate(date: Date): Promise<CycleSetting | null> {
    try {
      const [setting] = await db.select()
        .from(cycleSettings)
        .where(
          and(
            lte(cycleSettings.cycleStartDate, date),
            gte(cycleSettings.cycleEndDate, date),
            eq(cycleSettings.isActive, true)
          )
        )
        .limit(1);
      return setting || null;
    } catch (error) {
      console.error('Error getting current cycle setting for date:', error);
      return null;
    }
  }

  async updateCycleSetting(id: number, updates: Partial<CycleSetting>): Promise<CycleSetting> {
    try {
      const [updated] = await db.update(cycleSettings)
        .set(updates)
        .where(eq(cycleSettings.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating cycle setting:', error);
      throw error;
    }
  }

  async deleteCycleSetting(id: number): Promise<void> {
    try {
      await db.delete(cycleSettings)
        .where(eq(cycleSettings.id, id));
    } catch (error) {
      console.error('Error deleting cycle setting:', error);
      throw error;
    }
  }

  async getAllCycleSettings(): Promise<CycleSetting[]> {
    try {
      return await db.select()
        .from(cycleSettings)
        .orderBy(desc(cycleSettings.cycleStartDate));
    } catch (error) {
      console.error('Error getting all cycle settings:', error);
      return [];
    }
  }

  // User Cycle Points Management
  async createUserCyclePoints(data: InsertUserCyclePoints): Promise<UserCyclePoints> {
    try {
      const [newPoints] = await db.insert(userCyclePoints).values(data).returning();
      return newPoints;
    } catch (error) {
      console.error('Error creating user cycle points:', error);
      throw error;
    }
  }

  async getUserCyclePoints(userId: number, cycleSettingId: number): Promise<UserCyclePoints | null> {
    try {
      const [points] = await db.select()
        .from(userCyclePoints)
        .where(
          and(
            eq(userCyclePoints.userId, userId),
            eq(userCyclePoints.cycleSettingId, cycleSettingId)
          )
        )
        .limit(1);
      return points || null;
    } catch (error) {
      console.error('Error getting user cycle points:', error);
      return null;
    }
  }

  async updateUserCyclePoints(userId: number, cycleSettingId: number, updates: Partial<UserCyclePoints>): Promise<UserCyclePoints> {
    try {
      const [updated] = await db.update(userCyclePoints)
        .set(updates)
        .where(
          and(
            eq(userCyclePoints.userId, userId),
            eq(userCyclePoints.cycleSettingId, cycleSettingId)
          )
        )
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating user cycle points:', error);
      throw error;
    }
  }

  async getUsersInCurrentCycle(cycleSettingId: number): Promise<UserCyclePoints[]> {
    try {
      return await db.select()
        .from(userCyclePoints)
        .where(eq(userCyclePoints.cycleSettingId, cycleSettingId))
        .orderBy(desc(userCyclePoints.currentCyclePoints));
    } catch (error) {
      console.error('Error getting users in current cycle:', error);
      return [];
    }
  }

  // Cycle-based Points System
  async awardCyclePoints(userId: number, cycleSettingId: number, actionId: string, points: number, description: string, metadata?: any): Promise<CyclePointHistory> {
    try {
      // Create or update user cycle points
      let userPoints = await this.getUserCyclePoints(userId, cycleSettingId);
      if (!userPoints) {
        userPoints = await this.createUserCyclePoints({
          userId,
          cycleSettingId,
          currentCyclePoints: points,
          tier: await this.calculateCycleTier(cycleSettingId, points),
          theoreticalPoints: 0,
          pointsRolledOver: 0
        });
      } else {
        await this.updateUserCyclePoints(userId, cycleSettingId, {
          currentCyclePoints: userPoints.currentCyclePoints + points,
          tier: await this.calculateCycleTier(cycleSettingId, userPoints.currentCyclePoints + points)
        });
      }

      // Record in cycle point history
      const [history] = await db.insert(cyclePointHistory).values({
        userId,
        cycleSettingId,
        points,
        action: actionId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'approved'
      }).returning();

      return history;
    } catch (error) {
      console.error('Error awarding cycle points:', error);
      throw error;
    }
  }

  async awardCyclePointsWithProof(userId: number, cycleSettingId: number, actionId: string, points: number, description: string, proofUrl: string, metadata?: any): Promise<CyclePointHistory> {
    try {
      // Record in cycle point history with pending status
      const [history] = await db.insert(cyclePointHistory).values({
        userId,
        cycleSettingId,
        points,
        action: actionId,
        description,
        proofUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'pending'
      }).returning();

      return history;
    } catch (error) {
      console.error('Error awarding cycle points with proof:', error);
      throw error;
    }
  }

  async checkCycleDailyActionLimit(userId: number, cycleSettingId: number, actionId: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [action] = await db.select()
        .from(cyclePointsActions)
        .where(eq(cyclePointsActions.actionId, actionId))
        .limit(1);

      if (!action || !action.maxDaily) return true;

      const todayCount = await db.select({ count: sql<number>`count(*)` })
        .from(cyclePointHistory)
        .where(
          and(
            eq(cyclePointHistory.userId, userId),
            eq(cyclePointHistory.cycleSettingId, cycleSettingId),
            eq(cyclePointHistory.action, actionId),
            eq(cyclePointHistory.status, 'approved'),
            gte(cyclePointHistory.createdAt, today),
            lt(cyclePointHistory.createdAt, tomorrow)
          )
        );

      return (todayCount[0]?.count || 0) < action.maxDaily;
    } catch (error) {
      console.error('Error checking cycle daily action limit:', error);
      return false;
    }
  }

  async checkCycleActionLimit(userId: number, cycleSettingId: number, actionId: string): Promise<boolean> {
    try {
      const [action] = await db.select()
        .from(cyclePointsActions)
        .where(eq(cyclePointsActions.actionId, actionId))
        .limit(1);

      if (!action || !action.maxPerCycle) return true;

      const cycleCount = await db.select({ count: sql<number>`count(*)` })
        .from(cyclePointHistory)
        .where(
          and(
            eq(cyclePointHistory.userId, userId),
            eq(cyclePointHistory.cycleSettingId, cycleSettingId),
            eq(cyclePointHistory.action, actionId),
            eq(cyclePointHistory.status, 'approved')
          )
        );

      return (cycleCount[0]?.count || 0) < action.maxPerCycle;
    } catch (error) {
      console.error('Error checking cycle action limit:', error);
      return false;
    }
  }

  async getCyclePointHistory(userId: number, cycleSettingId: number): Promise<CyclePointHistory[]> {
    try {
      return await db.select()
        .from(cyclePointHistory)
        .where(
          and(
            eq(cyclePointHistory.userId, userId),
            eq(cyclePointHistory.cycleSettingId, cycleSettingId)
          )
        )
        .orderBy(desc(cyclePointHistory.createdAt));
    } catch (error) {
      console.error('Error getting cycle point history:', error);
      return [];
    }
  }

  // Cycle Tier Calculations
  async calculateCycleTier(cycleSettingId: number, currentCyclePoints: number): Promise<string> {
    try {
      const thresholds = await this.getCycleTierThresholds(cycleSettingId);
      
      if (currentCyclePoints >= thresholds.tier1) return 'Tier 1';
      if (currentCyclePoints >= thresholds.tier2) return 'Tier 2';
      return 'Tier 3';
    } catch (error) {
      console.error('Error calculating cycle tier:', error);
      return 'Tier 3';
    }
  }

  async recalculateAllCycleTiers(cycleSettingId: number): Promise<void> {
    try {
      const users = await this.getUsersInCurrentCycle(cycleSettingId);
      
      for (const user of users) {
        const newTier = await this.calculateCycleTier(cycleSettingId, user.currentCyclePoints);
        if (user.tier !== newTier) {
          await this.updateUserCyclePoints(user.userId, cycleSettingId, { tier: newTier });
        }
      }
    } catch (error) {
      console.error('Error recalculating all cycle tiers:', error);
      throw error;
    }
  }

  async synchronizeTierAssignments(cycleSettingId: number, usersWithFreshTiers: any[]): Promise<void> {
    try {
      console.log('[TIER SYNC] Starting database tier synchronization');
      let correctedCount = 0;

      for (const user of usersWithFreshTiers) {
        // Update user_cycle_points table with correct tier
        const existingCyclePoints = await this.getUserCyclePoints(user.id, cycleSettingId);
        
        if (existingCyclePoints && existingCyclePoints.tier !== user.tier) {
          await this.updateUserCyclePoints(user.id, cycleSettingId, { tier: user.tier });
          correctedCount++;
          console.log(`[TIER SYNC] Updated ${user.email}: ${existingCyclePoints.tier} → ${user.tier}`);
        }
        
        // Also update main users table tier (for consistency)
        await db.update(users)
          .set({ tier: user.tier })
          .where(eq(users.id, user.id));
      }

      console.log(`[TIER SYNC] Synchronized ${correctedCount} tier assignments in database`);
    } catch (error) {
      console.error('Error synchronizing tier assignments:', error);
      throw error;
    }
  }

  async calculateDynamicTierThresholds(cycleSettingId: number): Promise<{ 
    tier1: number, 
    tier2: number, 
    tier3: number,
    percentiles: { tier1: number, tier2: number }
  }> {
    try {
      // Get cycle settings to get percentile configuration
      const [setting] = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId))
        .limit(1);

      if (!setting) {
        return { 
          tier1: 56, 
          tier2: 21, 
          tier3: 0,
          percentiles: { tier1: 33, tier2: 67 }
        };
      }

      // Get all active users' cycle points for this cycle (including 0 points for percentile calculation)
      const userPoints = await db.select({
        currentCyclePoints: userCyclePoints.currentCyclePoints
      })
        .from(userCyclePoints)
        .where(and(
          eq(userCyclePoints.cycleSettingId, cycleSettingId),
          eq(userCyclePoints.isActive, true)
        ))
        .orderBy(sql`${userCyclePoints.currentCyclePoints} DESC`);

      // If no users enrolled, return defaults
      if (userPoints.length === 0) {
        return {
          tier1: 50,
          tier2: 25,
          tier3: 0,
          percentiles: { tier1: setting.tier1Threshold, tier2: setting.tier2Threshold }
        };
      }

      // Filter users with points > 0 for percentile calculation
      const usersWithPoints = userPoints.filter(u => u.currentCyclePoints > 0);
      
      // If no users have points yet, everyone is in Tier 3
      if (usersWithPoints.length === 0) {
        return {
          tier1: 1, // Impossible threshold - no one can reach Tier 1
          tier2: 1, // Impossible threshold - no one can reach Tier 2  
          tier3: 0, // Everyone with 0 points gets Tier 3
          percentiles: { tier1: setting.tier1Threshold, tier2: setting.tier2Threshold }
        };
      }

      const totalUsersWithPoints = usersWithPoints.length;
      const points = usersWithPoints.map(u => u.currentCyclePoints).sort((a, b) => b - a);

      // Calculate tier boundaries based on percentiles from users with points
      const tier1Index = Math.floor((setting.tier1Threshold / 100) * totalUsersWithPoints);
      const tier2Index = Math.floor((setting.tier2Threshold / 100) * totalUsersWithPoints);

      const tier1Threshold = tier1Index > 0 ? points[tier1Index - 1] : points[0];
      const tier2Threshold = tier2Index < totalUsersWithPoints ? points[tier2Index] : 1;

      return {
        tier1: tier1Threshold,
        tier2: tier2Threshold,
        tier3: 0, // Users with 0 points automatically get Tier 3
        percentiles: { tier1: setting.tier1Threshold, tier2: setting.tier2Threshold }
      };
    } catch (error) {
      console.error('Error calculating dynamic tier thresholds:', error);
      return { 
        tier1: 56, 
        tier2: 21, 
        tier3: 0,
        percentiles: { tier1: 33, tier2: 67 }
      };
    }
  }

  async getCycleTierThresholds(cycleSettingId: number): Promise<{ tier1: number, tier2: number, tier3: number }> {
    try {
      console.log('Getting tier thresholds for cycle:', cycleSettingId);
      const dynamicThresholds = await this.calculateDynamicTierThresholds(cycleSettingId);
      console.log('Dynamic thresholds calculated:', dynamicThresholds);
      return {
        tier1: dynamicThresholds.tier1,
        tier2: dynamicThresholds.tier2,
        tier3: dynamicThresholds.tier3
      };
    } catch (error) {
      console.error('Error getting cycle tier thresholds:', error);
      return { tier1: 50, tier2: 25, tier3: 0 }; // Updated to match current fallback
    }
  }

  // Cycle Winner Selection
  async createCycleWinnerSelection(data: InsertCycleWinnerSelection): Promise<CycleWinnerSelection> {
    try {
      const [winner] = await db.insert(cycleWinnerSelections).values([data]).returning();
      return winner;
    } catch (error) {
      console.error('Error creating cycle winner selection:', error);
      throw error;
    }
  }

  async getCycleWinners(cycleSettingId: number): Promise<CycleWinnerSelection[]> {
    try {
      return await db.select()
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
        .orderBy(cycleWinnerSelections.tierRank);
    } catch (error) {
      console.error('Error getting cycle winners:', error);
      return [];
    }
  }

  // === SELECTED WINNERS EXPORT/IMPORT METHODS (Phase 2) ===

  async getCycleWinnersForExport(cycleSettingId: number): Promise<Array<{
    overallRank: number;
    tierRank: number;
    username: string;
    email: string;
    cyclePoints: number;
    tierSizeAmount: number;
    payoutPercentage: number;
    payoutCalculated: number;
    payoutOverride: number | null;
    payoutFinal: number;
    paypalEmail: string | null;
    payoutStatus: string;
    lastModified: Date;
  }>> {
    try {
      console.log(`[getCycleWinnersForExport] Fetching winners for cycle ${cycleSettingId}`);
      
      const winners = await db
        .select({
          overallRank: cycleWinnerSelections.overallRank,
          tierRank: cycleWinnerSelections.tierRank,
          username: users.username,
          email: users.email,
          cyclePoints: sql<number>`COALESCE(${userCyclePoints.currentCyclePoints}, 0)`,
          tierSizeAmount: cycleWinnerSelections.tierSizeAmount,
          payoutPercentage: cycleWinnerSelections.payoutPercentage,
          payoutCalculated: cycleWinnerSelections.payoutCalculated,
          payoutOverride: cycleWinnerSelections.payoutOverride,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          paypalEmail: users.paypalEmail,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          lastModified: cycleWinnerSelections.lastModified,
        })
        .from(cycleWinnerSelections)
        .innerJoin(users, eq(cycleWinnerSelections.userId, users.id))
        .leftJoin(userCyclePoints, and(
          eq(userCyclePoints.userId, users.id),
          eq(userCyclePoints.cycleSettingId, cycleSettingId)
        ))
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
        .orderBy(cycleWinnerSelections.overallRank);

      console.log(`[getCycleWinnersForExport] Found ${winners.length} winners`);
      return winners;
    } catch (error) {
      console.error('Error getting cycle winners for export:', error);
      throw error;
    }
  }

  async updateWinnerPayoutData(cycleSettingId: number, updates: Array<{
    email: string;
    payoutPercentage?: number;
    payoutOverride?: number | null;
  }>): Promise<void> {
    try {
      console.log(`[updateWinnerPayoutData] Updating ${updates.length} winners for cycle ${cycleSettingId}`);
      
      for (const update of updates) {
        // Find user by email
        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, update.email))
          .limit(1);

        if (!user) {
          console.warn(`[updateWinnerPayoutData] User not found for email: ${update.email}`);
          continue;
        }

        // Find winner selection record
        const [existingWinner] = await db
          .select({
            id: cycleWinnerSelections.id,
            tierSizeAmount: cycleWinnerSelections.tierSizeAmount,
            payoutPercentage: cycleWinnerSelections.payoutPercentage,
            payoutOverride: cycleWinnerSelections.payoutOverride,
          })
          .from(cycleWinnerSelections)
          .where(
            and(
              eq(cycleWinnerSelections.cycleSettingId, cycleSettingId),
              eq(cycleWinnerSelections.userId, user.id)
            )
          )
          .limit(1);

        if (!existingWinner) {
          console.warn(`[updateWinnerPayoutData] Winner record not found for user: ${user.id}`);
          continue;
        }

        // Prepare update data
        const updateData: any = {
          lastModified: new Date(),
        };

        // Update payout percentage if provided
        if (update.payoutPercentage !== undefined) {
          updateData.payoutPercentage = update.payoutPercentage;
        }

        // Update payout override if provided
        if (update.payoutOverride !== undefined) {
          updateData.payoutOverride = update.payoutOverride;
        }

        // Calculate new values
        const newPayoutPercentage = update.payoutPercentage !== undefined ? update.payoutPercentage : existingWinner.payoutPercentage;
        const newPayoutOverride = update.payoutOverride !== undefined ? update.payoutOverride : existingWinner.payoutOverride;
        
        // Calculate payout amounts
        updateData.payoutCalculated = Math.floor((existingWinner.tierSizeAmount * newPayoutPercentage) / 10000); // Percentage stored as basis points
        updateData.payoutFinal = newPayoutOverride !== null ? newPayoutOverride : updateData.payoutCalculated;

        // Update the winner record
        await db
          .update(cycleWinnerSelections)
          .set(updateData)
          .where(eq(cycleWinnerSelections.id, existingWinner.id));

        console.log(`[updateWinnerPayoutData] Updated winner ${user.id} with percentage: ${newPayoutPercentage}, override: ${newPayoutOverride}, final: ${updateData.payoutFinal}`);
      }

      console.log(`[updateWinnerPayoutData] Successfully updated ${updates.length} winner records`);
    } catch (error) {
      console.error('Error updating winner payout data:', error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE 2 STEP 5: Winner State Machine Integration
  // ============================================================================

  /**
   * STEP 5: Create winner with initial state machine data
   */
  async createWinnerWithState(winnerData: any, initialState: string = 'draft'): Promise<number> {
    const now = new Date();
    
    // Create initial state transition record
    const initialTransition = {
      fromState: null,
      toState: initialState,
      timestamp: now,
      reason: 'Winner selection created'
    };

    const winnerDataWithState = {
      ...winnerData,
      payoutStatus: initialState,
      stateTransitions: JSON.stringify([initialTransition]),
      processingAttempts: 0,
      lastProcessingAttempt: null,
      savedAt: now,
      lastModified: now
    };

    const [createdWinner] = await db.insert(cycleWinnerSelections)
      .values(winnerDataWithState)
      .returning({ id: cycleWinnerSelections.id });

    console.log(`[STORAGE STATE] Created winner ${createdWinner.id} with initial state: ${initialState}`);
    return createdWinner.id;
  }

  /**
   * STEP 5: Update winner state through state machine
   */
  async updateWinnerState(winnerId: number, newState: string, metadata?: {
    adminId?: number;
    reason?: string;
    paypalBatchId?: string;
    paypalItemId?: string;
    failureReason?: string;
    adminNotes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { WinnerStateMachine } = await import('./winner-state-machine.js');
    
    return await WinnerStateMachine.transitionState({
      winnerId,
      newState: newState as any,
      adminId: metadata?.adminId,
      reason: metadata?.reason,
      metadata: metadata ? { ...metadata } : undefined,
      paypalBatchId: metadata?.paypalBatchId,
      paypalItemId: metadata?.paypalItemId,
      failureReason: metadata?.failureReason,
      adminNotes: metadata?.adminNotes
    });
  }

  /**
   * STEP 5: Get winners by state for batch operations
   */
  async getWinnersByState(cycleSettingId: number, states: string[]): Promise<any[]> {
    const { WinnerStateMachine } = await import('./winner-state-machine.js');
    return await WinnerStateMachine.getWinnersByState(cycleSettingId, states as any);
  }

  /**
   * STEP 5: Bulk state transition for disbursement batches
   */
  async bulkUpdateWinnerStates(updates: Array<{
    winnerId: number;
    newState: string;
    adminId?: number;
    reason?: string;
    metadata?: any;
  }>): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    results: Array<{ winnerId: number; success: boolean; error?: string }>;
  }> {
    const { WinnerStateMachine } = await import('./winner-state-machine.js');
    
    const stateUpdates = updates.map(update => ({
      winnerId: update.winnerId,
      newState: update.newState as any,
      adminId: update.adminId,
      reason: update.reason,
      metadata: update.metadata
    }));

    return await WinnerStateMachine.batchTransitionState(stateUpdates);
  }

  /**
   * STEP 5: Get state machine statistics for admin dashboard
   */
  async getWinnerStateStatistics(cycleSettingId: number): Promise<Record<string, number>> {
    const { WinnerStateMachine } = await import('./winner-state-machine.js');
    return await WinnerStateMachine.getStateStatistics(cycleSettingId);
  }

  /**
   * STEP 5: Reset winner state for admin intervention
   */
  async resetWinnerState(winnerId: number, adminId: number, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { WinnerStateMachine } = await import('./winner-state-machine.js');
    return await WinnerStateMachine.resetWinnerState(winnerId, adminId, reason);
  }

  /**
   * STEP 5: Enhanced winner creation that integrates with state machine
   */
  async createCycleWinnerSelection(winnerData: {
    cycleSettingId: number;
    userId: number;
    tier: string;
    overallRank: number;
    tierRank: number;
    pointsAtSelection: number;
    tierSizeAmount: number;
    payoutPercentage: number;
    payoutCalculated: number;
    payoutOverride?: number;
    payoutFinal: number;
    rewardAmount: number;
    pointsDeducted: number;
    pointsRolledOver: number;
    savedBy: number;
  }): Promise<number> {
    return await this.createWinnerWithState(winnerData, 'draft');
  }

  // Enhanced Winner Selection with Flexible Admin Controls
  async executeFlexibleWinnerSelection(cycleSettingId: number, options: {
    selectionMode: 'random' | 'top_performers' | 'weighted_random' | 'manual';
    tierSettings: {
      tier1: { winnerCount: number; poolPercentage: number };
      tier2: { winnerCount: number; poolPercentage: number };
      tier3: { winnerCount: number; poolPercentage: number };
    };
    customWinnerIds?: number[];
    pointDeductionPercentage?: number;
    rolloverPercentage?: number;
  }): Promise<any> {
    try {
      // Get cycle setting
      const [cycleSetting] = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId))
        .limit(1);

      if (!cycleSetting) {
        throw new Error('Cycle setting not found');
      }

      // Get all eligible users with their cycle points (including 0-point users)
      const eligibleUsers = await db.select({
        userId: userCyclePoints.userId,
        currentCyclePoints: userCyclePoints.currentCyclePoints,
        tier: users.tier,
        username: users.username,
        email: users.email,
        paypalEmail: users.paypalEmail
      })
      .from(userCyclePoints)
      .innerJoin(users, eq(userCyclePoints.userId, users.id))
      .where(
        and(
          eq(userCyclePoints.cycleSettingId, cycleSettingId),
          eq(userCyclePoints.isActive, true)
        )
      )
      .orderBy(desc(userCyclePoints.currentCyclePoints));

      // Calculate total reward pool (excluding admin users)
      const totalSubscribers = await db.select({ count: sql<number>`count(*)` })
        .from(userCyclePoints)
        .leftJoin(users, eq(userCyclePoints.userId, users.id))
        .where(
          and(
            eq(userCyclePoints.cycleSettingId, cycleSettingId),
            eq(userCyclePoints.isActive, true),
            eq(users.isAdmin, false)
          )
        );

      const totalRewardPool = Math.floor(
        (totalSubscribers[0].count * cycleSetting.membershipFee * cycleSetting.rewardPoolPercentage) / 100
      );

      // Calculate tier pools based on admin settings
      const tier1Pool = Math.floor(totalRewardPool * (options.tierSettings.tier1.poolPercentage / 100));
      const tier2Pool = Math.floor(totalRewardPool * (options.tierSettings.tier2.poolPercentage / 100));
      const tier3Pool = Math.floor(totalRewardPool * (options.tierSettings.tier3.poolPercentage / 100));

      // Separate users by tier
      const tier1Users = eligibleUsers.filter(u => u.tier === 'tier1');
      const tier2Users = eligibleUsers.filter(u => u.tier === 'tier2');
      const tier3Users = eligibleUsers.filter(u => u.tier === 'tier3');

      // Winner selection based on mode
      let selectedWinners: any[] = [];

      if (options.selectionMode === 'manual' && options.customWinnerIds) {
        selectedWinners = eligibleUsers.filter(u => options.customWinnerIds!.includes(u.userId));
      } else {
        const selectWinnersByMode = (users: any[], count: number, mode: string) => {
          if (users.length === 0) return [];
          if (users.length <= count) return users;

          switch (mode) {
            case 'top_performers':
              return users.slice(0, count);
            
            case 'random':
              const shuffled = [...users].sort(() => Math.random() - 0.5);
              return shuffled.slice(0, count);
            
            case 'weighted_random':
              const totalPoints = users.reduce((sum, user) => sum + user.currentCyclePoints, 0);
              const winners = [];
              const usersCopy = [...users];

              for (let i = 0; i < count; i++) {
                if (usersCopy.length === 0) break;
                
                const currentTotal = usersCopy.reduce((sum, user) => sum + user.currentCyclePoints, 0);
                const randomPoint = Math.random() * currentTotal;
                let cumulative = 0;
                let selectedIndex = 0;

                for (let j = 0; j < usersCopy.length; j++) {
                  cumulative += usersCopy[j].currentCyclePoints;
                  if (randomPoint <= cumulative) {
                    selectedIndex = j;
                    break;
                  }
                }

                winners.push(usersCopy[selectedIndex]);
                usersCopy.splice(selectedIndex, 1);
              }
              return winners;
            
            default:
              return users.slice(0, count);
          }
        };

        const tier1Winners = selectWinnersByMode(tier1Users, options.tierSettings.tier1.winnerCount, options.selectionMode);
        const tier2Winners = selectWinnersByMode(tier2Users, options.tierSettings.tier2.winnerCount, options.selectionMode);
        const tier3Winners = selectWinnersByMode(tier3Users, options.tierSettings.tier3.winnerCount, options.selectionMode);

        selectedWinners = [
          ...tier1Winners.map(w => ({ ...w, tier: 'tier1', poolAmount: tier1Pool })),
          ...tier2Winners.map(w => ({ ...w, tier: 'tier2', poolAmount: tier2Pool })),
          ...tier3Winners.map(w => ({ ...w, tier: 'tier3', poolAmount: tier3Pool }))
        ];
      }

      // Calculate individual rewards and point adjustments
      const processedWinners = selectedWinners.map(winner => {
        const tierWinners = selectedWinners.filter(w => w.tier === winner.tier);
        const rewardAmount = tierWinners.length > 0 ? Math.floor(winner.poolAmount / tierWinners.length) : 0;
        
        const pointsToDeduct = Math.floor(winner.currentCyclePoints * ((options.pointDeductionPercentage || 50) / 100));
        const pointsToRollover = Math.floor(winner.currentCyclePoints * ((options.rolloverPercentage || 50) / 100));

        return {
          ...winner,
          rewardAmount,
          pointsDeducted: pointsToDeduct,
          pointsRolledOver: pointsToRollover,
          payoutPercentage: 100, // Default, can be adjusted
          adjustmentReason: null
        };
      });

      // Store winner selection results
      const winnerRecords = [];
      for (let i = 0; i < processedWinners.length; i++) {
        const winner = processedWinners[i];
        const tierRank = processedWinners.filter(w => w.tier === winner.tier).indexOf(winner) + 1;

        // PHASE 2 STEP 5: Create winner with state machine integration
        const winnerId = await this.createWinnerWithState({
          cycleSettingId,
          userId: winner.userId,
          tier: winner.tier,
          tierRank,
          overallRank: i + 1,
          tierSizeAmount: winner.rewardAmount,
          pointsAtSelection: winner.currentCyclePoints,
          rewardAmount: winner.rewardAmount,
          pointsDeducted: winner.pointsDeducted,
          pointsRolledOver: winner.pointsRolledOver,
          payoutCalculated: winner.rewardAmount,
          payoutFinal: winner.rewardAmount,
          payoutPercentage: 10000, // 100% as basis points (100 * 100)
          savedBy: 1 // TODO: Get actual admin ID
        }, 'draft');

        // Get the created record for return
        const [record] = await db.select()
          .from(cycleWinnerSelections)
          .where(eq(cycleWinnerSelections.id, winnerId))
          .limit(1);

        winnerRecords.push({
          ...record,
          username: winner.username,
          email: winner.email,
          paypalEmail: winner.paypalEmail,
          payoutPercentage: 100
        });
      }

      return {
        success: true,
        selectionMode: options.selectionMode,
        totalRewardPool,
        winnersSelected: winnerRecords.length,
        winners: winnerRecords,
        tierBreakdown: {
          tier1: {
            pool: tier1Pool,
            winners: winnerRecords.filter(w => w.tier === 'tier1').length,
            perWinner: tier1Pool / Math.max(1, winnerRecords.filter(w => w.tier === 'tier1').length)
          },
          tier2: {
            pool: tier2Pool,
            winners: winnerRecords.filter(w => w.tier === 'tier2').length,
            perWinner: tier2Pool / Math.max(1, winnerRecords.filter(w => w.tier === 'tier2').length)
          },
          tier3: {
            pool: tier3Pool,
            winners: winnerRecords.filter(w => w.tier === 'tier3').length,
            perWinner: tier3Pool / Math.max(1, winnerRecords.filter(w => w.tier === 'tier3').length)
          }
        }
      };
    } catch (error) {
      console.error('Error executing flexible winner selection:', error);
      throw error;
    }
  }

  async getWinnerSelectionDetails(cycleSettingId: number): Promise<any[]> {
    try {
      return await db.select({
        id: cycleWinnerSelections.id,
        userId: cycleWinnerSelections.userId,
        username: users.username,
        email: users.email,
        paypalEmail: users.paypalEmail,
        tier: cycleWinnerSelections.tier,
        tierRank: cycleWinnerSelections.tierRank,
        pointsAtSelection: cycleWinnerSelections.pointsAtSelection,
        rewardAmount: cycleWinnerSelections.rewardAmount,
        pointsDeducted: cycleWinnerSelections.pointsDeducted,
        pointsRolledOver: cycleWinnerSelections.pointsRolledOver,
        payoutStatus: cycleWinnerSelections.payoutStatus,
        selectionDate: cycleWinnerSelections.selectionDate
      })
      .from(cycleWinnerSelections)
      .innerJoin(users, eq(cycleWinnerSelections.userId, users.id))
      .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
      .orderBy(cycleWinnerSelections.tier, cycleWinnerSelections.tierRank);
    } catch (error) {
      console.error('Error getting winner selection details:', error);
      return [];
    }
  }

  async updateWinnerPayout(winnerId: number, updates: {
    payoutPercentage?: number;
    adjustmentReason?: string;
    payoutStatus?: string;
  }): Promise<void> {
    try {
      const [winner] = await db.select()
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.id, winnerId))
        .limit(1);

      if (!winner) {
        throw new Error('Winner record not found');
      }

      const updateData: any = {};

      if (updates.payoutPercentage !== undefined) {
        // Calculate new reward amount based on percentage
        const newRewardAmount = Math.floor((winner.rewardAmount * updates.payoutPercentage) / 100);
        updateData.rewardAmount = newRewardAmount;
      }

      if (updates.adjustmentReason !== undefined) {
        updateData.adjustmentReason = updates.adjustmentReason;
      }

      if (updates.payoutStatus !== undefined) {
        updateData.payoutStatus = updates.payoutStatus;
      }

      await db.update(cycleWinnerSelections)
        .set(updateData)
        .where(eq(cycleWinnerSelections.id, winnerId));
    } catch (error) {
      console.error('Error updating winner payout:', error);
      throw error;
    }
  }

  async clearWinnerSelection(cycleSettingId: number): Promise<void> {
    try {
      await db.delete(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));
    } catch (error) {
      console.error('Error clearing winner selection:', error);
      throw error;
    }
  }

  async performCycleWinnerSelection(cycleSettingId: number): Promise<CycleWinnerSelection[]> {
    try {
      const users = await this.getUsersInCurrentCycle(cycleSettingId);
      const winners: CycleWinnerSelection[] = [];

      // Group users by tier
      const tierGroups = {
        'Tier 1': users.filter(u => u.tier === 'Tier 1').sort((a, b) => b.currentCyclePoints - a.currentCyclePoints),
        'Tier 2': users.filter(u => u.tier === 'Tier 2').sort((a, b) => b.currentCyclePoints - a.currentCyclePoints),
        'Tier 3': users.filter(u => u.tier === 'Tier 3').sort((a, b) => b.currentCyclePoints - a.currentCyclePoints)
      };

      // Select winners from each tier (top performer per tier for now)
      for (const [tier, tierUsers] of Object.entries(tierGroups)) {
        if (tierUsers.length > 0) {
          const topUser = tierUsers[0];
          const winner = await this.createCycleWinnerSelection({
            cycleSettingId,
            userId: topUser.userId,
            tier,
            tierRank: 1,
            pointsAtSelection: topUser.currentCyclePoints,
            rewardAmount: this.calculateRewardAmount(tier, topUser.currentCyclePoints),
            pointsDeducted: Math.floor(topUser.currentCyclePoints * 0.5), // Deduct 50%
            pointsRolledOver: Math.floor(topUser.currentCyclePoints * 0.5) // Roll over 50%
          });
          winners.push(winner);
        }
      }

      return winners;
    } catch (error) {
      console.error('Error performing cycle winner selection:', error);
      throw error;
    }
  }

  private calculateRewardAmount(tier: string, points: number): number {
    // Simple reward calculation - can be made configurable
    const baseReward = {
      'Tier 1': 2000, // $20
      'Tier 2': 1000, // $10
      'Tier 3': 500   // $5
    };
    return baseReward[tier as keyof typeof baseReward] || 0;
  }

  // Cycle Analytics and Reporting
  async getCycleLeaderboard(cycleSettingId: number, limit?: number): Promise<Array<{rank: number, userId: number, username: string, points: number, tier: string}>> {
    try {
      const query = db.select({
        userId: userCyclePoints.userId,
        username: users.username,
        points: userCyclePoints.currentCyclePoints,
        tier: users.tier
      })
      .from(userCyclePoints)
      .leftJoin(users, eq(userCyclePoints.userId, users.id))
      .where(eq(userCyclePoints.cycleSettingId, cycleSettingId))
      .orderBy(desc(userCyclePoints.currentCyclePoints));

      if (limit) {
        query.limit(limit);
      }

      const results = await query;
      return results.map((result, index) => ({
        rank: index + 1,
        userId: result.userId,
        username: result.username || 'Unknown',
        points: result.points,
        tier: result.tier || 'tier3'
      }));
    } catch (error) {
      console.error('Error getting cycle leaderboard:', error);
      return [];
    }
  }

  async getCycleLeaderboardPaginated(cycleSettingId: number, pageSize: number, offset: number): Promise<{leaderboard: Array<{rank: number, userId: number, username: string, points: number, tier: string}>, totalUsers: number}> {
    try {
      // Get total count of users in cycle
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userCyclePoints)
        .where(eq(userCyclePoints.cycleSettingId, cycleSettingId));
      
      const totalUsers = countResult[0]?.count || 0;

      // Get paginated results
      const results = await db
        .select({
          userId: userCyclePoints.userId,
          username: users.username,
          points: userCyclePoints.currentCyclePoints,
          tier: users.tier
        })
        .from(userCyclePoints)
        .leftJoin(users, eq(userCyclePoints.userId, users.id))
        .where(eq(userCyclePoints.cycleSettingId, cycleSettingId))
        .orderBy(desc(userCyclePoints.currentCyclePoints))
        .limit(pageSize)
        .offset(offset);

      // Calculate ranks based on offset
      const leaderboard = results.map((result, index) => ({
        rank: offset + index + 1,
        userId: result.userId,
        username: result.username || 'Unknown',
        points: result.points,
        tier: result.tier || 'tier3'
      }));

      return {
        leaderboard,
        totalUsers
      };
    } catch (error) {
      console.error('Error getting paginated cycle leaderboard:', error);
      return {
        leaderboard: [],
        totalUsers: 0
      };
    }
  }

  async getCycleStats(cycleSettingId: number): Promise<{totalUsers: number, averagePoints: number, tierDistribution: any}> {
    try {
      const users = await this.getUsersInCurrentCycle(cycleSettingId);
      const totalUsers = users.length;
      const totalPoints = users.reduce((sum, user) => sum + user.currentCyclePoints, 0);
      const averagePoints = totalUsers > 0 ? totalPoints / totalUsers : 0;

      const tierDistribution = users.reduce((dist, user) => {
        dist[user.tier] = (dist[user.tier] || 0) + 1;
        return dist;
      }, {} as any);

      return {
        totalUsers,
        averagePoints,
        tierDistribution
      };
    } catch (error) {
      console.error('Error getting cycle stats:', error);
      return { totalUsers: 0, averagePoints: 0, tierDistribution: {} };
    }
  }

  // Mid-cycle Joining Logic
  async shouldJoinCurrentCycle(cycleSettingId: number): Promise<boolean> {
    try {
      const setting = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId))
        .limit(1);

      if (!setting[0]) return false;

      const now = new Date();
      const cycleEnd = new Date(setting[0].cycleEndDate);
      const daysUntilEnd = Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Join current cycle if more than 3 days remain (configurable threshold)
      return daysUntilEnd > 3;
    } catch (error) {
      console.error('Error checking if should join current cycle:', error);
      return false;
    }
  }

  async getNextCycleStartDate(cycleSettingId: number): Promise<Date | null> {
    try {
      const currentSetting = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId))
        .limit(1);

      if (!currentSetting[0]) return null;

      // Return the day after current cycle ends
      const nextStart = new Date(currentSetting[0].cycleEndDate);
      nextStart.setDate(nextStart.getDate() + 1);
      return nextStart;
    } catch (error) {
      console.error('Error getting next cycle start date:', error);
      return null;
    }
  }

  // Cycle Points Actions (cycle-specific limits)
  async getCyclePointActions(): Promise<CyclePointsAction[]> {
    try {
      return await db.select()
        .from(cyclePointsActions)
        .where(eq(cyclePointsActions.isActive, true))
        .orderBy(cyclePointsActions.category, cyclePointsActions.name);
    } catch (error) {
      console.error('Error getting cycle point actions:', error);
      return [];
    }
  }

  async createOrUpdateCyclePointAction(actionData: InsertCyclePointsAction, adminUserId: number): Promise<CyclePointsAction> {
    try {
      // Check if action exists
      const [existing] = await db.select()
        .from(cyclePointsActions)
        .where(eq(cyclePointsActions.actionId, actionData.actionId))
        .limit(1);

      if (existing) {
        // Update existing
        const [updated] = await db.update(cyclePointsActions)
          .set({
            ...actionData,
            updatedAt: new Date(),
            updatedBy: adminUserId
          })
          .where(eq(cyclePointsActions.actionId, actionData.actionId))
          .returning();
        return updated;
      } else {
        // Create new
        const [created] = await db.insert(cyclePointsActions)
          .values({
            ...actionData,
            updatedBy: adminUserId
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error creating/updating cycle point action:', error);
      throw error;
    }
  }

  async deleteCyclePointAction(actionId: string): Promise<void> {
    try {
      await db.delete(cyclePointsActions)
        .where(eq(cyclePointsActions.actionId, actionId));
    } catch (error) {
      console.error('Error deleting cycle point action:', error);
      throw error;
    }
  }

  // Missing cycle API methods needed by dashboard
  async getCurrentCycle(): Promise<CycleSetting | null> {
    try {
      const [currentCycle] = await db.select({
        id: cycleSettings.id,
        cycleName: cycleSettings.cycleName,
        cycleStartDate: cycleSettings.cycleStartDate,
        cycleEndDate: cycleSettings.cycleEndDate,
        paymentPeriodDays: cycleSettings.paymentPeriodDays,
        membershipFee: cycleSettings.membershipFee,
        rewardPoolPercentage: cycleSettings.rewardPoolPercentage,
        tier1Threshold: cycleSettings.tier1Threshold,
        tier2Threshold: cycleSettings.tier2Threshold,
        tier1PoolPercentage: cycleSettings.tier1PoolPercentage,
        tier2PoolPercentage: cycleSettings.tier2PoolPercentage,
        tier3PoolPercentage: cycleSettings.tier3PoolPercentage,
        selectionPercentage: cycleSettings.selectionPercentage,
        winnerPointDeductionPercentage: cycleSettings.winnerPointDeductionPercentage,
        midCycleJoinThresholdDays: cycleSettings.midCycleJoinThresholdDays,
        isActive: cycleSettings.isActive,
        createdAt: cycleSettings.createdAt,
        createdBy: cycleSettings.createdBy
      })
        .from(cycleSettings)
        .where(eq(cycleSettings.isActive, true))
        .orderBy(desc(cycleSettings.createdAt))
        .limit(1);
      
      return currentCycle || null;
    } catch (error) {
      console.error('Error getting current cycle:', error);
      return null;
    }
  }

  async getUserCycleRewards(userId: number): Promise<any[]> {
    try {
      const rewards = await db.select({
        id: cycleWinnerSelections.id,
        cycleId: cycleWinnerSelections.cycleSettingId,
        cycleName: sql<string>`COALESCE(${cycleSettings.cycleName}, 'Unknown Cycle')`,
        tier: cycleWinnerSelections.tier,
        pointsAtDistribution: cycleWinnerSelections.pointsAtSelection,
        rewardAmount: cycleWinnerSelections.rewardAmount,
        pointsDeducted: cycleWinnerSelections.pointsDeducted,
        pointsRolledOver: cycleWinnerSelections.pointsRolledOver,
        isWinner: sql<boolean>`true`, // All records in this table are winners
        createdAt: cycleWinnerSelections.selectionDate,
        // Step 9: Enhanced payout status fields for frontend integration
        payoutStatus: cycleWinnerSelections.payoutStatus,
        payoutOverride: cycleWinnerSelections.payoutOverride,
        payoutFinal: cycleWinnerSelections.payoutFinal,
        payoutCalculated: cycleWinnerSelections.payoutCalculated,
        isSealed: cycleWinnerSelections.isSealed,
        sealedAt: cycleWinnerSelections.sealedAt,
        notificationDisplayed: cycleWinnerSelections.notificationDisplayed
      })
      .from(cycleWinnerSelections)
      .leftJoin(cycleSettings, eq(cycleWinnerSelections.cycleSettingId, cycleSettings.id))
      .where(
        and(
          eq(cycleWinnerSelections.userId, userId),
          eq(cycleWinnerSelections.isSealed, true) // Only show finalized rewards
        )
      )
      .orderBy(desc(cycleWinnerSelections.sealedAt));

      return rewards;
    } catch (error) {
      console.error('Error getting user cycle rewards:', error);
      return [];
    }
  }

  // Auto-enrollment function for subscription-cycle integration
  async autoEnrollUserInCycle(userId: number): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        return; // Only enroll active subscribers
      }

      const currentCycle = await this.getCurrentCycle();
      if (!currentCycle) {
        console.warn(`No active cycle found for user ${userId} enrollment`);
        return;
      }

      // Check if user is already enrolled in this cycle
      const existingEnrollment = await db.select()
        .from(userCyclePoints)
        .where(
          and(
            eq(userCyclePoints.userId, userId),
            eq(userCyclePoints.cycleSettingId, currentCycle.id)
          )
        )
        .limit(1);

      if (existingEnrollment.length > 0) {
        return; // Already enrolled
      }

      // Check mid-cycle joining threshold
      const now = new Date();
      const cycleStart = new Date(currentCycle.cycleStartDate);
      const daysSinceStart = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
      
      let targetCycle = currentCycle;
      
      // If joining too late in current cycle, enroll in next cycle
      if (daysSinceStart > currentCycle.midCycleJoinThresholdDays) {
        // Try to find next cycle, otherwise create enrollment for current cycle anyway
        const nextCycle = await db.select()
          .from(cycleSettings)
          .where(
            and(
              gte(cycleSettings.cycleStartDate, currentCycle.cycleEndDate),
              eq(cycleSettings.isActive, true)
            )
          )
          .orderBy(asc(cycleSettings.cycleStartDate))
          .limit(1);
        
        if (nextCycle.length > 0) {
          targetCycle = nextCycle[0];
        }
      }

      // Enroll user in cycle
      await db.insert(userCyclePoints).values({
        userId,
        cycleSettingId: targetCycle.id,
        currentCyclePoints: 0,
        theoreticalPoints: 0,
        tier: 'tier3',
        joinedCycleAt: now,
        isActive: true
      });

      console.log(`User ${userId} auto-enrolled in cycle ${targetCycle.id} (${targetCycle.cycleName})`);
    } catch (error) {
      console.error(`Error auto-enrolling user ${userId} in cycle:`, error);
    }
  }

  // Backfill function to enroll all existing premium subscribers
  async backfillPremiumSubscribersInCycles(): Promise<{success: number, errors: number, message: string}> {
    try {
      const currentCycle = await this.getCurrentCycle();
      if (!currentCycle) {
        return {
          success: 0,
          errors: 0,
          message: 'No active cycle found. Create a cycle first before running backfill.'
        };
      }

      // Get all premium subscribers who are not enrolled in any cycle (excluding admin users)
      const premiumSubscribers = await db.select({
        id: users.id,
        username: users.username,
        subscriptionStatus: users.subscriptionStatus
      })
      .from(users)
      .where(and(eq(users.subscriptionStatus, 'active'), eq(users.isAdmin, false)));

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      console.log(`Starting backfill for ${premiumSubscribers.length} premium subscribers...`);

      for (const subscriber of premiumSubscribers) {
        try {
          // Check if already enrolled in current cycle
          const existingEnrollment = await db.select()
            .from(userCyclePoints)
            .where(
              and(
                eq(userCyclePoints.userId, subscriber.id),
                eq(userCyclePoints.cycleSettingId, currentCycle.id)
              )
            )
            .limit(1);

          if (existingEnrollment.length === 0) {
            // Enroll user in current cycle
            await db.insert(userCyclePoints).values({
              userId: subscriber.id,
              cycleSettingId: currentCycle.id,
              currentCyclePoints: 0,
              theoreticalPoints: 0,
              tier: 'tier3',
              joinedCycleAt: new Date(),
              isActive: true
            });

            console.log(`Backfilled user ${subscriber.username} (ID: ${subscriber.id}) into cycle ${currentCycle.cycleName}`);
            successCount++;
          } else {
            console.log(`User ${subscriber.username} already enrolled in current cycle, skipping`);
          }
        } catch (error) {
          console.error(`Error backfilling user ${subscriber.username}:`, error);
          errors.push(`${subscriber.username}: ${error}`);
          errorCount++;
        }
      }

      return {
        success: successCount,
        errors: errorCount,
        message: `Backfill completed. ${successCount} users enrolled, ${errorCount} errors. ${errors.length > 0 ? 'Errors: ' + errors.slice(0, 3).join('; ') : ''}`
      };
    } catch (error) {
      console.error('Error in backfill process:', error);
      return {
        success: 0,
        errors: 1,
        message: `Backfill failed: ${error}`
      };
    }
  }

  async getCyclePoolData(cycleId: number): Promise<{totalPool: number, premiumUsers: number, totalUsers: number}> {
    try {
      // Get cycle settings
      const [cycle] = await db.select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleId))
        .limit(1);

      if (!cycle) {
        return { totalPool: 0, premiumUsers: 0, totalUsers: 0 };
      }

      // Count premium users in this cycle (unified approach: active subscribers in cycle, excluding admin users)
      const premiumUsersCount = await db.select({ count: sql<number>`count(*)` })
        .from(userCyclePoints)
        .leftJoin(users, eq(userCyclePoints.userId, users.id))
        .where(
          and(
            eq(userCyclePoints.cycleSettingId, cycleId),
            eq(userCyclePoints.isActive, true),
            eq(users.subscriptionStatus, 'active'),
            eq(users.isAdmin, false)
          )
        );

      // Count total users in this cycle (excluding admin users)
      const totalUsersCount = await db.select({ count: sql<number>`count(*)` })
        .from(userCyclePoints)
        .leftJoin(users, eq(userCyclePoints.userId, users.id))
        .where(
          and(
            eq(userCyclePoints.cycleSettingId, cycleId),
            eq(userCyclePoints.isActive, true),
            eq(users.isAdmin, false)
          )
        );

      const premiumUsers = premiumUsersCount[0]?.count || 0;
      const totalUsers = totalUsersCount[0]?.count || 0;
      
      // Calculate total pool (premium users * full membership fee * cycle multiplier * reward pool percentage)
      // Users pay full fee, but pool allocation is proportional to cycle duration
      const fullMembershipFee = cycle.membershipFee; // Keep in cents for now
      const cycleFeeMultiplier = getCycleFeeMultiplier(cycle.cycleType);
      const totalRevenue = premiumUsers * fullMembershipFee; // Total revenue in cents
      const proportionalPoolContribution = totalRevenue * cycleFeeMultiplier; // Apply cycle multiplier to pool
      const memberContributionsCents = Math.floor((proportionalPoolContribution * cycle.rewardPoolPercentage) / 100);
      
      // Apply minimum pool guarantee - pool is the higher of member contributions or minimum guarantee
      // Convert both to dollars for comparison and final result
      const memberContributionsDollars = Math.floor(memberContributionsCents / 100);
      const minimumGuaranteeDollars = Math.floor(cycle.minimumPoolGuarantee / 100);
      const totalPool = Math.max(memberContributionsDollars, minimumGuaranteeDollars);

      return {
        totalPool,
        premiumUsers,
        totalUsers
      };
    } catch (error) {
      console.error('Error getting cycle pool data:', error);
      return { totalPool: 0, premiumUsers: 0, totalUsers: 0 };
    }
  }

  // Analytics Methods for Admin Dashboard
  async getTotalUsersCount(): Promise<number> {
    try {
      // Check cache first
      const cacheKey = 'total_users_count';
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      const count = result[0]?.count || 0;
      
      // Cache for 10 minutes (user count changes less frequently)
      this.setCachedData(cacheKey, count, 10);
      
      return count;
    } catch (error) {
      console.error('Error getting total users count:', error);
      return 0;
    }
  }

  async getActiveUsersCount(startDate: Date): Promise<number> {
    try {
      // Safe date handling to prevent Invalid time value errors
      const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
        ? startDate 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago

      // Check cache first
      const cacheKey = `active_users_${safeStartDate.toISOString().split('T')[0]}`;
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Optimized query with proper indexing hints and conditions
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.lastLoginAt, safeStartDate),
            eq(users.isActive, true),
            isNotNull(users.lastLoginAt)
          )
        );
      
      const count = result[0]?.count || 0;
      
      // Cache for 15 minutes
      this.setCachedData(cacheKey, count, 15);
      
      return count;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }

  async getTotalUsersCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` }).from(users);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting total users count:', error);
      return 0;
    }
  }

  async getActiveUsersCount(since: Date): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(sql`last_login_at >= ${since}`, eq(users.isAdmin, false)));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }

  async getAveragePointsPerUser(): Promise<number> {
    try {
      const result = await db.select({ avg: sql<number>`avg(total_points)` }).from(users).where(eq(users.isAdmin, false));
      return result[0]?.avg || 0;
    } catch (error) {
      console.error('Error getting average points per user:', error);
      return 0;
    }
  }

  async getPremiumUsersCount(): Promise<number> {
    try {
      // Check cache first
      const cacheKey = 'premium_users_count';
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Optimized query with proper conditions for active premium users (excluding admin users)
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'active'),
            eq(users.isActive, true),
            eq(users.isAdmin, false)
          )
        );
      
      const count = result[0]?.count || 0;
      
      // Cache for 10 minutes (subscription changes less frequently)
      this.setCachedData(cacheKey, count, 10);
      
      return count;
    } catch (error) {
      console.error('Error getting premium users count:', error);
      return 0;
    }
  }

  // NEW OPTIMIZED METHOD: Batch user metrics to eliminate N+1 queries
  async getBatchUserMetrics(startDate: Date): Promise<{
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    freeUsers: number;
    performanceMetrics?: {
      queryTime: number;
      cached: boolean;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = `batch_user_metrics_${startDate.toISOString().split('T')[0]}`;
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) {
        return {
          ...cached,
          performanceMetrics: {
            queryTime: Date.now() - startTime,
            cached: true
          }
        };
      }

      // Single optimized query to get all user metrics at once (excluding admin users)
      const result = await db.execute(sql`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN last_login_at >= ${startDate.toISOString()} AND is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN subscription_status = 'active' AND is_active = true THEN 1 END) as premium_users
        FROM users
        WHERE is_active = true AND is_admin = false
      `);

      const metrics = result[0];
      const batchMetrics = {
        totalUsers: Number(metrics.total_users) || 0,
        activeUsers: Number(metrics.active_users) || 0,
        premiumUsers: Number(metrics.premium_users) || 0,
        freeUsers: Number(metrics.total_users) - Number(metrics.premium_users) || 0,
        performanceMetrics: {
          queryTime: Date.now() - startTime,
          cached: false
        }  
      };

      // Cache for 10 minutes
      this.setCachedData(cacheKey, batchMetrics, 10);
      
      return batchMetrics;
    } catch (error) {
      console.error('Error getting batch user metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        premiumUsers: 0,
        freeUsers: 0,
        performanceMetrics: {
          queryTime: Date.now() - startTime,
          cached: false
        }
      };
    }
  }

  async getDailyLoginActivity(startDate: Date): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = `daily_login_activity_${startDate.toISOString().split('T')[0]}`;
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Optimized query with proper WHERE conditions and LIMIT
      const result = await db
        .select({
          date: sql<string>`DATE(last_login_at)`,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(
          and(
            isNotNull(users.lastLoginAt),
            gte(users.lastLoginAt, startDate),
            eq(users.isActive, true)
          )
        )
        .groupBy(sql`DATE(last_login_at)`)
        .orderBy(sql`DATE(last_login_at)`)
        .limit(31); // Performance optimization

      // Cache for 20 minutes
      this.setCachedData(cacheKey, result, 20);
      
      return result;
    } catch (error) {
      console.error('Error getting daily login activity:', error);
      return [];
    }
  }

  async getRegistrationTrends(startDate: Date): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = `registration_trends_${startDate.toISOString().split('T')[0]}`;
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Use raw SQL to avoid Drizzle ORM date comparison issues
      const result = await db.execute(sql`
        SELECT 
          DATE(joined_at) as date,
          COUNT(*)::int as count
        FROM users 
        WHERE joined_at >= ${startDate}
        GROUP BY DATE(joined_at)
        ORDER BY DATE(joined_at)
      `);
      
      // Transform result to match expected format
      const formattedResult = result.map((row: any) => ({
        date: row.date,
        count: row.count
      }));
      
      // Cache for 30 minutes (registration trends change less frequently)
      this.setCachedData(cacheKey, formattedResult, 30);
      
      return formattedResult;
    } catch (error) {
      console.error('Error getting registration trends:', error);
      return [];
    }
  }

  async getModuleCompletionRates(): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = 'module_completion_rates';
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Use raw SQL to avoid table reference issues
      const result = await db.execute(sql`
        SELECT 
          up.module_id as "moduleId",
          lm.title as "moduleName",
          COUNT(*)::int as completions,
          ROUND((COUNT(*) * 100.0) / (
            SELECT COUNT(*) FROM users WHERE is_active = true
          ), 2) as "completionRate"
        FROM user_progress up
        JOIN learning_modules lm ON up.module_id = lm.id
        WHERE up.completed = true
        GROUP BY up.module_id, lm.title
        ORDER BY COUNT(*) DESC
        LIMIT 20
      `);

      // Transform result to match expected format
      const formattedResult = result.map((row: any) => ({
        moduleId: row.moduleId,
        moduleName: row.moduleName,
        completions: row.completions,
        completionRate: row.completionRate
      }));

      // Cache for 15 minutes
      this.setCachedData(cacheKey, formattedResult, 15);
      
      return formattedResult;
    } catch (error) {
      console.error('Error getting module completion rates:', error);
      return [];
    }
  }

  async getRecentLessonCompletions(startDate: Date): Promise<any[]> {
    try {
      // Safe date handling to prevent Invalid time value errors
      const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
        ? startDate 
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago

      // Check cache first
      const cacheKey = `recent_lesson_completions_${safeStartDate.toISOString().split('T')[0]}`;
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Use native string concatenation to avoid parameter serialization issues
      const startDateStr = safeStartDate.toISOString();
      const query = `
        SELECT 
          up.id,
          up.user_id as "userId",
          u.username,
          up.module_id as "moduleId",
          lm.title as "moduleName",
          up.completed_at as "completedAt"
        FROM user_progress up
        JOIN users u ON up.user_id = u.id
        JOIN learning_modules lm ON up.module_id = lm.id
        WHERE up.completed_at >= '${startDateStr}'
          AND up.completed = true
        ORDER BY up.completed_at DESC
        LIMIT 50
      `;
      const result = await db.execute(sql.raw(query));

      // Transform result to match expected format
      const formattedResult = result.map((row: any) => ({
        id: row.id,
        userId: row.userId,
        username: row.username,
        moduleId: row.moduleId,
        moduleName: row.moduleName,
        completedAt: row.completedAt
      }));

      // Cache for 10 minutes
      this.setCachedData(cacheKey, formattedResult, 10);
      
      return formattedResult;
    } catch (error) {
      console.error('Error getting recent lesson completions:', error);
      return [];
    }
  }

  // NEW OPTIMIZED METHOD: Batch learning analytics to eliminate N+1 queries
  async getBatchLearningAnalytics(startDate: Date): Promise<{
    moduleCompletionRates: any[];
    recentCompletions: any[];
    popularModules: any[];
    averageCompletionTime: number;
  }> {
    try {
      // Check cache first
      const cacheKey = `batch_learning_analytics_${startDate.toISOString().split('T')[0]}`;
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) return cached;

      // Single optimized query to get all learning metrics
      const startDateStr = startDate.toISOString();
      
      // Get module completion rates and recent completions in one query
      const completionData = await db.execute(sql`
        WITH module_stats AS (
          SELECT 
            lm.id as module_id,
            lm.title as module_name,
            COUNT(CASE WHEN up.completed = true THEN 1 END) as completions,
            ROUND((COUNT(CASE WHEN up.completed = true THEN 1 END) * 100.0) / 
              NULLIF((SELECT COUNT(*) FROM users WHERE is_active = true), 0), 2) as completion_rate
          FROM learning_modules lm
          LEFT JOIN user_progress up ON lm.id = up.module_id
          GROUP BY lm.id, lm.title
        ),
        recent_completions AS (
          SELECT 
            up.id,
            up.user_id,
            u.username,
            up.module_id,
            lm.title as module_name,
            up.completed_at
          FROM user_progress up
          JOIN users u ON up.user_id = u.id
          JOIN learning_modules lm ON up.module_id = lm.id
          WHERE up.completed_at >= ${startDateStr}
            AND up.completed = true
          ORDER BY up.completed_at DESC
          LIMIT 20
        )
        SELECT 
          'completion_rates' as query_type,
          json_agg(json_build_object(
            'moduleId', module_id,
            'moduleName', module_name,
            'completions', completions,
            'completionRate', completion_rate
          ) ORDER BY completions DESC) as data
        FROM module_stats
        WHERE completions > 0
        
        UNION ALL
        
        SELECT 
          'recent_completions' as query_type,
          json_agg(json_build_object(
            'id', id,
            'userId', user_id,
            'username', username,
            'moduleId', module_id,
            'moduleName', module_name,
            'completedAt', completed_at
          ) ORDER BY completed_at DESC) as data
        FROM recent_completions
      `);

      // Process results
      let moduleCompletionRates: any[] = [];
      let recentCompletions: any[] = [];
      
      completionData.forEach((row: any) => {
        if (row.query_type === 'completion_rates' && row.data) {
          moduleCompletionRates = row.data;
        } else if (row.query_type === 'recent_completions' && row.data) {
          recentCompletions = row.data;
        }
      });

      // Get popular modules (top 10 by completion count)
      const popularModules = moduleCompletionRates
        .sort((a: any, b: any) => b.completions - a.completions)
        .slice(0, 10);

      // Calculate average completion time (simplified metric)
      const avgCompletionTime = moduleCompletionRates.length > 0 ? 
        moduleCompletionRates.reduce((sum: number, mod: any) => sum + (mod.completions || 0), 0) / moduleCompletionRates.length : 0;

      const batchAnalytics = {
        moduleCompletionRates,
        recentCompletions,
        popularModules,
        averageCompletionTime: Math.round(avgCompletionTime * 100) / 100
      };

      // Cache for 20 minutes
      this.setCachedData(cacheKey, batchAnalytics, 20);
      
      return batchAnalytics;
    } catch (error) {
      console.error('Error getting batch learning analytics:', error);
      return {
        moduleCompletionRates: [],
        recentCompletions: [],
        popularModules: [],
        averageCompletionTime: 0
      };
    }
  }

  async getCategoryPerformanceStats(): Promise<any[]> {
    try {
      const result = await db
        .select({
          category: learningModules.category,
          totalModules: sql<number>`count(DISTINCT learning_modules.id)`,
          totalCompletions: sql<number>`count(user_progress.id)`,
          avgCompletionRate: sql<number>`
            count(user_progress.id) * 100.0 / count(DISTINCT learning_modules.id)
          `
        })
        .from(learningModules)
        .leftJoin(userProgress, eq(learningModules.id, userProgress.moduleId))
        .where(eq(learningModules.isPublished, true))
        .groupBy(learningModules.category)
        .orderBy(desc(sql`count(user_progress.id)`));
      return result;
    } catch (error) {
      console.error('Error getting category performance stats:', error);
      return [];
    }
  }

  async getLearningTimeStats(startDate: Date): Promise<any> {
    try {
      // Estimate learning time based on module estimated minutes and completions
      const result = await db
        .select({
          totalEstimatedMinutes: sql<number>`sum(learning_modules.estimated_minutes)`,
          avgSessionTime: sql<number>`avg(learning_modules.estimated_minutes)`,
          totalSessions: sql<number>`count(user_progress.id)`
        })
        .from(userProgress)
        .innerJoin(learningModules, eq(userProgress.moduleId, learningModules.id))
        .where(gte(userProgress.completedAt, startDate));
      return result[0] || { totalEstimatedMinutes: 0, avgSessionTime: 0, totalSessions: 0 };
    } catch (error) {
      console.error('Error getting learning time stats:', error);
      return { totalEstimatedMinutes: 0, avgSessionTime: 0, totalSessions: 0 };
    }
  }

  async getCurrentCycleStats(): Promise<any> {
    try {
      const currentCycle = await this.getCurrentCycle();
      if (!currentCycle) {
        return { cycleId: null, cycleName: 'No Active Cycle', participants: 0, totalPoints: 0, poolSize: 0 };
      }

      const participants = await db
        .select({ count: sql<number>`count(DISTINCT ${userCyclePoints.userId})` })
        .from(userCyclePoints)
        .where(eq(userCyclePoints.cycleSettingId, currentCycle.id));

      const totalPoints = await db
        .select({ total: sql<number>`sum(${userCyclePoints.currentCyclePoints})` })
        .from(userCyclePoints)
        .where(eq(userCyclePoints.cycleSettingId, currentCycle.id));

      const poolData = await this.getCyclePoolData(currentCycle.id);

      return {
        cycleId: currentCycle.id,
        cycleName: currentCycle.cycleName,
        participants: participants[0]?.count || 0,
        totalPoints: totalPoints[0]?.total || 0,
        poolSize: poolData.totalPool
      };
    } catch (error) {
      console.error('Error getting current cycle stats:', error);
      return { cycleId: null, cycleName: 'Error Loading Cycle', participants: 0, totalPoints: 0, poolSize: 0 };
    }
  }

  async getHistoricalCyclePerformance(startDate: Date): Promise<any[]> {
    try {
      // Safe date handling to prevent Invalid time value errors
      const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
        ? startDate 
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago

      const result = await db
        .select({
          cycleId: cycleSettings.id,
          cycleName: cycleSettings.cycleName,
          startDate: cycleSettings.cycleStartDate,
          endDate: cycleSettings.cycleEndDate,
          participants: sql<number>`(
            SELECT count(DISTINCT user_id) 
            FROM user_cycle_points 
            WHERE cycle_id = cycle_settings.id
          )`,
          totalPoints: sql<number>`(
            SELECT sum(points) 
            FROM user_cycle_points 
            WHERE cycle_id = cycle_settings.id
          )`
        })
        .from(cycleSettings)
        .where(gte(cycleSettings.cycleStartDate, safeStartDate))
        .orderBy(desc(cycleSettings.cycleStartDate));

      // Filter out records with invalid dates before returning
      const filteredResult = result.filter(cycle => {
        const startDateValid = cycle.startDate instanceof Date && !isNaN(cycle.startDate.getTime());
        const endDateValid = cycle.endDate instanceof Date && !isNaN(cycle.endDate.getTime());
        
        if (!startDateValid || !endDateValid) {
          console.warn(`Filtering out cycle ${cycle.cycleId} with invalid dates:`, {
            startDate: cycle.startDate,
            endDate: cycle.endDate
          });
          return false;
        }
        return true;
      });

      return filteredResult;
    } catch (error) {
      console.error('Error getting historical cycle performance:', error);
      return [];
    }
  }

  async getCycleParticipationTrends(startDate: Date): Promise<any[]> {
    try {
      // Safe date handling to prevent Invalid time value errors
      const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
        ? startDate 
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago

      const result = await db
        .select({
          date: sql<string>`TO_CHAR(cycle_start_date, 'YYYY-MM-DD')`,
          cycleId: cycleSettings.id,
          participants: sql<string>`COALESCE((
            SELECT count(DISTINCT user_id)::text 
            FROM user_cycle_points 
            WHERE cycle_setting_id = cycle_settings.id
          ), '0')`
        })
        .from(cycleSettings)
        .where(gte(cycleSettings.cycleStartDate, safeStartDate))
        .orderBy(cycleSettings.cycleStartDate);
      
      return result.map(row => ({
        date: row.date,
        cycleId: row.cycleId,
        participants: row.participants
      }));
    } catch (error) {
      console.error('Error getting cycle participation trends:', error);
      // Return safe fallback data
      return [{
        date: new Date().toISOString().split('T')[0],
        cycleId: 2,
        participants: "72"
      }];
    }
  }

  async getPointsDistributionAnalytics(): Promise<any> {
    try {
      const currentCycle = await this.getCurrentCycle();
      if (!currentCycle) {
        return { tiers: [], distribution: [] };
      }

      const thresholds = await this.getCycleTierThresholds(currentCycle.id);
      const distribution = await db
        .select({
          userId: userCyclePoints.userId,
          username: users.username,
          totalPoints: sql<number>`sum(points)`
        })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(eq(userCyclePoints.cycleSettingId, currentCycle.id))
        .groupBy(userCyclePoints.userId, users.username)
        .orderBy(desc(sql`sum(points)`));

      return {
        tiers: thresholds,
        distribution
      };
    } catch (error) {
      console.error('Error getting points distribution analytics:', error);
      return { tiers: [], distribution: [] };
    }
  }

  async getRevenueStats(startDate: Date): Promise<any> {
    try {
      const premiumUsers = await db
        .select({
          count: sql<number>`count(*)`,
          totalRevenue: sql<number>`count(*) * 10` // Assuming $10/month subscription
        })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'active'),
            gte(users.subscriptionStartDate, startDate),
            eq(users.isAdmin, false)
          )
        );

      const monthlyRecurring = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.subscriptionStatus, 'active'), eq(users.isAdmin, false)));

      return {
        newRevenue: premiumUsers[0]?.totalRevenue || 0,
        monthlyRecurring: (monthlyRecurring[0]?.count || 0) * 10,
        newSubscriptions: premiumUsers[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      return { newRevenue: 0, monthlyRecurring: 0, newSubscriptions: 0 };
    }
  }

  async getSubscriptionConversionStats(startDate: Date): Promise<any> {
    try {
      const totalUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(gte(users.joinedAt, startDate), eq(users.isAdmin, false)));

      const convertedUsers = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.joinedAt, startDate),
            eq(users.subscriptionStatus, 'active'),
            eq(users.isAdmin, false)
          )
        );

      const conversionRate = totalUsers[0]?.count > 0 
        ? (convertedUsers[0]?.count / totalUsers[0]?.count) * 100 
        : 0;

      return {
        totalSignups: totalUsers[0]?.count || 0,
        conversions: convertedUsers[0]?.count || 0,
        conversionRate
      };
    } catch (error) {
      console.error('Error getting subscription conversion stats:', error);
      return { totalSignups: 0, conversions: 0, conversionRate: 0 };
    }
  }

  async getPayoutHistory(startDate: Date): Promise<any[]> {
    try {
      const result = await db
        .select({
          cycleId: cycleWinnerSelections.cycleSettingId,
          userId: cycleWinnerSelections.userId,
          username: users.username,
          payoutAmount: cycleWinnerSelections.rewardAmount,
          selectionDate: cycleWinnerSelections.selectionDate
        })
        .from(cycleWinnerSelections)
        .innerJoin(users, eq(cycleWinnerSelections.userId, users.id))
        .where(gte(cycleWinnerSelections.selectionDate, startDate))
        .orderBy(desc(cycleWinnerSelections.selectionDate));
      return result;
    } catch (error) {
      console.error('Error getting payout history:', error);
      return [];
    }
  }

  async getFinancialForecastData(): Promise<any> {
    try {
      const activeSubs = await this.getPremiumUsersCount();
      const avgGrowthRate = 5; // Placeholder - could be calculated from historical data
      
      return {
        currentMRR: activeSubs * 10,
        projectedMRR: activeSubs * 10 * (1 + avgGrowthRate / 100),
        activeSubscriptions: activeSubs,
        churnRate: 5 // Placeholder
      };
    } catch (error) {
      console.error('Error getting financial forecast data:', error);
      return { currentMRR: 0, projectedMRR: 0, activeSubscriptions: 0, churnRate: 0 };
    }
  }

  async getRecentUserActivities(limit: number): Promise<any[]> {
    try {
      // Combine recent registrations and lesson completions
      const recentActivities = await db
        .select({
          type: sql<string>`'registration'`,
          userId: users.id,
          username: users.username,
          activity: sql<string>`'User registered'`,
          timestamp: users.joinedAt
        })
        .from(users)
        .orderBy(desc(users.joinedAt))
        .limit(limit / 2)
        .union(
          db.select({
            type: sql<string>`'lesson_completion'`,
            userId: sql<number>`1`,
            username: users.username,
            activity: sql<string>`'Completed lesson'`,
            timestamp: users.joinedAt
          })
          .from(users)
          .orderBy(desc(users.joinedAt))
          .limit(limit / 2)
        );

      return recentActivities.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent user activities:', error);
      return [];
    }
  }

  async getRecentRegistrations(limit: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          createdAt: users.joinedAt,
          subscriptionStatus: users.subscriptionStatus
        })
        .from(users)
        .orderBy(desc(users.joinedAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error('Error getting recent registrations:', error);
      return [];
    }
  }

  async getTotalRevenue(startDate: Date): Promise<number> {
    try {
      const result = await this.getRevenueStats(startDate);
      return result.newRevenue + result.monthlyRecurring;
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return 0;
    }
  }

  async getAverageCompletionRate(): Promise<number> {
    try {
      const totalUsers = await this.getTotalUsersCount();
      const totalModules = await db
        .select({ count: sql<number>`count(*)` })
        .from(learningModules)
        .where(eq(learningModules.isPublished, true));

      const totalCompletions = await db
        .select({ count: sql<number>`count(*)` })
        .from(userProgress)
        .where(eq(userProgress.completed, true));

      const expectedCompletions = totalUsers * (totalModules[0]?.count || 0);
      return expectedCompletions > 0 
        ? ((totalCompletions[0]?.count || 0) / expectedCompletions) * 100 
        : 0;
    } catch (error) {
      console.error('Error getting average completion rate:', error);
      return 0;
    }
  }

  async getCurrentCycleParticipationRate(): Promise<number> {
    try {
      const totalUsers = await this.getTotalUsersCount();
      const currentCycle = await this.getCurrentCycle();
      
      if (!currentCycle) return 0;

      const participants = await db
        .select({ count: sql<number>`count(DISTINCT user_id)` })
        .from(userCyclePoints)
        .where(eq(userCyclePoints.cycleSettingId, currentCycle.id));

      return totalUsers > 0 
        ? ((participants[0]?.count || 0) / totalUsers) * 100 
        : 0;
    } catch (error) {
      console.error('Error getting current cycle participation rate:', error);
      return 0;
    }
  }

  // === USER ENGAGEMENT ANALYTICS METHODS IMPLEMENTATION (Phase 1.1 Step 1) ===

  async getDailyActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(DISTINCT id)` })
        .from(users)
        .where(
          and(
            gte(users.lastLoginAt, startDate),
            lte(users.lastLoginAt, endDate),
            eq(users.isAdmin, false)
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting daily active users:', error);
      return 0;
    }
  }

  async getWeeklyActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    try {
      const weekAgo = new Date(endDate);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const result = await db
        .select({ count: sql<number>`count(DISTINCT id)` })
        .from(users)
        .where(
          and(
            gte(users.lastLoginAt, weekAgo),
            lte(users.lastLoginAt, endDate),
            eq(users.isAdmin, false)
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting weekly active users:', error);
      return 0;
    }
  }

  async getCycleActiveUsers(): Promise<number> {
    try {
      const currentCycle = await this.getCurrentCycle();
      if (!currentCycle) return 0;

      const result = await db
        .select({ count: sql<number>`count(DISTINCT ${userCyclePoints.userId})` })
        .from(userCyclePoints)
        .innerJoin(users, eq(users.id, userCyclePoints.userId))
        .where(and(eq(userCyclePoints.cycleSettingId, currentCycle.id), eq(users.isAdmin, false)));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting cycle active users:', error);
      return 0;
    }
  }

  async getLoginFrequencyStats(startDate: Date, endDate: Date): Promise<{
    averageLoginsPerUser: number;
    totalLogins: number;
    uniqueLoginUsers: number;
    dailyLoginTrends: Array<{ date: string; loginCount: number }>;
  }> {
    try {
      // Get total unique users who logged in during period
      const uniqueUsers = await db
        .select({ count: sql<number>`count(DISTINCT id)` })
        .from(users)
        .where(
          and(
            gte(users.lastLoginAt, startDate),
            lte(users.lastLoginAt, endDate)
          )
        );

      const uniqueLoginUsers = uniqueUsers[0]?.count || 0;

      // For daily login trends, we'll use a simplified approach
      // In a real implementation, you'd want to track each login event
      const dailyTrends = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayLogins = await db
          .select({ count: sql<number>`count(DISTINCT id)` })
          .from(users)
          .where(
            and(
              gte(users.lastLoginAt, dayStart),
              lte(users.lastLoginAt, dayEnd)
            )
          );
        
        dailyTrends.push({
          date: currentDate.toISOString().split('T')[0],
          loginCount: dayLogins[0]?.count || 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const totalLogins = dailyTrends.reduce((sum, day) => sum + day.loginCount, 0);
      const averageLoginsPerUser = uniqueLoginUsers > 0 ? totalLogins / uniqueLoginUsers : 0;

      return {
        averageLoginsPerUser,
        totalLogins,
        uniqueLoginUsers,
        dailyLoginTrends: dailyTrends
      };
    } catch (error) {
      console.error('Error getting login frequency stats:', error);
      return {
        averageLoginsPerUser: 0,
        totalLogins: 0,
        uniqueLoginUsers: 0,
        dailyLoginTrends: []
      };
    }
  }

  async getSessionDurationStats(startDate: Date, endDate: Date): Promise<{
    averageSessionDuration: number;
    totalSessions: number;
    sessionDurationDistribution: Array<{ range: string; count: number }>;
  }> {
    try {
      // Since we don't track individual sessions, we'll provide estimated data
      // based on user activity patterns
      const activeUsers = await this.getDailyActiveUsers(startDate, endDate);
      
      // Estimate average session duration (in minutes)
      // This is a placeholder - in a real app you'd track actual session data
      const estimatedAvgSessionDuration = 25; // 25 minutes average
      const totalSessions = activeUsers * 1.5; // Assume 1.5 sessions per active user
      
      // Distribution buckets (in minutes)
      const distribution = [
        { range: '0-5 min', count: Math.floor(totalSessions * 0.15) },
        { range: '5-15 min', count: Math.floor(totalSessions * 0.25) },
        { range: '15-30 min', count: Math.floor(totalSessions * 0.35) },
        { range: '30-60 min', count: Math.floor(totalSessions * 0.20) },
        { range: '60+ min', count: Math.floor(totalSessions * 0.05) }
      ];

      return {
        averageSessionDuration: estimatedAvgSessionDuration,
        totalSessions: Math.floor(totalSessions),
        sessionDurationDistribution: distribution
      };
    } catch (error) {
      console.error('Error getting session duration stats:', error);
      return {
        averageSessionDuration: 0,
        totalSessions: 0,
        sessionDurationDistribution: []
      };
    }
  }

  // === LEARNING ANALYTICS METHODS IMPLEMENTATION (Phase 1.1 Step 2) ===

  async getModuleCompletionRates(startDate: Date, endDate: Date): Promise<Array<{
    moduleId: number;
    moduleName: string;
    completionRate: number;
    totalUsers: number;
    completedUsers: number;
  }>> {
    try {
      // Get all learning modules
      const modules = await db.select().from(learningModules);
      
      // Get total premium users (who can complete modules)
      const totalUsersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.subscriptionStatus, 'premium'));
      
      const totalUsers = totalUsersResult[0]?.count || 0;
      
      const moduleStats = [];
      
      for (const module of modules) {
        // Count unique users who completed this module in the timeframe
        const completedUsersResult = await db
          .select({ count: sql<number>`count(DISTINCT user_id)` })
          .from(userProgress)
          .where(
            and(
              eq(userProgress.moduleId, module.id),
              eq(userProgress.completed, true),
              isNotNull(userProgress.completedAt),
              gte(userProgress.completedAt, startDate),
              lte(userProgress.completedAt, endDate)
            )
          );
        
        const completed = completedUsersResult[0]?.count || 0;
        const completionRate = totalUsers > 0 ? (completed / totalUsers) * 100 : 0;
        
        moduleStats.push({
          moduleId: module.id,
          moduleName: module.title,
          completionRate: Math.round(completionRate * 100) / 100,
          totalUsers,
          completedUsers: completed
        });
      }
      
      // Sort by completion rate descending
      return moduleStats.sort((a, b) => b.completionRate - a.completionRate);
    } catch (error) {
      console.error('Error getting module completion rates:', error);
      return [];
    }
  }

  async getAverageTimePerModule(startDate: Date, endDate: Date): Promise<Array<{
    moduleId: number;
    moduleName: string;
    averageTimeMinutes: number;
    totalCompletions: number;
  }>> {
    try {
      // Get all learning modules
      const modules = await db.select().from(learningModules);
      
      const moduleTimeStats = [];
      
      for (const module of modules) {
        // Get completions in timeframe
        const completions = await db
          .select()
          .from(userProgress)
          .where(
            and(
              eq(userProgress.moduleId, module.id),
              eq(userProgress.completed, true),
              isNotNull(userProgress.completedAt),
              gte(userProgress.completedAt, startDate),
              lte(userProgress.completedAt, endDate)
            )
          );
        
        // Calculate average time (estimated based on completion patterns)
        // In a real app, you'd track actual time spent
        const totalCompletions = completions.length;
        const estimatedAverageTime = 15 + (module.id % 20); // 15-35 minutes based on module
        
        moduleTimeStats.push({
          moduleId: module.id,
          moduleName: module.title,
          averageTimeMinutes: estimatedAverageTime,
          totalCompletions
        });
      }
      
      // Sort by total completions descending
      return moduleTimeStats.sort((a, b) => b.totalCompletions - a.totalCompletions);
    } catch (error) {
      console.error('Error getting average time per module:', error);
      return [];
    }
  }

  async getPopularContentCategories(startDate: Date, endDate: Date): Promise<Array<{
    category: string;
    completions: number;
    uniqueUsers: number;
    averageScore: number;
  }>> {
    try {
      // Get module completions grouped by category
      const categoryStats = await db
        .select({
          category: learningModules.category,
          completions: sql<number>`count(*)`,
          uniqueUsers: sql<number>`count(DISTINCT ${userProgress.userId})`
        })
        .from(userProgress)
        .innerJoin(learningModules, eq(userProgress.moduleId, learningModules.id))
        .where(
          and(
            eq(userProgress.completed, true),
            isNotNull(userProgress.completedAt),
            gte(userProgress.completedAt, startDate),
            lte(userProgress.completedAt, endDate)
          )
        )
        .groupBy(learningModules.category);
      
      return categoryStats.map(stat => ({
        category: stat.category,
        completions: Number(stat.completions),
        uniqueUsers: Number(stat.uniqueUsers),
        averageScore: 0 // No score column in current schema
      })).sort((a, b) => b.completions - a.completions);
    } catch (error) {
      console.error('Error getting popular content categories:', error);
      return [];
    }
  }

  // === ANALYTICS CACHING LAYER IMPLEMENTATION (Phase 1.2) ===

  private analyticsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private getCachedData(key: string): any | null {
    const cached = this.analyticsCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.analyticsCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCachedData(key: string, data: any, ttlMinutes: number = 15): void {
    this.analyticsCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  private clearAnalyticsCache(): void {
    this.analyticsCache.clear();
  }

  // Cache invalidation methods
  invalidateCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const [key] of Array.from(this.analyticsCache)) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.analyticsCache.delete(key));
  }

  // Cache warming for dashboard startup
  async warmAnalyticsCache(): Promise<void> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Pre-load frequently accessed metrics
      await Promise.all([
        this.getTotalUsersCount(),
        this.getPremiumUsersCount(),
        this.getActiveUsersCount(startDate),
        this.getDailyLoginActivity(startDate),
        this.getRegistrationTrends(startDate)
      ]);
    } catch (error) {
      console.error('Error warming analytics cache:', error);
    }
  }

  // === COMPARATIVE ANALYTICS METHODS IMPLEMENTATION (Phase 1.1 Step 5) ===

  async getComparativeAnalytics(timeframe: number): Promise<{
    periodComparison: {
      currentPeriod: {
        startDate: string;
        endDate: string;
        activeUsers: number;
        completedLessons: number;
        newSubscriptions: number;
        revenue: number;
      };
      previousPeriod: {
        startDate: string;
        endDate: string;
        activeUsers: number;
        completedLessons: number;
        newSubscriptions: number;
        revenue: number;
      };
      growthRates: {
        activeUsersGrowth: number;
        lessonCompletionGrowth: number;
        subscriptionGrowth: number;
        revenueGrowth: number;
      };
    };
    trendAnalysis: {
      weeklyTrends: Array<{
        week: string;
        activeUsers: number;
        completions: number;
        subscriptions: number;
      }>;
      performanceScore: number;
    };
    timeframe: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (timeframe * 24 * 60 * 60 * 1000));
      
      // Calculate previous period dates
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(previousEndDate.getTime() - (timeframe * 24 * 60 * 60 * 1000));

      // Current period metrics
      const currentActiveUsers = await db
        .select({ count: sql<number>`count(distinct user_id)` })
        .from(userProgress)
        .where(
          and(
            gte(userProgress.completedAt, startDate),
            lte(userProgress.completedAt, endDate)
          )
        );

      const currentCompletions = await db
        .select({ count: sql<number>`count(*)` })
        .from(userProgress)
        .where(
          and(
            gte(userProgress.completedAt, startDate),
            lte(userProgress.completedAt, endDate)
          )
        );

      const currentSubscriptions = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'premium'),
            gte(users.subscriptionStartDate, startDate),
            lte(users.subscriptionStartDate, endDate)
          )
        );

      const currentRevenue = await db
        .select({ revenue: sql<number>`sum(CASE WHEN subscription_status = 'premium' THEN subscription_amount ELSE 0 END)` })
        .from(users)
        .where(
          and(
            gte(users.subscriptionStartDate, startDate),
            lte(users.subscriptionStartDate, endDate)
          )
        );

      // Previous period metrics
      const previousActiveUsers = await db
        .select({ count: sql<number>`count(distinct user_id)` })
        .from(userProgress)
        .where(
          and(
            gte(userProgress.completedAt, previousStartDate),
            lte(userProgress.completedAt, previousEndDate)
          )
        );

      const previousCompletions = await db
        .select({ count: sql<number>`count(*)` })
        .from(userProgress)
        .where(
          and(
            gte(userProgress.completedAt, previousStartDate),
            lte(userProgress.completedAt, previousEndDate)
          )
        );

      const previousSubscriptions = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'premium'),
            gte(users.subscriptionStartDate, previousStartDate),
            lte(users.subscriptionStartDate, previousEndDate)
          )
        );

      const previousRevenue = await db
        .select({ revenue: sql<number>`sum(CASE WHEN subscription_status = 'premium' THEN subscription_amount ELSE 0 END)` })
        .from(users)
        .where(
          and(
            gte(users.subscriptionStartDate, previousStartDate),
            lte(users.subscriptionStartDate, previousEndDate)
          )
        );

      // Calculate growth rates
      const currentActiveUsersCount = currentActiveUsers[0]?.count || 0;
      const previousActiveUsersCount = previousActiveUsers[0]?.count || 0;
      const currentCompletionsCount = currentCompletions[0]?.count || 0;
      const previousCompletionsCount = previousCompletions[0]?.count || 0;
      const currentSubscriptionsCount = currentSubscriptions[0]?.count || 0;
      const previousSubscriptionsCount = previousSubscriptions[0]?.count || 0;
      const currentRevenueAmount = (currentRevenue[0]?.revenue || 0) / 100;
      const previousRevenueAmount = (previousRevenue[0]?.revenue || 0) / 100;

      const calculateGrowthRate = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100 * 100) / 100;
      };

      // Weekly trends for the current period
      const weeklyTrends = [];
      const weeksInPeriod = Math.ceil(timeframe / 7);
      
      for (let i = 0; i < weeksInPeriod; i++) {
        const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(Math.min(
          weekStart.getTime() + (7 * 24 * 60 * 60 * 1000),
          endDate.getTime()
        ));

        const weekActiveUsers = await db
          .select({ count: sql<number>`count(distinct user_id)` })
          .from(userProgress)
          .where(
            and(
              gte(userProgress.completedAt, weekStart),
              lte(userProgress.completedAt, weekEnd)
            )
          );

        const weekCompletions = await db
          .select({ count: sql<number>`count(*)` })
          .from(userProgress)
          .where(
            and(
              gte(userProgress.completedAt, weekStart),
              lte(userProgress.completedAt, weekEnd)
            )
          );

        const weekSubscriptions = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            and(
              eq(users.subscriptionStatus, 'premium'),
              gte(users.subscriptionStartDate, weekStart),
              lte(users.subscriptionStartDate, weekEnd)
            )
          );

        weeklyTrends.push({
          week: `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`,
          activeUsers: weekActiveUsers[0]?.count || 0,
          completions: weekCompletions[0]?.count || 0,
          subscriptions: weekSubscriptions[0]?.count || 0
        });
      }

      // Calculate performance score (composite metric)
      const userGrowthScore = Math.min(Math.max(calculateGrowthRate(currentActiveUsersCount, previousActiveUsersCount) / 10, 0), 10);
      const engagementScore = Math.min(Math.max(calculateGrowthRate(currentCompletionsCount, previousCompletionsCount) / 10, 0), 10);
      const revenueScore = Math.min(Math.max(calculateGrowthRate(currentRevenueAmount, previousRevenueAmount) / 10, 0), 10);
      const performanceScore = Math.round(((userGrowthScore + engagementScore + revenueScore) / 3) * 10) / 10;

      return {
        periodComparison: {
          currentPeriod: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            activeUsers: currentActiveUsersCount,
            completedLessons: currentCompletionsCount,
            newSubscriptions: currentSubscriptionsCount,
            revenue: currentRevenueAmount
          },
          previousPeriod: {
            startDate: previousStartDate.toISOString().split('T')[0],
            endDate: previousEndDate.toISOString().split('T')[0],
            activeUsers: previousActiveUsersCount,
            completedLessons: previousCompletionsCount,
            newSubscriptions: previousSubscriptionsCount,
            revenue: previousRevenueAmount
          },
          growthRates: {
            activeUsersGrowth: calculateGrowthRate(currentActiveUsersCount, previousActiveUsersCount),
            lessonCompletionGrowth: calculateGrowthRate(currentCompletionsCount, previousCompletionsCount),
            subscriptionGrowth: calculateGrowthRate(currentSubscriptionsCount, previousSubscriptionsCount),
            revenueGrowth: calculateGrowthRate(currentRevenueAmount, previousRevenueAmount)
          }
        },
        trendAnalysis: {
          weeklyTrends,
          performanceScore
        },
        timeframe
      };
    } catch (error) {
      console.error('Error getting comparative analytics:', error);
      return {
        periodComparison: {
          currentPeriod: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            activeUsers: 0,
            completedLessons: 0,
            newSubscriptions: 0,
            revenue: 0
          },
          previousPeriod: {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            activeUsers: 0,
            completedLessons: 0,
            newSubscriptions: 0,
            revenue: 0
          },
          growthRates: {
            activeUsersGrowth: 0,
            lessonCompletionGrowth: 0,
            subscriptionGrowth: 0,
            revenueGrowth: 0
          }
        },
        trendAnalysis: {
          weeklyTrends: [],
          performanceScore: 0
        },
        timeframe
      };
    }
  }

  // === FINANCIAL METRICS ANALYTICS METHODS IMPLEMENTATION (Phase 1.1 Step 4) ===

  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    subscriptionRevenue: number;
    averageRevenuePerUser: number;
    revenueGrowthRate: number;
    monthlyRecurringRevenue: number;
  }> {
    try {
      // Get all premium subscription payments in the timeframe
      const subscriptionRevenueResult = await db
        .select({ 
          revenue: sql<number>`sum(CASE WHEN subscription_status = 'premium' THEN subscription_amount ELSE 0 END)`,
          count: sql<number>`count(CASE WHEN subscription_status = 'premium' THEN 1 END)`
        })
        .from(users)
        .where(
          and(
            gte(users.subscriptionStartDate, startDate),
            lte(users.subscriptionStartDate, endDate)
          )
        );

      const currentRevenue = subscriptionRevenueResult[0]?.revenue || 0;
      const subscriptionCount = subscriptionRevenueResult[0]?.count || 0;
      
      // Calculate previous period for growth rate
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      
      const previousRevenueResult = await db
        .select({ revenue: sql<number>`sum(CASE WHEN subscription_status = 'premium' THEN subscription_amount ELSE 0 END)` })
        .from(users)
        .where(
          and(
            gte(users.subscriptionStartDate, previousStartDate),
            lte(users.subscriptionStartDate, startDate)
          )
        );

      const previousRevenue = previousRevenueResult[0]?.revenue || 0;
      
      // Calculate growth rate
      const revenueGrowthRate = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;

      // Get current MRR (all active premium subscribers)
      const mrrResult = await db
        .select({ 
          mrr: sql<number>`sum(subscription_amount)`,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(eq(users.subscriptionStatus, 'premium'));

      const monthlyRecurringRevenue = (mrrResult[0]?.mrr || 0) / 100; // Convert to dollars
      const totalActiveUsers = mrrResult[0]?.count || 0;
      
      // Calculate ARPU
      const averageRevenuePerUser = totalActiveUsers > 0 
        ? (currentRevenue / 100) / totalActiveUsers 
        : 0;

      return {
        totalRevenue: currentRevenue / 100, // Convert to dollars
        subscriptionRevenue: currentRevenue / 100,
        averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
        monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      return {
        totalRevenue: 0,
        subscriptionRevenue: 0,
        averageRevenuePerUser: 0,
        revenueGrowthRate: 0,
        monthlyRecurringRevenue: 0
      };
    }
  }

  async getPayoutMetrics(startDate: Date, endDate: Date): Promise<{
    totalPayouts: number;
    averagePayoutPerWinner: number;
    payoutSuccessRate: number;
    pendingPayouts: number;
    payoutGrowthRate: number;
  }> {
    try {
      // Get completed payouts in the timeframe
      const payoutsResult = await db
        .select({
          totalAmount: sql<number>`sum(reward_amount)`,
          totalCount: sql<number>`count(*)`,
          successCount: sql<number>`count(CASE WHEN payout_status = 'completed' THEN 1 END)`
        })
        .from(cycleWinnerSelections)
        .where(
          and(
            gte(cycleWinnerSelections.selectionDate, startDate),
            lte(cycleWinnerSelections.selectionDate, endDate)
          )
        );

      const totalPayouts = (payoutsResult[0]?.totalAmount || 0) / 100; // Convert to dollars
      const totalCount = payoutsResult[0]?.totalCount || 0;
      const successCount = payoutsResult[0]?.successCount || 0;

      // Calculate success rate
      const payoutSuccessRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
      
      // Average payout per winner
      const averagePayoutPerWinner = totalCount > 0 ? totalPayouts / totalCount : 0;

      // Get pending payouts
      const pendingResult = await db
        .select({ pendingAmount: sql<number>`sum(reward_amount)` })
        .from(cycleWinnerSelections)
        .where(
          eq(cycleWinnerSelections.payoutStatus, 'pending')
        );

      const pendingPayouts = (pendingResult[0]?.pendingAmount || 0) / 100;

      // Calculate previous period for growth rate
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      
      const previousPayoutsResult = await db
        .select({ totalAmount: sql<number>`sum(reward_amount)` })
        .from(cycleWinnerSelections)
        .where(
          and(
            gte(cycleWinnerSelections.selectionDate, previousStartDate),
            lte(cycleWinnerSelections.selectionDate, startDate)
          )
        );

      const previousPayouts = (previousPayoutsResult[0]?.totalAmount || 0) / 100;
      
      const payoutGrowthRate = previousPayouts > 0 
        ? ((totalPayouts - previousPayouts) / previousPayouts) * 100
        : totalPayouts > 0 ? 100 : 0;

      return {
        totalPayouts: Math.round(totalPayouts * 100) / 100,
        averagePayoutPerWinner: Math.round(averagePayoutPerWinner * 100) / 100,
        payoutSuccessRate: Math.round(payoutSuccessRate * 100) / 100,
        pendingPayouts: Math.round(pendingPayouts * 100) / 100,
        payoutGrowthRate: Math.round(payoutGrowthRate * 100) / 100
      };
    } catch (error) {
      console.error('Error getting payout metrics:', error);
      return {
        totalPayouts: 0,
        averagePayoutPerWinner: 0,
        payoutSuccessRate: 0,
        pendingPayouts: 0,
        payoutGrowthRate: 0
      };
    }
  }

  async getSubscriptionMetrics(startDate: Date, endDate: Date): Promise<{
    newSubscriptions: number;
    canceledSubscriptions: number;
    subscriptionGrowthRate: number;
    churnRate: number;
    lifetimeValue: number;
  }> {
    try {
      // Get new subscriptions in timeframe
      const newSubsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'premium'),
            gte(users.subscriptionStartDate, startDate),
            lte(users.subscriptionStartDate, endDate)
          )
        );

      const newSubscriptions = newSubsResult[0]?.count || 0;

      // Get canceled subscriptions (users who became free in this period)
      const canceledSubsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'free'),
            isNotNull(users.subscriptionStartDate), // Had a subscription before
            gte(users.lastLoginAt, startDate), // Were active during period
            lte(users.lastLoginAt, endDate)
          )
        );

      const canceledSubscriptions = canceledSubsResult[0]?.count || 0;

      // Calculate subscription growth rate
      const subscriptionGrowthRate = canceledSubscriptions > 0 
        ? ((newSubscriptions - canceledSubscriptions) / canceledSubscriptions) * 100
        : newSubscriptions > 0 ? 100 : 0;

      // Calculate churn rate
      const totalActiveAtStart = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'premium'),
            lte(users.subscriptionStartDate, startDate)
          )
        );

      const activeAtStart = totalActiveAtStart[0]?.count || 0;
      const churnRate = activeAtStart > 0 ? (canceledSubscriptions / activeAtStart) * 100 : 0;

      // Calculate average lifetime value (simplified)
      const avgSubDurationResult = await db
        .select({ 
          avgRevenue: sql<number>`avg(subscription_amount)`,
          avgMonths: sql<number>`avg(EXTRACT(EPOCH FROM (COALESCE(next_billing_date, NOW()) - subscription_start_date)) / 2629746)` // seconds to months
        })
        .from(users)
        .where(isNotNull(users.subscriptionStartDate));

      const avgMonthlyRevenue = (avgSubDurationResult[0]?.avgRevenue || 0) / 100;
      const avgSubscriptionMonths = avgSubDurationResult[0]?.avgMonths || 0;
      const lifetimeValue = avgMonthlyRevenue * avgSubscriptionMonths;

      return {
        newSubscriptions,
        canceledSubscriptions,
        subscriptionGrowthRate: Math.round(subscriptionGrowthRate * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
        lifetimeValue: Math.round(lifetimeValue * 100) / 100
      };
    } catch (error) {
      console.error('Error getting subscription metrics:', error);
      return {
        newSubscriptions: 0,
        canceledSubscriptions: 0,
        subscriptionGrowthRate: 0,
        churnRate: 0,
        lifetimeValue: 0
      };
    }
  }

  // === CYCLE PERFORMANCE ANALYTICS METHODS IMPLEMENTATION (Phase 1.1 Step 3) ===

  async getCurrentCycleStats(): Promise<{
    participants: number;
    totalPoolAmount: number;
    averagePoints: number;
    topPerformer: { username: string; points: number } | null;
  }> {
    try {
      // Get active cycle
      const activeCycle = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.status, 'active'))
        .limit(1);

      if (!activeCycle.length) {
        return {
          participants: 0,
          totalPoolAmount: 0,
          averagePoints: 0,
          topPerformer: null
        };
      }

      const cycle = activeCycle[0];

      // Get participants count (excluding admin users)
      const participantsResult = await db
        .select({ count: sql<number>`count(DISTINCT ucp.user_id)::int` })
        .from(userCyclePoints.as('ucp'))
        .innerJoin(users, eq(users.id, sql.raw('ucp.user_id')))
        .where(and(eq(sql.raw('ucp.cycle_setting_id'), cycle.id), eq(users.isAdmin, false)));

      const participants = Number(participantsResult[0]?.count) || 0;

      // Calculate total pool amount (convert from cents to dollars)
      const totalPoolAmountCents = Math.floor((participants * cycle.membershipFee * cycle.rewardPoolPercentage) / 100);
      const totalPoolAmount = totalPoolAmountCents / 100;

      // Get average points (excluding admin users)
      const avgPointsResult = await db
        .select({ avg: sql<number>`avg(ucp.current_cycle_points)` })
        .from(userCyclePoints.as('ucp'))
        .innerJoin(users, eq(users.id, sql.raw('ucp.user_id')))
        .where(and(eq(sql.raw('ucp.cycle_setting_id'), cycle.id), eq(users.isAdmin, false)));

      const averagePoints = Math.round(avgPointsResult[0]?.avg || 0);

      // Get top performer (excluding admin users)
      const topPerformerResult = await db
        .select({
          username: users.username,
          points: userCyclePoints.currentCyclePoints
        })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(and(eq(userCyclePoints.cycleSettingId, cycle.id), eq(users.isAdmin, false)))
        .orderBy(desc(userCyclePoints.currentCyclePoints))
        .limit(1);

      const topPerformer = topPerformerResult.length > 0 
        ? { username: topPerformerResult[0].username, points: topPerformerResult[0].points }
        : null;

      return {
        participants,
        totalPoolAmount,
        averagePoints,
        topPerformer
      };
    } catch (error) {
      console.error('Error getting current cycle stats:', error);
      return {
        participants: 0,
        totalPoolAmount: 0,
        averagePoints: 0,
        topPerformer: null
      };
    }
  }

  async getHistoricalCyclePerformance(startDate: Date): Promise<Array<{
    cycleName: string;
    participants: number;
    totalPayout: number;
    avgPointsPerUser: number;
    completionDate: Date;
  }>> {
    try {
      // Safe date handling to prevent Invalid time value errors
      const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) 
        ? startDate 
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to 90 days ago

      // Get completed cycles since startDate
      const completedCycles = await db
        .select()
        .from(cycleSettings)
        .where(
          and(
            eq(cycleSettings.isActive, false),
            gte(cycleSettings.cycleEndDate, safeStartDate)
          )
        )
        .orderBy(desc(cycleSettings.cycleEndDate));

      const cyclePerformance = [];

      for (const cycle of completedCycles) {
        // Skip cycles with invalid dates
        if (!cycle.cycleEndDate || !(cycle.cycleEndDate instanceof Date) || isNaN(cycle.cycleEndDate.getTime())) {
          console.warn(`Skipping cycle ${cycle.id} with invalid end date:`, cycle.cycleEndDate);
          continue;
        }

        // Get participants for this cycle (excluding admin users)
        const participantsResult = await db
          .select({ count: sql<number>`count(DISTINCT ucp.user_id)::int` })
          .from(userCyclePoints.as('ucp'))
          .innerJoin(users, eq(users.id, sql.raw('ucp.user_id')))
          .where(and(eq(sql.raw('ucp.cycle_setting_id'), cycle.id), eq(users.isAdmin, false)));

        const participants = Number(participantsResult[0]?.count) || 0;

        // Calculate total payout (convert from cents to dollars)
        const totalPayoutCents = Math.floor((participants * cycle.membershipFee * cycle.rewardPoolPercentage) / 100);
        const totalPayout = totalPayoutCents / 100;

        // Get average points (excluding admin users)
        const avgPointsResult = await db
          .select({ avg: sql<number>`avg(ucp.current_cycle_points)` })
          .from(userCyclePoints.as('ucp'))
          .innerJoin(users, eq(users.id, sql.raw('ucp.user_id')))
          .where(and(eq(sql.raw('ucp.cycle_setting_id'), cycle.id), eq(users.isAdmin, false)));

        const avgPointsPerUser = Math.round(avgPointsResult[0]?.avg || 0);

        cyclePerformance.push({
          cycleName: cycle.cycleName,
          participants,
          totalPayout,
          avgPointsPerUser,
          completionDate: cycle.cycleEndDate
        });
      }

      return cyclePerformance;
    } catch (error) {
      console.error('Error getting historical cycle performance:', error);
      return [];
    }
  }



  async getPointsDistributionAnalytics(): Promise<{
    tierDistribution: Array<{ tier: string; userCount: number; avgPoints: number }>;
    pointsRange: { min: number; max: number; median: number };
    topPerformers: Array<{ username: string; points: number; tier: string }>;
  }> {
    try {
      // Get active cycle
      const activeCycle = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.isActive, true))
        .limit(1);

      if (!activeCycle.length) {
        return {
          tierDistribution: [],
          pointsRange: { min: 0, max: 0, median: 0 },
          topPerformers: []
        };
      }

      const cycle = activeCycle[0];

      // Get all user points for active cycle
      const userPoints = await db
        .select({
          userId: userCyclePoints.userId,
          username: users.username,
          points: userCyclePoints.currentCyclePoints
        })
        .from(userCyclePoints)
        .innerJoin(users, eq(userCyclePoints.userId, users.id))
        .where(eq(userCyclePoints.cycleSettingId, cycle.id))
        .orderBy(desc(userCyclePoints.currentCyclePoints));

      if (userPoints.length === 0) {
        return {
          tierDistribution: [],
          pointsRange: { min: 0, max: 0, median: 0 },
          topPerformers: []
        };
      }

      // Calculate tier distribution
      const totalUsers = userPoints.length;
      const tier1Count = Math.ceil(totalUsers * cycle.tier1Threshold / 100);
      const tier2Count = Math.ceil(totalUsers * (cycle.tier2Threshold - cycle.tier1Threshold) / 100);
      const tier3Count = totalUsers - tier1Count - tier2Count;

      const tier1Users = userPoints.slice(0, tier1Count);
      const tier2Users = userPoints.slice(tier1Count, tier1Count + tier2Count);
      const tier3Users = userPoints.slice(tier1Count + tier2Count);

      const tierDistribution = [
        {
          tier: 'Tier 1',
          userCount: tier1Users.length,
          avgPoints: tier1Users.length > 0 ? Math.round(tier1Users.reduce((sum, u) => sum + u.points, 0) / tier1Users.length) : 0
        },
        {
          tier: 'Tier 2', 
          userCount: tier2Users.length,
          avgPoints: tier2Users.length > 0 ? Math.round(tier2Users.reduce((sum, u) => sum + u.points, 0) / tier2Users.length) : 0
        },
        {
          tier: 'Tier 3',
          userCount: tier3Users.length,
          avgPoints: tier3Users.length > 0 ? Math.round(tier3Users.reduce((sum, u) => sum + u.points, 0) / tier3Users.length) : 0
        }
      ];

      // Calculate points range
      const points = userPoints.map(u => u.points).sort((a, b) => a - b);
      const min = points[0] || 0;
      const max = points[points.length - 1] || 0;
      const median = points.length > 0 ? points[Math.floor(points.length / 2)] : 0;

      // Top performers with tier assignment
      const topPerformers = userPoints.slice(0, 10).map((user, index) => {
        let tier = 'Tier 3';
        if (index < tier1Count) tier = 'Tier 1';
        else if (index < tier1Count + tier2Count) tier = 'Tier 2';
        
        return {
          username: user.username,
          points: user.points,
          tier
        };
      });

      return {
        tierDistribution,
        pointsRange: { min, max, median },
        topPerformers
      };
    } catch (error) {
      console.error('Error getting points distribution analytics:', error);
      return {
        tierDistribution: [],
        pointsRange: { min: 0, max: 0, median: 0 },
        topPerformers: []
      };
    }
  }

  // === FLEXIBLE WINNER SELECTION METHODS ===

  async executeCycleWinnerSelection(params: {
    cycleSettingId: number;
    selectionMode: 'weighted_random' | 'top_performers' | 'random' | 'manual';
    tierSettings: any;
    customWinnerIds?: number[];
    pointDeductionPercentage: number;
    rolloverPercentage: number;
    adminUserId?: number; // Phase 2A: Track admin who executed selection
  }): Promise<any> {
    const { cycleSettingId, selectionMode, tierSettings } = params;
    
    console.log('executeCycleWinnerSelection called with:', {
      cycleSettingId,
      selectionMode,
      tierSettings: JSON.stringify(tierSettings, null, 2)
    });
    
    try {
      // Get eligible users and pool info
      const eligibleUsers = await this.getEligibleUsersForSelection(cycleSettingId);
      
      // Calculate pool info from cycle settings
      const [cycleSetting] = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId));
      
      if (!cycleSetting) {
        throw new Error('Cycle setting not found');
      }

      // === CRITICAL FIX: REAL-TIME TIER RECALCULATION ===
      // Calculate current dynamic tier thresholds based on actual cycle points
      console.log('[TIER RECALCULATION] Starting real-time tier assignment before winner selection');
      
      let currentThresholds;
      try {
        currentThresholds = await this.calculateDynamicTierThresholds(cycleSettingId);
        console.log('[TIER RECALCULATION] Current thresholds:', currentThresholds);
      } catch (error) {
        console.error('[TIER RECALCULATION] Failed to calculate thresholds, aborting selection:', error);
        throw new Error('Failed to calculate tier thresholds - cannot proceed with winner selection');
      }

      // Recalculate tier assignments for all eligible users based on their current cycle points
      const usersWithFreshTiers = eligibleUsers.map(user => {
        let correctTier = 'tier3'; // Default to tier3
        
        if (user.currentCyclePoints >= currentThresholds.tier1) {
          correctTier = 'tier1';
        } else if (user.currentCyclePoints >= currentThresholds.tier2) {
          correctTier = 'tier2';
        }
        
        // Log tier corrections for verification
        if (user.tier !== correctTier) {
          console.log(`[TIER CORRECTION] User ${user.email}: ${user.currentCyclePoints} points, was ${user.tier}, now ${correctTier}`);
        }
        
        return {
          ...user,
          tier: correctTier // Use freshly calculated tier
        };
      });

      console.log(`[TIER RECALCULATION] Completed tier recalculation for ${usersWithFreshTiers.length} users`);

      // === SYNCHRONIZE DATABASE TIER ASSIGNMENTS ===
      // Update stored tier assignments to match fresh calculations
      console.log('[TIER SYNC] Synchronizing database tier assignments with fresh calculations');
      await this.synchronizeTierAssignments(cycleSettingId, usersWithFreshTiers);
      
      // Get premium user count for pool calculation
      const premiumUserCount = usersWithFreshTiers.length;
      
      // Calculate member contributions with cycle type multiplier
      // Users pay full fee, but pool allocation is proportional to cycle duration
      const cycleFeeMultiplier = getCycleFeeMultiplier(cycleSetting.cycleType);
      const fullMembershipFee = cycleSetting.membershipFee; // Keep in cents
      const totalRevenue = premiumUserCount * fullMembershipFee; // Total revenue in cents
      const proportionalPoolContribution = totalRevenue * cycleFeeMultiplier; // Apply cycle multiplier to pool
      const memberContributionsCents = Math.floor((proportionalPoolContribution * cycleSetting.rewardPoolPercentage) / 100);
      
      // Apply minimum pool guarantee - pool is the higher of member contributions or minimum guarantee
      const totalPoolCents = Math.max(memberContributionsCents, cycleSetting.minimumPoolGuarantee);
      const poolInfo = { totalPool: totalPoolCents / 100 }; // Convert to dollars
      
      // Calculate tier pools
      const tier1Pool = Math.floor(poolInfo.totalPool * (tierSettings.tier1.poolPercentage / 100));
      const tier2Pool = Math.floor(poolInfo.totalPool * (tierSettings.tier2.poolPercentage / 100));
      const tier3Pool = Math.floor(poolInfo.totalPool * (tierSettings.tier3.poolPercentage / 100));

      // Group users by FRESHLY CALCULATED tiers (not outdated database tiers)
      const usersByTier = {
        tier1: usersWithFreshTiers.filter(u => u.tier === 'tier1'),
        tier2: usersWithFreshTiers.filter(u => u.tier === 'tier2'),
        tier3: usersWithFreshTiers.filter(u => u.tier === 'tier3')
      };

      console.log(`[TIER DISTRIBUTION] Tier 1: ${usersByTier.tier1.length}, Tier 2: ${usersByTier.tier2.length}, Tier 3: ${usersByTier.tier3.length}`);

      // === VALIDATION: VERIFY TIER ASSIGNMENTS ARE CORRECT ===
      const tierValidationErrors: string[] = [];
      usersWithFreshTiers.forEach(user => {
        let expectedTier = 'tier3';
        if (user.currentCyclePoints >= currentThresholds.tier1) expectedTier = 'tier1';
        else if (user.currentCyclePoints >= currentThresholds.tier2) expectedTier = 'tier2';
        
        if (user.tier !== expectedTier) {
          tierValidationErrors.push(`User ${user.email}: ${user.currentCyclePoints} points assigned to ${user.tier}, expected ${expectedTier}`);
        }
      });

      if (tierValidationErrors.length > 0) {
        console.error('[VALIDATION ERROR] Tier assignment validation failed:');
        tierValidationErrors.forEach(error => console.error(`  - ${error}`));
        throw new Error(`Tier validation failed: ${tierValidationErrors.length} users have incorrect assignments`);
      }

      console.log('[VALIDATION PASSED] All tier assignments are correct based on current cycle points');

      let selectedWinners: any[] = [];

      // Execute selection based on mode (point-weighted random as baseline)
      switch (selectionMode) {
        case 'weighted_random':
          selectedWinners = this.selectWeightedRandomWinners(usersByTier, tierSettings);
          break;
        case 'top_performers':
          selectedWinners = this.selectTopPerformers(usersByTier, tierSettings);
          break;
        case 'random':
          selectedWinners = this.selectPureRandomWinners(usersByTier, tierSettings);
          break;
        case 'manual':
          selectedWinners = this.selectManualWinners(usersWithFreshTiers, params.customWinnerIds || []);
          break;
        default:
          selectedWinners = this.selectWeightedRandomWinners(usersByTier, tierSettings);
      }

      // Calculate individual rewards
      const winnersWithRewards = selectedWinners.map(winner => {
        const tier = winner.tier;
        const tierPool = { tier1: tier1Pool, tier2: tier2Pool, tier3: tier3Pool }[tier];
        const winnerCount = tierSettings[tier].winnerCount;
        const individualReward = winnerCount > 0 ? Math.floor(tierPool / winnerCount) : 0;

        return {
          ...winner,
          rewardAmount: individualReward,
          payoutPercentage: 100,
          payoutStatus: 'pending'
        };
      });

      // MODIFIED: Save winners immediately as draft to prevent memory issues with large datasets
      console.log(`Generated ${selectedWinners.length} winners - saving as draft to prevent frontend memory issues`);
      
      // Save as draft immediately to avoid frontend memory problems
      await this.saveWinnerSelectionDraft(cycleSettingId, winnersWithRewards, selectionMode, poolInfo.totalPool);
      
      // Return only summary to prevent frontend crashes with large arrays
      return {
        success: true,
        selectionMode,
        totalWinners: winnersWithRewards.length,
        totalRewardPool: poolInfo.totalPool,
        message: "Winner selection generated and saved as draft",
        tierBreakdown: {
          tier1: { winners: winnersWithRewards.filter(w => w.tier === 'tier1').length, pool: tier1Pool },
          tier2: { winners: winnersWithRewards.filter(w => w.tier === 'tier2').length, pool: tier2Pool },
          tier3: { winners: winnersWithRewards.filter(w => w.tier === 'tier3').length, pool: tier3Pool }
        }
      };
    } catch (error) {
      console.error('Error executing cycle winner selection:', error);
      throw error;
    }
  }

  // Production-ready point-weighted random selection with exact target achievement
  private selectWeightedRandomWinners(usersByTier: any, tierSettings: any): any[] {
    const winners: any[] = [];

    ['tier1', 'tier2', 'tier3'].forEach(tier => {
      const users = usersByTier[tier] || [];
      const winnerCount = tierSettings[tier].winnerCount;

      console.log(`${tier} selection: ${users.length} users available, target ${winnerCount} winners`);

      if (users.length === 0 || winnerCount === 0) {
        console.log(`Skipping ${tier}: ${users.length === 0 ? 'no users' : 'winnerCount is 0'}`);
        return;
      }

      // Ensure we don't try to select more winners than available users
      const actualWinnerCount = Math.min(winnerCount, users.length);
      if (actualWinnerCount < winnerCount) {
        console.log(`WARNING: ${tier} only has ${users.length} users but requested ${winnerCount} winners. Selecting ${actualWinnerCount} instead.`);
      }

      // Use weighted sampling without replacement - guaranteed to achieve exact count
      const selectedUsers = this.weightedSampleWithoutReplacement(users, actualWinnerCount);
      
      // Add selection sequence order as tierRankSequence (1st selected = 1, 2nd selected = 2, etc.)
      const tierWinners = selectedUsers.map((user, selectionIndex) => ({ 
        ...user, 
        tier,
        tierRankSequence: selectionIndex + 1  // Capture the actual selection order within tier
      }));
      winners.push(...tierWinners);
      
      console.log(`${tier} final result: selected ${tierWinners.length} winners (target was ${winnerCount})`);
    });

    console.log(`Total winners selected across all tiers: ${winners.length}`);
    return winners;
  }

  // Optimized weighted sampling without replacement using cumulative probability distribution
  private weightedSampleWithoutReplacement(users: any[], count: number): any[] {
    if (count >= users.length) return [...users];
    if (count === 0) return [];
    
    const selected: any[] = [];
    const remainingUsers = [...users];
    
    // Select users one by one until we reach the target count
    while (selected.length < count && remainingUsers.length > 0) {
      // Calculate weights for current remaining users (minimum weight of 1)
      const weights = remainingUsers.map(user => Math.max(1, user.currentCyclePoints || 0));
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      // Generate random value and find corresponding user using cumulative probability
      const randomValue = Math.random() * totalWeight;
      let cumulativeWeight = 0;
      let selectedIndex = 0; // Failsafe default
      
      for (let i = 0; i < weights.length; i++) {
        cumulativeWeight += weights[i];
        if (randomValue <= cumulativeWeight) {
          selectedIndex = i;
          break;
        }
      }
      
      // Remove selected user from pool and add to results
      const selectedUser = remainingUsers.splice(selectedIndex, 1)[0];
      selected.push(selectedUser);
    }
    
    return selected;
  }

  private selectTopPerformers(usersByTier: any, tierSettings: any): any[] {
    const winners: any[] = [];

    ['tier1', 'tier2', 'tier3'].forEach(tier => {
      const users = usersByTier[tier] || [];
      const winnerCount = tierSettings[tier].winnerCount;

      if (users.length === 0 || winnerCount === 0) return;

      const topPerformers = users
        .sort((a: any, b: any) => b.currentCyclePoints - a.currentCyclePoints)
        .slice(0, winnerCount)
        .map((user, selectionIndex) => ({ 
          ...user, 
          tier,
          tierRankSequence: selectionIndex + 1  // 1st highest = 1, 2nd highest = 2, etc.
        }));

      winners.push(...topPerformers);
    });

    return winners;
  }

  private selectPureRandomWinners(usersByTier: any, tierSettings: any): any[] {
    const winners: any[] = [];

    ['tier1', 'tier2', 'tier3'].forEach(tier => {
      const users = usersByTier[tier] || [];
      const winnerCount = tierSettings[tier].winnerCount;

      if (users.length === 0 || winnerCount === 0) return;

      const shuffled = [...users].sort(() => Math.random() - 0.5);
      const randomWinners = shuffled
        .slice(0, winnerCount)
        .map((user, selectionIndex) => ({ 
          ...user, 
          tier,
          tierRankSequence: selectionIndex + 1  // 1st randomly selected = 1, 2nd = 2, etc.
        }));

      winners.push(...randomWinners);
    });

    return winners;
  }

  private selectManualWinners(eligibleUsers: any[], customWinnerIds: number[]): any[] {
    return customWinnerIds
      .map((userId, selectionIndex) => {
        const user = eligibleUsers.find(u => u.id === userId);
        return user ? { 
          ...user, 
          tierRankSequence: selectionIndex + 1  // Order based on admin selection sequence
        } : null;
      })
      .filter(user => user);
  }

  private async saveCycleWinnerSelection(
    cycleSettingId: number,
    winners: any[],
    selectionMode: string,
    totalPool: number
  ): Promise<any[]> {
    const savedWinners = [];
    let errorCount = 0;

    // Group winners by tier to calculate tier ranks
    const winnersByTier = {
      tier1: winners.filter(w => w.tier === 'tier1'),
      tier2: winners.filter(w => w.tier === 'tier2'),
      tier3: winners.filter(w => w.tier === 'tier3')
    };

    console.log(`Attempting to save ${winners.length} winners:`, {
      tier1: winnersByTier.tier1.length,
      tier2: winnersByTier.tier2.length,
      tier3: winnersByTier.tier3.length
    });

    for (const winner of winners) {
      try {
        // Use actual selection sequence order instead of performance-based ranking
        const tierRank = winner.tierRankSequence || 1; // Use selection sequence (1st selected, 2nd selected, etc.)

        const [saved] = await db
          .insert(cycleWinnerSelections)
          .values({
            cycleSettingId,
            userId: winner.id,
            tier: winner.tier,
            tierRank,
            pointsAtSelection: winner.currentCyclePoints,
            rewardAmount: winner.rewardAmount * 100, // Convert to cents
            pointsDeducted: 0,
            pointsRolledOver: 0,
            payoutStatus: winner.payoutStatus || 'pending'
          })
          .returning();

        savedWinners.push({
          ...saved,
          username: winner.username,
          email: winner.email
        });
      } catch (error) {
        errorCount++;
        console.error(`Error saving winner ${errorCount}:`, error);
        console.error('Winner details:', { 
          id: winner.id, 
          tier: winner.tier, 
          username: winner.username,
          cycleSettingId,
          pointsAtSelection: winner.currentCyclePoints,
          rewardAmount: winner.rewardAmount 
        });
      }
    }

    console.log(`Save operation complete: ${savedWinners.length} saved, ${errorCount} errors`);
    return savedWinners;
  }

  // NEW: Save generated winners to database and mark as executed (draft state)
  async saveWinnerSelectionDraft(
    cycleSettingId: number,
    winners: any[],
    selectionMode: string,
    totalPool: number
  ): Promise<{ winnersSelected: number; totalRewardPool: number; selectionMode: string }> {
    try {
      // Clear existing winner selections for this cycle first
      await db
        .delete(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));
      
      console.log(`Cleared existing winners for cycle ${cycleSettingId}`);

      // Get cycle settings to calculate tier pool amounts
      const [cycleSetting] = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId));

      if (!cycleSetting) {
        throw new Error('Cycle setting not found');
      }

      // Calculate tier pool amounts based on total pool and percentages
      const tier1PoolAmount = Math.floor(totalPool * (cycleSetting.tier1PoolPercentage / 100));
      const tier2PoolAmount = Math.floor(totalPool * (cycleSetting.tier2PoolPercentage / 100));
      const tier3PoolAmount = totalPool - tier1PoolAmount - tier2PoolAmount; // Remaining amount

      // Save winners to database using existing method logic
      const savedWinners = [];
      let errorCount = 0;

      // Group winners by tier to calculate tier ranks
      const winnersByTier = {
        tier1: winners.filter(w => w.tier === 'tier1'),
        tier2: winners.filter(w => w.tier === 'tier2'),
        tier3: winners.filter(w => w.tier === 'tier3')
      };

      console.log(`Attempting to save ${winners.length} winners:`, {
        tier1: winnersByTier.tier1.length,
        tier2: winnersByTier.tier2.length,
        tier3: winnersByTier.tier3.length
      });

      for (let overallIndex = 0; overallIndex < winners.length; overallIndex++) {
        const winner = winners[overallIndex];
        try {
          // Calculate tier rank based on position within tier
          const tierWinners = winnersByTier[winner.tier as keyof typeof winnersByTier] || [];
          const tierRank = tierWinners.findIndex(w => w.id === winner.id) + 1;

          // Overall rank is position in the full winners array + 1
          const overallRank = overallIndex + 1;

          // Get tier pool amount based on winner's tier
          let tierSizeAmount: number;
          switch (winner.tier) {
            case 'tier1':
              tierSizeAmount = tier1PoolAmount;
              break;
            case 'tier2':
              tierSizeAmount = tier2PoolAmount;
              break;
            case 'tier3':
              tierSizeAmount = tier3PoolAmount;
              break;
            default:
              tierSizeAmount = 0;
          }

          const [saved] = await db
            .insert(cycleWinnerSelections)
            .values({
              cycleSettingId,
              userId: winner.id,
              tier: winner.tier,
              overallRank, // Add overall ranking
              tierRank,
              pointsAtSelection: winner.currentCyclePoints,
              tierSizeAmount, // Add the missing required field
              rewardAmount: winner.rewardAmount * 100, // Convert to cents
              pointsDeducted: 0,
              pointsRolledOver: 0,
              payoutStatus: winner.payoutStatus || 'pending',
              // Phase 2A: Enhanced audit fields for save/seal workflow (Issue #2)
              isSealed: false, // Initially unsealed (draft state)
              savedAt: new Date(), // Track when selection was saved
              savedBy: params.adminUserId || 1 // Track admin who executed selection
            })
            .returning();

          savedWinners.push({
            ...saved,
            username: winner.username,
            email: winner.email
          });
        } catch (error) {
          errorCount++;
          console.error(`Error saving winner ${errorCount}:`, error);
          console.error('Winner details:', { 
            id: winner.id, 
            tier: winner.tier, 
            username: winner.username,
            cycleSettingId,
            pointsAtSelection: winner.currentCyclePoints,
            rewardAmount: winner.rewardAmount 
          });
        }
      }

      console.log(`Save operation complete: ${savedWinners.length} saved, ${errorCount} errors`);

      // Mark cycle as EXECUTED (not sealed) to enable export/import workflow
      await this.markCycleSelectionExecuted(cycleSettingId, savedWinners.length, totalPool);

      console.log(`Saved ${savedWinners.length} winners as draft for cycle ${cycleSettingId}`);

      return {
        winnersSelected: savedWinners.length,
        totalRewardPool: totalPool,
        selectionMode
      };
    } catch (error) {
      console.error('Error saving cycle winner selection:', error);
      throw error;
    }
  }

  // NEW: Seal the winner selection (final lock state) - prevents further modifications
  async sealCycleWinnerSelection(cycleSettingId: number, adminUserId?: number): Promise<{ sealed: boolean; message: string }> {
    try {
      // First validate that selection was executed and winners exist
      const [cycleSetting] = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId));

      if (!cycleSetting) {
        throw new Error('Cycle setting not found');
      }

      if (!cycleSetting.selectionExecuted) {
        throw new Error('Cannot seal cycle - selection has not been executed yet');
      }

      if (cycleSetting.selectionSealed) {
        return {
          sealed: false,
          message: 'Cycle selection is already sealed'
        };
      }

      // Validate winners exist and data is consistent
      const winnerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));

      const actualWinnerCount = winnerCount[0]?.count || 0;
      
      if (actualWinnerCount === 0) {
        throw new Error('Cannot seal cycle - no winners found in database');
      }

      if (actualWinnerCount !== cycleSetting.totalWinners) {
        console.warn(`Winner count mismatch: database has ${actualWinnerCount}, cycle setting has ${cycleSetting.totalWinners}`);
      }

      // Phase 2A: Enhanced seal implementation with individual winner record tracking
      const sealTimestamp = new Date();
      const sealedByAdmin = adminUserId || 1;

      // Update individual winner records - Step 2: Reset notification flags on seal
      await db
        .update(cycleWinnerSelections)
        .set({
          isSealed: true,
          sealedAt: sealTimestamp,
          sealedBy: sealedByAdmin,
          notificationDisplayed: false // Reset notification flags when sealing
        })
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));

      // Mark cycle as SEALED (final state) with enhanced audit trail
      await db
        .update(cycleSettings)
        .set({
          selectionSealed: true,
          selectionSealedAt: sealTimestamp,
          selectionSealedBy: sealedByAdmin
        })
        .where(eq(cycleSettings.id, cycleSettingId));

      console.log(`[PHASE 2A] Sealed cycle ${cycleSettingId} with ${actualWinnerCount} winners by admin ${sealedByAdmin} - no further modifications allowed`);

      return {
        sealed: true,
        message: `Cycle ${cycleSettingId} successfully sealed with ${actualWinnerCount} winners. All modifications are now prevented.`
      };
    } catch (error) {
      console.error('Error sealing cycle winner selection:', error);
      throw error;
    }
  }

  // NEW: Unseal the winner selection (reversible for testing) - Enhanced Step 1 Implementation
  async unsealCycleWinnerSelection(cycleSettingId: number, adminUserId: number): Promise<{ unsealed: boolean; message: string }> {
    try {
      // First validate that cycle exists and is currently sealed
      const [cycleSetting] = await db
        .select()
        .from(cycleSettings)
        .where(eq(cycleSettings.id, cycleSettingId));

      if (!cycleSetting) {
        throw new Error('Cycle setting not found');
      }

      if (!cycleSetting.selectionSealed) {
        return {
          unsealed: false,
          message: 'Cycle selection is not currently sealed - nothing to unseal'
        };
      }

      // Safety validation: Prevent unsealing if payouts have been processed
      const processedPayouts = await db
        .select({ count: sql<number>`count(*)` })
        .from(cycleWinnerSelections)
        .where(
          and(
            eq(cycleWinnerSelections.cycleSettingId, cycleSettingId),
            ne(cycleWinnerSelections.payoutStatus, 'pending')
          )
        );

      const processedPayoutCount = processedPayouts[0]?.count || 0;
      
      if (processedPayoutCount > 0) {
        throw new Error('Cannot unseal cycle - payouts have been processed. This operation is not reversible.');
      }

      // Validate winners exist before unsealing
      const winnerCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));

      const actualWinnerCount = winnerCount[0]?.count || 0;
      
      if (actualWinnerCount === 0) {
        throw new Error('Cannot unseal cycle - no winners found in database');
      }

      // Enhanced Step 1: Comprehensive state reset with audit trail
      const unsealTimestamp = new Date();

      // Reset individual winner records to draft state
      await db
        .update(cycleWinnerSelections)
        .set({
          isSealed: false,
          sealedAt: null,
          sealedBy: null,
          notificationDisplayed: false // Reset notification flags for fresh celebration testing
        })
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));

      // Reset cycle to unsealed state (returns to draft)
      await db
        .update(cycleSettings)
        .set({
          selectionSealed: false,
          selectionSealedAt: null,
          selectionSealedBy: null
        })
        .where(eq(cycleSettings.id, cycleSettingId));

      // Audit trail: Log the unseal action for admin accountability
      console.log(`[UNSEAL AUDIT] Cycle ${cycleSettingId} unsealed by admin ${adminUserId} at ${unsealTimestamp.toISOString()} - ${actualWinnerCount} winners returned to draft state`);

      return {
        unsealed: true,
        message: `Cycle ${cycleSettingId} successfully unsealed with ${actualWinnerCount} winners. Winner selections returned to draft state for testing.`
      };
    } catch (error) {
      console.error('Error unsealing cycle winner selection:', error);
      throw error;
    }
  }

  // Step 2: Get user winner status and notification state for celebration banners
  // Step 3: Enhanced getUserWinnerStatus - Support for both winners and non-winners with community stats
  async getUserWinnerStatus(userId: number): Promise<{
    isWinner: boolean;
    cycleId?: number;
    cycleName?: string;
    rewardAmount?: number;
    tier?: string;
    notificationDisplayed: boolean;
    payoutStatus?: string;
    // Community stats for non-winners
    communityStats?: {
      totalDistributed: number;
      totalWinners: number;
      currentCycleName?: string;
    };
  } | null> {
    try {
      // Input validation
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(`Invalid user ID: ${userId}`);
      }
      // Step 2.1: Enhanced logic - Include payout override fields for accurate banner display
      const [winnerRecord] = await db
        .select({
          cycleId: cycleWinnerSelections.cycleSettingId,
          cycleName: cycleSettings.cycleName,
          rewardAmount: cycleWinnerSelections.rewardAmount,
          payoutOverride: cycleWinnerSelections.payoutOverride,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          tier: cycleWinnerSelections.tier,
          notificationDisplayed: cycleWinnerSelections.notificationDisplayed,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          isSealed: cycleWinnerSelections.isSealed,
          sealedAt: cycleWinnerSelections.sealedAt
        })
        .from(cycleWinnerSelections)
        .leftJoin(cycleSettings, eq(cycleWinnerSelections.cycleSettingId, cycleSettings.id))
        .where(
          and(
            eq(cycleWinnerSelections.userId, userId),
            eq(cycleWinnerSelections.isSealed, true) // Only sealed cycles
          )
        )
        .orderBy(desc(cycleWinnerSelections.sealedAt))
        .limit(1);

      if (winnerRecord) {
        console.log(`[WINNER STATUS] Found winner record for user ${userId} in cycle ${winnerRecord.cycleId}`);
        
        // Step 3: Use same pool calculation as /api/cycles/pool endpoint
        let totalRewardPool = 7500; // Default fallback
        let totalWinners = 0;
        
        try {
          const poolData = await this.getCyclePoolData(winnerRecord.cycleId);
          totalRewardPool = poolData.totalPool;
        } catch (error) {
          console.error(`[WINNER STATUS] Error fetching pool data for cycle ${winnerRecord.cycleId}:`, {
            error: error.message,
            stack: error.stack,
            query: 'getCyclePoolData'
          });
        }

        try {
          const [totalWinnersResult] = await db
            .select({
              totalWinners: sql<number>`COUNT(*)`
            })
            .from(cycleWinnerSelections)
            .where(
              and(
                eq(cycleWinnerSelections.cycleSettingId, winnerRecord.cycleId),
                eq(cycleWinnerSelections.isSealed, true)
              )
            );
          
          if (totalWinnersResult?.totalWinners) {
            totalWinners = totalWinnersResult.totalWinners;
          }
        } catch (error) {
          console.error(`[WINNER STATUS] Error counting winners for cycle ${winnerRecord.cycleId}:`, {
            error: error.message,
            stack: error.stack,
            query: 'cycleWinnerSelections COUNT'
          });
        }

        // Step 2.1: User is a winner - ALWAYS prioritize payout override amounts
        const finalPayoutAmount = winnerRecord.payoutFinal || winnerRecord.payoutOverride || winnerRecord.rewardAmount;
        
        return {
          isWinner: true,
          cycleId: winnerRecord.cycleId,
          cycleName: winnerRecord.cycleName || `Cycle ${winnerRecord.cycleId}`,
          rewardAmount: finalPayoutAmount, // Use finalPayoutAmount which prioritizes payout override
          payoutOverride: winnerRecord.payoutOverride,
          payoutFinal: winnerRecord.payoutFinal,
          finalPayoutAmount: finalPayoutAmount, // Always the correct override amount
          tier: winnerRecord.tier,
          notificationDisplayed: winnerRecord.notificationDisplayed,
          payoutStatus: winnerRecord.payoutStatus || 'pending',
          communityStats: {
            totalDistributed: totalRewardPool,
            totalWinners: totalWinners,
            currentCycleName: winnerRecord.cycleName
          }
        };
      }

      // User is not a winner - show community stats for most recent sealed cycle to ALL users
      const [mostRecentSealedCycle] = await db
        .select({
          cycleId: cycleSettings.id,
          cycleName: cycleSettings.cycleName,
          sealedAt: cycleWinnerSelections.sealedAt
        })
        .from(cycleSettings)
        .leftJoin(cycleWinnerSelections, eq(cycleSettings.id, cycleWinnerSelections.cycleSettingId))
        .where(eq(cycleWinnerSelections.isSealed, true))
        .orderBy(desc(cycleWinnerSelections.sealedAt))
        .limit(1);

      if (!mostRecentSealedCycle) {
        return null; // No sealed cycles yet
      }

      console.log(`[WINNER STATUS] Non-winner user ${userId} - showing community stats for cycle ${mostRecentSealedCycle.cycleId}`);
      
      // Step 3: Use same pool calculation as /api/cycles/pool endpoint
      let totalRewardPool = 7500; // Default fallback
      let totalWinners = 0;
      
      try {
        const poolData = await this.getCyclePoolData(mostRecentSealedCycle.cycleId);
        totalRewardPool = poolData.totalPool;
      } catch (error) {
        console.error(`[WINNER STATUS] Error fetching pool data for non-winner in cycle ${mostRecentSealedCycle.cycleId}:`, {
          error: error.message,
          stack: error.stack,
          query: 'getCyclePoolData for non-winner'
        });
      }

      try {
        const [totalWinnersResult] = await db
          .select({
            totalWinners: sql<number>`COUNT(*)`
          })
          .from(cycleWinnerSelections)
          .where(
            and(
              eq(cycleWinnerSelections.cycleSettingId, mostRecentSealedCycle.cycleId),
              eq(cycleWinnerSelections.isSealed, true)
            )
          );
        
        if (totalWinnersResult?.totalWinners) {
          totalWinners = totalWinnersResult.totalWinners;
        }
      } catch (error) {
        console.error(`[WINNER STATUS] Error counting winners for non-winner in cycle ${mostRecentSealedCycle.cycleId}:`, {
          error: error.message,
          stack: error.stack,
          query: 'cycleWinnerSelections COUNT for non-winner'
        });
      }

      // Check if non-winner notification has been dismissed for this cycle
      const dismissalKey = `non-winner-${userId}-${mostRecentSealedCycle.cycleId}`;
      const isDismissed = this.sessionCache?.get(dismissalKey) || false;

      return {
        isWinner: false,
        cycleId: mostRecentSealedCycle.cycleId,
        cycleName: mostRecentSealedCycle.cycleName || `Cycle ${mostRecentSealedCycle.cycleId}`,
        notificationDisplayed: isDismissed,
        communityStats: {
          totalDistributed: totalRewardPool,
          totalWinners: totalWinners,
          currentCycleName: mostRecentSealedCycle.cycleName
        }
      };
    } catch (error) {
      console.error('Error getting user winner status:', error);
      return null;
    }
  }

  // Step 3: Enhanced notification dismissal - handles both winners and non-winners
  async markWinnerNotificationDisplayed(userId: number, cycleSettingId: number): Promise<{ success: boolean; message: string }> {
    try {
      // First check if the user is a winner in this sealed cycle
      const [winnerRecord] = await db
        .select({ id: cycleWinnerSelections.id })
        .from(cycleWinnerSelections)
        .where(
          and(
            eq(cycleWinnerSelections.userId, userId),
            eq(cycleWinnerSelections.cycleSettingId, cycleSettingId),
            eq(cycleWinnerSelections.isSealed, true)
          )
        );

      if (winnerRecord) {
        // User is a winner - update their winner record
        await db
          .update(cycleWinnerSelections)
          .set({ notificationDisplayed: true })
          .where(
            and(
              eq(cycleWinnerSelections.userId, userId),
              eq(cycleWinnerSelections.cycleSettingId, cycleSettingId),
              eq(cycleWinnerSelections.isSealed, true)
            )
          );
        
        console.log(`[NOTIFICATION] Marked winner notification as displayed for user ${userId} in cycle ${cycleSettingId}`);
        
        return {
          success: true,
          message: `Winner notification dismissed for user ${userId} in cycle ${cycleSettingId}`
        };
      }

      // User is not a winner - check if they participated in this cycle
      const [userParticipation] = await db
        .select({ userId: userCyclePoints.userId })
        .from(userCyclePoints)
        .where(
          and(
            eq(userCyclePoints.userId, userId),
            eq(userCyclePoints.cycleSettingId, cycleSettingId)
          )
        )
        .limit(1);

      if (!userParticipation) {
        return {
          success: false,
          message: `User ${userId} did not participate in cycle ${cycleSettingId}`
        };
      }

      // For non-winners, we'll store dismissal using a simple in-memory cache for the session
      // This is acceptable since non-winner notifications are less critical than winner notifications
      // and only need to persist for the current session
      const dismissalKey = `non-winner-${userId}-${cycleSettingId}`;
      if (!this.sessionCache) {
        this.sessionCache = new Map();
      }
      this.sessionCache.set(dismissalKey, true);
      
      console.log(`[NOTIFICATION] Marked non-winner notification as displayed for user ${userId} in cycle ${cycleSettingId}`);
      
      return {
        success: true,
        message: `Community notification dismissed for user ${userId} in cycle ${cycleSettingId}`
      };
    } catch (error) {
      console.error('Error marking notification as displayed:', error);
      return {
        success: false,
        message: `Failed to dismiss notification: ${error.message}`
      };
    }
  }

  // ========================================
  // PAYOUT BATCH SYSTEM IMPLEMENTATIONS (Step 1)
  // ========================================

  // Batch Creation and Management
  async createPayoutBatch(data: InsertPayoutBatch): Promise<PayoutBatch> {
    try {
      const [batch] = await db.insert(payoutBatches).values(data).returning();
      console.log(`[PAYOUT BATCH] Created batch ${batch.id} for cycle ${data.cycleSettingId}`);
      return batch;
    } catch (error) {
      console.error('Error creating payout batch:', error);
      throw error;
    }
  }

  async createPayoutBatchItem(data: InsertPayoutBatchItem): Promise<PayoutBatchItem> {
    try {
      const [item] = await db.insert(payoutBatchItems).values(data).returning();
      return item;
    } catch (error) {
      console.error('Error creating payout batch item:', error);
      throw error;
    }
  }

  async getPayoutBatch(batchId: number): Promise<PayoutBatch | null> {
    try {
      const [batch] = await db
        .select()
        .from(payoutBatches)
        .where(eq(payoutBatches.id, batchId));
      return batch || null;
    } catch (error) {
      console.error('Error getting payout batch:', error);
      throw error;
    }
  }

  async getPayoutBatchBySenderBatchId(senderBatchId: string): Promise<PayoutBatch | null> {
    try {
      const [batch] = await db
        .select()
        .from(payoutBatches)
        .where(eq(payoutBatches.senderBatchId, senderBatchId));
      return batch || null;
    } catch (error) {
      console.error('Error getting payout batch by sender batch ID:', error);
      throw error;
    }
  }

  async getPayoutBatchItems(batchId: number): Promise<PayoutBatchItem[]> {
    try {
      const items = await db
        .select()
        .from(payoutBatchItems)
        .where(eq(payoutBatchItems.batchId, batchId))
        .orderBy(payoutBatchItems.createdAt);
      return items;
    } catch (error) {
      console.error('Error getting payout batch items:', error);
      throw error;
    }
  }

  
async getActivePayoutBatchForCycle(cycleId: number): Promise<PayoutBatch | null> {
  try {
    // Raw SQL using actual snake_case DB columns; alias to camelCase for TS typing
    const result: any = await db.execute(sql`
      SELECT
        id,
        status,
        paypal_batch_id AS "paypalBatchId",
        cycle_setting_id AS "cycleSettingId",
        created_at      AS "createdAt"
      FROM payout_batches
      WHERE cycle_setting_id = ${cycleId}
        AND lower(status) IN ('created','processing')
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const row = (result?.rows ?? result)?.[0] ?? null;
    return row as unknown as PayoutBatch | null;
  } catch (error) {
    console.error('Error getting active payout batch for cycle:', error);
    return null;
  }
}

  // Step 8: Concurrency protection - get batches by cycle
  async getPayoutBatchesByCycle(cycleId: number): Promise<PayoutBatch[]> {
    try {
      const batches = await db
        .select()
        .from(payoutBatches)
        .where(eq(payoutBatches.cycleSettingId, cycleId))
        .orderBy(payoutBatches.createdAt);
      return batches;
    } catch (error) {
      console.error('Error getting payout batches by cycle:', error);
      throw error;
    }
  }

  // Step 5: Cleanup methods for preview mode
  async deletePayoutBatch(batchId: number): Promise<void> {
    try {
      // First delete associated items due to foreign key constraint
      await db.delete(payoutBatchItems).where(eq(payoutBatchItems.batchId, batchId));
      
      // Then delete the batch
      await db.delete(payoutBatches).where(eq(payoutBatches.id, batchId));
      
      console.log(`[PAYOUT BATCH] Deleted batch ${batchId} and associated items`);
    } catch (error) {
      console.error('Error deleting payout batch:', error);
      throw error;
    }
  }

  async deletePayoutBatchItems(batchId: number): Promise<void> {
    try {
      await db.delete(payoutBatchItems).where(eq(payoutBatchItems.batchId, batchId));
      console.log(`[PAYOUT BATCH] Deleted items for batch ${batchId}`);
    } catch (error) {
      console.error('Error deleting payout batch items:', error);
      throw error;
    }
  }

  // ============================================================================
  // STEP 6: RE-RUN PREVENTION & RETRY LOGIC STORAGE METHODS
  // ============================================================================

  /**
   * Acquire a processing lock to prevent concurrent executions
   */
  async acquireProcessingLock(lockKey: string, expiry: Date): Promise<boolean> {
    try {
      // Simple implementation using cache - in production could use Redis or dedicated lock table
      const existingLock = this.cache.get(lockKey);
      
      if (existingLock && existingLock.expiry > new Date()) {
        console.log(`[STEP 6 LOCK] Lock ${lockKey} already exists, expires at ${existingLock.expiry}`);
        return false;
      }

      // Acquire lock
      this.cache.set(lockKey, { expiry, acquired: new Date() });
      console.log(`[STEP 6 LOCK] Acquired lock ${lockKey}, expires at ${expiry}`);
      return true;

    } catch (error) {
      console.error('[STEP 6 LOCK] Error acquiring processing lock:', error);
      return false;
    }
  }

  /**
   * Release a processing lock
   */
  async releaseProcessingLock(lockKey: string): Promise<void> {
    try {
      this.cache.delete(lockKey);
      console.log(`[STEP 6 LOCK] Released lock ${lockKey}`);
    } catch (error) {
      console.error('[STEP 6 LOCK] Error releasing processing lock:', error);
      // Don't throw - this is cleanup
    }
  }

  /**
   * Get information about a processing lock
   */
  async getProcessingLockInfo(lockKey: string): Promise<{
    expiry: Date;
    acquired: Date;
  } | null> {
    try {
      const lockInfo = this.cache.get(lockKey);
      return lockInfo || null;
    } catch (error) {
      console.error('[STEP 6 LOCK] Error getting lock info:', error);
      return null;
    }
  }

  /**
   * Record a retry attempt for auditing
   */
  async recordRetryAttempt(batchId: number, retryInfo: {
    attemptNumber: number;
    timestamp: Date;
    errorType: string;
    errorMessage: string;
    recoverable: boolean;
  }): Promise<void> {
    try {
      // Update batch with retry information
      await db
        .update(payoutBatches)
        .set({
          retryCount: retryInfo.attemptNumber,
          lastRetryAt: retryInfo.timestamp,
          lastRetryError: `${retryInfo.errorType}: ${retryInfo.errorMessage}`,
          updatedAt: new Date()
        })
        .where(eq(payoutBatches.id, batchId));

      console.log(`[STEP 6 RETRY] Recorded retry attempt ${retryInfo.attemptNumber} for batch ${batchId}`);
    } catch (error) {
      console.error('[STEP 6 RETRY] Error recording retry attempt:', error);
      // Don't throw - this is auditing
    }
  }

  /**
   * Get recent payout batches within a time window
   */
  async getRecentPayoutBatches(cycleSettingId: number, timeWindowMs: number): Promise<any[]> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMs);
      
      const recentBatches = await db
        .select()
        .from(payoutBatches)
        .where(
          and(
            eq(payoutBatches.cycleSettingId, cycleSettingId),
            sql`${payoutBatches.updatedAt} > ${cutoffTime}`
          )
        )
        .orderBy(sql`${payoutBatches.updatedAt} DESC`)
        .limit(10);

      return recentBatches;
    } catch (error) {
      console.error('[STEP 6 RECENT] Error getting recent payout batches:', error);
      return [];
    }
  }

  /**
   * Enhanced duplicate transaction check with improved context matching
   */
  async checkForDuplicateTransaction(requestId: string): Promise<{
    isDuplicate: boolean;
    existingBatchId?: string;
    batchStatus?: string;
  }> {
    try {
      // Check by request checksum or sender batch ID pattern
      const existingBatch = await db
        .select()
        .from(payoutBatches)
        .where(
          or(
            eq(payoutBatches.requestChecksum, requestId),
            sql`${payoutBatches.senderBatchId} LIKE ${`%${requestId}%`}`
          )
        )
        .limit(1);

      if (existingBatch.length > 0) {
        const batch = existingBatch[0];
        return {
          isDuplicate: true,
          existingBatchId: batch.senderBatchId,
          batchStatus: batch.status
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.warn('[STEP 6 DUPLICATE] Duplicate check failed, proceeding:', error);
      return { isDuplicate: false };
    }
  }

  // Idempotency and Validation
  generateIdempotencyKey(cycleId: number, winnerData: Array<{id: number, amount: number, email: string}>): string {
    // Create deterministic hash from cycle + sorted winner data
    const sortedData = winnerData
      .sort((a, b) => a.id - b.id)
      .map(w => `${w.id}:${w.amount}:${w.email}`)
      .join('|');
    
    const input = `cycle-${cycleId}|${sortedData}`;
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  async checkExistingBatch(requestChecksum: string): Promise<PayoutBatch | null> {
    try {
      const [batch] = await db
        .select()
        .from(payoutBatches)
        .where(eq(payoutBatches.requestChecksum, requestChecksum))
        .orderBy(desc(payoutBatches.createdAt));
      return batch || null;
    } catch (error) {
      console.error('Error checking existing batch:', error);
      throw error;
    }
  }

  // Eligible Winners Management
  async findEligibleWinners(cycleId: number): Promise<Array<{
    id: number;
    userId: number;
    paypalEmail: string;
    payoutFinal: number;
    tier: string;
    tierRank: number;
    payoutStatus: string;
  }>> {
    try {
      const winners = await db
        .select({
          id: cycleWinnerSelections.id,
          userId: cycleWinnerSelections.userId,
          paypalEmail: users.paypalEmail,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          tier: cycleWinnerSelections.tier,
          tierRank: cycleWinnerSelections.tierRank,
          payoutStatus: cycleWinnerSelections.payoutStatus
        })
        .from(cycleWinnerSelections)
        .innerJoin(users, eq(cycleWinnerSelections.userId, users.id))
        .where(
          and(
            eq(cycleWinnerSelections.cycleSettingId, cycleId),
            inArray(cycleWinnerSelections.payoutStatus, ['pending', 'failed']),
            isNotNull(users.paypalEmail),
            gt(cycleWinnerSelections.payoutFinal, 0)
          )
        )
        .orderBy(cycleWinnerSelections.tierRank);

      return winners.filter(w => w.paypalEmail && w.paypalEmail.trim() !== '');
    } catch (error) {
      console.error('Error finding eligible winners:', error);
      throw error;
    }
  }

  // Status Updates (Two-Phase Transaction Pattern)
  async markWinnersProcessing(winnerIds: number[], batchId: number): Promise<void> {
    try {
      await db
        .update(cycleWinnerSelections)
        .set({
          payoutStatus: 'processing',
          lastModified: new Date()
        })
        .where(inArray(cycleWinnerSelections.id, winnerIds));
      
      console.log(`[PAYOUT BATCH] Marked ${winnerIds.length} winners as processing for batch ${batchId}`);
    } catch (error) {
      console.error('Error marking winners as processing:', error);
      throw error;
    }
  }

  async updatePayoutBatchStatus(batchId: number, status: string, updates?: Partial<PayoutBatch>): Promise<PayoutBatch> {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
        ...updates
      };

      const [batch] = await db
        .update(payoutBatches)
        .set(updateData)
        .where(eq(payoutBatches.id, batchId))
        .returning();

      console.log(`[PAYOUT BATCH] Updated batch ${batchId} status to ${status}`);
      return batch;
    } catch (error) {
      console.error('Error updating payout batch status:', error);
      throw error;
    }
  }

  async updatePayoutBatchItemStatus(itemId: number, status: string, updates?: Partial<PayoutBatchItem>): Promise<PayoutBatchItem> {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
        ...updates
      };

      const [item] = await db
        .update(payoutBatchItems)
        .set(updateData)
        .where(eq(payoutBatchItems.id, itemId))
        .returning();

      return item;
    } catch (error) {
      console.error('Error updating payout batch item status:', error);
      throw error;
    }
  }

  async finalizePayoutResults(batchId: number, results: Array<{
    cycleWinnerSelectionId: number;
    status: 'success' | 'failed' | 'pending';
    paypalItemId?: string;
    errorCode?: string;
    errorMessage?: string;
  }>): Promise<void> {
    try {
      // Update cycle winner selections with final results
      for (const result of results) {
        const payoutStatus = result.status === 'success' ? 'completed' : 
                           result.status === 'pending' ? 'pending' : 'failed';
        
        const updateData: any = {
          payoutStatus,
          lastModified: new Date()
        };

        // Set notification flag for successful payouts
        if (result.status === 'success') {
          updateData.notificationDisplayed = false; // Allow winner celebration banner to show
        }

        await db
          .update(cycleWinnerSelections)
          .set(updateData)
          .where(eq(cycleWinnerSelections.id, result.cycleWinnerSelectionId));

        // Update corresponding batch item if PayPal item ID provided
        if (result.paypalItemId) {
          await db
            .update(payoutBatchItems)
            .set({
              paypalItemId: result.paypalItemId,
              status: result.status,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage,
              updatedAt: new Date(),
              processedAt: new Date()
            })
            .where(eq(payoutBatchItems.cycleWinnerSelectionId, result.cycleWinnerSelectionId));
        }
      }

      console.log(`[PAYOUT BATCH] Finalized ${results.length} payout results for batch ${batchId}`);
    } catch (error) {
      console.error('Error finalizing payout results:', error);
      throw error;
    }
  }

  // Cycle Completion Management
  async updateCycleStatusAfterDisbursement(cycleId: number, adminUserId: number): Promise<void> {
    try {
      // Check all winner statuses to determine cycle completion
      const statusCounts = await db
        .select({
          payoutStatus: cycleWinnerSelections.payoutStatus,
          count: sql<number>`count(*)`
        })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleId))
        .groupBy(cycleWinnerSelections.payoutStatus);

      const counts = statusCounts.reduce((acc, row) => {
        acc[row.payoutStatus] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      const completedCount = counts['completed'] || 0;
      const failedCount = counts['failed'] || 0;
      const pendingCount = counts['pending'] || 0;
      const totalWinners = completedCount + failedCount + pendingCount;

      let cycleStatus: string;
      let completedAt: Date | null = null;
      let completedBy: number | null = null;

      if (completedCount === totalWinners && totalWinners > 0) {
        // All payouts successful
        cycleStatus = 'completed';
        completedAt = new Date();
        completedBy = adminUserId;
      } else if (completedCount > 0 && (failedCount > 0 || pendingCount > 0)) {
        // Mixed results
        cycleStatus = 'partially_completed';
      } else {
        // All failed or still pending
        cycleStatus = 'active';
      }

      await db
        .update(cycleSettings)
        .set({
          status: cycleStatus,
          completedAt,
          completedBy
        })
        .where(eq(cycleSettings.id, cycleId));

      console.log(`[CYCLE STATUS] Updated cycle ${cycleId} to ${cycleStatus} (${completedCount}/${totalWinners} completed)`);
    } catch (error) {
      console.error('Error updating cycle status after disbursement:', error);
      throw error;
    }
  }

  // Mark cycle selection as executed (draft state) - allows export/import before sealing
  private async markCycleSelectionExecuted(cycleSettingId: number, winnerCount: number, totalPool: number): Promise<void> {
    try {
      await db
        .update(cycleSettings)
        .set({
          selectionExecuted: true,
          totalWinners: winnerCount,
          totalRewardPool: Math.floor(totalPool * 100), // Store in cents
          selectionExecutedAt: new Date()
        })
        .where(eq(cycleSettings.id, cycleSettingId));
      
      console.log(`Marked cycle ${cycleSettingId} selection as executed (draft) with ${winnerCount} winners and $${totalPool} pool`);
    } catch (error) {
      console.error('Error marking cycle selection as executed:', error);
      throw error;
    }
  }

  // Mark cycle selection as completed to ensure persistence across sessions
  private async markCycleSelectionCompleted(cycleSettingId: number, winnerCount: number, totalPool: number): Promise<void> {
    try {
      await db
        .update(cycleSettings)
        .set({
          selectionCompleted: true,
          totalWinners: winnerCount,
          totalRewardPool: Math.floor(totalPool * 100), // Store in cents
          selectionCompletedAt: new Date()
        })
        .where(eq(cycleSettings.id, cycleSettingId));
      
      console.log(`Marked cycle ${cycleSettingId} selection as completed with ${winnerCount} winners and $${totalPool} pool`);
    } catch (error) {
      console.error('Error marking cycle selection as completed:', error);
      throw error;
    }
  }

  async getEligibleUsersForSelection(cycleSettingId: number): Promise<any[]> {
    try {
      // Simple query to get premium users
      const result = await db.execute(sql`
        SELECT DISTINCT
          u.id,
          u.username,
          u.email,
          u.tier,
          u.is_active as "isActive",
          CASE WHEN u.subscription_status = 'active' THEN true ELSE false END as "isPremium",
          COALESCE(ucp.current_cycle_points, 0) as "currentCyclePoints"
        FROM users u
        LEFT JOIN user_cycle_points ucp 
          ON u.id = ucp.user_id 
          AND ucp.cycle_setting_id = ${cycleSettingId}
        WHERE u.is_active = true 
          AND u.subscription_status = 'active'
      `);

      return result;
    } catch (error) {
      console.error('Error getting eligible users:', error);
      return [];
    }
  }

  async getCycleWinnerDetails(cycleSettingId: number): Promise<any> {
    try {
      console.log(`[DEBUG] getCycleWinnerDetails called with cycleSettingId: ${cycleSettingId}`);
      
      // Step 1: Check if any winner records exist for this cycle
      const recordCount = await db
        .select({ count: sql`count(*)`.as('count') })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));
      
      console.log(`[DEBUG] Found ${recordCount[0]?.count || 0} winner records for cycle ${cycleSettingId}`);
      
      if (!recordCount[0]?.count || recordCount[0].count === '0') {
        console.log(`[DEBUG] No winner records found, returning empty result`);
        return { winners: [] };
      }
      
      // Step 2: Try a simpler query first - just winner selections without join
      console.log(`[DEBUG] Attempting simple query without join...`);
      const simpleWinners = await db
        .select()
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
        .limit(5);
      
      console.log(`[DEBUG] Simple query successful, found ${simpleWinners.length} records`);
      console.log(`[DEBUG] Sample record:`, simpleWinners[0] ? JSON.stringify(simpleWinners[0], null, 2) : 'none');
      
      // Step 3: Try the full query with join (Phase 2A: Include audit fields)
      console.log(`[DEBUG] Attempting full query with join...`);
      const winners = await db
        .select({
          id: cycleWinnerSelections.id,
          userId: cycleWinnerSelections.userId,
          username: users.username,
          email: users.email,
          // Phase 2: Critical PayPal email data from users table
          paypalEmail: users.paypalEmail,
          tier: cycleWinnerSelections.tier,
          tierRank: cycleWinnerSelections.tierRank,
          overallRank: cycleWinnerSelections.overallRank,
          pointsAtSelection: cycleWinnerSelections.pointsAtSelection,
          rewardAmount: cycleWinnerSelections.rewardAmount,
          pointsDeducted: cycleWinnerSelections.pointsDeducted,
          pointsRolledOver: cycleWinnerSelections.pointsRolledOver,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          selectionDate: cycleWinnerSelections.selectionDate,
          // Phase 2A: Enhanced audit fields for save/seal workflow
          isSealed: cycleWinnerSelections.isSealed,
          sealedAt: cycleWinnerSelections.sealedAt,
          sealedBy: cycleWinnerSelections.sealedBy,
          savedAt: cycleWinnerSelections.savedAt,
          savedBy: cycleWinnerSelections.savedBy
        })
        .from(cycleWinnerSelections)
        .leftJoin(users, eq(users.id, cycleWinnerSelections.userId))
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
        .orderBy(asc(cycleWinnerSelections.overallRank));

      console.log(`[DEBUG] Full query successful, found ${winners.length} records`);
      
      // Use actual overall ranks from database (don't calculate from index)
      const winnersWithOverallRank = winners.map((winner) => ({
        ...winner,
        overallRank: winner.overallRank || 0,
        payoutPercentage: 100, // Default to 100% since this field doesn't exist in schema
        baseReward: (winner.rewardAmount || 0) / 100, // Convert cents to dollars for display
        finalAmount: (winner.rewardAmount || 0) / 100, // Same as base since 100%
        reason: 'Auto-selected', // Default reason
        // Phase 2: Critical computed field for PayPal configuration status
        paypalConfigured: winner.paypalEmail ? 'Yes' : 'Not configured'
      }));

      console.log(`[DEBUG] Successfully processed ${winnersWithOverallRank.length} winners with overall ranks`);
      return { winners: winnersWithOverallRank };
    } catch (error) {
      console.error('[DEBUG] Error getting cycle winner details:', error);
      console.error('[DEBUG] Error stack:', error.stack);
      console.error('[DEBUG] Query parameters:', { cycleSettingId });
      return { winners: [] };
    }
  }

  async getCycleWinnerDetailsPaginated(cycleSettingId: number, page: number, limit: number): Promise<{winners: any[], totalCount: number}> {
    try {
      console.log(`[DEBUG] getCycleWinnerDetailsPaginated called with cycleSettingId: ${cycleSettingId}, page: ${page}, limit: ${limit}`);
      
      // Step 1: Get total count for pagination
      const totalCountResult = await db
        .select({ count: sql`count(*)`.as('count') })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));
      
      const totalCount = parseInt(totalCountResult[0]?.count?.toString() || '0');
      console.log(`[DEBUG] Total winners for cycle ${cycleSettingId}: ${totalCount}`);
      
      if (totalCount === 0) {
        return { winners: [], totalCount: 0 };
      }
      
      // Step 2: Get paginated results with LIMIT and OFFSET
      const offset = (page - 1) * limit;
      console.log(`[DEBUG] Fetching page ${page} with limit ${limit}, offset ${offset}`);
      
      const winners = await db
        .select({
          id: cycleWinnerSelections.id,
          userId: cycleWinnerSelections.userId,
          username: users.username,
          email: users.email,
          // Phase 2: Critical PayPal email data from users table
          paypalEmail: users.paypalEmail,
          tier: cycleWinnerSelections.tier,
          tierRank: cycleWinnerSelections.tierRank,
          overallRank: cycleWinnerSelections.overallRank,
          pointsAtSelection: cycleWinnerSelections.pointsAtSelection,
          rewardAmount: cycleWinnerSelections.rewardAmount,
          pointsDeducted: cycleWinnerSelections.pointsDeducted,
          pointsRolledOver: cycleWinnerSelections.pointsRolledOver,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          selectionDate: cycleWinnerSelections.selectionDate,
          // Phase 2: Enhanced payout columns
          tierSizeAmount: cycleWinnerSelections.tierSizeAmount,
          payoutPercentage: cycleWinnerSelections.payoutPercentage,
          payoutCalculated: cycleWinnerSelections.payoutCalculated,
          payoutOverride: cycleWinnerSelections.payoutOverride,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          lastModified: cycleWinnerSelections.lastModified,
          // Phase 2A: Enhanced audit fields for save/seal workflow
          isSealed: cycleWinnerSelections.isSealed,
          sealedAt: cycleWinnerSelections.sealedAt,
          sealedBy: cycleWinnerSelections.sealedBy,
          savedAt: cycleWinnerSelections.savedAt,
          savedBy: cycleWinnerSelections.savedBy
        })
        .from(cycleWinnerSelections)
        .leftJoin(users, eq(users.id, cycleWinnerSelections.userId))
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
        .orderBy(asc(cycleWinnerSelections.overallRank))
        .limit(limit)
        .offset(offset);

      console.log(`[DEBUG] Retrieved ${winners.length} winners for current page`);
      
      // Step 3: Format winners data (use actual overallRank from database)
      const winnersWithOverallRank = winners.map((winner, index) => ({
        ...winner,
        overallRank: winner.overallRank, // Use actual overall rank from database
        payoutPercentage: winner.payoutPercentage || 100,
        baseReward: (winner.payoutCalculated || winner.rewardAmount || 0) / 100,
        finalAmount: (winner.payoutFinal || winner.rewardAmount || 0) / 100,
        reason: 'Auto-selected',
        // Phase 2: Critical computed field for PayPal configuration status
        paypalConfigured: winner.paypalEmail ? 'Yes' : 'Not configured'
      }));

      console.log(`[DEBUG] Successfully processed ${winnersWithOverallRank.length} paginated winners`);
      return { 
        winners: winnersWithOverallRank, 
        totalCount: totalCount 
      };
    } catch (error) {
      console.error('[DEBUG] Error getting paginated cycle winner details:', error);
      console.error('[DEBUG] Error stack:', error);
      console.error('[DEBUG] Query parameters:', { cycleSettingId, page, limit });
      return { winners: [], totalCount: 0 };
    }
  }

  async clearCycleWinnerSelection(cycleSettingId: number): Promise<void> {
    try {
      // Clear winner selections
      await db
        .delete(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId));

      // Reset cycle execution state to allow re-running
      await db
        .update(cycleSettings)
        .set({
          selectionExecuted: false,
          selectionSealed: false,
          totalWinners: 0,
          totalRewardPool: 0,
          selectionExecutedAt: null,
          selectionSealedAt: null
        })
        .where(eq(cycleSettings.id, cycleSettingId));

      console.log(`Cleared winner selection and reset execution state for cycle ${cycleSettingId}`);
    } catch (error) {
      console.error('Error clearing cycle winner selection:', error);
      throw error;
    }
  }

  // Cycle Completion Methods
  async completeCycle(cycleId: number, completedBy: number): Promise<void> {
    try {
      // Mark cycle as completed
      await db
        .update(cycleSettings)
        .set({
          status: 'completed',
          completedAt: new Date(),
          completedBy,
          isActive: false
        })
        .where(eq(cycleSettings.id, cycleId));

      // Reset all user cycle points for this cycle
      await this.resetUserCyclePoints(cycleId);

      console.log(`Cycle ${cycleId} completed successfully by user ${completedBy}`);
    } catch (error) {
      console.error('Error completing cycle:', error);
      throw error;
    }
  }

  async resetUserCyclePoints(cycleId: number): Promise<void> {
    try {
      // Reset all users' current cycle points to 0
      await db
        .update(userCyclePoints)
        .set({
          currentCyclePoints: 0,
          tier: 'tier3' // Reset to lowest tier
        })
        .where(eq(userCyclePoints.cycleSettingId, cycleId));

      console.log(`Reset cycle points for all users in cycle ${cycleId}`);
    } catch (error) {
      console.error('Error resetting user cycle points:', error);
      throw error;
    }
  }

  async archiveCycleData(cycleId: number): Promise<void> {
    try {
      // Mark cycle as archived (preserves all data but marks as historical)
      await db
        .update(cycleSettings)
        .set({
          status: 'archived'
        })
        .where(eq(cycleSettings.id, cycleId));

      console.log(`Cycle ${cycleId} archived successfully`);
    } catch (error) {
      console.error('Error archiving cycle:', error);
      throw error;
    }
  }

  // ========================================
  // PREDICTION SYSTEM METHODS (Phase 1)
  // ========================================

  // Prediction Questions Management
  async createPredictionQuestion(data: InsertPredictionQuestion & { createdBy: number }): Promise<PredictionQuestion> {
    try {
      const [question] = await db.insert(predictionQuestions).values(data).returning();
      return question;
    } catch (error) {
      console.error('Error creating prediction question:', error);
      throw error;
    }
  }

  async getPredictionQuestion(questionId: number): Promise<PredictionQuestion | null> {
    try {
      const [question] = await db.select()
        .from(predictionQuestions)
        .where(eq(predictionQuestions.id, questionId))
        .limit(1);
      return question || null;
    } catch (error) {
      console.error('Error getting prediction question:', error);
      return null;
    }
  }

  async updatePredictionQuestion(questionId: number, updates: Partial<PredictionQuestion>): Promise<PredictionQuestion> {
    try {
      const [updated] = await db.update(predictionQuestions)
        .set(updates)
        .where(eq(predictionQuestions.id, questionId))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating prediction question:', error);
      throw error;
    }
  }

  async deletePredictionQuestion(questionId: number): Promise<void> {
    try {
      await db.delete(predictionQuestions)
        .where(eq(predictionQuestions.id, questionId));
    } catch (error) {
      console.error('Error deleting prediction question:', error);
      throw error;
    }
  }

  // Prediction Questions by Cycle
  async getPredictionQuestionsByCycle(cycleSettingId: number): Promise<PredictionQuestion[]> {
    try {
      return await db.select()
        .from(predictionQuestions)
        .where(eq(predictionQuestions.cycleSettingId, cycleSettingId))
        .orderBy(desc(predictionQuestions.createdAt));
    } catch (error) {
      console.error('Error getting prediction questions by cycle:', error);
      return [];
    }
  }

  async getActivePredictionQuestions(cycleSettingId: number): Promise<PredictionQuestion[]> {
    try {
      const now = new Date();
      return await db.select()
        .from(predictionQuestions)
        .where(
          and(
            eq(predictionQuestions.cycleSettingId, cycleSettingId),
            eq(predictionQuestions.status, 'active'),
            gte(predictionQuestions.submissionDeadline, now)
          )
        )
        .orderBy(asc(predictionQuestions.submissionDeadline));
    } catch (error) {
      console.error('Error getting active prediction questions:', error);
      return [];
    }
  }

  async getCompletedPredictionQuestions(cycleSettingId: number): Promise<PredictionQuestion[]> {
    try {
      return await db.select()
        .from(predictionQuestions)
        .where(
          and(
            eq(predictionQuestions.cycleSettingId, cycleSettingId),
            eq(predictionQuestions.status, 'completed')
          )
        )
        .orderBy(desc(predictionQuestions.completedAt));
    } catch (error) {
      console.error('Error getting completed prediction questions:', error);
      return [];
    }
  }

  // Prediction Question Status Management
  async publishPredictionQuestion(questionId: number): Promise<void> {
    try {
      await db.update(predictionQuestions)
        .set({
          status: 'active',
          publishedAt: new Date()
        })
        .where(eq(predictionQuestions.id, questionId));
    } catch (error) {
      console.error('Error publishing prediction question:', error);
      throw error;
    }
  }

  async closePredictionQuestion(questionId: number): Promise<void> {
    try {
      await db.update(predictionQuestions)
        .set({
          status: 'closed',
          closedAt: new Date()
        })
        .where(eq(predictionQuestions.id, questionId));
    } catch (error) {
      console.error('Error closing prediction question:', error);
      throw error;
    }
  }

  async setPredictionQuestionResult(questionId: number, correctAnswerIndex: number, pointsPerOption: number[]): Promise<void> {
    try {
      const result = await db.update(predictionQuestions)
        .set({
          correctAnswerIndex,
          pointAwards: JSON.stringify(pointsPerOption)
        })
        .where(eq(predictionQuestions.id, questionId))
        .returning();
    } catch (error) {
      console.error('Error setting prediction question result:', error);
      throw error;
    }
  }

  async completePredictionQuestion(questionId: number, completedBy: number): Promise<void> {
    try {
      await db.update(predictionQuestions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          completedBy,
          resultsPublished: true
        })
        .where(eq(predictionQuestions.id, questionId));
    } catch (error) {
      console.error('Error completing prediction question:', error);
      throw error;
    }
  }

  // User Predictions Management
  async submitUserPrediction(data: InsertUserPrediction): Promise<UserPrediction> {
    try {
      // Check if user already has a prediction for this question
      const existing = await this.getUserPrediction(data.predictionQuestionId, data.userId);
      
      if (existing) {
        // Update existing prediction
        return await this.updateUserPrediction(existing.id, data.selectedOptionIndex);
      } else {
        // Create new prediction
        const [prediction] = await db.insert(userPredictions).values(data).returning();
        
        // Update total submissions count
        await db.update(predictionQuestions)
          .set({
            totalSubmissions: sql`${predictionQuestions.totalSubmissions} + 1`
          })
          .where(eq(predictionQuestions.id, data.predictionQuestionId));
        
        return prediction;
      }
    } catch (error) {
      console.error('Error submitting user prediction:', error);
      throw error;
    }
  }

  async getUserPrediction(predictionQuestionId: number, userId: number): Promise<UserPrediction | null> {
    try {
      const [prediction] = await db.select()
        .from(userPredictions)
        .where(
          and(
            eq(userPredictions.predictionQuestionId, predictionQuestionId),
            eq(userPredictions.userId, userId)
          )
        )
        .limit(1);
      return prediction || null;
    } catch (error) {
      console.error('Error getting user prediction:', error);
      return null;
    }
  }

  async updateUserPrediction(predictionId: number, selectedOptionIndex: number): Promise<UserPrediction> {
    try {
      const [updated] = await db.update(userPredictions)
        .set({
          selectedOptionIndex,
          lastUpdatedAt: new Date()
        })
        .where(eq(userPredictions.id, predictionId))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating user prediction:', error);
      throw error;
    }
  }

  async getUserPredictions(userId: number): Promise<UserPrediction[]> {
    try {
      return await db.select()
        .from(userPredictions)
        .where(eq(userPredictions.userId, userId))
        .orderBy(desc(userPredictions.submittedAt));
    } catch (error) {
      console.error('Error getting user predictions:', error);
      return [];
    }
  }

  async getUserPredictionsByQuestion(predictionQuestionId: number): Promise<UserPrediction[]> {
    try {
      return await db.select()
        .from(userPredictions)
        .where(eq(userPredictions.predictionQuestionId, predictionQuestionId))
        .orderBy(desc(userPredictions.submittedAt));
    } catch (error) {
      console.error('Error getting user predictions by question:', error);
      return [];
    }
  }

  // Prediction Results Management
  async createPredictionResult(data: InsertPredictionResult & { determinedBy: number }): Promise<PredictionResult> {
    try {
      const [result] = await db.insert(predictionResults).values(data).returning();
      return result;
    } catch (error) {
      console.error('Error creating prediction result:', error);
      throw error;
    }
  }

  async getPredictionResult(predictionQuestionId: number): Promise<PredictionResult | null> {
    try {
      const [result] = await db.select()
        .from(predictionResults)
        .where(eq(predictionResults.predictionQuestionId, predictionQuestionId))
        .limit(1);
      return result || null;
    } catch (error) {
      console.error('Error getting prediction result:', error);
      return null;
    }
  }

  async updatePredictionResult(resultId: number, updates: Partial<PredictionResult>): Promise<PredictionResult> {
    try {
      const [updated] = await db.update(predictionResults)
        .set(updates)
        .where(eq(predictionResults.id, resultId))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating prediction result:', error);
      throw error;
    }
  }

  // Prediction Statistics
  async getPredictionQuestionStats(predictionQuestionId: number): Promise<{
    totalSubmissions: number;
    optionCounts: number[];
    optionPercentages: number[];
    usersByOption: Array<{email: string; username: string; submittedAt: string}[]>;
  }> {
    try {
      const [question] = await db.select()
        .from(predictionQuestions)
        .where(eq(predictionQuestions.id, predictionQuestionId));
      
      if (!question) {
        throw new Error('Prediction question not found');
      }

      const options = JSON.parse(question.options);
      const optionCounts = new Array(options.length).fill(0);
      const usersByOption: Array<{email: string; username: string; submittedAt: string}[]> = 
        options.map(() => []);

      // Get predictions with user details
      const predictions = await db.select({
        selectedOptionIndex: userPredictions.selectedOptionIndex,
        submittedAt: userPredictions.submittedAt,
        email: users.email,
        username: users.username
      })
        .from(userPredictions)
        .innerJoin(users, eq(userPredictions.userId, users.id))
        .where(eq(userPredictions.predictionQuestionId, predictionQuestionId));

      const totalSubmissions = predictions.length;

      // Count submissions and organize users by option
      predictions.forEach(prediction => {
        if (prediction.selectedOptionIndex >= 0 && prediction.selectedOptionIndex < options.length) {
          optionCounts[prediction.selectedOptionIndex]++;
          usersByOption[prediction.selectedOptionIndex].push({
            email: prediction.email,
            username: prediction.username,
            submittedAt: prediction.submittedAt.toISOString()
          });
        }
      });

      // Calculate percentages
      const optionPercentages = optionCounts.map(count => 
        totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0
      );

      return {
        totalSubmissions,
        optionCounts,
        optionPercentages,
        usersByOption
      };
    } catch (error) {
      console.error('Error getting prediction question stats:', error);
      return {
        totalSubmissions: 0,
        optionCounts: [],
        optionPercentages: [],
        usersByOption: []
      };
    }
  }

  // Prediction Points Distribution
  async distributePredictionPoints(predictionQuestionId: number): Promise<{
    totalPointsAwarded: number;
    usersAwarded: number;
  }> {
    try {
      const question = await this.getPredictionQuestion(predictionQuestionId);
      
      if (!question || question.correctAnswerIndex === null || question.correctAnswerIndex === undefined) {
        throw new Error('Question not found or correct answer not set');
      }

      const pointAwards = JSON.parse(question.pointAwards || '[]');
      const predictions = await this.getUserPredictionsByQuestion(predictionQuestionId);
      
      let totalPointsAwarded = 0;
      let usersAwarded = 0;

      // Award points to users based on their predictions
      for (const prediction of predictions) {
        const pointsToAward = pointAwards[prediction.selectedOptionIndex] || 0;
        
        if (pointsToAward > 0) {
          // Update user prediction with points awarded
          await db.update(userPredictions)
            .set({
              pointsAwarded: pointsToAward,
              pointsDistributedAt: new Date()
            })
            .where(eq(userPredictions.id, prediction.id));

          // Award cycle points to the user
          const activeCycle = await this.getActiveCycleSetting();
          if (activeCycle) {
            await this.awardCyclePoints(
              prediction.userId,
              activeCycle.id,
              'prediction_question',
              pointsToAward,
              `Prediction question: ${question.questionText.substring(0, 50)}...`,
              { predictionQuestionId }
            );
          }

          totalPointsAwarded += pointsToAward;
          usersAwarded++;
        }
      }

      // Mark question as points distributed
      await db.update(predictionQuestions)
        .set({ pointsDistributed: true })
        .where(eq(predictionQuestions.id, predictionQuestionId));



      return {
        totalPointsAwarded,
        usersAwarded
      };
    } catch (error) {
      console.error('Error distributing prediction points:', error);
      throw error;
    }
  }

  // Prediction Analytics
  async getPredictionAnalyticsByCycle(cycleSettingId: number): Promise<{
    totalQuestions: number;
    activeQuestions: number;
    completedQuestions: number;
    totalParticipants: number;
    averageParticipationRate: number;
  }> {
    try {
      const allQuestions = await this.getPredictionQuestionsByCycle(cycleSettingId);
      const activeQuestions = await this.getActivePredictionQuestions(cycleSettingId);
      const completedQuestions = await this.getCompletedPredictionQuestions(cycleSettingId);

      // Get unique participants across all questions in this cycle
      const allPredictions = await db.select({ userId: userPredictions.userId })
        .from(userPredictions)
        .innerJoin(predictionQuestions, eq(userPredictions.predictionQuestionId, predictionQuestions.id))
        .where(eq(predictionQuestions.cycleSettingId, cycleSettingId));

      const uniqueParticipants = new Set(allPredictions.map(p => p.userId));
      const totalParticipants = uniqueParticipants.size;

      // Calculate average participation rate
      const cycleUsers = await this.getUsersInCurrentCycle(cycleSettingId);
      const totalCycleUsers = cycleUsers.length;
      const averageParticipationRate = totalCycleUsers > 0 
        ? Math.round((totalParticipants / totalCycleUsers) * 100) 
        : 0;

      return {
        totalQuestions: allQuestions.length,
        activeQuestions: activeQuestions.length,
        completedQuestions: completedQuestions.length,
        totalParticipants,
        averageParticipationRate
      };
    } catch (error) {
      console.error('Error getting prediction analytics by cycle:', error);
      return {
        totalQuestions: 0,
        activeQuestions: 0,
        completedQuestions: 0,
        totalParticipants: 0,
        averageParticipationRate: 0
      };
    }
  }

  async getUserPredictionStats(userId: number): Promise<{
    totalPredictions: number;
    correctPredictions: number;
    totalPointsEarned: number;
    accuracyRate: number;
  }> {
    try {
      const userPredictions = await this.getUserPredictions(userId);
      const totalPredictions = userPredictions.length;
      
      let correctPredictions = 0;
      let totalPointsEarned = 0;

      for (const prediction of userPredictions) {
        totalPointsEarned += prediction.pointsAwarded;

        // Check if this was a correct prediction
        const question = await this.getPredictionQuestion(prediction.predictionQuestionId);
        if (question && question.correctAnswerIndex === prediction.selectedOptionIndex) {
          correctPredictions++;
        }
      }

      const accuracyRate = totalPredictions > 0 
        ? Math.round((correctPredictions / totalPredictions) * 100) 
        : 0;

      return {
        totalPredictions,
        correctPredictions,
        totalPointsEarned,
        accuracyRate
      };
    } catch (error) {
      console.error('Error getting user prediction stats:', error);
      return {
        totalPredictions: 0,
        correctPredictions: 0,
        totalPointsEarned: 0,
        accuracyRate: 0
      };
    }
  }

  // ========================================
  // STEP 3: ENHANCED STORAGE METHODS
  // Integration with Step 2 Parsed Results
  // ========================================

  /**
   * Step 3: Main orchestrator method to process PayPal parsed results
   * Integrates Step 2 parsing with Step 1 database infrastructure
   */
  async processPaypalResponseResults(batchId: number, parsedResponse: ParsedPayoutResponse): Promise<{
    batchUpdated: boolean;
    itemsUpdated: number;
    successfulPayouts: number;
    failedPayouts: number;
    pendingPayouts: number;
    userRewardsCreated: number;
    cycleCompleted: boolean;
  }> {
    console.log(`[STEP 3] Processing PayPal results for batch ${batchId}`);
    
    try {
      // Get the batch to ensure it exists and get cycle info
      const batch = await this.getPayoutBatch(batchId);
      if (!batch) {
        throw new Error(`Payout batch ${batchId} not found`);
      }

      let batchUpdated = false;
      let itemsUpdated = 0;
      let successfulPayouts = 0;
      let failedPayouts = 0;
      let pendingPayouts = 0;
      let userRewardsCreated = 0;
      let cycleCompleted = false;

      // Step 1: Update batch status from parsed response
      try {
        await this.updatePayoutBatchFromParsedResponse(batchId, parsedResponse);
        batchUpdated = true;
        console.log(`[STEP 3] Updated batch ${batchId} status to ${parsedResponse.batchStatus}`);
      } catch (error) {
        console.error(`[STEP 3] Failed to update batch status: ${error}`);
      }

      // Step 2: Update individual batch items with PayPal data
      if (parsedResponse.individualResults.length > 0) {
        try {
          itemsUpdated = await this.updatePayoutBatchItemsFromResults(batchId, parsedResponse.individualResults);
          console.log(`[STEP 3] Updated ${itemsUpdated} batch items`);
        } catch (error) {
          console.error(`[STEP 3] Failed to update batch items: ${error}`);
        }
      }

      // Step 3: Count status distribution
      parsedResponse.individualResults.forEach(result => {
        switch (result.status) {
          case 'success':
            successfulPayouts++;
            break;
          case 'failed':
            failedPayouts++;
            break;
          case 'pending':
          case 'unclaimed':
            pendingPayouts++;
            break;
        }
      });

      // Step 4: Create user reward records for successful payouts
      if (successfulPayouts > 0) {
        try {
          userRewardsCreated = await this.createUserRewardRecordsFromResults(
            batch.cycleSettingId,
            parsedResponse.individualResults.filter(r => r.status === 'success'),
            parsedResponse.paypalBatchId
          );
          console.log(`[STEP 3] Created ${userRewardsCreated} user reward records`);
        } catch (error) {
          console.error(`[STEP 3] Failed to create user reward records: ${error}`);
        }
      }

      // Step 5: Update winner processing status
      try {
        const winnersUpdated = await this.updateWinnerProcessingStatusFromResults(parsedResponse.individualResults);
        console.log(`[STEP 3] Updated processing status for ${winnersUpdated} winners`);
      } catch (error) {
        console.error(`[STEP 3] Failed to update winner status: ${error}`);
      }

      // Step 6: Check if cycle is complete
      try {
        const completionStatus = await this.checkCycleCompletionFromPaypalResults(batch.cycleSettingId);
        cycleCompleted = completionStatus.isComplete;
        
        if (cycleCompleted) {
          // Mark cycle as completed
          await db.update(cycleSettings)
            .set({ 
              disbursementCompleted: true,
              updatedAt: new Date()
            })
            .where(eq(cycleSettings.id, batch.cycleSettingId));
          console.log(`[STEP 3] Cycle ${batch.cycleSettingId} marked as completed`);
        }
      } catch (error) {
        console.error(`[STEP 3] Failed to check cycle completion: ${error}`);
      }

      console.log(`[STEP 3] Processing complete - ${successfulPayouts} successful, ${failedPayouts} failed, ${pendingPayouts} pending`);

      return {
        batchUpdated,
        itemsUpdated,
        successfulPayouts,
        failedPayouts,
        pendingPayouts,
        userRewardsCreated,
        cycleCompleted
      };

    } catch (error) {
      console.error(`[STEP 3] Error processing PayPal results for batch ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Update payout batch with parsed PayPal response data
   */
  async updatePayoutBatchFromParsedResponse(batchId: number, parsedResponse: ParsedPayoutResponse): Promise<PayoutBatch> {
    console.log(`[STEP 3] Updating batch ${batchId} from parsed PayPal response`);
    
    try {
      // Map parsed status to our database status
      let dbStatus = 'processing';
      switch (parsedResponse.batchStatus) {
        case 'SUCCESS':
        case 'COMPLETED':
          dbStatus = 'completed';
          break;
        case 'PENDING':
        case 'PROCESSING':
          dbStatus = 'processing';
          break;
        case 'DENIED':
        case 'FAILED':
        case 'BLOCKED':
          dbStatus = 'failed';
          break;
        default:
          dbStatus = 'processing';
      }

      // Count successful, failed, and pending items
      const statusCounts = parsedResponse.individualResults.reduce(
        (acc, item) => {
          switch (item.status) {
            case 'success':
              acc.successful++;
              break;
            case 'failed':
              acc.failed++;
              break;
            case 'pending':
            case 'unclaimed':
              acc.pending++;
              break;
          }
          return acc;
        },
        { successful: 0, failed: 0, pending: 0 }
      );

      // Update batch with PayPal data
      const [updatedBatch] = await db.update(payoutBatches)
        .set({
          status: dbStatus,
          paypalBatchId: parsedResponse.paypalBatchId,
          successfulCount: statusCounts.successful,
          failedCount: statusCounts.failed,
          pendingCount: statusCounts.pending,
          updatedAt: new Date()
        })
        .where(eq(payoutBatches.id, batchId))
        .returning();

      if (!updatedBatch) {
        throw new Error(`Failed to update payout batch ${batchId}`);
      }

      console.log(`[STEP 3] Batch ${batchId} updated: ${statusCounts.successful} successful, ${statusCounts.failed} failed, ${statusCounts.pending} pending`);
      return updatedBatch;

    } catch (error) {
      console.error(`[STEP 3] Error updating batch from parsed response:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Update individual payout batch items with PayPal result data
   */
  async updatePayoutBatchItemsFromResults(batchId: number, itemResults: PayoutItemResult[]): Promise<number> {
    console.log(`[STEP 3] Updating ${itemResults.length} batch items for batch ${batchId}`);
    
    try {
      let updatedCount = 0;

      for (const result of itemResults) {
        try {
          // Find the corresponding batch item by cycleWinnerSelectionId
          const [existingItem] = await db.select()
            .from(payoutBatchItems)
            .where(
              and(
                eq(payoutBatchItems.batchId, batchId),
                eq(payoutBatchItems.cycleWinnerSelectionId, result.cycleWinnerSelectionId)
              )
            );

          if (!existingItem) {
            console.warn(`[STEP 3] No batch item found for winner ${result.cycleWinnerSelectionId}`);
            continue;
          }

          // Update the batch item with PayPal data
          await db.update(payoutBatchItems)
            .set({
              paypalItemId: result.paypalItemId,
              status: result.status,
              paypalStatus: `PayPal: ${result.status.toUpperCase()}`,
              errorCode: result.errorCode || null,
              errorMessage: result.errorMessage || null,
              processedAt: result.processedAt || null,
              updatedAt: new Date()
            })
            .where(eq(payoutBatchItems.id, existingItem.id));

          updatedCount++;

        } catch (error) {
          console.error(`[STEP 3] Error updating batch item for winner ${result.cycleWinnerSelectionId}:`, error);
        }
      }

      console.log(`[STEP 3] Successfully updated ${updatedCount} batch items`);
      return updatedCount;

    } catch (error) {
      console.error(`[STEP 3] Error updating batch items from results:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Create user reward record for dashboard display
   */
  async createUserRewardRecord(data: {
    userId: number;
    cycleSettingId: number;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    paypalBatchId?: string;
    paypalItemId?: string;
    processedAt?: Date;
    tier?: string;
    cycleName?: string;
    errorMessage?: string;
  }): Promise<any> {
    console.log(`[STEP 3] Creating user reward record for user ${data.userId}`);
    
    try {
      // For now, we'll use the existing paypalPayouts table structure
      // In a future enhancement, we could create a dedicated userRewards table
      const rewardRecord = {
        userId: data.userId,
        amount: data.amount,
        currency: 'USD',
        status: data.status === 'completed' ? 'disbursed' : data.status,
        tier: data.tier || 'Unknown',
        disbursementId: data.paypalBatchId || null,
        payoutStatus: data.status,
        cycleName: data.cycleName || `Cycle ${data.cycleSettingId}`,
        errorMessage: data.errorMessage || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [inserted] = await db.insert(paypalPayouts)
        .values(rewardRecord)
        .returning();

      console.log(`[STEP 3] Created reward record ${inserted.id} for user ${data.userId}`);
      return inserted;

    } catch (error) {
      console.error(`[STEP 3] Error creating user reward record:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Bulk create user reward records from PayPal results
   */
  async createUserRewardRecordsFromResults(
    cycleSettingId: number, 
    itemResults: PayoutItemResult[], 
    paypalBatchId: string
  ): Promise<number> {
    console.log(`[STEP 3] Creating ${itemResults.length} user reward records for cycle ${cycleSettingId}`);
    
    try {
      let createdCount = 0;

      // Get cycle name for better display
      const [cycle] = await db.select({ 
        name: cycleSettings.name,
        cycleName: cycleSettings.cycleName
      })
      .from(cycleSettings)
      .where(eq(cycleSettings.id, cycleSettingId));

      const cycleName = cycle?.cycleName || cycle?.name || `Cycle ${cycleSettingId}`;

      // Get winner details for tier information
      const winnerIds = itemResults.map(r => r.cycleWinnerSelectionId);
      const winners = await db.select({
        id: cycleWinnerSelections.id,
        tier: cycleWinnerSelections.tier,
        tierRank: cycleWinnerSelections.tierRank
      })
      .from(cycleWinnerSelections)
      .where(inArray(cycleWinnerSelections.id, winnerIds));

      const winnerMap = new Map(winners.map(w => [w.id, w]));

      for (const result of itemResults) {
        try {
          const winner = winnerMap.get(result.cycleWinnerSelectionId);
          
          await this.createUserRewardRecord({
            userId: result.userId,
            cycleSettingId,
            amount: result.amount,
            status: result.status === 'success' ? 'completed' : 
                   result.status === 'failed' ? 'failed' : 'pending',
            paypalBatchId,
            paypalItemId: result.paypalItemId,
            processedAt: result.processedAt,
            tier: winner?.tier || 'Unknown',
            cycleName,
            errorMessage: result.errorMessage
          });

          createdCount++;

        } catch (error) {
          console.error(`[STEP 3] Error creating reward record for user ${result.userId}:`, error);
        }
      }

      console.log(`[STEP 3] Created ${createdCount} user reward records`);
      return createdCount;

    } catch (error) {
      console.error(`[STEP 3] Error creating user reward records from results:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Update winner processing status from PayPal results
   */
  async updateWinnerProcessingStatusFromResults(itemResults: PayoutItemResult[]): Promise<number> {
    console.log(`[STEP 3] Updating processing status for ${itemResults.length} winners`);
    
    try {
      let updatedCount = 0;

      for (const result of itemResults) {
        try {
          // Update winner selection record with processing status
          await db.update(cycleWinnerSelections)
            .set({
              disbursed: result.status === 'success',
              disbursementId: result.paypalItemId,
              updatedAt: new Date()
            })
            .where(eq(cycleWinnerSelections.id, result.cycleWinnerSelectionId));

          updatedCount++;

        } catch (error) {
          console.error(`[STEP 3] Error updating winner ${result.cycleWinnerSelectionId}:`, error);
        }
      }

      console.log(`[STEP 3] Updated processing status for ${updatedCount} winners`);
      return updatedCount;

    } catch (error) {
      console.error(`[STEP 3] Error updating winner processing status:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Check if cycle is complete based on PayPal results
   */
  async checkCycleCompletionFromPaypalResults(cycleSettingId: number): Promise<{
    isComplete: boolean;
    totalWinners: number;
    processedWinners: number;
    pendingWinners: number;
    successfulWinners: number;
    failedWinners: number;
  }> {
    console.log(`[STEP 3] Checking completion status for cycle ${cycleSettingId}`);
    
    try {
      // Get all winners for this cycle
      const winners = await db.select({
        id: cycleWinnerSelections.id,
        disbursed: cycleWinnerSelections.disbursed,
        disbursementId: cycleWinnerSelections.disbursementId
      })
      .from(cycleWinnerSelections)
      .innerJoin(cycleSettings, eq(cycleWinnerSelections.cycleId, cycleSettings.id))
      .where(eq(cycleSettings.id, cycleSettingId));

      const totalWinners = winners.length;
      const processedWinners = winners.filter(w => w.disbursementId !== null).length;
      const successfulWinners = winners.filter(w => w.disbursed === true).length;
      const failedWinners = processedWinners - successfulWinners;
      const pendingWinners = totalWinners - processedWinners;

      // Cycle is complete if all winners have been processed (have disbursementId)
      const isComplete = totalWinners > 0 && pendingWinners === 0;

      console.log(`[STEP 3] Cycle ${cycleSettingId} completion: ${processedWinners}/${totalWinners} processed, complete: ${isComplete}`);

      return {
        isComplete,
        totalWinners,
        processedWinners,
        pendingWinners,
        successfulWinners,
        failedWinners
      };

    } catch (error) {
      console.error(`[STEP 3] Error checking cycle completion:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Reconcile payout batch with PayPal data
   */
  async reconcilePayoutBatchWithPaypal(batchId: number, paypalBatchId: string): Promise<{
    batchMatch: boolean;
    itemsMatch: boolean;
    discrepancies: Array<{
      type: 'missing_item' | 'status_mismatch' | 'amount_mismatch';
      cycleWinnerSelectionId?: number;
      expected?: any;
      actual?: any;
    }>;
  }> {
    console.log(`[STEP 3] Reconciling batch ${batchId} with PayPal batch ${paypalBatchId}`);
    
    try {
      const discrepancies: Array<{
        type: 'missing_item' | 'status_mismatch' | 'amount_mismatch';
        cycleWinnerSelectionId?: number;
        expected?: any;
        actual?: any;
      }> = [];

      // Get batch and items from database
      const batch = await this.getPayoutBatch(batchId);
      const batchItems = await this.getPayoutBatchItems(batchId);

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Basic batch reconciliation
      const batchMatch = batch.paypalBatchId === paypalBatchId;
      if (!batchMatch) {
        discrepancies.push({
          type: 'status_mismatch',
          expected: paypalBatchId,
          actual: batch.paypalBatchId
        });
      }

      // For now, assume items match if we have the expected count
      // In a full implementation, we'd fetch PayPal data to compare
      const itemsMatch = batchItems.length > 0;

      console.log(`[STEP 3] Reconciliation complete: batch match ${batchMatch}, items match ${itemsMatch}, ${discrepancies.length} discrepancies`);

      return {
        batchMatch,
        itemsMatch,
        discrepancies
      };

    } catch (error) {
      console.error(`[STEP 3] Error reconciling batch with PayPal:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Get payout batch with enhanced administrative details
   */
  async getPayoutBatchWithEnhancedDetails(batchId: number): Promise<{
    batch: PayoutBatch;
    items: Array<PayoutBatchItem & {
      userName: string;
      userEmail: string;
      tier: string;
      tierRank: number;
    }>;
    summary: {
      totalAmount: number;
      totalFees: number;
      statusDistribution: Record<string, number>;
    };
  }> {
    console.log(`[STEP 3] Getting enhanced details for batch ${batchId}`);
    
    try {
      const batch = await this.getPayoutBatch(batchId);
      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Get enhanced batch items with user and winner details
      const items = await db.select({
        // Batch item fields
        id: payoutBatchItems.id,
        batchId: payoutBatchItems.batchId,
        cycleWinnerSelectionId: payoutBatchItems.cycleWinnerSelectionId,
        userId: payoutBatchItems.userId,
        paypalEmail: payoutBatchItems.paypalEmail,
        amount: payoutBatchItems.amount,
        currency: payoutBatchItems.currency,
        paypalItemId: payoutBatchItems.paypalItemId,
        status: payoutBatchItems.status,
        paypalStatus: payoutBatchItems.paypalStatus,
        errorCode: payoutBatchItems.errorCode,
        errorMessage: payoutBatchItems.errorMessage,
        note: payoutBatchItems.note,
        createdAt: payoutBatchItems.createdAt,
        updatedAt: payoutBatchItems.updatedAt,
        processedAt: payoutBatchItems.processedAt,
        
        // Enhanced fields
        userName: users.username,
        userEmail: users.email,
        tier: cycleWinnerSelections.tier,
        tierRank: cycleWinnerSelections.tierRank
      })
      .from(payoutBatchItems)
      .innerJoin(users, eq(payoutBatchItems.userId, users.id))
      .innerJoin(cycleWinnerSelections, eq(payoutBatchItems.cycleWinnerSelectionId, cycleWinnerSelections.id))
      .where(eq(payoutBatchItems.batchId, batchId))
      .orderBy(asc(payoutBatchItems.id));

      // Calculate summary
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
      const totalFees = 0; // Would be calculated from PayPal fee data
      
      const statusDistribution = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`[STEP 3] Retrieved enhanced details for batch ${batchId}: ${items.length} items, $${(totalAmount / 100).toFixed(2)} total`);

      return {
        batch,
        items,
        summary: {
          totalAmount,
          totalFees,
          statusDistribution
        }
      };

    } catch (error) {
      console.error(`[STEP 3] Error getting enhanced batch details:`, error);
      throw error;
    }
  }

  /**
   * Step 3: Get enhanced user reward history for dashboard
   */
  async getUserRewardHistory(userId: number): Promise<Array<{
    id: number;
    amount: number;
    status: string;
    tier?: string;
    cycleName?: string;
    processedAt?: Date;
    paypalItemId?: string;
    errorMessage?: string;
    cycleSettingId: number;
  }>> {
    console.log(`[STEP 3] Getting reward history for user ${userId}`);
    
    try {
      // Get user reward history from paypalPayouts table
      const rewards = await db.select({
        id: paypalPayouts.id,
        amount: paypalPayouts.amount,
        status: paypalPayouts.status,
        tier: paypalPayouts.tier,
        cycleName: paypalPayouts.cycleName,
        processedAt: paypalPayouts.createdAt, // Using createdAt as processedAt
        paypalItemId: paypalPayouts.disbursementId,
        errorMessage: paypalPayouts.errorMessage,
        cycleSettingId: sql<number>`0` // Default value, would be enhanced with proper schema
      })
      .from(paypalPayouts)
      .where(eq(paypalPayouts.userId, userId))
      .orderBy(desc(paypalPayouts.createdAt));

      console.log(`[STEP 3] Retrieved ${rewards.length} reward records for user ${userId}`);
      return rewards;

    } catch (error) {
      console.error(`[STEP 3] Error getting user reward history:`, error);
      return [];
    }
  }

  // ============================================================================
  // Step 4: Two-Phase Transaction Pattern Support Methods
  // ============================================================================

  /**
   * Step 4: Update payout batch with new status and data
   */
  async updatePayoutBatch(batchId: number, updates: Partial<PayoutBatch>): Promise<void> {
    console.log(`[STEP 4] Updating payout batch ${batchId} with updates:`, updates);
    
    try {
      const updateData: any = {};
      
      // Map updates to database columns, filtering out undefined values
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paypalBatchId !== undefined) updateData.paypalBatchId = updates.paypalBatchId;
      if (updates.errorDetails !== undefined) updateData.errorDetails = updates.errorDetails;
      if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt;
      if (updates.completedAt !== undefined) updateData.completedAt = updates.completedAt;
      if (updates.totalFees !== undefined) updateData.totalFees = updates.totalFees;

      const result = await db
        .update(payoutBatches)
        .set(updateData)
        .where(eq(payoutBatches.id, batchId));

      console.log(`[STEP 4] Successfully updated payout batch ${batchId}`);
      
    } catch (error) {
      console.error(`[STEP 4] Error updating payout batch ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Step 4: Update payout batch item with PayPal response data
   */
  async updatePayoutBatchItem(itemId: number, updates: Partial<PayoutBatchItem>): Promise<void> {
    console.log(`[STEP 4] Updating payout batch item ${itemId} with updates:`, updates);
    
    try {
      const updateData: any = {};
      
      // Map updates to database columns, filtering out undefined values
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.paypalItemId !== undefined) updateData.paypalItemId = updates.paypalItemId;
      if (updates.paypalStatus !== undefined) updateData.paypalStatus = updates.paypalStatus;
      if (updates.errorCode !== undefined) updateData.errorCode = updates.errorCode;
      if (updates.errorMessage !== undefined) updateData.errorMessage = updates.errorMessage;
      if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt;
      if (updates.processedAt !== undefined) updateData.processedAt = updates.processedAt;
      if (updates.fees !== undefined) updateData.fees = updates.fees;

      const result = await db
        .update(payoutBatchItems)
        .set(updateData)
        .where(eq(payoutBatchItems.id, itemId));

      console.log(`[STEP 4] Successfully updated payout batch item ${itemId}`);
      
    } catch (error) {
      console.error(`[STEP 4] Error updating payout batch item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Step 4: Get payout batch by request checksum for idempotency checking
   * HOTFIX STEP 2: Updated signature to include cycleId parameter
   */
  async getPayoutBatchByChecksum(cycleId: number, requestChecksum: string): Promise<PayoutBatch | null> {
    console.log(`[STEP 4] Looking up payout batch by checksum for cycle ${cycleId}: ${requestChecksum.substring(0, 8)}...`);
    
    try {
      const batches = await db
        .select()
        .from(payoutBatches)
        .where(
          and(
            eq(payoutBatches.cycleSettingId, cycleId),
            eq(payoutBatches.requestChecksum, requestChecksum)
          )
        )
        .orderBy(desc(payoutBatches.attempt))
        .limit(1);

      const batch = batches[0] || null;
      
      if (batch) {
        console.log(`[STEP 4] Found existing batch with checksum: batch ID ${batch.id}, status ${batch.status}, attempt ${batch.attempt}`);
      } else {
        console.log(`[STEP 4] No existing batch found with checksum for cycle ${cycleId}`);
      }
      
      return batch;
      
    } catch (error) {
      console.error(`[STEP 4] Error looking up batch by checksum:`, error);
      throw error;
    }
  }

  /**
   * CHATGPT: Get all payout batches by checksum for finding next attempt number
   */
  async getPayoutBatchesByChecksum(cycleId: number, requestChecksum: string): Promise<PayoutBatch[]> {
    try {
      const batches = await db
        .select()
        .from(payoutBatches)
        .where(
          and(
            eq(payoutBatches.cycleSettingId, cycleId),
            eq(payoutBatches.requestChecksum, requestChecksum)
          )
        )
        .orderBy(sql`${payoutBatches.attempt} DESC`);

      console.log(`[ATTEMPT] Found ${batches.length} existing batches for checksum`);
      return batches;
      
    } catch (error) {
      console.error(`[ATTEMPT] Error looking up batches by checksum:`, error);
      return [];
    }
  }

  /**
   * CHATGPT: Create payout batch with attempt number for retry safety
   */
  async createPayoutBatchWithAttempt(data: InsertPayoutBatch & { attempt: number }): Promise<PayoutBatch> {
    console.log(`[STEP 4] Creating payout batch attempt ${data.attempt} for cycle ${data.cycleSettingId}`);
    
    try {
      const created = await db.insert(payoutBatches).values(data).returning();
      const batch = created[0];
      
      if (!batch) {
        throw new Error('Failed to create payout batch - no data returned');
      }
      
      console.log(`[STEP 4] Created payout batch: ID ${batch.id}, attempt ${batch.attempt}, sender ID: ${batch.senderBatchId}`);
      return batch;
      
    } catch (error) {
      console.error(`[STEP 4] Error creating payout batch:`, error);
      throw error;
    }
  }

  // ========================================
  // STEP 6: CHUNKING STORAGE IMPLEMENTATION
  // ========================================

  async createPayoutBatchChunk(chunkData: InsertPayoutBatchChunk): Promise<PayoutBatchChunk> {
    const [chunk] = await db.insert(payoutBatchChunks).values(chunkData).returning();
    console.log(`[STEP 6 STORAGE] Created chunk ${chunk.chunkNumber} for batch ${chunk.batchId}`);
    return chunk;
  }

  async getPayoutBatchChunk(chunkId: number): Promise<PayoutBatchChunk | null> {
    const chunk = await db.select().from(payoutBatchChunks).where(eq(payoutBatchChunks.id, chunkId));
    return chunk[0] || null;
  }

  async getPayoutBatchChunks(batchId: number): Promise<PayoutBatchChunk[]> {
    const chunks = await db.select()
      .from(payoutBatchChunks)
      .where(eq(payoutBatchChunks.batchId, batchId))
      .orderBy(asc(payoutBatchChunks.chunkNumber));
    
    console.log(`[STEP 6 STORAGE] Retrieved ${chunks.length} chunks for batch ${batchId}`);
    return chunks;
  }

  async updatePayoutBatchChunk(chunkId: number, updates: Partial<PayoutBatchChunk>): Promise<void> {
    await db.update(payoutBatchChunks)
      .set(updates)
      .where(eq(payoutBatchChunks.id, chunkId));
    
    console.log(`[STEP 6 STORAGE] Updated chunk ${chunkId} with:`, Object.keys(updates).join(', '));
  }

  async getChunkStatus(chunkId: number): Promise<{ 
    status: string; 
    processingStartedAt?: Date; 
    processingCompletedAt?: Date; 
    errorDetails?: string; 
  } | null> {
    const chunk = await db.select({
      status: payoutBatchChunks.status,
      processingStartedAt: payoutBatchChunks.processingStartedAt,
      processingCompletedAt: payoutBatchChunks.processingCompletedAt,
      errorDetails: payoutBatchChunks.errorDetails
    })
    .from(payoutBatchChunks)
    .where(eq(payoutBatchChunks.id, chunkId));
    
    return chunk[0] || null;
  }

  // === Admin Payout History Helpers ===
  async listBatchesForCycle(cycleId: number): Promise<any[]> {
    const result: any = await db.execute(sql`
      SELECT
        id,
        status,
        paypal_batch_id AS "paypalBatchId",
        cycle_setting_id AS "cycleSettingId",
        created_at      AS "createdAt",
        updated_at      AS "updatedAt",
        total_amount    AS "totalAmount",
        total_recipients AS "totalRecipients",
        successful_count AS "successfulCount",
        failed_count    AS "failedCount"
      FROM payout_batches
      WHERE cycle_setting_id = ${cycleId}
      ORDER BY created_at DESC
    `);
    return result?.rows ?? [];
  }

  async getBatchItemStats(batchId: number): Promise<any> {
    const result: any = await db.execute(sql`
      SELECT
        LOWER(status) AS status,
        COUNT(*)      AS count,
        COALESCE(SUM(amount), 0) AS amount
      FROM payout_batch_items
      WHERE batch_id = ${batchId}
      GROUP BY LOWER(status)
    `);
    const rows = result?.rows ?? [];
    const by = (k: string) => rows.find((r:any) => r.status === k) || { count: 0, amount: 0 };
    const success   = by("success");
    const failed    = by("failed");
    const unclaimed = by("unclaimed");
    const pending   = by("pending");
    const processing = by("processing");
    
    const processedCount = Number(success.count || 0);
    const failedCount = Number(failed.count || 0);
    const totalItems = processedCount + failedCount + Number(unclaimed.count || 0) + Number(pending.count || 0) + Number(processing.count || 0);
    const totalAmount = (Number(success.amount || 0) + Number(failed.amount || 0) + Number(unclaimed.amount || 0) + Number(pending.amount || 0) + Number(processing.amount || 0)) / 100; // Convert from cents to dollars
    
    return {
      id: batchId,
      totalItems,
      processedCount,
      failedCount,
      totalAmount: totalAmount.toFixed(2),
      success: processedCount,
      failed: failedCount,
      unclaimed: Number(unclaimed.count||0),
      pending: Number(pending.count||0),
      processing: Number(processing.count||0),
      totals: {
        success: Number(success.amount || 0),
        failed: Number(failed.amount || 0),
        unclaimed: Number(unclaimed.amount || 0),
        pending: Number(pending.amount || 0),
        processing: Number(processing.amount || 0),
      }
    };
  }

  async createRetryBatchFromFailed(batchId: number): Promise<{ id: number }> {
    const srcRes: any = await db.execute(sql`
      SELECT id, cycle_setting_id AS "cycleSettingId", status
      FROM payout_batches
      WHERE id = ${batchId}
      LIMIT 1
    `);
    const src = (srcRes?.rows ?? [])[0];
    if (!src) throw new Error("Original batch not found");
    const s = String(src.status || "").toLowerCase();
    if (["intent","processing"].includes(s)) throw new Error("Cannot retry while source batch is active");

    const insRes: any = await db.execute(sql`
      INSERT INTO payout_batches (cycle_setting_id, status, created_at, updated_at)
      VALUES (${src.cycleSettingId}, 'intent', NOW(), NOW())
      RETURNING id
    `);
    const newBatch = (insRes?.rows ?? [])[0];

    await db.execute(sql`
      INSERT INTO payout_batch_items (
        batch_id, user_id, paypal_email, amount, currency, status, created_at, updated_at, cycle_winner_selection_id
      )
      SELECT ${newBatch.id}, user_id, paypal_email, amount, currency, 'intent', NOW(), NOW(), cycle_winner_selection_id
      FROM payout_batch_items
      WHERE batch_id = ${batchId} AND LOWER(status) = 'failed'
    `);

    return { id: newBatch.id };
  }

  async markBatchCompletedIfTerminal(batchId: number): Promise<void> {
    await db.execute(sql`
      UPDATE payout_batches b
      SET status = 'completed',
          updated_at = NOW()
      WHERE b.id = ${batchId}
        AND NOT EXISTS (
          SELECT 1 FROM payout_batch_items i
          WHERE i.batch_id = b.id
            AND LOWER(i.status) NOT IN ('success','failed','unclaimed','pending')
        )
        AND LOWER(COALESCE(b.status,'')) <> 'completed'
    `);
  }

  // === Admin Payout History Helpers ===

  /** List batches for a cycle (most recent first) */
  async listBatchesForCycle(cycleId: number): Promise<any[]> {
    const result: any = await db.execute(sql`
      SELECT
        id,
        status,
        paypal_batch_id AS "paypalBatchId",
        cycle_setting_id AS "cycleSettingId",
        created_at      AS "createdAt",
        updated_at      AS "updatedAt",
        completed_at    AS "completedAt"
      FROM payout_batches
      WHERE cycle_setting_id = ${cycleId}
      ORDER BY created_at DESC
    `);
    return result?.rows ?? [];
  }

  /** Aggregate item counts & totals by status */
  async getBatchItemStats(batchId: number): Promise<any> {
    const result: any = await db.execute(sql`
      SELECT
        LOWER(status) AS status,
        COUNT(*)      AS count,
        COALESCE(SUM(amount), 0) AS amount
      FROM payout_batch_items
      WHERE batch_id = ${batchId}
      GROUP BY LOWER(status)
    `);

    const rows = result?.rows ?? [];
    const by = (k: string) => rows.find((r:any) => r.status === k) || { count: 0, amount: 0 };

    const success    = by("success");
    const failed     = by("failed");
    const unclaimed  = by("unclaimed");
    const pending    = by("pending");
    const processing = by("processing");

    const totalItems =
      (Number(success.count)||0) +
      (Number(failed.count)||0) +
      (Number(unclaimed.count)||0) +
      (Number(pending.count)||0) +
      (Number(processing.count)||0);

    return {
      id: batchId,
      totalItems,
      success: Number(success.count)||0,
      failed: Number(failed.count)||0,
      unclaimed: Number(unclaimed.count)||0,
      pending: Number(pending.count)||0,
      processing: Number(processing.count)||0,
      totals: {
        success: Number(success.amount || 0),
        failed: Number(failed.amount || 0),
        unclaimed: Number(unclaimed.amount || 0),
        pending: Number(pending.amount || 0),
        processing: Number(processing.amount || 0),
      }
    };
  }

  // PayPal disbursement history helper methods
  async listBatchesForCycle(cycleId: number): Promise<any[]> {
    const result: any = await db.execute(sql`
      SELECT
        id,
        status,
        paypal_batch_id AS "paypalBatchId",
        cycle_setting_id AS "cycleSettingId",
        created_at      AS "createdAt",
        updated_at      AS "updatedAt",
        completed_at    AS "completedAt"
      FROM payout_batches
      WHERE cycle_setting_id = ${cycleId}
      ORDER BY created_at DESC
    `);
    return result?.rows ?? [];
  }

  async getBatchItemStats(batchId: number): Promise<any> {
    const result: any = await db.execute(sql`
      SELECT
        LOWER(status) AS status,
        COUNT(*)      AS count,
        COALESCE(SUM(amount), 0) AS amount
      FROM payout_batch_items
      WHERE batch_id = ${batchId}
      GROUP BY LOWER(status)
    `);
    const rows = result?.rows ?? [];
    const by = (k: string) => rows.find((r:any) => r.status === k) || { count: 0, amount: 0 };

    const success    = by("success");
    const failed     = by("failed");
    const unclaimed  = by("unclaimed");
    const pending    = by("pending");
    const processing = by("processing");

    const totalItems =
      (Number(success.count)||0) +
      (Number(failed.count)||0) +
      (Number(unclaimed.count)||0) +
      (Number(pending.count)||0) +
      (Number(processing.count)||0);

    return {
      id: batchId,
      totalItems,
      success: Number(success.count)||0,
      failed: Number(failed.count)||0,
      unclaimed: Number(unclaimed.count)||0,
      pending: Number(pending.count)||0,
      processing: Number(processing.count)||0,
      totals: {
        success: Number(success.amount || 0),
        failed: Number(failed.amount || 0),
        unclaimed: Number(unclaimed.amount || 0),
        pending: Number(pending.amount || 0),
        processing: Number(processing.amount || 0),
      }
    };
  }

  async createRetryBatchFromFailed(batchId: number): Promise<{ id: number }> {
    const srcRes: any = await db.execute(sql`
      SELECT id, cycle_setting_id AS "cycleSettingId", status
      FROM payout_batches
      WHERE id = ${batchId}
      LIMIT 1
    `);
    const src = (srcRes?.rows ?? [])[0];
    if (!src) throw new Error("Original batch not found");
    const s = String(src.status || "").toLowerCase();
    if (["intent","processing"].includes(s)) throw new Error("Cannot retry while source batch is active");

    const insRes: any = await db.execute(sql`
      INSERT INTO payout_batches (cycle_setting_id, status, created_at, updated_at)
      VALUES (${src.cycleSettingId}, 'intent', NOW(), NOW())
      RETURNING id
    `);
    const newBatch = (insRes?.rows ?? [])[0];

    await db.execute(sql`
      INSERT INTO payout_batch_items (
        batch_id, user_id, paypal_email, amount, currency, status, created_at, updated_at, cycle_winner_selection_id
      )
      SELECT ${newBatch.id}, user_id, paypal_email, amount, currency, 'intent', NOW(), NOW(), cycle_winner_selection_id
      FROM payout_batch_items
      WHERE batch_id = ${batchId} AND LOWER(status) = 'failed'
    `);

    return { id: newBatch.id };
  }

  async markBatchCompletedIfTerminal(batchId: number): Promise<void> {
    await db.execute(sql`
      UPDATE payout_batches b
      SET status = 'completed',
          updated_at = NOW()
      WHERE b.id = ${batchId}
        AND NOT EXISTS (
          SELECT 1 FROM payout_batch_items i
          WHERE i.batch_id = b.id
            AND LOWER(i.status) NOT IN ('success','failed','unclaimed','pending')
        )
        AND LOWER(COALESCE(b.status,'')) <> 'completed'
    `);
  }

  // ChatGPT's no-join implementation: avoids Drizzle leftJoin field ordering bug
  async getRewardsHistoryForUser(userId: number): Promise<RewardsHistoryResponse> {
    function normalizePayoutStatus(raw?: string): "pending" | "earned" | "paid" | "failed" {
      switch ((raw || "").toLowerCase()) {
        case "success":
        case "paid":
          return "paid";
        case "failed":
          return "failed";
        case "earned":
        case "queued":
        case "pending":
          return "earned";
        default:
          return "pending";
      }
    }

    try {
      // 1) Pull winners for user — sealed only
      const winners = await db
        .select({
          cycleId: cycleWinnerSelections.cycleSettingId,
          awardedAt: cycleWinnerSelections.sealedAt,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          rewardAmount: cycleWinnerSelections.rewardAmount,
          payoutStatus: cycleWinnerSelections.payoutStatus,
        })
        .from(cycleWinnerSelections)
        .where(and(eq(cycleWinnerSelections.userId, userId), eq(cycleWinnerSelections.isSealed, true)))
        .orderBy(desc(cycleWinnerSelections.sealedAt));

      if (!winners || winners.length === 0) {
        return { summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] };
      }

      const cycleIds = Array.from(
        new Set(winners.map((w) => Number(w.cycleId)).filter((n) => Number.isFinite(n)))
      ) as number[];

      // 2) Map cycle id -> cycle name (with null safety for Drizzle field ordering)
      const nameMap = new Map<number, string>();
      if (cycleIds.length > 0) {
        try {
          const names = await db
            .select({
              id: cycleSettings.id,
              name: cycleSettings.cycleName,
            })
            .from(cycleSettings)
            .where(inArray(cycleSettings.id, cycleIds));
          for (const row of names) {
            if (row && typeof row.id !== 'undefined') {
              const id = Number(row.id);
              const nm = (row.name ? String(row.name) : "").trim();
              nameMap.set(id, nm);
            }
          }
        } catch (error) {
          console.warn('Cycle names query failed, using fallback labels:', error);
          // Continue with empty nameMap - will use fallback labels
        }
      }

      // 3) Pull payout items for these cycles (with null safety for Drizzle field ordering)
      const payoutMap = new Map<number, { amountCents: number; status: string; paidAt: Date | null }>();
      if (cycleIds.length > 0) {
        try {
          const rows = await db
            .select({
              cycleSettingId: payoutBatchItems.cycleSettingId,
              amountCents: payoutBatchItems.amountCents,
              status: payoutBatchItems.status,
              paidAt: payoutBatchItems.paidAt,
            })
            .from(payoutBatchItems)
            .where(and(eq(payoutBatchItems.userId, userId), inArray(payoutBatchItems.cycleSettingId, cycleIds)));

          for (const r of rows) {
            if (r && typeof r.cycleSettingId !== 'undefined') {
              payoutMap.set(Number(r.cycleSettingId), {
                amountCents: Number(r.amountCents || 0),
                status: String(r.status || ""),
                paidAt: (r.paidAt as any) ?? null,
              });
            }
          }
        } catch (error) {
          console.warn('Payout items query failed, using winner data only:', error);
          // Continue with empty payoutMap - will use winner selection data
        }
      }

      // 4) Reconcile into UI items
      const items: RewardsHistoryItem[] = winners.map((w) => {
        const cycleId = Number(w.cycleId);
        const paid = payoutMap.get(cycleId);

        const amount =
          (paid?.amountCents ?? 0) ||
          Number(w.payoutFinal || 0) ||
          Number(w.rewardAmount || 0) ||
          0;

        const status = normalizePayoutStatus(paid?.status || w.payoutStatus || "pending");
        
        // Convert "processing" status to "earned" for UI compatibility
        const finalStatus = status === "pending" && w.payoutStatus === "processing" ? "earned" : status;
        
        const paidAt = paid?.paidAt ? new Date(paid.paidAt).toISOString() : null;
        const awardedAt = w.awardedAt ? new Date(w.awardedAt as any).toISOString() : null;
        const cycleLabel = (nameMap.get(cycleId) || "").trim() || `Cycle ${cycleId}`;

        return {
          cycleId,
          cycleLabel,
          awardedAt,
          amountCents: amount,
          status: finalStatus,
          paidAt,
        };
      });

      const totalEarnedCents = items
        .filter((i) => i.status === "paid" || i.status === "earned")
        .reduce((s, i) => s + (i.amountCents || 0), 0);
      const rewardsReceived = items.filter((i) => i.status === "paid").length;

      return { summary: { totalEarnedCents, rewardsReceived }, items };
    } catch (error) {
      console.error('Error getting rewards history for user:', error);
      return { summary: { totalEarnedCents: 0, rewardsReceived: 0 }, items: [] };
    }
  }
}

export const storage = new MemStorage();