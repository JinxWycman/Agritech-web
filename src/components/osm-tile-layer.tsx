"use client";

import { TileLayer } from "react-leaflet";

export function OsmTileLayer({ onTileError }: { onTileError: () => void }) {
  return (
    <TileLayer
      attribution={"&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"}
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      eventHandlers={{ tileerror: onTileError }}
    />
  );
}
