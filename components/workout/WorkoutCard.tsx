"use client";

import { WorkoutEntry } from "@/lib/types";
import { Clock, Trash2, Flame } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  musculation: "Musculation",
  cardio: "Cardio",
  mixte: "Mixte",
};

const TYPE_COLORS: Record<string, string> = {
  musculation: "bg-blue-100 text-blue-700",
  cardio: "bg-orange-100 text-orange-700",
  mixte: "bg-purple-100 text-purple-700",
};

const TYPE_EMOJI: Record<string, string> = {
  musculation: "💪",
  cardio: "🏃",
  mixte: "⚡",
};

interface Props {
  workout: WorkoutEntry;
  onDelete?: (id: string) => void;
}

export default function WorkoutCard({ workout, onDelete }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{TYPE_EMOJI[workout.type]}</span>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  TYPE_COLORS[workout.type]
                }`}
              >
                {TYPE_LABELS[workout.type]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {workout.duration} min
              </span>
              {workout.caloriesBurned && (
                <span className="flex items-center gap-1 text-orange-500">
                  <Flame size={12} />
                  ~{workout.caloriesBurned} kcal
                </span>
              )}
            </div>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(workout.id)}
            className="text-slate-300 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {workout.exercises.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {workout.exercises.map((ex, i) => (
            <span
              key={i}
              className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg"
            >
              {ex}
            </span>
          ))}
        </div>
      )}

      {workout.notes && (
        <p className="mt-2 text-xs text-slate-400 italic">{workout.notes}</p>
      )}
    </div>
  );
}
