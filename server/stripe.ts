import Stripe from 'stripe';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Initialize Stripe (will use placeholder when keys aren't available)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
});

// Pricing configuration for different regions
export const PRICING_CONFIG = {
  USD: {
    monthly: 2000, // $20.00 in cents
    currency: 'usd',
    priceId: process.env.STRIPE_PRICE_ID_USD, // You'll need to create this in Stripe
  },
  CAD: {
    monthly: 2700, // $27.00 CAD in cents (approximate)
    currency: 'cad', 
    priceId: process.env.STRIPE_PRICE_ID_CAD, // You'll need to create this in Stripe
  }
};

export class StripeService {
  
  // Create or retrieve Stripe customer
  async createOrGetCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      metadata: {
        userId: user.id.toString(),
        platform: 'finboost'
      }
    });

    // Update user with Stripe customer ID
    await storage.updateUserStripeCustomerId(user.id, customer.id);
    
    return customer.id;
  }

  // Create subscription checkout session
  async createSubscriptionSession(userId: number, currency: 'USD' | 'CAD' = 'USD'): Promise<string> {
    const user = await storage.getUserById(userId);
    if (!user) throw new Error('User not found');

    const customerId = await this.createOrGetCustomer(user);
    const config = PRICING_CONFIG[currency];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: config.priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/subscribe?canceled=true`,
      metadata: {
        userId: userId.toString(),
        currency: currency
      }
    });

    return session.url!;
  }

  // Handle successful subscription
  async handleSubscriptionSuccess(subscriptionId: string, customerId: string): Promise<void> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer = await stripe.customers.retrieve(customerId);
    
    if (typeof customer === 'string') return;

    const userId = parseInt(customer.metadata?.userId || '0');
    if (!userId) return;

    await storage.updateUserSubscription(userId, {
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      nextBillingDate: new Date(subscription.current_period_end * 1000)
    });
  }

  // Cancel subscription
  async cancelSubscription(userId: number): Promise<void> {
    const user = await storage.getUserById(userId);
    if (!user?.stripeSubscriptionId) throw new Error('No active subscription');

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    await storage.updateUserSubscription(userId, {
      subscriptionStatus: 'canceled'
    });
  }

  // === STRIPE CONNECT FOR PAYOUTS ===

  // Create Stripe Connect account for user
  async createConnectAccount(userId: number): Promise<string> {
    const user = await storage.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (user.stripeConnectAccountId) {
      return user.stripeConnectAccountId;
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default to US, can be updated
      email: user.email,
      metadata: {
        userId: userId.toString(),
        platform: 'finboost'
      }
    });

    await storage.updateUserConnectAccount(userId, account.id);
    return account.id;
  }

  // Create Connect onboarding link
  async createConnectOnboardingLink(userId: number): Promise<string> {
    const accountId = await this.createConnectAccount(userId);

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard/payouts?refresh=true`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard/payouts?success=true`,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  // Check if Connect account is fully onboarded
  async checkConnectAccountStatus(accountId: string): Promise<boolean> {
    const account = await stripe.accounts.retrieve(accountId);
    return account.details_submitted && account.charges_enabled && account.payouts_enabled;
  }

  // Send payout to user
  async sendPayout(userId: number, amountInCents: number, reason: string, pointsUsed: number = 0): Promise<string> {
    const user = await storage.getUserById(userId);
    if (!user?.stripeConnectAccountId) {
      throw new Error('User must complete Connect onboarding first');
    }

    // Check if account is ready for payouts
    const isReady = await this.checkConnectAccountStatus(user.stripeConnectAccountId);
    if (!isReady) {
      throw new Error('Connect account not ready for payouts');
    }

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd', // Will add CAD support later
      destination: user.stripeConnectAccountId,
      metadata: {
        userId: userId.toString(),
        reason: reason,
        pointsUsed: pointsUsed.toString()
      }
    });

    // Record payout in database
    await storage.createPayout({
      userId,
      stripeTransferId: transfer.id,
      amount: amountInCents,
      currency: 'usd',
      status: 'pending',
      reason,
      pointsUsed,
      createdAt: new Date()
    });

    return transfer.id;
  }

  // Process webhook events
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await this.handleSubscriptionSuccess(
            invoice.subscription as string,
            invoice.customer as string
          );
        }
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdate(subscription);
        break;

      case 'transfer.paid':
        const transfer = event.data.object as Stripe.Transfer;
        await this.handleTransferPaid(transfer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (typeof customer === 'string') return;

    const userId = parseInt(customer.metadata?.userId || '0');
    if (!userId) return;

    await storage.updateUserSubscription(userId, {
      subscriptionStatus: subscription.status as any,
      nextBillingDate: new Date(subscription.current_period_end * 1000)
    });
  }

  private async handleTransferPaid(transfer: Stripe.Transfer): Promise<void> {
    const userId = parseInt(transfer.metadata?.userId || '0');
    if (!userId) return;

    await storage.updatePayoutStatus(transfer.id, 'paid');
  }
}

export const stripeService = new StripeService();