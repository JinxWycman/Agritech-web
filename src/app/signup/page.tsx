"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ApiError } from "@/lib/http";
import { listCounties, loginFarmer, registerFarmer, type County } from "@/lib/api";
import { formatKenyaNational, toE164Kenya } from "@/lib/phone";

export default function SignupPage() {
  const t = useTranslations("signup");
  const router = useRouter();
  const [counties, setCounties] = useState<County[]>([]);
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [countyId, setCountyId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listCounties().then(setCounties).catch(() => setError(t("loadCountiesError")));
  }, [t]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const phoneNumber = toE164Kenya(phone);
    if (!phoneNumber || fullName.trim().length < 3 || nationalId.trim().length < 6 || pin.length < 4 || pin.length > 10 || pin !== confirmPin || !countyId) {
      setError(t("validationError"));
      return;
    }
    setBusy(true);
    try {
      await registerFarmer({ full_name: fullName.trim(), national_id: nationalId.trim(), phone_number: phoneNumber, pin, county_id: countyId });
      await loginFarmer(phoneNumber, pin);
      router.replace("/app/overview");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t("createError"));
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-dvh bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
    <section className="panel mx-auto w-full max-w-xl space-y-5 p-6 sm:p-8">
      <header><h1 className="text-2xl font-bold">{t("title")}</h1><p className="mt-2 text-sm text-[var(--muted)]">{t("subtitle")}</p></header>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <label className="block text-sm font-medium">{t("fullName")}<input className="field-input mt-1.5 min-h-12" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={3} maxLength={150} required /></label>
        <label className="block text-sm font-medium">{t("nationalId")}<input className="field-input mt-1.5 min-h-12" value={nationalId} onChange={(event) => setNationalId(event.target.value)} minLength={6} maxLength={20} required /></label>
        <label className="block text-sm font-medium">{t("phone")}<input className="field-input mt-1.5 min-h-12" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(formatKenyaNational(event.target.value))} required /></label>
        <label className="block text-sm font-medium">{t("county")}<select className="field-input mt-1.5 min-h-12" value={countyId} onChange={(event) => setCountyId(event.target.value)} required><option value="">{t("chooseCounty")}</option>{counties.map((county) => <option key={county.id} value={county.id}>{county.name}</option>)}</select></label>
        <label className="block text-sm font-medium">{t("pin")}<input className="field-input mt-1.5 min-h-12" type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 10))} minLength={4} required /></label>
        <label className="block text-sm font-medium">{t("confirmPin")}<input className="field-input mt-1.5 min-h-12" type="password" inputMode="numeric" autoComplete="new-password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 10))} minLength={4} required /></label>
        {error && <p role="alert" className="rounded-lg bg-rose-100 p-3 text-sm text-rose-900">{error}</p>}
        <button type="submit" disabled={busy || !counties.length} className="min-h-12 w-full rounded-xl bg-forest-800 px-4 font-semibold text-white disabled:opacity-50">{busy ? t("creating") : t("createAccount")}</button>
      </form>
      <p className="text-sm">{t("alreadyHaveAccount")} <Link href="/login" className="font-semibold text-forest-800 underline">{t("signIn")}</Link></p>
    </section>
  </main>;
}
