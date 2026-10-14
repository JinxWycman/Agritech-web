"use client";

import dynamic from "next/dynamic";
import type { Coordinates } from "@/lib/kenya-location";
import type { VendorWithDistance } from "@/types/business";

const VendorMap = dynamic(() => import("@/components/vendor-map"), {
  ssr: false,
  loading: () => <div className="panel h-72 animate-pulse sm:h-96" aria-busy="true" />,
});

export function VendorMapLoader(props: {
  farm: Coordinates | null;
  vendors: VendorWithDistance[];
  locale: "en" | "sw";
  farmLabel: string;
}) {
  return <VendorMap {...props} />;
}
