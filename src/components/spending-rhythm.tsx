"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const AVAILABLE_YEARS = [2023, 2024, 2025, 2026];

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

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  amount: number;
}

interface CellData {
  date: Date;
  key: string;
  amount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export default function SpendingRhythm() {
  const { user } = useUser();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, date: "", amount: 0,
  });
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/analytics?userId=${user.id}&period=yearly&year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        setSpending(data.dailySpending || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, user]);

  const daysInYear = getDaysInYear(year);
  const jan1 = new Date(year, 0, 1);
  const firstDayOffset = jan1.getDay();

  const maxSpending = Math.max(...Object.values(spending), 1);

  const cells: CellData[] = [];
  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(year, 0, 1 + i);
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

  const monthMarkers: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIdx) => {
    for (const cell of week) {
      if (cell && cell.date.getMonth() !== lastMonth) {
        lastMonth = cell.date.getMonth();
        monthMarkers.push({ label: MONTH_NAMES[lastMonth], weekIndex: weekIdx });
      }
    }
  });

  const activeDays = Object.keys(spending).filter((k) => spending[k] > 0).length;
  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);

  const handleMouseEnter = (e: React.MouseEvent, date: Date, amount: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = gridRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      visible: true,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
      date: date.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }),
      amount,
    });
  };

  return (
    <div className="bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-signifier text-xl text-ink-black">Spending Rhythm</h2>
          <p className="text-xs text-ash-gray mt-1">
            {activeDays} active {activeDays === 1 ? "day" : "days"} this year
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-3 py-1.5 text-sm font-medium"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative overflow-x-auto" ref={gridRef}>
          <div className="inline-flex gap-0 min-w-fit">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] mr-2 pt-5">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="h-[13px] flex items-center text-[10px] text-ash-gray leading-none">
                  {label}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex flex-col">
              {/* Month labels row */}
              <div className="flex h-5 relative">
                {monthMarkers.map((m, i) => (
                  <div
                    key={i}
                    className="absolute text-[10px] text-ash-gray leading-none"
                    style={{ left: `${m.weekIndex * 16}px` }}
                  >
                    {m.label}
                  </div>
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
                          className={`w-[13px] h-[13px] rounded-[3px] cursor-pointer transition-transform hover:scale-125 hover:ring-1 hover:ring-forest/30 ${INTENSITY_STYLES[cell.intensity]}`}
                          onMouseEnter={(e) => handleMouseEnter(e, cell.date, cell.amount)}
                          onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                        />
                      ) : (
                        <div key={dayIdx} className="w-[13px] h-[13px]" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tooltip */}
          {tooltip.visible && (
            <div
              className="absolute z-50 pointer-events-none bg-ink-black text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-elevated whitespace-nowrap"
              style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
            >
              <div className="font-medium">{formatCurrency(tooltip.amount)}</div>
              <div className="text-white/60">{tooltip.date}</div>
            </div>
          )}
        </div>
      )}

      {/* Legend + Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#ececec]">
        <div className="flex items-center gap-1.5 text-[10px] text-ash-gray">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`w-[13px] h-[13px] rounded-[3px] ${INTENSITY_STYLES[level]}`} />
          ))}
          <span>More</span>
        </div>
        <div className="text-[11px] text-ash-gray">
          Total: <span className="font-mono font-medium text-ink-black">{formatCurrency(totalSpent)}</span>
        </div>
      </div>
    </div>
  );
}
