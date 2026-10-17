"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, Button, LoadError, Notice, Pager, Panel, State } from "@/components/ui";
import { when } from "@/lib/format";

export type StaffRequest = {
  id: string;
  farmer_id?: string;
  expert_id: string | null;
  farmer_name: string | null;
  farmer_phone: string | null;
  county_name: string | null;
  expert_name: string | null;
  issue_type: string;
  description: string;
  status: string;
  preferred_visit_date: string | null;
};

const TONE: Record<string, string> = {
  Pending: "amber",
  Accepted: "blue",
  Completed: "green",
  Cancelled: "zinc",
};

const FILTERS = ["All", "Pending", "Accepted", "Completed", "Cancelled"] as const;
const PAGE_SIZE = 20;

function nextAction(status: string, officer: boolean) {
  if (status === "Pending") return officer ? "Accept this visit" : "Accept visit";
  if (status === "Accepted") return "Mark complete";
  return "Review";
}

export function RequestBoard({ perspective = "admin" }: { perspective?: "admin" | "officer" }) {
  const client = useQueryClient();
  const [open, setOpen] = useState<StaffRequest | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [offset, setOffset] = useState(0);
  const [notice, setNotice] = useState("");
  const officer = perspective === "officer";
  const query = useQuery({
    queryKey: ["requests", filter, offset],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (filter !== "All") params.set("status", filter);
      return api<Page<StaffRequest>>(`/admin/expert-requests?${params}`);
    },
  });
  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/admin/expert-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requests"] });
      client.invalidateQueries({ queryKey: ["officer-queue"] });
      setOpen(null);
      setNotice(variables.status === "Cancelled" ? "Visit cancelled." : `Visit marked ${variables.status.toLowerCase()}.`);
    },
  });

  if (query.isLoading && !query.data) return <State kind="loading" />;
  if (query.isError && !query.data) return <LoadError error={query.error} onRetry={() => query.refetch()} />;

  const items = query.data?.items || [];
  const total = query.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="nav-scroll flex gap-1 overflow-x-auto" role="group" aria-label="Filter visits">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={filter === name}
            onClick={() => {
              setFilter(name);
              setOffset(0);
              setOpen(null);
            }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 ${
              filter === name ? "bg-forest-800 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      {notice ? <Notice>{notice}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">Field visits</caption>
                <thead className="sticky top-0 bg-cream-50 text-[11px] uppercase tracking-[0.12em] text-stone-500">
                  <tr>
                    {["Farmer", "County", "Issue", "Status", "Next"].map((header) => (
                      <th key={header} scope="col" className="px-4 py-3 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.length ? (
                    items.map((row) => (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        aria-selected={open?.id === row.id}
                        className={`cursor-pointer transition hover:bg-cream-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest-600 ${open?.id === row.id ? "bg-forest-50" : ""}`}
                        onClick={() => setOpen(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setOpen(row);
                          }
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{row.farmer_name || "Unnamed farmer"}</p>
                          <p className="text-xs text-stone-500">{row.farmer_phone || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{row.county_name || "—"}</td>
                        <td className="px-4 py-3">{row.issue_type}</td>
                        <td className="px-4 py-3">
                          <Badge tone={TONE[row.status]}>{row.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-medium text-forest-800">
                          {nextAction(row.status, officer)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-10" colSpan={5}>
                        <State
                          kind="empty"
                          title={officer ? "No visits in this filter" : "No field visits in this filter"}
                          text={
                            officer
                              ? "When a farmer requests an expert, it lands here for you to accept."
                              : "When a farmer requests an expert, the visit lands here."
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          <Pager total={total} limit={PAGE_SIZE} offset={offset} onOffset={setOffset} />
        </div>

        {open ? (
          <Panel className="h-fit p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-stone-900">{open.farmer_name || "Unnamed farmer"}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {open.farmer_phone || "No phone"} · {open.county_name || "County unknown"}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setOpen(null)}>
                Close
              </Button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Issue</dt>
                <dd className="mt-1">{open.issue_type}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">What the farmer said</dt>
                <dd className="mt-1 leading-relaxed">{open.description}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Preferred visit</dt>
                <dd className="mt-1">{when(open.preferred_visit_date)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Officer</dt>
                <dd className="mt-1">{open.expert_name || "Unassigned"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {open.status === "Pending" && (!officer || open.expert_id !== null) ? (
                <Button disabled={patch.isPending} onClick={() => patch.mutate({ id: open.id, status: "Accepted" })}>
                  {patch.isPending ? "Saving…" : officer ? "Accept this visit" : "Accept visit"}
                </Button>
              ) : null}
              {open.status === "Accepted" ? (
                <Button disabled={patch.isPending} onClick={() => patch.mutate({ id: open.id, status: "Completed" })}>
                  {patch.isPending ? "Saving…" : "Mark visit complete"}
                </Button>
              ) : null}
              {open.status === "Pending" || open.status === "Accepted" ? (
                <Button
                  variant="danger"
                  disabled={patch.isPending}
                  onClick={() => patch.mutate({ id: open.id, status: "Cancelled" })}
                >
                  Cancel visit
                </Button>
              ) : null}
            </div>
            {patch.isError ? (
              <div className="mt-3">
                <Notice tone="error">{(patch.error as Error).message}</Notice>
              </div>
            ) : null}
          </Panel>
        ) : (
          <Panel className="hidden h-fit p-8 text-center text-sm text-stone-500 lg:block">
            Select a visit to see the farm, issue, and the next action.
          </Panel>
        )}
      </div>
    </div>
  );
}
