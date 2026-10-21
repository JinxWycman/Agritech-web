"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/portal-state";
import { VendorMapLoader } from "@/components/vendor-map-loader";
import { isOpenNow } from "@/lib/vendor-hours";
import { formatKes } from "@/lib/format";
import { toE164Kenya, toWhatsAppKenya } from "@/lib/phone";
import type { Coordinates } from "@/lib/kenya-location";
import { farmConditionsService, farmerProfileService, recommendationService, vendorService } from "@/services";
import { getDataMode } from "@/lib/data-mode";
import { pickLocalized, type Recommendation, type Vendor, type VendorWithDistance } from "@/types/business";

type Locale = "en" | "sw";
function localeOf(locale: string): Locale {
  return locale === "sw" ? "sw" : "en";
}

function money(amount: number, locale: Locale): string { return formatKes(amount, locale); }

function hoursKnown(vendor: Vendor): boolean {
  return Object.values(vendor.openingHours).some(Boolean);
}

function VendorFacts({ vendor }: { vendor: Vendor }) {
  const t = useTranslations("business");
  return <p className="flex flex-wrap items-center gap-2 text-sm">
    {vendor.sponsored && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">{t("sponsored")}</span>}
    {vendor.rating !== null && <span>{t("rating")}: {vendor.rating.toFixed(1)} / 5 ·</span>}
    <span>{vendor.certified ? t("certified") : t("notCertified")}</span>
  </p>;
}

function OpenStatus({ vendor }: { vendor: Vendor }) {
  const t = useTranslations("business");
  if (!hoursKnown(vendor)) return <p className="text-sm">{vendor.openingHoursText || t("hoursNotListed")}</p>;
  return <p className="text-sm">{t(isOpenNow(vendor.openingHours) ? "openNow" : "closedNow")}</p>;
}

function ProductPrice({ amount, unit, locale }: { amount: number | null; unit: string; locale: Locale }) {
  const t = useTranslations("business");
  return <>{amount === null ? t("priceOnRequest") : `${money(amount, locale)} / ${unit}`}</>;
}

function ContactLinks({ vendor }: { vendor: Vendor }) {
  const labels = useTranslations("business");
  const [error, setError] = useState(false);
  async function recordContact() {
    try {
      await vendorService.recordEvent(vendor.id, "contact");
      setError(false);
    } catch {
      setError(true);
    }
  }
  const phoneHref = toE164Kenya(vendor.phone);
  const whatsapp = toWhatsAppKenya(vendor.whatsapp);
  return (
    <div className="flex flex-wrap gap-2">
      {phoneHref && <a href={`tel:${phoneHref}`} onClick={() => { void recordContact(); }} className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{labels("callVendor")}</a>}
      {whatsapp && <a href={`https://wa.me/${whatsapp}`} onClick={() => { void recordContact(); }} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{labels("whatsAppVendor")}</a>}
      {error && <p role="alert" className="w-full text-sm text-red-800">{labels("eventError")}</p>}
    </div>
  );
}

function NearbyVendor({ vendor, locale }: { vendor: VendorWithDistance; locale: Locale }) {
  const t = useTranslations("business");
  return (
    <li className="rounded-xl border border-[var(--border)] p-3">
      <p className="font-semibold">{pickLocalized(vendor.name, locale)}</p>
      <p className="text-sm text-[var(--muted)]">{vendor.county}{vendor.distanceKm !== null ? ` · ${vendor.distanceKm.toFixed(1)} ${t("kmAway")}` : ""}</p>
      {vendor.sponsored && <VendorFacts vendor={vendor} />}
      <OpenStatus vendor={vendor} />
      <p className="my-2 text-sm">{t("phoneLabel")}: <a className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600" href={`tel:${toE164Kenya(vendor.phone)}`}>{vendor.phone}</a></p>
      {hoursKnown(vendor) && <details><summary className="min-h-11 cursor-pointer py-2 font-medium">{t("openingHours")}</summary><OpeningHoursList vendor={vendor} /></details>}
      <ContactLinks vendor={vendor} />
      <Link href={`/app/agrovets/${vendor.id}`} className="mt-2 inline-block rounded underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{t("vendorDetails")}</Link>
    </li>
  );
}

function RecommendationCard({ recommendation, locale }: { recommendation: Recommendation; locale: Locale }) {
  const t = useTranslations("business");
  const primaryName = pickLocalized(recommendation.primary.name, locale);
  const category = recommendation.kind === "crop" ? "crop" : "breed";
  const dimension = recommendation.kind === "crop" ? t("spacing") : t("stockingDensity");
  return (
    <article className="panel space-y-5 p-4 sm:p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-800">{t(`kind.${category}`)}</p>
        <h2 className="mt-1 text-xl font-bold">{primaryName}</h2>
      </header>
      <section>
        <h3 className="font-semibold">{t("whySuggested")}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{recommendation.reasons.map((reason, index) => {
          const trend = reason.params?.trend;
          const trendLabel = trend === "above" || trend === "below" || trend === "normal" ? t(`trend.${trend}`) : "";
          let message: string;
          switch (reason.key) {
            case "altitudeFit": message = t("reasons.altitudeFit", { altitude: Number(reason.params?.altitude ?? 0) }); break;
            case "rainfallFit": message = t("reasons.rainfallFit", { rainfall: Number(reason.params?.rainfall ?? 0) }); break;
            case "ndviTrend": message = t("reasons.ndviTrend", { trend: trendLabel }); break;
            case "rainfallTrend": message = t("reasons.rainfallTrend", { trend: trendLabel }); break;
            default: message = reason.key;
          }
          return <li key={`${reason.key}-${index}`}>{message}</li>;
        })}</ul>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section><h3 className="font-semibold">{t("maturityTitle")}</h3><p className="mt-1">{recommendation.kind === "crop" ? t("maturity.days", { amount: recommendation.maturity.amount }) : t("maturity.months", { amount: recommendation.maturity.amount })}</p></section>
        <section><h3 className="font-semibold">{dimension}</h3><p className="mt-1">{pickLocalized(recommendation.spacingOrDensity, locale)}</p></section>
        <section><h3 className="font-semibold">{t("plantingWindow")}</h3><p className="mt-1">{pickLocalized(recommendation.plantingWindow, locale)}</p></section>
        <section><h3 className="font-semibold">{t("confidenceTitle")}</h3><p className="mt-1">{t(`confidence.${recommendation.confidence}`)}</p></section>
      </div>
      <section><h3 className="font-semibold">{t("risks")}</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{recommendation.risks.map((risk, index) => <li key={index}>{pickLocalized(risk, locale)}</li>)}</ul></section>
      <section>
        <h3 className="font-semibold">{t("alternatives")}</h3>
        {recommendation.alternatives.length
          ? <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{recommendation.alternatives.map(({ rank, item }) => <li key={item.id}>{t("rankedItem", { rank, name: pickLocalized(item.name, locale) })}</li>)}</ol>
          : <p className="mt-1 text-sm text-[var(--muted)]">{t("noAlternatives")}</p>}
      </section>
      <section><h3 className="font-semibold">{t("tips")}</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{recommendation.tips.map((tip, index) => <li key={index}>{pickLocalized(tip, locale)}</li>)}</ul></section>
      {"housing" in recommendation.primary && <section><h3 className="font-semibold">{t("housing")}</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{recommendation.primary.housing.map((item, index) => <li key={index}>{pickLocalized(item, locale)}</li>)}</ul></section>}
      {"vaccinationCalendar" in recommendation.primary && <section><h3 className="font-semibold">{t("vaccinationCalendar")}</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{recommendation.primary.vaccinationCalendar.map((item, index) => <li key={index}>{pickLocalized(item, locale)}</li>)}</ul></section>}
      <section>
        <h3 className="font-semibold">{t("nearbyVendors")}</h3>
        {recommendation.nearbyVendors.length
          ? <ul className="mt-2 grid gap-2 lg:grid-cols-2">{recommendation.nearbyVendors.map((vendor) => <NearbyVendor key={vendor.id} vendor={vendor} locale={locale} />)}</ul>
          : <p className="mt-1 text-sm text-[var(--muted)]">{t("noVendorMatches")}</p>}
      </section>
      <section>
        <h3 className="font-semibold">{t("matchedProducts")}</h3>
        {recommendation.matchedProducts.length
          ? <ul className="mt-2 space-y-2">{recommendation.matchedProducts.map(({ product, vendor }) => <li key={product.id} className="rounded-lg border border-[var(--border)] p-3">
            <p className="font-medium">{pickLocalized(product.name, locale)} · {pickLocalized(vendor.name, locale)}</p>
            <p className="text-sm"><ProductPrice amount={product.priceKES} unit={pickLocalized(product.unit, locale)} locale={locale} /></p>
            <p className="text-sm text-[var(--muted)]">{t("indicativePrice")} · {t(`stock.${product.stockStatus}`)}</p>
          </li>)}</ul>
          : <p className="mt-1 text-sm text-[var(--muted)]">{t("noProductMatches")}</p>}
      </section>
      <p className="rounded-lg bg-[var(--surface-muted)] p-3 text-sm font-medium">{pickLocalized(recommendation.disclaimer, locale)}</p>
      <Link href="/app/requests/new" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("askExpert")}</Link>
    </article>
  );
}

export function RecommendationScreen({ kind }: { kind: "crop" | "livestock" }) {
  const t = useTranslations("business");
  const locale = localeOf(useLocale());
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["business-recommendations", kind],
    queryFn: async () => {
      const profile = await farmerProfileService.getProfile();
      if (!profile) return { point: null, result: null, saved: [] };
      if (getDataMode() === "api" && (profile.latitude === null || profile.longitude === null)) return { point: null, result: null, saved: await recommendationService.listSaved() };
      if (profile.latitude === null || profile.longitude === null) return { point: null, result: null, saved: [] };
      if (getDataMode() === "api") return { point: { latitude: profile.latitude, longitude: profile.longitude }, result: null, saved: await recommendationService.listSaved() };
      const point = { latitude: profile.latitude, longitude: profile.longitude };
      const conditions = await farmConditionsService.getSnapshot(point.latitude, point.longitude);
      return { point, result: await recommendationService.getForFarm(kind, point, conditions), saved: [] };
    },
  });
  const generate = useMutation({
    mutationFn: async () => {
      const profile = await farmerProfileService.getProfile();
      return recommendationService.generate(kind, {
        crops: profile?.crops.join(", ") ?? "",
        livestock: profile?.livestock.join(", ") ?? "",
        sub_county: profile?.subCounty ?? "",
        ward: profile?.ward ?? "",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business-recommendations", kind] }),
  });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => { void query.refetch(); }} message={t("loadError")} />;
  const queryData = query.data;
  if (!queryData) return <LoadingState />;
  if (!queryData.point && getDataMode() !== "api") return <section className="space-y-4"><h1 className="text-2xl font-bold">{t(kind === "crop" ? "cropTitle" : "livestockTitle")}</h1><EmptyState title={t("pinRequiredTitle")} text={t("pinRequiredText")} /><Link href="/app/profile" className="inline-flex min-h-12 items-center rounded-xl bg-forest-700 px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("completeProfile")}</Link></section>;
  const recommendations = queryData.result?.recommendations ?? [];
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold">{t(kind === "crop" ? "cropTitle" : "livestockTitle")}</h1>{getDataMode() === "api" ? <p className="mt-2 text-sm text-[var(--muted)]">{t("liveRecommendationIntro")}</p> : <p className="mt-2 text-sm text-[var(--muted)]">{t("sampleLabel")}</p>}{locale === "sw" && <p className="mt-1 text-sm font-medium">{t("expertReview")}</p>}</header>
      {getDataMode() === "api" && <section className="space-y-3">
        <button type="button" onClick={() => generate.mutate()} disabled={generate.isPending} className="min-h-12 rounded-xl bg-forest-700 px-4 font-semibold text-white disabled:opacity-60">{generate.isPending ? t("generatingRecommendation") : t("generateAndSms")}</button>
        {generate.isError && <ErrorState onRetry={() => generate.mutate()} message={generate.error instanceof Error ? generate.error.message : t("loadError")} />}
        {generate.data && (
          <article className="panel space-y-4 p-4" aria-live="polite">
            <header>
              <p className="text-sm font-semibold uppercase tracking-wide text-forest-800">{generate.data.recommendation.kind === "crop" ? t("kind.crop") : t("kind.breed")}</p>
              <h2 className="mt-1 text-xl font-bold">{generate.data.recommendation.primary.name}</h2>
            </header>
            <section>
              <h3 className="font-semibold">{t("whySuggested")}</h3>
              <p className="mt-1 text-sm">{generate.data.recommendation.why_fit}</p>
            </section>
            {generate.data.recommendation.alternatives.length > 0 && (
              <section>
                <h3 className="font-semibold">{t("alternatives")}</h3>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{generate.data.recommendation.alternatives.map((item, index) => <li key={index}>{t("rankedItem", { rank: index + 1, name: item.name })}</li>)}</ol>
              </section>
            )}
            {generate.data.recommendation.actions.length > 0 && (
              <section>
                <h3 className="font-semibold">{t("tips")}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{generate.data.recommendation.actions.map((action, index) => <li key={index}>{action}</li>)}</ul>
              </section>
            )}
            <p className="rounded-lg bg-[var(--surface-muted)] p-3 text-sm">
              {generate.data.sms.status === "error"
                ? generate.data.sms.reason ?? t("smsSubmissionFailed")
                : t("smsSubmitted", { status: generate.data.sms.status.toLowerCase() })}
            </p>
          </article>
        )}
        {queryData.saved.map((item) => (
          <article key={item.id} className="panel space-y-3 p-4">
            <h2 className="font-bold">{item.title}</h2>
            <p className="whitespace-pre-wrap text-sm">{item.recommendation_text}</p>
            {item.sms_deliveries.length > 0 && (
              <ul className="space-y-1">{item.sms_deliveries.map((delivery, index) => (
                <li key={`${delivery.submitted_at}-${index}`} className="rounded bg-[var(--surface-muted)] px-3 py-2 text-xs">
                  {t("smsDeliveryStatus", { status: delivery.status.toLowerCase() })}
                  {delivery.failure_reason && <span className="ml-1 text-red-700">— {delivery.failure_reason}</span>}
                </li>
              ))}</ul>
            )}
          </article>
        ))}
      </section>}
      {!recommendations.length
        ? <EmptyState title={t("recommendationsEmptyTitle")} text={t("recommendationsEmptyText")} />
        : <div className="space-y-5">{recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} locale={locale} />)}</div>}
    </div>
  );
}

function VendorRow({ vendor, locale }: { vendor: VendorWithDistance; locale: Locale }) {
  const t = useTranslations("business");
  return (
    <li className="panel space-y-2 p-4">
      <Link href={`/app/agrovets/${vendor.id}`} className="block rounded font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{pickLocalized(vendor.name, locale)}</Link>
      <p className="text-sm">{vendor.county}{vendor.distanceKm !== null ? ` · ${vendor.distanceKm.toFixed(1)} ${t("kmAway")}` : ""}</p>
      <VendorFacts vendor={vendor} />
      <OpenStatus vendor={vendor} />
    </li>
  );
}

export function VendorDirectoryScreen() {
  const t = useTranslations("business");
  const locale = localeOf(useLocale());
  const [text, setText] = useState("");
  const [county, setCounty] = useState("");
  const [category, setCategory] = useState("");
  const [product, setProduct] = useState("");
  const [showMap, setShowMap] = useState(true);
  const query = useQuery({
    queryKey: ["vendors", text, county, category, product],
    queryFn: async () => {
      const profile = await farmerProfileService.getProfile();
      const point: Coordinates | null = profile?.latitude !== null && profile?.latitude !== undefined && profile.longitude !== null
        ? { latitude: profile.latitude, longitude: profile.longitude }
        : null;
      return { point, vendors: await vendorService.list({ text, county, category, product }, point) };
    },
  });
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => { void query.refetch(); }} message={t("loadError")} />;
  const vendors = query.data?.vendors ?? [];
  return (
    <div className="space-y-5">
      <header><h1 className="text-2xl font-bold">{t("directoryTitle")}</h1><p className="mt-2 text-sm text-[var(--muted)]">{t("sampleLabel")}</p></header>
      <section className="panel grid gap-3 p-4 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block font-medium">{t("searchLabel")}</span><input value={text} onChange={(event) => setText(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
        <label className="block"><span className="mb-1 block font-medium">{t("countyFilter")}</span><input value={county} onChange={(event) => setCounty(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
        <label className="block"><span className="mb-1 block font-medium">{t("categoryFilter")}</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"><option value="">{t("allCategories")}</option>{["seeds", "feed", "fertiliser", "vaccines", "tools"].map((item) => <option key={item} value={item}>{t(`category.${item}`)}</option>)}</select></label>
        <label className="block"><span className="mb-1 block font-medium">{t("productFilter")}</span><input value={product} onChange={(event) => setProduct(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3" /></label>
        <button type="button" aria-pressed={showMap} onClick={() => setShowMap((value) => !value)} className="min-h-12 rounded-xl border border-[var(--border)] px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 sm:col-span-2">{showMap ? t("hideMap") : t("showMap")}</button>
      </section>
      {!vendors.length
        ? <EmptyState title={t("vendorsEmptyTitle")} text={t("vendorsEmptyText")} />
        : <div className={`grid items-start gap-4 ${showMap ? "lg:grid-cols-2" : ""}`}>
          {showMap && <section aria-label={t("mapAccessible")} className="space-y-2"><h2 className="font-semibold">{t("mapTitle")}</h2><VendorMapLoader farm={query.data?.point ?? null} vendors={vendors} locale={locale} farmLabel={t("farmPin")} /></section>}
          <section className="space-y-2"><h2 className="font-semibold">{t("vendorListTitle")}</h2><ul className="space-y-3">{vendors.map((vendor) => <VendorRow key={vendor.id} vendor={vendor} locale={locale} />)}</ul></section>
        </div>}
    </div>
  );
}

function OpeningHoursList({ vendor }: { vendor: Vendor }) {
  const t = useTranslations("business");
  return <dl className="grid gap-1 text-sm sm:grid-cols-2">{Array.from({ length: 7 }, (_, day) => {
    const interval = vendor.openingHours[day];
    return <div key={day} className="flex justify-between gap-3 rounded border border-[var(--border)] px-3 py-2"><dt>{t(`weekdays.${day}`)}</dt><dd>{interval ? `${interval.open}–${interval.close}` : t("closed")}</dd></div>;
  })}</dl>;
}

export function VendorProfileScreen() {
  const t = useTranslations("business");
  const locale = localeOf(useLocale());
  const params = useParams<{ id: string }>();
  const vendorId = params.id;
  const recordedView = useRef(false);
  const [eventError, setEventError] = useState(false);
  const query = useQuery({
    queryKey: ["vendor", vendorId],
    queryFn: async () => {
      const [vendor, products] = await Promise.all([vendorService.getById(vendorId), vendorService.getProducts(vendorId)]);
      return { vendor, products };
    },
    enabled: Boolean(vendorId),
  });
  useEffect(() => {
    if (!query.data?.vendor || recordedView.current) return;
    recordedView.current = true;
    void vendorService.recordEvent(vendorId, "view").catch(() => setEventError(true));
  }, [query.data?.vendor, vendorId]);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState onRetry={() => { recordedView.current = false; void query.refetch(); }} message={t("loadError")} />;
  const vendor = query.data?.vendor;
  if (!vendor) return <EmptyState title={t("vendorMissingTitle")} text={t("vendorMissingText")} />;
  const products = query.data?.products ?? [];
  return (
    <div className="space-y-5">
      <Link href="/app/agrovets" className="inline-flex min-h-11 items-center rounded-lg underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">{t("backToVendors")}</Link>
      <header><h1 className="text-2xl font-bold">{pickLocalized(vendor.name, locale)}</h1>{getDataMode() === "mock" && <p className="mt-2 text-sm text-[var(--muted)]">{t("sampleLabel")}</p>}</header>
      {eventError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{t("eventError")}</p>}
      <section className="panel space-y-4 p-4 sm:p-6">
        <p>{vendor.county}</p>
        <VendorFacts vendor={vendor} />
        <OpenStatus vendor={vendor} />
        {hoursKnown(vendor) && <><h2 className="font-semibold">{t("openingHours")}</h2><OpeningHoursList vendor={vendor} /></>}
        <p>{t("phoneLabel")}: {vendor.phone}</p>
        <ContactLinks vendor={vendor} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">{t("productsTitle")}</h2>
        {!products.length ? <EmptyState title={t("productsEmptyTitle")} text={t("productsEmptyText")} /> : <ul className="grid gap-3 sm:grid-cols-2">{products.map((product) => <li key={product.id} className="panel space-y-2 p-4">
          <h3 className="font-semibold">{pickLocalized(product.name, locale)}</h3>
          <p><ProductPrice amount={product.priceKES} unit={pickLocalized(product.unit, locale)} locale={locale} /></p>
          <p className="text-sm">{t("indicativePrice")}</p>
          <p>{t(`stock.${product.stockStatus}`)}</p>
        </li>)}</ul>}
      </section>
    </div>
  );
}
