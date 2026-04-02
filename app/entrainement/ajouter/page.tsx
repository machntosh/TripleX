"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, X, CheckCircle2, Loader2, Apple } from "lucide-react";
import Link from "next/link";
import { WorkoutType } from "@/lib/types";
import { saveWorkout, generateId, getTodayString } from "@/lib/storage";

const WORKOUT_TYPES: { value: WorkoutType; label: string; emoji: string }[] = [
  { value: "musculation", label: "Musculation", emoji: "💪" },
  { value: "cardio", label: "Cardio", emoji: "🏃" },
  { value: "mixte", label: "Mixte", emoji: "⚡" },
];

// Correspondance types Apple Health → types de l'app
const APPLE_TYPE_MAP: Record<string, WorkoutType> = {
  "HKWorkoutActivityTypeRunning": "cardio",
  "HKWorkoutActivityTypeCycling": "cardio",
  "HKWorkoutActivityTypeWalking": "cardio",
  "HKWorkoutActivityTypeSwimming": "cardio",
  "HKWorkoutActivityTypeHiking": "cardio",
  "HKWorkoutActivityTypeElliptical": "cardio",
  "HKWorkoutActivityTypeRowingMachine": "cardio",
  "HKWorkoutActivityTypeTraditionalStrengthTraining": "musculation",
  "HKWorkoutActivityTypeFunctionalStrengthTraining": "musculation",
  "HKWorkoutActivityTypeHighIntensityIntervalTraining": "mixte",
  "HKWorkoutActivityTypeCrossTraining": "mixte",
  "running": "cardio",
  "cycling": "cardio",
  "walking": "cardio",
  "swimming": "cardio",
  "strength": "musculation",
  "hiit": "mixte",
  "crossfit": "mixte",
};

const APPLE_NAME_MAP: Record<string, string> = {
  "HKWorkoutActivityTypeRunning": "Course à pied",
  "HKWorkoutActivityTypeCycling": "Vélo",
  "HKWorkoutActivityTypeWalking": "Marche rapide",
  "HKWorkoutActivityTypeSwimming": "Natation",
  "HKWorkoutActivityTypeHiking": "Randonnée",
  "HKWorkoutActivityTypeElliptical": "Elliptique",
  "HKWorkoutActivityTypeRowingMachine": "Rameur",
  "HKWorkoutActivityTypeTraditionalStrengthTraining": "Musculation",
  "HKWorkoutActivityTypeFunctionalStrengthTraining": "Musculation fonctionnelle",
  "HKWorkoutActivityTypeHighIntensityIntervalTraining": "HIIT",
  "HKWorkoutActivityTypeCrossTraining": "CrossFit",
  "running": "Course à pied",
  "cycling": "Vélo",
  "walking": "Marche rapide",
  "swimming": "Natation",
  "strength": "Musculation",
  "hiit": "HIIT",
  "crossfit": "CrossFit",
};

const PRESET_EXERCISES: Record<WorkoutType, string[]> = {
  musculation: ["Squat", "Développé couché", "Soulevé de terre", "Tractions", "Rowing barre", "Curl biceps", "Extension triceps", "Épaules presse", "Leg press", "Hip thrust"],
  cardio: ["Course à pied", "Vélo", "HIIT", "Corde à sauter", "Natation", "Rameur", "Elliptique", "Marche rapide"],
  mixte: ["Circuit training", "CrossFit", "Burpees", "Kettlebell", "Box jump"],
};

function AjouterEntrainementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lit les params Apple Health depuis l'URL
  const appleType = searchParams.get("appleType") || "";
  const initialType: WorkoutType = APPLE_TYPE_MAP[appleType] || "musculation";
  const initialExercise = APPLE_NAME_MAP[appleType] || "";
  const initialDuration = searchParams.get("duration") || "60";
  const initialCalories = searchParams.get("calories") || "";
  const initialDate = searchParams.get("date") || getTodayString();
  const fromApple = !!appleType;

  const [type, setType] = useState<WorkoutType>(initialType);
  const [duration, setDuration] = useState(initialDuration);
  const [caloriesBurned, setCaloriesBurned] = useState(initialCalories);
  const [exercises, setExercises] = useState<string[]>(initialExercise ? [initialExercise] : []);
  const [customEx, setCustomEx] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(initialDate);
  const [done, setDone] = useState(false);

  const toggleExercise = (ex: string) => {
    setExercises((prev) => prev.includes(ex) ? prev.filter((e) => e !== ex) : [...prev, ex]);
  };

  const addCustom = () => {
    const trimmed = customEx.trim();
    if (trimmed && !exercises.includes(trimmed)) setExercises((prev) => [...prev, trimmed]);
    setCustomEx("");
  };

  const handleSave = () => {
    saveWorkout({
      id: generateId(),
      date,
      type,
      duration: Number(duration) || 60,
      exercises,
      notes,
      caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
    });
    setDone(true);
    setTimeout(() => router.push("/entrainement"), 1200);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <CheckCircle2 size={56} className="text-teal-500" />
        <p className="text-lg font-semibold text-slate-700">Séance enregistrée !</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-teal-600 text-white px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/entrainement" className="p-1">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Ajouter une séance</h1>
          {fromApple && (
            <p className="text-teal-200 text-xs flex items-center gap-1">
              <Apple size={11} /> Importé depuis Apple Fitness
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">

        {/* Bannière Apple Health si import */}
        {fromApple && (
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center gap-2">
            <Apple size={18} className="text-teal-600 shrink-0" />
            <p className="text-sm text-teal-700 font-medium">
              Données pré-remplies depuis Apple Fitness — vérifiez et ajustez si besoin
            </p>
          </div>
        )}

        {/* Date */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            max={getTodayString()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm font-semibold text-slate-800 focus:outline-none caret-teal-500 border border-slate-200 rounded-xl px-3 py-2"
          />
        </div>

        {/* Type */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
            Type de séance
          </label>
          <div className="flex gap-2">
            {WORKOUT_TYPES.map(({ value, label, emoji }) => (
              <button key={value} type="button"
                onClick={() => { setType(value); setExercises([]); }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium flex flex-col items-center gap-1 transition-colors ${type === value ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                <span className="text-xl">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration & Calories */}
        <div className="bg-white rounded-2xl p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Durée (min)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Calories brûlées</label>
            <input type="number" value={caloriesBurned} onChange={(e) => setCaloriesBurned(e.target.value)}
              placeholder="ex: 350"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500" />
          </div>
        </div>

        {/* Exercises */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
            Exercices réalisés
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_EXERCISES[type].map((ex) => (
              <button key={ex} type="button" onClick={() => toggleExercise(ex)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${exercises.includes(ex) ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                {ex}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={customEx} onChange={(e) => setCustomEx(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              placeholder="Ajouter un exercice…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500" />
            <button type="button" onClick={addCustom} className="p-2 bg-teal-600 text-white rounded-xl">
              <Plus size={18} />
            </button>
          </div>
          {exercises.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {exercises.map((ex) => (
                <span key={ex} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-lg">
                  {ex}
                  <button onClick={() => toggleExercise(ex)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Notes (optionnel)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder="Intensité, ressenti, PR…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500 resize-none" />
        </div>

        <button onClick={handleSave}
          className="w-full py-3.5 bg-teal-600 text-white rounded-2xl font-semibold active:bg-teal-700">
          Enregistrer la séance
        </button>
      </div>
    </div>
  );
}

export default function AjouterEntrainementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    }>
      <AjouterEntrainementContent />
    </Suspense>
  );
}
