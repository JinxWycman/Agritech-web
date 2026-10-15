"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { authService } from "@/services";
import type { UserRole } from "@/types/domain";
import { getDataMode } from "@/lib/data-mode";
import { DemoControls } from "@/components/demo-controls";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

type Item = { key: string; suffix: string; phase: number };

const navigation: Record<UserRole, Item[]> = {
  farmer: [
    { key: "home", suffix: "/overview", phase: 1 },
    { key: "farmProfile", suffix: "/profile", phase: 1 },
    { key: "recommendations", suffix: "/recommendations", phase: 4 },
    { key: "livestock", suffix: "/livestock", phase: 4 },
    { key: "risks", suffix: "/risks", phase: 6 },
    { key: "prices", suffix: "/market-prices", phase: 5 },
    { key: "requests", suffix: "/requests", phase: 1 },
    { key: "vendors", suffix: "/agrovets", phase: 4 },
    { key: "notifications", suffix: "/notifications", phase: 6 },
    { key: "settings", suffix: "/settings", phase: 7 },
  ],
  expert: [
    { key: "queue", suffix: "/overview", phase: 1 },
    { key: "cases", suffix: "/requests", phase: 1 },
    { key: "availability", suffix: "/availability", phase: 1 },
    { key: "performance", suffix: "/performance", phase: 3 },
  ],
  admin: [
    { key: "home", suffix: "/overview", phase: 1 },
    { key: "requests", suffix: "/requests", phase: 1 },
    { key: "farmers", suffix: "/farmers", phase: 3 },
    { key: "staff", suffix: "/experts", phase: 3 },
    { key: "outbreaks", suffix: "/outbreaks", phase: 6 },
    { key: "prices", suffix: "/market-prices", phase: 5 },
    { key: "advisories", suffix: "/advisories", phase: 6 },
    { key: "products", suffix: "/products", phase: 4 },
    { key: "subscriptions", suffix: "/subscriptions", phase: 7 },
    { key: "quotes", suffix: "/quotes", phase: 7 },
    { key: "sms", suffix: "/sms-sessions", phase: 7 },
    { key: "audit", suffix: "/audit", phase: 7 },
  ],
};

const roots: Record<UserRole, string> = { farmer: "/app", expert: "/expert", admin: "/admin" };
const supportedDemoScreens = new Set(["/app/overview", "/app/profile", "/app/recommendations", "/app/livestock", "/app/agrovets", "/app/market-prices", "/app/risks", "/expert/overview", "/expert/requests", "/expert/availability", "/admin/overview", "/admin/requests", "/admin/outbreaks", "/app/requests", "/app/requests/new"]);

export function portalRouteItem(role: UserRole, pathname: string) {
  return navigation[role].find((item) => `${roots[role]}${item.suffix}` === pathname);
}

export function PortalShell({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const mockMode = getDataMode() === "mock";
  const isFarmerRequestDetail = /^\/app\/requests\/[^/]+$/.test(pathname);
  const isVendorProfile = /^\/app\/agrovets\/[^/]+$/.test(pathname);
  const unavailable = mockMode && !supportedDemoScreens.has(pathname) && !isFarmerRequestDetail && !isVendorProfile;

  async function signOut() {
    await authService.logout();
    document.cookie = "demo_role=; Path=/; Max-Age=0; SameSite=Lax";
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh text-[var(--foreground)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:p-3">
        Skip to content
      </a>
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-forest-950 p-4 text-white md:flex">
          <Link href={`${roots[role]}/overview`} className="px-2 py-3 text-xl font-bold">{t("common.appName")}</Link>
          <p className="mb-3 px-2 text-xs uppercase tracking-wider text-forest-200">{t(`nav.${role}`)}</p>
          <nav aria-label={t(`nav.${role}`)} className="flex-1 space-y-1 overflow-y-auto">
            {navigation[role].map((item) => {
              const href = `${roots[role]}${item.suffix}`;
              const planned = item.phase > 1;
              return (
                <Link
                  key={item.key}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-forest-50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-100"
                >
                  <span>{t(`nav.${item.key}`)}</span>
                  {planned && <span className="text-[10px] text-forest-200">{t("common.planned", { phase: item.phase })}</span>}
                </Link>
              );
            })}
          </nav>
          <button onClick={signOut} className="mt-4 min-h-11 rounded-lg px-3 text-left text-sm hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {t("common.signOut")}
          </button>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--paper)]/95 p-3 backdrop-blur sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{t(`nav.${role}`)}</p>
                {mockMode && <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">{t("common.demoData")}</span>}
                {locale === "sw" && <span className="ml-2 text-xs text-[var(--muted)]">{t("common.languageReview")}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
                <button onClick={signOut} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm md:hidden">{t("common.signOut")}</button>
              </div>
            </div>
            <nav aria-label={t(`nav.${role}`)} className="nav-scroll mt-3 flex gap-2 overflow-x-auto md:hidden">
              {navigation[role].map((item) => {
                const href = `${roots[role]}${item.suffix}`;
                return <Link key={item.key} href={href} className="whitespace-nowrap rounded-full border border-[var(--border)] px-3 py-2 text-xs">{t(`nav.${item.key}`)}{item.phase > 1 ? ` · ${t("common.planned", { phase: item.phase })}` : ""}</Link>;
              })}
            </nav>
          </header>
          <main id="main" className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
            {mockMode && <DemoControls role={role} />}
            {unavailable
              ? <section className="panel p-6"><h1 className="text-xl font-semibold">{t(`nav.${portalRouteItem(role, pathname)?.key || "home"}`)}</h1><p className="mt-2 text-[var(--muted)]">{t("common.notAvailable", { phase: portalRouteItem(role, pathname)?.phase || 2 })}</p></section>
              : children}
          </main>
        </div>
      </div>
    </div>
  );
}
