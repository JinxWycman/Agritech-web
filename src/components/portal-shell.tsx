"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { authService } from "@/services";
import type { UserRole } from "@/types/domain";
import { getDataMode, isDemoAllowed } from "@/lib/data-mode";
import { DemoControls } from "@/components/demo-controls";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { OfflineBanner } from "@/components/offline-banner";

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
    { key: "subscription", suffix: "/subscription", phase: 6 },
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
    { key: "vendorListings", suffix: "/vendors", phase: 4 },
    { key: "subscriptions", suffix: "/subscriptions", phase: 7 },
    { key: "quotes", suffix: "/quotes", phase: 7 },
    { key: "sms", suffix: "/sms-sessions", phase: 7 },
    { key: "audit", suffix: "/audit", phase: 7 },
  ],
};

const roots: Record<UserRole, string> = { farmer: "/app", expert: "/expert", admin: "/admin" };
const supportedDemoScreens = new Set(["/app/overview", "/app/profile", "/app/recommendations", "/app/livestock", "/app/agrovets", "/app/market-prices", "/app/risks", "/app/notifications", "/app/subscription", "/app/settings", "/expert/overview", "/expert/requests", "/expert/availability", "/expert/performance", "/admin/overview", "/admin/requests", "/admin/outbreaks", "/app/requests", "/app/requests/new"]);
const legacyBuiltScreens = new Set(["/admin/farmers", "/admin/experts", "/admin/market-prices", "/admin/advisories", "/admin/products", "/admin/subscriptions", "/admin/pricing", "/admin/quotes", "/admin/sms-sessions", "/admin/audit", "/admin/vendors"]);
const apiConnectedScreens = new Set([
  ...legacyBuiltScreens,
  "/admin/overview",
  "/admin/requests",
  "/expert/overview",
  "/expert/requests",
  "/expert/availability",
  "/app/overview",
  "/app/profile",
  "/app/recommendations",
  "/app/livestock",
  "/app/notifications",
  "/app/agrovets",
  "/app/risks",
  "/app/requests",
  "/app/requests/new",
  "/admin/outbreaks",
]);
function isApiConnectedRoute(pathname: string): boolean {
  return apiConnectedScreens.has(pathname) || /^\/admin\/farmers\/[^/]+$/.test(pathname);
}
function isBuiltRoute(pathname: string): boolean {
  return supportedDemoScreens.has(pathname) || legacyBuiltScreens.has(pathname) || /^\/app\/requests\/[^/]+$/.test(pathname) || /^\/app\/agrovets\/[^/]+$/.test(pathname) || /^\/admin\/farmers\/[^/]+$/.test(pathname);
}

export function portalRouteItem(role: UserRole, pathname: string) {
  return navigation[role].find((item) => `${roots[role]}${item.suffix}` === pathname);
}

export function PortalShell({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const mockMode = getDataMode() === "mock";
  const demoMode = mockMode && isDemoAllowed();
  const isFarmerRequestDetail = /^\/app\/requests\/[^/]+$/.test(pathname);
  const isVendorProfile = /^\/app\/agrovets\/[^/]+$/.test(pathname);
  const isSupportedDemoRoute = supportedDemoScreens.has(pathname) || isFarmerRequestDetail || isVendorProfile;
  const unavailable = demoMode && !isSupportedDemoRoute;
  const liveNotConnected = !mockMode && !isApiConnectedRoute(pathname);

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
        <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--border)] bg-forest-950 px-5 py-6 text-white md:flex">
          <Link href={`${roots[role]}/overview`} className="group px-2 py-2">
            <span className="block font-serif text-2xl leading-none text-cream-50">{t("common.appName")}</span>
            <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-forest-300">{t(`nav.${role}`)}</span>
          </Link>
          <div className="my-6 h-px bg-gradient-to-r from-forest-400/70 to-transparent" />
          <nav aria-label={t(`nav.${role}`)} className="flex-1 space-y-1 overflow-y-auto">
            {navigation[role].map((item) => {
              const href = `${roots[role]}${item.suffix}`;
              const planned = !isBuiltRoute(href);
              return (
                <Link
                  key={item.key}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-between gap-2 rounded-md border-l-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-100 ${pathname === href ? "border-soil-400 bg-white/10 text-white" : "border-transparent text-forest-100 hover:bg-white/10 hover:text-white"}`}
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
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--paper)]/90 p-3 backdrop-blur sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{t(`nav.${role}`)}</p>
                {demoMode && <span className="mt-1 inline-flex rounded-sm bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950">{t("common.demoData")}</span>}
                {locale === "sw" && <span className="ml-2 text-xs text-[var(--muted)]">{t("common.languageReview")}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
                <button onClick={signOut} className="min-h-10 rounded-lg border border-[var(--border)] px-3 text-sm md:hidden">{t("common.signOut")}</button>
              </div>
            </div>
            <nav aria-label={t(`nav.${role}`)} className="nav-scroll mt-4 flex gap-2 overflow-x-auto md:hidden">
              {navigation[role].map((item) => {
                const href = `${roots[role]}${item.suffix}`;
                return <Link key={item.key} href={href} className={`whitespace-nowrap rounded-md border px-3 py-2 text-xs ${pathname === href ? "border-forest-700 bg-forest-700 font-semibold text-white" : "border-[var(--border)] bg-[var(--surface)]"}`}>{t(`nav.${item.key}`)}{!isBuiltRoute(href) ? ` Â· ${t("common.planned", { phase: item.phase })}` : ""}</Link>;
              })}
            </nav>
          </header>
          <OfflineBanner />
          <main id="main" tabIndex={-1} className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
            {demoMode && <DemoControls role={role} />}
            {unavailable ? (
              <section className="panel p-6">
                <h1 className="text-xl font-semibold">{t(`nav.${portalRouteItem(role, pathname)?.key || "home"}`)}</h1>
                <p className="mt-2 text-[var(--muted)]">{t("common.notAvailable", { phase: portalRouteItem(role, pathname)?.phase || 2 })}</p>
              </section>
            ) : liveNotConnected ? (
              <section className="panel p-6">
                <h1 className="text-xl font-semibold">{t("common.liveNotConnected")}</h1>
                <p className="mt-2 text-[var(--muted)]">{t("common.liveNotConnectedText")}</p>
                <Link className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-forest-700 px-4 font-semibold text-white" href={`${roots[role]}/overview`}>{t("common.backHome")}</Link>
              </section>
            ) : children}

          </main>
        </div>
      </div>
    </div>
  );
}
