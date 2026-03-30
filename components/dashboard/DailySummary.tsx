"use client";

import { DailyTotals, UserProfile } from "@/lib/types";

interface Props {
  totals: DailyTotals;
  profile: UserProfile;
}

export default function DailySummary({ totals, profile }: Props) {
  const calPct = Math.min(
    100,
    profile.targetCalories > 0
      ? (totals.calories / profile.targetCalories) * 100
      : 0
  );
  const over = totals.calories > profile.targetCalories;
  const remaining = Math.max(0, profile.targetCalories - totals.calories);

  // Determine ring color
  const ringColor = over ? "#ef4444" : calPct > 80 ? "#f59e0b" : "#0d9488";

  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference - (calPct / 100) * circumference;

  return (
    <div className="bg-white mx-4 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-4">
        {/* Calorie ring */}
        <div className="relative shrink-0">
          <svg width="112" height="112" className="-rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="10"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-800">
              {Math.round(totals.calories)}
            </span>
            <span className="text-[10px] text-slate-400 -mt-0.5">kcal</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Objectif</span>
            <span className="font-semibold text-slate-700">
              {profile.targetCalories} kcal
            </span>
          </div>
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-500">
              {over ? "Dépassement" : "Restant"}
            </span>
            <span
              className={`font-semibold ${over ? "text-red-500" : "text-teal-600"}`}
            >
              {over
                ? `+${Math.round(totals.calories - profile.targetCalories)}`
                : Math.round(remaining)}{" "}
              kcal
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>{totals.mealCount} repas</span>
            <span>{Math.round(calPct)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
