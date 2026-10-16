"use client";
import { useParams } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { FarmerRequestDetailScreen } from "@/features/farmers/components";
import { PlannedRoutePage } from "@/components/planned-route-page";
export default function FarmerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  return getDataMode() === "mock" ? <FarmerRequestDetailScreen id={id} /> : <PlannedRoutePage role="farmer" />;
}
