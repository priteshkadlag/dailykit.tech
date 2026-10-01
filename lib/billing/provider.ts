import "server-only";
import type { BillingInterval } from "./plans";

/**
 * Contract a payment gateway (Razorpay, Stripe) implements. None is connected yet: to add one,
 * implement this interface, return it from `getPaymentProvider`, and have its webhook route call
 * `activateSubscription()` / `cancelSubscriptions()` from ./subscriptions — everything else already
 * reads the user's plan from the Subscription table.
 */
export interface PaymentProvider {
  id: "razorpay" | "stripe";
  /** Start a checkout and return the URL to send the user to. */
  createCheckout(input: { userId: string; email: string; interval: BillingInterval; returnUrl: string }): Promise<{ url: string }>;
  /** Verify the webhook signature and turn the payload into a subscription event (null = ignore). */
  parseWebhook(request: Request): Promise<
    | { type: "activated" | "renewed"; userId: string; interval: BillingInterval; providerRef: string; amountPaise: number; paymentRef: string }
    | { type: "cancelled"; userId: string; providerRef: string }
    | null
  >;
}

/** The configured gateway, or null while online payments aren't enabled. */
export function getPaymentProvider(): PaymentProvider | null {
  return null;
}
