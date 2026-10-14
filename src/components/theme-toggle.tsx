"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type ThemeChoice = "system" | "light" | "dark";

export function ThemeToggle() {
  const t = useTranslations("common");
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemPreference = () => {
      const saved = localStorage.getItem("agritech_theme");
      if (saved === "light" || saved === "dark") {
        setChoice(saved);
        return;
      }
      setChoice("system");
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    applySystemPreference();
    media.addEventListener("change", applySystemPreference);
    return () => media.removeEventListener("change", applySystemPreference);
  }, []);

  function selectTheme(next: ThemeChoice) {
    setChoice(next);
    if (next === "system") localStorage.removeItem("agritech_theme");
    else localStorage.setItem("agritech_theme", next);
    const dark = next === "dark" || (next === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{t("theme")}</span>
      <select
        aria-label={t("theme")}
        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
        value={choice}
        onChange={(event) => selectTheme(event.target.value as ThemeChoice)}
      >
        <option value="system">{t("system")}</option>
        <option value="light">{t("light")}</option>
        <option value="dark">{t("dark")}</option>
      </select>
    </label>
  );
}
