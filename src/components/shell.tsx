"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getStaffRole, logoutStaff } from "@/lib/api";
import { isStaffRole, staffRoleLabel } from "@/lib/http";

const PREFETCH: Record<string, { queryKey: readonly unknown[]; path: string }> = {
  "/admin/overview": { queryKey: ["overview"], path: "/admin/overview" },
  "/admin/farmers": { queryKey: ["farmers", "", "", "", 0], path: "/admin/farmers?limit=20&offset=0" },
  "/admin/requests": { queryKey: ["requests", "All", 0], path: "/admin/expert-requests?limit=20&offset=0" },
  "/admin/quotes": { queryKey: ["quotes", 0], path: "/admin/quotes?limit=20&offset=0" },
  "/admin/experts": { queryKey: ["experts", 0], path: "/admin/experts?limit=20&offset=0" },
  "/officer/requests": { queryKey: ["requests", "All", 0], path: "/admin/expert-requests?limit=20&offset=0" },
};

type NavLink = { href: string; label: string; hint?: string };

type NavGroup = { label: string; links: NavLink[] };

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Today",
    links: [
      { href: "/admin/overview", label: "Operations" },
      { href: "/admin/requests", label: "Field visits" },
      { href: "/admin/farmers", label: "Farm registry" },
    ],
  },
  {
    label: "Advice",
    links: [
      { href: "/admin/experts", label: "Officers" },
      { href: "/admin/advisories", label: "Advisories" },
      { href: "/admin/products", label: "Inputs" },
      { href: "/admin/market-prices", label: "Market prices" },
    ],
  },
  {
    label: "Revenue",
    links: [
      { href: "/admin/quotes", label: "Quote desk" },
      { href: "/admin/pricing", label: "Size bands" },
      { href: "/admin/subscriptions", label: "Subscriptions" },
    ],
  },
  {
    label: "Channels",
    links: [
      { href: "/admin/sms-sessions", label: "Farmer sessions" },
      { href: "/admin/audit", label: "Audit trail" },
    ],
  },
];

const OFFICER_GROUPS: NavGroup[] = [
  {
    label: "My field day",
    links: [
      { href: "/officer/overview", label: "Queue" },
      { href: "/officer/requests", label: "Visits" },
      { href: "/officer/availability", label: "On duty" },
    ],
  },
];

const PAGE_COPY: Record<string, { title: string; description?: string }> = {
  "/admin/overview": { title: "Operations" },
  "/admin/farmers": { title: "Farm registry" },
  "/admin/experts": { title: "Officers" },
  "/admin/requests": { title: "Field visits" },
  "/admin/advisories": { title: "Advisories" },
  "/admin/products": { title: "Inputs" },
  "/admin/market-prices": { title: "Market prices" },
  "/admin/quotes": { title: "Quote desk" },
  "/admin/pricing": { title: "Size bands" },
  "/admin/subscriptions": { title: "Subscriptions" },
  "/admin/sms-sessions": { title: "Farmer sessions" },
  "/admin/audit": { title: "Audit trail" },
  "/officer/overview": { title: "Queue" },
  "/officer/requests": { title: "Visits" },
  "/officer/availability": { title: "On duty" },
};

function pageMeta(pathname: string) {
  if (PAGE_COPY[pathname]) return PAGE_COPY[pathname];
  if (pathname.startsWith("/admin/farmers/")) {
    return { title: "Farm file" };
  }
  return { title: "Agritech" };
}

function KenyaClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleString("en-KE", {
          timeZone: "Africa/Nairobi",
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return null;
  return <span className="tabular-nums">{now} EAT</span>;
}

function Mark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-400 to-forest-700 shadow-inner">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-cream-50" fill="none" aria-hidden>
        <path
          d="M12 21c6-3.5 8-8 8-12.5C14.5 9 12 5 12 3 12 5 9.5 9 4 8.5 4 13 6 17.5 12 21Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const session = useQuery({
    queryKey: ["staff-me"],
    queryFn: () => api<{ role: string }>("/staff/me"),
    staleTime: 5 * 60_000,
  });
  useEffect(() => {
    setRole(getStaffRole());
  }, []);
  useEffect(() => {
    const next = session.data?.role;
    if (!isStaffRole(next)) return;
    setRole(next);
    if (next === "officer" && pathname.startsWith("/admin")) {
      router.replace("/officer/overview");
    }
  }, [session.data, pathname, router]);
  useEffect(() => {
    const mark = () => setOnline(navigator.onLine);
    mark();
    window.addEventListener("online", mark);
    window.addEventListener("offline", mark);
    return () => {
      window.removeEventListener("online", mark);
      window.removeEventListener("offline", mark);
    };
  }, []);
  const onOfficerRoute = pathname.startsWith("/officer");
  const isOfficer = role === "officer" || (role === null && onOfficerRoute);
  const groups = isOfficer ? OFFICER_GROUPS : ADMIN_GROUPS;
  const meta = pageMeta(pathname);
  const roleLabel = staffRoleLabel(role) || (isOfficer ? "Officer" : "Admin");
  useEffect(() => {
    document.title = `${meta.title} · Agritech`;
  }, [meta.title]);
  const farmerFile = pathname.startsWith("/admin/farmers/") && pathname !== "/admin/farmers";

  function isActive(href: string) {
    if (href === "/admin/farmers") {
      return pathname === href || pathname.startsWith("/admin/farmers/");
    }
    return pathname === href;
  }

  function prefetch(href: string) {
    const spec = PREFETCH[href];
    if (!spec) return;
    void queryClient.prefetchQuery({
      queryKey: spec.queryKey,
      queryFn: () => api(spec.path),
    });
  }

  async function signOut() {
    await logoutStaff();
    queryClient.clear();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen text-stone-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-forest-900"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-forest-900 bg-forest-950 px-4 py-5 text-cream-50 lg:flex">
          <div className="flex items-center gap-3 px-1">
            <Mark />
            <div>
              <p className="font-serif text-xl leading-none text-cream-50">Agritech</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-forest-200">{roleLabel}</p>
            </div>
          </div>
          <nav aria-label="Sections" className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-300">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onMouseEnter={() => prefetch(link.href)}
                      onFocus={() => prefetch(link.href)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`block rounded-md px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-100 ${
                        isActive(link.href)
                          ? "bg-white/10 font-medium text-white"
                          : "text-forest-100 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-forest-200 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-100"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-stone-400/20 bg-[var(--paper)]/92 px-4 py-4 backdrop-blur-md md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 lg:hidden">
                  <Mark />
                  <p className="font-serif text-lg text-forest-900">Agritech</p>
                </div>
                {farmerFile ? (
                  <Link href="/admin/farmers" className="mb-1 inline-block text-xs font-medium text-forest-700 hover:underline">
                    ← Farm registry
                  </Link>
                ) : null}
                <h1 className="truncate text-xl font-semibold tracking-tight text-stone-900">{meta.title}</h1>
                {meta.description ? (
                  <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-stone-500">{meta.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="hidden text-[11px] text-stone-500 sm:inline">
                  <KenyaClock />
                </span>
                <span className="hidden rounded border border-forest-800/20 bg-forest-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-900 sm:inline">
                  {isOfficer ? "Officer" : "Admin"}
                </span>
                <button
                  type="button"
                  className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/20 lg:hidden"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>
            </div>
            <nav aria-label="Sections" className="nav-scroll mt-3 flex gap-4 overflow-x-auto pb-1 lg:hidden">
              {groups.map((group) => (
                <div key={group.label} className="flex shrink-0 items-center gap-1">
                  <span className="pr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                    {group.label}
                  </span>
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onMouseEnter={() => prefetch(link.href)}
                      onFocus={() => prefetch(link.href)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 ${
                        isActive(link.href)
                          ? "bg-forest-800 text-white"
                          : "bg-white text-stone-600 ring-1 ring-stone-200"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </header>
          {!online ? (
            <p role="status" className="bg-soil-600 px-4 py-2 text-sm text-cream-50 md:px-8">
              You are offline. The register will not refresh until the line comes back.
            </p>
          ) : null}
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 space-y-5 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
