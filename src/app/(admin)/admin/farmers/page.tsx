"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, Field, LoadError, Pager, Panel, State, Table } from "@/components/ui";
import { kes } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";

type Farmer = {
  id: string;
  full_name: string;
  phone_number: string;
  national_id_masked: string;
  county_name: string | null;
  acres: number;
  size_class: string | null;
  amount_kes: number | null;
  is_active: boolean;
};

const PAGE_SIZE = 20;

export default function FarmersPage() {
  const [search, setSearch] = useState("");
  const [sizeClass, setSizeClass] = useState("");
  const [active, setActive] = useState("");
  const [offset, setOffset] = useState(0);
  const deferredSearch = useDebounced(search.trim());
  useEffect(() => {
    setOffset(0);
  }, [deferredSearch, sizeClass, active]);

  const query = useQuery({
    queryKey: ["farmers", deferredSearch, sizeClass, active, offset],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (deferredSearch) params.set("search", deferredSearch);
      if (sizeClass) params.set("size_class", sizeClass);
      if (active) params.set("is_active", active);
      return api<Page<Farmer>>(`/admin/farmers?${params}`);
    },
  });

  return (
    <div className="space-y-5">
      <Panel className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px] lg:items-end">
        <Field label="Find a farm" hint="Name or Kenyan mobile number">
          <input
            className="field-input"
            placeholder="e.g. 0712… or Wanjiku"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Size class">
          <select className="field-input" value={sizeClass} onChange={(e) => setSizeClass(e.target.value)}>
            <option value="">All classes</option>
            {["Micro", "Small", "Medium", "Large"].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <Field label="Record">
          <select className="field-input" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">All records</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </Field>
      </Panel>
      {query.isLoading && !query.data ? <State kind="loading" /> : null}
      {query.isError && !query.data ? <LoadError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <>
          <p className="text-xs font-medium text-stone-500">
            {query.data.total} farm{query.data.total === 1 ? "" : "s"} in this view
          </p>
          <Table
            caption="Farm registry"
            emptyTitle="No farms in this filter"
            headers={["Farmer", "County", "Land", "Class", "Fee", "Record"]}
            rows={query.data.items.map((row) => [
              <div key="n" className="min-w-40">
                <p className="font-medium text-stone-900">{row.full_name}</p>
                <p className="text-xs text-stone-500">{row.phone_number}</p>
              </div>,
              row.county_name || "—",
              `${row.acres.toFixed(1)} ac`,
              row.size_class ? <Badge key="c">{row.size_class}</Badge> : "—",
              <span key="k">{row.is_active ? kes(row.amount_kes) : "—"}</span>,
              <span key="a" className="inline-flex items-center gap-2">
                <Badge tone={row.is_active ? "green" : "zinc"}>{row.is_active ? "Active" : "Inactive"}</Badge>
                <Link className="font-medium text-forest-700 hover:underline" href={`/admin/farmers/${row.id}`}>
                  Open file
                </Link>
              </span>,
            ])}
          />
          <Pager total={query.data.total} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
        </>
      ) : null}
    </div>
  );
}
