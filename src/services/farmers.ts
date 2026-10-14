import type { Farmer } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const farmersService = resourceStub<Farmer>("Farmers");
export { farmerService as farmerDashboardService } from "@/services";
