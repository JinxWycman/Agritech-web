"use client";
import { getDataMode } from "@/lib/data-mode";
import { ExpertCasesScreen } from "@/components/expert-request-screens";
import { RequestBoard } from "@/components/request-board";
export default function ExpertRequestsPage() {
  return getDataMode() === "mock" ? <ExpertCasesScreen /> : <RequestBoard perspective="officer" />;
}
