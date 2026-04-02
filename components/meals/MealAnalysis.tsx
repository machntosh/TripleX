"use client";

import { ClaudeAnalysisResult, MealType } from "@/lib/types";

interface Props {
  result: ClaudeAnalysisResult;
  onChange: (updated: ClaudeAnalysisResult) => void;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "petit-déjeuner", label: "Petit-déjeuner" },
  { value: "déjeuner", label: "Déjeuner" },
  { value: "dîner", label: "Dîner" },
  { value: "collation", label: "Collation" },
];

const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500";
const macroInputCls = "w-full text-lg font-bold bg-transparent focus:outline-none caret-teal-500";

export default function MealAnalysis({ result, onChange }: Props) {
  const update = (key: keyof ClaudeAnalysisResult, value: unknown) =>
    onChange({ ...result, [key]: value });

  return (
    <div className="space-y-3">
      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Description
        </label>
        <input
          type="text"
          value={result.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputCls}
        />
      </div>

      {/* Meal type */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          Type de repas
        </label>
        <div className="flex gap-2 flex-wrap">
          {MEAL_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => update("mealType", value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                result.mealType === value
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          Valeurs nutritionnelles
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-3">
            <label className="text-xs text-slate-500 block mb-1">Calories (kcal)</label>
            <input
              type="number"
              value={result.totalCalories || ""}
              onChange={(e) => update("totalCalories", Number(e.target.value) || 0)}
              className={`${macroInputCls} text-slate-800`}
            />
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <label className="text-xs text-blue-400 block mb-1">Protéines (g)</label>
            <input
              type="number"
              value={result.protein || ""}
              onChange={(e) => update("protein", Number(e.target.value) || 0)}
              className={`${macroInputCls} text-blue-600`}
            />
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <label className="text-xs text-amber-400 block mb-1">Glucides (g)</label>
            <input
              type="number"
              value={result.carbs || ""}
              onChange={(e) => update("carbs", Number(e.target.value) || 0)}
              className={`${macroInputCls} text-amber-600`}
            />
          </div>
          <div className="bg-rose-50 rounded-xl p-3">
            <label className="text-xs text-rose-400 block mb-1">Lipides (g)</label>
            <input
              type="number"
              value={result.fat || ""}
              onChange={(e) => update("fat", Number(e.target.value) || 0)}
              className={`${macroInputCls} text-rose-600`}
            />
          </div>
        </div>
      </div>

      {/* Food list */}
      {result.foods.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
            Aliments détectés
          </label>
          <div className="space-y-1">
            {result.foods.map((food, i) => (
              <div key={i} className="flex justify-between items-center text-sm bg-slate-50 rounded-xl px-3 py-2">
                <span className="text-slate-700 font-medium">{food.name}</span>
                <div className="flex gap-3 text-slate-400 text-xs">
                  <span>{food.quantity}</span>
                  <span className="font-semibold text-slate-600">{food.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
