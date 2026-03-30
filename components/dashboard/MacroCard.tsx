interface MacroCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export default function MacroCard({
  label,
  current,
  target,
  unit,
  color,
}: MacroCardProps) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  const over = current > target;

  return (
    <div className="bg-white rounded-2xl p-3 flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className={`text-xs font-semibold ${over ? "text-red-500" : "text-slate-400"}`}>
          {Math.round(current)}/{target}{unit}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: over ? "#ef4444" : color,
          }}
        />
      </div>
    </div>
  );
}
