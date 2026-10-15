import { getDataMode } from "@/lib/data-mode";
import { selectAdapter } from "@/services/selection";
import { notificationPreferencesSchema } from "@/lib/account-validation";
import type { NotificationPreferences } from "@/types/account";

export const DEMO_NOTIFICATION_PREFS_KEY = "agritech_demo_notification_prefs_v1";
export type NotificationPreferencesService = { get(): Promise<NotificationPreferences>; save(value: NotificationPreferences): Promise<NotificationPreferences> };
const defaults: NotificationPreferences = { expertUpdates: { inApp: true, sms: false }, outbreakAlerts: { inApp: true, sms: false }, marketPrices: { inApp: true, sms: false } };
const mockAdapter: NotificationPreferencesService = {
  async get() {
    const raw = window.localStorage.getItem(DEMO_NOTIFICATION_PREFS_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    const result = notificationPreferencesSchema.safeParse(parsed);
    if (!result.success) throw new Error("Saved notification preferences are invalid.");
    return result.data;
  },
  async save(value) {
    const parsed = notificationPreferencesSchema.parse(value);
    window.localStorage.setItem(DEMO_NOTIFICATION_PREFS_KEY, JSON.stringify(parsed));
    return parsed;
  },
};
const apiAdapter: NotificationPreferencesService = {
  async get() { throw new Error("Notification preferences API adapter is not implemented until its contract is confirmed."); },
  async save() { throw new Error("Notification preferences API adapter is not implemented until its contract is confirmed."); },
};
export const notificationPreferencesService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
