"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { serviceAreasSchema } from "@/lib/account-validation";
import { expertPerformanceService } from "@/services/expert-performance";
import { expertCoverageService, expertCounties } from "@/services/expert-coverage";
import { lifecycleExpertsService } from "@/services";
import { formatDate } from "@/lib/format";
import type { ServiceAreas } from "@/types/account";

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
