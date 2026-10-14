"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, LoadError, Pager, State, Table } from "@/components/ui";
import { kes, when } from "@/lib/format";

const PAGE_SIZE = 20;

export default function SubscriptionsPage() {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["subscriptions", offset],
    queryFn: () =>
      api<Page<Record<string, string | number | boolean | null>>>(
        `/admin/subscriptions?limit=${PAGE_SIZE}&offset=${offset}`,
      ),
  });
  if (query.isLoading) return <State kind="loading" />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-4">
      <Table
        caption="Subscriptions"
        emptyTitle="No subscriptions yet"
        headers={["Farmer", "Class", "Monthly", "Access", "Ends"]}
        rows={(query.data?.items || []).map((row) => [
          String(row.farmer_name || row.farmer_id),
          String(row.size_class || row.plan_name || "—"),
          kes(row.amount_kes as number | null),
          <Badge key={String(row.id)} tone={row.is_active ? "green" : "zinc"}>
            {row.is_active ? "Active" : "Ended"}
          </Badge>,
          when(typeof row.end_date === "string" ? row.end_date : null),
        ])}
      />
      <Pager total={query.data?.total ?? 0} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
    </div>
  );
}
