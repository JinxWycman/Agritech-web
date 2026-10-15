"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { OutbreakMapLoader } from "@/components/outbreak-map-loader";
import { assessRisk, alertDraftFromCell, weekStart } from "@/lib/outbreaks";
import { outbreakService, outbreakThresholdSchema, outbreakAlertDraftSchema } from "@/services/outbreaks";
import { farmConditionsService, farmerProfileService } from "@/services";
import { pickLocalized } from "@/types/business";
import type { AlertDraft, OutbreakAlert, SignalCell, SignalFilters } from "@/types/outbreak";

const symptoms = ["yellow-leaves", "spots-on-leaves", "pest-damage", "poor-growth", "not-eating", "coughing", "lameness"];
const subjects = ["maize", "beans", "potatoes", "vegetables", "cattle", "goats", "poultry"];
const localeKey = (locale: string) => locale === "sw" ? "sw" : "en";

function OutbreakAlertList({ alerts }: { alerts: OutbreakAlert[] }) {
  const t = useTranslations("outbreak");
  const locale = localeKey(useLocale());
  if (!alerts.length) return <EmptyState title={t("noAlertsTitle")} text={t("noAlertsText")} />;
  return <ul className="space-y-3">{alerts.map((alert) => <li key={alert.id} className="panel space-y-2 p-4">
    <p className="font-semibold">{pickLocalized(alert.message, locale)}</p>
    <p className="text-sm">{t(`symptom.${alert.symptomCode}`)} · {t(`issue.${alert.issueType}`)}{alert.subjectKey ? ` · ${t(`subject.${alert.subjectKey}`)}` : ""}</p>
    <p className="text-sm">{t("alertRadius", { radius: alert.radiusKm })} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(alert.createdAt))}</p>
    <p className="text-sm">{t("alertRecipients", { count: alert.recipientCount })}</p>
  </li>)}</ul>;
}

export function FarmerRiskScreen() {
  const t = useTranslations("outbreak");
  const locale = localeKey(useLocale());
  const dataQuery = useQuery({
    queryKey: ["outbreak-farmer-risk"],
    queryFn: async () => {
      const profile = await farmerProfileService.getProfile();
      if (!profile || profile.latitude === null || profile.longitude === null) return { profile, pin: null, conditions: null, alerts: [] as OutbreakAlert[] };
      const pin = { latitude: profile.latitude, longitude: profile.longitude };
      const [conditions, alerts] = await Promise.all([
        farmConditionsService.getSnapshot(pin.latitude, pin.longitude),
        outbreakService.listAlertsNear(pin),
      ]);
      return { profile, pin, conditions, alerts };
    },
  });
  if (dataQuery.isLoading) return <LoadingState />;
  if (dataQuery.isError) return <ErrorState onRetry={() => { void dataQuery.refetch(); }} message={t("loadError")} />;
  const data = dataQuery.data;
  if (!data?.pin || !data.profile) return <section className="space-y-4"><h1 className="text-2xl font-bold">{t("farmerTitle")}</h1><EmptyState title={t("pinRequiredTitle")} text={t("pinRequiredText")} /><Link href="/app/profile" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("completeProfile")}</Link></section>;
  const crops = data.profile.crops.map((item) => item.toLowerCase());
  const livestock = data.profile.livestock.map((item) => item.toLowerCase());
  const assessments = [
    ...crops.map((subject) => assessRisk(data.conditions, subject)),
    ...livestock.map((subject) => assessRisk(data.conditions, subject)),
  ];
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold">{t("farmerTitle")}</h1><p className="mt-2 text-sm text-[var(--muted)]">{t("sampleDisclaimer")}</p></header>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("riskTitle")}</h2>
        {!assessments.length ? <EmptyState title={t("noSubjectsTitle")} text={t("noSubjectsText")} /> : <ul className="grid gap-3 sm:grid-cols-2">{assessments.map((assessment) => <li key={assessment.subjectKey} className="panel space-y-2 p-4">
          <h3 className="font-semibold">{t(`subject.${assessment.subjectKey}`)}</h3>
          <p className="font-semibold">{t(`riskLevel.${assessment.level}`)}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">{assessment.reasonKeys.map((key) => <li key={key}>{t(key)}</li>)}</ul>
          <h4 className="font-medium">{t("preventionTitle")}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">{assessment.preventionKeys.map((key) => <li key={key}>{t(key)}</li>)}</ul>
        </li>)}</ul>}
        <p className="text-xs text-[var(--muted)]">{locale === "sw" ? t("expertReview") : t("conditionsBasis")}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("nearbyTitle")}</h2>
        <p className="text-sm text-[var(--muted)]">{t("sampleDisclaimer")}</p>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <OutbreakMapLoader cells={[]} alerts={data.alerts} farmPin={data.pin} farmLabel={t("farmPin")} />
          <div className="space-y-2"><h3 className="font-semibold">{t("alertListTitle")}</h3><OutbreakAlertList alerts={data.alerts} /></div>
        </div>
      </section>
      <Link href="/app/requests/new" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("askExpert")}</Link>
    </div>
  );
}

function CellSummary({ cell, selected, onClick }: { cell: SignalCell; selected: boolean; onClick: () => void }) {
  const t = useTranslations("outbreak");
  const symptom = Object.entries(cell.bySymptom).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "unknown";
  return <li><button type="button" aria-pressed={selected} onClick={onClick} className={`w-full rounded-xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 ${cell.flagged ? "border-red-700" : "border-[var(--border)]"} ${selected ? "bg-[var(--surface-muted)]" : ""}`}>
    <span className="font-semibold">{cell.count} {t("reports")}{cell.flagged ? ` · ${t("flagged")}` : ""}</span>
    <span className="block text-sm">{t(`issue.${cell.issueType}`)} · {t(`symptom.${symptom}`)}{cell.subjectKey ? ` · ${t(`subject.${cell.subjectKey}`)}` : ""}</span>
    <span className="block text-xs text-[var(--muted)]">{cell.weekStart} · {cell.centerLat.toFixed(2)}, {cell.centerLng.toFixed(2)}</span>
  </button></li>;
}

export function AdminOutbreakScreen() {
  const t = useTranslations("outbreak");
  const locale = localeKey(useLocale());
  const client = useQueryClient();
  const [symptomCode, setSymptomCode] = useState("");
  const [issueType, setIssueType] = useState<"" | "crop" | "livestock">("");
  const [subjectKey, setSubjectKey] = useState("");
  const [weeks, setWeeks] = useState(8);
  const [selected, setSelected] = useState<SignalCell | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [message, setMessage] = useState({ en: "", sw: "" });
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [thresholdDraft, setThresholdDraft] = useState({ minimumCount: 3, cellSizeDeg: 0.5 });
  const [thresholdError, setThresholdError] = useState("");
  const filters = useMemo<SignalFilters>(() => ({
    ...(symptomCode ? { symptomCode } : {}),
    ...(issueType ? { issueType } : {}),
    ...(subjectKey ? { subjectKey } : {}),
    fromWeek: weekStart(new Date(Date.now() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000)),
    throughWeek: weekStart(new Date()),
  }), [symptomCode, issueType, subjectKey, weeks]);
  const signals = useQuery({ queryKey: ["outbreak-signals", filters], queryFn: () => outbreakService.getSignals(filters) });
  const alerts = useQuery({ queryKey: ["outbreak-alerts"], queryFn: outbreakService.listAlerts });
  const thresholds = useQuery({
    queryKey: ["outbreak-thresholds"],
    queryFn: outbreakService.getThresholds,
  });
  useEffect(() => {
    if (thresholds.data) setThresholdDraft(thresholds.data);
  }, [thresholds.data]);
  const saveThresholds = useMutation({
    mutationFn: () => outbreakService.updateThresholds(outbreakThresholdSchema.parse({
      minimumCount: Number(thresholdDraft.minimumCount),
      cellSizeDeg: Number(thresholdDraft.cellSizeDeg),
    })),
    onSuccess(value) {
      setThresholdDraft(value);
      setThresholdError("");
      void client.invalidateQueries({ queryKey: ["outbreak-signals"] });
    },
    onError() { setThresholdError(t("thresholdError")); },
  });
  const preview = useMutation({
    mutationFn: (draft: AlertDraft) => outbreakService.previewAlert(draft),
    onSuccess(count) { setRecipientCount(count); setConfirming(false); },
  });
  const send = useMutation({
    mutationFn: (draft: AlertDraft) => outbreakService.sendAlert(draft),
    onSuccess() {
      setSelected(null);
      setRecipientCount(null);
      setConfirming(false);
      setMessage({ en: "", sw: "" });
      void client.invalidateQueries({ queryKey: ["outbreak-alerts"] });
      void client.invalidateQueries({ queryKey: ["outbreak-signals"] });
    },
  });
  if (signals.isLoading || alerts.isLoading || thresholds.isLoading) return <LoadingState />;
  if (signals.isError || alerts.isError || thresholds.isError) return <ErrorState onRetry={() => { void signals.refetch(); void alerts.refetch(); void thresholds.refetch(); }} message={t("loadError")} />;
  const cells = signals.data ?? [];
  const alertList = alerts.data ?? [];
  const selectedCell = selected && cells.some((cell) => cell.cellId === selected.cellId) ? selected : null;
  const draft = selectedCell ? alertDraftFromCell(selectedCell, Number(radiusKm), message) : null;
  const availableSubjects = issueType === "crop" ? subjects.slice(0, 4) : issueType === "livestock" ? subjects.slice(4) : subjects;
  function previewAlert() {
    if (!draft) return;
    const parsed = outbreakAlertDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setRecipientCount(null);
      return;
    }
    preview.mutate(parsed.data);
  }
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold">{t("adminTitle")}</h1><p className="mt-2 text-sm text-[var(--muted)]">{t("sampleDisclaimer")}</p></header>
      <section className="panel space-y-3 p-4">
        <h2 className="text-lg font-bold">{t("thresholdTitle")}</h2>
        {thresholdError && <p role="alert" className="text-sm text-red-800">{thresholdError}</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="mb-1 block text-sm font-medium">{t("minimumCount")}</span><input type="number" min="1" max="1000" value={thresholdDraft.minimumCount} onChange={(event) => setThresholdDraft({ ...thresholdDraft, minimumCount: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
          <label className="block"><span className="mb-1 block text-sm font-medium">{t("cellSize")}</span><input type="number" min="0.1" max="2" step="0.1" value={thresholdDraft.cellSizeDeg} onChange={(event) => setThresholdDraft({ ...thresholdDraft, cellSizeDeg: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
          <button type="button" onClick={() => { const result = outbreakThresholdSchema.safeParse({ minimumCount: Number(thresholdDraft.minimumCount), cellSizeDeg: Number(thresholdDraft.cellSizeDeg) }); if (!result.success) setThresholdError(t("thresholdError")); else saveThresholds.mutate(); }} className="min-h-11 self-end rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("saveThresholds")}</button>
        </div>
      </section>
      <section className="panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("symptomFilter")}</span><select value={symptomCode} onChange={(event) => setSymptomCode(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"><option value="">{t("allSymptoms")}</option>{symptoms.map((item) => <option key={item} value={item}>{t(`symptom.${item}`)}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("issueFilter")}</span><select value={issueType} onChange={(event) => { setIssueType(event.target.value as "" | "crop" | "livestock"); setSubjectKey(""); }} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"><option value="">{t("allIssues")}</option><option value="crop">{t("issue.crop")}</option><option value="livestock">{t("issue.livestock")}</option></select></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("subjectFilter")}</span><select value={subjectKey} onChange={(event) => setSubjectKey(event.target.value)} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"><option value="">{t("allSubjects")}</option>{availableSubjects.map((item) => <option key={item} value={item}>{t(`subject.${item}`)}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-medium">{t("weekRange")}</span><select value={weeks} onChange={(event) => setWeeks(Number(event.target.value))} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"><option value={4}>{t("weeks", { count: 4 })}</option><option value={8}>{t("weeks", { count: 8 })}</option></select></label>
      </section>
      {!cells.length
        ? <EmptyState title={t("noSignalsTitle")} text={t("noSignalsText")} />
        : <div className="grid items-start gap-4 xl:grid-cols-2">
          <section className="space-y-2"><h2 className="font-semibold">{t("mapTitle")}</h2><OutbreakMapLoader cells={cells} alerts={alertList} farmLabel={t("farmPin")} onCellSelect={setSelected} /><p className="text-xs text-[var(--muted)]">{t("mapDeviation")}</p></section>
          <section className="space-y-2"><h2 className="font-semibold">{t("cellsTitle")}</h2><ul className="max-h-[32rem] space-y-2 overflow-y-auto">{cells.map((cell) => <CellSummary key={cell.cellId} cell={cell} selected={selectedCell?.cellId === cell.cellId} onClick={() => { setSelected(cell); setRecipientCount(null); setConfirming(false); setMessage({ en: "", sw: "" }); }} />)}</ul></section>
        </div>}
      {selectedCell && draft && <section className="panel space-y-4 p-4 sm:p-5">
        <h2 className="text-xl font-bold">{t("reviewTitle")}</h2>
        <p>{selectedCell.count} {t("reports")} · {t(`symptom.${draft.symptomCode}`)} · {selectedCell.centerLat.toFixed(2)}, {selectedCell.centerLng.toFixed(2)}</p>
        <label className="block"><span className="mb-1 block font-medium">{t("radiusLabel")}</span><select value={radiusKm} onChange={(event) => { setRadiusKm(Number(event.target.value)); setRecipientCount(null); setConfirming(false); }} className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">{[10, 25, 50, 100].map((radius) => <option key={radius} value={radius}>{t("radiusOption", { radius })}</option>)}</select></label>
        <label className="block"><span className="mb-1 block font-medium">{t("messageEnglish")}</span><textarea maxLength={160} rows={3} value={message.en} onChange={(event) => { setMessage({ ...message, en: event.target.value }); setRecipientCount(null); setConfirming(false); }} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" /><span className="text-xs">{t("characters", { count: message.en.length })}</span></label>
        <label className="block"><span className="mb-1 block font-medium">{t("messageSwahili")}</span><textarea maxLength={160} rows={3} value={message.sw} onChange={(event) => { setMessage({ ...message, sw: event.target.value }); setRecipientCount(null); setConfirming(false); }} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" /><span className="text-xs">{t("characters", { count: message.sw.length })}</span></label>
        {preview.isError && <ErrorState onRetry={previewAlert} message={t("actionError")} />}
        <button type="button" onClick={previewAlert} disabled={!message.en.trim() || !message.sw.trim() || preview.isPending} className="min-h-11 rounded-xl border border-[var(--border)] px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{preview.isPending ? t("previewing") : t("previewRecipients")}</button>
        {recipientCount !== null && <>
          <p role="status" className="font-semibold">{t("recipientPreview", { count: recipientCount })}</p>
          <p className="rounded-lg border border-amber-700 bg-amber-50 p-3 font-semibold text-amber-950">{t("simulatedNoSms")}</p>
          {!confirming
            ? <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("reviewConfirm")}</button>
            : <div className="space-y-2"><p>{t("confirmPrompt")}</p><div className="flex flex-wrap gap-2"><button type="button" onClick={() => send.mutate({ ...draft, message: { ...message } })} className="min-h-11 rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("confirmSend")}</button><button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border border-[var(--border)] px-4 font-semibold">{t("cancel")}</button></div></div>}
        </>}
        {send.isError && <ErrorState onRetry={() => send.mutate({ ...draft, message: { ...message } })} message={t("actionError")} />}
        {send.isSuccess && <p role="status" className="font-semibold">{t("sentSuccess")}</p>}
      </section>}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("historyTitle")}</h2>
        {!alertList.length ? <EmptyState title={t("historyEmptyTitle")} text={t("historyEmptyText")} /> : <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[38rem] text-left text-sm"><caption className="sr-only">{t("historyTitle")}</caption><thead className="bg-[var(--surface-muted)]"><tr><th scope="col" className="p-3">{t("symptomColumn")}</th><th scope="col" className="p-3">{t("radiusColumn")}</th><th scope="col" className="p-3">{t("recipientColumn")}</th><th scope="col" className="p-3">{t("statusColumn")}</th><th scope="col" className="p-3">{t("dateColumn")}</th></tr></thead>
            <tbody>{alertList.map((alert) => <tr key={alert.id} className="border-t border-[var(--border)]"><td className="p-3">{t(`symptom.${alert.symptomCode}`)}</td><td className="p-3">{alert.radiusKm} km</td><td className="p-3">{alert.recipientCount}</td><td className="p-3">{t(`status.${alert.status}`)} · {t("simulated")}</td><td className="p-3">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(alert.createdAt))}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>
    </div>
  );
}
