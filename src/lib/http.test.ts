import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatApiDetail, isStaffRole, safeNextPath, staffHome, staffRoleLabel } from "./http.ts";

describe("staffHome", () => {
  it("maps only frontend portal roles to their home pages", () => {
    assert.equal(staffHome("admin"), "/admin/overview");
    assert.equal(staffHome("expert"), "/expert/overview");
    assert.equal(staffHome("farmer"), "/app/overview");
    assert.equal(staffHome("platform_admin"), null);
    assert.equal(staffHome("officer"), null);
    assert.equal(staffHome("../admin"), null);
    assert.equal(staffHome(null), null);
  });

  it("maps the original backend roles to the correct UI labels", () => {
    assert.equal(staffRoleLabel("platform_admin"), "Admin");
    assert.equal(staffRoleLabel("officer"), "Officer");
    assert.equal(staffRoleLabel("unknown"), null);
  });

  it("rejects unknown role strings", () => {
    assert.equal(isStaffRole("platform_admin"), true);
    assert.equal(isStaffRole("officer"), true);
    assert.equal(isStaffRole("superuser"), false);
  });
});

describe("safeNextPath", () => {
  it("allows supported in-app routes and blocks open redirects", () => {
    assert.equal(safeNextPath("/admin/farmers"), "/admin/farmers");
    assert.equal(safeNextPath("/expert/requests"), "/expert/requests");
    assert.equal(safeNextPath("/app/overview"), "/app/overview");
    assert.equal(safeNextPath("https://evil.example/admin"), null);
    assert.equal(safeNextPath("//evil.example"), null);
    assert.equal(safeNextPath("/login"), null);
    assert.equal(safeNextPath("/admin/../ussd"), null);
    assert.equal(safeNextPath("/admin/overview", "expert"), "/expert/overview");
  });
});

describe("formatApiDetail", () => {
  it("keeps a string detail", () => {
    assert.equal(formatApiDetail("Invalid credentials.", "Login failed"), "Invalid credentials.");
  });

  it("joins FastAPI validation issues", () => {
    const detail = [
      { loc: ["body", "phone_number"], msg: "String should have at least 10 characters" },
      { loc: ["body", "password"], msg: "String should have at least 8 characters" },
    ];
    assert.equal(
      formatApiDetail(detail, "Request failed"),
      "phone number: String should have at least 10 characters. password: String should have at least 8 characters",
    );
  });

  it("falls back when detail is empty", () => {
    assert.equal(formatApiDetail(undefined, "Request failed"), "Request failed");
    assert.equal(formatApiDetail([], "Request failed"), "Request failed");
  });
});
