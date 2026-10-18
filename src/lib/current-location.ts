import { locateCoordinates, type LocationMatch } from "@/lib/api";
import { isWithinKenya, type Coordinates } from "@/lib/kenya-location";
import type { LocationSelection } from "@/components/location-picker";

export type LocationFailure = "unsupported" | "denied" | "unavailable" | "outsideKenya";

/** Read the device position. Browsers only allow this on HTTPS (or localhost). */
export function readDevicePosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject("unsupported" satisfies LocationFailure);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        if (isWithinKenya(point)) resolve(point);
        else reject("outsideKenya" satisfies LocationFailure);
      },
      (error) => reject((error.code === error.PERMISSION_DENIED ? "denied" : "unavailable") satisfies LocationFailure),
      // A cached fix up to 5 minutes old is fine for a farm; allow slow GPS on phones.
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 },
    );
  });
}

/** County and sub-county for a point, ready for the location picker (ward left for the farmer). */
export function selectionFromMatch(match: LocationMatch): LocationSelection {
  return {
    countyId: match.county.id,
    countyName: match.county.name,
    constituencyId: match.constituency.id,
    constituencyName: match.constituency.name,
    wardId: match.wards.length === 1 ? match.wards[0].id : "",
    wardName: match.wards.length === 1 ? match.wards[0].name : "",
  };
}

export async function locateSelection(point: Coordinates): Promise<LocationSelection> {
  return selectionFromMatch(await locateCoordinates(point.latitude, point.longitude));
}
