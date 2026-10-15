"use client";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Notice, Panel } from "@/components/ui";
import { useState } from "react";
import { getDataMode } from "@/lib/data-mode";
import { ExpertAvailabilityScreen } from "@/components/expert-request-screens";
import { ExpertCoverageEditor } from "@/components/account-screens";
function LegacyAvailability() {
  const [onDuty, setOnDuty] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const mutation = useMutation({ mutationFn: (is_available: boolean) => api("/admin/me/availability", { method: "PATCH", body: JSON.stringify({ is_available }) }), onSuccess: (_, value) => { setOnDuty(value); setMessage(value ? "On duty." : "Off duty."); }, onError: (err) => setMessage(err instanceof Error ? err.message : "Update failed") });
  return <div className="grid max-w-3xl gap-4 md:grid-cols-2"><Panel className={`p-6 ${onDuty === true ? "ring-2 ring-forest-600" : ""}`}><p>On duty</p><Button className="mt-5" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>Go on duty</Button></Panel><Panel className={`p-6 ${onDuty === false ? "ring-2 ring-stone-400" : ""}`}><p>Off duty</p><Button className="mt-5" variant="ghost" disabled={mutation.isPending} onClick={() => mutation.mutate(false)}>Go off duty</Button></Panel>{message && <div className="md:col-span-2"><Notice tone={mutation.isError ? "error" : "success"}>{message}</Notice></div>}</div>;
}
export default function AvailabilityPage() {
  return <div className="space-y-5">{getDataMode() === "mock" ? <ExpertAvailabilityScreen /> : <LegacyAvailability />}<ExpertCoverageEditor /></div>;
}
