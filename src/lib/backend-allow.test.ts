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
    assert.equal(allowedBackendPath(["auth", "me"]), "/auth/me");
    assert.equal(allowedBackendPath(["farmers", "me"]), "/farmers/me");
    assert.equal(allowedBackendPath(["farmers", "change-pin"]), "/farmers/change-pin");
    assert.equal(allowedBackendPath(["admin", "overview"]), "/admin/overview");
    assert.equal(allowedBackendPath(["admin", "farmers", "a-id"]), "/admin/farmers/a-id");
    assert.equal(allowedBackendPath(["counties", "123e4567-e89b-12d3-a456-426614174000", "constituencies"]), "/counties/123e4567-e89b-12d3-a456-426614174000/constituencies");
    assert.equal(allowedBackendPath(["recommendations", "123e4567-e89b-12d3-a456-426614174001", "sms"]), "/recommendations/123e4567-e89b-12d3-a456-426614174001/sms");
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
