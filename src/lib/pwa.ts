export function isCacheableNavigation(requestMethod: string, pathname: string, status: number, cacheControl: string | null): boolean {
  if (requestMethod !== "GET" || status !== 200) return false;
  if (pathname.startsWith("/backend/") || pathname.startsWith("/api/") || pathname.startsWith("https://")) return false;
  const directives = (cacheControl ?? "").toLowerCase();
  return !directives.includes("no-store") && !directives.includes("private");
}
