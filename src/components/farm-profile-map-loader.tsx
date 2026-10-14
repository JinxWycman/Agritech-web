"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "@/lib/kenya-location";

const FarmProfileMap = dynamic(() => import("@/components/farm-profile-map"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-[var(--surface-muted)] sm:h-96" aria-hidden="true" />,
});

export function FarmProfileMapLoader(props: {
  position: Coordinates | null;
  onChange: (position: Coordinates) => void;
  label: string;
  readOnly?: boolean;
}) {
  return <FarmProfileMap {...props} />;
}
