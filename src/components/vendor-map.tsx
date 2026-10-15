"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { KENYA_BOUNDS } from "@/lib/kenya-location";
import { MapResizeHandler } from "@/components/map-resize-handler";
import { OsmTileLayer } from "@/components/osm-tile-layer";
import { useTranslations } from "next-intl";
import { pickLocalized, type VendorWithDistance } from "@/types/business";
import type { Coordinates } from "@/lib/kenya-location";


export default function VendorMap({
  farm,
  vendors,
  locale,
  farmLabel,
}: {
  farm: Coordinates | null;
  vendors: VendorWithDistance[];
  locale: "en" | "sw";
  farmLabel: string;
}) {
  const [tileError, setTileError] = useState(false);
  const t = useTranslations("outbreak");
  const bounds = useMemo(
    () => L.latLngBounds([KENYA_BOUNDS.south, KENYA_BOUNDS.west], [KENYA_BOUNDS.north, KENYA_BOUNDS.east]),
    [],
  );
  const vendorIcon = useMemo(() => L.divIcon({
    className: "vendor-location-pin",
    html: '<span aria-hidden="true" style="display:block;width:18px;height:18px;border:3px solid #fff;border-radius:50%;background:#166534;box-shadow:0 1px 4px #111"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  }), []);
  const farmIcon = useMemo(() => L.divIcon({
    className: "farm-location-pin",
    html: '<span aria-hidden="true" style="display:block;width:22px;height:22px;border:4px solid #fff;border-radius:50% 50% 50% 0;background:#b45309;transform:rotate(-45deg);box-shadow:0 1px 4px #111"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  }), []);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-gray-200">
      <MapContainer
        center={farm ? [farm.latitude, farm.longitude] : [-0.3, 37.8]}
        zoom={farm ? 7 : 6}
        minZoom={5}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        className="h-72 w-full bg-gray-200 sm:h-96"
        scrollWheelZoom={false}
      >
        <MapResizeHandler />
        <OsmTileLayer onTileError={() => setTileError(true)} />
        {farm && <Marker position={[farm.latitude, farm.longitude]} icon={farmIcon} title={farmLabel}><Popup>{farmLabel}</Popup></Marker>}
        {vendors.map((vendor) => {
          const label = pickLocalized(vendor.name, locale);
          return (
            <Marker key={vendor.id} position={[vendor.location.latitude, vendor.location.longitude]} icon={vendorIcon} title={label}>
              <Popup>
                <Link href={`/app/agrovets/${vendor.id}`}>{label}</Link>
                {vendor.distanceKm !== null && <p>{vendor.distanceKm.toFixed(1)} km</p>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {tileError && <p role="status" className="bg-gray-200 px-3 py-2 text-sm text-gray-900">{t("mapTilesError")}</p>}
      
    </div>
  );
}
