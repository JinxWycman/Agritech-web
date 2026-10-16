"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/portal-state";
import { buildFarmConditionsSentence } from "@/lib/kenya-location";
import { getDataMode, getDemoScenario } from "@/lib/data-mode";
import { farmerDashboardService } from "@/services/farmers";
import { farmConditionsService, farmerAlertsService, farmerProfileService, farmerRequestsService } from "@/services";
import type { FarmConditionsSnapshot } from "@/types/domain";
import { demoDefaultFarmLocation } from "@/mocks/fixtures";

const FarmHealthChart = dynamic(
  () => import("@/components/farm-health-chart").then((module) => module.FarmHealthChart),
  { ssr: false, loading: () => <div className="mt-4 h-52 animate-pulse rounded-xl bg-[var(--surface-muted)]" aria-hidden="true" /> },
);

export default function FarmerOverviewPage() {
  const t = useTranslations();
  const summaryQuery = useQuery({ queryKey: ["farmer", "dashboard-summary"], queryFn: farmerDashboardService.getDashboardSummary });
  const profileQuery = useQuery({ queryKey: ["farmer", "profile"], queryFn: farmerProfileService.getProfile });
  const latitude = profileQuery.data?.latitude ?? demoDefaultFarmLocation.latitude;
  const longitude = profileQuery.data?.longitude ?? demoDefaultFarmLocation.longitude;
  const conditionsQuery = useQuery({
    queryKey: ["farmer", "farm-conditions", latitude, longitude],
    queryFn: () => farmConditionsService.getSnapshot(latitude, longitude),
  });
  const requestsQuery = useQuery({ queryKey: ["farmer", "open-requests"], queryFn: farmerRequestsService.getOpenCount });
  const alertsQuery = useQuery({ queryKey: ["farmer", "unread-alerts"], queryFn: farmerAlertsService.getUnreadCount });

  if (summaryQuery.isLoading) return <LoadingState />;
  if (summaryQuery.isError) {
    return <ErrorState onRetry={() => void summaryQuery.refetch()} message={getDemoScenario() === "error" ? t("states.demoError") : undefined} />;
  }
  const farmer = summaryQuery.data?.farmer;
  if (!farmer?.id) return <EmptyState text={t("states.demoEmptyAction")} />;

  const conditions: FarmConditionsSnapshot | null | undefined = conditionsQuery.data;
  const forecastDays = conditions?.forecast ?? [];
  const sentence = conditions
    ? buildFarmConditionsSentence(conditions, {
      greener: t("farmDashboard.greener"),
      lessGreen: t("farmDashboard.lessGreen"),
      usualGreen: t("farmDashboard.usualGreen"),
      rainfallAbove: t("farmDashboard.rainfallAbove"),
      rainfallBelow: t("farmDashboard.rainfallBelow"),
      rainfallUsual: t("farmDashboard.rainfallUsual"),
    })
    : "";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("dashboard.farmerTitle")}</h1>
      {getDataMode() === "mock" && <SuccessState text={t("states.demoSuccess")} />}

      {profileQuery.isError
        ? <ErrorState onRetry={() => void profileQuery.refetch()} message={t(getDataMode() === "mock" ? "states.demoError" : "states.notImplemented")} />
        : profileQuery.isLoading
          ? <LoadingState />
          : profileQuery.data?.profile_complete !== true && (
            <section className="panel border-forest-500/40 bg-[var(--positive-background)] p-5 text-[var(--positive-foreground)]">
              <h2 className="text-lg font-semibold">{t("farmDashboard.finishProfile")}</h2>
              <p className="mt-1 text-sm">{t("farmDashboard.finishProfileText")}</p>
              <Link href="/app/profile" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">
                {t("farmDashboard.completeProfile")}
              </Link>
            </section>
          )}

      <section className="panel grid gap-4 p-5 sm:grid-cols-3">
        <div><p className="text-xs text-[var(--muted)]">{t("dashboard.farmerName")}</p><p className="mt-1 font-semibold">{farmer.name}</p></div>
        <div><p className="text-xs text-[var(--muted)]">{t("dashboard.phone")}</p><p className="mt-1 font-semibold">{farmer.phone}</p></div>
        <div><p className="text-xs text-[var(--muted)]">{t("login.county")}</p><p className="mt-1 font-semibold">{farmer.county}</p></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <CountCard
          title={t("farmDashboard.openRequests")}
          query={requestsQuery}
          onRetry={() => void requestsQuery.refetch()}
        />
        <CountCard
          title={t("farmDashboard.unreadAlerts")}
          query={alertsQuery}
          onRetry={() => void alertsQuery.refetch()}
        />
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">{t("farmDashboard.weatherTitle")}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("farmDashboard.sampleLabel")}</p>
        {conditionsQuery.isLoading ? <LoadingState /> : null}
        {conditionsQuery.isError && <ErrorState onRetry={() => void conditionsQuery.refetch()} message={t(getDataMode() === "mock" ? "states.demoError" : "states.notImplemented")} />}
        {conditions && (
          <>
            <p className="mt-3 text-lg font-semibold">
              {t(`farmDashboard.weather.${conditions.currentWeather || "partlyCloudy"}`)} · {t("farmDashboard.temperatureRange", {
                low: conditions.todayLowC ?? 0,
                high: conditions.todayHighC ?? 0,
              })}
            </p>
            <h3 className="mt-4 font-semibold">{t("farmDashboard.forecastTitle")}</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {forecastDays.map((day, index) => (
                <li key={day.day} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                  <p className="font-semibold">{t(`farmDashboard.days.day${index + 1}`)}</p>
                  <p>{t(`farmDashboard.weather.${day.condition}`)}</p>
                  <p>{t("farmDashboard.temperatureRange", { low: day.lowC, high: day.highC })}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        {conditionsQuery.data === null && <EmptyState title={t("farmDashboard.weatherEmptyTitle")} text={t("farmDashboard.weatherEmptyText")} />}
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">{t("farmDashboard.farmHealthTitle")}</h2>
        {conditionsQuery.isLoading ? <LoadingState /> : null}
        {conditionsQuery.isError && <ErrorState onRetry={() => void conditionsQuery.refetch()} message={t(getDataMode() === "mock" ? "states.demoError" : "states.notImplemented")} />}
        {conditionsQuery.data === null && <EmptyState title={t("farmDashboard.healthEmptyTitle")} text={t("farmDashboard.weatherEmptyText")} />}
        {conditions && (
          <>
            <p className="mt-2 text-base font-medium">{sentence}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{t("farmDashboard.sampleLabel")}</p>
            <FarmHealthChart
              snapshot={conditions}
              vegetationLabel={t("farmDashboard.vegetation")}
              rainfallLabel={t("farmDashboard.rainfall")}
              observedLabel={t("farmDashboard.observed")}
              normalLabel={t("farmDashboard.normal")}
              ndviUnit={t("farmDashboard.index")}
              rainfallUnit={t("farmDashboard.millimetres")}
              accessibleLabel={t("farmDashboard.chartAlternative")}
            />
          </>
        )}
      </section>
    </div>
  );
}

function CountCard({
  title,
  query,
  onRetry,
}: {
  title: string;
  query: ReturnType<typeof useQuery<number>>;
  onRetry: () => void;
}) {
  const t = useTranslations();
  return (
    <section className="panel p-5">
      <h2 className="text-sm text-[var(--muted)]">{title}</h2>
      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={onRetry} message={getDataMode() === "mock" ? t("states.demoError") : t("states.notImplemented")} />}
      {query.isSuccess && <p className="mt-2 text-3xl font-bold" aria-live="polite">{query.data}</p>}
    </section>
  );
}
