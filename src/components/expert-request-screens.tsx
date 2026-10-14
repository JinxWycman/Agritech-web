"use client";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { ExpertCaseBrief } from "@/components/expert-case-brief";
import { RequestError, useRequestInvalidation } from "@/components/request-common";
import { lifecycleExpertRequestService, lifecycleExpertsService } from "@/services";
import { urgencyOrder, type ExpertRequestRecord } from "@/lib/request-lifecycle";
import { demoNow } from "@/lib/request-store";

function OfferCountdown({ expiry, onExpire }: { expiry: number | null; onExpire: () => void }) {
  const t = useTranslations("requests");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(demoNow()), 1000); return () => window.clearInterval(id); }, []);
  const remaining = expiry === null ? 0 : Math.max(0, Math.ceil((expiry - now) / 1000));
  useEffect(() => { if (expiry !== null && remaining === 0) onExpire(); }, [expiry, onExpire, remaining]);
  return remaining === 0
    ? <span aria-live="polite">{t("expired")}</span>
    : <span>{t("expiresIn", { minutes: Math.floor(remaining / 60), seconds: String(remaining % 60).padStart(2, "0") })}</span>;
}

function distance(request: ExpertRequestRecord, expert: { location?: { latitude: number; longitude: number } } | undefined): string {
  const farm = request.farmerFarm;
  if (!farm || !expert?.location) return "?";
  const rad = Math.PI / 180;
  const dLat = (expert.location.latitude - farm.latitude) * rad;
  const dLon = (expert.location.longitude - farm.longitude) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(farm.latitude * rad) * Math.cos(expert.location.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return String(Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

export function ExpertQueueScreen() {
  const t = useTranslations("requests");
  const invalidate = useRequestInvalidation();
  const expertId = lifecycleExpertsService.getActingExpertId();
  const query = useQuery({ queryKey: ["lifecycle-requests", "offers", expertId], queryFn: () => lifecycleExpertRequestService.listOffers(expertId) });
  const experts = useQuery({ queryKey: ["lifecycle-experts"], queryFn: lifecycleExpertsService.listAll });
  const [selected, setSelected] = useState<ExpertRequestRecord | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const accept = useMutation({ mutationFn: (id: string) => lifecycleExpertRequestService.accept(id, expertId), onSuccess: invalidate });
  const decline = useMutation({ mutationFn: (id: string) => lifecycleExpertRequestService.decline(id, expertId, reason), onSuccess: () => { setDecliningId(null); setReason(""); invalidate(); } });
  const refetchOffers = query.refetch;
  const refresh = useCallback(() => { void refetchOffers(); }, [refetchOffers]);
  if (query.isLoading || experts.isLoading) return <LoadingState />;
  if (query.isError || experts.isError) return <RequestError retry={() => { void query.refetch(); void experts.refetch(); }} />;
  const expertList = experts.data ?? [];
  const expert = expertList.find((item) => item.id === expertId);
  const offers = [...(query.data ?? [])].sort((a, b) => urgencyOrder(a.urgency) - urgencyOrder(b.urgency));
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{t("queueTitle")}</h1>
    {!offers.length ? <EmptyState title={t("queueEmptyTitle")} text={t("queueEmptyText")} /> : <div className="grid gap-4 lg:grid-cols-2">{offers.map((request) => <article key={request.id} className="panel space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{request.referenceCode} ? {t(`issue.${request.issueType}`)}</h2><span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900">{t(`urgency.${request.urgency}`)}</span></div>
      <p>{t("distance", { distance: distance(request, expert) })}</p><OfferCountdown expiry={request.offerExpiresAt} onExpire={refresh} />
      <p className="text-sm">{request.symptomCodes.map((code) => t(`symptom.${code}`)).join(", ")}</p>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(request)} className="min-h-11 rounded-xl border border-[var(--border)] px-3">{t("viewBrief")}</button><button type="button" onClick={() => accept.mutate(request.id)} className="min-h-11 rounded-xl bg-forest-700 px-4 font-semibold text-white">{t("accept")}</button><button type="button" onClick={() => setDecliningId(decliningId === request.id ? null : request.id)} className="min-h-11 rounded-xl border border-[var(--border)] px-4">{t("decline")}</button></div>
      {decliningId === request.id && <div className="space-y-2"><label className="block"><span className="mb-1 block">{t("declineReason")}</span><input value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3" /></label><button type="button" onClick={() => decline.mutate(request.id)} className="min-h-11 rounded-xl border border-[var(--border)] px-3">{t("confirmDecline")}</button></div>}</article>)}</div>}
    {(accept.isError || decline.isError) && <ErrorState onRetry={() => { if (decliningId) decline.mutate(decliningId); else void query.refetch(); }} message={t("actionError")} />}
    {selected && <ExpertCaseBrief request={selected} />}
  </div>;
}

export function ExpertCasesScreen() {
  const t = useTranslations("requests");
  const invalidate = useRequestInvalidation();
  const expertId = lifecycleExpertsService.getActingExpertId();
  const query = useQuery({ queryKey: ["lifecycle-requests", "cases", expertId], queryFn: () => lifecycleExpertRequestService.listCases(expertId) });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<ExpertRequestRecord | null>(null);
  const complete = useMutation({ mutationFn: (id: string) => lifecycleExpertRequestService.complete(id, expertId, notes[id] ?? ""), onSuccess: invalidate });
  const escalate = useMutation({ mutationFn: (id: string) => lifecycleExpertRequestService.escalate(id, expertId, notes[id] ?? ""), onSuccess: invalidate });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <RequestError retry={() => void query.refetch()} />;
  const cases = query.data ?? [];
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{t("casesTitle")}</h1>
    {!cases.length ? <EmptyState title={t("casesEmptyTitle")} text={t("casesEmptyText")} /> : <div className="space-y-3">{cases.map((request) => <article key={request.id} className="panel space-y-3 p-4"><button type="button" onClick={() => setSelected(request)} className="text-left font-semibold underline">{request.referenceCode} ? {request.farmerName} ? {t(`status.${request.status}`)}</button>
      {request.status === "accepted" && <><p>{t("farmerPhone")}: {request.farmerPhone}</p><label className="block"><span className="mb-1 block">{t("caseNotes")}</span><textarea value={notes[request.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" /></label><div className="flex flex-wrap gap-2"><button type="button" onClick={() => complete.mutate(request.id)} className="min-h-11 rounded-xl bg-forest-700 px-4 text-white">{t("markComplete")}</button><button type="button" onClick={() => escalate.mutate(request.id)} className="min-h-11 rounded-xl border border-[var(--border)] px-4">{t("requestEscalation")}</button></div></>}</article>)}</div>}
    {(complete.isError || escalate.isError) && <ErrorState onRetry={() => void query.refetch()} message={t("actionError")} />}{selected && <ExpertCaseBrief request={selected} />}
  </div>;
}

export function ExpertAvailabilityScreen() {
  const t = useTranslations("requests");
  const expertId = lifecycleExpertsService.getActingExpertId();
  const query = useQuery({ queryKey: ["lifecycle-experts"], queryFn: lifecycleExpertsService.listAll });
  const mutation = useMutation({ mutationFn: (available: boolean) => lifecycleExpertsService.setAvailability(expertId, available), onSuccess: () => void query.refetch() });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <RequestError retry={() => void query.refetch()} />;
  const expert = (query.data ?? []).find((item) => item.id === expertId);
  if (!expert) return <EmptyState title={t("expertUnavailable")} text={t("expertUnavailableText")} />;
  return <section className="panel max-w-xl space-y-4 p-5"><h1 className="text-2xl font-bold">{t("availabilityTitle")}</h1><p>{t("actingAs", { name: expert.name })}</p><p className="font-semibold">{t(expert.available ? "onDuty" : "offDuty")}</p><button type="button" onClick={() => mutation.mutate(!expert.available)} disabled={mutation.isPending} className="min-h-12 rounded-xl bg-forest-700 px-5 font-semibold text-white">{t(expert.available ? "goOffDuty" : "goOnDuty")}</button>{mutation.isError && <ErrorState onRetry={() => mutation.mutate(!expert.available)} message={t("actionError")} />}</section>;
}
