"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { LanguageSwitcher } from "@/components/language-switcher";
import { notificationPreferencesSchema, pinChangeSchema, serviceAreasSchema } from "@/lib/account-validation";
import { toE164Kenya } from "@/lib/phone";
import { notificationsService } from "@/services/notifications";
import { notificationPreferencesService } from "@/services/notification-preferences";
import { subscriptionService } from "@/services/subscription";
import { expertPerformanceService } from "@/services/expert-performance";
import { expertCoverageService, expertCounties } from "@/services/expert-coverage";
import { lifecycleExpertsService } from "@/services";
import { getDataMode } from "@/lib/data-mode";
import { formatDate, formatDateTime, formatKes } from "@/lib/format";

import type { NotificationPreferences } from "@/types/account";
import type { ServiceAreas } from "@/types/account";


const localeKey = (locale: string) => locale === "sw" ? "sw" : "en";
const defaultNotificationPreferences: NotificationPreferences = { expertUpdates: { inApp: true, sms: false }, outbreakAlerts: { inApp: true, sms: false }, marketPrices: { inApp: true, sms: false } };

export function NotificationsScreen() {
  const t = useTranslations("account");
  const locale = localeKey(useLocale());
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: notificationsService.list });
  const mark = useMutation({ mutationFn: notificationsService.markRead, onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  const markAll = useMutation({ mutationFn: notificationsService.markAllRead, onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} message={t("notificationsError")} />;
  const items = query.data ?? [];
  return <section className="space-y-4"><header><h1 className="text-2xl font-bold">{t("notificationsTitle")}</h1><p className="text-sm text-[var(--muted)]">{t("demoOnly")}</p></header>
    {items.length > 0 && <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending || items.every((item) => item.read)} className="min-h-11 rounded-xl border border-[var(--border)] px-4 font-semibold">{t("markAllRead")}</button>}
    {markAll.isError && <ErrorState onRetry={() => markAll.mutate()} message={t("actionError")} />}
    {!items.length ? <EmptyState title={t("notificationsEmptyTitle")} text={t("notificationsEmptyText")} /> : <ul className="space-y-3">{items.map((item) => <li key={item.id} className={`panel space-y-2 p-4 ${item.read ? "" : "border-l-4 border-l-forest-700"}`}><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold">{item.title[locale]}</h2><span className="text-sm font-semibold">{item.read ? t("read") : t("unread")}</span></div><p>{item.body[locale]}</p><p className="text-xs text-[var(--muted)]">{formatDateTime(item.createdAt, locale)}</p>{!item.read && <button type="button" onClick={() => mark.mutate(item.id)} disabled={mark.isPending} className="min-h-11 rounded-lg border border-[var(--border)] px-3 font-medium">{t("markRead")}</button>}</li>)}</ul>}
    {mark.isError && <ErrorState onRetry={() => { if (mark.variables) mark.mutate(mark.variables); }} message={t("actionError")} />}</section>;
}

export function SubscriptionScreen() {
  const t = useTranslations("account");
  const locale = localeKey(useLocale());
  const client = useQueryClient();
  const [phone, setPhone] = useState("0712345678");
  const query = useQuery({ queryKey: ["subscription"], queryFn: subscriptionService.getSnapshot, refetchInterval: (state) => { const status = state.state.data?.payments[0]?.status; return status === "pending" || status === "prompt_sent" ? 1000 : false; } });
  const start = useMutation({ mutationFn: () => subscriptionService.startPayment(phone), onSuccess: () => client.invalidateQueries({ queryKey: ["subscription"] }) });
  const cancel = useMutation({ mutationFn: subscriptionService.cancelPayment, onSuccess: () => client.invalidateQueries({ queryKey: ["subscription"] }) });
  const latest = query.data?.payments[0];
  function submit(event: FormEvent) { event.preventDefault(); if (!toE164Kenya(phone)) return; start.mutate(); }
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} message={t("subscriptionError")} />;
  if (!query.data) return <LoadingState />;
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">{t("subscriptionTitle")}</h1><p className="rounded-lg border border-amber-700 bg-amber-50 p-3 font-semibold text-amber-950">{t("paymentSimulation")}</p></header>
    <div className="grid gap-3 sm:grid-cols-2"><article className="panel p-4"><h2 className="font-semibold">{t("currentPlan")}</h2><p className="mt-2">{query.data.active ? query.data.currentPlan : t("noActivePlan")}</p><p>{query.data.active ? t("planActive") : t("planInactive")}</p></article><article className="panel p-4"><h2 className="font-semibold">{t("quoteTitle")}</h2><p className="mt-2">{query.data.quote.pricingClass}</p><p>{formatKes(query.data.quote.amountKes, locale)} / {t("month")}</p></article></div>
    <form onSubmit={submit} className="panel grid gap-3 p-4"><label className="block"><span className="mb-1 block font-medium">{t("mpesaPhone")}</span><input inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label><button disabled={start.isPending || !toE164Kenya(phone)} className="min-h-12 rounded-xl bg-forest-700 px-4 font-semibold text-white">{latest?.status === "failed" ? t("retryPayment") : t("payMpesa")}</button>{start.isError && <ErrorState onRetry={() => start.mutate()} message={t("paymentError")} />}</form>
    {latest && <div className="panel space-y-2 p-4"><h2 className="font-semibold">{t("paymentStatus")}</h2><p className="font-semibold">{t(`paymentStatusValues.${latest.status}`)}</p><p>{t("phoneEnding", { digits: latest.phoneLast4 })}</p>{latest.status === "prompt_sent" && <p>{t("promptInstructions")}</p>}{latest.status === "failed" && <p role="alert">{t("paymentFailed")}</p>}{["pending", "prompt_sent"].includes(latest.status) && <button type="button" onClick={() => cancel.mutate(latest.id)} disabled={cancel.isPending} className="min-h-11 rounded-lg border border-[var(--border)] px-3">{t("cancelPayment")}</button>}{cancel.isError && <ErrorState onRetry={() => cancel.mutate(latest.id)} message={t("paymentError")} />}</div>}
    <div className="space-y-2"><h2 className="text-xl font-bold">{t("paymentHistory")}</h2>{query.data.payments.length ? <ul className="space-y-2">{query.data.payments.map((payment) => <li key={payment.id} className="panel flex flex-wrap justify-between gap-2 p-3"><span>{formatKes(payment.amountKes, locale)} · {t(`paymentStatusValues.${payment.status}`)}</span><span className="text-sm">{formatDate(payment.createdAt, locale)} · {t("phoneEnding", { digits: payment.phoneLast4 })}</span></li>)}</ul> : <EmptyState title={t("noPayments")} text={t("noPaymentsText")} />}</div></section>;
}

export function SettingsScreen() {
  const t = useTranslations("account");
  const client = useQueryClient();
  const [prefsError, setPrefsError] = useState("");
  const [pinNotice, setPinNotice] = useState("");
  const [pin, setPin] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const query = useQuery({ queryKey: ["notification-preferences"], queryFn: notificationPreferencesService.get });
  const save = useMutation({ mutationFn: notificationPreferencesService.save, onSuccess: () => { setPrefsError(""); void client.invalidateQueries({ queryKey: ["notification-preferences"] }); }, onError: () => setPrefsError(t("settingsError")) });
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  if (!query.data) return <LoadingState />;
  const value: NotificationPreferences = prefs ?? query.data ?? defaultNotificationPreferences;
  function toggle(category: keyof NotificationPreferences, channel: "inApp" | "sms", checked: boolean) { const next: NotificationPreferences = { ...value, [category]: { ...value[category], [channel]: checked } }; setPrefs(next); }
  function submitPin(event: FormEvent) { event.preventDefault(); const result = pinChangeSchema.safeParse(pin); if (!result.success) { setPinNotice(t(result.error.issues[0]?.message === "pinMismatch" ? "pinMismatch" : "pinInvalid")); return; } setPin({ currentPin: "", newPin: "", confirmPin: "" }); setPinNotice(t("pinEndpointPending")); }
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">{t("settingsTitle")}</h1></header><div className="panel space-y-3 p-4"><h2 className="font-semibold">{t("languageTitle")}</h2><LanguageSwitcher /></div>
    <div className="panel space-y-3 p-4"><h2 className="font-semibold">{t("preferencesTitle")}</h2><p className="text-sm text-[var(--muted)]">{t("preferencesDemo")}</p>{query.isLoading && <LoadingState />}{query.isError && <ErrorState onRetry={() => void query.refetch()} message={t("settingsError")} />}<div className="overflow-x-auto"><table className="w-full min-w-[30rem] text-left text-sm"><caption className="sr-only">{t("preferencesTitle")}</caption><thead><tr><th className="p-2">{t("category")}</th><th className="p-2">{t("inApp")}</th><th className="p-2">{t("sms")}</th></tr></thead><tbody>{([["expertUpdates", "expertUpdates"], ["outbreakAlerts", "outbreakAlerts"], ["marketPrices", "marketPrices"]] as const).map(([key, label]) => <tr key={key} className="border-t border-[var(--border)]"><th scope="row" className="p-2">{t(label)}</th>{(["inApp", "sms"] as const).map((channel) => <td key={channel} className="p-2"><label className="inline-flex min-h-11 items-center gap-2"><span className="sr-only">{t(label)}: {t(channel)}</span><input type="checkbox" checked={value[key][channel]} onChange={(event) => toggle(key, channel, event.target.checked)} /></label></td>)}</tr>)}</tbody></table></div><button type="button" onClick={() => { const result = notificationPreferencesSchema.safeParse(value); if (result.success) save.mutate(result.data); else setPrefsError(t("settingsError")); }} disabled={save.isPending} className="min-h-11 rounded-xl bg-forest-700 px-4 font-semibold text-white">{t("savePreferences")}</button>{save.isSuccess && <p role="status">{t("preferencesSaved")}</p>}{prefsError && <ErrorState onRetry={() => save.mutate(value)} message={prefsError} />}</div>
    {getDataMode() === "mock" ? <p className="panel p-4">{t("pinUnavailableDemo")}</p> : <form className="panel space-y-3 p-4" onSubmit={submitPin}><h2 className="font-semibold">{t("changePin")}</h2><p className="text-sm text-[var(--muted)]">{t("pinRuleAssumed")}</p>{(["currentPin", "newPin", "confirmPin"] as const).map((field) => <label key={field} className="block"><span className="mb-1 block">{t(field)}</span><input type="password" inputMode="numeric" autoComplete="off" value={pin[field]} onChange={(event) => setPin({ ...pin, [field]: event.target.value })} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label>)}<button className="min-h-11 rounded-xl border border-[var(--border)] px-4 font-semibold">{t("validatePinChange")}</button>{pinNotice && <p role="status">{pinNotice}</p>}</form>}</section>;
}

export function ExpertPerformanceScreen() {
  const locale = useLocale();
  const t = useTranslations("expertTools");
  const expertId = lifecycleExpertsService.getActingExpertId();
  const query = useQuery({ queryKey: ["expert-performance", expertId], queryFn: async () => Promise.all([expertPerformanceService.get(expertId), expertPerformanceService.listRecentCompleted(expertId)]) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} message={t("performanceError")} />;
  if (!query.data) return <LoadingState />;
  const [metrics, cases] = query.data;
  const cards = [[t("completedCount"), String(metrics.completedCount)], [t("responseMedian"), metrics.medianResponseMinutes === null ? t("notAvailable") : t("minutes", { count: metrics.medianResponseMinutes.toFixed(1) })], [t("acceptRate"), `${Math.round(metrics.acceptRate * 100)}%`], [t("feedbackCount"), String(metrics.feedbackCount)], [t("solvedRate"), metrics.solvedRate === null ? t("notAvailable") : `${Math.round(metrics.solvedRate * 100)}%`]];
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">{t("performanceTitle")}</h1><p className="text-sm text-[var(--muted)]">{t("demoPerformance")}</p></header><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="panel p-4"><h2 className="text-sm text-[var(--muted)]">{label}</h2><p className="mt-2 text-2xl font-bold">{value}</p></article>)}</div><section className="space-y-2"><h2 className="text-xl font-bold">{t("recentCases")}</h2>{!cases.length ? <EmptyState title={t("noCompletedTitle")} text={t("noCompletedText")} /> : <div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full min-w-[32rem] text-left text-sm"><caption className="sr-only">{t("recentCases")}</caption><thead><tr><th className="p-3">{t("reference")}</th><th className="p-3">{t("completedAt")}</th><th className="p-3">{t("feedback")}</th></tr></thead><tbody>{cases.map((item) => <tr key={item.id} className="border-t border-[var(--border)]"><td className="p-3">{item.referenceCode}</td><td className="p-3">{formatDate(item.updatedAt, locale)}</td><td className="p-3">{item.solved === true ? t("solved") : item.solved === false ? t("notSolved") : t("notGiven")}</td></tr>)}</tbody></table></div>}</section></section>;
}

export function ExpertCoverageEditor() {
  const t = useTranslations("expertTools");
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["expert-coverage"], queryFn: expertCoverageService.get });
  const [areas, setAreas] = useState<ServiceAreas | null>(null);
  const [search, setSearch] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [error, setError] = useState("");
  const save = useMutation({ mutationFn: expertCoverageService.save, onSuccess: () => { setError(""); void client.invalidateQueries({ queryKey: ["expert-coverage"] }); }, onError: () => setError(t("coverageError")) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} message={t("coverageError")} />;
  if (!query.data) return <LoadingState />;
  const value: ServiceAreas = areas ?? query.data;
  const filtered = expertCounties.filter((county) => county.toLowerCase().includes(search.toLowerCase()));
  function toggle(county: string) { const next: ServiceAreas = { ...value, counties: value.counties.includes(county) ? value.counties.filter((item) => item !== county) : [...value.counties, county] }; setAreas(next); }
  function addSubCounty() { const item = subCounty.trim(); if (item && value.subCounties.length < 10 && !value.subCounties.includes(item)) { const next: ServiceAreas = { ...value, subCounties: [...value.subCounties, item] }; setAreas(next); } setSubCounty(""); }
  return <section className="panel space-y-3 p-4"><h2 className="text-lg font-bold">{t("coverageTitle")}</h2><p className="text-sm text-[var(--muted)]">{t("coverageNotAssigned")}</p><label className="block"><span className="mb-1 block font-medium">{t("searchCounty")}</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label><div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">{filtered.map((county) => <label key={county} className="flex min-h-10 items-center gap-2 rounded-lg px-2"><input type="checkbox" checked={value.counties.includes(county)} onChange={() => toggle(county)} />{county}</label>)}</div><div className="flex flex-wrap gap-2" aria-label={t("selectedCounties")}>{value.counties.map((county) => <button type="button" key={county} onClick={() => toggle(county)} className="min-h-9 rounded-full border border-[var(--border)] px-3 text-sm">{county} ×</button>)}</div><label className="block"><span className="mb-1 block font-medium">{t("subCountyTags")}</span><div className="flex gap-2"><input value={subCounty} maxLength={80} onChange={(event) => setSubCounty(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /><button type="button" disabled={!subCounty.trim() || value.subCounties.length >= 10} onClick={addSubCounty} className="min-h-11 rounded-lg border border-[var(--border)] px-3">{t("addTag")}</button></div></label><div className="flex flex-wrap gap-2">{value.subCounties.map((item) => <button type="button" key={item} onClick={() => { const next: ServiceAreas = { ...value, subCounties: value.subCounties.filter((tag) => tag !== item) }; setAreas(next); }} className="min-h-9 rounded-full border border-[var(--border)] px-3 text-sm">{item} ×</button>)}</div><button type="button" disabled={save.isPending} onClick={() => { const result = serviceAreasSchema.safeParse(value); if (result.success) save.mutate(result.data); else setError(t("coverageValidation")); }} className="min-h-11 rounded-xl bg-forest-700 px-4 font-semibold text-white">{t("saveCoverage")}</button>{save.isSuccess && <p role="status">{t("coverageSaved")}</p>}{error && <ErrorState onRetry={() => save.mutate(value)} message={error} />}</section>;
}
