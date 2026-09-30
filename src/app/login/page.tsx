import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./login-form";

function FormFallback() {
  return (
    <div className="panel my-8 h-80 w-full max-w-md animate-pulse p-8">
      <div className="h-5 w-24 rounded bg-stone-200" />
      <div className="mt-3 h-4 w-56 rounded bg-stone-100" />
      <div className="mt-8 h-12 rounded-lg bg-stone-100" />
      <div className="mt-4 h-12 rounded-lg bg-stone-100" />
      <div className="mt-6 h-12 rounded-lg bg-stone-200" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-forest-950 text-cream-50">
      <Image
        src="/login-field.png"
        alt="Kenyan smallholder plots"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[22%_center] lg:object-[68%_center]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-forest-950/95 via-forest-950/88 to-forest-950/92 lg:hidden" />
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-gradient-to-r from-forest-950 from-[6%] via-forest-950/90 via-[34%] to-transparent to-[70%] lg:block"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-forest-950 to-transparent" />

      <div className="relative z-10 flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-10 lg:w-[min(36rem,44vw)] lg:justify-between lg:px-12 lg:py-12 xl:px-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-soil-400">Kenya · staff desk</p>
          <h1 className="mt-3 max-w-md font-serif text-4xl leading-tight sm:text-5xl">Karibu, Agritech AI</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-forest-100">
            HQ and field officers. Farmers stay on the phone — USSD <span className="text-cream-50">*384#</span> and SMS{" "}
            <span className="text-cream-50">3797</span>. Monthly farm size is KSh 20 to 70.
          </p>
        </div>

        <Suspense fallback={<FormFallback />}>
          <LoginForm />
        </Suspense>

        <p className="hidden text-xs leading-relaxed text-forest-200 lg:block">
          East Africa Time. Password is checked by the API, not this page.
        </p>
      </div>
    </main>
  );
}
