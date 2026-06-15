"use client";

import Link from "next/link";
import { Plus, Wand2, Settings } from "lucide-react";
import { formatDate } from "@/lib/storage";
import Header from "@/components/layout/Header";
import WorkoutCard from "@/components/workout/WorkoutCard";
import { deleteWorkout, getWorkouts } from "@/lib/storage";
import { useState, useEffect } from "react";
import { WorkoutEntry } from "@/lib/types";

export default function EntrainementPage() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);

  useEffect(() => {
    const all = getWorkouts().sort((a, b) => b.date.localeCompare(a.date));
    setWorkouts(all);
  }, []);

  const handleDelete = (id: string) => {
    deleteWorkout(id);
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const grouped = workouts.reduce<Record<string, WorkoutEntry[]>>((acc, w) => {
    if (!acc[w.date]) acc[w.date] = [];
    acc[w.date].push(w);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="pb-4">
      <Header
        title="Entraînements"
        subtitle={`${workouts.length} séance${workouts.length !== 1 ? "s" : ""} enregistrée${workouts.length !== 1 ? "s" : ""}`}
        right={
          <Link href="/parametres" className="p-1 text-teal-100 active:text-white">
            <Settings size={20} />
          </Link>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Program generator banner */}
        <Link
          href="/entrainement/programme"
          className="flex items-center gap-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-2xl p-4 active:opacity-90"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wand2 size={22} />
          </div>
          <div>
            <p className="font-bold text-sm">Générer un programme IA</p>
            <p className="text-teal-100 text-xs">Solo · Duo Léa · Hyrox · Selon votre équipement</p>
          </div>
        </Link>

        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400">
            <div className="text-5xl mb-3">💪</div>
            <p className="text-sm font-medium">Aucune séance enregistrée</p>
            <Link
              href="/entrainement/ajouter"
              className="mt-3 inline-block text-teal-600 text-sm font-semibold"
            >
              + Ajouter votre première séance
            </Link>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {formatDate(date)}
              </p>
              <div className="space-y-2">
                {grouped[date].map((w) => (
                  <WorkoutCard key={w.id} workout={w} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <Link
        href="/entrainement/ajouter"
        className="fixed bottom-24 right-4 w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-200 active:scale-95 transition-transform z-40"
      >
        <Plus size={28} className="text-white" />
      </Link>
    </div>
  );
}
