"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExpertQueueScreen } from "@/components/expert-request-screens";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/portal-state";
import { expertRequestService } from "@/services/expert-requests";
import { getDataMode, getDemoScenario } from "@/lib/data-mode";
function LegacyExpertOverview() {
  const t = useTranslations();
  const query = useQuery({ queryKey: ["expert", "queue-summary"], queryFn: expertRequestService.getQueueSummary });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} message={getDemoScenario() === "error" ? t("states.demoError") : undefined} />;
  const queue = query.data;
  const requests = [...(queue?.pending ?? []), ...(queue?.accepted ?? [])];
  return <div className="space-y-5"><h1 className="text-2xl font-bold">{t("dashboard.expertTitle")}</h1>{getDataMode() === "mock" && <SuccessState text={t("states.demoSuccess")} />}{requests.length === 0 && !queue?.completed ? <EmptyState text={t("dashboard.expertEmpty")} /> : <section className="panel divide-y divide-[var(--border)]"><div className="grid gap-3 p-5 sm:grid-cols-3"><p>{t("dashboard.pending")}: <strong>{queue?.pending.length ?? 0}</strong></p><p>{t("dashboard.accepted")}: <strong>{queue?.accepted.length ?? 0}</strong></p><p>{t("dashboard.completed")}: <strong>{queue?.completed ?? 0}</strong></p></div>{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold">{request.farmerName || t("dashboard.farmerName")}</p><p className="text-sm text-[var(--muted)]">{request.issueType}</p></div><span>{request.status}</span></div>)}</section>}<Link href="/expert/requests" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4">{t("nav.cases")}</Link></div>;
}
export default function ExpertOverviewPage() {
  return getDataMode() === "mock" ? <ExpertQueueScreen /> : <LegacyExpertOverview />;
}
