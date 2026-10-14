import type { MarketPrice } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const marketPricesService = resourceStub<MarketPrice>("Market prices");
