import { haversineDistanceKm } from "@/lib/geo";
import type { Coordinates } from "@/lib/kenya-location";
import type { Vendor, VendorProduct, VendorSearchFilters, VendorWithDistance } from "@/types/business";

export function filterAndSortVendors(
  vendors: Vendor[],
  products: VendorProduct[],
  filters: VendorSearchFilters,
  point?: Coordinates | null,
): VendorWithDistance[] {
  const query = filters.text?.trim().toLocaleLowerCase();
  const productQuery = filters.product?.trim().toLocaleLowerCase();
  const matchingVendorIds = productQuery
    ? new Set(products.filter((product) => [product.id, product.category, product.name.en, product.name.sw]
      .some((value) => value.toLocaleLowerCase().includes(productQuery))).map((product) => product.vendorId))
    : null;
  return vendors
    .filter((vendor) => !filters.county || vendor.county === filters.county)
    .filter((vendor) => !filters.category || vendor.categories.includes(filters.category))
    .filter((vendor) => !matchingVendorIds || matchingVendorIds.has(vendor.id))
    .filter((vendor) => !query || [vendor.name.en, vendor.name.sw, vendor.county, ...vendor.categories]
      .some((value) => value.toLocaleLowerCase().includes(query)))
    .map((vendor) => ({
      ...vendor,
      distanceKm: point ? haversineDistanceKm(point, vendor.location) : null,
    }))
    .sort((left, right) => {
      if (left.distanceKm !== null && right.distanceKm !== null && left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }
      return left.name.en.localeCompare(right.name.en);
    });
}
