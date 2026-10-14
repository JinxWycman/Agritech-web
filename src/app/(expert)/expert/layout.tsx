import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";
import { requirePortalRole } from "@/lib/server-portal-guard";

export const metadata: Metadata = {
  title: "Expert portal",
  description: "Agritech expert support desk.",
};

export default async function ExpertLayout({ children }: { children: React.ReactNode }) {
  await requirePortalRole("expert");
  return <PortalShell role="expert">{children}</PortalShell>;
}
