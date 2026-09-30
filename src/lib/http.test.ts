import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatApiDetail, isStaffRole, staffHome } from "./http.ts";

describe("staffHome", () => {
  it("maps only the two staff roles to known paths", () => {
    assert.equal(staffHome("platform_admin"), "/admin/overview");
    assert.equal(staffHome("officer"), "/officer/overview");
    assert.equal(staffHome("admin"), null);
    assert.equal(staffHome("../admin"), null);
    assert.equal(staffHome(null), null);
  });

  it("rejects unknown role strings", () => {
    assert.equal(isStaffRole("platform_admin"), true);
    assert.equal(isStaffRole("officer"), true);
    assert.equal(isStaffRole("superuser"), false);
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
