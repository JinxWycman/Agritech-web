import { describe, expect, it } from "vitest";
import { httpRequest } from "@/lib/http";
import { guardedDestination, homeForRole, legacyRoute, roleForPath } from "@/lib/route-guards";
import { resolveScenario } from "@/mocks/scenarios";
import { demoAdminSummary } from "@/mocks/fixtures";
import { selectAdapter } from "@/services/selection";
import { mapBackendStaffRole } from "@/services/adapters/api";

describe("data adapters", () => {
  it("selects only the adapter configured by data mode", () => {
    const mock = { name: "mock" };
    const api = { name: "api" };
    expect(selectAdapter("mock", mock, api)).toBe(mock);
    expect(selectAdapter("api", mock, api)).toBe(api);
  });

  it("maps backend staff roles to frontend roles only in the API auth adapter", () => {
    expect(mapBackendStaffRole("officer")).toBe("expert");
    expect(mapBackendStaffRole("platform_admin")).toBe("admin");
    expect(() => mapBackendStaffRole("unknown")).toThrow("This account cannot open the staff portal.");
  });

  it("provides deterministic mock scenarios", async () => {
    const fixture = { ...demoAdminSummary };
    const empty = {
      farmersTotal: 0,
      farmersLast7Days: 0,
      activePaidSubscriptions: 0,
      failedPaymentsLast7Days: 0,
      requestsByStatus: {},
      requestsAging48Hours: 0,
      advisoriesActive: 0,
      smsSessionsOpen: 0,
    };
    expect(await resolveScenario("success", fixture, empty)).toEqual(fixture);
    expect(await resolveScenario("empty", fixture, empty)).toEqual(empty);
    await expect(resolveScenario("error", fixture, empty)).rejects.toThrow("Demo service error scenario.");
    expect(demoAdminSummary).toEqual(fixture);
  });
});

describe("role redirects and guards", () => {
  it("maps frontend roles to their portal home routes", () => {
    expect(homeForRole("farmer")).toBe("/app/overview");
    expect(homeForRole("expert")).toBe("/expert/overview");
    expect(homeForRole("admin")).toBe("/admin/overview");
  });

  it("protects each portal and redirects legacy prefixes", () => {
    expect(roleForPath("/app/overview")).toBe("farmer");
    expect(roleForPath("/expert/overview")).toBe("expert");
    expect(roleForPath("/admin/overview")).toBe("admin");
    expect(guardedDestination("/admin/overview", "", null)).toBe("/login?next=%2Fadmin%2Foverview");
    expect(guardedDestination("/admin/overview", "", "expert")).toBe("/expert/overview");
    expect(guardedDestination("/expert/requests", "", "expert")).toBeNull();
    expect(legacyRoute("/farmer/overview")).toBe("/app/overview");
    expect(legacyRoute("/farmer/login")).toBe("/login");
    expect(legacyRoute("/officer/requests")).toBe("/expert/requests");
  });
});

describe("mock mode network guard", () => {
  it("does not issue a request to the backend in mock mode", async () => {
    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls += 1;
      return new Response("unexpected");
    };
    await expect(httpRequest("/backend/admin/overview", {}, "mock", fetcher))
      .rejects.toThrow("Backend requests are disabled in mock mode.");
    expect(calls).toBe(0);
  });

  it("allows the API adapter to use the configured transport", async () => {
    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls += 1;
      return new Response("ok");
    };
    await httpRequest("/backend/admin/overview", {}, "api", fetcher);
    expect(calls).toBe(1);
  });
});
