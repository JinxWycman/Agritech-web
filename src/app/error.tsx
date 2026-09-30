"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soil-600">Something broke</p>
      <h1 className="mt-3 font-serif text-4xl text-forest-950">This screen could not be shown</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">{error.message || "Try the screen again."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex w-fit rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
