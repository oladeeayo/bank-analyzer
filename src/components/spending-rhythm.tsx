"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export default function SpendingRhythm() {
  const { user } = useUser();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/analytics?userId=${user.id}&period=monthly&year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => {
        setSpending(data.dailySpending || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month, user]);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOffset = firstDay.getDay();
  const maxSpending = Math.max(...Object.values(spending), 1);

  const totalWeeks = Math.ceil((firstDayOffset + daysInMonth) / 7);

  const grid: ({ date: Date; key: string; amount: number; intensity: 0 | 1 | 2 | 3 | 4 } | null)[][] = [];
  let dayCounter = 1;
  for (let week = 0; week < totalWeeks; week++) {
    const row: typeof grid[0] = [];
    for (let dow = 0; dow < 7; dow++) {
      const cellIndex = week * 7 + dow;
      if (cellIndex < firstDayOffset || dayCounter > daysInMonth) {
        row.push(null);
      } else {
        const d = new Date(year, month - 1, dayCounter);
        const key = dateKey(d);
        const amount = spending[key] || 0;
        row.push({ date: d, key, amount, intensity: getIntensity(amount, maxSpending) });
        dayCounter++;
      }
    }
    grid.push(row);
  }

  const activeDays = grid.flat().filter((c) => c && c.amount > 0).length;
  const totalSpent = grid.flat().reduce((s, c) => s + (c?.amount || 0), 0);

  return (
    <div className="bg-paper-white border border-[#ececec] p-4 sm:p-5 rounded-cards shadow-subtle flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-signifier text-lg text-ink-black">Spending Intensity</h2>
          <p className="text-[11px] text-ash-gray mt-0.5">
            {activeDays} active {activeDays === 1 ? "day" : "days"} &middot; {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => month === 1 ? (setMonth(12), setYear(year - 1)) : setMonth(month - 1)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-mist-gray text-ash-gray hover:text-ink-black transition-colors text-xs"
          >
            ‹
          </button>
          <button
            onClick={() => month === 12 ? (setMonth(1), setYear(year + 1)) : setMonth(month + 1)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-mist-gray text-ash-gray hover:text-ink-black transition-colors text-xs"
          >
            ›
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 min-h-[80px]">
          <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          {/* Day-of-week column headers */}
          <div className="grid grid-cols-7 gap-[5px] mb-1.5">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[9px] text-ash-gray font-medium leading-none">
                {d[0]}
              </div>
            ))}
          </div>

          {/* Calendar grid — 7 columns (days), rows = weeks */}
          <div className="grid grid-cols-7 gap-[5px]">
            {grid.flat().map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-[3px] cursor-pointer transition-all hover:ring-2 hover:ring-forest/40 hover:scale-110 ${CELL_COLORS[cell.intensity]}`}
                  title={`${cell.date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}: ${cell.amount > 0 ? "₦" + cell.amount.toLocaleString() : "No spending"}`}
                />
              ) : (
                <div key={i} />
              )
            )}
          </div>

          {/* Summary + Legend */}
          <div className="mt-4 pt-3 border-t border-[#ececec] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ash-gray">Total spent</span>
              <span className="text-[12px] font-mono font-medium text-ink-black">₦{totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-ash-gray">
              <span>Less</span>
              {CELL_COLORS.map((color, i) => (
                <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${color}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
