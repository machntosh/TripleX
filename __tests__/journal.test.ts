import { describe, it, expect } from "vitest";
import { computeDailyTotals } from "@/hooks/useJournal";
import type { MealEntry } from "@/lib/types";

const makeMeal = (overrides: Partial<MealEntry> = {}): MealEntry => ({
  id: "test-1",
  date: "2026-06-15",
  time: "12:00",
  mealType: "déjeuner",
  description: "Test",
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 12,
  foods: [],
  ...overrides,
});

describe("computeDailyTotals", () => {
  it("returns zeros for empty meal list", () => {
    const totals = computeDailyTotals([]);
    expect(totals.calories).toBe(0);
    expect(totals.protein).toBe(0);
    expect(totals.carbs).toBe(0);
    expect(totals.fat).toBe(0);
    expect(totals.mealCount).toBe(0);
  });

  it("sums single meal correctly", () => {
    const totals = computeDailyTotals([makeMeal()]);
    expect(totals.calories).toBe(400);
    expect(totals.protein).toBe(30);
    expect(totals.carbs).toBe(40);
    expect(totals.fat).toBe(12);
    expect(totals.mealCount).toBe(1);
  });

  it("sums multiple meals correctly", () => {
    const meals = [
      makeMeal({ calories: 400, protein: 30, carbs: 40, fat: 12 }),
      makeMeal({ id: "2", mealType: "petit-déjeuner", calories: 300, protein: 20, carbs: 35, fat: 8 }),
      makeMeal({ id: "3", mealType: "dîner", calories: 600, protein: 50, carbs: 55, fat: 18 }),
    ];
    const totals = computeDailyTotals(meals);
    expect(totals.calories).toBe(1300);
    expect(totals.protein).toBe(100);
    expect(totals.carbs).toBe(130);
    expect(totals.fat).toBe(38);
    expect(totals.mealCount).toBe(3);
  });

  it("handles zero-calorie entries", () => {
    const totals = computeDailyTotals([
      makeMeal({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
    ]);
    expect(totals.calories).toBe(0);
    expect(totals.mealCount).toBe(1);
  });

  it("handles high-protein meal (sèche target ~180g)", () => {
    const meals = Array.from({ length: 4 }, (_, i) =>
      makeMeal({ id: String(i), protein: 45, calories: 300 })
    );
    const totals = computeDailyTotals(meals);
    expect(totals.protein).toBe(180);
    expect(totals.mealCount).toBe(4);
  });
});
