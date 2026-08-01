"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { useUser } from "@/lib/hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";

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
  monthlyChart: { month: number; year: number; credits: number; debits: number; net: number }[];
  transactionCount: number;
  daysInPeriod: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  normalizedDescription: string | null;
  amount: number;
  type: string;
  category: { name: string; icon: string } | null;
}

interface RecurringPattern {
  merchantId: string | null;
  description: string;
  normalizedDescription: string;
  frequency: string;
  avgAmount: number;
  transactionCount: number;
  lastSeenDate: string;
  nextExpectedDate: string | null;
  confidence: number;
  type?: string;
  annualCost: number;
  trend: "increasing" | "decreasing" | "stable";
  trendPercent: number;
  category: string;
  tags: string[];
  insights: string[];
}

const CHART_COLORS = ["#003527", "#416900", "#95d3ba", "#acf847", "#91db2a"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    if (user) {
      fetchDashboard();
      fetchTransactions();
      fetchRecurring();
    }
  }, [period, month, year, quarter, user]);

  if (userLoading || !user) {
    return <div role="status" aria-live="polite" className="flex items-center justify-center h-64"><div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" /><span className="text-ash-gray">Loading...</span></div></div>;
  }

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/analytics?userId=${user!.id}&period=${period}`;
      if (period === "monthly") url += `&month=${month}&year=${year}`;
      else if (period === "quarterly") url += `&quarter=${quarter}&year=${year}`;
      else if (period === "yearly") url += `&year=${year}`;
      const res = await fetch(url);
      if (res.ok) {
        setData(await res.json());
      } else {
        setError("Failed to load dashboard data. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const url = `/api/transactions?userId=${user!.id}&page=1&limit=5`;
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setTransactions(result.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const fetchRecurring = async () => {
    try {
      const res = await fetch(`/api/recurring?userId=${user!.id}`);
      if (res.ok) {
        const result = await res.json();
        setRecurring(result.patterns || []);
      }
    } catch (err) {
      console.error("Failed to fetch recurring:", err);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
          <span className="text-ash-gray">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        {error ? (
          <>
            <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationCircleIcon className="h-8 w-8 text-error" />
            </div>
            <h2 className="font-signifier text-[28px] text-ink-black mb-3">Something went wrong</h2>
            <p className="text-slate-gray mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center px-6 py-3 bg-forest text-white rounded-buttons font-medium hover:bg-forest-container transition-all"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <h2 className="font-signifier text-[36px] text-ink-black mb-4">Welcome to CONYEST</h2>
            <p className="text-slate-gray mb-8">
              Get started by adding your banks and uploading your first statement.
            </p>
            <a
              href="/dashboard/banks"
              className="inline-flex items-center px-6 py-3 bg-forest text-white rounded-buttons font-medium hover:opacity-90 transition-all"
            >
              Add Your First Bank
            </a>
          </>
        )}
      </div>
    );
  }

  const { summary, categoryBreakdown, dailySpending, dailyCredits, monthlyChart } = data;

  // Real cashflow chart data
  const cashflowChartData = (() => {
    if (period === "yearly" || period === "all") {
      return monthlyChart.map(m => ({
        name: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
        income: Math.round(m.credits),
        expense: Math.round(m.debits),
        net: Math.round(m.credits - m.debits),
      }));
    }
    // Monthly/quarterly: use daily data
    const sortedDays = Object.keys(dailySpending).sort();
    const sortedCreditDays = Object.keys(dailyCredits).sort();
    const allDays = [...new Set([...sortedDays, ...sortedCreditDays])].sort();
    return allDays.slice(-31).map(day => ({
      name: day.split("-")[2]?.replace(/^0/, "") || day,
      income: Math.round(dailyCredits[day] || 0),
      expense: Math.round(dailySpending[day] || 0),
      net: Math.round((dailyCredits[day] || 0) - (dailySpending[day] || 0)),
    }));
  })();

  const categoryPieData = categoryBreakdown.slice(0, 5).map((cat, idx) => ({
    name: cat.name,
    value: cat.amount,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  const totalPieExpenses = categoryPieData.reduce((sum, cat) => sum + cat.value, 0);

  const periodOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "all", label: "All Time" },
  ];

  return (
    <div className="space-y-8">
      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-ash-gray">{data.periodLabel}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {periodOptions.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.96] ${
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
        <div className="flex flex-wrap items-center gap-3">
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-3 sm:px-4 py-2 text-sm">
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

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Balance */}
        <div className="bg-forest p-5 sm:p-6 rounded-cards text-white relative overflow-hidden flex flex-col justify-between h-40 sm:h-44 shadow-elevated">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Current Balance</p>
              <h3 className="font-mono text-[28px] font-medium">{formatCurrency(summary.currentBalance)}</h3>
            </div>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <span className="text-lime-vibrant">💰</span>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-buttons text-[10px] font-semibold ${
              summary.netCashFlow >= 0 ? "bg-lime-vibrant text-forest" : "bg-error/80 text-white"
            }`}>
              {summary.netCashFlow >= 0 ? "+" : ""}{((summary.netCashFlow / (summary.totalIncome || 1)) * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-white/60">net cash flow</span>
          </div>
          <div className="absolute -right-4 -top-8 w-32 h-32 bg-lime-vibrant/10 rounded-full blur-3xl"></div>
        </div>

        {/* Money In */}
        <div className="bg-paper-white border border-[#ececec] p-5 sm:p-6 rounded-cards flex flex-col justify-between h-40 sm:h-44 shadow-subtle">
          <div>
            <p className="text-ash-gray text-xs mb-1">Total Income</p>
            <h3 className="font-mono text-[28px] font-medium text-forest">{formatCurrency(summary.totalIncome)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-3 w-3 text-forest" />
            <span className="text-xs text-ash-gray">{data.periodLabel}</span>
          </div>
        </div>

        {/* Money Out */}
        <div className="bg-paper-white border border-[#ececec] p-5 sm:p-6 rounded-cards flex flex-col justify-between h-40 sm:h-44 shadow-subtle">
          <div>
            <p className="text-ash-gray text-xs mb-1">Total Expenses</p>
            <h3 className="font-mono text-[28px] font-medium text-error">{formatCurrency(summary.totalExpenses)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <ArrowTrendingDownIcon className="h-3 w-3 text-error" />
            <span className="text-xs text-ash-gray">{data.periodLabel}</span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-paper-white border border-[#ececec] p-5 sm:p-6 rounded-cards flex flex-col justify-between h-40 sm:h-44 shadow-subtle">
          <div>
            <p className="text-ash-gray text-xs mb-1">Savings</p>
            <h3 className="font-mono text-[28px] font-medium text-forest">{formatCurrency(summary.totalIncome - summary.totalExpenses)}</h3>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ash-gray">Savings rate</span>
              <span className="text-xs font-semibold text-forest">{summary.savingsRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-mist-gray h-2 rounded-full overflow-hidden">
              <div className="bg-lime h-full rounded-full transition-all" style={{ width: `${Math.min(100, summary.savingsRate)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Score, Forecast & Alerts */}
      {(() => {
        // Financial Health Score calculation
        const savingsRateScore = summary.savingsRate > 20 ? 40 : summary.savingsRate >= 10 ? (summary.savingsRate / 20) * 40 : 0;
        const incomeStabilityScore = summary.totalIncome > 0 ? 30 : 0;
        const budgetAdherenceScore = 15; // no budget data available, give 50%
        const healthScore = Math.round(savingsRateScore + incomeStabilityScore + budgetAdherenceScore);

        let scoreLabel = "Needs Attention";
        let scoreColor = "text-error";
        let scoreBg = "bg-error/10";
        if (healthScore >= 80) { scoreLabel = "Excellent"; scoreColor = "text-forest"; scoreBg = "bg-forest/10"; }
        else if (healthScore >= 60) { scoreLabel = "Good"; scoreColor = "text-[#7cb342]"; scoreBg = "bg-[#7cb342]/10"; }
        else if (healthScore >= 40) { scoreLabel = "Fair"; scoreColor = "text-[#f59e0b]"; scoreBg = "bg-[#f59e0b]/10"; }

        // Spending Forecast
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const projectedSpend = summary.averageDailySpend * daysInMonth;
        const lastMonthDebits = monthlyChart.length >= 2 ? monthlyChart[monthlyChart.length - 2]?.debits : null;

        // Spending Alerts
        const alerts: { type: "warning" | "error" | "info"; message: string }[] = [];
        const dailyValues = Object.values(dailySpending);
        const avgDaily = summary.averageDailySpend;
        if (dailyValues.length > 0) {
          const maxDaily = Math.max(...dailyValues);
          if (maxDaily > avgDaily * 2 && avgDaily > 0) {
            alerts.push({ type: "warning", message: `Unusual spending spike detected — ₦${formatCurrency(Math.round(maxDaily))} in a single day (${(maxDaily / avgDaily).toFixed(1)}× your average)` });
          }
        }
        if (summary.savingsRate < 10) {
          alerts.push({ type: "error", message: `Savings rate is below 10% (${summary.savingsRate.toFixed(1)}%). Consider reducing discretionary spending.` });
        }

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Financial Health Score */}
            <div className="bg-paper-white border border-[#ececec] p-5 sm:p-6 rounded-cards shadow-subtle flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scoreBg}`}>
                  <ShieldCheckIcon className={`h-5 w-5 ${scoreColor}`} />
                </div>
                <div>
                  <h2 className="font-signifier text-xl text-ink-black">Financial Health</h2>
                  <p className="text-xs text-ash-gray mt-0.5">Score based on savings, income &amp; budget</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="#ececec" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - healthScore / 100)}`}
                      strokeLinecap="round"
                      className={scoreColor}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-mono font-semibold ${scoreColor}`}>{healthScore}</span>
                  </div>
                </div>
                <div>
                  <span className={`text-sm font-semibold ${scoreColor}`}>{scoreLabel}</span>
                  <p className="text-xs text-ash-gray mt-1 leading-relaxed">
                    Savings {summary.savingsRate.toFixed(1)}% · Income {summary.totalIncome > 0 ? "stable" : "none"}
                  </p>
                </div>
              </div>
            </div>

            {/* Spending Forecast */}
            <div className="bg-paper-white border border-[#ececec] p-5 sm:p-6 rounded-cards shadow-subtle flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-forest/10">
                  <CalendarDaysIcon className="h-5 w-5 text-forest" />
                </div>
                <div>
                  <h2 className="font-signifier text-xl text-ink-black">Spending Forecast</h2>
                  <p className="text-xs text-ash-gray mt-0.5">Projected end-of-month spend</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-ink-black leading-relaxed">
                  At your current daily spend of <span className="font-mono font-medium text-forest">{formatCurrency(Math.round(summary.averageDailySpend))}</span>,
                  you&apos;re projected to spend <span className="font-mono font-medium text-forest">{formatCurrency(Math.round(projectedSpend))}</span> this month.
                </p>
                {lastMonthDebits !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    {projectedSpend > lastMonthDebits ? (
                      <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-error" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-forest" />
                    )}
                    <span className="text-xs text-ash-gray">
                      {projectedSpend > lastMonthDebits ? "+" : ""}
                      {(((projectedSpend - lastMonthDebits) / lastMonthDebits) * 100).toFixed(1)}% vs last month
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Spending Alerts */}
            <div className="bg-paper-white border border-[#ececec] p-5 sm:p-6 rounded-cards shadow-subtle flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#f59e0b]/10">
                  <BellAlertIcon className="h-5 w-5 text-[#f59e0b]" />
                </div>
                <div>
                  <h2 className="font-signifier text-xl text-ink-black">Spending Alerts</h2>
                  <p className="text-xs text-ash-gray mt-0.5">Anomalies &amp; warnings</p>
                </div>
              </div>
              <div>
                {alerts.length > 0 ? (
                  <ul className="space-y-2.5">
                    {alerts.map((alert, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <ExclamationCircleIcon className={`h-4 w-4 mt-0.5 shrink-0 ${alert.type === "error" ? "text-error" : "text-[#f59e0b]"}`} />
                        <span className="text-xs text-ink-black leading-relaxed">{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                    <span className="text-sm text-ash-gray">All clear — no spending alerts.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Middle Section: Cashflow Chart + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-signifier text-xl text-ink-black">Cash Flow</h2>
              <p className="text-xs text-ash-gray mt-1">{period === "monthly" ? "Daily" : "Monthly"} overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-forest rounded"></div>
                <span className="text-ash-gray">Income</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-lime-bright rounded"></div>
                <span className="text-ash-gray">Expense</span>
              </div>
            </div>
          </div>

          <div className="h-64">
            {cashflowChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                    formatter={(value, name) => [formatCurrency(Number(value)), name === "income" ? "Income" : "Expense"]}
                  />
                  <ReferenceLine y={0} stroke="#ececec" />
                  <Bar dataKey="income" fill="var(--color-forest)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--color-lime-bright)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-ash-gray text-sm">No data for this period</div>
            )}
          </div>
        </div>

        {/* Category Donut */}
        <div className="bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-signifier text-xl text-ink-black">Category Split</h2>
              <p className="text-xs text-ash-gray mt-1">Expense distribution</p>
            </div>
          </div>

          {totalPieExpenses > 0 ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] uppercase tracking-widest text-ash-gray">Total</div>
                    <div className="text-lg font-mono font-medium text-ink-black">{formatCurrency(totalPieExpenses)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {categoryPieData.map((cat, idx) => {
                  const percentage = totalPieExpenses > 0 ? (cat.value / totalPieExpenses) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-sm text-ink-black">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-ash-gray">{percentage.toFixed(0)}%</span>
                        <span className="text-sm font-mono font-medium text-ink-black w-24 text-right">{formatCurrency(cat.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-ash-gray text-sm">No expenses categorized</div>
          )}
        </div>
      </div>

      {/* Bank Comparison */}
      {(() => {
        const banks = data.bankComparison || [];
        if (banks.length <= 1) {
          return (
            <div className="bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-mist-gray">
                  <BuildingOffice2Icon className="h-5 w-5 text-ash-gray" />
                </div>
                <div>
                  <h2 className="font-signifier text-xl text-ink-black">Bank Comparison</h2>
                  <p className="text-xs text-ash-gray mt-0.5">Income vs expenses by bank</p>
                </div>
              </div>
              <div className="flex items-center justify-center h-32 text-ash-gray text-sm">
                Connect multiple banks to see comparison
              </div>
            </div>
          );
        }

        const maxValue = Math.max(...banks.flatMap(b => [b.income, b.expenses]));
        const totalIncome = banks.reduce((sum, b) => sum + b.income, 0);
        const totalExpenses = banks.reduce((sum, b) => sum + b.expenses, 0);
        const highestIncomeBank = banks.reduce((max, b) => b.income > max.income ? b : max, banks[0]);
        const highestExpensesBank = banks.reduce((max, b) => b.expenses > max.expenses ? b : max, banks[0]);

        return (
          <div className="bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-forest/10">
                <BuildingOffice2Icon className="h-5 w-5 text-forest" />
              </div>
              <div>
                <h2 className="font-signifier text-xl text-ink-black">Bank Comparison</h2>
                <p className="text-xs text-ash-gray mt-0.5">Income vs expenses by bank</p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="space-y-4 mb-6">
              {banks.map((bank, idx) => {
                const incomeWidth = maxValue > 0 ? (bank.income / maxValue) * 100 : 0;
                const expensesWidth = maxValue > 0 ? (bank.expenses / maxValue) * 100 : 0;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-ink-black">{bank.name}</span>
                      <span className="text-xs text-ash-gray">
                        Net: <span className={`font-mono font-medium ${bank.income - bank.expenses >= 0 ? "text-forest" : "text-error"}`}>
                          {formatCurrency(bank.income - bank.expenses)}
                        </span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-ash-gray w-12 text-right">Income</span>
                        <div className="flex-1 bg-mist-gray rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-forest h-full rounded-full transition-all"
                            style={{ width: `${incomeWidth}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-medium text-forest w-24 text-right">{formatCurrency(bank.income)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-ash-gray w-12 text-right">Expense</span>
                        <div className="flex-1 bg-mist-gray rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-error h-full rounded-full transition-all"
                            style={{ width: `${expensesWidth}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-medium text-error w-24 text-right">{formatCurrency(bank.expenses)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="border-t border-[#ececec] pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-mist-gray rounded-cards p-3">
                  <p className="text-[10px] text-ash-gray uppercase tracking-wide mb-0.5">Total Income</p>
                  <p className="text-sm font-mono font-medium text-forest">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-mist-gray rounded-cards p-3">
                  <p className="text-[10px] text-ash-gray uppercase tracking-wide mb-0.5">Total Expenses</p>
                  <p className="text-sm font-mono font-medium text-error">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-mist-gray rounded-cards p-3">
                  <p className="text-[10px] text-ash-gray uppercase tracking-wide mb-0.5">Highest Income</p>
                  <p className="text-sm font-medium text-ink-black truncate">{highestIncomeBank.name}</p>
                  <p className="text-xs font-mono text-forest">{formatCurrency(highestIncomeBank.income)}</p>
                </div>
                <div className="bg-mist-gray rounded-cards p-3">
                  <p className="text-[10px] text-ash-gray uppercase tracking-wide mb-0.5">Highest Expenses</p>
                  <p className="text-sm font-medium text-ink-black truncate">{highestExpensesBank.name}</p>
                  <p className="text-xs font-mono text-error">{formatCurrency(highestExpensesBank.expenses)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Recurring Transactions */}
      {recurring.length > 0 && (() => {
        const monthlyTotal = recurring.reduce((sum, r) => {
          if (r.frequency === "monthly") return sum + r.avgAmount;
          if (r.frequency === "weekly") return sum + r.avgAmount * 4.33;
          if (r.frequency === "biweekly") return sum + r.avgAmount * 2.17;
          if (r.frequency === "daily") return sum + r.avgAmount * 30;
          if (r.frequency === "quarterly") return sum + r.avgAmount / 3;
          if (r.frequency === "yearly") return sum + r.avgAmount / 12;
          return sum + r.avgAmount;
        }, 0);
        const annualTotal = recurring.reduce((sum, r) => sum + r.annualCost, 0);
        const needsAttention = recurring.filter(r => r.tags.includes("can-review") || r.tags.includes("high-cost") || r.trend === "increasing");

        return (
          <div className="bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-signifier text-xl text-ink-black">Recurring Transactions</h2>
                <p className="text-xs text-ash-gray mt-1">AI-detected subscriptions and regular bills</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-full">
                <span className="text-[10px] text-ash-gray uppercase tracking-wide">Monthly</span>
                <span className="text-sm font-mono font-medium text-forest">{formatCurrency(monthlyTotal)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-full">
                <span className="text-[10px] text-ash-gray uppercase tracking-wide">Annual</span>
                <span className="text-sm font-mono font-medium text-forest">{formatCurrency(annualTotal)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-full">
                <span className="text-[10px] text-ash-gray uppercase tracking-wide">Active</span>
                <span className="text-sm font-medium text-ink-black">{recurring.length}</span>
              </div>
              {needsAttention.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                  <span className="text-[10px] text-amber-700 uppercase tracking-wide">Review</span>
                  <span className="text-sm font-medium text-amber-800">{needsAttention.length}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurring.slice(0, 6).map((r, idx) => {
                const hasAttention = r.tags.includes("can-review") || r.tags.includes("high-cost") || r.trend === "increasing";
                return (
                  <div key={idx} className={`p-4 rounded-cards border ${hasAttention ? "bg-amber-50/50 border-amber-200" : "bg-mist-gray border-transparent"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-ink-black truncate">{r.normalizedDescription}</span>
                      <div className="flex items-center gap-1.5">
                        {r.trend !== "stable" && (
                          <span className={`text-[10px] font-medium ${
                            r.trend === "increasing" ? "text-red-600" : "text-emerald-600"
                          }`}>
                            {r.trend === "increasing" ? "↑" : "↓"} {r.trendPercent}%
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          r.type === "credit" ? "bg-lime-vibrant/20 text-forest" : "bg-[#8BC34A]/20 text-[#4a7c0f]"
                        }`}>
                          {r.frequency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-lg font-mono font-medium text-forest">{formatCurrency(r.avgAmount)}</span>
                      <span className="text-[10px] text-ash-gray">≈ {formatCurrency(r.annualCost)}/yr</span>
                    </div>

                    {r.category && r.category !== "other" && (
                      <div className="mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-forest/10 text-forest rounded capitalize">{r.category}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-ash-gray">{r.transactionCount}x transactions</span>
                      {r.nextExpectedDate && (
                        <span className="text-[10px] text-ash-gray">Next: {new Date(r.nextExpectedDate).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                      )}
                    </div>

                    {r.insights.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-ash-gray/20">
                        {r.insights.slice(0, 1).map((insight, i) => (
                          <p key={i} className="text-[10px] text-ash-gray leading-relaxed">{insight}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Recent Transactions */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards shadow-subtle overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#ececec] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-signifier text-xl text-ink-black">Recent Activity</h2>
            <p className="text-xs text-ash-gray mt-1">Latest transactions</p>
          </div>
          <a href="/dashboard/transactions" className="text-sm text-forest font-semibold hover:underline">
            View All
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-mist-gray">
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Merchant</th>
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-mist-gray/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"}`}>
                        {tx.type === "credit" ? (
                          <ArrowUpRightIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownRightIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink-black truncate max-w-[150px] sm:max-w-none">
                        {tx.normalizedDescription || tx.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-gray">
                      {tx.category?.icon} {tx.category?.name || "\u2014"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ash-gray">{formatDate(tx.date)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-mono font-medium ${tx.type === "credit" ? "text-forest" : "text-error"}`}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ash-gray text-sm">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
