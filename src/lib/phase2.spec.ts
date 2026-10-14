import { describe, expect, it } from "vitest";
import { farmerProfileSchema } from "@/lib/farmer-profile-schema";
import { buildFarmConditionsSentence, clampToKenya, countyFromCoordinates, isWithinKenya } from "@/lib/kenya-location";

const sentenceCopy = {
  greener: "Greener than usual.",
  lessGreen: "Less green than usual.",
  usualGreen: "Near the usual green level.",
  rainfallAbove: "Rainfall is above normal.",
  rainfallBelow: "Rainfall is below normal.",
  rainfallUsual: "Rainfall is near normal.",
};

describe("Kenya farm location", () => {
  it("accepts the Kenya boundary and rejects coordinates outside it", () => {
    expect(isWithinKenya({ latitude: -4.7, longitude: 33.9 })).toBe(true);
    expect(isWithinKenya({ latitude: 5.1, longitude: 41.9 })).toBe(true);
    expect(isWithinKenya({ latitude: 5.11, longitude: 41.9 })).toBe(false);
  });

  it("clamps coordinates to the allowed bounds", () => {
    expect(clampToKenya({ latitude: -10, longitude: 50 })).toEqual({ latitude: -4.7, longitude: 41.9 });
  });

  it("finds the nearest approximate county centre", () => {
    expect(countyFromCoordinates({ latitude: -1.29, longitude: 36.82 })).toBe("Nairobi");
  });
});

describe("farm conditions sentence", () => {
  it("combines vegetation and rainfall trends into the first plain-language summary", () => {
    expect(buildFarmConditionsSentence({ ndviTrend: "above", rainfallTrend: "below" }, sentenceCopy))
      .toBe("Greener than usual. Rainfall is below normal.");
  });
});

describe("farmer profile schema", () => {
  const validProfile = {
    farmSizeAcres: "2",
    crops: ["maize"],
    livestock: [],
    subCounty: "Sample sub-county",
    ward: "Sample ward",
    latitude: -1.29,
    longitude: 36.82,
  };

  it("accepts a complete profile with a Kenya location", () => {
    expect(farmerProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects missing required farm details and out-of-country coordinates", () => {
    expect(farmerProfileSchema.safeParse({ ...validProfile, farmSizeAcres: "0" }).success).toBe(false);
    expect(farmerProfileSchema.safeParse({ ...validProfile, latitude: 8 }).success).toBe(false);
  });
});
