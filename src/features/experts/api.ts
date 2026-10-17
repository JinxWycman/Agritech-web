import { api } from "@/lib/api";

type AvailabilityResponse = { is_available: boolean };

/** Update the signed-in officer's availability through the same-origin proxy. */
export function updateExpertAvailability(isAvailable: boolean): Promise<AvailabilityResponse> {
  return api<AvailabilityResponse>("/admin/me/availability", {
    method: "PATCH",
    body: JSON.stringify({ is_available: isAvailable }),
  });
}
