"use client";
import { getDataMode } from "@/lib/data-mode";
import { FarmerRequestsScreen } from "@/components/farmer-request-screens";
import { RequestBoard } from "@/components/request-board";
export default function RequestsPage() {
  return getDataMode() === "mock" ? <FarmerRequestsScreen /> : <RequestBoard />;
}
