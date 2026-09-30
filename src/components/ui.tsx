import Link from "next/link";
import { ApiError } from "@/lib/http";

export function Section({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {(eyebrow || title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="mt-1 text-base font-semibold text-stone-900">{title}</h2> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`panel ${className}`}>{children}</div>;
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

export function Card({
  title,
  value,
  hint,
  accent = "forest",
  href,
}: {
  title: string;
  value: string | number;
  hint?: string;
  accent?: "forest" | "gold" | "stone" | "rose";
  href?: string;
}) {
  const accents = {
    forest: "from-forest-600 to-forest-400",
    gold: "from-soil-600 to-soil-400",
    stone: "from-stone-500 to-stone-300",
    rose: "from-rose-600 to-rose-400",
  };
  const inner = (
    <>
      <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${accents[accent]}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{title}</p>
      <p className="mt-2 font-serif text-3xl tracking-tight text-stone-900">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{hint}</p> : null}
    </>
  );
  const classes = "panel relative block overflow-hidden p-5 text-left";
  if (href) {
    return (
      <Link href={href} className={`${classes} transition hover:-translate-y-0.5 hover:border-forest-200`}>
        {inner}
      </Link>
    );
  }
  return <div className={classes}>{inner}</div>;
}

export function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    zinc: "bg-stone-100 text-stone-700 ring-stone-200",
    green: "bg-forest-50 text-forest-800 ring-forest-100",
    amber: "bg-amber-50 text-amber-900 ring-amber-100",
    red: "bg-rose-50 text-rose-800 ring-rose-100",
    blue: "bg-sky-50 text-sky-900 ring-sky-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone] || tones.zinc}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-forest-700 text-white shadow-sm hover:bg-forest-800 focus-visible:ring-forest-500/40",
    ghost:
      "border border-stone-300 bg-white text-stone-800 hover:bg-cream-50 focus-visible:ring-stone-400/30",
    danger: "bg-rose-700 text-white hover:bg-rose-800 focus-visible:ring-rose-500/30",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Notice({
  tone = "success",
  children,
}: {
  tone?: "success" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-forest-50 text-forest-900 ring-forest-100",
    error: "bg-rose-50 text-rose-900 ring-rose-100",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm ring-1 ${styles[tone]}`}>
      {children}
    </p>
  );
}

export function Pager({
  total,
  limit,
  offset,
  onOffset,
}: {
  total: number;
  limit: number;
  offset: number;
  onOffset: (next: number) => void;
}) {
  if (total <= limit && offset === 0) return null;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-stone-500">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" disabled={offset === 0} onClick={() => onOffset(Math.max(0, offset - limit))}>
          Previous
        </Button>
        <span className="text-xs text-stone-500">
          Page {page} of {pages}
        </span>
        <Button variant="ghost" disabled={offset + limit >= total} onClick={() => onOffset(offset + limit)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function State({
  kind,
  text,
  title,
  action,
}: {
  kind: "loading" | "empty" | "error" | "forbidden";
  text?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  const copy = {
    loading: { title: "Reading the field…", body: text || "Pulling the latest farm, visit, and payment records." },
    empty: {
      title: title || "No records in this view",
      body: text || "Farmers, visits, and quotes appear here once USSD, SMS, or staff activity starts.",
    },
    error: { title: title || "Could not load this view", body: text || "Check the API and try again." },
    forbidden: { title: "Not allowed", body: text || "Your role cannot do this." },
  };
  const styles = {
    loading: "border-forest-200 bg-forest-50/70 text-forest-900",
    empty: "border-stone-200 bg-white text-stone-600",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    forbidden: "border-amber-200 bg-amber-50 text-amber-950",
  };
  return (
    <div className={`rounded-2xl border border-dashed px-5 py-10 text-center ${styles[kind]}`}>
      {kind === "loading" ? (
        <span className="mx-auto mb-3 block h-1.5 w-24 animate-pulse rounded-full bg-forest-300" />
      ) : null}
      <p className="font-medium">{copy[kind].title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed opacity-80">{copy[kind].body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const status = error instanceof ApiError ? error.status : 0;
  return (
    <State
      kind={status === 403 ? "forbidden" : "error"}
      text={error instanceof Error ? error.message : undefined}
      action={
        onRetry ? (
          <Button variant="ghost" onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    />
  );
}

export function Table({
  headers,
  rows,
  emptyTitle,
  emptyHint,
  caption,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyTitle?: string;
  emptyHint?: string;
  caption?: string;
}) {
  if (!rows.length) return <State kind="empty" title={emptyTitle} text={emptyHint} />;
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="sticky top-0 bg-cream-50 text-[11px] uppercase tracking-[0.12em] text-stone-500">
            <tr>
              {headers.map((header) => (
                <th key={header || "actions"} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row, index) => (
              <tr key={index} className="transition hover:bg-cream-50/80">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 align-middle text-stone-800 ${cellIndex === row.length - 1 ? "text-right" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
