"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { getBodyEntries, deleteBodyEntry, formatDate } from "@/lib/storage";
import { BodyEntry } from "@/lib/types";
import Header from "@/components/layout/Header";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Metric = "weight" | "bodyFat" | "muscleMass" | "visceralFat";

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: "weight", label: "Poids", unit: "kg", color: "#0d9488" },
  { key: "bodyFat", label: "Graisse", unit: "%", color: "#f43f5e" },
  { key: "muscleMass", label: "Muscle", unit: "kg", color: "#3b82f6" },
  { key: "visceralFat", label: "Graisse visc.", unit: "niv.", color: "#f97316" },
];

export default function CorpsPage() {
  const [entries, setEntries] = useState<BodyEntry[]>(() =>
    getBodyEntries().sort((a, b) => a.date.localeCompare(b.date))
  );
  const [activeMetric, setActiveMetric] = useState<Metric>("weight");

  const handleDelete = (id: string) => {
    deleteBodyEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const latest = entries[entries.length - 1];
  const first = entries[0];

  const chartData = useMemo(
    () =>
      entries
        .filter((e) => e[activeMetric] != null)
        .map((e) => ({
          date: e.date.slice(5), // MM-DD
          value: e[activeMetric] as number,
        })),
    [entries, activeMetric]
  );

  const metric = METRICS.find((m) => m.key === activeMetric)!;

  const delta =
    latest && first && latest[activeMetric] != null && first[activeMetric] != null
      ? ((latest[activeMetric] as number) - (first[activeMetric] as number))
      : null;

  return (
    <div className="pb-4">
      <Header
        title="Composition corporelle"
        subtitle={latest ? `Dernière mesure : ${formatDate(latest.date)}` : "Aucune mesure"}
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Latest metrics grid */}
        {latest ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Poids", value: latest.weight, unit: "kg", color: "text-teal-600" },
              { label: "% Graisse", value: latest.bodyFat, unit: "%", color: "text-rose-500" },
              { label: "Masse musc.", value: latest.muscleMass, unit: "kg", color: "text-blue-500" },
              { label: "Graisse visc.", value: latest.visceralFat, unit: "niv.", color: "text-orange-500" },
              { label: "% Eau", value: latest.waterPercent, unit: "%", color: "text-sky-500" },
              { label: "IMC", value: latest.bmi, unit: "", color: "text-slate-600" },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="bg-white rounded-2xl p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>
                  {value != null ? `${value}${unit}` : "—"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400">
            <div className="text-5xl mb-3">⚖️</div>
            <p className="text-sm font-medium">Aucune mesure enregistrée</p>
            <Link
              href="/corps/ajouter"
              className="mt-3 inline-block text-teal-600 text-sm font-semibold"
            >
              + Ajouter votre première mesure
            </Link>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-2xl p-4">
            {/* Metric selector */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setActiveMetric(m.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeMetric === m.key
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold" style={{ color: metric.color }}>
                {latest?.[activeMetric] != null ? `${latest[activeMetric]}${metric.unit}` : "—"}
              </span>
              {delta !== null && (
                <span
                  className={`text-xs font-semibold ${
                    delta < 0 ? "text-green-500" : "text-rose-500"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}{metric.unit} depuis le début
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  domain={["auto", "auto"]}
                  width={30}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}${metric.unit}`, metric.label]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                {activeMetric === "weight" && (
                  <ReferenceLine y={80} stroke="#0d9488" strokeDasharray="3 3" />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History */}
        {entries.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h2 className="font-semibold text-slate-700 text-sm mb-3">Historique</h2>
            <div className="space-y-2">
              {[...entries].reverse().map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatDate(e.date)}{" "}
                      <span className="text-xs font-normal text-slate-400">{e.time}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {e.weight}kg
                      {e.bodyFat != null && ` · ${e.bodyFat}% graisse`}
                      {e.muscleMass != null && ` · ${e.muscleMass}kg muscle`}
                      {e.visceralFat != null && ` · visc. niv.${e.visceralFat}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="p-1.5 text-slate-300 active:text-red-400"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/corps/ajouter"
        className="fixed bottom-24 right-4 w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-200 active:scale-95 transition-transform z-40"
      >
        <Plus size={28} className="text-white" />
      </Link>
    </div>
  );
}
