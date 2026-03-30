"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface Targets {
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  data: DataPoint[];
  targets: Targets;
}

export default function MacroChart({ data, targets }: Props) {
  const count = data.length || 1;
  const avgProtein = Math.round(
    data.reduce((s, d) => s + (d.protein || 0), 0) / count
  );
  const avgCarbs = Math.round(
    data.reduce((s, d) => s + (d.carbs || 0), 0) / count
  );
  const avgFat = Math.round(
    data.reduce((s, d) => s + (d.fat || 0), 0) / count
  );

  const chartData = [
    {
      name: "Protéines",
      actual: avgProtein,
      target: targets.protein,
      fill: "#3b82f6",
    },
    {
      name: "Glucides",
      actual: avgCarbs,
      target: targets.carbs,
      fill: "#f59e0b",
    },
    {
      name: "Lipides",
      actual: avgFat,
      target: targets.fat,
      fill: "#f43f5e",
    },
  ];

  return (
    <div className="space-y-3">
      {chartData.map(({ name, actual, target, fill }) => {
        const pct = Math.min(100, target > 0 ? (actual / target) * 100 : 0);
        const over = actual > target;
        return (
          <div key={name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-600">{name}</span>
              <span
                className={`font-semibold ${over ? "text-red-500" : "text-slate-500"}`}
              >
                {actual}g / {target}g
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: over ? "#ef4444" : fill,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
