import { describe, expect, it } from "vitest";
import {
  aggregateCells,
  alertsNearPoint,
  assessRisk,
  farmersInRadius,
  flagCells,
  weekStart,
} from "@/lib/outbreaks";
import type { OutbreakAlert, SignalEvent } from "@/types/outbreak";

const event = (overrides: Partial<SignalEvent> = {}): SignalEvent => ({
  symptomCode: "yellow-leaves",
  issueType: "crop",
  subjectKey: "maize",
  latitude: -1.28,
  longitude: 36.82,
  weekStart: "2026-06-08",
  ...overrides,
});

describe("outbreak signal logic", () => {
  it("starts weeks on Monday in UTC", () => {
    expect(weekStart(new Date("2026-06-10T23:30:00-07:00"))).toBe("2026-06-08");
    expect(weekStart(new Date("2026-06-07T23:00:00Z"))).toBe("2026-06-01");
  });

  it("aggregates by grid, issue, subject and week, with filters applied", () => {
    const cells = aggregateCells([
      event(),
      event({ symptomCode: "pest-damage", latitude: -1.27 }),
      event({ issueType: "livestock", subjectKey: "cattle" }),
      event({ weekStart: "2026-06-15" }),
    ], { cellSizeDeg: 0.5, filters: { issueType: "crop", fromWeek: "2026-06-08", throughWeek: "2026-06-08" } });
    expect(cells).toHaveLength(1);
    expect(cells[0].count).toBe(2);
    expect(cells[0].bySymptom).toEqual({ "yellow-leaves": 1, "pest-damage": 1 });
    expect(flagCells(cells, 2)[0].flagged).toBe(true);
  });
});

describe("alert coverage", () => {
  const alert = (overrides: Partial<OutbreakAlert> = {}): OutbreakAlert => ({
    id: "alert-1",
    symptomCode: "yellow-leaves",
    issueType: "crop",
    centerLat: -1.286,
    centerLng: 36.829,
    radiusKm: 5,
    message: { en: "Sample alert", sw: "Arifa ya mfano" },
    createdAt: "2026-06-10T00:00:00.000Z",
    status: "sent",
    recipientCount: 3,
    createdBy: "demo-admin",
    ...overrides,
  });

  it("returns only sent alerts whose radius covers the pin", () => {
    expect(alertsNearPoint([
      alert(),
      alert({ id: "draft", status: "draft" }),
      alert({ id: "far", centerLat: -3.0, centerLng: 40.0 }),
    ], { latitude: -1.286, longitude: 36.829 }).map(({ id }) => id)).toEqual(["alert-1"]);
  });

  it("counts unique farmers in range", () => {
    expect(farmersInRadius([
      { farmerId: "a", latitude: -1.286, longitude: 36.829 },
      { farmerId: "a", latitude: -1.29, longitude: 36.83 },
      { farmerId: "b", latitude: -1.3, longitude: 36.84 },
      { farmerId: "far", latitude: 0, longitude: 40 },
    ], { latitude: -1.286, longitude: 36.829 }, 5)).toBe(2);
  });
});

describe("sample risk assessment", () => {
  it("uses the strongest matching sample condition and provides reason/prevention keys", () => {
    const assessment = assessRisk({ rainfallTrend: "below", ndviTrend: "below" }, "maize");
    expect(assessment.level).toBe("high");
    expect(assessment.reasonKeys).toContain("risk.reason.ndvi.below");
    expect(assessment.preventionKeys).toContain("risk.prevention.ndvi.below");
  });

  it("returns low risk when no configured signal exists and explains missing inputs", () => {
    expect(assessRisk({ rainfallTrend: "normal", ndviTrend: "normal" }, "maize").level).toBe("low");
    expect(assessRisk(null, "unknown").reasonKeys).toContain("risk.reason.conditionsUnavailable");
    expect(assessRisk({ rainfallTrend: "normal", ndviTrend: "normal" }, "unknown").reasonKeys)
      .toContain("risk.reason.sampleRuleUnavailable");
  });
});
