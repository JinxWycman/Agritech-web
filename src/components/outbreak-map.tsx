"use client";

import { useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { KENYA_BOUNDS } from "@/lib/kenya-location";
import { MapResizeHandler } from "@/components/map-resize-handler";
import { OsmTileLayer } from "@/components/osm-tile-layer";
import { useTranslations } from "next-intl";
import type { Coordinates } from "@/lib/kenya-location";
import type { OutbreakAlert, SignalCell } from "@/types/outbreak";


export default function OutbreakMap({
  cells,
  alerts,
  farmPin,
  farmLabel,
  onCellSelect,
}: {
  cells: SignalCell[];
  alerts: OutbreakAlert[];
  farmPin?: Coordinates | null;
  farmLabel: string;
  onCellSelect?: (cell: SignalCell) => void;
}) {
  const [tileError, setTileError] = useState(false);
  const t = useTranslations("outbreak");
  const bounds = useMemo(
    () => L.latLngBounds([KENYA_BOUNDS.south, KENYA_BOUNDS.west], [KENYA_BOUNDS.north, KENYA_BOUNDS.east]),
    [],
  );
  const farmIcon = useMemo(() => L.divIcon({
    className: "farm-location-pin",
    html: '<span aria-hidden="true" style="display:block;width:22px;height:22px;border:4px solid #fff;border-radius:50% 50% 50% 0;background:#166534;transform:rotate(-45deg);box-shadow:0 1px 4px #111"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  }), []);
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-gray-200">
      <MapContainer center={farmPin ? [farmPin.latitude, farmPin.longitude] : [-0.3, 37.8]} zoom={6} minZoom={5} maxBounds={bounds} maxBoundsViscosity={1} className="h-72 w-full bg-gray-200 sm:h-96" scrollWheelZoom={false}>
        <MapResizeHandler />
        <OsmTileLayer onTileError={() => setTileError(true)} />
        {cells.map((cell) => {
          const radius = Math.min(12000, 2500 + cell.count * 900);
          return <CircleMarker key={cell.cellId} center={[cell.centerLat, cell.centerLng]} radius={Math.max(8, Math.min(24, 6 + cell.count * 1.2))} pathOptions={{ color: cell.flagged ? "#b91c1c" : "#166534", fillColor: cell.flagged ? "#dc2626" : "#22c55e", fillOpacity: 0.55 }} eventHandlers={onCellSelect ? { click: () => onCellSelect(cell) } : undefined}>
            <Tooltip permanent direction="center">{cell.count}</Tooltip>
            <Popup><strong>{cell.count}</strong> reports · {cell.issueType}{cell.subjectKey ? ` · ${cell.subjectKey}` : ""}{cell.flagged ? " · flagged" : ""}</Popup>
            <Circle center={[cell.centerLat, cell.centerLng]} radius={radius} pathOptions={{ color: cell.flagged ? "#b91c1c" : "#166534", fillOpacity: 0.08 }} />
          </CircleMarker>;
        })}
        {alerts.filter((alert) => alert.status === "sent").map((alert) =>
          <Circle key={alert.id} center={[alert.centerLat, alert.centerLng]} radius={alert.radiusKm * 1000} pathOptions={{ color: "#1d4ed8", fillOpacity: 0.12 }}>
            <Popup>{alert.message.en} · {alert.recipientCount} simulated recipients</Popup>
          </Circle>,
        )}
        {farmPin && <Marker position={[farmPin.latitude, farmPin.longitude]} icon={farmIcon} title={farmLabel}><Popup>{farmLabel}</Popup></Marker>}
      </MapContainer>
      {tileError && <p role="status" className="bg-gray-200 px-3 py-2 text-sm text-gray-900">{t("mapTilesError")}</p>}
    </div>
  );
}
