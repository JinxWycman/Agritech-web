"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/portal-state";
import { getDataMode } from "@/lib/data-mode";
import type { ExpertRequestRecord } from "@/lib/request-lifecycle";

export function useRequestInvalidation() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: ["lifecycle-requests"] });
    void client.invalidateQueries({ queryKey: ["farmer"] });
  };
}

export function RequestError({ retry }: { retry: () => void }) {
  const t = useTranslations();
  return <ErrorState onRetry={retry} message={getDataMode() === "mock" ? t("states.demoError") : t("states.notImplemented")} />;
}

export function StatusTracker({ request }: { request: ExpertRequestRecord }) {
  const t = useTranslations("requests");
  const steps = ["pending", "offered", "accepted", "completed"] as const;
  const display = ["unassigned", "escalated", "cancelled"].includes(request.status) ? "pending" : request.status;
  const current = Math.max(0, steps.indexOf(display as (typeof steps)[number]));
  return <ol aria-label={t("tracker")} className="grid grid-cols-4 gap-1">
    {steps.map((step, index) => <li key={step} className={`rounded-lg px-1 py-2 text-center text-xs ${index <= current ? "bg-forest-700 text-white" : "bg-[var(--surface-muted)] text-[var(--muted)]"}`}>{t(`status.${step}`)}</li>)}
  </ol>;
}

export function RequestSummary({ request }: { request: ExpertRequestRecord }) {
  const t = useTranslations("requests");
  const visible = ["unassigned", "escalated"].includes(request.status) ? "pending" : request.status;
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{request.referenceCode}</p><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-950">{t(`status.${visible}`)}</span></div><StatusTracker request={request} /></div>;
}
