"use client";
import { getDataMode } from "@/lib/data-mode";
import { NewFarmerRequestScreen } from "@/features/farmers/components";
import { PlannedRoutePage } from "@/components/planned-route-page";
export default function NewRequestPage() {
  return getDataMode() === "mock" ? <NewFarmerRequestScreen /> : <PlannedRoutePage role="farmer" />;
}
