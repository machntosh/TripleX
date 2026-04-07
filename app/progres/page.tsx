"use client";

import { useMemo, useState } from "react";
import { useAllMeals, useAllWorkouts, useProfile } from "@/hooks/useJournal";
import { getDayNumber } from "@/lib/storage";
import Header from "@/components/layout/Header";
import CalorieChart from "@/components/progress/CalorieChart";
import MacroChart from "@/components/progress/MacroChart";
import { MealEntry } from "@/lib/types";
import { FileDown, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function ProgresPage() {
  const { profile } = useProfile();
  const meals = useAllMeals();
  const workouts = useAllWorkouts();

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

  const [weekOffset, setWeekOffset] = useState(0);
  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const { generateWeeklyPDF } = await import("@/lib/pdfReport");
      await generateWeeklyPDF(meals, workouts, profile, weekOffset);
    } finally {
      setGenerating(false);
    }
  };

  // Label semaine sélectionnée
  const weekLabel = weekOffset === 0 ? "Cette semaine" : weekOffset === -1 ? "Semaine dernière" : `Il y a ${Math.abs(weekOffset)} semaines`;

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

        {/* Rapport PDF */}
        <div className="bg-white rounded-2xl p-4">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Rapport PDF hebdomadaire</h2>

          {/* Sélecteur de semaine */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-3">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1 text-slate-500 active:text-teal-600"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-slate-700">{weekLabel}</span>
            <button
              onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
              disabled={weekOffset >= 0}
              className={`p-1 ${weekOffset >= 0 ? "text-slate-200" : "text-slate-500 active:text-teal-600"}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleGeneratePDF}
            disabled={generating}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:bg-teal-700 disabled:opacity-60"
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Génération…</>
            ) : (
              <><FileDown size={18} /> Télécharger le rapport PDF</>
            )}
          </button>
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
      </div>
    </div>
  );
}
