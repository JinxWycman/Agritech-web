"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/portal-state";
import { RequestError, RequestSummary, useRequestInvalidation } from "@/components/request-common";
import { lifecycleExpertRequestService, farmerProfileService, farmerService, symptomsService } from "@/services";
import type { RequestUrgency } from "@/lib/request-lifecycle";
import { demoDefaultFarmLocation } from "@/mocks/fixtures";

const FARMER_ID = "demo-farmer-1";
const urgencies: RequestUrgency[] = ["emergency", "soon", "general_advice"];

export function FarmerRequestsScreen() {
  const t = useTranslations("requests");
  const query = useQuery({ queryKey: ["lifecycle-requests", "farmer", FARMER_ID], queryFn: () => lifecycleExpertRequestService.listForFarmer(FARMER_ID) });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <RequestError retry={() => void query.refetch()} />;
  const requests = query.data ?? [];
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{t("farmerTitle")}</h1><Link href="/app/requests/new" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("newRequest")}</Link></div>
    {requests.length === 0 ? <EmptyState title={t("farmerEmptyTitle")} text={t("farmerEmptyText")} /> : <ul className="space-y-3">{requests.map((request) => <li key={request.id} className="panel p-4"><Link href={`/app/requests/${request.id}`} className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600"><p className="font-semibold">{t(`issue.${request.issueType}`)} · {request.referenceCode}</p><p className="my-2 text-sm text-[var(--muted)]">{t(`urgency.${request.urgency}`)}</p><RequestSummary request={request} /></Link></li>)}</ul>}
  </div>;
}

export function NewFarmerRequestScreen() {
  const t = useTranslations("requests");
  const router = useRouter();
  const [issueType, setIssueType] = useState<"crop" | "livestock">("crop");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<RequestUrgency>("general_advice");
  const [note, setNote] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const invalidate = useRequestInvalidation();
  const symptomsQuery = useQuery({ queryKey: ["request-symptoms", issueType], queryFn: () => symptomsService.list(issueType) });
  const profileQuery = useQuery({ queryKey: ["farmer", "profile"], queryFn: farmerProfileService.getProfile });
  const farmerQuery = useQuery({ queryKey: ["farmer", "dashboard-summary"], queryFn: farmerService.getDashboardSummary });
  const submit = useMutation({
    mutationFn: async () => {
      const farmer = farmerQuery.data?.farmer;
      if (!farmer) throw new Error(t("farmerUnavailable"));
      if (!symptoms.length) throw new Error(t("chooseSymptom"));
      const profile = profileQuery.data;
      return lifecycleExpertRequestService.submit({
        issueType, symptomCodes: symptoms, urgency, note: note.trim(), preferredTime,
        farmerId: farmer.id || FARMER_ID, farmerName: farmer.name || t("sampleFarmer"), farmerPhone: farmer.phone,
        farmerCounty: profile?.county || farmer.county,
        farmerFarm: profile?.latitude != null && profile.longitude != null ? { latitude: profile.latitude, longitude: profile.longitude } : demoDefaultFarmLocation,
        farmerCrops: profile?.crops ?? [], farmerLivestock: profile?.livestock ?? [],
      });
    },
    onSuccess(request) { invalidate(); router.push(`/app/requests/${request.id}`); },
  });
  if (symptomsQuery.isLoading || profileQuery.isLoading || farmerQuery.isLoading) return <LoadingState />;
  if (symptomsQuery.isError || profileQuery.isError || farmerQuery.isError) return <RequestError retry={() => { void symptomsQuery.refetch(); void profileQuery.refetch(); void farmerQuery.refetch(); }} />;
  const symptomOptions = symptomsQuery.data ?? [];
  const toggle = (code: string) => setSymptoms((items) => items.includes(code) ? items.filter((item) => item !== code) : [...items, code]);
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{t("newRequest")}</h1><p className="text-sm text-[var(--muted)]">{t("sampleContent")}</p>
    {submit.isError && <ErrorState onRetry={() => submit.mutate()} message={submit.error instanceof Error ? submit.error.message : t("submitError")} />}
    <form className="panel space-y-5 p-4 sm:p-6" onSubmit={(event) => { event.preventDefault(); submit.mutate(); }}>
      <fieldset><legend className="font-semibold">{t("issueType")}</legend><div className="mt-2 flex flex-wrap gap-2">{(["crop", "livestock"] as const).map((item) => <button key={item} type="button" aria-pressed={issueType === item} onClick={() => { setIssueType(item); setSymptoms([]); }} className={`min-h-12 rounded-xl border px-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 ${issueType === item ? "border-forest-700 bg-forest-50" : "border-[var(--border)]"}`}>{t(`issue.${item}`)}</button>)}</div></fieldset>
      <fieldset><legend className="font-semibold">{t("symptoms")}</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{symptomOptions.map((symptom) => <button type="button" key={symptom.code} aria-pressed={symptoms.includes(symptom.code)} onClick={() => toggle(symptom.code)} className={`min-h-14 rounded-xl border px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 ${symptoms.includes(symptom.code) ? "border-forest-700 bg-forest-50" : "border-[var(--border)]"}`}>{t(`symptom.${symptom.code}`)}</button>)}</div></fieldset>
      <fieldset><legend className="font-semibold">{t("urgencyLabel")}</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{urgencies.map((item) => <label key={item} className="flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] px-3"><input type="radio" name="urgency" value={item} checked={urgency === item} onChange={() => setUrgency(item)} className="size-5 accent-forest-700" />{t(`urgency.${item}`)}</label>)}</div></fieldset>
      <label className="block"><span className="mb-1 block font-medium">{t("note")}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={4} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" /></label>
      <label className="block"><span className="mb-1 block font-medium">{t("preferredTime")}</span><select value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"><option value="">{t("choosePreferredTime")}</option>{["morning", "afternoon", "anytime"].map((item) => <option key={item} value={item}>{t(`time.${item}`)}</option>)}</select></label>
      <button type="submit" disabled={submit.isPending} className="min-h-12 w-full rounded-xl bg-forest-700 px-4 font-semibold text-white disabled:opacity-60 sm:w-auto">{submit.isPending ? t("submitting") : t("submit")}</button>
    </form>
  </div>;
}

export function FarmerRequestDetailScreen({ id }: { id: string }) {
  const t = useTranslations("requests");
  const invalidate = useRequestInvalidation();
  const query = useQuery({ queryKey: ["lifecycle-requests", "farmer-detail", id], queryFn: () => lifecycleExpertRequestService.getForFarmer(id, FARMER_ID) });
  const cancel = useMutation({ mutationFn: () => lifecycleExpertRequestService.cancel(id, FARMER_ID), onSuccess: invalidate });
  const feedback = useMutation({ mutationFn: (solved: boolean) => lifecycleExpertRequestService.saveFeedback(id, FARMER_ID, solved), onSuccess: invalidate });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <RequestError retry={() => void query.refetch()} />;
  const request = query.data;
  if (!request) return <EmptyState title={t("requestNotFound")} text={t("requestNotFoundText")} />;
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{t("requestDetail")}</h1><section className="panel space-y-4 p-5"><RequestSummary request={request} /><p>{t("issueType")}: {t(`issue.${request.issueType}`)}</p><p>{t("urgencyLabel")}: {t(`urgency.${request.urgency}`)}</p><p>{t("symptoms")}: {request.symptomCodes.map((code) => t(`symptom.${code}`)).join(", ")}</p><p>{t("note")}: {request.note || t("none")}</p><p>{t("preferredTime")}: {request.preferredTime ? t(`time.${request.preferredTime}`) : t("none")}</p>
    {request.expertPhone && <p className="rounded-lg bg-forest-50 p-3 font-semibold">{t("expertPhone")}: <a href={`tel:${request.expertPhone}`} className="underline">{request.expertPhone}</a></p>}
    {request.status === "cancelled" && <p role="status">{t("cancelled")}</p>}
    {(cancel.isError || feedback.isError) && <ErrorState onRetry={() => cancel.isError ? cancel.mutate() : feedback.mutate(false)} message={t("actionError")} />}
    {cancel.isSuccess && <SuccessState text={t("cancelled")} />}
    {request.status !== "completed" && request.status !== "cancelled" && <button type="button" onClick={() => cancel.mutate()} disabled={cancel.isPending} className="min-h-11 rounded-xl border border-red-700 px-4 font-semibold text-red-800">{t("cancelRequest")}</button>}
    {request.status === "completed" && request.solved === null && <div className="space-y-2"><p className="font-semibold">{t("solvedQuestion")}</p><div className="flex gap-2">{[true, false].map((solved) => <button key={String(solved)} type="button" onClick={() => feedback.mutate(solved)} className="min-h-11 rounded-xl border border-[var(--border)] px-4">{t(solved ? "yes" : "no")}</button>)}</div></div>}
    {request.solved !== null && <SuccessState text={t(request.solved ? "feedbackYes" : "feedbackNo")} />}
  </section></div>;
}
