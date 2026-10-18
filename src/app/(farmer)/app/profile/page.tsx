"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ErrorState, EmptyState, LoadingState, SuccessState } from "@/components/portal-state";
import { emptyLocation, LocationPicker, type LocationSelection } from "@/components/location-picker";
import { FarmProfileMapLoader } from "@/features/farmers/components";
import { farmerProfileService } from "@/services";
import { EXPERIENCE_LEVELS, farmEntryErrors, SOIL_TYPES } from "@/lib/farmer-profile-schema";
import { clampToKenya, countyFromCoordinates, isWithinKenya } from "@/lib/kenya-location";
import { locateSelection, readDevicePosition, type LocationFailure } from "@/lib/current-location";
import { getDataMode } from "@/lib/data-mode";
import type { Coordinates } from "@/lib/kenya-location";
import type { CropEntry, LivestockEntry } from "@/types/domain";

const inputClass = "min-h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3";
const failureMessage: Record<LocationFailure, string> = {
  unsupported: "locationUnavailable",
  unavailable: "locationUnavailable",
  denied: "locationDenied",
  outsideKenya: "locationOutsideKenya",
};

export default function FarmerProfilePage() {
  const t = useTranslations("profile");
  const stateText = useTranslations("states");
  const queryClient = useQueryClient();
  const liveMode = getDataMode() !== "mock";
  const profileQuery = useQuery({ queryKey: ["farmer", "profile"], queryFn: farmerProfileService.getProfile });
  const catalogueQuery = useQuery({ queryKey: ["farmer", "catalogue"], queryFn: farmerProfileService.getCatalogue, staleTime: Infinity });

  const [crops, setCrops] = useState<Record<string, CropEntry>>({});
  const [livestock, setLivestock] = useState<Record<string, LivestockEntry>>({});
  const [location, setLocation] = useState<LocationSelection>(emptyLocation);
  const [subCounty, setSubCounty] = useState("");
  const [ward, setWard] = useState("");
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    setCrops(Object.fromEntries((profile.cropEntries ?? profile.crops.map((name) => ({ cropId: name, name, farmSizeAcres: 0, soilType: "", experienceLevel: "" })))
      .map((entry) => [entry.cropId, entry])));
    setLivestock(Object.fromEntries((profile.livestockEntries ?? profile.livestock.map((name) => ({ livestockId: name, name, herdSize: 0 })))
      .map((entry) => [entry.livestockId, entry])));
    setLocation({
      countyId: profile.countyId ?? "", countyName: profile.county,
      constituencyId: profile.constituencyId ?? "", constituencyName: profile.subCounty,
      wardId: profile.wardId ?? "", wardName: profile.ward,
    });
    setSubCounty(profile.subCounty);
    setWard(profile.ward);
    setPosition(profile.latitude !== null && profile.longitude !== null ? { latitude: profile.latitude, longitude: profile.longitude } : null);
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const cropEntries = Object.values(crops);
      return farmerProfileService.saveProfile({
        farmSizeAcres: cropEntries.reduce((sum, entry) => sum + entry.farmSizeAcres, 0) || null,
        crops: cropEntries.map((entry) => entry.name),
        livestock: Object.values(livestock).map((entry) => entry.name),
        cropEntries,
        livestockEntries: Object.values(livestock),
        subCounty: liveMode ? location.constituencyName : subCounty.trim(),
        ward: liveMode ? location.wardName : ward.trim(),
        countyId: location.countyId || undefined,
        constituencyId: location.constituencyId || undefined,
        wardId: location.wardId || undefined,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
      });
    },
    onSuccess(profile) {
      setSaved(true);
      queryClient.setQueryData(["farmer", "profile"], profile);
      void queryClient.invalidateQueries({ queryKey: ["farmer"] });
    },
  });

  async function placePin(point: Coordinates) {
    const clamped = clampToKenya(point);
    setPosition(clamped);
    setSaved(false);
    setLocationMessage("");
    if (!liveMode) return;
    try {
      const match = await locateSelection(clamped);
      setLocation(match);
      setLocationMessage(t("matchedLocation", { subCounty: match.constituencyName, county: match.countyName }));
    } catch {
      // The farmer can still choose the location manually.
    }
  }

  async function fillFromDeviceLocation() {
    setLocating(true);
    setLocationMessage("");
    try {
      await placePin(await readDevicePosition());
    } catch (failure) {
      setLocationMessage(t(failureMessage[failure as LocationFailure] ?? "locationUnavailable"));
    } finally {
      setLocating(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: string[] = farmEntryErrors(Object.values(crops), Object.values(livestock));
    if (liveMode ? !location.countyId || !location.constituencyId || !location.wardId : !subCounty.trim() || !ward.trim()) next.push("required");
    if (!position || !isWithinKenya(position)) next.push("locationRequired");
    setErrors(next);
    if (!next.length) saveMutation.mutate();
  }

  if (profileQuery.isLoading) return <LoadingState />;
  if (profileQuery.isError) {
    return <ErrorState onRetry={() => void profileQuery.refetch()} message={getDataMode() === "mock" ? stateText("demoError") : undefined} />;
  }

  const label = (group: "cropOptions" | "livestockOptions", name: string) => (t.has(`${group}.${name}`) ? t(`${group}.${name}`) : name);
  const totalAcres = Object.values(crops).reduce((sum, entry) => sum + (entry.farmSizeAcres || 0), 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {profileQuery.data === null && <EmptyState title={t("firstTimeTitle")} text={t("firstTimeText")} />}
      {saveMutation.isError && <ErrorState onRetry={() => saveMutation.mutate()} message={t("saveError")} />}
      {saved && <SuccessState text={liveMode ? t("savedLive") : t("saved")} />}
      <form className="space-y-5" onSubmit={submit} noValidate>
        <section className="panel space-y-3 p-4 sm:p-6" aria-labelledby="crops-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="crops-heading" className="text-lg font-semibold">{t("crops")}</h2>
            {totalAcres > 0 && <p className="text-sm text-[var(--muted)]">{t("totalFarmSize", { acres: Math.round(totalAcres * 100) / 100 })}</p>}
          </div>
          <div className="space-y-2">
            {catalogueQuery.data?.crops.map((item) => {
              const entry = crops[item.id];
              return (
                <div key={item.id} className={`rounded-xl border p-3 ${entry ? "border-forest-600 bg-forest-50/40" : "border-[var(--border)]"}`}>
                  <label className="flex min-h-10 items-center gap-2 font-medium">
                    <input type="checkbox" className="size-5 accent-forest-700" checked={Boolean(entry)} onChange={(event) => {
                      setSaved(false);
                      setCrops((current) => {
                        const next = { ...current };
                        if (event.target.checked) next[item.id] = { cropId: item.id, name: item.name, farmSizeAcres: 0, soilType: "", experienceLevel: "" };
                        else delete next[item.id];
                        return next;
                      });
                    }} />
                    {label("cropOptions", item.name)}
                  </label>
                  {entry && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      <label className="text-sm">{t("cropArea")}
                        <input type="number" min="0.1" step="any" inputMode="decimal" className={inputClass} value={entry.farmSizeAcres || ""}
                          onChange={(event) => setCrops((current) => ({ ...current, [item.id]: { ...entry, farmSizeAcres: Number(event.target.value) } }))} />
                      </label>
                      <label className="text-sm">{t("soilType")}
                        <select className={inputClass} value={entry.soilType} onChange={(event) => setCrops((current) => ({ ...current, [item.id]: { ...entry, soilType: event.target.value } }))}>
                          <option value="">{t("choose")}</option>
                          {SOIL_TYPES.map((soil) => <option key={soil} value={soil}>{t(`soilOptions.${soil}`)}</option>)}
                        </select>
                      </label>
                      <label className="text-sm">{t("experienceLevel")}
                        <select className={inputClass} value={entry.experienceLevel} onChange={(event) => setCrops((current) => ({ ...current, [item.id]: { ...entry, experienceLevel: event.target.value } }))}>
                          <option value="">{t("choose")}</option>
                          {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{t(`experienceOptions.${level}`)}</option>)}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {errors.includes("cropDetailsError") && <p role="alert" className="text-sm text-red-700">{t("cropDetailsError")}</p>}
        </section>

        <section className="panel space-y-3 p-4 sm:p-6" aria-labelledby="livestock-heading">
          <h2 id="livestock-heading" className="text-lg font-semibold">{t("livestock")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalogueQuery.data?.livestock.map((item) => {
              const entry = livestock[item.id];
              return (
                <div key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${entry ? "border-forest-600 bg-forest-50/40" : "border-[var(--border)]"}`}>
                  <label className="flex min-h-10 items-center gap-2 font-medium">
                    <input type="checkbox" className="size-5 accent-forest-700" checked={Boolean(entry)} onChange={(event) => {
                      setSaved(false);
                      setLivestock((current) => {
                        const next = { ...current };
                        if (event.target.checked) next[item.id] = { livestockId: item.id, name: item.name, herdSize: 0 };
                        else delete next[item.id];
                        return next;
                      });
                    }} />
                    {label("livestockOptions", item.name)}
                  </label>
                  {entry && (
                    <label className="flex items-center gap-2 text-sm">{t("herdSize")}
                      <input type="number" min="1" step="1" inputMode="numeric" className={`${inputClass} w-24`} value={entry.herdSize || ""}
                        onChange={(event) => setLivestock((current) => ({ ...current, [item.id]: { ...entry, herdSize: Number(event.target.value) } }))} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          {errors.includes("herdSizeError") && <p role="alert" className="text-sm text-red-700">{t("herdSizeError")}</p>}
        </section>

        <section aria-labelledby="location-heading" className="panel space-y-3 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="location-heading" className="text-lg font-semibold">{t("location")}</h2>
              <p className="text-sm text-[var(--muted)]">{t("mapInstructions")}</p>
            </div>
            <button type="button" onClick={() => void fillFromDeviceLocation()} disabled={locating}
              className="min-h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 disabled:opacity-60">
              {locating ? stateText("loading") : t("useLocation")}
            </button>
          </div>
          <FarmProfileMapLoader position={position} onChange={(point) => void placePin(point)} label={t("mapPin")} />
          {position && <p className="font-mono text-xs text-[var(--muted)]">{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</p>}
          {locationMessage && <p aria-live="polite" className="text-sm">{locationMessage}</p>}
          {liveMode ? (
            <LocationPicker value={location} onChange={(next) => { setLocation(next); setSaved(false); }} />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">{t("subCounty")}<input className={inputClass} value={subCounty} onChange={(event) => setSubCounty(event.target.value)} /></label>
                <label className="text-sm font-medium">{t("ward")}<input className={inputClass} value={ward} onChange={(event) => setWard(event.target.value)} /></label>
              </div>
              <p className="text-sm">{t("approxCounty", { county: position ? countyFromCoordinates(position) : t("notSelected") })}</p>
            </>
          )}
          {errors.includes("required") && <p role="alert" className="text-sm text-red-700">{t("required")}</p>}
          {errors.includes("locationRequired") && <p role="alert" className="text-sm text-red-700">{t("locationRequired")}</p>}
          <p className="text-xs text-[var(--muted)]">{t("countyApproximate")}</p>
        </section>

        <button type="submit" disabled={saveMutation.isPending}
          className="min-h-12 w-full rounded-xl bg-forest-700 px-5 py-3 font-semibold text-white hover:bg-forest-800 disabled:opacity-60 sm:w-auto">
          {saveMutation.isPending ? t("saving") : t("save")}
        </button>
      </form>
      {!liveMode && <p className="text-xs text-[var(--muted)]">{t("sampleLabel")}</p>}
    </div>
  );
}
