"use client";

import { useState } from "react";
import { Save, Download, Eye, EyeOff } from "lucide-react";
import { useProfile } from "@/hooks/useJournal";
import { exportData } from "@/lib/storage";
import Header from "@/components/layout/Header";

export default function ParametresPage() {
  const { profile, updateProfile } = useProfile();
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    groqApiKey: profile.groqApiKey,
    targetCalories: String(profile.targetCalories),
    targetProtein: String(profile.targetProtein),
    targetCarbs: String(profile.targetCarbs),
    targetFat: String(profile.targetFat),
    weight: String(profile.weight),
    bmr: String(profile.bmr),
    startDate: profile.startDate,
  });

  const handleSave = () => {
    updateProfile({
      groqApiKey: form.groqApiKey.trim(),
      targetCalories: Number(form.targetCalories),
      targetProtein: Number(form.targetProtein),
      targetCarbs: Number(form.targetCarbs),
      targetFat: Number(form.targetFat),
      weight: Number(form.weight),
      bmr: Number(form.bmr),
      startDate: form.startDate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-seche-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="pb-4">
      <Header title="Paramètres" subtitle="Objectifs & configuration" />

      <div className="px-4 pt-4 space-y-4">
        {/* API Key */}
        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            ⚡ Clé API Groq (Llama 4 Scout)
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Nécessaire pour l&apos;analyse IA des photos de repas.
            Créez votre clé sur{" "}
            <span className="text-teal-600 font-medium">
              console.groq.com
            </span>
          </p>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder="gsk_..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500"
              {...f("groqApiKey")}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {profile.groqApiKey && (
            <p className="text-xs text-teal-600 mt-1.5">✓ Clé configurée</p>
          )}
        </section>

        {/* Profil */}
        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-semibold text-slate-700 mb-3">👤 Profil</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                Poids (kg)
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                {...f("weight")}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                BMR (kcal)
              </label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                {...f("bmr")}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 font-medium block mb-1">
                Date de début de sèche
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                {...f("startDate")}
              />
            </div>
          </div>
        </section>

        {/* Objectifs */}
        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-semibold text-slate-700 mb-1">🎯 Objectifs journaliers</h2>
          <p className="text-xs text-slate-400 mb-3">
            Valeurs recommandées pour une sèche avec maintien musculaire
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                {...f("targetCalories")}
              />
              <p className="text-xs text-slate-400 mt-0.5">
                Déficit recommandé : BMR × 1.3 × 0.85 ≈ {Math.round(profile.bmr * 1.3 * 0.85)} kcal
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-blue-500 block mb-1">
                  Protéines (g)
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...f("targetProtein")}
                />
                <p className="text-xs text-slate-400 mt-0.5">~2g/kg</p>
              </div>
              <div>
                <label className="text-xs font-medium text-amber-500 block mb-1">
                  Glucides (g)
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...f("targetCarbs")}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-rose-500 block mb-1">
                  Lipides (g)
                </label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  {...f("targetFat")}
                />
                <p className="text-xs text-slate-400 mt-0.5">min. 0.8g/kg</p>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            saved ? "bg-green-500" : "bg-teal-600 active:bg-teal-700"
          }`}
        >
          <Save size={18} />
          {saved ? "Enregistré !" : "Sauvegarder"}
        </button>

        <button
          onClick={handleExport}
          className="w-full py-3.5 rounded-2xl font-semibold text-teal-600 border-2 border-teal-200 transition-all flex items-center justify-center gap-2 active:bg-teal-50"
        >
          <Download size={18} />
          Exporter mes données (JSON)
        </button>
      </div>
    </div>
  );
}
