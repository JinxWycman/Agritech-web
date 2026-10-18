import { farmerApi } from "@/lib/api";
import { getDataMode, getDemoScenario, getMockDelayMs } from "@/lib/data-mode";
import { demoFarmConditions } from "@/mocks/fixtures";
import { selectAdapter } from "@/services/selection";
import type { FarmConditionsService } from "@/services/contracts";

const mockAdapter: FarmConditionsService = {
  async getSnapshot(latitude, longitude) {
    await new Promise((resolve) => setTimeout(resolve, getMockDelayMs()));
    const scenario = getDemoScenario();
    if (scenario === "error") throw new Error("Demo service error scenario.");
    if (scenario === "empty") return null;
    return { ...demoFarmConditions, latitude, longitude };
  },
};

type FarmWeatherResponse = {
  latitude: number | null;
  longitude: number | null;
  current: { weather: string; description: string } | null;
  daily_forecast: { date: string; condition: string | null; high_c: number; low_c: number }[];
  rainfall_mm_30d: number | null;
  rainfall_normal_mm?: number | null;
  rainfall_trend?: "below" | "normal" | "above" | null;
  ndvi: number | null;
  ndvi_trend_level?: "below" | "normal" | "above" | null;
};

/** Map OpenWeather condition groups onto the UI's translated weather keys. */
export function weatherConditionKey(main: string | null | undefined, description = ""): string {
  switch (main) {
    case "Clear": return "clear";
    case "Clouds": return /few|scattered/i.test(description) ? "partlyCloudy" : "cloudy";
    case "Drizzle": return "lightRain";
    case "Rain": return /light/i.test(description) ? "lightRain" : "rain";
    case "Thunderstorm": return "thunderstorm";
    case "Mist": case "Fog": case "Haze": case "Smoke": case "Dust": return "mist";
    default: return "partlyCloudy";
  }
}

const apiAdapter: FarmConditionsService = {
  // The backend resolves the signed-in farmer's farm location itself.
  async getSnapshot() {
    const data = await farmerApi<FarmWeatherResponse>("/weather");
    if (data.latitude === null || data.longitude === null) return null;
    const today = data.daily_forecast[0];
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      currentWeather: data.current ? weatherConditionKey(data.current.weather, data.current.description) : undefined,
      todayHighC: today ? Math.round(today.high_c) : undefined,
      todayLowC: today ? Math.round(today.low_c) : undefined,
      forecast: data.daily_forecast.map((day) => ({
        day: day.date,
        condition: weatherConditionKey(day.condition),
        highC: Math.round(day.high_c),
        lowC: Math.round(day.low_c),
      })),
      ndvi: data.ndvi ?? undefined,
      rainfallMm: data.rainfall_mm_30d ?? undefined,
      rainfallNormalMm: data.rainfall_normal_mm ?? undefined,
      rainfallTrend: data.rainfall_trend ?? undefined,
      ndviTrend: data.ndvi_trend_level ?? undefined,
    };
  },
};

export const farmConditionsService = selectAdapter(getDataMode(), mockAdapter, apiAdapter);
