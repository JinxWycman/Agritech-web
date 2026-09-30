"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Notice, Panel } from "@/components/ui";
import { useState } from "react";

export default function AvailabilityPage() {
  const [onDuty, setOnDuty] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (is_available: boolean) =>
      api("/admin/me/availability", { method: "PATCH", body: JSON.stringify({ is_available }) }),
    onSuccess: (_, value) => {
      setOnDuty(value);
      setMessage(value ? "You are on duty. Farmers can request you." : "You are off duty. You will not appear in the directory.");
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : "Update failed"),
  });

  return (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <Panel className={`p-6 ${onDuty === true ? "ring-2 ring-forest-600" : ""}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-700">On duty</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          You show in the expert directory. Farmers can request a visit.
        </p>
        <Button className="mt-5" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>
          Go on duty
        </Button>
      </Panel>
      <Panel className={`p-6 ${onDuty === false ? "ring-2 ring-stone-400" : ""}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Off duty</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Hide yourself when you leave the field or cannot travel.
        </p>
        <Button className="mt-5" variant="ghost" disabled={mutation.isPending} onClick={() => mutation.mutate(false)}>
          Go off duty
        </Button>
      </Panel>
      {message ? (
        <div className="md:col-span-2">
          <Notice tone={mutation.isError ? "error" : "success"}>{message}</Notice>
        </div>
      ) : null}
    </div>
  );
}
