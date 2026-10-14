import type { Notification } from "@/types/domain";
import { resourceStub } from "@/services/resource-stub";
export const notificationsService = resourceStub<Notification>("Notifications");
