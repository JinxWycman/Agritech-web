import { getDataMode, getDemoScenario, type DemoScenario } from "@/lib/data-mode";
import { demoNow } from "@/lib/request-store";
import { toE164Kenya } from "@/lib/phone";
import { selectAdapter } from "@/services/selection";
import type { Payment, SubscriptionQuote } from "@/types/account";

export const DEMO_SUBSCRIPTION_KEY = "agritech_demo_subscription_v1";
type Store = { payments: Payment[] };
export type SubscriptionService = {
  getQuote(): Promise<SubscriptionQuote>;
  getSnapshot(): Promise<{ quote: SubscriptionQuote; currentPlan: string; active: boolean; payments: Payment[] }>;
  startPayment(phone: string): Promise<Payment>;
  refreshPayment(id: string): Promise<Payment>;
  cancelPayment(id: string): Promise<Payment>;
};
export function advancePayment(payment: Payment, now: number, scenario: DemoScenario): Payment {
  if (payment.status !== "pending" && payment.status !== "prompt_sent") return payment;
  const elapsed = Math.max(0, now - payment.createdAt);
  if (elapsed < 5_000) return { ...payment, status: "prompt_sent" };
  return { ...payment, status: scenario === "error" ? "failed" : "paid" };
}

const quote: SubscriptionQuote = { pricingClass: "Smallholder demo plan", amountKes: 250, period: "monthly" };
function readStore(): Store {
  const raw = window.localStorage.getItem(DEMO_SUBSCRIPTION_KEY);
  if (!raw) return { payments: [] };
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as Store).payments)) throw new Error("Saved demo subscription data is invalid.");
  return parsed as Store;
}
function writeStore(value: Store): void { window.localStorage.setItem(DEMO_SUBSCRIPTION_KEY, JSON.stringify(value)); }
function advanceAll(store: Store): Store {
  const now = demoNow();
  const payments = store.payments.map((payment) => advancePayment(payment, now, getDemoScenario()));
  if (payments.some((payment, index) => payment.status !== store.payments[index].status)) writeStore({ payments });
  return { payments };
}
const mockAdapter: SubscriptionService = {
  async getQuote() { return quote; },
  async getSnapshot() {
    const store = advanceAll(readStore());
    const activePayment = [...store.payments].reverse().find((payment) => payment.status === "paid" && demoNow() - payment.createdAt < 30 * 24 * 60 * 60_000);
    return { quote, currentPlan: activePayment ? quote.pricingClass : "No active plan", active: Boolean(activePayment), payments: [...store.payments].reverse() };
  },
  async startPayment(phone) {
    const e164 = toE164Kenya(phone);
    if (!e164) throw new Error("Enter a valid Kenyan mobile number.");
    const store = readStore();
    const payment: Payment = { id: `demo-payment-${String(store.payments.length + 1).padStart(4, "0")}`, amountKes: quote.amountKes, status: "pending", createdAt: demoNow(), phoneLast4: e164.slice(-4) };
    writeStore({ payments: [...store.payments, payment] });
    return payment;
  },
  async refreshPayment(id) {
    const store = readStore();
    const payment = store.payments.find((item) => item.id === id);
    if (!payment) throw new Error("Payment was not found.");
    const updated = advancePayment(payment, demoNow(), getDemoScenario());
    writeStore({ payments: store.payments.map((item) => item.id === id ? updated : item) });
    return updated;
  },
  async cancelPayment(id) {
    const store = readStore();
    const payment = store.payments.find((item) => item.id === id);
    if (!payment || !["pending", "prompt_sent"].includes(payment.status)) throw new Error("Only a pending payment can be cancelled.");
    const updated = { ...payment, status: "cancelled" as const };
    writeStore({ payments: store.payments.map((item) => item.id === id ? updated : item) });
    return updated;
  },
};
const apiAdapter: SubscriptionService = {
  async getQuote() { throw new Error("Subscription quote API adapter is not implemented until the /me/subscription-quote response is confirmed."); },
  async getSnapshot() { throw new Error("Subscription status API adapter is not implemented until its contract is confirmed."); },
  async startPayment() { throw new Error("M-Pesa payment initiation API adapter is not implemented until its contract is confirmed."); },
  async refreshPayment() { throw new Error("Payment status API adapter is not implemented until its contract is confirmed."); },
  async cancelPayment() { throw new Error("Payment cancellation API adapter is not implemented until its contract is confirmed."); },
};
export const subscriptionService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
