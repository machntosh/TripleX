"use client";

import { useMemo, useState } from "react";
import { useAllMeals, useAllWorkouts, useProfile } from "@/hooks/useJournal";
import { getDayNumber } from "@/lib/storage";
import Header from "@/components/layout/Header";
import CalorieChart from "@/components/progress/CalorieChart";
import MacroChart from "@/components/progress/MacroChart";
import { MealEntry } from "@/lib/types";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";

function computeDailyData(
  meals: MealEntry[],
  startDate: string,
  targetCalories: number
) {
  const byDate: Record<
    string,
    { calories: number; protein: number; carbs: number; fat: number }
  > = {};

  for (const meal of meals) {
    if (!byDate[meal.date]) {
      byDate[meal.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    byDate[meal.date].calories += meal.calories;
    byDate[meal.date].protein += meal.protein;
    byDate[meal.date].carbs += meal.carbs;
    byDate[meal.date].fat += meal.fat;
  }

  const today = new Date().toISOString().split("T")[0];
  const start = new Date(startDate);

  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayNum = i + 1;
    const isFuture = dateStr > today;
    const data = byDate[dateStr];

    return {
      date: dateStr,
      day: dayNum,
      calories: data?.calories || null,
      protein: data?.protein || null,
      carbs: data?.carbs || null,
      fat: data?.fat || null,
      target: targetCalories,
      isFuture,
      hasData: !!data,
    };
  });
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekNumber(startDate: string, monday: Date): number {
  const start = getMondayOfWeek(new Date(startDate));
  const diff = Math.round((monday.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return Math.max(1, diff + 1);
}

export default function ProgresPage() {
  const { profile } = useProfile();
  const meals = useAllMeals();
  const workouts = useAllWorkouts();
  const [weekOffset, setWeekOffset] = useState(0);
  const [generating, setGenerating] = useState(false);

  const dailyData = useMemo(
    () => computeDailyData(meals, profile.startDate, profile.targetCalories),
    [meals, profile.startDate, profile.targetCalories]
  );

  const daysWithData = dailyData.filter((d) => d.hasData);
  const daysOnTarget = daysWithData.filter(
    (d) => d.calories !== null && d.calories <= profile.targetCalories
  );
  const avgCalories =
    daysWithData.length > 0
      ? Math.round(
          daysWithData.reduce((s, d) => s + (d.calories || 0), 0) /
            daysWithData.length
        )
      : 0;

  const currentDay = getDayNumber(
    profile.startDate,
    new Date().toISOString().split("T")[0]
  );

  const selectedMonday = useMemo(() => {
    const monday = getMondayOfWeek(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  const selectedWeekNumber = useMemo(
    () => getWeekNumber(profile.startDate, selectedMonday),
    [profile.startDate, selectedMonday]
  );

  const selectedWeekMeals = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedMonday);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return meals.filter((m) => dates.includes(m.date));
  }, [meals, selectedMonday]);

  const selectedWeekWorkouts = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedMonday);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return workouts.filter((w) => dates.includes(w.date));
  }, [workouts, selectedMonday]);

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const { generateWeeklyPDF } = await import("@/lib/pdfReport");
      await generateWeeklyPDF(
        {
          meals: selectedWeekMeals,
          workouts: selectedWeekWorkouts,
          startDate: selectedMonday.toISOString().split("T")[0],
          weekNumber: selectedWeekNumber,
        },
        profile
      );
    } finally {
      setGenerating(false);
    }
  };

  const mondayLabel = selectedMonday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const sundayDate = new Date(selectedMonday);
  sundayDate.setDate(sundayDate.getDate() + 6);
  const sundayLabel = sundayDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="pb-4">
      <Header
        title="Progression"
        subtitle={`Jour ${Math.min(currentDay, 60)}/60`}
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-teal-600">
              {daysWithData.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Jours journalisés
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-green-500">
              {daysOnTarget.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Jours objectif ✓
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-slate-700">{avgCalories}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Moy. kcal/j</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-blue-500">
              {workouts.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Séances sport</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center">
            <div className="text-xl font-bold text-slate-700">
              {meals.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Repas enregistrés</div>
          </div>
        </div>

        {/* Calorie chart */}
        {daysWithData.length > 0 ? (
          <>
            <div className="bg-white rounded-2xl p-4">
              <h2 className="font-semibold text-slate-700 mb-3 text-sm">
                Calories — 60 jours
              </h2>
              <CalorieChart data={dailyData} target={profile.targetCalories} />
            </div>

            <div className="bg-white rounded-2xl p-4">
              <h2 className="font-semibold text-slate-700 mb-3 text-sm">
                Macros moyens
              </h2>
              <MacroChart
                data={daysWithData}
                targets={{
                  protein: profile.targetProtein,
                  carbs: profile.targetCarbs,
                  fat: profile.targetFat,
                }}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-sm font-medium">
              Ajoutez des repas pour voir vos graphiques
            </p>
          </div>
        )}

        {/* 60-day heatmap */}
        <div className="bg-white rounded-2xl p-4">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">
            Calendrier 60 jours
          </h2>
          <div className="grid grid-cols-10 gap-1.5">
            {dailyData.map((d) => (
              <div
                key={d.day}
                title={`Jour ${d.day}${d.calories ? ` — ${d.calories} kcal` : ""}`}
                className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-bold transition-colors ${
                  d.isFuture
                    ? "bg-slate-100 text-slate-300"
                    : !d.hasData
                    ? "bg-slate-100 text-slate-400"
                    : d.calories !== null && d.calories <= d.target
                    ? "bg-teal-500 text-white"
                    : "bg-red-400 text-white"
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
              Objectif atteint
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-400 inline-block" />
              Dépassé
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
              Vide
            </span>
          </div>
        </div>

        {/* PDF Report */}
        <div className="bg-white rounded-2xl p-4">
          <h2 className="font-semibold text-slate-700 mb-1 text-sm">
            Rapport PDF hebdomadaire
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Téléchargez le bilan complet de la semaine choisie.
          </p>

          {/* Week picker */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mb-3">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-1.5 rounded-lg text-slate-500 active:bg-slate-200"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-700">
                Semaine {selectedWeekNumber}
              </div>
              <div className="text-xs text-slate-400">
                {mondayLabel} – {sundayLabel}
              </div>
            </div>
            <button
              onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
              className="p-1.5 rounded-lg text-slate-500 active:bg-slate-200 disabled:opacity-30"
              disabled={weekOffset >= 0}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="text-xs text-slate-400 mb-3 text-center">
            {selectedWeekMeals.length} repas · {selectedWeekWorkouts.length} séances
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 active:bg-teal-700 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {generating ? "Génération…" : "Télécharger le rapport PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
