"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { authService } from "@/services/auth";
import { getDataMode, isDemoAllowed } from "@/lib/data-mode";
import { safeNextPath, staffHome } from "@/lib/http";
import type { UserRole } from "@/types/domain";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatKenyaNational, toE164Kenya } from "@/lib/phone";
import { pinSchema } from "@/lib/account-validation";
import Link from "next/link";

const farmerSchema = z.object({
  phone: z.string().regex(/^\+254\d{9}$/),
  pin: pinSchema,
});
const staffSchema = z.object({
  phone: z.string().regex(/^\+254\d{9}$/),
  password: z.string().min(8).max(128),
});

const rolePaths: Record<UserRole, string> = {
  farmer: "/app/overview",
  expert: "/expert/overview",
  admin: "/admin/overview",
};

export function LoginExperience() {
  const t = useTranslations();
  const router = useRouter();
  const search = useSearchParams();
  const mockMode = getDataMode() === "mock";
  const demoMode = mockMode && isDemoAllowed();
  const [accountType, setAccountType] = useState<"farmer" | "staff">("farmer");
  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function demoLogin(role: UserRole) {
    if (!demoMode) return;
    await authService.continueAs(role);
    document.cookie = `demo_role=${role}; Path=/; SameSite=Lax`;
    router.replace(safeNextPath(search.get("next"), role) || rolePaths[role]);
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedPhone = toE164Kenya(phone) || "";
    const parsed = accountType === "farmer"
      ? farmerSchema.safeParse({ phone: normalizedPhone, pin: secret })
      : staffSchema.safeParse({ phone: normalizedPhone, password: secret });
    if (!parsed.success) {
      setError(accountType === "farmer" ? t("login.invalidFarmer") : t("login.invalidStaff"));
      return;
    }
    setBusy(true);
    try {
      const result = accountType === "farmer"
        ? await authService.loginFarmer(normalizedPhone, secret)
        : await authService.loginStaff(normalizedPhone, secret);
      router.replace(safeNextPath(search.get("next"), result.role) || staffHome(result.role) || rolePaths[result.role]);
      router.refresh();
    } catch {
      setError(t("login.signInError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" tabIndex={-1} className="min-h-dvh bg-[var(--background)] px-4 py-6 text-[var(--foreground)] sm:px-8">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:p-3">{t("common.skipToMain")}</a>
      <div className="mx-auto flex max-w-5xl justify-end gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[80dvh] max-w-5xl place-items-center">
        <section className="panel w-full max-w-xl p-6 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--accent-foreground)]">{t("common.appName")}</p>
          <h1 className="mt-3 text-3xl font-bold">{t("login.title")}</h1>
          <p className="mt-2 text-[var(--muted)]">{t("login.subtitle")}</p>

          {demoMode ? (
            <div className="mt-7 space-y-3">
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950">{t("common.demoData")}</span>
              <h2 className="font-semibold">{t("login.demoTitle")}</h2>
              {([
                ["farmer", "continueFarmer"],
                ["expert", "continueExpert"],
                ["admin", "continueAdmin"],
              ] as const).map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => void demoLogin(role)}
                  className="min-h-12 w-full rounded-xl bg-forest-700 px-4 py-3 text-left font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40"
                >
                  {t(`login.${label}`)}
                </button>
              ))}
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{t("common.demoNote")}</p>
            </div>
          ) : (
            <>
              <div className="mt-6 flex gap-2" role="group" aria-label={t("login.apiTitle")}>
                {(["farmer", "staff"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => { setAccountType(value); setSecret(""); setError(""); }}
                    aria-pressed={accountType === value}
                    className={`min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/30 ${accountType === value ? "bg-forest-800 text-white" : "border border-[var(--border)]"}`}>
                    {t(`login.${value}`)}
                  </button>
                ))}
              </div>
              <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
                <label className="block text-sm font-medium">
                  {t("login.phone")}
                  <input
                    className="field-input mt-1.5 min-h-12"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(formatKenyaNational(event.target.value))}
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  {accountType === "farmer" ? t("login.pin") : t("login.password")}
                  <input
                    className="field-input mt-1.5 min-h-12"
                    type="password"
                    autoComplete={accountType === "farmer" ? "current-password" : "current-password"}
                    inputMode={accountType === "farmer" ? "numeric" : undefined}
                    value={secret}
                    onChange={(event) => setSecret(accountType === "farmer" ? event.target.value.replace(/\D/g, "").slice(0, 10) : event.target.value)}
                    required
                  />
                </label>
                {error && <p role="alert" className="rounded-lg bg-rose-100 p-3 text-sm text-rose-900">{error}</p>}
                <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-forest-800 px-4 font-semibold text-white hover:bg-forest-900 disabled:opacity-50">
                  {busy ? t("common.loading") : t("login.continue")}
                </button>
              </form>
              {accountType === "farmer" && <p className="mt-4 text-sm">{t("signup.noAccount")} <Link href="/signup" className="font-semibold text-forest-800 underline">{t("signup.createAccount")}</Link></p>}
            </>
          )}
          {t("common.languageReview") && <p className="mt-5 text-xs text-[var(--muted)]">{t("common.languageReview")}</p>}
        </section>
      </div>
    </main>
  );
}
