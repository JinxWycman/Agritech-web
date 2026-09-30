"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, LoadError, Notice, Pager, State, Table } from "@/components/ui";
import { kes } from "@/lib/format";

type Price = {
  id: string;
  market_name: string;
  average_price: number;
  unit: string;
  price_date: string;
};

const PAGE_SIZE = 20;

export default function MarketPricesPage() {
  const client = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [saved, setSaved] = useState("");
  const query = useQuery({ queryKey: ["prices"], queryFn: () => api<Price[]>("/admin/market-prices") });
  const scrape = useMutation({
    mutationFn: () => api<{ message?: string }>("/admin/market-prices/scrape", { method: "POST" }),
    onSuccess: (data) => {
      setSaved(data.message || "KAMIS prices updated.");
      setOffset(0);
      client.invalidateQueries({ queryKey: ["prices"] });
    },
  });
  const rows = query.data || [];
  const page = rows.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm text-stone-600">
          Pull today’s KAMIS day-and-price sheet so officers can quote farm-gate prices. This needs outbound network access to kamis.or.ke.
        </p>
        <Button onClick={() => scrape.mutate()} disabled={scrape.isPending}>
          {scrape.isPending ? "Pulling KAMIS…" : "Pull KAMIS prices"}
        </Button>
      </div>
      {saved ? <Notice>{saved}</Notice> : null}
      {scrape.isError ? <Notice tone="error">{(scrape.error as Error).message}</Notice> : null}
      {query.isLoading ? <State kind="loading" /> : null}
      {query.isError ? <LoadError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <div className="space-y-4">
          <Table
            caption="Market prices"
            emptyTitle="No market prices stored"
            headers={["Market", "Average", "Unit", "Date"]}
            rows={page.map((row) => [row.market_name, kes(row.average_price), row.unit, row.price_date])}
          />
          <Pager total={rows.length} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
        </div>
      ) : null}
    </div>
  );
}
