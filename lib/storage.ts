import { UserProfile, MealEntry, WorkoutEntry, DEFAULT_PROFILE } from "./types";

const KEYS = {
  PROFILE: "tripleX_profile",
  MEALS: "tripleX_meals",
  WORKOUTS: "tripleX_workouts",
} as const;

// --- Profile ---

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

// --- Meals ---

export function getMeals(): MealEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.MEALS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMeal(meal: MealEntry): void {
  const meals = getMeals();
  const index = meals.findIndex((m) => m.id === meal.id);
  if (index >= 0) {
    meals[index] = meal;
  } else {
    meals.push(meal);
  }
  localStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
}

export function deleteMeal(id: string): void {
  const meals = getMeals().filter((m) => m.id !== id);
  localStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
}

export function getMealsByDate(date: string): MealEntry[] {
  return getMeals()
    .filter((m) => m.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

// --- Workouts ---

export function getWorkouts(): WorkoutEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEYS.WORKOUTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveWorkout(workout: WorkoutEntry): void {
  const workouts = getWorkouts();
  const index = workouts.findIndex((w) => w.id === workout.id);
  if (index >= 0) {
    workouts[index] = workout;
  } else {
    workouts.push(workout);
  }
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
}

export function deleteWorkout(id: string): void {
  const workouts = getWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
}

export function getWorkoutsByDate(date: string): WorkoutEntry[] {
  return getWorkouts().filter((w) => w.date === date);
}

// --- Export ---

export function exportData(): string {
  const data = {
    profile: getProfile(),
    meals: getMeals(),
    workouts: getWorkouts(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

// --- Utils ---

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function getDayNumber(startDate: string, currentDate: string): number {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diff = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, diff + 1);
}
