interface DayProgressProps {
  dayNumber: number;
  totalDays: number;
}

export default function DayProgress({ dayNumber, totalDays }: DayProgressProps) {
  const pct = Math.min(100, ((dayNumber - 1) / totalDays) * 100);
  const remaining = Math.max(0, totalDays - dayNumber + 1);

  return (
    <div className="bg-teal-700 mx-4 rounded-2xl p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-teal-200 text-xs font-medium">SÈCHE EN COURS</span>
          <div className="text-white font-bold text-2xl leading-none">
            Jour {dayNumber}
            <span className="text-teal-300 text-base font-normal">/{totalDays}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-teal-200 text-xs">Restant</div>
          <div className="text-white font-bold text-xl">{remaining}j</div>
        </div>
      </div>
      <div className="h-2 bg-teal-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-300 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
