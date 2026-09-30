"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { LoadError, Pager, State, Table } from "@/components/ui";
import { humanize, when } from "@/lib/format";

const PAGE_SIZE = 20;

export default function AuditPage() {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["audit", offset],
    queryFn: () => api<Page<Record<string, string | null>>>(`/admin/audit?limit=${PAGE_SIZE}&offset=${offset}`),
  });
  if (query.isLoading) return <State kind="loading" />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-4">
      <Table
        caption="Audit trail"
        emptyTitle="No staff actions recorded"
        emptyHint="Publishing advisories, changing farms, and visit decisions write a row here."
        headers={["When", "Action", "Record", "Actor"]}
        rows={(query.data?.items || []).map((row) => [
          when(row.created_at),
          humanize(row.action),
          `${humanize(row.entity)} ${row.entity_id ? String(row.entity_id).slice(0, 8) : ""}`.trim(),
          row.actor_id ? String(row.actor_id).slice(0, 8) : "—",
        ])}
      />
      <Pager total={query.data?.total ?? 0} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
    </div>
  );
}
