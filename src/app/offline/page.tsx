"use client";

import { useTranslations } from "next-intl";

export default function OfflinePage() {
  const t = useTranslations("pwa");
  return <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 p-6"><h1 className="text-3xl font-bold">{t("offlineTitle")}</h1><p className="text-[var(--muted)]">{t("offlineText")}</p><h2 className="text-lg font-semibold">{t("offlineWorksTitle")}</h2><p>{t("offlineWorksText")}</p><button type="button" onClick={() => window.location.reload()} className="min-h-11 w-fit rounded-xl bg-forest-700 px-5 font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40">{t("retry")}</button></main>;
}
