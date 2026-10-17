"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/lib/kenya-location";
import { KENYA_BOUNDS, clampToKenya } from "@/lib/kenya-location";
import { MapResizeHandler } from "@/components/map-resize-handler";
import { OsmTileLayer } from "@/components/osm-tile-layer";
import { useTranslations } from "next-intl";


type Props = {
  position: Coordinates | null;
  onChange: (position: Coordinates) => void;
  label: string;
  readOnly?: boolean;
};

function MapClick({ onChange }: Pick<Props, "onChange">) {
  useMapEvents({
    click(event) {
      onChange(clampToKenya({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
    },
  });
  return null;
}

export default function FarmProfileMap({ position, onChange, label, readOnly = false }: Props) {
  const [tileError, setTileError] = useState(false);
  const t = useTranslations("outbreak");
  const bounds = useMemo(
    () => L.latLngBounds([KENYA_BOUNDS.south, KENYA_BOUNDS.west], [KENYA_BOUNDS.north, KENYA_BOUNDS.east]),
    [],
  );
  const pin = useMemo(() => L.divIcon({
    className: "farm-location-pin",
    html: '<span aria-hidden="true" style="display:block;width:22px;height:22px;border:4px solid #fff;border-radius:50% 50% 50% 0;background:#166534;transform:rotate(-45deg);box-shadow:0 1px 4px #111"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  }), []);
  const kenyaPosition = useMemo(
    () => position ? [position.latitude, position.longitude] as [number, number] : null,
    [position],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-gray-200">
      <MapContainer
        center={position ? [position.latitude, position.longitude] : [-0.3, 37.8]}
        zoom={6}
        minZoom={5}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        className="h-72 w-full bg-gray-200 sm:h-96"
        scrollWheelZoom={false}
      >
        <MapResizeHandler />
        <OsmTileLayer onTileError={() => setTileError(true)} />
        {!readOnly && <MapClick onChange={onChange} />}
        {kenyaPosition && (
          <Marker
            position={kenyaPosition}
            icon={pin}
            title={label}
            draggable={!readOnly}
            eventHandlers={readOnly ? {} : {
              dragend(event) {
                const point = event.target.getLatLng();
                onChange(clampToKenya({ latitude: point.lat, longitude: point.lng }));
              },
            }}
          />
        )}
      </MapContainer>
      {tileError && <p role="status" className="bg-gray-200 px-3 py-2 text-sm text-gray-900">{t("mapTilesError")}</p>}
    </div>
  );
}
