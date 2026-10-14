"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Coordinates } from "@/lib/kenya-location";
import { KENYA_BOUNDS, clampToKenya } from "@/lib/kenya-location";
import "leaflet/dist/leaflet.css";

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
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <MapContainer
        center={position ? [position.latitude, position.longitude] : [-0.3, 37.8]}
        zoom={6}
        minZoom={5}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        className="h-72 w-full sm:h-96"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
    </div>
  );
}
