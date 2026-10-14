"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge, Button, Field, LoadError, Notice, Panel, State, Table } from "@/components/ui";

type Advisory = {
  id: string;
  title: string;
  category: string;
  county_id: string | null;
  is_active: boolean;
};

const CATEGORIES = ["General", "Crop", "Livestock"];

export default function AdvisoriesPage() {
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [saved, setSaved] = useState(false);
  const query = useQuery({
    queryKey: ["advisories"],
    queryFn: () => api<Advisory[]>("/admin/advisories"),
  });
  const create = useMutation({
    mutationFn: () =>
      api("/admin/advisories", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), category, message: message.trim(), is_active: true }),
      }),
    onSuccess: () => {
      setTitle("");
      setMessage("");
      setSaved(true);
      client.invalidateQueries({ queryKey: ["advisories"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    create.mutate();
  }

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                className="field-input"
                placeholder="e.g. Fall armyworm watch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={3}
                maxLength={200}
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
          </div>
          <Field label="Message">
            <textarea
              className="field-input min-h-28"
              placeholder="What farmers should know"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={10}
              required
            />
          </Field>
          <div>
            <Button type="submit" disabled={create.isPending || title.trim().length < 3 || message.trim().length < 10}>
              {create.isPending ? "Publishing…" : "Publish national advisory"}
            </Button>
          </div>
        </form>
      </Panel>
      {saved ? <Notice>Advisory published.</Notice> : null}
      {create.isError ? <Notice tone="error">{(create.error as Error).message}</Notice> : null}
      {query.isLoading ? <State kind="loading" /> : null}
      {query.isError ? <LoadError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <Table
          caption="Advisories"
          emptyTitle="No advisories published"
          headers={["Title", "Category", "Scope", "Active"]}
          rows={query.data.map((row) => [
            row.title,
            row.category,
            row.county_id ? "County" : "National",
            <Badge key={row.id} tone={row.is_active ? "green" : "zinc"}>
              {row.is_active ? "Live" : "Off"}
            </Badge>,
          ])}
        />
      ) : null}
    </div>
  );
}
