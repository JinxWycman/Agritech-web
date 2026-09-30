"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, LoadError, Pager, State, Table } from "@/components/ui";
import { humanize, statusTone, when } from "@/lib/format";

const PAGE_SIZE = 20;

export default function SmsSessionsPage() {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["sms", offset],
    queryFn: () =>
      api<Page<Record<string, string | boolean | null>>>(`/admin/sms-sessions?limit=${PAGE_SIZE}&offset=${offset}`),
  });
  if (query.isLoading) return <State kind="loading" />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="space-y-4">
      <Table
        caption="USSD and SMS sessions"
        emptyTitle="No USSD or SMS sessions"
        emptyHint="Sessions appear when a farmer dials the service code or texts the short code."
        headers={["Farmer", "Flow", "Status", "Started"]}
        rows={(query.data?.items || []).map((row) => [
          String(row.farmer_name || row.farmer_id),
          humanize(String(row.session_type)),
          <Badge key={String(row.id)} tone={statusTone(String(row.session_status))}>
            {humanize(String(row.session_status))}
          </Badge>,
          when(typeof row.created_at === "string" ? row.created_at : null),
        ])}
      />
      <Pager total={query.data?.total ?? 0} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
    </div>
  );
}
