"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  MealEntry,
  WorkoutEntry,
  DailyTotals,
} from "@/lib/types";
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
  getTodayString,
} from "@/lib/storage";

export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile>(getProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      saveProfile(next);
      return next;
    });
  }, []);

  return { profile, updateProfile };
}

export function useMeals(date?: string) {
  const targetDate = date || getTodayString();
  const [meals, setMeals] = useState<MealEntry[]>([]);

  const reload = useCallback(() => {
    setMeals(getMealsByDate(targetDate));
  }, [targetDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addMeal = useCallback(
    (meal: MealEntry) => {
      saveMeal(meal);
      reload();
    },
    [reload]
  );

  const removeMeal = useCallback(
    (id: string) => {
      deleteMeal(id);
      reload();
    },
    [reload]
  );

  return { meals, addMeal, removeMeal, reload };
}

export function useAllMeals() {
  const [meals, setMeals] = useState<MealEntry[]>([]);

  useEffect(() => {
    setMeals(getMeals());
  }, []);

  return meals;
}

export function useWorkouts(date?: string) {
  const targetDate = date || getTodayString();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);

  const reload = useCallback(() => {
    setWorkouts(getWorkoutsByDate(targetDate));
  }, [targetDate]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addWorkout = useCallback(
    (workout: WorkoutEntry) => {
      saveWorkout(workout);
      reload();
    },
    [reload]
  );

  const removeWorkout = useCallback(
    (id: string) => {
      deleteWorkout(id);
      reload();
    },
    [reload]
  );

  return { workouts, addWorkout, removeWorkout, reload };
}

export function useAllWorkouts() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);

  useEffect(() => {
    setWorkouts(getWorkouts());
  }, []);

  return workouts;
}

export function computeDailyTotals(meals: MealEntry[]): DailyTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      mealCount: acc.mealCount + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
  );
}
