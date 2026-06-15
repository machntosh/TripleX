import { describe, it, expect, beforeEach } from "vitest";
import {
  getProfile,
  saveProfile,
  getMeals,
  saveMeal,
  deleteMeal,
  getMealsByDate,
  getWorkouts,
  saveWorkout,
  deleteWorkout,
  getWorkoutsByDate,
  getBodyEntries,
  saveBodyEntry,
  deleteBodyEntry,
  getPrograms,
  saveProgram,
  deleteProgram,
  generateId,
  getTodayString,
  formatDate,
  getDayNumber,
} from "@/lib/storage";
import { DEFAULT_PROFILE } from "@/lib/types";
import type { MealEntry, WorkoutEntry, BodyEntry, WorkoutProgram } from "@/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const meal = (): MealEntry => ({
  id: generateId(),
  date: "2026-06-15",
  time: "12:00",
  mealType: "déjeuner",
  description: "Poulet riz",
  calories: 500,
  protein: 45,
  carbs: 50,
  fat: 10,
  foods: [{ name: "Poulet", quantity: "150g", calories: 250 }],
});

const workout = (): WorkoutEntry => ({
  id: generateId(),
  date: "2026-06-15",
  type: "musculation",
  duration: 60,
  exercises: ["Squat", "Développé couché"],
  notes: "Bonne séance",
  caloriesBurned: 350,
});

const bodyEntry = (): BodyEntry => ({
  id: generateId(),
  date: "2026-06-15",
  time: "07:30",
  weight: 87.5,
  bodyFat: 20.5,
  muscleMass: 62.0,
  visceralFat: 8,
  waterPercent: 55.2,
  source: "manual",
});

const program = (): WorkoutProgram => ({
  id: generateId(),
  createdAt: new Date().toISOString(),
  name: "Hyrox Solo J-30",
  description: "Prépa compétition",
  totalDuration: 60,
  type: "hyrox-solo",
  equipment: ["Ski Erg", "Rameur"],
  blocks: [
    {
      title: "Échauffement",
      exercises: [{ name: "Footing", duration: "5 min" }],
    },
  ],
});

// ── Profile ───────────────────────────────────────────────────────────────────

describe("Profile", () => {
  it("returns DEFAULT_PROFILE when nothing saved", () => {
    const p = getProfile();
    expect(p.weight).toBe(DEFAULT_PROFILE.weight);
    expect(p.targetCalories).toBe(DEFAULT_PROFILE.targetCalories);
  });

  it("saves and retrieves profile", () => {
    saveProfile({ ...DEFAULT_PROFILE, weight: 85.0, openRouterApiKey: "sk-test" });
    const p = getProfile();
    expect(p.weight).toBe(85.0);
    expect(p.openRouterApiKey).toBe("sk-test");
  });

  it("merges saved profile with DEFAULT_PROFILE (handles missing keys)", () => {
    localStorage.setItem("tripleX_profile", JSON.stringify({ weight: 90 }));
    const p = getProfile();
    expect(p.weight).toBe(90);
    expect(p.targetProtein).toBe(DEFAULT_PROFILE.targetProtein);
  });
});

// ── Meals ─────────────────────────────────────────────────────────────────────

describe("Meals", () => {
  it("returns empty array when no meals", () => {
    expect(getMeals()).toEqual([]);
  });

  it("saves and retrieves a meal", () => {
    const m = meal();
    saveMeal(m);
    expect(getMeals()).toHaveLength(1);
    expect(getMeals()[0].description).toBe("Poulet riz");
  });

  it("saves multiple meals", () => {
    saveMeal(meal());
    saveMeal(meal());
    expect(getMeals()).toHaveLength(2);
  });

  it("updates existing meal (same id)", () => {
    const m = meal();
    saveMeal(m);
    saveMeal({ ...m, calories: 999 });
    const all = getMeals();
    expect(all).toHaveLength(1);
    expect(all[0].calories).toBe(999);
  });

  it("deletes a meal by id", () => {
    const m = meal();
    saveMeal(m);
    deleteMeal(m.id);
    expect(getMeals()).toHaveLength(0);
  });

  it("getMealsByDate filters by date and sorts by time", () => {
    const m1 = { ...meal(), date: "2026-06-15", time: "08:00" };
    const m2 = { ...meal(), date: "2026-06-15", time: "13:00" };
    const m3 = { ...meal(), date: "2026-06-14" };
    saveMeal(m1); saveMeal(m2); saveMeal(m3);
    const result = getMealsByDate("2026-06-15");
    expect(result).toHaveLength(2);
    expect(result[0].time).toBe("08:00");
    expect(result[1].time).toBe("13:00");
  });
});

// ── Workouts ──────────────────────────────────────────────────────────────────

describe("Workouts", () => {
  it("returns empty array when no workouts", () => {
    expect(getWorkouts()).toEqual([]);
  });

  it("saves and retrieves a workout", () => {
    const w = workout();
    saveWorkout(w);
    expect(getWorkouts()).toHaveLength(1);
    expect(getWorkouts()[0].type).toBe("musculation");
  });

  it("updates existing workout (same id)", () => {
    const w = workout();
    saveWorkout(w);
    saveWorkout({ ...w, duration: 90 });
    expect(getWorkouts()).toHaveLength(1);
    expect(getWorkouts()[0].duration).toBe(90);
  });

  it("deletes a workout by id", () => {
    const w = workout();
    saveWorkout(w);
    deleteWorkout(w.id);
    expect(getWorkouts()).toHaveLength(0);
  });

  it("getWorkoutsByDate filters correctly", () => {
    saveWorkout({ ...workout(), date: "2026-06-15" });
    saveWorkout({ ...workout(), date: "2026-06-14" });
    expect(getWorkoutsByDate("2026-06-15")).toHaveLength(1);
    expect(getWorkoutsByDate("2026-06-13")).toHaveLength(0);
  });

  it("supports hyrox type", () => {
    const w: WorkoutEntry = { ...workout(), type: "hyrox" };
    saveWorkout(w);
    expect(getWorkouts()[0].type).toBe("hyrox");
  });
});

// ── Body composition ──────────────────────────────────────────────────────────

describe("Body entries", () => {
  it("returns empty array when no entries", () => {
    expect(getBodyEntries()).toEqual([]);
  });

  it("saves and retrieves a body entry", () => {
    const e = bodyEntry();
    saveBodyEntry(e);
    const all = getBodyEntries();
    expect(all).toHaveLength(1);
    expect(all[0].weight).toBe(87.5);
    expect(all[0].bodyFat).toBe(20.5);
    expect(all[0].source).toBe("manual");
  });

  it("updates existing entry (same id)", () => {
    const e = bodyEntry();
    saveBodyEntry(e);
    saveBodyEntry({ ...e, weight: 86.0 });
    expect(getBodyEntries()).toHaveLength(1);
    expect(getBodyEntries()[0].weight).toBe(86.0);
  });

  it("deletes an entry by id", () => {
    const e = bodyEntry();
    saveBodyEntry(e);
    deleteBodyEntry(e.id);
    expect(getBodyEntries()).toHaveLength(0);
  });

  it("handles optional fields (undefined)", () => {
    const e: BodyEntry = {
      id: generateId(),
      date: "2026-06-15",
      time: "07:00",
      weight: 88.0,
      source: "manual",
    };
    saveBodyEntry(e);
    const saved = getBodyEntries()[0];
    expect(saved.bodyFat).toBeUndefined();
    expect(saved.muscleMass).toBeUndefined();
  });

  it("saves source:bluetooth correctly", () => {
    saveBodyEntry({ ...bodyEntry(), source: "bluetooth" });
    expect(getBodyEntries()[0].source).toBe("bluetooth");
  });
});

// ── Programs ──────────────────────────────────────────────────────────────────

describe("Programs", () => {
  it("returns empty array when no programs", () => {
    expect(getPrograms()).toEqual([]);
  });

  it("saves and retrieves a program", () => {
    const p = program();
    saveProgram(p);
    expect(getPrograms()).toHaveLength(1);
    expect(getPrograms()[0].name).toBe("Hyrox Solo J-30");
  });

  it("saves all program types", () => {
    const types: WorkoutProgram["type"][] = ["solo", "duo", "hyrox-solo", "hyrox-duo"];
    types.forEach((type) => saveProgram({ ...program(), type }));
    const all = getPrograms();
    expect(all).toHaveLength(4);
    expect(all.map((p) => p.type)).toEqual(expect.arrayContaining(types));
  });

  it("updates existing program (same id)", () => {
    const p = program();
    saveProgram(p);
    saveProgram({ ...p, name: "Updated" });
    expect(getPrograms()).toHaveLength(1);
    expect(getPrograms()[0].name).toBe("Updated");
  });

  it("deletes a program by id", () => {
    const p = program();
    saveProgram(p);
    deleteProgram(p.id);
    expect(getPrograms()).toHaveLength(0);
  });

  it("preserves blocks structure", () => {
    const p = program();
    saveProgram(p);
    const saved = getPrograms()[0];
    expect(saved.blocks).toHaveLength(1);
    expect(saved.blocks[0].title).toBe("Échauffement");
    expect(saved.blocks[0].exercises[0].name).toBe("Footing");
  });
});

// ── Utils ─────────────────────────────────────────────────────────────────────

describe("Utils", () => {
  it("generateId produces unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("getTodayString returns YYYY-MM-DD format", () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formatDate converts YYYY-MM-DD to DD/MM/YYYY", () => {
    expect(formatDate("2026-06-15")).toBe("15/06/2026");
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
  });

  it("getDayNumber returns 1 on start date", () => {
    expect(getDayNumber("2026-06-15", "2026-06-15")).toBe(1);
  });

  it("getDayNumber returns correct day offset", () => {
    expect(getDayNumber("2026-03-30", "2026-04-01")).toBe(3);
    expect(getDayNumber("2026-03-30", "2026-06-15")).toBe(78);
  });

  it("getDayNumber returns minimum 1 for past start dates", () => {
    expect(getDayNumber("2026-07-01", "2026-06-15")).toBe(1);
  });
});
