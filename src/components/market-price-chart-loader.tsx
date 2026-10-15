"use client";

import dynamic from "next/dynamic";
import type { MarketPrice } from "@/types/market";

const MarketPriceChart = dynamic(() => import("@/components/market-price-chart"), {
  ssr: false,
  loading: () => <div className="panel h-64 animate-pulse" aria-busy="true" />,
});

export function MarketPriceChartLoader({ history }: { history: MarketPrice[] }) {
  return <MarketPriceChart history={history} />;
}
