import { Suspense } from "react";
import { FarmerLoginForm } from "./farmer-login-form";

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

export default function FarmerLoginPage() {
  return (
    <main className="min-h-dvh bg-forest-950 px-5 py-10 text-cream-50 sm:px-8 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-forest-800/60 bg-white text-stone-900 shadow-2xl shadow-forest-950/20 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative hidden min-h-[32rem] bg-forest-900 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(111,191,116,0.38),_transparent_38%),linear-gradient(135deg,_rgba(18,57,38,0.95),_rgba(12,30,23,0.86))]" />
          <div className="relative flex h-full flex-col justify-end p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-forest-200">Farmer portal</p>
            <h1 className="max-w-sm font-serif text-5xl leading-tight text-cream-50">Your farm account</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-forest-100/80">
              View your farm profile, manage your account, and continue receiving support from Agritech.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
          <Suspense fallback={<FormFallback />}>
            <FarmerLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
