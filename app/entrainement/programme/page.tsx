"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Wand2,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getProfile, saveProgram, getPrograms, deleteProgram, generateId } from "@/lib/storage";
import { WorkoutProgram } from "@/lib/types";

type Mode = "solo" | "duo" | "hyrox-solo" | "hyrox-duo";

const MODES: { value: Mode; label: string; emoji: string; hint: string }[] = [
  { value: "solo", label: "Solo", emoji: "💪", hint: "Séance individuelle" },
  { value: "duo", label: "Duo Léa", emoji: "👫", hint: "Entraînement en binôme" },
  { value: "hyrox-solo", label: "Hyrox Solo", emoji: "🏁", hint: "Préparation compétition" },
  { value: "hyrox-duo", label: "Hyrox Duo", emoji: "🏆", hint: "Prépa compétition en équipe" },
];

const EQUIPMENT_PRESETS: { label: string; items: string[] }[] = [
  { label: "Salle complète", items: ["Barbell", "Haltères", "Câbles", "Smith machine", "Leg press", "Poulie haute", "TRX"] },
  { label: "Hyrox", items: ["Ski Erg", "Vélo assault", "Rameur", "Sled", "Kettlebell", "Sandbag", "Wall ball", "Burpee box"] },
  { label: "Maison / extérieur", items: ["Poids du corps", "Élastiques", "Kettlebell", "Corde à sauter"] },
];

export default function ProgrammePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("solo");
  const [duration, setDuration] = useState("60");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [customEquip, setCustomEquip] = useState("");
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedPrograms, setSavedPrograms] = useState<WorkoutProgram[]>([]);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(0);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setSavedPrograms(getPrograms().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const addCustomEquip = () => {
    const trimmed = customEquip.trim();
    if (trimmed && !equipment.includes(trimmed)) {
      setEquipment((prev) => [...prev, trimmed]);
    }
    setCustomEquip("");
  };

  const buildPrompt = () => {
    const modeLabel = MODES.find((m) => m.value === mode)?.label;
    const equipStr = equipment.length > 0 ? equipment.join(", ") : "poids du corps uniquement";
    let prompt = `Crée un programme d'entraînement ${modeLabel} de ${duration} minutes avec : ${equipStr}.`;
    if (mode === "duo" || mode === "hyrox-duo") {
      prompt += " Format duo (Tarek + Léa), inclure exercices en binôme ou en alternance.";
    }
    if (mode === "hyrox-solo" || mode === "hyrox-duo") {
      prompt += " Orientation préparation Hyrox : combine cardio fonctionnel (ski erg, rameur, sled push/pull, burpee box, wall ball, sandbag lunges) et running.";
    }
    if (freeText.trim()) {
      prompt += ` Instructions supplémentaires : ${freeText.trim()}`;
    }
    return prompt;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setProgram(null);
    setSaved(false);
    setExpandedBlock(0);

    try {
      const profile = getProfile();
      const res = await fetch("/api/generate-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPrompt(),
          apiKey: profile.openRouterApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la génération");

      setProgram({
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        type: mode,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!program) return;
    const toSave = { ...program, savedAt: new Date().toISOString() };
    saveProgram(toSave);
    setSaved(true);
    setSavedPrograms((prev) => [toSave, ...prev.filter((p) => p.id !== toSave.id)]);
  };

  const handleDeleteSaved = (id: string) => {
    deleteProgram(id);
    setSavedPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-teal-600 text-white px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/entrainement" className="p-1">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">Générateur de programme IA</h1>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Mode */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
            Type de séance
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MODES.map(({ value, label, emoji, hint }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`py-3 px-2 rounded-xl text-sm font-medium flex flex-col items-center gap-1 transition-colors ${
                  mode === value
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span>{label}</span>
                <span className={`text-[10px] ${mode === value ? "text-teal-100" : "text-slate-400"}`}>
                  {hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
            Durée (minutes)
          </label>
          <div className="flex gap-2">
            {["30", "45", "60", "75", "90"].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  duration === d ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">
            Équipement disponible
          </label>

          {EQUIPMENT_PRESETS.map(({ label, items }) => (
            <div key={label} className="mb-3">
              <p className="text-xs font-medium text-slate-400 mb-1.5">{label}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      equipment.includes(item)
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={customEquip}
              onChange={(e) => setCustomEquip(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomEquip()}
              placeholder="Autre équipement…"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500"
            />
            <button
              onClick={addCustomEquip}
              className="px-3 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold"
            >
              +
            </button>
          </div>

          {equipment.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {equipment.map((e) => (
                <span
                  key={e}
                  onClick={() => toggleEquipment(e)}
                  className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-lg cursor-pointer"
                >
                  {e} ×
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Free text */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
            Instructions supplémentaires (optionnel)
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            placeholder="Ex : focus jambes et fessiers, pas d'exercice à impact (genou), prépa Hyrox J-45, alternance Tarek/Léa toutes les 2 stations…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none caret-teal-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3.5 bg-teal-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 active:bg-teal-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Wand2 size={20} />
          )}
          {loading ? "Génération en cours…" : "Générer le programme"}
        </button>

        {/* Generated program */}
        {program && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="bg-teal-600 px-4 py-3">
              <p className="text-white font-bold">{program.name}</p>
              <p className="text-teal-100 text-xs mt-0.5">
                {program.totalDuration} min · {program.equipment?.join(", ")}
              </p>
            </div>

            <div className="p-4">
              <p className="text-sm text-slate-500 mb-4">{program.description}</p>

              <div className="space-y-2">
                {program.blocks.map((block, bi) => (
                  <div key={bi} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedBlock(expandedBlock === bi ? null : bi)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50"
                    >
                      <span className="text-sm font-semibold text-slate-700">{block.title}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        {block.exercises.length} exercices
                        {expandedBlock === bi ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    {expandedBlock === bi && (
                      <div className="divide-y divide-slate-50">
                        {block.exercises.map((ex, ei) => (
                          <div key={ei} className="px-3 py-2.5">
                            <p className="text-sm font-semibold text-slate-700">{ex.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {ex.sets && (
                                <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                                  {ex.sets} séries
                                </span>
                              )}
                              {ex.reps && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                  {ex.reps} reps
                                </span>
                              )}
                              {ex.duration && (
                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                  {ex.duration}
                                </span>
                              )}
                              {ex.distance && (
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                  {ex.distance}
                                </span>
                              )}
                              {ex.rest && (
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                  Repos {ex.rest}
                                </span>
                              )}
                            </div>
                            {ex.notes && (
                              <p className="text-xs text-slate-400 mt-1 italic">{ex.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={saved}
                className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  saved
                    ? "bg-green-500 text-white"
                    : "bg-teal-600 text-white active:bg-teal-700"
                }`}
              >
                <Save size={18} />
                {saved ? "Programme sauvegardé !" : "Sauvegarder ce programme"}
              </button>
            </div>
          </div>
        )}

        {/* Saved programs */}
        {savedPrograms.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <button
              onClick={() => setShowSaved((s) => !s)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-semibold text-slate-700 text-sm">
                Programmes sauvegardés ({savedPrograms.length})
              </h2>
              {showSaved ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showSaved && (
              <div className="mt-3 space-y-2">
                {savedPrograms.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <button
                      onClick={() => {
                        setProgram(p);
                        setExpandedBlock(0);
                        setSaved(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-left flex-1"
                    >
                      <p className="text-sm font-semibold text-slate-700">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.totalDuration} min · {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(p.id)}
                      className="p-1.5 text-slate-300 active:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
