"use client";
import { getDataMode } from "@/lib/data-mode";
import { NewFarmerRequestScreen } from "@/components/farmer-request-screens";
import { PlannedRoutePage } from "@/components/planned-route-page";
export default function NewRequestPage() {
  return getDataMode() === "mock" ? <NewFarmerRequestScreen /> : <PlannedRoutePage role="farmer" />;
}
