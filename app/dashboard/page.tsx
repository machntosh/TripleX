"use client";

import Link from "next/link";
import { Plus, Dumbbell } from "lucide-react";
import { useMeals, useWorkouts, useProfile, computeDailyTotals } from "@/hooks/useJournal";
import { getTodayString, formatDate, getDayNumber } from "@/lib/storage";
import Header from "@/components/layout/Header";
import DayProgress from "@/components/dashboard/DayProgress";
import DailySummary from "@/components/dashboard/DailySummary";
import MacroCard from "@/components/dashboard/MacroCard";
import MealCard from "@/components/meals/MealCard";

export default function DashboardPage() {
  const today = getTodayString();
  const { profile } = useProfile();
  const { meals, removeMeal } = useMeals(today);
  const { workouts } = useWorkouts(today);

  const totals = computeDailyTotals(meals);
  const dayNumber = getDayNumber(profile.startDate, today);
  const hasWorkout = workouts.length > 0;

  return (
    <div>
      <Header
        title="Journal Sèche"
        subtitle={formatDate(today)}
      />

      <div className="pt-4 space-y-3">
        {/* Day progress */}
        <DayProgress dayNumber={dayNumber} totalDays={60} />

        {/* Calorie ring */}
        <DailySummary totals={totals} profile={profile} />

        {/* Macros */}
        <div className="flex gap-2 px-4">
          <MacroCard
            label="Protéines"
            current={totals.protein}
            target={profile.targetProtein}
            unit="g"
            color="#3b82f6"
          />
          <MacroCard
            label="Glucides"
            current={totals.carbs}
            target={profile.targetCarbs}
            unit="g"
            color="#f59e0b"
          />
          <MacroCard
            label="Lipides"
            current={totals.fat}
            target={profile.targetFat}
            unit="g"
            color="#f43f5e"
          />
        </div>

        {/* Workout status */}
        <div className="px-4">
          <div
            className={`rounded-2xl p-3 flex items-center justify-between ${
              hasWorkout
                ? "bg-teal-50 border border-teal-200"
                : "bg-white border border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Dumbbell
                size={18}
                className={hasWorkout ? "text-teal-600" : "text-slate-400"}
              />
              <span
                className={`text-sm font-medium ${
                  hasWorkout ? "text-teal-700" : "text-slate-500"
                }`}
              >
                {hasWorkout
                  ? `${workouts.length} séance${workouts.length > 1 ? "s" : ""} aujourd'hui`
                  : "Aucune séance aujourd'hui"}
              </span>
            </div>
            <Link
              href="/entrainement/ajouter"
              className="text-xs text-teal-600 font-medium"
            >
              + Ajouter
            </Link>
          </div>
        </div>

        {/* Today's meals */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-slate-700">Repas du jour</h2>
            <Link
              href="/repas/ajouter"
              className="text-xs text-teal-600 font-medium"
            >
              Voir tout
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400">
              <div className="text-4xl mb-2">🍽️</div>
              <p className="text-sm">Aucun repas enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {meals.slice(-3).map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={removeMeal} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link
        href="/repas/ajouter"
        className="fixed bottom-24 right-4 w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-200 active:scale-95 transition-transform z-40"
      >
        <Plus size={28} className="text-white" />
      </Link>
    </div>
  );
}
