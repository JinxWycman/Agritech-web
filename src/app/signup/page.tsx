"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/http";
import { loginFarmer, registerFarmer } from "@/lib/api";
import { formatKenyaNational, toE164Kenya } from "@/lib/phone";
import { emptyLocation, LocationPicker, type LocationSelection } from "@/components/location-picker";
import { locateSelection, readDevicePosition } from "@/lib/current-location";
import type { Coordinates } from "@/lib/kenya-location";

export default function SignupPage() {
  const t = useTranslations("signup");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<LocationSelection>(emptyLocation);
  const [point, setPoint] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function fillFromDeviceLocation() {
    setLocating(true);
    setLocationNote("");
    try {
      const position = await readDevicePosition();
      setLocation(await locateSelection(position));
      setPoint(position);
      setLocationNote(t("locatedHint"));
    } catch {
      setLocationNote(t("locationFailed"));
    } finally {
      setLocating(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const phoneNumber = toE164Kenya(phone);
    if (!phoneNumber || fullName.trim().length < 3 || nationalId.trim().length < 6 || pin.length < 4 || pin.length > 10 || pin !== confirmPin
      || !location.countyId || !location.constituencyId || !location.wardId) {
      setError(t("validationError"));
      return;
    }
    setBusy(true);
    try {
      await registerFarmer({
        full_name: fullName.trim(),
        national_id: nationalId.trim(),
        phone_number: phoneNumber,
        pin,
        county_id: location.countyId,
        constituency_id: location.constituencyId,
        ward_id: location.wardId,
        latitude: point?.latitude ?? null,
        longitude: point?.longitude ?? null,
      });
      await loginFarmer(phoneNumber, pin);
      router.replace("/app/profile");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t("createError"));
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-dvh bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
    <section className="panel mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8">
      <header>
        <h1 className="font-serif text-3xl tracking-[-0.02em]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("subtitle")}</p>
      </header>
      <form onSubmit={(event) => void submit(event)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">{t("fullName")}<input className="field-input mt-1.5 min-h-12" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={3} maxLength={150} required /></label>
          <label className="block text-sm font-medium">{t("nationalId")}<input className="field-input mt-1.5 min-h-12" inputMode="numeric" value={nationalId} onChange={(event) => setNationalId(event.target.value)} minLength={6} maxLength={20} required /></label>
          <label className="block text-sm font-medium">{t("phone")}<input className="field-input mt-1.5 min-h-12" type="tel" autoComplete="tel" inputMode="tel" placeholder="712 345 678" value={phone} onChange={(event) => setPhone(formatKenyaNational(event.target.value))} required /></label>
        </div>

        <fieldset className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <legend className="text-sm font-semibold">{t("county")}</legend>
            <button type="button" onClick={() => void fillFromDeviceLocation()} disabled={locating}
              className="min-h-11 rounded-lg border border-[var(--border)] px-3 text-sm font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-forest-500/30 disabled:opacity-60">
              {locating ? t("locating") : t("useLocation")}
            </button>
          </div>
          <LocationPicker value={location} onChange={(next) => { setLocation(next); setLocationNote(""); }} required />
          {locationNote && <p aria-live="polite" className="text-sm text-[var(--muted)]">{locationNote}</p>}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">{t("pin")}<input className="field-input mt-1.5 min-h-12" type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 10))} minLength={4} required /></label>
          <label className="block text-sm font-medium">{t("confirmPin")}<input className="field-input mt-1.5 min-h-12" type="password" inputMode="numeric" autoComplete="new-password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 10))} minLength={4} required /></label>
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-100 p-3 text-sm text-rose-900">{error}</p>}
        <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-forest-800 px-4 font-semibold text-white hover:bg-forest-900 disabled:opacity-50">{busy ? t("creating") : t("createAccount")}</button>
      </form>
      <p className="text-sm">{t("alreadyHaveAccount")} <Link href="/login" className="font-semibold text-forest-800 underline">{t("signIn")}</Link></p>
    </section>
  </main>;
}
