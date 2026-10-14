import { PortalShell } from "@/components/portal-shell";
import { requirePortalRole } from "@/lib/server-portal-guard";

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  await requirePortalRole("farmer");
  return <PortalShell role="farmer">{children}</PortalShell>;
}
