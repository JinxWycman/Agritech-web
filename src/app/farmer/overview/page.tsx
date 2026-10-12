"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/http";
import { Button, Card, LoadError, Notice, Panel, State } from "@/components/ui";
import { getFarmerAccessToken, getFarmerProfile, logoutFarmer } from "@/lib/api";

export default function FarmerOverviewPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getFarmerAccessToken()) {
      router.replace("/farmer/login?next=%2Ffarmer%2Foverview");
    }
  }, [router]);

  const query = useQuery({
    queryKey: ["farmer", "profile"],
    queryFn: getFarmerProfile,
    enabled: Boolean(getFarmerAccessToken()),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      return failureCount < 1;
    },
  });

  if (!getFarmerAccessToken()) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <State
          kind="forbidden"
          text="Please sign in to open your farmer account."
          action={<Button onClick={() => router.push("/farmer/login")}>Sign in</Button>}
        />
      </main>
    );
  }

  if (query.isLoading) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <State kind="loading" text="Loading your account…" />
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <LoadError
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      </main>
    );
  }

  const farmer = query.data;
  if (!farmer) {
    return (
      <main className="min-h-dvh bg-cream-50 p-6">
        <State
          kind="error"
          text="Your account details are unavailable right now."
          action={<Button variant="ghost" onClick={() => void query.refetch()}>Try again</Button>}
        />
      </main>
    );
  }

  const signOut = () => {
    logoutFarmer();
    router.replace("/farmer/login");
  };

  return (
    <main className="min-h-dvh bg-cream-50 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-700">Farmer account</p>
            <h1 className="mt-2 font-serif text-3xl text-stone-900">{farmer.full_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-800 ring-1 ring-inset ring-forest-100">
              {farmer.is_active ? "Active" : "Inactive"}
            </span>
            <Button variant="ghost" onClick={signOut}>Sign out</Button>
          </div>
        </header>

        <Notice tone={farmer.is_active ? "success" : "error"}>
          {farmer.is_active
            ? "Your farm account is active and ready for support."
            : "This account is inactive. Contact Agritech support for help."}
        </Notice>

        <section className="grid gap-4 md:grid-cols-3">
          <Card title="Phone" value={farmer.phone_number} />
          <Card title="County" value={farmer.county_id} />
          <Card title="National ID" value={farmer.national_id} />
        </section>

        <Panel className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Account details</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Full name</dt>
              <dd className="mt-1 text-base font-medium text-stone-900">{farmer.full_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Status</dt>
              <dd className="mt-1 text-base font-medium text-stone-900">{farmer.is_active ? "Active" : "Inactive"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Phone number</dt>
              <dd className="mt-1 text-base font-medium text-stone-900">{farmer.phone_number}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Account ID</dt>
              <dd className="mt-1 text-base font-medium text-stone-900">{farmer.id}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </main>
  );
}
