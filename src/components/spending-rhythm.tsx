"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
  key: string;
  amount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

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

  const cells: CellData[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(year, month - 1, 1 + i);
    const key = dateKey(d);
    const amount = spending[key] || 0;
    cells.push({ date: d, key, amount, intensity: getIntensity(amount, maxSpending) });
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

  const activeDays = cells.filter((c) => c.amount > 0).length;
  const totalSpent = cells.reduce((s, c) => s + c.amount, 0);

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
          {/* Day-of-week headers */}
          <div className="flex gap-[5px] mb-1.5 pl-0">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="w-[14px] text-center text-[9px] text-ash-gray font-medium leading-none">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[5px]">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[5px]">
                {week.map((cell, dayIdx) =>
                  cell ? (
                    <div
                      key={dayIdx}
                      className={`w-[14px] h-[14px] rounded-[3px] cursor-pointer transition-all hover:ring-2 hover:ring-forest/40 hover:scale-110 ${CELL_COLORS[cell.intensity]}`}
                      title={`${cell.date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}: ${cell.amount > 0 ? "₦" + cell.amount.toLocaleString() : "No spending"}`}
                    />
                  ) : (
                    <div key={dayIdx} className="w-[14px] h-[14px]" />
                  )
                )}
              </div>
            ))}
          </div>

          {/* Summary + Legend */}
          <div className="mt-4 pt-3 border-t border-[#ececec] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ash-gray">Total spent</span>
              <span className="text-[12px] font-mono font-medium text-ink-black">₦{totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-ash-gray">
                <span>Less</span>
                {CELL_COLORS.map((color, i) => (
                  <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${color}`} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
