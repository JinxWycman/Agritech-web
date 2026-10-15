"use client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { FarmProfileMapLoader } from "@/components/farm-profile-map-loader";
import { farmConditionsService } from "@/services";
import { outbreakService } from "@/services";
import { pickLocalized } from "@/types/business";
import { useLocale } from "next-intl";
import type { ExpertRequestRecord } from "@/lib/request-lifecycle";

export function ExpertCaseBrief({ request }: { request: ExpertRequestRecord }) {
  const t = useTranslations("requests");
  const locale = useLocale() === "sw" ? "sw" : "en";
  const conditions = useQuery({ queryKey: ["lifecycle-requests", "conditions", request.id], queryFn: () => farmConditionsService.getSnapshot(request.farmerFarm?.latitude ?? -1.29, request.farmerFarm?.longitude ?? 36.82) });
  const nearbyAlerts = useQuery({
    queryKey: ["outbreak-alerts-near", request.id],
    queryFn: () => request.farmerFarm ? outbreakService.listAlertsNear(request.farmerFarm) : Promise.resolve([]),
  });
  return <section className="panel space-y-3 p-5"><h2 className="text-lg font-semibold">{t("caseBrief")}</h2>
    <p className="font-semibold">{request.farmerName} ? {request.farmerCounty}</p>
    {request.farmerPhone && <p>{t("farmerPhone")}: <a className="underline" href={`tel:${request.farmerPhone}`}>{request.farmerPhone}</a></p>}
    <p>{t("symptoms")}: {request.symptomCodes.map((code) => t(`symptom.${code}`)).join(", ")}</p>
    <p>{t("urgencyLabel")}: {t(`urgency.${request.urgency}`)}</p>
    <p>{t("crops")}: {request.farmerCrops.length ? request.farmerCrops.join(", ") : t("none")}</p>
    <p>{t("livestock")}: {request.farmerLivestock.length ? request.farmerLivestock.join(", ") : t("none")}</p>
    {request.farmerFarm && <FarmProfileMapLoader position={request.farmerFarm} onChange={() => undefined} label={t("farmMap")} readOnly />}
    {conditions.isLoading && <LoadingState />}
    {conditions.isError && <ErrorState onRetry={() => void conditions.refetch()} message={t("conditionsUnavailable")} />}
    {conditions.data && <p>{t("weatherAndNdvi", { weather: t(`weather.${conditions.data.currentWeather || "partlyCloudy"}`), ndvi: conditions.data.ndvi ?? 0 })}</p>}
    {conditions.data === null && <EmptyState title={t("conditionsUnavailable")} text={t("conditionsUnavailableText")} />}
    {nearbyAlerts.isLoading && <LoadingState />}
    {nearbyAlerts.isError && <ErrorState onRetry={() => void nearbyAlerts.refetch()} message={t("conditionsUnavailable")} />}
    {nearbyAlerts.data?.length
      ? <section className="space-y-2"><h3 className="font-semibold">{t("nearbyOutbreakAlerts")}</h3><ul className="space-y-2">{nearbyAlerts.data.map((alert) => <li key={alert.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">{pickLocalized(alert.message, locale)} · {alert.radiusKm} km</li>)}</ul></section>
      : nearbyAlerts.data && <EmptyState title={t("noNearbyOutbreakAlerts")} text={t("noNearbyOutbreakAlertsText")} />}
    <p className="text-xs text-[var(--muted)]">{t("privacyExpert")}</p>
  </section>;
}
