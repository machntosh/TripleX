import { MealEntry, WorkoutEntry, UserProfile } from "./types";

interface WeekData {
  startDate: string;
  endDate: string;
  weekNumber: number;
  days: DayData[];
}

interface DayData {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  workout?: WorkoutEntry;
  onTarget: boolean;
}

function getWeekDates(weekOffset: number = 0): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day) + weekOffset * 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function getWeekNumber(startDate: string, currentDate: string): number {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(diff / 7) + 1;
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABELS = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

function buildWeekData(
  meals: MealEntry[],
  workouts: WorkoutEntry[],
  profile: UserProfile,
  weekOffset: number = 0
): WeekData {
  const { start, end } = getWeekDates(weekOffset);
  const weekNumber = getWeekNumber(profile.startDate, start);

  const days: DayData[] = [];
  const current = new Date(start);

  for (let i = 0; i < 7; i++) {
    const dateStr = current.toISOString().split("T")[0];
    const dayMeals = meals.filter((m) => m.date === dateStr);
    const dayWorkout = workouts.find((w) => w.date === dateStr);

    const calories = dayMeals.reduce((s, m) => s + m.calories, 0);
    const protein = dayMeals.reduce((s, m) => s + m.protein, 0);
    const carbs = dayMeals.reduce((s, m) => s + m.carbs, 0);
    const fat = dayMeals.reduce((s, m) => s + m.fat, 0);

    days.push({
      date: dateStr,
      label: `${DAY_LABELS[i]} ${formatShortDate(dateStr)}`,
      calories,
      protein,
      carbs,
      fat,
      mealCount: dayMeals.length,
      workout: dayWorkout,
      onTarget: dayMeals.length > 0 && calories <= profile.targetCalories,
    });

    current.setDate(current.getDate() + 1);
  }

  return { startDate: start, endDate: end, weekNumber, days };
}

export async function generateWeeklyPDF(
  meals: MealEntry[],
  workouts: WorkoutEntry[],
  profile: UserProfile,
  weekOffset: number = 0
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const jsPDFModule = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  const jsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default;

  const week = buildWeekData(meals, workouts, profile, weekOffset);
  const daysWithData = week.days.filter((d) => d.mealCount > 0);

  const avgCalories = daysWithData.length
    ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
    : 0;
  const totalProtein = Math.round(week.days.reduce((s, d) => s + d.protein, 0));
  const totalCarbs = Math.round(week.days.reduce((s, d) => s + d.carbs, 0));
  const totalFat = Math.round(week.days.reduce((s, d) => s + d.fat, 0));
  const daysOnTarget = week.days.filter((d) => d.onTarget).length;
  const workoutCount = week.days.filter((d) => d.workout).length;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const TEAL = [13, 148, 136] as [number, number, number];
  const DARK = [30, 41, 59] as [number, number, number];
  const LIGHT = [248, 250, 252] as [number, number, number];

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Journal Sèche 60J", 14, 16);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Rapport Semaine ${week.weekNumber}/60`, 14, 25);
  doc.text(`${formatShortDate(week.startDate)} – ${formatShortDate(week.endDate)}`, 14, 32);

  // Objectif calorie en haut à droite
  doc.setFontSize(9);
  doc.text(`Objectif : ${profile.targetCalories} kcal/j`, W - 14, 20, { align: "right" });
  doc.text(`Protéines : ${profile.targetProtein}g  Glucides : ${profile.targetCarbs}g  Lipides : ${profile.targetFat}g`, W - 14, 28, { align: "right" });

  // ── Résumé semaine ───────────────────────────────────────
  let y = 50;
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Résumé de la semaine", 14, y);
  y += 6;

  // Cartes stats
  const cards = [
    { label: "Moy. calories/j", value: `${avgCalories} kcal`, target: `obj. ${profile.targetCalories}`, ok: avgCalories <= profile.targetCalories },
    { label: "Jours objectif ✓", value: `${daysOnTarget}/7`, target: `${Math.round((daysOnTarget / 7) * 100)}%`, ok: daysOnTarget >= 5 },
    { label: "Jours journalisés", value: `${daysWithData.length}/7`, target: "", ok: daysWithData.length >= 5 },
    { label: "Séances sport", value: `${workoutCount}`, target: "", ok: workoutCount >= 3 },
  ];

  const cardW = (W - 28 - 9) / 4;
  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 3);
    doc.setFillColor(...(card.ok ? [240, 253, 250] as [number, number, number] : [255, 241, 242] as [number, number, number]));
    doc.roundedRect(x, y, cardW, 20, 2, 2, "F");
    doc.setDrawColor(...(card.ok ? TEAL : [244, 63, 94] as [number, number, number]));
    doc.roundedRect(x, y, cardW, 20, 2, 2, "S");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(card.ok ? TEAL : [244, 63, 94] as [number, number, number]));
    doc.text(card.value, x + cardW / 2, y + 9, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + cardW / 2, y + 14, { align: "center" });
    if (card.target) doc.text(card.target, x + cardW / 2, y + 18, { align: "center" });
  });

  y += 27;

  // ── Tableau macros ────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Total macronutriments (semaine)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["", "Consommé", "Objectif /j × 7", "Écart"]],
    body: [
      ["Protéines", `${totalProtein}g`, `${profile.targetProtein * 7}g`, `${totalProtein > profile.targetProtein * 7 ? "+" : ""}${totalProtein - profile.targetProtein * 7}g`],
      ["Glucides", `${totalCarbs}g`, `${profile.targetCarbs * 7}g`, `${totalCarbs > profile.targetCarbs * 7 ? "+" : ""}${totalCarbs - profile.targetCarbs * 7}g`],
      ["Lipides", `${totalFat}g`, `${profile.targetFat * 7}g`, `${totalFat > profile.targetFat * 7 ? "+" : ""}${totalFat - profile.targetFat * 7}g`],
    ],
    theme: "striped",
    headStyles: { fillColor: TEAL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold" }, 3: { textColor: TEAL } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Tableau journalier ────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Détail journalier", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Jour", "Kcal", "P (g)", "G (g)", "L (g)", "Repas", "Sport", "✓"]],
    body: week.days.map((d) => [
      d.label,
      d.mealCount > 0 ? String(d.calories) : "—",
      d.mealCount > 0 ? String(Math.round(d.protein)) : "—",
      d.mealCount > 0 ? String(Math.round(d.carbs)) : "—",
      d.mealCount > 0 ? String(Math.round(d.fat)) : "—",
      d.mealCount > 0 ? String(d.mealCount) : "—",
      d.workout ? `${d.workout.duration}min` : "—",
      d.onTarget ? "✓" : d.mealCount > 0 ? "✗" : "",
    ]),
    theme: "grid",
    headStyles: { fillColor: TEAL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: "bold" },
      7: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        if (data.cell.raw === "✓") data.cell.styles.textColor = [13, 148, 136];
        if (data.cell.raw === "✗") data.cell.styles.textColor = [244, 63, 94];
      }
      if (data.section === "body" && data.column.index === 1) {
        const cal = Number(data.cell.raw);
        if (cal > profile.targetCalories) data.cell.styles.textColor = [244, 63, 94];
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Séances sport ─────────────────────────────────────────
  const weekWorkouts = week.days.filter((d) => d.workout).map((d) => d.workout!);
  if (weekWorkouts.length > 0) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Séances d'entraînement", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Jour", "Type", "Durée", "Calories", "Exercices"]],
      body: weekWorkouts.map((w) => {
        const day = week.days.find((d) => d.workout?.id === w.id);
        return [
          day?.label || w.date,
          w.type === "musculation" ? "Musculation" : w.type === "cardio" ? "Cardio" : "Mixte",
          `${w.duration} min`,
          w.caloriesBurned ? `${w.caloriesBurned} kcal` : "—",
          w.exercises.slice(0, 4).join(", ") + (w.exercises.length > 4 ? "…" : ""),
        ];
      }),
      theme: "striped",
      headStyles: { fillColor: TEAL, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Footer ────────────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.rect(0, 285, W, 12, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Journal Sèche 60J — Semaine ${week.weekNumber} — Généré le ${new Date().toLocaleDateString("fr-FR")}`, W / 2, 292, { align: "center" });

  // ── Sauvegarde ────────────────────────────────────────────
  doc.save(`rapport-semaine-${week.weekNumber}-${week.startDate}.pdf`);
}
