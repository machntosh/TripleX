"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { saveBodyEntry, generateId, getTodayString } from "@/lib/storage";

export default function AjouterCorpsPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    date: getTodayString(),
    weight: "",
    bodyFat: "",
    muscleMass: "",
    visceralFat: "",
    waterPercent: "",
    boneMass: "",
    bmi: "",
  });

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const handleSave = () => {
    if (!form.weight) return;
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);

    saveBodyEntry({
      id: generateId(),
      date: form.date || getTodayString(),
      time,
      weight: Number(form.weight),
      bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
      muscleMass: form.muscleMass ? Number(form.muscleMass) : undefined,
      visceralFat: form.visceralFat ? Number(form.visceralFat) : undefined,
      waterPercent: form.waterPercent ? Number(form.waterPercent) : undefined,
      boneMass: form.boneMass ? Number(form.boneMass) : undefined,
      bmi: form.bmi ? Number(form.bmi) : undefined,
      source: "manual",
    });

    setDone(true);
    setTimeout(() => router.push("/corps"), 1200);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <CheckCircle2 size={56} className="text-teal-500" />
        <p className="text-lg font-semibold text-slate-700">Mesure enregistrée !</p>
      </div>
    );
  }

  const Field = ({
    label,
    fieldKey,
    unit,
    placeholder,
    step = "0.1",
  }: {
    label: string;
    fieldKey: keyof typeof form;
    unit: string;
    placeholder: string;
    step?: string;
  }) => (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          step={step}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500 caret-teal-500"
          {...f(fieldKey)}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
          {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-teal-600 text-white px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/corps" className="p-1">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-lg font-bold">Nouvelle mesure</h1>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Date */}
        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs font-semibold text-slate-500 block mb-1">
            Date
          </label>
          <input
            type="date"
            max={getTodayString()}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            {...f("date")}
          />
        </div>

        {/* Main metrics */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Mesures principales
          </p>
          <Field label="Poids *" fieldKey="weight" unit="kg" placeholder="87.5" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="% Graisse corporelle" fieldKey="bodyFat" unit="%" placeholder="20.5" />
            <Field label="Masse musculaire" fieldKey="muscleMass" unit="kg" placeholder="62.0" />
          </div>
          <Field label="Graisse viscérale (niveau)" fieldKey="visceralFat" unit="niv." placeholder="8" step="1" />
        </div>

        {/* Secondary metrics */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Mesures secondaires (optionnel)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="% Eau" fieldKey="waterPercent" unit="%" placeholder="55.0" />
            <Field label="Masse osseuse" fieldKey="boneMass" unit="kg" placeholder="3.5" />
          </div>
          <Field label="IMC" fieldKey="bmi" unit="" placeholder="24.5" />
        </div>

        <p className="text-center text-xs text-slate-400">
          Intégration balance Bluetooth bientôt disponible
        </p>

        <button
          onClick={handleSave}
          disabled={!form.weight}
          className="w-full py-3.5 bg-teal-600 text-white rounded-2xl font-semibold active:bg-teal-700 disabled:opacity-40"
        >
          Enregistrer la mesure
        </button>
      </div>
    </div>
  );
}
