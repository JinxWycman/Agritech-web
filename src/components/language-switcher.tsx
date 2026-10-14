"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();

  function changeLocale(next: string) {
    document.cookie = `agritech_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{t("language")}</span>
      <select
        aria-label={t("language")}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
        value={locale}
        onChange={(event) => changeLocale(event.target.value)}
      >
        <option value="en">English</option>
        <option value="sw">Kiswahili</option>
      </select>
    </label>
  );
}
