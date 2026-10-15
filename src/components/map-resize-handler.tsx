"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;
    const invalidate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    };
    invalidate();
    const observer = new ResizeObserver(invalidate);
    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);

  return null;
}
