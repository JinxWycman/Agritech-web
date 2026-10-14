import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";
import { requirePortalRole } from "@/lib/server-portal-guard";

export const metadata: Metadata = {
  title: "Staff console",
  description: "Agritech staff desk.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePortalRole("admin");
  return <PortalShell role="admin">{children}</PortalShell>;
}
