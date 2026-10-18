"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DailyEngagement = { date: string; views: number; contacts: number };

/** Daily farmer views and contacts for one listing; one count axis, two series. */
export default function VendorEngagementChart({ data }: { data: DailyEngagement[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Daily profile views and contacts">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "var(--surface-muted)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          <Legend wrapperStyle={{ color: "var(--foreground)", fontSize: 12 }} />
          <Bar dataKey="views" name="Views" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="contacts" name="Contacts" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
