"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "@/lib/kenya-location";
import type { OutbreakAlert, SignalCell } from "@/types/outbreak";

const OutbreakMap = dynamic(() => import("@/components/outbreak-map"), {
  ssr: false,
  loading: () => <div className="panel h-72 animate-pulse sm:h-96" aria-busy="true" />,
});

export function OutbreakMapLoader(props: {
  cells: SignalCell[];
  alerts: OutbreakAlert[];
  farmPin?: Coordinates | null;
  farmLabel: string;
  onCellSelect?: (cell: SignalCell) => void;
}) {
  return <OutbreakMap {...props} />;
}
