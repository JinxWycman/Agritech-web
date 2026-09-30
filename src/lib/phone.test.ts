import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatKenyaNational, nationalKenyaDigits, toE164Kenya } from "./phone.ts";

describe("toE164Kenya", () => {
  it("accepts local, trunk, and E.164 forms", () => {
    assert.equal(toE164Kenya("0712 345 678"), "+254712345678");
    assert.equal(toE164Kenya("712345678"), "+254712345678");
    assert.equal(toE164Kenya("+254712345678"), "+254712345678");
    assert.equal(toE164Kenya("254712345678"), "+254712345678");
  });

  it("rejects incomplete numbers", () => {
    assert.equal(toE164Kenya("0712 345"), null);
    assert.equal(toE164Kenya(""), null);
  });
});

describe("formatKenyaNational", () => {
  it("groups nine digits for the +254 field", () => {
    assert.equal(nationalKenyaDigits("0712345678"), "712345678");
    assert.equal(formatKenyaNational("712345678"), "712 345 678");
  });
});
