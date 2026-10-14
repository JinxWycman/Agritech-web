"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { adminSummaryService } from "@/services/admin-summaries";
import { getDataMode, getDemoScenario } from "@/lib/data-mode";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/portal-state";

export default function AdminOverviewPage() {
  const t = useTranslations();
  const query = useQuery({ queryKey: ["admin", "overview-summary"], queryFn: adminSummaryService.getOverview });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} message={getDemoScenario() === "error" ? t("states.demoError") : undefined} />;
  const data = query.data;
  if (!data || data.farmersTotal === 0) return <EmptyState text={t("dashboard.adminEmpty")} />;

  const cards = [
    [t("dashboard.farmers"), data.farmersTotal],
    [t("dashboard.newFarmers"), data.farmersLast7Days],
    [t("dashboard.paidSubscriptions"), data.activePaidSubscriptions],
    [t("dashboard.unassignedRequests"), data.requestsByStatus.Pending ?? 0],
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("dashboard.adminTitle")}</h1>
      {getDataMode() === "mock" && <SuccessState text={t("states.demoSuccess")} />}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => <article key={label} className="panel p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></article>)}
      </section>
      <section className="panel grid gap-4 p-5 sm:grid-cols-3">
        <p>{t("dashboard.requestsOver48Hours")}: <strong>{data.requestsAging48Hours}</strong></p>
        <p>{t("dashboard.activeAdvisories")}: <strong>{data.advisoriesActive}</strong></p>
        <p>{t("dashboard.openSmsSessions")}: <strong>{data.smsSessionsOpen}</strong></p>
      </section>
    </div>
  );
}
