"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ErrorState, EmptyState, LoadingState, SuccessState } from "@/components/portal-state";
import { FarmProfileMapLoader } from "@/components/farm-profile-map-loader";
import { farmerProfileService } from "@/services";
import { farmerProfileSchema, type FarmerProfileFormValues } from "@/lib/farmer-profile-schema";
import { clampToKenya, countyFromCoordinates, isWithinKenya } from "@/lib/kenya-location";
import { getDataMode } from "@/lib/data-mode";
import type { Coordinates } from "@/lib/kenya-location";

const cropOptions = ["Maize", "Beans", "Potatoes", "Vegetables"];
const livestockOptions = ["Cattle", "Goats", "Sheep", "Poultry"];
type FarmerProfileFormInput = {
  farmSizeAcres: string;
  crops: string[];
  livestock: string[];
  subCounty: string;
  ward: string;
  latitude: number | null;
  longitude: number | null;
};

const emptyForm: FarmerProfileFormInput = {
  farmSizeAcres: "",
  crops: [],
  livestock: [],
  subCounty: "",
  ward: "",
  latitude: null,
  longitude: null,
};

export default function FarmerProfilePage() {
  const t = useTranslations("profile");
  const stateText = useTranslations("states");
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["farmer", "profile"], queryFn: farmerProfileService.getProfile });
  const [locationMessage, setLocationMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const form = useForm<FarmerProfileFormInput, unknown, FarmerProfileFormValues>({
    resolver: zodResolver(farmerProfileSchema),
    defaultValues: emptyForm,
  });
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const position: Coordinates | null = latitude !== null && longitude !== null
    ? { latitude, longitude }
    : null;

  useEffect(() => {
    if (profileQuery.data) {
      form.reset({
        farmSizeAcres: profileQuery.data.farmSizeAcres === null ? "" : String(profileQuery.data.farmSizeAcres),
        crops: profileQuery.data.crops,
        livestock: profileQuery.data.livestock,
        subCounty: profileQuery.data.subCounty,
        ward: profileQuery.data.ward,
        latitude: profileQuery.data.latitude,
        longitude: profileQuery.data.longitude,
      });
    } else if (profileQuery.data === null) {
      form.reset(emptyForm);
    }
  }, [form, profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: FarmerProfileFormValues) => farmerProfileService.saveProfile({
      ...values,
      farmSizeAcres: Number(values.farmSizeAcres),
    }),
    onSuccess(profile) {
      setSaved(true);
      queryClient.setQueryData(["farmer", "profile"], profile);
      void queryClient.invalidateQueries({ queryKey: ["farmer"] });
    },
  });

  function choosePosition(point: Coordinates) {
    const clamped = clampToKenya(point);
    form.setValue("latitude", clamped.latitude, { shouldValidate: true, shouldDirty: true });
    form.setValue("longitude", clamped.longitude, { shouldValidate: true, shouldDirty: true });
    setLocationMessage("");
    setSaved(false);
  }

  function handleCoordinateChange(field: "latitude" | "longitude", rawValue: string) {
    form.setValue(field, rawValue === "" ? null : Number(rawValue), { shouldValidate: true, shouldDirty: true });
    setSaved(false);
  }

  function clampCoordinates() {
    if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    if (!isWithinKenya({ latitude, longitude })) {
      choosePosition({ latitude, longitude });
      setLocationMessage(t("coordinatesClamped"));
    }
  }

  function useCurrentLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage(t("locationUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        if (!isWithinKenya(point)) {
          setLocationMessage(t("locationOutsideKenya"));
          return;
        }
        choosePosition(point);
      },
      (error) => setLocationMessage(
        error.code === error.PERMISSION_DENIED ? t("locationDenied") : t("locationUnavailable"),
      ),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  if (profileQuery.isLoading) return <LoadingState />;
  if (profileQuery.isError) {
    return <ErrorState onRetry={() => void profileQuery.refetch()} message={getDataMode() === "mock" ? stateText("demoError") : undefined} />;
  }

  const county = position ? countyFromCoordinates(position) : "";
  const coordinateError = form.formState.errors.latitude?.message;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {profileQuery.data === null && <EmptyState title={t("firstTimeTitle")} text={t("firstTimeText")} />}
      {saveMutation.isError && (
        <ErrorState
          onRetry={() => form.handleSubmit((values) => saveMutation.mutate(values))()}
          message={getDataMode() === "mock" ? t("saveError") : t("apiSaveUnavailable")}
        />
      )}
      {saved && <SuccessState text={t("saved")} />}
      <form
        className="panel space-y-6 p-4 sm:p-6"
        onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-medium">{t("farmSize")}</span>
            <input
              type="number"
              min="0.1"
              step="any"
              inputMode="decimal"
              {...form.register("farmSizeAcres")}
              className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
              aria-invalid={Boolean(form.formState.errors.farmSizeAcres)}
            />
            {form.formState.errors.farmSizeAcres && <span className="mt-1 block text-sm text-red-700">{t("farmSizeError")}</span>}
          </label>
          {(["subCounty", "ward"] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-1 block font-medium">{t(field)}</span>
              <input
                type="text"
                autoComplete="off"
                {...form.register(field)}
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
                aria-invalid={Boolean(form.formState.errors[field])}
              />
              {form.formState.errors[field] && <span className="mt-1 block text-sm text-red-700">{t("required")}</span>}
            </label>
          ))}
        </div>

        <fieldset>
          <legend className="font-semibold">{t("crops")}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {cropOptions.map((crop) => (
              <label key={crop} className="flex min-h-12 items-center gap-2 rounded-lg border border-[var(--border)] px-3">
                <input type="checkbox" value={crop} {...form.register("crops")} className="size-5 accent-forest-700" />
                <span>{t(`cropOptions.${crop}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-semibold">{t("livestock")}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {livestockOptions.map((animal) => (
              <label key={animal} className="flex min-h-12 items-center gap-2 rounded-lg border border-[var(--border)] px-3">
                <input type="checkbox" value={animal} {...form.register("livestock")} className="size-5 accent-forest-700" />
                <span>{t(`livestockOptions.${animal}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section aria-labelledby="location-heading" className="space-y-3">
          <div>
            <h2 id="location-heading" className="text-lg font-semibold">{t("location")}</h2>
            <p className="text-sm text-[var(--muted)]">{t("mapInstructions")}</p>
          </div>
          <FarmProfileMapLoader position={position} onChange={choosePosition} label={t("mapPin")} />
          <button type="button" onClick={useCurrentLocation} className="min-h-12 rounded-xl border border-[var(--border)] px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600">
            {t("useLocation")}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["latitude", "longitude"] as const).map((field) => (
              <label key={field}>
                <span className="mb-1 block font-medium">{t(field)}</span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={form.watch(field) ?? ""}
                  onChange={(event) => handleCoordinateChange(field, event.target.value)}
                  onBlur={clampCoordinates}
                  className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3"
                  aria-invalid={Boolean(coordinateError)}
                />
              </label>
            ))}
          </div>
          {coordinateError && <p className="text-sm text-red-700">{t(coordinateError)}</p>}
          {locationMessage && <p role="alert" className="text-sm text-red-700">{locationMessage}</p>}
          <p aria-live="polite" className="text-sm font-medium">{t("approxCounty", { county: county || t("notSelected") })}</p>
          <p className="text-xs text-[var(--muted)]">{t("countyApproximate")}</p>
        </section>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="min-h-12 w-full rounded-xl bg-forest-700 px-5 py-3 font-semibold text-white hover:bg-forest-800 disabled:opacity-60 sm:w-auto"
        >
          {saveMutation.isPending ? t("saving") : t("save")}
        </button>
      </form>
      <p className="text-xs text-[var(--muted)]">{t("sampleLabel")}</p>
    </div>
  );
}
