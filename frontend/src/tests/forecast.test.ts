import assert from "node:assert";
import { test, describe } from "node:test";

import {
  celsiusToFahrenheit,
  mmToInches,
  kmhToMph,
  getWeatherConditionText,
} from "../lib/services/weather-provider.service";

import {
  getRiskLevelFromScore,
  computeHeatRisk,
  computeFloodRisk,
  computeWaterStress,
} from "../lib/services/risk-scoring.service";

import { serverCache } from "../lib/cache";

describe("Global Forecast & Climate Risk Intelligence Engine", () => {
  describe("Unit Conversions", () => {
    test("converts Celsius to Fahrenheit correctly", () => {
      assert.strictEqual(celsiusToFahrenheit(0), 32);
      assert.strictEqual(celsiusToFahrenheit(100), 212);
      assert.strictEqual(celsiusToFahrenheit(25), 77);
    });

    test("converts mm to inches correctly", () => {
      assert.strictEqual(mmToInches(25.4), 1);
      assert.strictEqual(mmToInches(50.8), 2);
    });

    test("converts km/h to mph correctly", () => {
      assert.strictEqual(kmhToMph(100), 62);
    });
  });

  describe("Weather Condition Code Resolution", () => {
    test("maps WMO codes to clear human readable descriptions", () => {
      assert.strictEqual(getWeatherConditionText(0), "Clear Sky");
      assert.strictEqual(getWeatherConditionText(61), "Slight Rain");
      assert.strictEqual(getWeatherConditionText(95), "Thunderstorm");
    });
  });

  describe("Risk Scoring Engine", () => {
    test("categorizes scores accurately into standard bands", () => {
      assert.strictEqual(getRiskLevelFromScore(10), "low");
      assert.strictEqual(getRiskLevelFromScore(40), "moderate");
      assert.strictEqual(getRiskLevelFromScore(65), "high");
      assert.strictEqual(getRiskLevelFromScore(90), "extreme");
      assert.strictEqual(getRiskLevelFromScore(null), "unavailable");
    });

    test("computes Heat Risk Index correctly for extreme heat", () => {
      const mockWeather: any = {
        daily: {
          temperature_2m_max: [40],
          apparent_temperature_max: [44],
        },
        current: { temperature_2m: 38 },
      };

      const result = computeHeatRisk(mockWeather, "metric");
      assert.strictEqual(result.category, "extreme");
      assert.ok(result.score! >= 76);
    });

    test("computes Flood Risk Index incorporating river discharge anomaly", () => {
      const mockWeather: any = {
        daily: {
          precipitation_sum: [40, 30, 40], // 110mm accum
        },
      };

      const mockFlood: any = {
        isAvailable: true,
        daily: {
          river_discharge: [100],
          river_discharge_median: [30], // ratio > 3.0
        },
      };

      const result = computeFloodRisk(mockWeather, mockFlood, "metric");
      assert.strictEqual(result.category, "extreme");
      assert.ok(result.score! >= 75);
    });

    test("returns unavailable for Water Stress when telemetry is missing", () => {
      const mockWeather: any = {
        daily: {
          precipitation_sum: [],
        },
      };

      const result = computeWaterStress(mockWeather, "metric");
      assert.strictEqual(result.category, "unavailable");
      assert.strictEqual(result.score, null);
    });
  });

  describe("In-Memory Server Cache", () => {
    test("stores and retrieves cached entries before TTL expiration", () => {
      serverCache.set("test_key", { data: "test_val" }, 10);
      const retrieved = serverCache.get<{ data: string }>("test_key");
      assert.deepStrictEqual(retrieved, { data: "test_val" });
    });

    test("returns null for non-existent or expired keys", () => {
      assert.strictEqual(serverCache.get("invalid_key"), null);
    });
  });
});
