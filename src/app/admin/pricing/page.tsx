"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge, LoadError, Panel, State } from "@/components/ui";

type Rule = {
  version: number;
  is_active: boolean;
  bands: { name: string; min_acres: number; max_acres: number | null; kes: number }[];
};

export default function PricingPage() {
  const query = useQuery({
    queryKey: ["pricing"],
    queryFn: () => api<{ items: Rule[] }>("/admin/pricing"),
  });
  if (query.isLoading) return <State kind="loading" />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  const rules = query.data?.items || [];
  if (!rules.length) {
    return <State kind="empty" title="No pricing bands" text="Active acre and TLU bands are seeded by migration. Check that the database is upgraded." />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rules.map((rule) => (
        <Panel key={rule.version} className="p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="font-medium text-stone-900">Version {rule.version}</p>
            {rule.is_active ? <Badge tone="green">Active</Badge> : <Badge>Superseded</Badge>}
          </div>
          <ul className="space-y-2">
            {rule.bands.map((band) => (
              <li key={band.name} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm">
                <span className="font-medium text-stone-800">{band.name}</span>
                <span className="text-stone-500">
                  {band.min_acres}–{band.max_acres ?? "∞"} acres
                </span>
                <span className="font-serif text-lg text-forest-800">KES {band.kes}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
