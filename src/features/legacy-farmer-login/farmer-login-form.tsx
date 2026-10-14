"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginFarmer } from "@/lib/api";
import { ApiError, safeNextPath } from "@/lib/http";
import { formatKenyaNational, toE164Kenya } from "@/lib/phone";

function loginMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "Line is down. Check your internet, then try again.";
    if (error.status === 429) return "Too many tries. Wait a minute and try again.";
    if (error.status === 401 || error.status === 403) return "Wrong phone number or PIN.";
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Could not sign in. Try again.";
}

export function FarmerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  const e164 = useMemo(() => toE164Kenya(phone), [phone]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const nextPhoneError = e164 ? "" : "Enter a valid Kenyan mobile number.";
    const nextPinError =
      pin.length < 4 ? "PIN must be at least 4 digits." : pin.length > 10 ? "PIN is too long." : !/^\d+$/.test(pin) ? "PIN must contain digits only." : "";

    setPhoneError(nextPhoneError);
    setPinError(nextPinError);
    if (nextPhoneError || nextPinError || !e164) return;

    setBusy(true);
    try {
      await loginFarmer(e164, pin);
      const next = safeNextPath(searchParams.get("next"), "farmer") || "/app/overview";
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(loginMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel my-8 w-full max-w-md p-7 text-stone-900 sm:p-8" noValidate>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-700">Farmer sign in</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">Welcome back</h2>
      </div>

      <label className="mb-4 block text-sm font-medium text-stone-700" htmlFor="farmer-phone">
        Mobile
        <span className="mt-1.5 flex overflow-hidden rounded-lg border border-stone-400/50 bg-white shadow-sm focus-within:border-forest-600 focus-within:ring-4 focus-within:ring-forest-600/15">
          <span className="flex items-center border-r border-stone-200 bg-cream-100 px-3 font-mono text-sm font-medium text-stone-700">
            +254
          </span>
          <input
            id="farmer-phone"
            name="phone"
            className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-3 font-mono text-sm text-stone-800 outline-none placeholder:text-stone-400"
            value={phone}
            onChange={(e) => {
              setPhone(formatKenyaNational(e.target.value));
              setPhoneError("");
            }}
            placeholder="712 345 678"
            autoComplete="tel"
            inputMode="numeric"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            maxLength={11}
            disabled={busy}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? "farmer-phone-error" : undefined}
            required
          />
        </span>
      </label>
      {phoneError ? (
        <p id="farmer-phone-error" className="-mt-2 mb-4 text-sm text-rose-800">
          {phoneError}
        </p>
      ) : (
        <div className="mb-4" />
      )}

      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="farmer-pin">
        PIN
        <span className="relative mt-1.5 block">
          <input
            id="farmer-pin"
            name="pin"
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            pattern="[0-9]*"
            className="field-input py-3 pr-20"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPin(value);
              setPinError("");
            }}
            autoComplete="current-password"
            maxLength={10}
            disabled={busy}
            aria-invalid={pinError ? true : undefined}
            aria-describedby={pinError ? "farmer-pin-error" : undefined}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-1.5 my-1 rounded-md px-2.5 text-xs font-medium text-forest-800 hover:bg-forest-50"
            onClick={() => setShowPin((open) => !open)}
            aria-pressed={showPin}
          >
            {showPin ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      {pinError ? (
        <p id="farmer-pin-error" className="mb-4 text-sm text-rose-800">
          {pinError}
        </p>
      ) : (
        <div className="mb-4" />
      )}

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="w-full rounded-lg bg-forest-800 py-3 text-sm font-medium text-cream-50 shadow-sm transition hover:bg-forest-900 disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
