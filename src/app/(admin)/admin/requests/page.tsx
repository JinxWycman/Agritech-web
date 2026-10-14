"use client";
import { getDataMode } from "@/lib/data-mode";
import { AdminRequestsScreen } from "@/components/admin-request-screen";
import { RequestBoard } from "@/components/request-board";
export default function RequestsPage() {
  return getDataMode() === "mock" ? <AdminRequestsScreen /> : <RequestBoard />;
}
