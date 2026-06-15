export interface UserProfile {
  weight: number;
  bmr: number;
  startDate: string; // "YYYY-MM-DD"
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  openRouterApiKey: string;
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

export type WorkoutType = "musculation" | "cardio" | "mixte" | "hyrox";

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

// Body composition

export interface BodyEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  weight: number; // kg
  bodyFat?: number; // %
  muscleMass?: number; // kg
  visceralFat?: number; // level 1-20
  waterPercent?: number; // %
  boneMass?: number; // kg
  bmi?: number;
  source: "manual" | "bluetooth";
}

// Training programs

export interface ProgramExercise {
  name: string;
  sets?: number;
  reps?: string; // "12" or "12-15" or "max"
  duration?: string; // "30s" or "2 min"
  rest?: string; // "60s"
  distance?: string; // "1000m"
  notes?: string;
}

export interface ProgramBlock {
  title: string; // "Échauffement", "Circuit principal", "Retour au calme"
  exercises: ProgramExercise[];
}

export interface WorkoutProgram {
  id: string;
  createdAt: string; // ISO
  name: string;
  description: string;
  totalDuration: number; // minutes
  type: "solo" | "duo" | "hyrox-solo" | "hyrox-duo";
  blocks: ProgramBlock[];
  equipment: string[];
  savedAt?: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  weight: 88.1,
  bmr: 1716,
  startDate: "2026-03-30",
  targetCalories: 1800,
  targetProtein: 180,
  targetCarbs: 130,
  targetFat: 60,
  openRouterApiKey: "",
};

