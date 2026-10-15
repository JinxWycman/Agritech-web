import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { readLifecycleRequests } from "@/lib/request-store";
import { farmerProfileService } from "@/services/farmer-profile";
import { outbreakService } from "@/services/outbreaks";
import { selectAdapter } from "@/services/selection";
import type { AppNotification } from "@/types/account";

export const DEMO_NOTIFICATION_READ_KEY = "agritech_demo_notifications_read_v1";
export type NotificationsService = {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  getUnreadCount(): Promise<number>;
};

function readIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(DEMO_NOTIFICATION_READ_KEY);
  if (!raw) return new Set();
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) throw new Error("Saved notification read state is invalid.");
  return new Set(parsed);
}

function writeIds(ids: Set<string>): void {
  window.localStorage.setItem(DEMO_NOTIFICATION_READ_KEY, JSON.stringify([...ids]));
}

export function deriveNotifications(requests: ReturnType<typeof readLifecycleRequests>, alerts: AppNotification[], read: Set<string>): AppNotification[] {
  const requestItems: AppNotification[] = requests.filter((request) => request.farmerId === "demo-farmer-1").map((request) => {
    const statusText: Record<string, { en: string; sw: string }> = {
      pending: { en: "Request received", sw: "Ombi limepokelewa" }, offered: { en: "An expert has been offered your request", sw: "Mtaalamu amepewa ombi lako" },
      accepted: { en: "An expert accepted your request", sw: "Mtaalamu amekubali ombi lako" }, completed: { en: "Your expert request is complete", sw: "Ombi lako la mtaalamu limekamilika" },
      unassigned: { en: "Your request needs an expert", sw: "Ombi lako linahitaji mtaalamu" }, escalated: { en: "Your request was escalated", sw: "Ombi lako limepandishwa" }, cancelled: { en: "Your request was cancelled", sw: "Ombi lako limeghairiwa" },
    };
    const text = statusText[request.status];
    return { id: `request:${request.id}:${request.status}`, kind: "expert_request" as const, title: text, body: { en: `Request ${request.referenceCode}`, sw: `Ombi ${request.referenceCode}` }, createdAt: request.updatedAt, read: read.has(`request:${request.id}:${request.status}`) };
  });
  return [...requestItems, ...alerts.map((item) => ({ ...item, read: item.read || read.has(item.id) })),
    { id: "system:welcome", kind: "system" as const, title: { en: "Welcome to Agritech AI", sw: "Karibu Agritech AI" }, body: { en: "Your sample notifications are ready to review.", sw: "Arifa zako za mfano ziko tayari kukaguliwa." }, createdAt: Date.UTC(2026, 9, 14), read: read.has("system:welcome") },
    { id: "system:profile", kind: "system" as const, title: { en: "Keep your farm profile up to date", sw: "Sasisha wasifu wa shamba lako" }, body: { en: "A saved farm location helps show nearby services and alerts.", sw: "Mahali pa shamba palipohifadhiwa husaidia kuonyesha huduma na arifa za karibu." }, createdAt: Date.UTC(2026, 9, 13), read: read.has("system:profile") },
  ].sort((a, b) => b.createdAt - a.createdAt);
}

async function loadDemo(): Promise<AppNotification[]> {
  await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
  if (getDemoScenario() === "error") throw new Error("Demo notifications could not be loaded.");
  if (getDemoScenario() === "empty") return [];
  const profile = await farmerProfileService.getProfile();
  const alerts = profile?.latitude !== null && profile?.latitude !== undefined && profile.longitude !== null
    ? (await outbreakService.listAlertsNear({ latitude: profile.latitude, longitude: profile.longitude })).map((alert) => ({ id: `outbreak:${alert.id}`, kind: "outbreak_alert" as const, title: { en: alert.message.en, sw: alert.message.sw }, body: { en: `${alert.radiusKm} km radius alert`, sw: `Arifa ya radiusi ya km ${alert.radiusKm}` }, createdAt: Date.parse(alert.createdAt), read: false }))
    : [];
  return deriveNotifications(readLifecycleRequests(), alerts, readIds());
}

const mockAdapter: NotificationsService = {
  async list() { return loadDemo(); },
  async markRead(id) { const items = await loadDemo(); if (!items.some((item) => item.id === id)) return; const ids = readIds(); ids.add(id); writeIds(ids); },
  async markAllRead() { const items = await loadDemo(); const ids = readIds(); for (const item of items) ids.add(item.id); writeIds(ids); },
  async getUnreadCount() { return (await loadDemo()).filter((item) => !item.read).length; },
};

const apiAdapter: NotificationsService = {
  async list() { throw new Error("Notifications API adapter is not implemented until the GET /notifications response contract is confirmed."); },
  async markRead() { throw new Error("Notification read-state API adapter is not implemented until its contract is confirmed."); },
  async markAllRead() { throw new Error("Notification read-state API adapter is not implemented until its contract is confirmed."); },
  async getUnreadCount() { throw new Error("Notification unread-count API adapter is not implemented until its contract is confirmed."); },
};

export const notificationsService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
