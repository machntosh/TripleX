"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  day: number;
  calories: number | null;
  target: number;
  hasData: boolean;
}

interface Props {
  data: DataPoint[];
  target: number;
}

export default function CalorieChart({ data, target }: Props) {
  const filtered = data.filter((d) => d.hasData);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={filtered} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          label={{ value: "Jour", position: "insideRight", offset: 0, fontSize: 10, fill: "#94a3b8" }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          formatter={(value: number) => [`${value} kcal`, "Calories"]}
          labelFormatter={(label) => `Jour ${label}`}
        />
        <ReferenceLine
          y={target}
          stroke="#0d9488"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: `Obj. ${target}`, position: "right", fontSize: 9, fill: "#0d9488" }}
        />
        <Line
          type="monotone"
          dataKey="calories"
          stroke="#0d9488"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0d9488", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
