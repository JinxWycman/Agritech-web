import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowedBackendPath, rewriteSetCookie, stripRefreshFromStaffPayload } from "./backend-allow.ts";

describe("allowedBackendPath", () => {
  it("allows staff session routes and admin APIs", () => {
    assert.equal(allowedBackendPath(["staff", "login"]), "/staff/login");
    assert.equal(allowedBackendPath(["staff", "refresh"]), "/staff/refresh");
    assert.equal(allowedBackendPath(["staff", "logout"]), "/staff/logout");
    assert.equal(allowedBackendPath(["admin", "overview"]), "/admin/overview");
    assert.equal(allowedBackendPath(["admin", "farmers", "a-id"]), "/admin/farmers/a-id");
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
