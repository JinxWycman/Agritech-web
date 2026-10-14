import type { OutbreakSignal } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const outbreaksService = resourceStub<OutbreakSignal>("Outbreaks");
