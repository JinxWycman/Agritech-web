import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowedBackendMethod, allowedBackendPath, rewriteSetCookie, stripRefreshFromStaffPayload } from "./backend-allow.ts";

describe("allowedBackendPath", () => {
  it("allows staff, farmer, and admin routes on the verified contract", () => {
    assert.equal(allowedBackendPath(["staff", "login"]), "/staff/login");
    assert.equal(allowedBackendPath(["staff", "refresh"]), "/staff/refresh");
    assert.equal(allowedBackendPath(["staff", "me"]), "/staff/me");
    assert.equal(allowedBackendPath(["staff", "logout"]), "/staff/logout");
    assert.equal(allowedBackendPath(["auth", "login"]), "/auth/login");
    assert.equal(allowedBackendPath(["auth", "refresh"]), "/auth/refresh");
    assert.equal(allowedBackendPath(["auth", "me"]), "/auth/me");
    assert.equal(allowedBackendPath(["farmers", "me"]), "/farmers/me");
    assert.equal(allowedBackendPath(["farmers", "change-pin"]), "/farmers/change-pin");
    assert.equal(allowedBackendPath(["admin", "overview"]), "/admin/overview");
    assert.equal(allowedBackendPath(["admin", "farmers", "a-id"]), "/admin/farmers/a-id");
    assert.equal(allowedBackendPath(["counties", "123e4567-e89b-12d3-a456-426614174000", "constituencies"]), "/counties/123e4567-e89b-12d3-a456-426614174000/constituencies");
    assert.equal(allowedBackendPath(["recommendations", "123e4567-e89b-12d3-a456-426614174001", "sms"]), "/recommendations/123e4567-e89b-12d3-a456-426614174001/sms");
  });

  it("allows farmer weather, catalogue and own expert-request routes", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    assert.equal(allowedBackendPath(["weather"]), "/weather");
    assert.equal(allowedBackendPath(["crops"]), "/crops");
    assert.equal(allowedBackendPath(["livestock"]), "/livestock");
    assert.equal(allowedBackendPath(["farmers", "me", "expert-requests"]), "/farmers/me/expert-requests");
    assert.equal(allowedBackendPath(["farmers", "me", "expert-requests", id, "cancel"]), `/farmers/me/expert-requests/${id}/cancel`);
    assert.equal(allowedBackendPath(["farmers", "me", "expert-requests", id, "delete"]), null);
    assert.equal(allowedBackendMethod("GET", "/weather"), true);
    assert.equal(allowedBackendMethod("POST", "/weather"), false);
    assert.equal(allowedBackendMethod("GET", `/farmers/me/expert-requests/${id}`), true);
    assert.equal(allowedBackendMethod("POST", `/farmers/me/expert-requests/${id}/feedback`), true);
    assert.equal(allowedBackendMethod("GET", `/farmers/me/expert-requests/${id}/cancel`), false);
    assert.equal(allowedBackendMethod("POST", "/recommendations/jobs"), true);
    assert.equal(allowedBackendMethod("GET", `/recommendations/jobs/${id}`), true);
    assert.equal(allowedBackendMethod("GET", "/outbreak-alerts/nearby"), true);
    assert.equal(allowedBackendMethod("POST", "/outbreak-alerts/nearby"), false);
    assert.equal(allowedBackendMethod("GET", "/vendors"), true);
    assert.equal(allowedBackendMethod("GET", `/vendors/${id}/products`), true);
    assert.equal(allowedBackendMethod("POST", `/vendors/${id}/events`), true);
    assert.equal(allowedBackendMethod("DELETE", `/vendors/${id}`), false);
    assert.equal(allowedBackendMethod("PATCH", `/notifications/${id}/read`), true);
    assert.equal(allowedBackendMethod("POST", "/notifications/mark-all-read"), true);
    assert.equal(allowedBackendMethod("GET", "/notifications/unread-count"), true);
  });

  it("blocks open-proxy and traversal paths", () => {
    assert.equal(allowedBackendPath(["ussd"]), null);
    assert.equal(allowedBackendPath(["sms"]), null);
    assert.equal(allowedBackendPath(["mpesa", "callback"]), null);
    assert.equal(allowedBackendPath(["staff", "..", "ussd"]), null);
    assert.equal(allowedBackendPath(["admin"]), null);
    assert.equal(allowedBackendPath([]), null);
  });
});

describe("allowedBackendMethod", () => {
  it("allows only expected methods for farmer resources", () => {
    assert.equal(allowedBackendMethod("PUT", "/farmers/me"), true);
    assert.equal(allowedBackendMethod("DELETE", "/farmer-crops/123e4567-e89b-12d3-a456-426614174000"), true);
    assert.equal(allowedBackendMethod("POST", "/recommendations/generate"), true);
    assert.equal(allowedBackendMethod("POST", "/auth/refresh"), true);
    assert.equal(allowedBackendMethod("GET", "/auth/refresh"), false);
    assert.equal(allowedBackendMethod("POST", "/counties"), false);
    assert.equal(allowedBackendMethod("POST", "/auth/me"), false);
  });
});

describe("staff payload stripping", () => {
  it("removes refresh tokens from login JSON", () => {
    assert.deepEqual(stripRefreshFromStaffPayload("/staff/login", { access_token: "a", refresh_token: "secret", role: "officer" }), {
      access_token: "a",
      role: "officer",
    });
    assert.deepEqual(stripRefreshFromStaffPayload("/admin/overview", { refresh_token: "keep" }), { refresh_token: "keep" });
  });
});

describe("rewriteSetCookie", () => {
  it("moves the refresh cookie onto the same-origin proxy path", () => {
    const header = "staff_refresh=abc; HttpOnly; Path=/staff; SameSite=lax";
    assert.equal(
      rewriteSetCookie(header, false),
      "staff_refresh=abc; HttpOnly; Path=/backend/staff; SameSite=lax",
    );
  });

  it("adds Secure on HTTPS", () => {
    const header = "staff_role=officer; Path=/; SameSite=lax";
    assert.match(rewriteSetCookie(header, true), /;\s*Secure$/);
  });
});
