"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks";

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

const INTENSITY_STYLES: Record<number, string> = {
  0: "bg-mist-gray/60",
  1: "bg-forest-light/40",
  2: "bg-forest-light/70",
  3: "bg-forest/60",
  4: "bg-forest",
};

interface CellData {
  date: Date;
  key: string;
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

  return (
    <div className="bg-paper-white border border-[#ececec] p-4 sm:p-5 rounded-cards shadow-subtle">
      <div className="mb-4">
        <h2 className="font-signifier text-lg text-ink-black">Spending Intensity</h2>
        <p className="text-[11px] text-ash-gray mt-0.5">Daily activity tracking across 12 months</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] min-w-fit">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((cell, dayIdx) =>
                  cell ? (
                    <div
                      key={dayIdx}
                      className={`w-[11px] h-[11px] rounded-[2px] ${INTENSITY_STYLES[cell.intensity]}`}
                      title={`${cell.date.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`}
                    />
                  ) : (
                    <div key={dayIdx} className="w-[11px] h-[11px]" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#ececec]">
        <div className="flex items-center gap-1 text-[10px] text-ash-gray">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`w-[11px] h-[11px] rounded-[2px] ${INTENSITY_STYLES[level]}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
