export interface UserProfile {
  weight: number;
  bmr: number;
  startDate: string; // "YYYY-MM-DD"
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  groqApiKey: string;
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
}

export type MealType = "petit-déjeuner" | "déjeuner" | "dîner" | "collation";

export interface MealEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  mealType: MealType;
  photoBase64?: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: FoodItem[];
}

export type WorkoutType = "musculation" | "cardio" | "mixte";

export interface WorkoutEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: WorkoutType;
  duration: number; // minutes
  exercises: string[];
  notes: string;
  caloriesBurned?: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

export interface ClaudeAnalysisResult {
  foods: FoodItem[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  description: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  weight: 88.1,
  bmr: 1716,
  startDate: "2026-03-30",
  targetCalories: 1800,
  targetProtein: 180,
  targetCarbs: 130,
  targetFat: 60,
  groqApiKey: "",
};
