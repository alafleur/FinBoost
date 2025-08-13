/**
 * PHASE 2 STEP 5: Winner State Machine Implementation
 * 
 * Comprehensive state management for winner disbursement lifecycle.
 * Ensures atomic state transitions, validation, and audit trails.
 */

import { db } from './db.js';
import { cycleWinnerSelections } from '../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// ============================================================================
// STEP 5: Winner State Machine Types and Constants
// ============================================================================

export type WinnerState = 
  | 'draft'                    // Winner selected but not yet processed
  | 'sealed'                   // Winner data locked and ready for processing  
  | 'pending_disbursement'     // Queued for PayPal processing
  | 'processing_disbursement'  // Currently being processed by PayPal
  | 'disbursement_completed'   // Successfully paid out
  | 'disbursement_failed'      // Failed payout, eligible for retry
  | 'disbursement_cancelled'   // Cancelled by admin
  | 'failed_permanently';      // Too many failures, manual intervention needed

export interface StateTransition {
  fromState: WinnerState;
  toState: WinnerState;
  timestamp: Date;
  adminId?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface WinnerStateUpdate {
  winnerId: number;
  newState: WinnerState;
  adminId?: number;
  reason?: string;
  metadata?: Record<string, any>;
  paypalBatchId?: string;
  paypalItemId?: string;
  failureReason?: string;
  adminNotes?: string;
}

// ============================================================================
// STEP 5: State Transition Rules and Validation
// ============================================================================

const VALID_STATE_TRANSITIONS: Record<WinnerState, WinnerState[]> = {
  'draft': ['sealed', 'disbursement_cancelled'],
  'sealed': ['pending_disbursement', 'disbursement_cancelled'],
  'pending_disbursement': ['processing_disbursement', 'disbursement_cancelled'],
  'processing_disbursement': ['disbursement_completed', 'disbursement_failed', 'disbursement_cancelled'],
  'disbursement_completed': [], // Terminal state - no transitions allowed
  'disbursement_failed': ['pending_disbursement', 'failed_permanently', 'disbursement_cancelled'],
  'disbursement_cancelled': ['pending_disbursement'], // Can restart process
  'failed_permanently': ['pending_disbursement'] // Manual admin intervention to restart
};

const MAX_PROCESSING_ATTEMPTS = 3;
const RETRY_COOLDOWN_HOURS = 2;

// ============================================================================
// STEP 5: Winner State Machine Implementation
// ============================================================================

export class WinnerStateMachine {
  
  /**
   * STEP 5: Validate if state transition is allowed
   */
  static isValidTransition(fromState: WinnerState, toState: WinnerState): boolean {
    const allowedTransitions = VALID_STATE_TRANSITIONS[fromState];
    return allowedTransitions.includes(toState);
  }

  /**
   * STEP 5: Get current state of a winner
   */
  static async getCurrentState(winnerId: number): Promise<{
    state: WinnerState;
    processingAttempts: number;
    lastProcessingAttempt: Date | null;
    stateHistory: StateTransition[];
  } | null> {
    try {
      const [winner] = await db
        .select({
          payoutStatus: cycleWinnerSelections.payoutStatus,
          processingAttempts: cycleWinnerSelections.processingAttempts,
          lastProcessingAttempt: cycleWinnerSelections.lastProcessingAttempt,
          stateTransitions: cycleWinnerSelections.stateTransitions
        })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.id, winnerId))
        .limit(1);

      if (!winner) {
        return null;
      }

      let stateHistory: StateTransition[] = [];
      if (winner.stateTransitions) {
        try {
          stateHistory = JSON.parse(winner.stateTransitions);
        } catch (error) {
          console.warn(`[STATE MACHINE] Failed to parse state transitions for winner ${winnerId}:`, error);
        }
      }

      return {
        state: winner.payoutStatus as WinnerState,
        processingAttempts: winner.processingAttempts || 0,
        lastProcessingAttempt: winner.lastProcessingAttempt,
        stateHistory
      };
    } catch (error) {
      console.error(`[STATE MACHINE] Error getting current state for winner ${winnerId}:`, error);
      return null;
    }
  }

  /**
   * STEP 5: Atomic state transition with validation and audit trail
   */
  static async transitionState(update: WinnerStateUpdate): Promise<{
    success: boolean;
    previousState?: WinnerState;
    newState?: WinnerState;
    error?: string;
  }> {
    console.log(`[STATE MACHINE] Starting state transition for winner ${update.winnerId} to ${update.newState}`);

    try {
      return await db.transaction(async (tx) => {
        // Get current state within transaction
        const [currentWinner] = await tx
          .select({
            id: cycleWinnerSelections.id,
            payoutStatus: cycleWinnerSelections.payoutStatus,
            processingAttempts: cycleWinnerSelections.processingAttempts,
            lastProcessingAttempt: cycleWinnerSelections.lastProcessingAttempt,
            stateTransitions: cycleWinnerSelections.stateTransitions
          })
          .from(cycleWinnerSelections)
          .where(eq(cycleWinnerSelections.id, update.winnerId))
          .limit(1);

        if (!currentWinner) {
          return {
            success: false,
            error: `Winner ${update.winnerId} not found`
          };
        }

        const currentState = currentWinner.payoutStatus as WinnerState;

        // Validate transition
        if (!this.isValidTransition(currentState, update.newState)) {
          return {
            success: false,
            previousState: currentState,
            error: `Invalid state transition from ${currentState} to ${update.newState}`
          };
        }

        // Check processing attempt limits for retry scenarios
        if (update.newState === 'pending_disbursement' && currentState === 'disbursement_failed') {
          if ((currentWinner.processingAttempts || 0) >= MAX_PROCESSING_ATTEMPTS) {
            return {
              success: false,
              previousState: currentState,
              error: `Maximum processing attempts (${MAX_PROCESSING_ATTEMPTS}) exceeded`
            };
          }

          // Check retry cooldown
          if (currentWinner.lastProcessingAttempt) {
            const cooldownEnd = new Date(currentWinner.lastProcessingAttempt.getTime() + (RETRY_COOLDOWN_HOURS * 60 * 60 * 1000));
            if (new Date() < cooldownEnd) {
              return {
                success: false,
                previousState: currentState,
                error: `Retry cooldown active until ${cooldownEnd.toISOString()}`
              };
            }
          }
        }

        // Prepare state transition record
        const transition: StateTransition = {
          fromState: currentState,
          toState: update.newState,
          timestamp: new Date(),
          adminId: update.adminId,
          reason: update.reason,
          metadata: update.metadata
        };

        // Parse existing state history
        let stateHistory: StateTransition[] = [];
        if (currentWinner.stateTransitions) {
          try {
            stateHistory = JSON.parse(currentWinner.stateTransitions);
          } catch (error) {
            console.warn(`[STATE MACHINE] Failed to parse existing state transitions:`, error);
          }
        }

        // Add new transition to history
        stateHistory.push(transition);

        // Prepare update data
        const updateData: any = {
          payoutStatus: update.newState,
          lastModified: new Date(),
          stateTransitions: JSON.stringify(stateHistory)
        };

        // Update processing attempts based on state
        if (update.newState === 'processing_disbursement') {
          updateData.processingAttempts = (currentWinner.processingAttempts || 0) + 1;
          updateData.lastProcessingAttempt = new Date();
        }

        // Update PayPal tracking fields if provided
        if (update.paypalBatchId) {
          updateData.paypalBatchId = update.paypalBatchId;
        }
        if (update.paypalItemId) {
          updateData.paypalItemId = update.paypalItemId;
        }
        if (update.failureReason) {
          updateData.failureReason = update.failureReason;
        }
        if (update.adminNotes) {
          updateData.adminNotes = update.adminNotes;
        }

        // Auto-transition to failed_permanently if max attempts reached
        if (update.newState === 'disbursement_failed' && (updateData.processingAttempts || 0) >= MAX_PROCESSING_ATTEMPTS) {
          updateData.payoutStatus = 'failed_permanently';
          
          // Add additional transition record
          const permanentFailTransition: StateTransition = {
            fromState: 'disbursement_failed',
            toState: 'failed_permanently',
            timestamp: new Date(),
            reason: 'Max processing attempts exceeded',
            metadata: { maxAttemptsReached: true, totalAttempts: updateData.processingAttempts }
          };
          stateHistory.push(permanentFailTransition);
          updateData.stateTransitions = JSON.stringify(stateHistory);
        }

        // Perform atomic update
        await tx
          .update(cycleWinnerSelections)
          .set(updateData)
          .where(eq(cycleWinnerSelections.id, update.winnerId));

        console.log(`[STATE MACHINE] Successfully transitioned winner ${update.winnerId} from ${currentState} to ${updateData.payoutStatus}`);

        return {
          success: true,
          previousState: currentState,
          newState: updateData.payoutStatus as WinnerState
        };
      });

    } catch (error) {
      console.error(`[STATE MACHINE] Error during state transition:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * STEP 5: Bulk state transition for batch operations
   */
  static async batchTransitionState(updates: WinnerStateUpdate[]): Promise<{
    success: boolean;
    results: Array<{
      winnerId: number;
      success: boolean;
      previousState?: WinnerState;
      newState?: WinnerState;
      error?: string;
    }>;
    successCount: number;
    failureCount: number;
  }> {
    console.log(`[STATE MACHINE] Starting batch state transition for ${updates.length} winners`);

    const results: Array<{
      winnerId: number;
      success: boolean;
      previousState?: WinnerState;
      newState?: WinnerState;
      error?: string;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    // Process each update individually to ensure atomicity
    for (const update of updates) {
      const result = await this.transitionState(update);
      
      results.push({
        winnerId: update.winnerId,
        success: result.success,
        previousState: result.previousState,
        newState: result.newState,
        error: result.error
      });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(`[STATE MACHINE] Batch transition completed: ${successCount} successful, ${failureCount} failed`);

    return {
      success: failureCount === 0,
      results,
      successCount,
      failureCount
    };
  }

  /**
   * STEP 5: Get all winners in specific states for monitoring
   */
  static async getWinnersByState(cycleSettingId: number, states: WinnerState[]): Promise<Array<{
    id: number;
    userId: number;
    tier: string;
    payoutFinal: number;
    payoutStatus: WinnerState;
    processingAttempts: number;
    lastProcessingAttempt: Date | null;
    paypalBatchId: string | null;
    failureReason: string | null;
  }>> {
    try {
      const winners = await db
        .select({
          id: cycleWinnerSelections.id,
          userId: cycleWinnerSelections.userId,
          tier: cycleWinnerSelections.tier,
          payoutFinal: cycleWinnerSelections.payoutFinal,
          payoutStatus: cycleWinnerSelections.payoutStatus,
          processingAttempts: cycleWinnerSelections.processingAttempts,
          lastProcessingAttempt: cycleWinnerSelections.lastProcessingAttempt,
          paypalBatchId: cycleWinnerSelections.paypalBatchId,
          failureReason: cycleWinnerSelections.failureReason
        })
        .from(cycleWinnerSelections)
        .where(
          and(
            eq(cycleWinnerSelections.cycleSettingId, cycleSettingId),
            states.length > 0 ? 
              sql`${cycleWinnerSelections.payoutStatus} = ANY(${states})` :
              sql`1=1`
          )
        );

      return winners.map(winner => ({
        ...winner,
        payoutStatus: winner.payoutStatus as WinnerState
      }));
    } catch (error) {
      console.error(`[STATE MACHINE] Error getting winners by state:`, error);
      return [];
    }
  }

  /**
   * STEP 5: Reset winner state for admin intervention
   */
  static async resetWinnerState(winnerId: number, adminId: number, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const resetUpdate: WinnerStateUpdate = {
      winnerId,
      newState: 'pending_disbursement',
      adminId,
      reason: `Admin reset: ${reason}`,
      metadata: { isAdminReset: true }
    };

    // Clear processing attempts and failure data
    try {
      await db
        .update(cycleWinnerSelections)
        .set({
          processingAttempts: 0,
          lastProcessingAttempt: null,
          failureReason: null,
          paypalBatchId: null,
          paypalItemId: null
        })
        .where(eq(cycleWinnerSelections.id, winnerId));

      const result = await this.transitionState(resetUpdate);
      return { success: result.success, error: result.error };
    } catch (error) {
      console.error(`[STATE MACHINE] Error resetting winner state:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * STEP 5: Get state machine statistics for monitoring dashboard
   */
  static async getStateStatistics(cycleSettingId: number): Promise<Record<WinnerState, number>> {
    try {
      const results = await db
        .select({
          payoutStatus: cycleWinnerSelections.payoutStatus,
          count: sql<number>`COUNT(*)`
        })
        .from(cycleWinnerSelections)
        .where(eq(cycleWinnerSelections.cycleSettingId, cycleSettingId))
        .groupBy(cycleWinnerSelections.payoutStatus);

      const stats: Record<WinnerState, number> = {
        'draft': 0,
        'sealed': 0,
        'pending_disbursement': 0,
        'processing_disbursement': 0,
        'disbursement_completed': 0,
        'disbursement_failed': 0,
        'disbursement_cancelled': 0,
        'failed_permanently': 0
      };

      results.forEach(result => {
        const state = result.payoutStatus as WinnerState;
        stats[state] = Number(result.count) || 0;
      });

      return stats;
    } catch (error) {
      console.error(`[STATE MACHINE] Error getting state statistics:`, error);
      return {
        'draft': 0,
        'sealed': 0,
        'pending_disbursement': 0,
        'processing_disbursement': 0,
        'disbursement_completed': 0,
        'disbursement_failed': 0,
        'disbursement_cancelled': 0,
        'failed_permanently': 0
      };
    }
  }
}

export default WinnerStateMachine;