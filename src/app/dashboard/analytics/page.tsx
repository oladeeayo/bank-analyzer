"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsData {
  period: string;
  periodLabel: string;
  summary: {
    currentBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    savingsRate: number;
    averageDailySpend: number;
    biggestExpense: { amount: number; description: string; merchant: string } | null;
  };
  categoryBreakdown: { name: string; icon: string; color: string; amount: number; count: number }[];
  merchantRanking: { name: string; icon: string; amount: number; count: number }[];
  bankComparison: { name: string; income: number; expenses: number }[];
  dailySpending: Record<string, number>;
  dailyCredits: Record<string, number>;
  weeklySpending: Record<number, number>;
  monthlyChart: { month: number; year: number; credits: number; debits: number; net: number }[];
  transactionCount: number;
  daysInPeriod: number;
}

const DONUT_COLORS = ["#003527", "#416900", "#8BC34A", "#C5E1A5", "#DCF5B0", "#ACF847", "#E8F5E9", "#66BB6A"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const availableYears = [2023, 2024, 2025, 2026, 2027];

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [period, month, year, quarter, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/analytics?userId=${user.id}&period=${period}`;
      if (period === "monthly") url += `&month=${month}&year=${year}`;
      else if (period === "quarterly") url += `&quarter=${quarter}&year=${year}`;
      else if (period === "yearly") url += `&year=${year}`;
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-ash-gray">Loading analytics...</div>;
  if (!data) return <div className="text-center py-16 text-ash-gray">No data available. Upload statements to see analytics.</div>;

  const { summary, categoryBreakdown, merchantRanking, dailySpending, dailyCredits, monthlyChart } = data;

  const sortedDays = Object.keys(dailySpending).sort();
  const maxDailySpend = sortedDays.length > 0 ? Math.max(...sortedDays.map(d => dailySpending[d])) : 0;
  const maxDailyCredit = Object.keys(dailyCredits).length > 0 ? Math.max(...Object.values(dailyCredits)) : 0;
  const maxDailyValue = Math.max(maxDailySpend, maxDailyCredit, 1);

  const totalForDonut = categoryBreakdown.reduce((s, c) => s + c.amount, 0);
  let cumulativePercent = 0;
  const donutSegments = categoryBreakdown.map((cat, i) => {
    const percent = totalForDonut > 0 ? (cat.amount / totalForDonut) * 100 : 0;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { ...cat, percent, start, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  const maxMonthly = monthlyChart.length > 0 ? Math.max(...monthlyChart.map(m => Math.max(m.credits, m.debits))) : 0;

  const insights = [
    { title: "Highest Spending Day", value: sortedDays.length > 0 ? formatCurrency(Math.max(...sortedDays.map(d => dailySpending[d]))) : "—", detail: `${sortedDays.length} days with spending`, color: "text-forest" },
    { title: "Most Visited Merchant", value: merchantRanking[0]?.name || "—", detail: `${merchantRanking[0]?.count || 0} visits`, color: "text-forest" },
    { title: "Largest Transaction", value: summary.biggestExpense ? formatCurrency(summary.biggestExpense.amount) : "—", detail: summary.biggestExpense?.description || "No data", color: "text-error" },
    { title: "Savings Rate", value: `${summary.savingsRate.toFixed(1)}%`, detail: summary.savingsRate > 20 ? "Great job!" : "Consider saving more", color: summary.savingsRate > 20 ? "text-forest" : "text-amber-700" },
  ];

  const periodOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Spending Analytics</h1>
          <p className="text-sm text-ash-gray">{data.periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {periodOptions.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-forest text-lime-vibrant"
                  : "bg-paper-white border border-[#ececec] text-ink-black hover:bg-mist-gray"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period !== "all" && (
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-4 py-2 text-sm">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {period === "monthly" && (
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-4 py-2 text-sm">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{MONTH_NAMES[i]}</option>
              ))}
            </select>
          )}
          {period === "quarterly" && (
            <select value={quarter} onChange={(e) => setQuarter(parseInt(e.target.value))}
              className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-4 py-2 text-sm">
              <option value={1}>Q1 (Jan–Mar)</option>
              <option value={2}>Q2 (Apr–Jun)</option>
              <option value={3}>Q3 (Jul–Sep)</option>
              <option value={4}>Q4 (Oct–Dec)</option>
            </select>
          )}
          <span className="text-xs text-ash-gray ml-2">{data.transactionCount} transactions</span>
        </div>
      )}

      {period === "all" && (
        <div className="text-xs text-ash-gray">{data.transactionCount} transactions across all time</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-lime-vibrant/10 border border-lime-vibrant/30 rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-forest/60 font-medium">Net Cash Flow</p>
          <div className="flex items-center gap-2 mt-1">
            {summary.netCashFlow >= 0 ? <TrendingUp className="h-5 w-5 text-forest" /> : <TrendingDown className="h-5 w-5 text-error" />}
            <span className={`text-2xl font-mono font-medium ${summary.netCashFlow >= 0 ? "text-forest" : "text-error"}`}>{formatCurrency(summary.netCashFlow)}</span>
          </div>
          <p className="text-[10px] text-ash-gray mt-1">{data.periodLabel}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium">Total Income</p>
          <p className="text-2xl font-mono font-medium text-forest mt-1">{formatCurrency(summary.totalIncome)}</p>
          <p className="text-[10px] text-ash-gray mt-1">{data.periodLabel}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium">Total Expenses</p>
          <p className="text-2xl font-mono font-medium text-error mt-1">{formatCurrency(summary.totalExpenses)}</p>
          <p className="text-[10px] text-ash-gray mt-1">{data.periodLabel}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium">Avg Daily Spend</p>
          <p className="text-2xl font-mono font-medium text-ink-black mt-1">{formatCurrency(summary.averageDailySpend)}</p>
          <p className="text-[10px] text-ash-gray mt-1">per day</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cashflow Dual-Direction Chart */}
        <div className="lg:col-span-2 bg-paper-white border border-[#ececec] rounded-cards p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-black">
              {period === "monthly" ? "Daily Cashflow" : "Cashflow"}
            </h2>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-forest/80" /> Income</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-error/70" /> Expense</span>
            </div>
          </div>

          {monthlyChart.length > 0 && period !== "monthly" ? (
            /* Monthly dual bars for yearly/all views */
            (() => {
              const allValues = monthlyChart.flatMap(m => [m.credits, m.debits]);
              const maxVal = Math.max(...allValues, 1);
              return (
                <div className="relative">
                  {/* Zero line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-ink-black/20 z-10" />
                  <div className="flex items-center gap-3 h-64">
                    {monthlyChart.map((m, i) => {
                      const creditH = (m.credits / maxVal) * 48;
                      const debitH = (m.debits / maxVal) * 48;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center h-full relative">
                          <div className="flex-1 w-full flex flex-col justify-end items-center" />
                          {/* Income bar (above zero) */}
                          <div className="w-full flex justify-center mb-0" style={{ height: `${creditH}%` }}>
                            <div className="w-3/4 max-w-[40px] bg-forest/80 hover:bg-lime-vibrant rounded-t-sm transition-colors cursor-pointer"
                              title={`${MONTH_NAMES[m.month - 1]} ${m.year} Income: ${formatCurrency(m.credits)}`} />
                          </div>
                          {/* Expense bar (below zero) */}
                          <div className="w-full flex justify-center mt-0" style={{ height: `${debitH}%` }}>
                            <div className="w-3/4 max-w-[40px] bg-error/70 hover:bg-error/90 rounded-b-sm transition-colors cursor-pointer"
                              title={`${MONTH_NAMES[m.month - 1]} ${m.year} Expense: ${formatCurrency(m.debits)}`} />
                          </div>
                          <div className="flex-1 w-full flex flex-col justify-start items-center" />
                          <span className="text-[10px] text-ash-gray mt-2">{MONTH_NAMES[m.month - 1]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : sortedDays.length > 0 ? (
            /* Daily dual bars for monthly/quarterly views */
            (() => {
              const allValues = sortedDays.flatMap(d => [dailySpending[d] || 0, dailyCredits[d] || 0]);
              const maxVal = Math.max(...allValues, 1);
              return (
                <div className="relative">
                  {/* Zero line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-ink-black/20 z-10" />
                  <div className="flex items-end gap-px h-56">
                    {sortedDays.slice(-31).map(dateStr => {
                      const expense = dailySpending[dateStr] || 0;
                      const income = dailyCredits[dateStr] || 0;
                      const expH = (expense / maxVal) * 48;
                      const incH = (income / maxVal) * 48;
                      const dayLabel = dateStr.split("-")[2]?.replace(/^0/, "") || dateStr;
                      return (
                        <div key={dateStr} className="flex-1 flex flex-col items-center h-full min-w-0">
                          <div className="flex-1 w-full flex flex-col justify-end items-center" />
                          {/* Income bar (above zero) */}
                          <div className="w-full flex justify-center" style={{ height: `${incH}%` }}>
                            <div className="w-full max-w-[20px] bg-forest/80 hover:bg-lime-vibrant rounded-t-sm transition-colors cursor-pointer"
                              title={`${dateStr} Income: ${formatCurrency(income)}`} />
                          </div>
                          {/* Expense bar (below zero) */}
                          <div className="w-full flex justify-center" style={{ height: `${expH}%` }}>
                            <div className="w-full max-w-[20px] bg-error/70 hover:bg-error/90 rounded-b-sm transition-colors cursor-pointer"
                              title={`${dateStr} Expense: ${formatCurrency(expense)}`} />
                          </div>
                          <div className="flex-1 w-full flex flex-col justify-start items-center" />
                          <span className="text-[7px] text-ash-gray leading-none mt-1">{dayLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-48 text-ash-gray text-sm">No data for this period</div>
          )}
        </div>

        {/* Category Donut */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Spending by Category</h2>
          {totalForDonut > 0 ? (
            <>
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {donutSegments.map((seg, i) => (
                    <circle key={i} cx="18" cy="18" r="15.915" fill="transparent" stroke={seg.color} strokeWidth="3.5"
                      strokeDasharray={`${seg.percent} ${100 - seg.percent}`} strokeDashoffset={`${-seg.start}`}
                      className="transition-all duration-500 hover:opacity-80" />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-mono font-medium text-ink-black">{formatCurrency(totalForDonut)}</span>
                  <span className="text-[10px] text-ash-gray">Total Spent</span>
                </div>
              </div>
              <div className="space-y-2">
                {donutSegments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-ash-gray">{seg.icon} {seg.name}</span>
                    </div>
                    <span className="font-mono text-ink-black">{seg.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-ash-gray text-sm">No expenses categorized</div>
          )}
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((insight, i) => (
          <div key={i} className="bg-paper-white border border-[#ececec] rounded-cards p-5">
            <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium">{insight.title}</p>
            <p className={`text-lg font-mono font-medium mt-1 ${insight.color}`}>{insight.value}</p>
            <p className="text-[10px] text-ash-gray mt-1">{insight.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Merchant Ranking */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Top Merchants</h2>
          {merchantRanking.length > 0 ? (
            <div className="space-y-3">
              {merchantRanking.slice(0, 8).map((m, idx) => {
                const pct = summary.totalExpenses > 0 ? (m.amount / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3 group">
                    <span className="text-lg w-8 text-center">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-ink-black truncate">{m.name}</span>
                        <span className="font-mono text-ash-gray">{formatCurrency(m.amount)}</span>
                      </div>
                      <div className="w-full bg-mist-gray rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-forest/80 group-hover:bg-lime-vibrant transition-colors" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-ash-gray w-10 text-right">{m.count}x</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-ash-gray text-sm">No merchant data</div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Category Breakdown</h2>
          {categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => {
                const pct = summary.totalExpenses > 0 ? (cat.amount / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-lg w-8 text-center">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-ink-black">{cat.name}</span>
                        <span className="font-mono text-ash-gray">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full bg-mist-gray rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                      </div>
                    </div>
                    <span className="text-xs text-ash-gray w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-ash-gray text-sm">No category data</div>
          )}
        </div>
      </div>
    </div>
  );
}
