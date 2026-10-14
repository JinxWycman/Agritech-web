"use client";

import { useTranslations } from "next-intl";

export function LoadingState() {
  const t = useTranslations("states");
  return (
    <div role="status" aria-live="polite" className="panel animate-pulse space-y-3 p-6">
      <span className="sr-only">{t("loading")}</span>
      <div className="h-5 w-40 rounded bg-stone-200/70" />
      <div className="h-4 w-3/4 rounded bg-stone-200/50" />
      <div className="h-12 rounded-xl bg-stone-200/40" />
    </div>
  );
}

export function EmptyState({ title, text }: { title?: string; text?: string }) {
  const t = useTranslations("states");
  return (
    <section className="panel p-6" aria-live="polite">
      <h2 className="font-semibold">{title || t("emptyTitle")}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{text || t("emptyText")}</p>
    </section>
  );
}

export function ErrorState({ onRetry, message }: { onRetry: () => void; message?: string }) {
  const t = useTranslations("states");
  return (
    <section className="panel p-6" role="alert">
      <h2 className="font-semibold">{t("errorTitle")}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{message || t("errorText")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/40"
      >
        {t("retry")}
      </button>
    </section>
  );
}

export function SuccessState({ title, text }: { title?: string; text: string }) {
  const t = useTranslations("states");
  return (
    <section className="panel border-forest-500/30 bg-forest-50 p-6 text-forest-950" role="status">
      <h2 className="font-semibold">{title || t("successTitle")}</h2>
      <p className="mt-2 text-sm">{text}</p>
    </section>
  );
}
