"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { portalRouteItem } from "@/components/portal-shell";
import type { UserRole } from "@/types/domain";

export function PlannedRoutePage({ role }: { role: UserRole }) {
  const t = useTranslations();
  const pathname = usePathname();
  const item = portalRouteItem(role, pathname);
  return (
    <section className="panel p-6">
      <h1 className="text-xl font-semibold">{t(`nav.${item?.key || role}`)}</h1>
      <p className="mt-2 text-[var(--muted)]">
        {t("common.planned", { phase: item?.phase || 2 })}
      </p>
    </section>
  );
}
