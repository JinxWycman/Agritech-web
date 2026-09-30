"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, LoadError, Panel, Section, State } from "@/components/ui";

type Overview = {
  farmers_total: number;
  farmers_7d: number;
  by_size_class: Record<string, number>;
  active_paid_subscriptions: number;
  failed_payments_7d: number;
  requests_by_status: Record<string, number>;
  requests_aging_48h: number;
  advisories_active: number;
  market_prices_last_scraped_at: string | null;
  sms_sessions_open: number;
  health: { status: string; database: string; africas_talking_configured: boolean };
};

const BANDS = [
  { name: "Micro", hint: "Complimentary", accent: "stone" as const },
  { name: "Small", hint: "KES 50 / month", accent: "forest" as const },
  { name: "Medium", hint: "KES 150 / month", accent: "forest" as const },
  { name: "Large", hint: "Capped at KES 400", accent: "gold" as const },
];

export default function OverviewPage() {
  const query = useQuery({ queryKey: ["overview"], queryFn: () => api<Overview>("/admin/overview") });
  if (query.isLoading && !query.data) return <State kind="loading" />;
  if (query.isError && !query.data) {
    return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  }
  const data = query.data!;
  const mixTotal = BANDS.reduce((sum, band) => sum + (data.by_size_class[band.name] ?? 0), 0) || 1;
  const attention: { label: string; href?: string }[] = [];
  if (data.health.database === "error" || data.health.status === "degraded") {
    attention.push({ label: "Database check failed. Records on this desk may be incomplete." });
  }
  if (data.requests_aging_48h > 0) {
    attention.push({ label: `${data.requests_aging_48h} visit${data.requests_aging_48h === 1 ? "" : "s"} stuck over 48 hours`, href: "/admin/requests" });
  }
  if (data.failed_payments_7d > 0) {
    attention.push({ label: `${data.failed_payments_7d} failed payments this week`, href: "/admin/subscriptions" });
  }

  return (
    <div className="space-y-8">
      {attention.length ? (
        <Panel className="border-soil-400/40 bg-cream-50 p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soil-600">Needs a decision</p>
          <ul className="mt-3 space-y-2">
            {attention.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="text-sm font-medium text-forest-800 hover:underline">
                    {item.label} →
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-forest-800">{item.label}</p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel className="bg-forest-50/80 p-4 text-sm text-forest-900">
          Queue is clear. No stuck visits, no failed payments flagged this week.
        </Panel>
      )}

      <Section eyebrow="Today" title="What to work">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card
            title="Farms on record"
            value={data.farmers_total}
            hint={`${data.farmers_7d} joined in the last 7 days`}
            href="/admin/farmers"
          />
          <Card
            title="Visits waiting"
            value={data.requests_by_status.Pending ?? 0}
            hint={`${data.requests_aging_48h} older than 48 hours`}
            accent={(data.requests_aging_48h ?? 0) > 0 ? "rose" : "gold"}
            href="/admin/requests"
          />
          <Card
            title="Paid farms"
            value={data.active_paid_subscriptions}
            hint={`${data.failed_payments_7d} failed STK attempts / 7 days`}
            accent="gold"
            href="/admin/subscriptions"
          />
        </div>
      </Section>

      <Section
        eyebrow="Farm size mix"
        title="How the network is classified"
        action={
          <Link href="/admin/quotes" className="text-sm font-medium text-forest-700 hover:underline">
            Open quote desk →
          </Link>
        }
      >
        <Panel className="p-5">
          <div
            className="flex h-3 overflow-hidden rounded-full bg-stone-100"
            role="img"
            aria-label={BANDS.map((band) => `${band.name} ${data.by_size_class[band.name] ?? 0}`).join(", ")}
          >
            {BANDS.map((band) => {
              const count = data.by_size_class[band.name] ?? 0;
              const width = mixTotal ? (count / mixTotal) * 100 : 0;
              const colors = {
                Micro: "bg-stone-400",
                Small: "bg-forest-400",
                Medium: "bg-forest-700",
                Large: "bg-soil-500",
              } as const;
              return <span key={band.name} className={colors[band.name as keyof typeof colors]} style={{ width: `${width}%` }} />;
            })}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BANDS.map((band) => (
              <div key={band.name}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{band.name}</p>
                <p className="font-serif text-2xl text-stone-900">{data.by_size_class[band.name] ?? 0}</p>
                <p className="text-xs text-stone-500">{band.hint}</p>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section eyebrow="Channels">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            title="Open SMS / USSD"
            value={data.sms_sessions_open}
            hint="Live USSD and SMS conversations"
            accent="stone"
            href="/admin/sms-sessions"
          />
          <Card title="Live advisories" value={data.advisories_active} href="/admin/advisories" />
          <Card
            title="Last KAMIS pull"
            value={
              data.market_prices_last_scraped_at
                ? new Date(data.market_prices_last_scraped_at).toLocaleString("en-KE", { day: "numeric", month: "short" })
                : "Never"
            }
            accent="stone"
            href="/admin/market-prices"
          />
        </div>
      </Section>
    </div>
  );
}
