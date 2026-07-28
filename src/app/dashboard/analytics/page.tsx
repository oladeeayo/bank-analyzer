"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, X } from "lucide-react";

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

interface Bank {
  id: string;
  bankName: string;
  nickname: string | null;
}

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [filterBank, setFilterBank] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBar, setSelectedBar] = useState<{ label: string; income: number; expense: number; net: number } | null>(null);
  const [drilldown, setDrilldown] = useState<{ type: "category" | "merchant"; name: string; icon: string } | null>(null);
  const [drilldownData, setDrilldownData] = useState<{ totalCredits: number; totalDebits: number; transactions: any[] } | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchBanks();
      fetchAnalytics();
    }
  }, [period, month, year, quarter, filterBank, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?userId=${user.id}`);
      if (res.ok) setBanks(await res.json());
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/analytics?userId=${user.id}&period=${period}`;
      if (filterBank) url += `&bankId=${filterBank}`;
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

  const fetchDrilldown = async (type: "category" | "merchant", name: string, icon: string) => {
    if (drilldown?.name === name) {
      setDrilldown(null);
      setDrilldownData(null);
      return;
    }
    setDrilldown({ type, name, icon });
    setDrilldownData(null);
    try {
      let url = `/api/analytics/drilldown?userId=${user.id}&type=${type}&name=${encodeURIComponent(name)}&period=${period}`;
      if (filterBank) url += `&bankId=${filterBank}`;
      if (period === "monthly") url += `&month=${month}&year=${year}`;
      else if (period === "quarterly") url += `&quarter=${quarter}&year=${year}`;
      else if (period === "yearly") url += `&year=${year}`;
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setDrilldownData({
          totalCredits: result.totalCredits || 0,
          totalDebits: result.totalDebits || 0,
          transactions: result.transactions || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch drilldown:", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-ash-gray">Loading analytics...</div>;
  if (!data) return <div className="text-center py-16 text-ash-gray">No data available. Upload statements to see analytics.</div>;

  const { summary, categoryBreakdown, merchantRanking, dailySpending, dailyCredits, monthlyChart } = data;

  const sortedDays = Object.keys(dailySpending).sort();
  const maxDailySpend = sortedDays.length > 0 ? Math.max(...sortedDays.map(d => dailySpending[d])) : 0;
  const maxDailyCredit = Object.keys(dailyCredits).length > 0 ? Math.max(...Object.values(dailyCredits)) : 0;
  const maxDailyValue = Math.max(maxDailySpend, maxDailyCredit, 1);

  const visibleCategories = categoryBreakdown.filter(c => !hiddenCategories.has(c.name));
  const totalForDonut = visibleCategories.reduce((s, c) => s + c.amount, 0);
  let cumulativePercent = 0;
  const donutSegments = visibleCategories.map((cat, i) => {
    const percent = totalForDonut > 0 ? (cat.amount / totalForDonut) * 100 : 0;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { ...cat, percent, start, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  const toggleCategory = (name: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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
          <div className="w-px h-6 bg-[#ececec]" />
          <select value={filterBank} onChange={(e) => setFilterBank(e.target.value)}
            className="bg-paper-white border border-[#ececec] text-ink-black rounded-lg px-3 py-1.5 text-sm max-w-[200px]"
          >
            <option value="">All Banks</option>
            {banks.map(bank => (
              <option key={bank.id} value={bank.id}>{bank.nickname || bank.bankName}</option>
            ))}
          </select>
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
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#003527]" /> Income</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#8BC34A]" /> Expense</span>
            </div>
          </div>

          {monthlyChart.length > 0 && period !== "monthly" ? (
            (() => {
              const allValues = monthlyChart.flatMap(m => [m.credits, m.debits]);
              const maxVal = Math.max(...allValues, 1);
              return (
                <div>
                  <div className="relative h-72">
                    {/* Zero line at exact center */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-ink-black/20 z-10" />
                    {/* Income bars: grow UP from center */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 flex items-end gap-2 px-2">
                      {monthlyChart.map((m, i) => {
                        const pct = maxVal > 0 ? (m.credits / maxVal) * 100 : 0;
                        const isSelected = selectedBar?.label === `${MONTH_NAMES[m.month - 1]} ${m.year}`;
                        return (
                          <div key={i} className="flex-1 flex justify-center" style={{ height: `${pct}%` }}>
                            <div
                              onClick={() => setSelectedBar(isSelected ? null : { label: `${MONTH_NAMES[m.month - 1]} ${m.year}`, income: m.credits, expense: m.debits, net: m.credits - m.debits })}
                              className={`w-full max-w-[52px] rounded-t-sm transition-all cursor-pointer ${isSelected ? "bg-[#003527] ring-2 ring-[#003527]/30 scale-105" : "bg-[#003527] hover:bg-[#003527]/80"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Expense bars: grow DOWN from center */}
                    <div className="absolute top-1/2 left-0 right-0 h-1/2 flex items-start gap-2 px-2">
                      {monthlyChart.map((m, i) => {
                        const pct = maxVal > 0 ? (m.debits / maxVal) * 100 : 0;
                        const isSelected = selectedBar?.label === `${MONTH_NAMES[m.month - 1]} ${m.year}`;
                        return (
                          <div key={i} className="flex-1 flex justify-center" style={{ height: `${pct}%` }}>
                            <div
                              onClick={() => setSelectedBar(isSelected ? null : { label: `${MONTH_NAMES[m.month - 1]} ${m.year}`, income: m.credits, expense: m.debits, net: m.credits - m.debits })}
                              className={`w-full max-w-[52px] rounded-b-sm transition-all cursor-pointer ${isSelected ? "bg-[#8BC34A] ring-2 ring-[#8BC34A]/30 scale-105" : "bg-[#8BC34A] hover:bg-[#8BC34A]/80"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Month labels below */}
                    <div className="absolute bottom-0 left-0 right-0 flex gap-2 px-2">
                      {monthlyChart.map((m, i) => (
                        <div key={i} className="flex-1 text-center">
                          <span className="text-[10px] text-ash-gray font-medium">{MONTH_NAMES[m.month - 1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedBar && (
                    <div className="mt-8 flex items-center gap-4 p-3 bg-mist-gray rounded-lg">
                      <span className="text-sm font-medium text-ink-black">{selectedBar.label}</span>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#003527]" />
                        <span className="text-sm font-mono text-[#003527]">{formatCurrency(selectedBar.income)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowDownRight className="h-3.5 w-3.5 text-[#8BC34A]" />
                        <span className="text-sm font-mono text-[#8BC34A]">{formatCurrency(selectedBar.expense)}</span>
                      </div>
                      <div className="ml-auto text-sm font-mono font-medium text-ink-black">Net: {formatCurrency(selectedBar.net)}</div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : sortedDays.length > 0 ? (
            (() => {
              const allValues = sortedDays.flatMap(d => [dailySpending[d] || 0, dailyCredits[d] || 0]);
              const maxVal = Math.max(...allValues, 1);
              return (
                <div>
                  <div className="relative h-64">
                    {/* Zero line at exact center */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-ink-black/20 z-10" />
                    {/* Income bars: grow UP from center */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 flex items-end gap-px px-1">
                      {sortedDays.slice(-31).map(dateStr => {
                        const income = dailyCredits[dateStr] || 0;
                        const pct = maxVal > 0 ? (income / maxVal) * 100 : 0;
                        const isSelected = selectedBar?.label === dateStr;
                        return (
                          <div key={dateStr} className="flex-1 flex justify-center" style={{ height: `${pct}%` }}>
                            <div
                              onClick={() => {
                                const expense = dailySpending[dateStr] || 0;
                                setSelectedBar(isSelected ? null : { label: dateStr, income, expense, net: income - expense });
                              }}
                              className={`w-full max-w-[28px] rounded-t-sm transition-all cursor-pointer ${isSelected ? "bg-[#003527] ring-2 ring-[#003527]/30 scale-110" : "bg-[#003527] hover:bg-[#003527]/80"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Expense bars: grow DOWN from center */}
                    <div className="absolute top-1/2 left-0 right-0 h-1/2 flex items-start gap-px px-1">
                      {sortedDays.slice(-31).map(dateStr => {
                        const expense = dailySpending[dateStr] || 0;
                        const pct = maxVal > 0 ? (expense / maxVal) * 100 : 0;
                        const isSelected = selectedBar?.label === dateStr;
                        return (
                          <div key={dateStr} className="flex-1 flex justify-center" style={{ height: `${pct}%` }}>
                            <div
                              onClick={() => {
                                const income = dailyCredits[dateStr] || 0;
                                setSelectedBar(isSelected ? null : { label: dateStr, income, expense, net: income - expense });
                              }}
                              className={`w-full max-w-[28px] rounded-b-sm transition-all cursor-pointer ${isSelected ? "bg-[#8BC34A] ring-2 ring-[#8BC34A]/30 scale-110" : "bg-[#8BC34A] hover:bg-[#8BC34A]/80"}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {/* Day labels below */}
                    <div className="absolute bottom-0 left-0 right-0 flex gap-px px-1">
                      {sortedDays.slice(-31).map(dateStr => {
                        const dayLabel = dateStr.split("-")[2]?.replace(/^0/, "") || dateStr;
                        return (
                          <div key={dateStr} className="flex-1 text-center">
                            <span className="text-[8px] text-ash-gray font-medium">{dayLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedBar && (
                    <div className="mt-6 flex items-center gap-4 p-3 bg-mist-gray rounded-lg">
                      <span className="text-sm font-medium text-ink-black">{selectedBar.label}</span>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#003527]" />
                        <span className="text-sm font-mono text-[#003527]">{formatCurrency(selectedBar.income)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowDownRight className="h-3.5 w-3.5 text-[#8BC34A]" />
                        <span className="text-sm font-mono text-[#8BC34A]">{formatCurrency(selectedBar.expense)}</span>
                      </div>
                      <div className="ml-auto text-sm font-mono font-medium text-ink-black">Net: {formatCurrency(selectedBar.net)}</div>
                    </div>
                  )}
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
                  <button
                    key={i}
                    onClick={() => fetchDrilldown("category", seg.name, seg.icon)}
                    className={`w-full flex items-center justify-between text-sm p-1.5 rounded transition-colors ${
                      drilldown?.type === "category" && drilldown?.name === seg.name
                        ? "bg-lime-vibrant/10"
                        : "hover:bg-mist-gray"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-ink-black">{seg.icon} {seg.name}</span>
                    </div>
                    <span className="font-mono text-ash-gray">{seg.percent.toFixed(0)}%</span>
                  </button>
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

      {/* Drilldown Panel */}
      {drilldown && (
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{drilldown.icon}</span>
              <div>
                <h3 className="font-semibold text-ink-black">{drilldown.name}</h3>
                <p className="text-xs text-ash-gray capitalize">{drilldown.type} Details · {data?.periodLabel}</p>
              </div>
            </div>
            <button onClick={() => { setDrilldown(null); setDrilldownData(null); }} className="text-ash-gray hover:text-ink-black">
              <X className="h-5 w-5" />
            </button>
          </div>
          {drilldownData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-lime-vibrant/10 rounded-lg">
                  <p className="text-[10px] uppercase text-forest/60">Inflow (Credit)</p>
                  <p className="text-xl font-mono font-medium text-forest">{formatCurrency(drilldownData.totalCredits)}</p>
                </div>
                <div className="p-4 bg-[#8BC34A]/10 rounded-lg">
                  <p className="text-[10px] uppercase text-[#4a7c0f]/60">Outflow (Debit)</p>
                  <p className="text-xl font-mono font-medium text-[#4a7c0f]">{formatCurrency(drilldownData.totalDebits)}</p>
                </div>
                <div className="p-4 bg-mist-gray rounded-lg">
                  <p className="text-[10px] uppercase text-ash-gray">Net</p>
                  <p className={`text-xl font-mono font-medium ${drilldownData.totalCredits - drilldownData.totalDebits >= 0 ? "text-forest" : "text-error"}`}>
                    {formatCurrency(drilldownData.totalCredits - drilldownData.totalDebits)}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ececec]">
                      <th className="text-left text-[10px] text-ash-gray uppercase py-2">Date</th>
                      <th className="text-left text-[10px] text-ash-gray uppercase py-2">Description</th>
                      <th className="text-left text-[10px] text-ash-gray uppercase py-2">Type</th>
                      <th className="text-right text-[10px] text-ash-gray uppercase py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {drilldownData.transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="py-2 text-ash-gray">{formatDate(tx.date)}</td>
                        <td className="py-2 text-ink-black truncate max-w-[200px]">{tx.normalizedDescription || tx.description}</td>
                        <td className="py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${tx.type === "credit" ? "bg-lime-vibrant/20 text-forest" : "bg-[#8BC34A]/20 text-[#4a7c0f]"}`}>
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td className={`py-2 text-right font-mono ${tx.type === "credit" ? "text-forest" : "text-[#4a7c0f]"}`}>
                          {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-ash-gray text-sm">Loading details...</div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Merchant Ranking */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Top Merchants</h2>
          {merchantRanking.length > 0 ? (
            <div className="space-y-3">
              {merchantRanking.slice(0, 8).map((m, idx) => {
                const pct = summary.totalExpenses > 0 ? (m.amount / summary.totalExpenses) * 100 : 0;
                return (
                  <button
                    key={idx}
                    onClick={() => fetchDrilldown("merchant", m.name, m.icon)}
                    className={`w-full flex items-center gap-3 group p-1.5 rounded transition-colors ${
                      drilldown?.type === "merchant" && drilldown?.name === m.name
                        ? "bg-lime-vibrant/10"
                        : "hover:bg-mist-gray"
                    }`}
                  >
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
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-ash-gray text-sm">No merchant data</div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-black">Category Breakdown</h2>
            {hiddenCategories.size > 0 && (
              <button
                onClick={() => setHiddenCategories(new Set())}
                className="text-[10px] text-forest hover:underline"
              >
                Show all ({hiddenCategories.size} hidden)
              </button>
            )}
          </div>
          {categoryBreakdown.length > 0 ? (
            <div className="space-y-1">
              {categoryBreakdown.map((cat, idx) => {
                const isHidden = hiddenCategories.has(cat.name);
                const pct = summary.totalExpenses > 0 ? (cat.amount / summary.totalExpenses) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                      isHidden ? "opacity-40" : ""
                    }`}
                  >
                    <button
                      onClick={() => toggleCategory(cat.name)}
                      className="text-[10px] text-ash-gray hover:text-ink-black shrink-0"
                      title={isHidden ? "Show category" : "Hide category"}
                    >
                      {isHidden ? "👁️‍🗨️" : "👁️"}
                    </button>
                    <button
                      onClick={() => fetchDrilldown("category", cat.name, cat.icon)}
                      className={`flex-1 flex items-center gap-3 p-1 rounded transition-colors ${
                        drilldown?.type === "category" && drilldown?.name === cat.name
                          ? "bg-lime-vibrant/10"
                          : "hover:bg-mist-gray"
                      }`}
                    >
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
                    </button>
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
