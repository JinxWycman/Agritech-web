import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDataMode } from "@/lib/data-mode";
import { homeForRole } from "@/lib/route-guards";
import type { UserRole } from "@/types/domain";

export async function requirePortalRole(required: UserRole): Promise<void> {
  const cookieStore = await cookies();
  const role = getDataMode() === "mock"
    ? cookieStore.get("demo_role")?.value
    : cookieStore.get("portal_role")?.value;
  if (role === required) return;
  if (role === "farmer" || role === "expert" || role === "admin") redirect(homeForRole(role));
  redirect("/login");
}
