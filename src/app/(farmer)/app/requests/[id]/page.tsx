"use client";
import { useParams } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { FarmerRequestDetailScreen } from "@/components/farmer-request-screens";
import { PlannedRoutePage } from "@/components/planned-route-page";
export default function FarmerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  return getDataMode() === "mock" ? <FarmerRequestDetailScreen id={id} /> : <PlannedRoutePage role="farmer" />;
}
