import type { Product } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const productsService = resourceStub<Product>("Products");
