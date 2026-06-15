import { describe, it, expect } from "vitest";
import { DEFAULT_PROFILE } from "@/lib/types";

describe("DEFAULT_PROFILE", () => {
  it("has all required fields", () => {
    expect(DEFAULT_PROFILE.weight).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.bmr).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.targetCalories).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.targetProtein).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.targetCarbs).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.targetFat).toBeGreaterThan(0);
    expect(DEFAULT_PROFILE.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(DEFAULT_PROFILE.openRouterApiKey).toBe("");
  });

  it("macros respect sèche targets (protein ≥ 2× weight in g)", () => {
    // 180g protein for 88kg = ~2.04g/kg — standard sèche protocol
    expect(DEFAULT_PROFILE.targetProtein).toBeGreaterThanOrEqual(
      DEFAULT_PROFILE.weight * 2
    );
  });

  it("targetCalories is below maintenance (deficit for cutting)", () => {
    // BMR is maintenance floor; targetCalories should be below BMR for cutting
    expect(DEFAULT_PROFILE.targetCalories).toBeLessThanOrEqual(
      DEFAULT_PROFILE.bmr * 1.3
    );
  });
});
