"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { MarketPriceChartLoader } from "@/components/market-price-chart-loader";
import { bestMarketToSell, nearestMarkets, priceTrend } from "@/lib/markets";
import { marketPriceService } from "@/services";
import { farmerProfileService } from "@/services";
import { demoMarketCrops } from "@/mocks/market-prices";
import { pickLocalized } from "@/types/business";
import type { MarketPrice } from "@/types/market";
import { getDataMode } from "@/lib/data-mode";

const SELECTED_MARKET_KEY = "agritech_demo_selected_market";
type Locale = "en" | "sw";
function selectedMarket(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SELECTED_MARKET_KEY) ?? "";
}
function money(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "sw" ? "sw-KE" : "en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MarketPricesScreen() {
  const t = useTranslations("market");
  const locale = (useLocale() === "sw" ? "sw" : "en") as Locale;
  const [cropKey, setCropKey] = useState("");
  const [chosenMarketId, setChosenMarketId] = useState("");
  const query = useQuery({
    queryKey: ["market-prices"],
    queryFn: async () => {
      const [profile, markets] = await Promise.all([
        farmerProfileService.getProfile(),
        marketPriceService.listMarkets(),
      ]);
      const pin = profile?.latitude != null && profile.longitude != null
        ? { latitude: profile.latitude, longitude: profile.longitude }
        : null;
      const crops = profile?.crops ?? [];
      const cropKeys = demoMarketCrops.filter((crop) =>
        crops.some((farmerCrop) => farmerCrop.toLocaleLowerCase() === crop.key.toLocaleLowerCase()),
      ).map((crop) => crop.key);
      const prices = cropKeys.length ? await marketPriceService.getPrices(cropKeys) : [];
      return { pin, crops: cropKeys, markets, prices };
    },
  });

  useEffect(() => {
    if (!query.data) return;
    const crops = query.data.crops;
    if (crops.length && !crops.includes(cropKey)) setCropKey(crops[0]);
    if (!query.data.pin) return;
    const ordered = nearestMarkets(query.data.pin, query.data.markets);
    if (!ordered.length) return;
    const stored = selectedMarket();
    const initial = stored && ordered.some(({ market }) => market.id === stored) ? stored : ordered[0].market.id;
    setChosenMarketId((current) => current || initial);
  }, [query.data, cropKey]);

  const crop = demoMarketCrops.find((item) => item.key === cropKey);
  const orderedMarkets = useMemo(
    () => query.data?.pin ? nearestMarkets(query.data.pin, query.data.markets, query.data.markets.length) : [],
    [query.data],
  );
  const historyQuery = useQuery({
    queryKey: ["market-price-history", chosenMarketId, cropKey],
    queryFn: () => marketPriceService.getHistory(chosenMarketId, cropKey),
    enabled: Boolean(chosenMarketId && cropKey),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => { void query.refetch(); }} message={t("loadError")} />;
  const data = query.data;
  if (!data?.pin) return <section className="space-y-4"><h1 className="text-2xl font-bold">{t("title")}</h1><EmptyState title={t("pinRequiredTitle")} text={t("pinRequiredText")} /><Link href="/app/profile" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("completeProfile")}</Link></section>;
  if (!data.crops.length) return <section className="space-y-4"><h1 className="text-2xl font-bold">{t("title")}</h1><EmptyState title={t("cropsRequiredTitle")} text={t("cropsRequiredText")} /><Link href="/app/profile" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("completeProfile")}</Link></section>;
  if (!data.markets.length) return <section className="space-y-4"><h1 className="text-2xl font-bold">{t("title")}</h1><EmptyState title={t("noMarketsTitle")} text={t("noMarketsText")} /></section>;
  const availableCrops = demoMarketCrops.filter((item) => data.crops.includes(item.key));
  const nearest = orderedMarkets.slice(0, 5);
  const best = crop ? bestMarketToSell(crop.key, data.pin, data.prices, data.markets) : null;
  const selectedMarketValue = data.markets.find((market) => market.id === chosenMarketId) ?? nearest[0]?.market;
  const selectedHistory = historyQuery.data ?? [];
  const trend = priceTrend(selectedHistory);
  const marketPrices = nearest.map(({ market, distanceKm }) => ({
    market,
    distanceKm,
    price: data.prices.find((item) => item.marketId === market.id && item.cropKey === cropKey) ?? null,
  }));
  const allSorted = orderedMarkets;

  function chooseMarket(marketId: string) {
    setChosenMarketId(marketId);
    if (getDataMode() === "mock") window.localStorage.setItem(SELECTED_MARKET_KEY, marketId);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("sampleLabel")}</p>
      </header>
      <section className="panel grid gap-3 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-medium">{t("cropSelector")}</span>
          <select value={cropKey} onChange={(event) => setCropKey(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
            {availableCrops.map((item) => <option key={item.key} value={item.key}>{pickLocalized(item.name, locale)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">{t("marketSelector")}</span>
          <select value={selectedMarketValue?.id ?? ""} onChange={(event) => chooseMarket(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
            {allSorted.map(({ market, distanceKm }) => <option key={market.id} value={market.id}>{pickLocalized(market.name, locale)} · {distanceKm.toFixed(1)} {t("km")}</option>)}
          </select>
        </label>
      </section>
      {!crop || !data.prices.some((price) => price.cropKey === cropKey)
        ? <EmptyState title={t("cropNoPriceTitle", { crop: crop ? pickLocalized(crop.name, locale) : "" })} text={t("cropNoPriceText")} />
        : <>
          {best && <section className="panel border-forest-700/30 p-4 sm:p-5" aria-label={t("bestMarketTitle")}>
            <p className="text-sm font-semibold uppercase tracking-wide">{t("bestMarketTitle")}</p>
            <h2 className="mt-1 text-xl font-bold">{pickLocalized(best.market.name, locale)}</h2>
            <p className="mt-2">{money(best.price.pricePerUnit, locale)} / {pickLocalized(best.price.unit, locale)}</p>
            <p className="mt-1">{best.differenceFromNearest >= 0 ? t("bestDifference", { difference: money(best.differenceFromNearest, locale), market: pickLocalized(best.nearestMarket.name, locale) }) : t("bestBelowNearest", { difference: money(Math.abs(best.differenceFromNearest), locale), market: pickLocalized(best.nearestMarket.name, locale) })}</p>
            <p className="mt-2 text-sm">{t("assumption")}</p>
          </section>}
          <section className="space-y-2">
            <h2 className="text-xl font-bold">{t("nearestMarketsTitle")}</h2>
            {!marketPrices.length
              ? <EmptyState title={t("cropNoPriceTitle", { crop: pickLocalized(crop.name, locale) })} text={t("cropNoPriceText")} />
              : <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <caption className="sr-only">{t("priceTableCaption", { crop: pickLocalized(crop.name, locale) })}</caption>
                  <thead className="bg-[var(--surface-muted)]"><tr><th scope="col" className="p-3">{t("marketColumn")}</th><th scope="col" className="p-3">{t("distanceColumn")}</th><th scope="col" className="p-3">{t("priceColumn")}</th><th scope="col" className="p-3">{t("observedColumn")}</th></tr></thead>
                  <tbody>{marketPrices.map(({ market, distanceKm, price }) => <tr key={market.id} className="border-t border-[var(--border)]"><th scope="row" className="p-3 font-medium">{pickLocalized(market.name, locale)}</th><td className="p-3">{distanceKm.toFixed(1)} {t("km")}</td><td className="p-3">{price ? `${money(price.pricePerUnit, locale)} / ${pickLocalized(price.unit, locale)}` : t("priceUnavailable")}</td><td className="p-3">{price ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(price.observedAt)) : t("notAvailable")}</td></tr>)}</tbody>
                </table>
              </div>}
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-bold">{t("trendTitle")}{selectedMarketValue ? ` · ${pickLocalized(selectedMarketValue.name, locale)}` : ""}</h2>
            {historyQuery.isLoading ? <LoadingState /> : historyQuery.isError
              ? <ErrorState onRetry={() => { void historyQuery.refetch(); }} message={t("loadError")} />
              : !selectedHistory.length
                ? <EmptyState title={t("noHistoryTitle")} text={t("noHistoryText")} />
                : <div className="space-y-3">
                  <p className="font-semibold">{trend ? t(`trend.${trend.direction}`, { percent: Math.abs(trend.percentChange).toFixed(1) }) : t("trend.insufficient")}</p>
                  <MarketPriceChartLoader history={selectedHistory} />
                  <p className="text-sm text-[var(--muted)]">{t("chartAlternative")}</p>
                  <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="w-full min-w-[24rem] text-left text-sm"><caption className="sr-only">{t("historyCaption")}</caption><thead className="bg-[var(--surface-muted)]"><tr><th scope="col" className="p-3">{t("weekColumn")}</th><th scope="col" className="p-3">{t("priceColumn")}</th></tr></thead>
                      <tbody>{selectedHistory.map((point: MarketPrice) => <tr key={point.observedAt} className="border-t border-[var(--border)]"><th scope="row" className="p-3 font-medium">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(point.observedAt))}</th><td className="p-3">{money(point.pricePerUnit, locale)} / {pickLocalized(point.unit, locale)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>}
          </section>
        </>}
    </div>
  );
}
