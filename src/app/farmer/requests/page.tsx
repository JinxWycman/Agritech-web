"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, LoadError, Notice, Panel, State } from "@/components/ui";
import {
  buildExpertRequestPayload,
  createExpertRequest,
  getExperts,
  getFarmerAccessToken,
  getFarmerProfile,
  logoutFarmer,
  type ExpertSummary,
} from "@/lib/api";
import { ApiError } from "@/lib/http";

function formatDate(date: string | null) {
  if (!date) return "Not set";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FarmerRequestsPage() {
  const router = useRouter();
  const [selectedExpertId, setSelectedExpertId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [preferredVisitDate, setPreferredVisitDate] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasSession = Boolean(getFarmerAccessToken());

  const profileQuery = useQuery({
    queryKey: ["farmer", "profile"],
    queryFn: getFarmerProfile,
    enabled: hasSession,
    retry: (count, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      return count < 1;
    },
  });

  const expertsQuery = useQuery({
    queryKey: ["farmer", "experts"],
    queryFn: () => getExperts({ is_available: true, limit: 50, offset: 0 }),
    enabled: hasSession,
    retry: (count, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      return count < 1;
    },
  });

  const experts = expertsQuery.data?.items ?? [];

  const selectedExpert = useMemo(
    () => experts.find((expert) => expert.id === selectedExpertId) ?? experts[0] ?? null,
    [experts, selectedExpertId],
  );

  if (!hasSession) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <State
          kind="forbidden"
          text="Sign in to view experts and request support."
          action={<Button onClick={() => router.push("/farmer/login")}>Sign in</Button>}
        />
      </main>
    );
  }

  if (profileQuery.isLoading || expertsQuery.isLoading) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <State kind="loading" text="Loading experts and your account…" />
      </main>
    );
  }

  if (profileQuery.isError || expertsQuery.isError) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <LoadError
          error={profileQuery.error ?? expertsQuery.error}
          onRetry={() => {
            void profileQuery.refetch();
            void expertsQuery.refetch();
          }}
        />
      </main>
    );
  }

  if (!profileQuery.data) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <State kind="error" text="Your account details are unavailable right now." />
      </main>
    );
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setFormError("");

    if (!selectedExpert) {
      setFormError("Choose an expert before sending a request.");
      return;
    }

    const normalizedIssue = issueType.trim();
    const normalizedDescription = description.trim();
    if (!normalizedIssue) {
      setFormError("Enter the issue type for this request.");
      return;
    }
    if (normalizedDescription.length < 10) {
      setFormError("Add a more detailed description so the expert can help.");
      return;
    }

    setBusy(true);
    try {
      await createExpertRequest(
        buildExpertRequestPayload({
          farmer_id: profileQuery.data.id,
          expert_id: selectedExpert.id,
          issue_type: normalizedIssue,
          description: normalizedDescription,
          preferred_visit_date: preferredVisitDate || null,
        }),
      );
      setNotice("Your request was sent. The selected expert will review it soon.");
      setIssueType("");
      setDescription("");
      setPreferredVisitDate("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Your request could not be sent.";
      setFormError(message);
    } finally {
      setBusy(false);
    }
  }

  const signOut = () => {
    logoutFarmer();
    router.replace("/farmer/login");
  };

  return (
    <main className="min-h-dvh bg-cream-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-700">Farmer support</p>
            <h1 className="mt-2 font-serif text-3xl text-stone-900">Request expert help</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/farmer/overview")}>My account</Button>
            <Button variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </header>

        {notice ? <Notice>{notice}</Notice> : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Available experts</p>
                <h2 className="mt-1 text-lg font-semibold text-stone-900">Choose a specialist</h2>
              </div>
              <span className="rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-800 ring-1 ring-inset ring-forest-100">
                {experts.length} available
              </span>
            </div>

            {experts.length === 0 ? (
              <State
                kind="empty"
                title="No experts are currently available"
                text="Try again later or contact support if you need urgent agricultural help."
              />
            ) : (
              <div className="space-y-3">
                {experts.map((expert: ExpertSummary) => (
                  <button
                    key={expert.id}
                    type="button"
                    onClick={() => setSelectedExpertId(expert.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedExpert?.id === expert.id
                        ? "border-forest-600 bg-forest-50 shadow-sm"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-900">{expert.full_name}</p>
                        <p className="mt-1 text-sm text-stone-600">{expert.expert_type} · {expert.organization}</p>
                      </div>
                      <span className="rounded-full bg-forest-50 px-2 py-1 text-[11px] font-semibold text-forest-800 ring-1 ring-inset ring-forest-100">
                        {expert.is_available ? "Available" : "Busy"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
                      <span>{expert.phone_number}</span>
                      <span>County {expert.county_id}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Request details</p>
            {selectedExpert ? (
              <div className="mt-3 rounded-2xl bg-forest-50 p-3 text-sm text-stone-700 ring-1 ring-inset ring-forest-100">
                <p className="font-semibold text-stone-900">{selectedExpert.full_name}</p>
                <p className="mt-1">{selectedExpert.expert_type} · {selectedExpert.organization}</p>
              </div>
            ) : null}

            <form onSubmit={submitRequest} className="mt-5 space-y-4" noValidate>
              <label className="block text-sm font-medium text-stone-700">
                Issue type
                <input
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-forest-600 focus:ring-4 focus:ring-forest-600/10"
                  placeholder="Crop disease"
                  maxLength={100}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Describe the problem
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1.5 block min-h-28 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-forest-600 focus:ring-4 focus:ring-forest-600/10"
                  placeholder="Explain the crop condition, symptoms, and any actions taken so far."
                  minLength={10}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Preferred visit date (optional)
                <input
                  type="date"
                  value={preferredVisitDate}
                  onChange={(event) => setPreferredVisitDate(event.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-forest-600 focus:ring-4 focus:ring-forest-600/10"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </label>

              {formError ? (
                <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
                  {formError}
                </p>
              ) : null}

              <Button type="submit" disabled={busy || !selectedExpert} className="w-full">
                {busy ? "Sending request…" : "Send request"}
              </Button>
            </form>

            {selectedExpert ? (
              <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-3 text-sm text-stone-600">
                <p className="font-medium text-stone-900">Request summary</p>
                <dl className="mt-2 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Farmer</dt>
                    <dd>{profileQuery.data.full_name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Expert</dt>
                    <dd>{selectedExpert.full_name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Preferred date</dt>
                    <dd>{formatDate(preferredVisitDate || null)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </main>
  );
}
