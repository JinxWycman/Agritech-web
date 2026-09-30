"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadError, Notice, Panel, State } from "@/components/ui";
import Link from "next/link";

type Detail = {
  id: string;
  full_name: string;
  phone_number: string;
  national_id_masked: string;
  national_id: string | null;
  county_name: string | null;
  acres: number;
  tlu_total: number;
  size_class: string | null;
  amount_kes: number | null;
  is_active: boolean;
  crops: { name: string | null; farm_size: number }[];
  livestock: { name: string | null; herd_size: number }[];
  requests: { id: string; status: string; issue_type: string }[];
};

const FARMER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function FarmerDetailPage() {
  const params = useParams<{ id: string }>();
  const client = useQueryClient();
  const [confirmOff, setConfirmOff] = useState(false);
  const farmerId = FARMER_ID.test(params.id || "") ? params.id : "";
  const query = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => api<Detail>(`/admin/farmers/${farmerId}`),
    enabled: Boolean(farmerId),
  });
  const toggle = useMutation({
    mutationFn: (is_active: boolean) =>
      api(`/admin/farmers/${farmerId}`, { method: "PATCH", body: JSON.stringify({ is_active }) }),
    onSuccess: () => {
      setConfirmOff(false);
      client.invalidateQueries({ queryKey: ["farmer", farmerId] });
      client.invalidateQueries({ queryKey: ["farmers"] });
    },
  });

  if (!farmerId) return <LoadError error={new Error("That farm file link is not valid.")} />;
  if (query.isLoading) return <State kind="loading" />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  const farmer = query.data!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl text-stone-900">{farmer.full_name}</h2>
          <p className="mt-1 text-sm text-stone-500">{farmer.phone_number} · {farmer.county_name || "No county"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {farmer.is_active && confirmOff ? (
            <>
              <Button variant="danger" disabled={toggle.isPending} onClick={() => toggle.mutate(false)}>
                {toggle.isPending ? "Saving…" : "Confirm deactivate"}
              </Button>
              <Button variant="ghost" disabled={toggle.isPending} onClick={() => setConfirmOff(false)}>
                Keep active
              </Button>
            </>
          ) : (
            <Button
              variant={farmer.is_active ? "ghost" : "primary"}
              disabled={toggle.isPending}
              onClick={() => (farmer.is_active ? setConfirmOff(true) : toggle.mutate(true))}
            >
              {toggle.isPending ? "Saving…" : farmer.is_active ? "Deactivate" : "Activate"}
            </Button>
          )}
        </div>
      </div>
      {toggle.isError ? <Notice tone="error">{(toggle.error as Error).message}</Notice> : null}
      {toggle.isSuccess ? (
        <Notice>{farmer.is_active ? "Farm record is active." : "Farm record is inactive."}</Notice>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Acres" value={farmer.acres.toFixed(1)} />
        <Card title="TLU" value={farmer.tlu_total} accent="gold" />
        <Card
          title="Quote class"
          value={farmer.size_class || "—"}
          hint={farmer.amount_kes != null ? `Monthly ${farmer.amount_kes === 0 ? "complimentary" : `KES ${farmer.amount_kes}`}` : "No live quote"}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="p-5 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Identity</p>
          <p className="mt-3">National ID (masked): {farmer.national_id_masked}</p>
          {farmer.national_id ? <p className="mt-1">Full ID: {farmer.national_id}</p> : null}
          <p className="mt-3">
            Status <Badge tone={farmer.is_active ? "green" : "zinc"}>{farmer.is_active ? "Active" : "Inactive"}</Badge>
          </p>
        </Panel>
        <Panel className="p-5 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Crops</p>
          <div className="mt-3 space-y-1">
            {farmer.crops.length ? farmer.crops.map((c) => (
              <p key={c.name}>{c.name} · {c.farm_size} acres</p>
            )) : <p className="text-stone-500">None recorded</p>}
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Livestock</p>
          <div className="mt-3 space-y-1">
            {farmer.livestock.length ? farmer.livestock.map((l) => (
              <p key={l.name}>{l.name} · {l.herd_size}</p>
            )) : <p className="text-stone-500">None recorded</p>}
          </div>
        </Panel>
        <Panel className="p-5 text-sm md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Visit history</p>
          {farmer.requests.length ? (
            <ul className="mt-3 divide-y divide-stone-100">
              {farmer.requests.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{row.issue_type}</span>
                  <Badge tone={row.status === "Completed" ? "green" : row.status === "Pending" ? "amber" : "zinc"}>
                    {row.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-stone-500">No expert visits on file.</p>
          )}
          <Link href="/admin/requests" className="mt-3 inline-block text-sm font-medium text-forest-700 hover:underline">
            Open field visits →
          </Link>
        </Panel>
      </div>
    </div>
  );
}
