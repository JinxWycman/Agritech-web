"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { listConstituencies, listCounties, listWards } from "@/lib/api";

export type LocationSelection = {
  countyId: string;
  countyName: string;
  constituencyId: string;
  constituencyName: string;
  wardId: string;
  wardName: string;
};

export const emptyLocation: LocationSelection = {
  countyId: "", countyName: "", constituencyId: "", constituencyName: "", wardId: "", wardName: "",
};

/** County → sub-county → ward selects; each level loads once its parent is chosen. */
export function LocationPicker({ value, onChange, disabled = false, required = false }: {
  value: LocationSelection;
  onChange: (next: LocationSelection) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const t = useTranslations("location");
  const counties = useQuery({ queryKey: ["counties"], queryFn: listCounties, staleTime: Infinity });
  const constituencies = useQuery({
    queryKey: ["constituencies", value.countyId],
    queryFn: () => listConstituencies(value.countyId),
    enabled: Boolean(value.countyId),
    staleTime: Infinity,
  });
  const wards = useQuery({
    queryKey: ["wards", value.constituencyId],
    queryFn: () => listWards(value.constituencyId),
    enabled: Boolean(value.constituencyId),
    staleTime: Infinity,
  });

  const selectClass = "field-input mt-1.5 min-h-12 disabled:opacity-60";
  const loadError = counties.isError || constituencies.isError || wards.isError;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block text-sm font-medium">
        {t("county")}
        <select
          className={selectClass}
          value={value.countyId}
          disabled={disabled || !counties.data}
          required={required}
          onChange={(event) => {
            const county = counties.data?.find((row) => row.id === event.target.value);
            onChange({ ...emptyLocation, countyId: county?.id ?? "", countyName: county?.name ?? "" });
          }}
        >
          <option value="">{counties.isLoading ? t("loading") : t("chooseCounty")}</option>
          {counties.data?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t("subCounty")}
        <select
          className={selectClass}
          value={value.constituencyId}
          disabled={disabled || !value.countyId || !constituencies.data}
          required={required}
          onChange={(event) => {
            const row = constituencies.data?.find((item) => item.id === event.target.value);
            onChange({ ...value, constituencyId: row?.id ?? "", constituencyName: row?.name ?? "", wardId: "", wardName: "" });
          }}
        >
          <option value="">{constituencies.isFetching ? t("loading") : t("chooseSubCounty")}</option>
          {constituencies.data?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium">
        {t("ward")}
        <select
          className={selectClass}
          value={value.wardId}
          disabled={disabled || !value.constituencyId || !wards.data}
          required={required}
          onChange={(event) => {
            const row = wards.data?.find((item) => item.id === event.target.value);
            onChange({ ...value, wardId: row?.id ?? "", wardName: row?.name ?? "" });
          }}
        >
          <option value="">{wards.isFetching ? t("loading") : t("chooseWard")}</option>
          {wards.data?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      {loadError && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{t("loadError")}</p>}
    </div>
  );
}
