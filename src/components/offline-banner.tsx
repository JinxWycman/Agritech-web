"use client";

import { useTranslations } from "next-intl";
import { useOnline } from "@/lib/use-online";

export function OfflineBanner() {
  const online = useOnline();
  const t = useTranslations("pwa");
  if (online) return null;
  return <p role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">{t("offlineBanner")}</p>;
}
