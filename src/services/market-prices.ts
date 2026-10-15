import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { weeklySeries } from "@/lib/markets";
import { demoMarketPrices, demoMarkets } from "@/mocks/market-prices";
import { selectAdapter } from "@/services/selection";
import type { Market, MarketPrice } from "@/types/market";

export type MarketPriceService = {
  listMarkets(): Promise<Market[]>;
  getPrices(cropKeys: string[]): Promise<MarketPrice[]>;
  getHistory(marketId: string, cropKey: string): Promise<MarketPrice[]>;
};

const mockAdapter: MarketPriceService = {
  async listMarkets() {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    const scenario = getDemoScenario();
    if (scenario === "error") throw new Error("Demo market service error scenario.");
    if (scenario === "empty") return [];
    return demoMarkets;
  },
  async getPrices(cropKeys) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    const scenario = getDemoScenario();
    if (scenario === "error") throw new Error("Demo market service error scenario.");
    if (scenario === "empty") return [];
    return demoMarkets.flatMap((market) => cropKeys.flatMap((cropKey) =>
      weeklySeries(market.id, cropKey, demoMarketPrices).slice(-1),
    ));
  },
  async getHistory(marketId, cropKey) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    const scenario = getDemoScenario();
    if (scenario === "error") throw new Error("Demo market service error scenario.");
    if (scenario === "empty") return [];
    return weeklySeries(marketId, cropKey, demoMarketPrices);
  },
};

const apiAdapter: MarketPriceService = {
  async listMarkets() {
    throw new Error("Market directory API adapter is not implemented until market coordinates and its contract are confirmed.");
  },
  async getPrices() {
    throw new Error("Market price API adapter is not implemented until the per-market price contract is confirmed.");
  },
  async getHistory() {
    throw new Error("Market price history API adapter is not implemented until its contract is confirmed.");
  },
};

export const marketPriceService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
