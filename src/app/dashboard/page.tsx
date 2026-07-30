"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
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
const availableYears = [2023, 2024, 2025, 2026, 2027];

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurring, setRecurring] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      let url = `/api/analytics?userId=${user!.id}&period=${period}`;
      if (period === "monthly") url += `&month=${month}&year=${year}`;
      else if (period === "quarterly") url += `&quarter=${quarter}&year=${year}`;
      else if (period === "yearly") url += `&year=${year}`;
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
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
            View All →
          </a>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-mist-gray">
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Merchant</th>
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Category</th>
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-center text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-mist-gray/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "credit" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"}`}>
                        {tx.type === "credit" ? (
                          <ArrowUpRightIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownRightIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink-black">
                        {tx.normalizedDescription || tx.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-gray">
                      {tx.category?.icon} {tx.category?.name || "—"}
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
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-buttons text-[10px] font-semibold uppercase ${
                      tx.type === "credit"
                        ? "bg-lime-vibrant/20 text-forest"
                        : "bg-error-container text-error"
                    }`}>
                      {tx.type === "credit" ? "Credit" : "Debit"}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ash-gray text-sm">
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
