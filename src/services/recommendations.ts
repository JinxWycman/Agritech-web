import type { Recommendation } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const recommendationsService = resourceStub<Recommendation>("Recommendations");
