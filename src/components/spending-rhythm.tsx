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

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOffset = firstDay.getDay();
  const maxSpending = Math.max(...Object.values(spending), 1);

  const totalWeeks = Math.ceil((firstDayOffset + daysInMonth) / 7);

  const cells: ({ date: Date; amount: number; intensity: 0 | 1 | 2 | 3 | 4 } | null)[] = [];
  let dayCounter = 1;
  for (let i = 0; i < totalWeeks * 7; i++) {
    if (i < firstDayOffset || dayCounter > daysInMonth) {
      cells.push(null);
    } else {
      const d = new Date(year, month - 1, dayCounter);
      const amount = spending[dateKey(d)] || 0;
      cells.push({ date: d, amount, intensity: getIntensity(amount, maxSpending) });
      dayCounter++;
    }
  }

  const activeDays = cells.filter((c) => c && c.amount > 0).length;
  const totalSpent = cells.reduce((s, c) => s + (c?.amount || 0), 0);

  return (
    <div className="bg-paper-white border border-[#ececec] p-4 sm:p-5 rounded-cards shadow-subtle flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-signifier text-lg text-ink-black">Spending Intensity</h2>
          <p className="text-[11px] text-ash-gray mt-0.5">
            {activeDays} active {activeDays === 1 ? "day" : "days"} &middot; {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-mist-gray text-ash-gray hover:text-ink-black transition-colors text-sm">‹</button>
          <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-mist-gray text-ash-gray hover:text-ink-black transition-colors text-sm">›</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 min-h-[100px]">
          <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Day labels */}
          <div className="grid grid-cols-7 gap-[5px] mb-[5px]">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[9px] text-ash-gray font-medium leading-none h-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-[5px] flex-1">
            {cells.map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  className={`w-full rounded-[3px] cursor-pointer transition-all hover:ring-2 hover:ring-forest/40 hover:scale-110 ${CELL_COLORS[cell.intensity]}`}
                  style={{ aspectRatio: "1" }}
                  title={`${cell.date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}: ${cell.amount > 0 ? "₦" + cell.amount.toLocaleString() : "No spending"}`}
                />
              ) : (
                <div key={i} style={{ aspectRatio: "1" }} />
              )
            )}
          </div>

          {/* Summary + Legend */}
          <div className="mt-3 pt-3 border-t border-[#ececec] space-y-2">
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
        </>
      )}
    </div>
  );
}
