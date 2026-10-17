"use client";
import { getDataMode } from "@/lib/data-mode";
import { FarmerRequestsScreen } from "@/features/farmers/components";
import { RequestBoard } from "@/components/request-board";
export default function RequestsPage() {
  return getDataMode() === "mock" ? <FarmerRequestsScreen /> : <RequestBoard />;
}
