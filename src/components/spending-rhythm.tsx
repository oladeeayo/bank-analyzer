"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks";

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDaysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getIntensity(amount: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (amount <= 0 || max <= 0) return 0;
  const ratio = amount / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const CELL_COLORS = [
  "bg-[#ebedf0]",
  "bg-[#9be9a8]",
  "bg-[#40c463]",
  "bg-[#30a14e]",
  "bg-[#216e39]",
];

interface CellData {
  date: Date;
  amount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export default function SpendingRhythm() {
  const { user } = useUser();
  const currentYear = new Date().getFullYear();
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/analytics?userId=${user.id}&period=yearly&year=${currentYear}`)
      .then((res) => res.json())
      .then((data) => {
        setSpending(data.dailySpending || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentYear, user]);

  const daysInYear = getDaysInYear(currentYear);
  const jan1 = new Date(currentYear, 0, 1);
  const firstDayOffset = jan1.getDay();
  const maxSpending = Math.max(...Object.values(spending), 1);

  const cells: CellData[] = [];
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(currentYear, 0, 1 + i);
    const amount = spending[dateKey(d)] || 0;
    cells.push({ date: d, amount, intensity: getIntensity(amount, maxSpending) });
  }

  const weeks: (CellData | null)[][] = [];
  let currentWeek: (CellData | null)[] = new Array(firstDayOffset).fill(null);
  for (const cell of cells) {
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthPositions: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIdx) => {
    for (const cell of week) {
      if (cell && cell.date.getMonth() !== lastMonth) {
        lastMonth = cell.date.getMonth();
        monthPositions.push({ label: MONTH_ABBRS[lastMonth], weekIdx });
      }
    }
  });

  const activeDays = cells.filter((c) => c.amount > 0).length;
  const totalSpent = cells.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="bg-paper-white border border-[#ececec] p-4 sm:p-5 rounded-cards shadow-subtle flex flex-col h-full">
      <div className="mb-3">
        <h2 className="font-signifier text-lg text-ink-black">Spending Intensity</h2>
        <p className="text-[11px] text-ash-gray mt-0.5">
          {activeDays} active {activeDays === 1 ? "day" : "days"} &middot; {currentYear}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 min-h-[100px]">
          <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Month labels */}
          <div className="flex mb-1 overflow-hidden">
            {monthPositions.map((m, i) => {
              const nextWeekIdx = i < monthPositions.length - 1 ? monthPositions[i + 1].weekIdx : weeks.length;
              const span = nextWeekIdx - m.weekIdx;
              return (
                <div key={i} className="text-[9px] text-ash-gray leading-none shrink-0" style={{ width: `${span * 14}px` }}>
                  {m.label}
                </div>
              );
            })}
          </div>

          {/* Heatmap grid: rows=days (7), cols=weeks */}
          <div className="flex-1 flex items-start">
            <div className="w-full">
              {/* Day labels */}
              <div className="flex gap-[3px] mb-[3px]">
                {["", "M", "", "W", "", "F", ""].map((d, i) => (
                  <div key={i} className="w-[10px] h-[10px] text-[8px] text-ash-gray leading-[10px] text-center">{d}</div>
                ))}
              </div>

              {/* Weeks grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((cell, dayIdx) =>
                      cell ? (
                        <div
                          key={dayIdx}
                          className={`w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-all hover:ring-2 hover:ring-forest/40 hover:scale-150 ${CELL_COLORS[cell.intensity]}`}
                          title={`${cell.date.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}: ${cell.amount > 0 ? "₦" + cell.amount.toLocaleString() : "No spending"}`}
                        />
                      ) : (
                        <div key={dayIdx} className="w-[10px] h-[10px]" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#ececec]">
            <div className="flex items-center gap-1 text-[9px] text-ash-gray">
              <span>Less</span>
              {CELL_COLORS.map((color, i) => (
                <div key={i} className={`w-[10px] h-[10px] rounded-[2px] ${color}`} />
              ))}
              <span>More</span>
            </div>
            <div className="text-[10px] text-ash-gray">
              Total: <span className="font-mono font-medium text-ink-black">₦{totalSpent.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
