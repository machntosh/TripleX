"use client";

import { MealEntry } from "@/lib/types";
import { Trash2 } from "lucide-react";

const MEAL_LABELS: Record<string, string> = {
  "petit-déjeuner": "Petit-déj.",
  déjeuner: "Déjeuner",
  dîner: "Dîner",
  collation: "Collation",
};

const MEAL_COLORS: Record<string, string> = {
  "petit-déjeuner": "bg-amber-100 text-amber-700",
  déjeuner: "bg-teal-100 text-teal-700",
  dîner: "bg-indigo-100 text-indigo-700",
  collation: "bg-rose-100 text-rose-700",
};

interface Props {
  meal: MealEntry;
  onDelete?: (id: string) => void;
}

export default function MealCard({ meal, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex">
      {/* Photo */}
      {meal.photoBase64 ? (
        <div className="w-20 shrink-0">
          <img
            src={meal.photoBase64}
            alt={meal.description}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-20 shrink-0 bg-slate-100 flex items-center justify-center text-3xl">
          🍽️
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  MEAL_COLORS[meal.mealType] || "bg-slate-100 text-slate-600"
                }`}
              >
                {MEAL_LABELS[meal.mealType] || meal.mealType}
              </span>
              <span className="text-[10px] text-slate-400">{meal.time}</span>
            </div>
            <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
              {meal.description}
            </p>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(meal.id)}
              className="shrink-0 text-slate-300 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Macros */}
        <div className="flex gap-3 mt-2 text-xs">
          <span className="font-bold text-slate-800">{meal.calories} kcal</span>
          <span className="text-blue-500">P {meal.protein}g</span>
          <span className="text-amber-500">G {meal.carbs}g</span>
          <span className="text-rose-500">L {meal.fat}g</span>
        </div>
      </div>
    </div>
  );
}
