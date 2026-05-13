import { MealEntry, WorkoutEntry, UserProfile } from "./types";

interface WeekData {
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  startDate: string; // Monday of the week "YYYY-MM-DD"
  weekNumber: number; // 1-based week number since sèche start
}

function getWeekDates(mondayStr: string): string[] {
  const dates: string[] = [];
  const base = new Date(mondayStr);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function fr(n: number) {
  return n.toLocaleString("fr-FR");
}

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MEAL_LABEL: Record<string, string> = {
  "petit-déjeuner": "Petit-dej",
  déjeuner: "Déjeuner",
  dîner: "Dîner",
  collation: "Collation",
};

export async function generateWeeklyPDF(
  data: WeekData,
  profile: UserProfile
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const teal = [0, 128, 128] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const slate = [71, 85, 105] as [number, number, number];
  const lightGray = [241, 245, 249] as [number, number, number];

  // ── Header ────────────────────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(0, 0, pageW, 35, "F");

  doc.setTextColor(...white);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RAPPORT HEBDOMADAIRE — SÈCHE", pageW / 2, 13, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const weekDates = getWeekDates(data.startDate);
  const endDate = weekDates[6];
  const fmt = (s: string) => {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  };
  doc.text(
    `Semaine ${data.weekNumber}  ·  ${fmt(data.startDate)} – ${fmt(endDate)}`,
    pageW / 2,
    22,
    { align: "center" }
  );
  doc.text(`Objectif : ${profile.targetCalories} kcal/j`, pageW / 2, 29, {
    align: "center",
  });

  // ── Daily breakdown table ──────────────────────────────────
  const rowsByDate: Record<
    string,
    { cal: number; prot: number; carbs: number; fat: number }
  > = {};
  for (const d of weekDates) rowsByDate[d] = { cal: 0, prot: 0, carbs: 0, fat: 0 };
  for (const m of data.meals) {
    if (rowsByDate[m.date]) {
      rowsByDate[m.date].cal += m.calories;
      rowsByDate[m.date].prot += m.protein;
      rowsByDate[m.date].carbs += m.carbs;
      rowsByDate[m.date].fat += m.fat;
    }
  }

  const totals = Object.values(rowsByDate).reduce(
    (acc, r) => ({
      cal: acc.cal + r.cal,
      prot: acc.prot + r.prot,
      carbs: acc.carbs + r.carbs,
      fat: acc.fat + r.fat,
    }),
    { cal: 0, prot: 0, carbs: 0, fat: 0 }
  );
  const daysWithData = weekDates.filter((d) => rowsByDate[d].cal > 0).length;
  const avg = daysWithData > 0 ? Math.round(totals.cal / daysWithData) : 0;

  // Stat cards row
  const cards = [
    {
      label: "Moy. calories/j",
      value: `${fr(avg)} kcal`,
      sub: `obj. ${profile.targetCalories}`,
    },
    {
      label: "Jours journalisés",
      value: `${daysWithData}/7`,
      sub: "jours",
    },
    {
      label: "Séances sport",
      value: String(data.workouts.length),
      sub: "enregistrées",
    },
    {
      label: "Protéines moy.",
      value: `${daysWithData > 0 ? Math.round(totals.prot / daysWithData) : 0}g`,
      sub: `obj. ${profile.targetProtein}g`,
    },
  ];

  const cardW = 42;
  const cardGap = 4;
  const cardStartX = (pageW - (cardW * 4 + cardGap * 3)) / 2;
  let cardY = 41;

  cards.forEach((card, i) => {
    const x = cardStartX + i * (cardW + cardGap);
    doc.setFillColor(...lightGray);
    doc.roundedRect(x, cardY, cardW, 20, 3, 3, "F");
    doc.setTextColor(...teal);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + cardW / 2, cardY + 9, { align: "center" });
    doc.setTextColor(...slate);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + cardW / 2, cardY + 14, { align: "center" });
    doc.setTextColor(148, 163, 184);
    doc.text(card.sub, x + cardW / 2, cardY + 18.5, { align: "center" });
  });

  // Daily table
  const dailyRows = weekDates.map((d, i) => {
    const r = rowsByDate[d];
    const onTarget =
      r.cal > 0 && r.cal <= profile.targetCalories ? "✓" : r.cal > 0 ? "✗" : "—";
    return [
      DAY_NAMES[i],
      r.cal > 0 ? fr(r.cal) : "—",
      r.prot > 0 ? `${r.prot}g` : "—",
      r.carbs > 0 ? `${r.carbs}g` : "—",
      r.fat > 0 ? `${r.fat}g` : "—",
      onTarget,
    ];
  });

  autoTable(doc, {
    startY: cardY + 26,
    head: [["Jour", "Calories", "Protéines", "Glucides", "Lipides", "Objectif"]],
    body: dailyRows,
    foot: [
      [
        "TOTAL",
        fr(totals.cal),
        `${totals.prot}g`,
        `${totals.carbs}g`,
        `${totals.fat}g`,
        "",
      ],
    ],
    headStyles: { fillColor: teal, textColor: white, fontSize: 8 },
    footStyles: { fillColor: [15, 118, 110], textColor: white, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: slate },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: "bold" },
      5: { cellWidth: 18, halign: "center" },
    },
    alternateRowStyles: { fillColor: lightGray },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        if (data.cell.raw === "✓") data.cell.styles.textColor = [20, 184, 166];
        else if (data.cell.raw === "✗") data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  // ── Meals detail table ─────────────────────────────────────
  const finalY1 = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  if (data.meals.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.text("Détail des repas", 14, finalY1 + 8);

    const mealRows = data.meals
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .map((m) => {
        const dayIdx = weekDates.indexOf(m.date);
        return [
          dayIdx >= 0 ? DAY_NAMES[dayIdx] : "",
          m.time,
          MEAL_LABEL[m.mealType] || m.mealType,
          m.description.slice(0, 45),
          fr(m.calories),
          `${m.protein}g`,
          `${m.carbs}g`,
          `${m.fat}g`,
        ];
      });

    autoTable(doc, {
      startY: finalY1 + 12,
      head: [["Jour", "Heure", "Type", "Description", "kcal", "Prot.", "Gluc.", "Lip."]],
      body: mealRows,
      headStyles: { fillColor: [15, 118, 110], textColor: white, fontSize: 7 },
      bodyStyles: { fontSize: 7, textColor: slate },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 13 },
        2: { cellWidth: 20 },
        3: { cellWidth: 65 },
        4: { cellWidth: 15, halign: "right" },
        5: { cellWidth: 13, halign: "right" },
        6: { cellWidth: 13, halign: "right" },
        7: { cellWidth: 13, halign: "right" },
      },
      alternateRowStyles: { fillColor: lightGray },
      margin: { left: 14, right: 14 },
    });
  }

  // ── Workouts table ────────────────────────────────────────
  const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  if (data.workouts.length > 0) {
    const needsNewPage = finalY2 > 240;
    if (needsNewPage) doc.addPage();
    const woY = needsNewPage ? 15 : finalY2 + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.text("Séances d'entraînement", 14, woY);

    const woRows = data.workouts
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) => {
        const dayIdx = weekDates.indexOf(w.date);
        return [
          dayIdx >= 0 ? DAY_NAMES[dayIdx] : "",
          w.type.charAt(0).toUpperCase() + w.type.slice(1),
          `${w.duration} min`,
          w.exercises.slice(0, 4).join(", ") + (w.exercises.length > 4 ? "…" : ""),
          w.caloriesBurned ? `${w.caloriesBurned} kcal` : "—",
          w.notes.slice(0, 40),
        ];
      });

    autoTable(doc, {
      startY: woY + 4,
      head: [["Jour", "Type", "Durée", "Exercices", "Brûlées", "Notes"]],
      body: woRows,
      headStyles: { fillColor: teal, textColor: white, fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: slate },
      alternateRowStyles: { fillColor: lightGray },
      margin: { left: 14, right: 14 },
    });
  }

  // ── Footer ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Journal de Sèche — Semaine ${data.weekNumber} — généré le ${new Date().toLocaleDateString("fr-FR")}`,
      pageW / 2,
      290,
      { align: "center" }
    );
    if (pageCount > 1) doc.text(`${p}/${pageCount}`, pageW - 14, 290, { align: "right" });
  }

  const filename = `rapport-semaine-${data.weekNumber}-${data.startDate}.pdf`;
  doc.save(filename);
}
