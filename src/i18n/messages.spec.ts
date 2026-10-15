import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en";
import sw from "@/i18n/messages/sw";
import { formatDate, formatDateTime, formatKes, formatNumber } from "@/lib/format";
import { isCacheableNavigation } from "@/lib/pwa";

function flatten(value: unknown, prefix = ""): Map<string, string> {
  const output = new Map<string, string>();
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      for (const [childPath, childValue] of flatten(item, path)) output.set(childPath, childValue);
    }
  } else if (typeof value === "string") output.set(prefix, value);
  return output;
}

describe("message locale parity", () => {
  const english = flatten(en);
  const swahili = flatten(sw);
  it("has identical nested string keys", () => {
    expect([...swahili.keys()].sort()).toEqual([...english.keys()].sort());
  });
  it("has non-empty messages and matching placeholders", () => {
    for (const [key, text] of english) {
      expect(text.trim(), key).not.toBe("");
      const translated = swahili.get(key) ?? "";
      expect(translated.trim(), key).not.toBe("");
      const params = (value: string) => [...value.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]).sort();
      expect(params(translated), key).toEqual(params(text));
    }
  });
});

describe("locale formatting", () => {
  it("formats Kenyan shillings, dates and numbers in both locales", () => {
    expect(formatKes(250, "en")).toContain("250");
    expect(formatKes(250, "sw")).toContain("250");
    expect(formatDate("2026-10-15", "en")).not.toBe("");
    expect(formatDateTime("2026-10-15T10:00:00Z", "sw")).not.toBe("");
    expect(formatNumber(1234, "en")).not.toBe("");
  });
});

describe("service worker navigation policy", () => {
  it("caches only successful public GET navigations without private/no-store directives", () => {
    expect(isCacheableNavigation("GET", "/app/overview", 200, "public, max-age=60")).toBe(true);
    expect(isCacheableNavigation("GET", "/app/overview", 200, "private, no-store")).toBe(false);
    expect(isCacheableNavigation("GET", "/backend/farmers", 200, "public")).toBe(false);
    expect(isCacheableNavigation("POST", "/app/overview", 200, "public")).toBe(false);
    expect(isCacheableNavigation("GET", "/app/overview", 500, "public")).toBe(false);
  });
});
