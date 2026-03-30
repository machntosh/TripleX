"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMeals, useProfile, computeDailyTotals } from "@/hooks/useJournal";
import { getTodayString, formatDate } from "@/lib/storage";
import Header from "@/components/layout/Header";
import MealCard from "@/components/meals/MealCard";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function RepasPage() {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const { meals, removeMeal } = useMeals(selectedDate);
  const { profile } = useProfile();
  const totals = computeDailyTotals(meals);

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  return (
    <div className="pb-4">
      <Header title="Journal des repas" />

      {/* Date nav */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <button
          onClick={() => setSelectedDate((d) => addDays(d, -1))}
          className="p-2 rounded-xl text-slate-500 active:bg-slate-100"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-800">{formatDate(selectedDate)}</p>
          {isToday && (
            <p className="text-xs text-teal-600 font-medium">Aujourd&apos;hui</p>
          )}
        </div>
        <button
          onClick={() => !isFuture && setSelectedDate((d) => addDays(d, 1))}
          className={`p-2 rounded-xl ${
            isFuture
              ? "text-slate-200"
              : "text-slate-500 active:bg-slate-100"
          }`}
          disabled={isFuture}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Daily totals bar */}
      {meals.length > 0 && (
        <div className="bg-teal-600 px-4 py-2 flex justify-between text-white text-sm">
          <span className="font-bold">{Math.round(totals.calories)} kcal</span>
          <span className="text-teal-100">
            P {Math.round(totals.protein)}g · G {Math.round(totals.carbs)}g · L {Math.round(totals.fat)}g
          </span>
          <span className="text-teal-100">{profile.targetCalories} obj.</span>
        </div>
      )}

      <div className="px-4 pt-4 space-y-2">
        {meals.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-sm font-medium">Aucun repas ce jour</p>
            {isToday && (
              <Link
                href="/repas/ajouter"
                className="mt-3 inline-block text-teal-600 text-sm font-semibold"
              >
                + Ajouter un repas
              </Link>
            )}
          </div>
        ) : (
          meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onDelete={removeMeal} />
          ))
        )}
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
