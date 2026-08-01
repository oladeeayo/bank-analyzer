"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  XMarkIcon,
  ClockIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";

interface RecurringPattern {
  merchantId: string | null;
  description: string;
  normalizedDescription: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  avgAmount: number;
  transactionCount: number;
  lastSeenDate: string;
  nextExpectedDate: string | null;
  confidence: number;
  type: string;
  category: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  description: string;
  normalizedDescription: string | null;
  merchant: { displayName: string; icon: string } | null;
  category: { name: string; icon: string } | null;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  expectedIncome: number;
  expectedExpenses: number;
  actualIncome: number;
  actualExpenses: number;
  recurringItems: RecurringPattern[];
  actualTransactions: Transaction[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function generatePatternDates(
  pattern: RecurringPattern,
  year: number,
  month: number
): Date[] {
  const dates: Date[] = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const lastSeen = new Date(pattern.lastSeenDate);
  const nextExpected = pattern.nextExpectedDate ? new Date(pattern.nextExpectedDate) : null;

  const refDate = nextExpected && nextExpected > lastSeen ? nextExpected : lastSeen;

  switch (pattern.frequency) {
    case "daily": {
      const start = new Date(Math.max(refDate.getTime(), monthStart.getTime()));
      for (let d = new Date(start); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
      break;
    }
    case "weekly": {
      let d = new Date(refDate);
      d.setDate(d.getDate() + 7);
      while (d <= monthEnd) {
        if (d >= monthStart) dates.push(new Date(d));
        d.setDate(d.getDate() + 7);
      }
      break;
    }
    case "biweekly": {
      let d = new Date(refDate);
      d.setDate(d.getDate() + 14);
      while (d <= monthEnd) {
        if (d >= monthStart) dates.push(new Date(d));
        d.setDate(d.getDate() + 14);
      }
      break;
    }
    case "monthly": {
      let d = new Date(refDate);
      d.setMonth(d.getMonth() + 1);
      while (d <= monthEnd) {
        if (d >= monthStart) dates.push(new Date(d));
        d.setMonth(d.getMonth() + 1);
      }
      break;
    }
    case "quarterly": {
      let d = new Date(refDate);
      d.setMonth(d.getMonth() + 3);
      while (d <= monthEnd) {
        if (d >= monthStart) dates.push(new Date(d));
        d.setMonth(d.getMonth() + 3);
      }
      break;
    }
    case "yearly": {
      let d = new Date(refDate);
      d.setFullYear(d.getFullYear() + 1);
      while (d <= monthEnd) {
        if (d >= monthStart) dates.push(new Date(d));
        d.setFullYear(d.getFullYear() + 1);
      }
      break;
    }
  }

  return dates;
}

export default function CashFlowCalendarPage() {
  const { user, loading: userLoading } = useUser();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [actualTransactions, setActualTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const fetchCalendarData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      const startDate = monthStart.toISOString().split("T")[0];
      const endDate = monthEnd.toISOString().split("T")[0];

      const [recurringRes, transactionsRes] = await Promise.all([
        fetch(`/api/recurring?userId=${user.id}`),
        fetch(`/api/transactions?userId=${user.id}&startDate=${startDate}&endDate=${endDate}&limit=500`),
      ]);

      if (recurringRes.ok) {
        const data = await recurringRes.json();
        setRecurringPatterns(data.patterns || []);
      }
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setActualTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, currentYear]);

  useEffect(() => {
    if (user) fetchCalendarData();
  }, [user, fetchCalendarData]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentYear;
    const month = currentMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    const todayKey = toKey(today);

    const days: CalendarDay[] = [];

    const prevMonthDays = getDaysInMonth(year, month === 1 ? 12 : month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 1 ? 12 : month - 1;
      const y = month === 1 ? year - 1 : year;
      const date = new Date(y, m - 1, d);
      days.push({
        date,
        day: d,
        isCurrentMonth: false,
        isToday: false,
        expectedIncome: 0,
        expectedExpenses: 0,
        actualIncome: 0,
        actualExpenses: 0,
        recurringItems: [],
        actualTransactions: [],
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const key = toKey(date);

      const recurringItems: RecurringPattern[] = [];
      let expectedIncome = 0;
      let expectedExpenses = 0;

      for (const pattern of recurringPatterns) {
        const dates = generatePatternDates(pattern, year, month);
        const match = dates.some((pd) => toKey(pd) === key);
        if (match) {
          recurringItems.push(pattern);
          if (pattern.type === "credit") {
            expectedIncome += pattern.avgAmount;
          } else {
            expectedExpenses += pattern.avgAmount;
          }
        }
      }

      const dayTransactions = actualTransactions.filter(
        (tx) => toKey(new Date(tx.date)) === key
      );
      const actualIncome = dayTransactions
        .filter((tx) => tx.type === "credit")
        .reduce((s, tx) => s + tx.amount, 0);
      const actualExpenses = dayTransactions
        .filter((tx) => tx.type === "debit")
        .reduce((s, tx) => s + tx.amount, 0);

      days.push({
        date,
        day: d,
        isCurrentMonth: true,
        isToday: key === todayKey,
        expectedIncome,
        expectedExpenses,
        actualIncome,
        actualExpenses,
        recurringItems,
        actualTransactions: dayTransactions,
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 12 ? 1 : month + 1;
      const y = month === 12 ? year + 1 : year;
      const date = new Date(y, m - 1, d);
      days.push({
        date,
        day: d,
        isCurrentMonth: false,
        isToday: false,
        expectedIncome: 0,
        expectedExpenses: 0,
        actualIncome: 0,
        actualExpenses: 0,
        recurringItems: [],
        actualTransactions: [],
      });
    }

    return days;
  }, [currentMonth, currentYear, recurringPatterns, actualTransactions]);

  const monthlyTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const day of calendarDays) {
      if (day.isCurrentMonth) {
        totalIncome += day.expectedIncome;
        totalExpenses += day.expectedExpenses;
      }
    }
    return { totalIncome, totalExpenses };
  }, [calendarDays]);

  const navigateMonth = (dir: number) => {
    setSelectedDay(null);
    if (currentMonth === 1 && dir === -1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else if (currentMonth === 12 && dir === 1) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + dir);
    }
  };

  const currentMonthDays = calendarDays.filter((d) => d.isCurrentMonth);
  const incomeBarPct =
    monthlyTotals.totalIncome + monthlyTotals.totalExpenses > 0
      ? (monthlyTotals.totalIncome / (monthlyTotals.totalIncome + monthlyTotals.totalExpenses)) * 100
      : 50;

  const getDayBarColor = (day: CalendarDay) => {
    const hasIncome = day.expectedIncome > 0;
    const hasExpenses = day.expectedExpenses > 0;
    const hasActualIncome = day.actualIncome > 0;
    const hasActualExpenses = day.actualExpenses > 0;

    if (!hasIncome && !hasExpenses && !hasActualIncome && !hasActualExpenses) return null;
    if (hasIncome && hasExpenses) return "split";
    if (hasIncome || hasActualIncome) return "income";
    return "expense";
  };

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ash-gray">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="h-6 w-6 text-forest" />
          <h1 className="font-signifier text-[28px] text-ink-black">Cash Flow Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg bg-paper-white border border-[#ececec] hover:bg-mist-gray transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4 text-ink-black" />
          </button>
          <span className="text-sm font-medium text-ink-black min-w-[140px] text-center">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg bg-paper-white border border-[#ececec] hover:bg-mist-gray transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4 text-ink-black" />
          </button>
        </div>
      </div>

      {/* Monthly Overview Bar */}
      <Card className="bg-paper-white border-[#ececec]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ArrowUpRightIcon className="h-4 w-4 text-forest" />
              <span className="text-sm text-ash-gray">Expected Income</span>
              <span className="text-sm font-mono font-medium text-forest">
                {formatCurrency(monthlyTotals.totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownRightIcon className="h-4 w-4 text-error" />
              <span className="text-sm text-ash-gray">Expected Expenses</span>
              <span className="text-sm font-mono font-medium text-error">
                {formatCurrency(monthlyTotals.totalExpenses)}
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-mist-gray rounded-full overflow-hidden flex">
            <div
              className="h-full bg-forest/80 rounded-l-full transition-all duration-500"
              style={{ width: `${incomeBarPct}%` }}
            />
            <div
              className="h-full bg-lime-bright rounded-r-full transition-all duration-500"
              style={{ width: `${100 - incomeBarPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-ash-gray">
              Net:{" "}
              <span
                className={`font-mono font-medium ${
                  monthlyTotals.totalIncome - monthlyTotals.totalExpenses >= 0
                    ? "text-forest"
                    : "text-error"
                }`}
              >
                {formatCurrency(monthlyTotals.totalIncome - monthlyTotals.totalExpenses)}
              </span>
            </span>
            <span className="text-[10px] text-ash-gray">
              {Math.round(incomeBarPct)}% income / {Math.round(100 - incomeBarPct)}% expenses
            </span>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-mist-gray rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Calendar Grid */}
          <div className="hidden md:block">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((day) => (
                <div
                  key={day}
                  className="text-center text-[11px] font-medium text-ash-gray py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const barColor = getDayBarColor(day);
                const hasActivity = barColor !== null;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`relative h-20 sm:h-24 p-1.5 rounded-lg border transition-all text-left hover:shadow-md ${
                      day.isToday
                        ? "border-forest ring-1 ring-forest"
                        : day.isCurrentMonth
                          ? "border-[#ececec] hover:border-forest/40"
                          : "border-transparent bg-mist-gray/30"
                    } ${selectedDay?.date.getTime() === day.date.getTime() ? "ring-2 ring-forest/60" : ""}`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        day.isToday
                          ? "bg-forest text-white rounded-full w-5 h-5 flex items-center justify-center"
                          : day.isCurrentMonth
                            ? "text-ink-black"
                            : "text-ash-gray/50"
                      }`}
                    >
                      {day.day}
                    </span>

                    {hasActivity && day.isCurrentMonth && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        {barColor === "split" ? (
                          <div className="flex gap-0.5 h-1.5">
                            <div className="flex-1 bg-forest/80 rounded-full" />
                            <div className="flex-1 bg-lime-bright rounded-full" />
                          </div>
                        ) : barColor === "income" ? (
                          <div className="h-1.5 bg-forest/80 rounded-full" />
                        ) : (
                          <div className="h-1.5 bg-lime-bright rounded-full" />
                        )}
                      </div>
                    )}

                    {day.recurringItems.length > 0 && day.isCurrentMonth && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-forest rounded-full" />
                    )}
                    {day.actualTransactions.length > 0 && day.isCurrentMonth && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-lime-vibrant rounded-full" style={{ left: day.recurringItems.length > 0 ? "auto" : undefined, right: "4px", marginLeft: day.recurringItems.length > 0 ? "3px" : undefined }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile List View */}
          <div className="md:hidden space-y-2">
            {currentMonthDays.map((day, i) => {
              const hasActivity =
                day.expectedIncome > 0 ||
                day.expectedExpenses > 0 ||
                day.actualTransactions.length > 0;
              if (!hasActivity) return null;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    day.isToday
                      ? "border-forest bg-forest/5"
                      : "border-[#ececec] hover:border-forest/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          day.isToday ? "text-forest" : "text-ink-black"
                        }`}
                      >
                        {MONTH_NAMES[currentMonth - 1].slice(0, 3)} {day.day}
                      </span>
                      {day.isToday && (
                        <span className="text-[9px] bg-forest text-white px-1.5 py-0.5 rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      {day.expectedIncome > 0 && (
                        <span className="text-forest">
                          +{formatCurrency(day.expectedIncome)}
                        </span>
                      )}
                      {day.expectedExpenses > 0 && (
                        <span className="text-error">
                          -{formatCurrency(day.expectedExpenses)}
                        </span>
                      )}
                    </div>
                  </div>
                  {day.recurringItems.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {day.recurringItems.slice(0, 3).map((r, j) => (
                        <span
                          key={j}
                          className="text-[10px] bg-mist-gray text-ash-gray px-1.5 py-0.5 rounded"
                        >
                          {r.normalizedDescription}
                        </span>
                      ))}
                      {day.recurringItems.length > 3 && (
                        <span className="text-[10px] text-ash-gray">
                          +{day.recurringItems.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
            {currentMonthDays.every(
              (d) =>
                d.expectedIncome === 0 &&
                d.expectedExpenses === 0 &&
                d.actualTransactions.length === 0
            ) && (
              <div className="text-center py-8 text-ash-gray text-sm">
                No cash flow activity this month
              </div>
            )}
          </div>
        </>
      )}

      {/* Day Detail Panel */}
      {selectedDay && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up md:static md:animate-none">
          <div className="md:hidden fixed inset-0 bg-black/20" onClick={() => setSelectedDay(null)} />
          <div className="relative bg-paper-white border-t border-[#ececec] rounded-t-2xl md:rounded-cards md:border md:shadow-lg max-h-[70vh] md:max-h-none overflow-y-auto">
            <div className="sticky top-0 bg-paper-white border-b border-[#ececec] p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-semibold text-ink-black">
                  {MONTH_NAMES[selectedDay.date.getMonth()]} {selectedDay.day}, {selectedDay.date.getFullYear()}
                </h3>
                {selectedDay.isToday && (
                  <span className="text-[10px] text-forest font-medium">Today</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-ash-gray uppercase">Net Flow</p>
                  <p
                    className={`text-sm font-mono font-medium ${
                      (selectedDay.expectedIncome + selectedDay.actualIncome) -
                        (selectedDay.expectedExpenses + selectedDay.actualExpenses) >= 0
                        ? "text-forest"
                        : "text-error"
                    }`}
                  >
                    {formatCurrency(
                      (selectedDay.expectedIncome + selectedDay.actualIncome) -
                        (selectedDay.expectedExpenses + selectedDay.actualExpenses)
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg hover:bg-mist-gray transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 text-ash-gray" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Expected (Recurring) */}
              {selectedDay.recurringItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-forest" />
                    <h4 className="text-xs font-semibold text-ink-black uppercase tracking-wider">
                      Expected Transactions
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedDay.recurringItems.map((pattern, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-mist-gray/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              pattern.type === "credit" ? "bg-forest" : "bg-lime-bright"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-ink-black truncate">
                              {pattern.normalizedDescription}
                            </p>
                            <p className="text-[10px] text-ash-gray">
                              {pattern.frequency} · {pattern.category}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-mono font-medium flex-shrink-0 ml-2 ${
                            pattern.type === "credit" ? "text-forest" : "text-error"
                          }`}
                        >
                          {pattern.type === "credit" ? "+" : "-"}
                          {formatCurrency(pattern.avgAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actual Transactions */}
              {selectedDay.actualTransactions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BanknotesIcon className="h-4 w-4 text-lime-vibrant" />
                    <h4 className="text-xs font-semibold text-ink-black uppercase tracking-wider">
                      Actual Transactions
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedDay.actualTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 bg-mist-gray/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              tx.type === "credit" ? "bg-forest" : "bg-lime-bright"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-ink-black truncate">
                              {tx.normalizedDescription || tx.description}
                            </p>
                            <p className="text-[10px] text-ash-gray">
                              {tx.merchant?.displayName || "Unknown"} · {tx.category?.icon || ""}{" "}
                              {tx.category?.name || ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-mono font-medium flex-shrink-0 ml-2 ${
                            tx.type === "credit" ? "text-forest" : "text-error"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {selectedDay.recurringItems.length === 0 &&
                selectedDay.actualTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarDaysIcon className="h-10 w-10 text-ash-gray/30 mx-auto mb-2" />
                    <p className="text-sm text-ash-gray">No transactions for this day</p>
                  </div>
                )}

              {/* Day Summary */}
              {(selectedDay.expectedIncome > 0 ||
                selectedDay.expectedExpenses > 0 ||
                selectedDay.actualIncome > 0 ||
                selectedDay.actualExpenses > 0) && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ececec]">
                  <div className="p-2 bg-forest/5 rounded-lg">
                    <p className="text-[10px] text-ash-gray uppercase">Expected In</p>
                    <p className="text-sm font-mono font-medium text-forest">
                      {formatCurrency(selectedDay.expectedIncome)}
                    </p>
                  </div>
                  <div className="p-2 bg-error/5 rounded-lg">
                    <p className="text-[10px] text-ash-gray uppercase">Expected Out</p>
                    <p className="text-sm font-mono font-medium text-error">
                      {formatCurrency(selectedDay.expectedExpenses)}
                    </p>
                  </div>
                  <div className="p-2 bg-forest/5 rounded-lg">
                    <p className="text-[10px] text-ash-gray uppercase">Actual In</p>
                    <p className="text-sm font-mono font-medium text-forest">
                      {formatCurrency(selectedDay.actualIncome)}
                    </p>
                  </div>
                  <div className="p-2 bg-error/5 rounded-lg">
                    <p className="text-[10px] text-ash-gray uppercase">Actual Out</p>
                    <p className="text-sm font-mono font-medium text-error">
                      {formatCurrency(selectedDay.actualExpenses)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-ash-gray">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest" />
          Expected Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-bright" />
          Expected Expenses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-lime-vibrant" />
          Actual Transaction
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-2 rounded-sm border border-forest" />
          Today
        </span>
      </div>
    </div>
  );
}
