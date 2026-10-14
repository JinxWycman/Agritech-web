import type { Vendor } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const vendorsService = resourceStub<Vendor>("Vendors");
