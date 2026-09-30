"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, type Page } from "@/lib/api";
import { Badge, Button, Card, LoadError, Panel, Section, State } from "@/components/ui";
import type { StaffRequest } from "@/components/request-board";

type Queue = {
  pending: Page<StaffRequest>;
  accepted: Page<StaffRequest>;
  completed: Page<StaffRequest>;
};

export default function OfficerOverviewPage() {
  const query = useQuery({
    queryKey: ["officer-queue"],
    queryFn: async (): Promise<Queue> => {
      const [pending, accepted, completed] = await Promise.all([
        api<Page<StaffRequest>>("/admin/expert-requests?status=Pending&limit=6&offset=0"),
        api<Page<StaffRequest>>("/admin/expert-requests?status=Accepted&limit=6&offset=0"),
        api<Page<StaffRequest>>("/admin/expert-requests?status=Completed&limit=1&offset=0"),
      ]);
      return { pending, accepted, completed };
    },
  });
  if (query.isLoading && !query.data) return <State kind="loading" />;
  if (query.isError && !query.data) {
    return <LoadError error={query.error} onRetry={() => query.refetch()} />;
  }
  const pending = query.data?.pending;
  const accepted = query.data?.accepted;
  const completed = query.data?.completed;
  const upNext = [...(pending?.items || []), ...(accepted?.items || [])].slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Waiting for you" value={pending?.total ?? 0} hint="Accept if you can travel" accent="gold" href="/officer/requests" />
        <Card title="On your calendar" value={accepted?.total ?? 0} hint="Mark complete after the visit" href="/officer/requests" />
        <Card title="Closed" value={completed?.total ?? 0} accent="stone" />
      </div>

      <Section
        eyebrow="Up next"
        title="Visits to action"
        action={
          <Link href="/officer/availability" className="text-sm font-medium text-forest-700 hover:underline">
            Set on-duty →
          </Link>
        }
      >
        {upNext.length ? (
          <Panel className="divide-y divide-stone-100">
            {upNext.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-stone-900">{row.farmer_name || "Unnamed farmer"}</p>
                  <p className="text-sm text-stone-500">
                    {row.issue_type} · {row.county_name || "County unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={row.status === "Pending" ? "amber" : "blue"}>{row.status}</Badge>
                  <Link href="/officer/requests" className="text-sm font-medium text-forest-700 hover:underline">
                    {row.status === "Pending" ? "Accept" : "Complete"}
                  </Link>
                </div>
              </div>
            ))}
          </Panel>
        ) : (
          <State
            kind="empty"
            title="No open visits"
            text="When a farmer requests an expert, it appears here. Stay on duty so they can find you."
            action={
              <Link href="/officer/availability">
                <Button variant="ghost">Go on duty</Button>
              </Link>
            }
          />
        )}
      </Section>
    </div>
  );
}
