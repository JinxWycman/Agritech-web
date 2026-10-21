"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ErrorState, LoadingState } from "@/components/portal-state";
import { RequestError, useRequestInvalidation } from "@/components/request-common";
import { lifecycleExpertRequestService, lifecycleExpertsService, requestSettingsService } from "@/services";
import { requestSettingsSchema, type RequestSettings } from "@/lib/request-lifecycle";

const columns = ["pending", "offered", "accepted", "completed", "unassigned", "escalated"] as const;
const weightKeys = ["workload", "recency", "responseRate", "proximity"] as const;
const urgentKeys = ["emergency", "soon", "general_advice"] as const;

export function AdminRequestsScreen() {
  const t = useTranslations("requests");
  const invalidate = useRequestInvalidation();
  const board = useQuery({ queryKey: ["lifecycle-requests", "admin-board"], queryFn: lifecycleExpertRequestService.listAll });
  const settingsQuery = useQuery({ queryKey: ["lifecycle-request-settings"], queryFn: requestSettingsService.get });
  const experts = useQuery({ queryKey: ["lifecycle-experts"], queryFn: lifecycleExpertsService.listAll });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<RequestSettings | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const requests = board.data ?? [];
  const selected = requests.find((item) => item.id === selectedId) ?? null;
  const scores = useQuery({ queryKey: ["lifecycle-requests", "scores", selectedId], queryFn: () => lifecycleExpertRequestService.scoreCandidates(selectedId!), enabled: Boolean(selectedId) });
  useEffect(() => { if (settingsQuery.data) setSettings(settingsQuery.data); }, [settingsQuery.data]);
  const reassign = useMutation({ mutationFn: (expertId: string) => lifecycleExpertRequestService.reassign(selectedId!, expertId), onSuccess: invalidate });
  const saveSettings = useMutation({ mutationFn: (value: RequestSettings) => requestSettingsService.update(value), onSuccess: (value) => { setSettings(value); setSettingsError(""); }, onError: () => setSettingsError(t("settingsInvalid")) });
  if (board.isLoading || settingsQuery.isLoading || experts.isLoading) return <LoadingState />;
  if (board.isError || settingsQuery.isError || experts.isError) return <RequestError retry={() => { void board.refetch(); void settingsQuery.refetch(); void experts.refetch(); }} />;
  function setWeight(key: keyof RequestSettings["weights"], value: number) { setSettings((current) => current ? { ...current, weights: { ...current.weights, [key]: value } } : current); }
  function setTimeoutMinutes(key: keyof RequestSettings["offerTimeoutMinutes"], value: number) { setSettings((current) => current ? { ...current, offerTimeoutMinutes: { ...current.offerTimeoutMinutes, [key]: value } } : current); }
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{t("adminTitle")}</h1>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{columns.map((status) => { const items = requests.filter((item) => item.status === status); return <section key={status} className="panel min-h-40 p-3"><h2 className="mb-2 font-semibold">{t(`status.${status}`)} ({items.length})</h2>{!items.length ? <p className="text-sm text-[var(--muted)]">{t("columnEmpty")}</p> : <ul className="space-y-2">{items.map((request) => <li key={request.id}><button type="button" onClick={() => setSelectedId(request.id)} className="min-h-11 w-full rounded-lg border border-[var(--border)] p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{request.referenceCode} · {request.farmerName} · {t(`urgency.${request.urgency}`)}</button></li>)}</ul>}</section>; })}</div>
    {selected && <section className="panel space-y-4 p-5"><h2 className="text-lg font-semibold">{t("adminDetail", { ref: selected.referenceCode })}</h2><p>{selected.farmerName} · {selected.farmerPhone} · {selected.farmerCounty}</p><p>{t("statusLabel")}: {t(`status.${selected.status}`)} · {t(`urgency.${selected.urgency}`)}</p><p>{t("symptoms")}: {selected.symptomCodes.map((code) => t(`symptom.${code}`)).join(", ")}</p><p>{t("note")}: {selected.note || t("none")}</p>
      <h3 className="font-semibold">{t("reassign")}</h3>{scores.isLoading && <LoadingState />}{scores.isError && <ErrorState onRetry={() => void scores.refetch()} message={t("actionError")} />}
      {scores.data && <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>{t("expertName")}</th><th>{t("score")}</th><th>{t("scoreBreakdown")}</th><th>{t("action")}</th></tr></thead><tbody>{scores.data.map((scored) => <tr key={scored.expert.id} className="border-t border-[var(--border)]"><td className="py-2">{scored.expert.name}{!scored.expert.available ? ` · ${t("unavailableLabel")}` : ""}</td><td>{scored.score.toFixed(3)}</td><td>{Object.entries(scored.breakdown).map(([key, value]) => `${t(`weight.${key}`)} ${value.toFixed(2)}`).join(" · ")}</td><td><button type="button" disabled={!scored.expert.available || reassign.isPending} onClick={() => reassign.mutate(scored.expert.id)} className="min-h-10 rounded-lg border border-[var(--border)] px-3 disabled:opacity-50">{t("assign")}</button></td></tr>)}</tbody></table></div>}
      {reassign.isError && <ErrorState onRetry={() => void scores.refetch()} message={t("actionError")} />}
    </section>}
    {settings && <section className="panel space-y-4 p-5"><h2 className="text-lg font-semibold">{t("settingsTitle")}</h2><div className="grid gap-3 sm:grid-cols-2">{weightKeys.map((key) => <label key={key} className="block"><span className="mb-1 block">{t(`weight.${key}`)}</span><input type="number" min="0" step="0.1" value={settings.weights[key]} onChange={(event) => setWeight(key, Number(event.target.value))} className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" /></label>)}</div>
      <h3 className="font-semibold">{t("timeouts")}</h3><div className="grid gap-3 sm:grid-cols-3">{urgentKeys.map((key) => <label key={key}><span className="mb-1 block">{t(`urgency.${key}`)}</span><input type="number" min="0" step="1" value={settings.offerTimeoutMinutes[key]} onChange={(event) => setTimeoutMinutes(key, Number(event.target.value))} className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" /></label>)}</div>
      {settingsError && <p role="alert" className="text-sm text-red-800">{settingsError}</p>}<button type="button" disabled={saveSettings.isPending} onClick={() => { const result = requestSettingsSchema.safeParse(settings); if (result.success) saveSettings.mutate(result.data); else setSettingsError(t("settingsInvalid")); }} className="min-h-11 rounded-xl bg-forest-700 px-4 font-semibold text-white">{t("saveSettings")}</button><p className="text-xs text-[var(--muted)]">{t("settingsLaterOnly")}</p>
    </section>}
  </div>;
}
