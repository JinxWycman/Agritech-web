import type { LocalizedText } from "@/types/business";
import type { Expert } from "@/types/domain";

/** Notification capability is in the spec; fields and delivery/read lifecycle are proposed. */
export type AppNotification = {
  id: string;
  kind: "expert_request" | "outbreak_alert" | "system";
  title: LocalizedText;
  body: LocalizedText;
  createdAt: number;
  read: boolean;
};

/** Quote capability is specified; pricing and response shape await backend confirmation. */
export type SubscriptionQuote = {
  pricingClass: string;
  amountKes: number;
  period: "monthly";
};

/** M-Pesa payment integration is specified; status lifecycle fields are proposed. */
export type PaymentStatus = "pending" | "prompt_sent" | "paid" | "failed" | "cancelled";
export type Payment = {
  id: string;
  amountKes: number;
  status: PaymentStatus;
  createdAt: number;
  phoneLast4: string;
};

/** User preference categories/channels are proposed pending backend contract confirmation. */
export type NotificationPreferences = {
  expertUpdates: { inApp: boolean; sms: boolean };
  outbreakAlerts: { inApp: boolean; sms: boolean };
  marketPrices: { inApp: boolean; sms: boolean };
};

export type ServiceAreas = { counties: string[]; subCounties: string[] };
/** Proposed expert coverage metadata; backend confirmation is pending. */
export type ExpertWithServiceAreas = Expert & { serviceAreas?: ServiceAreas };

/** Performance aggregate fields are proposed for the frontend demo. */
export type ExpertPerformance = {
  completedCount: number;
  medianResponseMinutes: number | null;
  acceptRate: number;
  feedbackCount: number;
  solvedRate: number | null;
};
