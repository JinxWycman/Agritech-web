"use client";

import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketPrice } from "@/types/market";
import { formatDate, formatKes } from "@/lib/format";

export default function MarketPriceChart({ history }: { history: MarketPrice[] }) {
  const t = useTranslations("market");
  const locale = useLocale();
  const data = history.map((item) => ({
week: formatDate(item.observedAt, locale, { month: "short", day: "numeric" }),
    price: item.pricePerUnit,
  }));
  return (
    <figure aria-label={t("chartLabel")} className="panel p-3">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="week" tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis width={76} tickFormatter={(value: number) => formatKes(Number(value), locale)} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip formatter={(value) => formatKes(Number(value), locale)} />
            <Line type="monotone" dataKey="price" name={t("pricePerUnit")} stroke="#166534" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{t("chartLabel")}</figcaption>
    </figure>
  );
}
