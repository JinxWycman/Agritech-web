"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { loginStaff } from "@/lib/api";
import { staffHome } from "@/lib/http";

const loginSchema = z.object({
  phone: z.string().trim().min(10, "Enter the phone on the staff record.").max(20, "That phone number is too long."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128, "Password is too long."),
});

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = loginSchema.safeParse({ phone, password });
    if (!parsed.success) {
      const next: { phone?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "phone" || key === "password") next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      const data = await loginStaff(parsed.data.phone, parsed.data.password);
      const destination = staffHome(data.role);
      if (!destination) {
        setError("This account cannot open the staff console.");
        return;
      }
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-forest-950 text-cream-50">
      <Image
        src="/login-field.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[22%_center] lg:object-[68%_center]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-forest-950 via-forest-950/90 to-forest-950 lg:hidden" />
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-gradient-to-r from-forest-950 from-[8%] via-forest-950/88 via-[36%] to-transparent to-[68%] lg:block"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-forest-950/75 to-transparent" />

      <div className="relative z-10 flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-10 lg:w-[min(34rem,42vw)] lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-forest-200">Staff console</p>
          <h1 className="mt-4 max-w-md font-serif text-4xl leading-tight sm:text-5xl">Agritech AI</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-forest-100">
            Size-based subscriptions, field visits, and farm advice — built for Kenyan agronomists and veterinary officers.
          </p>
        </div>

        <form onSubmit={onSubmit} className="panel my-8 w-full max-w-md p-8 text-stone-900 shadow-[0_24px_60px_rgba(11,28,21,0.38)]" noValidate>
          <h2 className="text-lg font-semibold text-stone-900">Sign in</h2>
          <p className="mb-6 mt-1 text-sm text-stone-500">Officers and platform staff sign in with the phone on their staff record.</p>
          <label className="mb-4 block text-sm font-medium text-stone-700" htmlFor="staff-phone">
            Phone
            <input
              id="staff-phone"
              className="field-input mt-1.5"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2547..."
              autoComplete="username"
              inputMode="tel"
              maxLength={20}
              aria-invalid={fieldErrors.phone ? true : undefined}
              aria-describedby={fieldErrors.phone ? "staff-phone-error" : undefined}
              required
            />
          </label>
          {fieldErrors.phone ? (
            <p id="staff-phone-error" className="-mt-2 mb-4 text-sm text-rose-800">
              {fieldErrors.phone}
            </p>
          ) : null}
          <label className="mb-5 block text-sm font-medium text-stone-700" htmlFor="staff-password">
            Password
            <input
              id="staff-password"
              type="password"
              className="field-input mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={128}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? "staff-password-error" : undefined}
              required
            />
          </label>
          {fieldErrors.password ? (
            <p id="staff-password-error" className="-mt-3 mb-4 text-sm text-rose-800">
              {fieldErrors.password}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="w-full rounded-xl bg-forest-800 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-forest-900 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
        </form>

        <ul className="hidden max-w-sm space-y-3 text-sm text-forest-100 lg:block">
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-soil-400" />
            Quotes from acres and tropical livestock units
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-soil-400" />
            Farm registry, field visits, and the audit trail in one desk
          </li>
        </ul>
      </div>
    </main>
  );
}
