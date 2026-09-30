import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soil-600">Missing page</p>
      <h1 className="mt-3 font-serif text-4xl text-forest-950">This page is not in the console</h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
        This address is not a staff screen. Go back to the desk.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex w-fit rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-medium text-white"
      >
        Back to the desk
      </Link>
    </main>
  );
}
