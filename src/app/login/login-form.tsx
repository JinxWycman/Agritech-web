"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginStaff } from "@/lib/api";
import { ApiError, safeNextPath, staffHome } from "@/lib/http";
import { formatKenyaNational, toE164Kenya } from "@/lib/phone";

function loginMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "Line is down. Check your internet, then try again.";
    if (error.status === 429) return "Too many tries. Wait a minute.";
    if (error.status === 401 || error.status === 403) return "Wrong number or password.";
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Could not sign in. Try again.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);

  const e164 = useMemo(() => toE164Kenya(phone), [phone]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const nextPhoneError = e164 ? "" : "Enter a Kenyan mobile number.";
    const nextPasswordError =
      password.length < 8 ? "Password must be at least 8 characters." : password.length > 128 ? "Password is too long." : "";
    setPhoneError(nextPhoneError);
    setPasswordError(nextPasswordError);
    if (nextPhoneError || nextPasswordError || !e164) return;

    setBusy(true);
    try {
      const data = await loginStaff(e164, password);
      const destination = safeNextPath(searchParams.get("next"), data.role) || staffHome(data.role);
      if (!destination) {
        setError("This account cannot open the desk.");
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch (err) {
      setError(loginMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel my-8 w-full max-w-md p-7 text-stone-900 sm:p-8" noValidate>
      <h2 className="mb-5 text-lg font-semibold text-stone-900">Sign in</h2>

      <label className="mb-4 block text-sm font-medium text-stone-700" htmlFor="staff-phone">
        Mobile
        <span className="mt-1.5 flex overflow-hidden rounded-lg border border-stone-400/50 bg-white shadow-sm focus-within:border-forest-600 focus-within:ring-4 focus-within:ring-forest-600/15">
          <span className="flex items-center border-r border-stone-200 bg-cream-100 px-3 font-mono text-sm font-medium text-stone-700">
            +254
          </span>
          <input
            id="staff-phone"
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
            aria-describedby={phoneError ? "staff-phone-error" : undefined}
            required
          />
        </span>
      </label>
      {phoneError ? (
        <p id="staff-phone-error" className="-mt-2 mb-4 text-sm text-rose-800">
          {phoneError}
        </p>
      ) : (
        <div className="mb-4" />
      )}

      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="staff-password">
        Password
        <span className="relative mt-1.5 block">
          <input
            id="staff-password"
            name="password"
            type={showPassword ? "text" : "password"}
            className="field-input py-3 pr-20"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            autoComplete="current-password"
            maxLength={128}
            disabled={busy}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? "staff-password-error" : capsLock ? "staff-caps" : undefined}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-1.5 my-1 rounded-md px-2.5 text-xs font-medium text-forest-800 hover:bg-forest-50"
            onClick={() => setShowPassword((open) => !open)}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      {passwordError ? (
        <p id="staff-password-error" className="mb-4 text-sm text-rose-800">
          {passwordError}
        </p>
      ) : capsLock ? (
        <p id="staff-caps" className="mb-4 text-sm text-soil-700">
          Caps Lock is on.
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
