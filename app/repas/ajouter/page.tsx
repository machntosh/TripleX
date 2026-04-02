"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import PhotoCapture from "@/components/meals/PhotoCapture";
import MealAnalysis from "@/components/meals/MealAnalysis";
import { ClaudeAnalysisResult } from "@/lib/types";
import { saveMeal, generateId, getTodayString } from "@/lib/storage";
import { getProfile } from "@/lib/storage";

type Step = "photo" | "analyzing" | "review" | "done";

function AjouterRepasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetDate = searchParams.get("date") || getTodayString();

  const [step, setStep] = useState<Step>("photo");
  const [preview, setPreview] = useState<string>("");
  const [analysis, setAnalysis] = useState<ClaudeAnalysisResult | null>(null);
  const [error, setError] = useState<string>("");

  const handlePhoto = async (b64: string, mime: string, prev: string) => {
    setPreview(prev);
    setError("");
    setStep("analyzing");

    try {
      const profile = getProfile();

      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: b64,
          mimeType: mime,
          apiKey: profile.groqApiKey || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'analyse");
      }

      setAnalysis(data);
      setStep("review");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      setStep("photo");
    }
  };

  const handleSave = () => {
    if (!analysis) return;

    try {
      const now = new Date();
      const time = now.toTimeString().slice(0, 5);

      saveMeal({
        id: generateId(),
        date: targetDate,
        time,
        mealType: analysis.mealType,
        description: analysis.description || "Repas",
        calories: analysis.totalCalories || 0,
        protein: analysis.protein || 0,
        carbs: analysis.carbs || 0,
        fat: analysis.fat || 0,
        foods: analysis.foods || [],
      });

      setStep("done");
      setTimeout(() => router.push(`/repas?date=${targetDate}`), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setError(msg);
    }
  };

  const isBackDate = targetDate !== getTodayString();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-teal-600 text-white px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href={`/repas?date=${targetDate}`} className="p-1">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Ajouter un repas</h1>
          {isBackDate && (
            <p className="text-teal-200 text-xs">{targetDate.split("-").reverse().join("/")}</p>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Done */}
        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 size={56} className="text-teal-500" />
            <p className="text-lg font-semibold text-slate-700">Repas enregistré !</p>
          </div>
        )}

        {/* Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            {preview && (
              <img src={preview} alt="Repas" className="w-48 h-48 object-cover rounded-2xl shadow-md" />
            )}
            <Loader2 size={36} className="text-teal-600 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-slate-700">Analyse en cours…</p>
              <p className="text-sm text-slate-400">Llama 4 Scout identifie vos aliments</p>
            </div>
          </div>
        )}

        {/* Photo */}
        {step === "photo" && (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                  {(error.includes("Clé API") || error.includes("API Key") || error.includes("Groq")) && (
                    <Link href="/parametres" className="text-xs text-teal-600 font-medium mt-1 block">
                      → Configurer la clé API Groq dans les Paramètres
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4">
              <p className="text-sm text-slate-500 mb-4 text-center">
                Prenez ou choisissez une photo de votre repas.<br />
                L&apos;IA analysera automatiquement les aliments.
              </p>
              <PhotoCapture onPhoto={handlePhoto} />
            </div>

            <button
              onClick={() => {
                setAnalysis({ foods: [], totalCalories: 0, protein: 0, carbs: 0, fat: 0, mealType: "déjeuner", description: "" });
                setStep("review");
              }}
              className="w-full py-3 text-sm text-slate-500 font-medium"
            >
              Saisir manuellement sans photo →
            </button>
          </>
        )}

        {/* Review */}
        {step === "review" && analysis && (
          <>
            {preview && (
              <div className="rounded-2xl overflow-hidden shadow-sm">
                <img src={preview} alt="Repas analysé" className="w-full h-48 object-cover" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                  {preview ? "Analysé par IA — vérifiez et corrigez si besoin" : "Saisie manuelle"}
                </p>
              </div>
              <MealAnalysis result={analysis} onChange={setAnalysis} />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("photo"); setPreview(""); setError(""); }}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm"
              >
                Recommencer
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 rounded-2xl bg-teal-600 text-white font-semibold text-sm active:bg-teal-700"
              >
                Enregistrer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AjouterRepasPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-teal-600" size={32} /></div>}>
      <AjouterRepasContent />
    </Suspense>
  );
}
