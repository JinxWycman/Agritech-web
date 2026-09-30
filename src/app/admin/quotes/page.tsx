"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, Button, Card, Field, LoadError, Notice, Pager, Panel, Section, State, Table } from "@/components/ui";
import { kes, statusTone, when } from "@/lib/format";

type Preview = {
  acres: number;
  tlu_total: number;
  crop_class: string;
  livestock_class: string;
  size_class: string;
  monthly_kes: number;
  sms_text: string;
};

type Quote = {
  id: string;
  farmer_id: string;
  size_class: string;
  amount_kes: number;
  status: string;
  acres_used: number;
  tlu_used?: number;
  created_at?: string;
};

const PAGE_SIZE = 20;

function whole(value: string) {
  return /^\d+$/.test(value.trim());
}

export default function QuotesPage() {
  const [acres, setAcres] = useState("2");
  const [cattle, setCattle] = useState("0");
  const [goats, setGoats] = useState("0");
  const [sheep, setSheep] = useState("0");
  const [poultry, setPoultry] = useState("0");
  const [formError, setFormError] = useState("");
  const [offset, setOffset] = useState(0);
  const quotes = useQuery({
    queryKey: ["quotes", offset],
    queryFn: () => api<Page<Quote>>(`/admin/quotes?limit=${PAGE_SIZE}&offset=${offset}`),
  });
  const preview = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams({ acres, cattle, goats, sheep, poultry });
      return api<Preview>(`/admin/quotes/preview?${params}`);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const acresValue = Number(acres);
    if (!Number.isFinite(acresValue) || acresValue < 0) {
      setFormError("Acres must be a number that is zero or greater.");
      return;
    }
    if (![cattle, goats, sheep, poultry].every(whole)) {
      setFormError("Cattle, goats, sheep, and poultry must be whole numbers.");
      return;
    }
    setFormError("");
    preview.mutate();
  }

  return (
    <div className="space-y-8">
      <Panel className="p-5 md:p-6">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:items-end">
          <Field label="Acres">
            <input className="field-input" value={acres} onChange={(e) => setAcres(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Cattle">
            <input className="field-input" value={cattle} onChange={(e) => setCattle(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Goats">
            <input className="field-input" value={goats} onChange={(e) => setGoats(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Sheep">
            <input className="field-input" value={sheep} onChange={(e) => setSheep(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Poultry">
            <input className="field-input" value={poultry} onChange={(e) => setPoultry(e.target.value)} inputMode="numeric" />
          </Field>
          <Button type="submit" disabled={preview.isPending}>
            {preview.isPending ? "Sizing…" : "Preview quote"}
          </Button>
        </form>
        {formError ? (
          <div className="mt-4">
            <Notice tone="error">{formError}</Notice>
          </div>
        ) : null}
      </Panel>

      {!preview.data && !preview.isError ? (
        <State kind="empty" title="No quote preview yet" text="Enter acres and livestock above." />
      ) : null}

      {preview.data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card
            title="Size class"
            value={preview.data.size_class}
            hint={`Crop ${preview.data.crop_class} · Livestock ${preview.data.livestock_class}`}
          />
          <Card
            title="Monthly fee"
            value={kes(preview.data.monthly_kes)}
            hint={`${preview.data.acres} acres · ${preview.data.tlu_total} TLU`}
            accent="gold"
          />
          <Panel className="bg-forest-950 p-5 text-cream-50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-200">SMS</p>
            <p className="mt-3 text-sm leading-relaxed text-cream-100">{preview.data.sms_text}</p>
          </Panel>
        </div>
      ) : null}
      {preview.isError ? <LoadError error={preview.error} onRetry={() => preview.mutate()} /> : null}

      <Section title="Recent quotes">
        {quotes.isLoading && !quotes.data ? <State kind="loading" /> : null}
        {quotes.isError && !quotes.data ? <LoadError error={quotes.error} onRetry={() => quotes.refetch()} /> : null}
        {quotes.data ? (
          <div className="space-y-4">
            <Table
              caption="Recent quotes"
              emptyTitle="No quotes yet"
              headers={["When", "Class", "Fee", "Acres", "Status"]}
              rows={quotes.data.items.map((row) => [
                when(row.created_at),
                row.size_class,
                kes(row.amount_kes),
                row.acres_used,
                <Badge key={row.id} tone={statusTone(row.status)}>
                  {row.status.replace(/_/g, " ")}
                </Badge>,
              ])}
            />
            <Pager total={quotes.data.total} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
          </div>
        ) : null}
      </Section>
    </div>
  );
}
