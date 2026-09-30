"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge, Button, Field, LoadError, Notice, Panel, State, Table } from "@/components/ui";

type Product = {
  id: string;
  product_name: string;
  category: string;
  target_type: string;
  is_active: boolean;
};

const CATEGORIES = ["Fertilizer", "Pesticide", "Herbicide", "Fungicide", "Seed", "Animal Feed", "Veterinary Medicine"];

export default function ProductsPage() {
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fertilizer");
  const [target, setTarget] = useState("crop");
  const [saved, setSaved] = useState("");
  const query = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/admin/products") });
  const create = useMutation({
    mutationFn: () =>
      api("/admin/products", {
        method: "POST",
        body: JSON.stringify({
          product_name: name.trim(),
          category,
          target_type: target,
          is_active: true,
        }),
      }),
    onSuccess: () => {
      setSaved(`${name.trim()} added to the catalogue.`);
      setName("");
      client.invalidateQueries({ queryKey: ["products"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved("");
    if (name.trim().length < 2) return;
    create.mutate();
  }

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3 md:items-end">
          <Field label="Product name">
            <input
              className="field-input"
              placeholder="e.g. CAN fertilizer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={150}
              required
            />
          </Field>
          <Field label="Category">
            <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Used on">
            <select className="field-input" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="crop">Crop</option>
              <option value="livestock">Livestock</option>
            </select>
          </Field>
          <div className="md:col-span-3">
            <Button type="submit" disabled={create.isPending || name.trim().length < 2}>
              {create.isPending ? "Adding…" : "Add input"}
            </Button>
          </div>
        </form>
      </Panel>
      {saved ? <Notice>{saved}</Notice> : null}
      {create.isError ? <Notice tone="error">{(create.error as Error).message}</Notice> : null}
      {query.isLoading ? <State kind="loading" /> : null}
      {query.isError ? <LoadError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <Table
          caption="Inputs"
          emptyTitle="No inputs catalogued"
          headers={["Name", "Category", "Target", "Active"]}
          rows={query.data.map((row) => [
            row.product_name,
            row.category,
            row.target_type,
            <Badge key={row.id} tone={row.is_active ? "green" : "zinc"}>
              {row.is_active ? "Yes" : "No"}
            </Badge>,
          ])}
        />
      ) : null}
    </div>
  );
}
