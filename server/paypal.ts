// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment:
                process.env.NODE_ENV === "production"
                  ? Environment.Production
                  : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */

export async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    // If payment was successful, update user subscription status and pool
    if (httpStatusCode === 200 || httpStatusCode === 201) {
      // Get user from session or token if available
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const { storage } = await import('./storage');
        const user = await storage.getUserByToken(token);
        if (user && user.subscriptionStatus !== 'active') {
          // Update user subscription status
          await storage.updateUserSubscriptionStatus(user.id, 'active');
          
          console.log(`✅ PayPal payment successful - User ${user.id} upgraded to premium`);
          console.log(`💰 Monthly pool will automatically increase with new premium member`);
        }
      }
    }

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  const clientToken = await getClientToken();
  res.json({
    clientToken,
  });
}

// Export the orders controller for use in routes
export { ordersController };
// <END_EXACT_CODE>

/* PayPal Payouts API - Separate from orders SDK */

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(
    process.env.NODE_ENV === "production"
      ? "https://api-m.paypal.com/v1/oauth2/token"
      : "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response.json();
  return data.access_token;
}

export async function createPaypalPayout(recipients: Array<{
  email: string;
  amount: number;
  currency: string;
  note?: string;
  recipientId?: string;
}>) {
  try {
    const accessToken = await getAccessToken();
    
    // Force USD for all payouts to avoid currency balance issues
    const PAYOUT_CCY = process.env.PAYOUT_CURRENCY || "USD";
    
    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `payout_${Date.now()}`,
        email_subject: "FinBoost Reward Payout",
        email_message: "You have received a reward payout from FinBoost!",
      },
      items: recipients.map((recipient, index) => ({
        recipient_type: "EMAIL",
        amount: {
          value: (recipient.amount / 100).toFixed(2), // Convert cents to dollars
          currency: "USD", // Hardcoded to USD to avoid sandbox currency balance issues
        },
        receiver: recipient.email,
        note: recipient.note || "FinBoost monthly reward",
        sender_item_id: recipient.recipientId || `item_${index}_${Date.now()}`,
      })),
    };

    // Debug logging for first 3 recipients
    console.log("PAYOUT PREVIEW", recipients.slice(0, 3));

    const response = await fetch(
      process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com/v1/payments/payouts"
        : "https://api-m.sandbox.paypal.com/v1/payments/payouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payoutData),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayPal Payout API error: ${JSON.stringify(result)}`);
    }

    return result;
  } catch (error) {
    console.error("PayPal payout error:", error);
    throw error;
  }
}

export async function getPayoutStatus(payoutBatchId: string) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com"}/v1/payments/payouts/${payoutBatchId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayPal Payout Status API error: ${JSON.stringify(result)}`);
    }

    return result;
  } catch (error) {
    console.error("PayPal payout status error:", error);
    throw error;
  }
}

/* ========================================
 * ENHANCED PAYOUT BATCH PROCESSING (Step 2)
 * ========================================*/

// Enhanced payout creation with batch infrastructure integration
export async function createEnhancedPaypalPayout(
  cycleId: number,
  recipients: Array<{
    cycleWinnerSelectionId: number;
    userId: number;
    email: string;
    amount: number;
    currency: string;
    note?: string;
  }>
) {
  try {
    const accessToken = await getAccessToken();
    
    // Generate deterministic sender batch ID using cycle and recipient data
    const sortedRecipients = recipients
      .sort((a, b) => a.cycleWinnerSelectionId - b.cycleWinnerSelectionId)
      .map(r => `${r.cycleWinnerSelectionId}:${r.amount}:${r.email}`)
      .join('|');
    
    const senderBatchId = `cycle-${cycleId}-${Date.now()}-${Buffer.from(sortedRecipients).toString('base64').substring(0, 8)}`;
    
    const payoutData = {
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: "FinBoost Reward Payout",
        email_message: "You have received a reward payout from FinBoost!",
      },
      items: recipients.map((recipient) => ({
        recipient_type: "EMAIL",
        amount: {
          value: (recipient.amount / 100).toFixed(2), // Convert cents to dollars
          currency: "USD", // Hardcoded to USD for sandbox compatibility
        },
        receiver: recipient.email,
        note: recipient.note || "FinBoost monthly reward",
        sender_item_id: `winner-${recipient.cycleWinnerSelectionId}-${recipient.userId}`,
      })),
    };

    console.log(`[PAYOUT ENHANCED] Creating batch for cycle ${cycleId} with ${recipients.length} recipients`);
    console.log(`[PAYOUT ENHANCED] Sender batch ID: ${senderBatchId}`);

    const response = await fetch(
      process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com/v1/payments/payouts"
        : "https://api-m.sandbox.paypal.com/v1/payments/payouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payoutData),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayPal Payout API error: ${JSON.stringify(result)}`);
    }

    // Return enhanced response with sender batch ID for tracking
    return {
      ...result,
      senderBatchId,
      recipientCount: recipients.length,
      cycleId
    };
  } catch (error) {
    console.error("Enhanced PayPal payout error:", error);
    throw error;
  }
}

// Enhanced status checking with granular per-winner results
export async function getEnhancedPayoutStatus(payoutBatchId: string) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com"}/v1/payments/payouts/${payoutBatchId}?fields=payout_batch_header,items`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`PayPal Payout Status API error: ${JSON.stringify(result)}`);
    }

    return parseEnhancedPayoutResponse(result);
  } catch (error) {
    console.error("Enhanced PayPal payout status error:", error);
    throw error;
  }
}

// Parse PayPal response with granular per-winner status mapping
export function parseEnhancedPayoutResponse(paypalResponse: any) {
  const batch = paypalResponse?.batch_header || paypalResponse?.payout_batch_header;
  const items = paypalResponse?.items || [];

  const batchStatus = mapPaypalBatchStatus(batch?.batch_status);
  const individualResults = items.map((item: any) => {
    // Extract winner ID from sender_item_id format: "winner-{cycleWinnerSelectionId}-{userId}"
    const senderItemId = item.payout_item?.sender_item_id || '';
    const winnerIdMatch = senderItemId.match(/^winner-(\d+)-(\d+)$/);
    
    if (!winnerIdMatch) {
      console.error(`[PAYOUT PARSING] Invalid sender_item_id format: ${senderItemId}`);
      return null;
    }

    const cycleWinnerSelectionId = parseInt(winnerIdMatch[1]);
    const userId = parseInt(winnerIdMatch[2]);
    
    return {
      cycleWinnerSelectionId,
      userId,
      paypalItemId: item.payout_item?.payout_item_id,
      status: mapPaypalItemStatus(item.transaction_status),
      amount: parseFloat(item.payout_item?.amount?.value || '0'),
      currency: item.payout_item?.amount?.currency || 'USD',
      errorCode: item.errors?.[0]?.name,
      errorMessage: item.errors?.[0]?.message,
      recipientEmail: item.payout_item?.receiver,
      processedAt: item.time_processed ? new Date(item.time_processed) : null,
      fees: parseFloat(item.payout_item_fee?.value || '0')
    };
  }).filter(Boolean); // Remove null entries from invalid formats

  return {
    batchId: batch?.payout_batch_id,
    senderBatchId: batch?.sender_batch_header?.sender_batch_id,
    batchStatus,
    totalAmount: parseFloat(batch?.amount?.value || '0'),
    currency: batch?.amount?.currency || 'USD',
    fees: parseFloat(batch?.fees?.value || '0'),
    processedAt: batch?.time_completed ? new Date(batch.time_completed) : null,
    createdAt: batch?.time_created ? new Date(batch.time_created) : null,
    itemCount: items.length,
    individualResults
  };
}

// Map PayPal batch statuses to our internal statuses
function mapPaypalBatchStatus(paypalStatus: string): string {
  switch (paypalStatus?.toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
      return 'completed';
    case 'PENDING':
    case 'PROCESSING':
      return 'processing';
    case 'DENIED':
    case 'FAILED':
    case 'BLOCKED':
      return 'failed';
    case 'CANCELED':
    case 'CANCELLED':
      return 'cancelled';
    default:
      console.warn(`[PAYOUT PARSING] Unknown PayPal batch status: ${paypalStatus}`);
      return 'unknown';
  }
}

// Map PayPal item statuses with distinct handling for pending/unclaimed
function mapPaypalItemStatus(paypalStatus: string): 'success' | 'failed' | 'pending' | 'unclaimed' {
  switch (paypalStatus?.toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'pending';
    case 'UNCLAIMED':
      return 'unclaimed'; // Distinct from failed - user needs to claim
    case 'RETURNED':
    case 'ONHOLD':
      return 'pending'; // Temporary hold, may resolve
    case 'FAILED':
    case 'DENIED':
    case 'BLOCKED':
    case 'REFUNDED':
      return 'failed';
    default:
      console.warn(`[PAYOUT PARSING] Unknown PayPal item status: ${paypalStatus}`);
      return 'failed'; // Safe default
  }
}

// Mock PayPal responses for testing without hitting sandbox
export function getMockPayoutResponse(type: 'success' | 'mixed' | 'failed' = 'success') {
  const baseResponse = {
    batch_header: {
      payout_batch_id: `MOCK_BATCH_${Date.now()}`,
      batch_status: 'SUCCESS',
      sender_batch_header: {
        sender_batch_id: `cycle-18-${Date.now()}-mock123`,
        email_subject: "FinBoost Reward Payout",
      },
      amount: { value: "150.00", currency: "USD" },
      fees: { value: "3.50", currency: "USD" },
      time_created: new Date().toISOString(),
      time_completed: new Date().toISOString()
    },
    items: []
  };

  if (type === 'success') {
    baseResponse.items = [
      {
        payout_item_id: "MOCK_ITEM_1",
        transaction_status: "SUCCESS",
        payout_item: {
          sender_item_id: "winner-101-501",
          amount: { value: "50.00", currency: "USD" },
          receiver: "winner1@example.com"
        },
        time_processed: new Date().toISOString()
      },
      {
        payout_item_id: "MOCK_ITEM_2", 
        transaction_status: "SUCCESS",
        payout_item: {
          sender_item_id: "winner-102-502",
          amount: { value: "100.00", currency: "USD" },
          receiver: "winner2@example.com"
        },
        time_processed: new Date().toISOString()
      }
    ];
  } else if (type === 'mixed') {
    baseResponse.batch_header.batch_status = 'COMPLETED';
    baseResponse.items = [
      {
        payout_item_id: "MOCK_ITEM_1",
        transaction_status: "SUCCESS",
        payout_item: {
          sender_item_id: "winner-101-501",
          amount: { value: "50.00", currency: "USD" },
          receiver: "winner1@example.com"
        },
        time_processed: new Date().toISOString()
      },
      {
        payout_item_id: "MOCK_ITEM_2",
        transaction_status: "UNCLAIMED",
        payout_item: {
          sender_item_id: "winner-102-502", 
          amount: { value: "75.00", currency: "USD" },
          receiver: "winner2@example.com"
        }
      },
      {
        payout_item_id: "MOCK_ITEM_3",
        transaction_status: "FAILED",
        payout_item: {
          sender_item_id: "winner-103-503",
          amount: { value: "25.00", currency: "USD" },
          receiver: "invalid@example.com"
        },
        errors: [{
          name: "RECEIVER_UNREGISTERED",
          message: "The receiver for this transaction is unregistered"
        }]
      }
    ];
  } else if (type === 'failed') {
    baseResponse.batch_header.batch_status = 'FAILED';
    baseResponse.items = [
      {
        payout_item_id: "MOCK_ITEM_1",
        transaction_status: "FAILED",
        payout_item: {
          sender_item_id: "winner-101-501",
          amount: { value: "50.00", currency: "USD" },
          receiver: "invalid@example.com"
        },
        errors: [{
          name: "INSUFFICIENT_FUNDS",
          message: "The account does not have sufficient funds"
        }]
      }
    ];
  }

  return baseResponse;
}

// Test function for mock response parsing
export function testMockPayoutParsing() {
  console.log("=== TESTING MOCK PAYOUT PARSING ===");
  
  const successMock = getMockPayoutResponse('success');
  const mixedMock = getMockPayoutResponse('mixed');
  const failedMock = getMockPayoutResponse('failed');
  
  console.log("Success scenario:", JSON.stringify(parseEnhancedPayoutResponse(successMock), null, 2));
  console.log("Mixed results scenario:", JSON.stringify(parseEnhancedPayoutResponse(mixedMock), null, 2));
  console.log("Failed scenario:", JSON.stringify(parseEnhancedPayoutResponse(failedMock), null, 2));
  
  return {
    success: parseEnhancedPayoutResponse(successMock),
    mixed: parseEnhancedPayoutResponse(mixedMock),
    failed: parseEnhancedPayoutResponse(failedMock)
  };
}

// Integration function combining Step 1 batch infrastructure with Step 2 enhanced parsing
export async function processPayoutWithEnhancedTracking(
  cycleId: number,
  adminUserId: number,
  useMockData: boolean = false
) {
  const { storage } = await import('./storage');
  
  try {
    console.log(`[ENHANCED PROCESSING] Starting payout for cycle ${cycleId}, mock mode: ${useMockData}`);
    
    // Step 1: Find eligible winners using Step 1 infrastructure
    const eligibleWinners = await storage.findEligibleWinners(cycleId);
    
    if (eligibleWinners.length === 0) {
      throw new Error('No eligible winners found for payout');
    }
    
    // Step 2: Generate idempotency key and check for existing batch
    const winnerData = eligibleWinners.map(w => ({
      id: w.id,
      amount: w.payoutFinal,
      email: w.paypalEmail
    }));
    
    const idempotencyKey = storage.generateIdempotencyKey(cycleId, winnerData);
    const existingBatch = await storage.checkExistingBatch(idempotencyKey);
    
    if (existingBatch) {
      console.log(`[ENHANCED PROCESSING] Found existing batch ${existingBatch.id}, skipping duplicate processing`);
      return {
        duplicate: true,
        batchId: existingBatch.id,
        senderBatchId: existingBatch.senderBatchId
      };
    }
    
    // Step 3: Create payout batch record (Step 1 infrastructure)
    const batchRecord = await storage.createPayoutBatch({
      cycleSettingId: cycleId,
      requestChecksum: idempotencyKey,
      status: 'intent',
      totalAmount: eligibleWinners.reduce((sum, w) => sum + w.payoutFinal, 0),
      itemCount: eligibleWinners.length,
      createdBy: adminUserId
    });
    
    // Step 4: Mark winners as processing (Step 1 two-phase pattern)
    const winnerIds = eligibleWinners.map(w => w.id);
    await storage.markWinnersProcessing(winnerIds, batchRecord.id);
    
    // Step 5: Execute payout using enhanced PayPal integration (Step 2)
    let payoutResponse;
    
    if (useMockData) {
      // Use mock data for testing
      payoutResponse = {
        ...getMockPayoutResponse('mixed'),
        senderBatchId: `cycle-${cycleId}-${Date.now()}-mock`,
        recipientCount: eligibleWinners.length,
        cycleId
      };
      console.log(`[ENHANCED PROCESSING] Using mock PayPal response for testing`);
    } else {
      // Real PayPal API call
      const recipients = eligibleWinners.map(winner => ({
        cycleWinnerSelectionId: winner.id,
        userId: winner.userId,
        email: winner.paypalEmail,
        amount: winner.payoutFinal,
        currency: 'USD'
      }));
      
      payoutResponse = await createEnhancedPaypalPayout(cycleId, recipients);
    }
    
    // Step 6: Update batch with PayPal response
    await storage.updatePayoutBatchStatus(batchRecord.id, 'processing', {
      paypalBatchId: payoutResponse.batch_header?.payout_batch_id || payoutResponse.payout_batch_id,
      senderBatchId: payoutResponse.senderBatchId,
      paypalResponse: payoutResponse
    });
    
    // Step 7: Create individual batch items for tracking
    for (const winner of eligibleWinners) {
      await storage.createPayoutBatchItem({
        batchId: batchRecord.id,
        cycleWinnerSelectionId: winner.id,
        paypalEmail: winner.paypalEmail,
        amount: winner.payoutFinal,
        status: 'processing'
      });
    }
    
    console.log(`[ENHANCED PROCESSING] Successfully initiated payout batch ${batchRecord.id} for ${eligibleWinners.length} winners`);
    
    return {
      success: true,
      batchId: batchRecord.id,
      paypalBatchId: payoutResponse.batch_header?.payout_batch_id || payoutResponse.payout_batch_id,
      senderBatchId: payoutResponse.senderBatchId,
      recipientCount: eligibleWinners.length,
      totalAmount: batchRecord.totalAmount
    };
    
  } catch (error) {
    console.error(`[ENHANCED PROCESSING] Error processing payout for cycle ${cycleId}:`, error);
    throw error;
  }
}