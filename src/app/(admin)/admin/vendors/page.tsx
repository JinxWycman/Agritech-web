"use client";

import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, listCounties, type Page } from "@/lib/api";
import { Badge, Button, Field, LoadError, Notice, Panel, State, Table } from "@/components/ui";
import type { DailyEngagement } from "@/components/vendor-engagement-chart";

const EngagementChart = dynamic(() => import("@/components/vendor-engagement-chart"), { ssr: false });

const CATEGORIES = ["seeds", "feed", "fertiliser", "vaccines", "tools", "agrochemicals", "vet_drugs", "livestock"];

type AdminVendor = {
  id: string; name: string; county: string | null; address: string; phone: string | null; whatsapp: string | null;
  certified: boolean; sponsored: boolean; categories: string[]; opening_hours_text: string | null; product_count: number;
};
type AdminProduct = { id: string; name: string; category: string; price_kes: number | null; unit: string; stock_status: string };
type Report = {
  views: number; contacts: number; calls: number; whatsapp: number; directions: number;
  unique_farmers: number; contact_rate: number | null; daily: DailyEngagement[];
};
type Ranking = { vendor_id: string; name: string; county: string | null; sponsored: boolean; views: number; contacts: number };

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-[var(--border)] p-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
  </div>;
}

function VendorReportCard({ vendor }: { vendor: AdminVendor }) {
  const [days, setDays] = useState(30);
  const report = useQuery({ queryKey: ["admin-vendor-report", vendor.id, days], queryFn: () => api<Report>(`/admin/vendors/${vendor.id}/report?days=${days}`) });
  return <Panel className="space-y-4 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Listing report · {vendor.name}</h2>
      <select className="field-input w-auto" value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Report period">
        {[7, 30, 90].map((value) => <option key={value} value={value}>Last {value} days</option>)}
      </select>
    </div>
    {report.isLoading ? <State kind="loading" /> : report.isError ? <LoadError error={report.error} onRetry={() => void report.refetch()} /> : report.data && <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Profile views" value={report.data.views} />
        <Stat label="Contacts" value={report.data.contacts} />
        <Stat label="Unique farmers" value={report.data.unique_farmers} />
        <Stat label="Contact rate" value={report.data.contact_rate === null ? "—" : `${Math.round(report.data.contact_rate * 100)}%`} />
      </div>
      <p className="text-sm text-stone-600">Calls {report.data.calls} · WhatsApp {report.data.whatsapp} · Directions {report.data.directions}</p>
      {report.data.daily.length ? <EngagementChart data={report.data.daily} /> : <State kind="empty" title="No farmer activity in this period" />}
    </>}
  </Panel>;
}

function VendorProducts({ vendor }: { vendor: AdminVendor }) {
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("seeds");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("");
  const key = ["admin-vendor-products", vendor.id];
  const products = useQuery({ queryKey: key, queryFn: () => api<AdminProduct[]>(`/admin/vendors/${vendor.id}/products`) });
  const refresh = () => { void client.invalidateQueries({ queryKey: key }); void client.invalidateQueries({ queryKey: ["admin-vendors"] }); };
  const create = useMutation({
    mutationFn: () => api(`/admin/vendors/${vendor.id}/products`, { method: "POST", body: JSON.stringify({
      product_name: name.trim(), category, unit: unit.trim(),
      price_kes: price === "" ? null : Number(price), stock_quantity: stock === "" ? null : Number(stock),
    }) }),
    onSuccess: () => { setName(""); setPrice(""); setUnit(""); setStock(""); refresh(); },
  });
  const update = useMutation({
    mutationFn: ({ id, stock_quantity }: { id: string; stock_quantity: number }) => api(`/admin/vendor-products/${id}`, { method: "PATCH", body: JSON.stringify({ stock_quantity }) }),
    onSuccess: refresh,
  });
  const remove = useMutation({ mutationFn: (id: string) => api(`/admin/vendor-products/${id}`, { method: "DELETE" }), onSuccess: refresh });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length >= 2 && unit.trim()) create.mutate();
  }
  return <Panel className="space-y-4 p-5">
    <h2 className="text-lg font-semibold">Products · {vendor.name}</h2>
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-6 md:items-end">
      <Field label="Product" className="md:col-span-2"><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. DH04 maize seed" /></Field>
      <Field label="Category"><select className="field-input" value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Price (KES)"><input className="field-input" type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} /></Field>
      <Field label="Unit"><input className="field-input" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="2 kg pack" /></Field>
      <Field label="Stock"><input className="field-input" type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} /></Field>
      <Button type="submit" disabled={create.isPending} className="md:col-span-6 md:w-auto">Add product</Button>
    </form>
    {create.isError && <LoadError error={create.error} />}
    {(update.isError || remove.isError) && <LoadError error={update.error ?? remove.error} />}
    {products.isLoading ? <State kind="loading" /> : products.isError ? <LoadError error={products.error} onRetry={() => void products.refetch()} /> : <Table
      headers={["Product", "Category", "Price", "Stock", ""]}
      emptyTitle="No products listed"
      emptyHint="Farmers only see where to buy a recommended variety when its product is listed here."
      rows={(products.data ?? []).map((product) => [
        product.name,
        product.category,
        product.price_kes === null ? "On request" : `KES ${product.price_kes.toLocaleString()} / ${product.unit}`,
        <Badge key="s" tone={product.stock_status === "in_stock" ? "green" : product.stock_status === "low_stock" ? "amber" : product.stock_status === "out_of_stock" ? "red" : "zinc"}>{product.stock_status.replace(/_/g, " ")}</Badge>,
        <span key="a" className="flex gap-2">
          <Button variant="ghost" onClick={() => { const value = window.prompt("New stock quantity", ""); if (value !== null && value !== "" && Number(value) >= 0) update.mutate({ id: product.id, stock_quantity: Number(value) }); }}>Set stock</Button>
          <Button variant="danger" onClick={() => { if (window.confirm(`Remove ${product.name}?`)) remove.mutate(product.id); }}>Remove</Button>
        </span>,
      ])}
    />}
  </Panel>;
}

function NewVendorForm({ onCreated }: { onCreated: () => void }) {
  const counties = useQuery({ queryKey: ["counties"], queryFn: listCounties, staleTime: Infinity });
  const [form, setForm] = useState({ name: "", county_id: "", address: "", contact_phone: "", whatsapp_phone: "", opening_hours: "", latitude: "", longitude: "" });
  const [categories, setCategories] = useState<string[]>([]);
  const set = (field: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const create = useMutation({
    mutationFn: () => api("/admin/vendors", { method: "POST", body: JSON.stringify({
      name: form.name.trim(), county_id: form.county_id, address: form.address.trim(), categories,
      contact_phone: form.contact_phone || null, whatsapp_phone: form.whatsapp_phone || null, opening_hours: form.opening_hours || null,
      latitude: form.latitude === "" ? null : Number(form.latitude), longitude: form.longitude === "" ? null : Number(form.longitude),
    }) }),
    onSuccess: () => { setForm({ name: "", county_id: "", address: "", contact_phone: "", whatsapp_phone: "", opening_hours: "", latitude: "", longitude: "" }); setCategories([]); onCreated(); },
  });
  return <Panel className="p-5">
    <h2 className="mb-4 text-lg font-semibold">Add an agrovet</h2>
    <form onSubmit={(event) => { event.preventDefault(); if (form.name.trim().length >= 2 && form.county_id && form.address.trim().length >= 2) create.mutate(); }} className="grid gap-3 md:grid-cols-3">
      <Field label="Name"><input className="field-input" value={form.name} onChange={set("name")} required /></Field>
      <Field label="County"><select className="field-input" value={form.county_id} onChange={set("county_id")} required><option value="">Choose</option>{counties.data?.map((county) => <option key={county.id} value={county.id}>{county.name}</option>)}</select></Field>
      <Field label="Address"><input className="field-input" value={form.address} onChange={set("address")} required /></Field>
      <Field label="Phone"><input className="field-input" value={form.contact_phone} onChange={set("contact_phone")} placeholder="+2547…" /></Field>
      <Field label="WhatsApp"><input className="field-input" value={form.whatsapp_phone} onChange={set("whatsapp_phone")} placeholder="+2547…" /></Field>
      <Field label="Opening hours" hint="e.g. Mon-Fri 8:00-17:00; Sat 9:00-13:00"><input className="field-input" value={form.opening_hours} onChange={set("opening_hours")} /></Field>
      <Field label="Latitude"><input className="field-input" type="number" step="any" value={form.latitude} onChange={set("latitude")} /></Field>
      <Field label="Longitude"><input className="field-input" type="number" step="any" value={form.longitude} onChange={set("longitude")} /></Field>
      <fieldset className="md:col-span-3"><legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Categories</legend>
        <div className="flex flex-wrap gap-2">{CATEGORIES.map((item) => <label key={item} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-sm">
          <input type="checkbox" checked={categories.includes(item)} onChange={(event) => setCategories((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))} />{item}
        </label>)}</div>
      </fieldset>
      <Button type="submit" disabled={create.isPending} className="md:col-span-3 md:w-auto">Add agrovet</Button>
      {create.isError && <div className="md:col-span-3"><LoadError error={create.error} /></div>}
    </form>
  </Panel>;
}

export default function AdminVendorsPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminVendor | null>(null);
  const [notice, setNotice] = useState("");
  const vendors = useQuery({ queryKey: ["admin-vendors", search], queryFn: () => api<Page<AdminVendor>>(`/admin/vendors?limit=100${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ""}`) });
  const rankings = useQuery({ queryKey: ["admin-vendor-rankings"], queryFn: () => api<Ranking[]>("/admin/vendor-reports?days=30&limit=5") });
  const toggle = useMutation({
    mutationFn: ({ vendor, field }: { vendor: AdminVendor; field: "sponsored" | "certified" }) =>
      api<AdminVendor>(`/admin/vendors/${vendor.id}`, { method: "PATCH", body: JSON.stringify({ [field]: !vendor[field] }) }),
    onSuccess: (updated) => {
      setNotice(`${updated.name} updated.`);
      setSelected((current) => (current?.id === updated.id ? updated : current));
      void client.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
  });

  return <div className="space-y-5">
    <header>
      <h1 className="text-2xl font-bold">Agrovet listings</h1>
      <p className="mt-1 text-sm text-stone-600">Sponsored listings appear first in the farmer directory and are always labelled “Sponsored”.</p>
    </header>
    {notice && <Notice>{notice}</Notice>}
    {toggle.isError && <LoadError error={toggle.error} />}

    <Panel className="p-5">
      <h2 className="mb-3 text-lg font-semibold">Top agrovets · last 30 days</h2>
      {rankings.isLoading ? <State kind="loading" /> : rankings.isError ? <LoadError error={rankings.error} /> : rankings.data?.length
        ? <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{rankings.data.map((row, index) => <li key={row.vendor_id} className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs text-stone-500">#{index + 1}{row.sponsored ? " · Sponsored" : ""}</p>
            <p className="font-semibold">{row.name}</p>
            <p className="text-sm tabular-nums">{row.contacts} contacts · {row.views} views</p>
          </li>)}</ol>
        : <State kind="empty" title="No farmer activity yet" text="Views and contacts appear here once farmers open agrovet profiles." />}
    </Panel>

    <NewVendorForm onCreated={() => { setNotice("Agrovet added."); void client.invalidateQueries({ queryKey: ["admin-vendors"] }); }} />

    <Panel className="space-y-3 p-5">
      <Field label="Search agrovets"><input className="field-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, ward or town" /></Field>
      {vendors.isLoading ? <State kind="loading" /> : vendors.isError ? <LoadError error={vendors.error} onRetry={() => void vendors.refetch()} /> : <Table
        headers={["Agrovet", "County", "Listing", "Products", ""]}
        emptyTitle="No agrovets found"
        rows={(vendors.data?.items ?? []).map((vendor) => [
          <span key="n"><span className="font-medium">{vendor.name}</span><br /><span className="text-xs text-stone-500">{vendor.phone ?? "No phone"}</span></span>,
          vendor.county ?? "—",
          <span key="b" className="flex flex-wrap gap-1">{vendor.sponsored && <Badge tone="amber">Sponsored</Badge>}{vendor.certified && <Badge tone="green">Certified</Badge>}</span>,
          vendor.product_count,
          <span key="a" className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setSelected(vendor)}>Manage</Button>
            <Button variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ vendor, field: "sponsored" })}>{vendor.sponsored ? "Unsponsor" : "Sponsor"}</Button>
            <Button variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ vendor, field: "certified" })}>{vendor.certified ? "Uncertify" : "Certify"}</Button>
          </span>,
        ])}
      />}
    </Panel>

    {selected && <>
      <VendorReportCard vendor={selected} />
      <VendorProducts vendor={selected} />
    </>}
  </div>;
}
