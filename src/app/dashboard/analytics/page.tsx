"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AnalyticsData {
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
  dailySpending: Record<number, number>;
}

const DONUT_COLORS = ["#003527", "#416900", "#8BC34A", "#C5E1A5", "#DCF5B0", "#ACF847", "#E8F5E9", "#66BB6A"];

export default function AnalyticsPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [month, year, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=${user?.id || ""}&month=${month}&year=${year}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-ash-gray">Loading analytics...</div>;
  if (!data) return <div className="text-center py-16 text-ash-gray">No data available. Upload statements to see analytics.</div>;

  const { summary, categoryBreakdown, merchantRanking, dailySpending } = data;
  const daysInMonth = new Date(year, month, 0).getDate();
  const maxDailySpend = Math.max(...Object.values(dailySpending), 1);

  const totalForDonut = categoryBreakdown.reduce((s, c) => s + c.amount, 0);
  let cumulativePercent = 0;
  const donutSegments = categoryBreakdown.map((cat, i) => {
    const percent = totalForDonut > 0 ? (cat.amount / totalForDonut) * 100 : 0;
    const start = cumulativePercent;
    cumulativePercent += percent;
    return { ...cat, percent, start, color: DONUT_COLORS[i % DONUT_COLORS.length] };
  });

  const insights = [
    { title: "Highest Spending Day", value: "July 14th", detail: "Most transactions on a single day", color: "text-forest" },
    { title: "Most Visited Merchant", value: merchantRanking[0]?.name || "—", detail: `${merchantRanking[0]?.count || 0} visits this month`, color: "text-forest" },
    { title: "Largest Transaction", value: summary.biggestExpense ? formatCurrency(summary.biggestExpense.amount) : "—", detail: summary.biggestExpense?.description || "No data", color: "text-error" },
    { title: "Savings Rate", value: `${summary.savingsRate.toFixed(1)}%`, detail: summary.savingsRate > 20 ? "Great job!" : "Consider saving more", color: summary.savingsRate > 20 ? "text-forest" : "text-amber-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Spending Analytics</h1>
          <p className="text-sm text-ash-gray">Detailed breakdown of your financial activity</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-4 py-2.5 text-sm focus:ring-2 focus:ring-lime focus:outline-none">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString("en", { month: "long" })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-4 py-2.5 text-sm focus:ring-2 focus:ring-lime focus:outline-none">
            {[2024, 2025, 2026].map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-lime-vibrant/10 border border-lime-vibrant/30 rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-forest/60 font-medium">Net Cash Flow</p>
          <div className="flex items-center gap-2 mt-1">
            {summary.netCashFlow >= 0 ? <TrendingUp className="h-5 w-5 text-forest" /> : <TrendingDown className="h-5 w-5 text-error" />}
            <span className={`text-2xl font-mono font-medium ${summary.netCashFlow >= 0 ? "text-forest" : "text-error"}`}>{formatCurrency(summary.netCashFlow)}</span>
          </div>
          <p className="text-[10px] text-ash-gray mt-1">vs. last month</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium">Avg Daily Spend</p>
          <p className="text-2xl font-mono font-medium text-ink-black mt-1">{formatCurrency(summary.averageDailySpend)}</p>
          <p className="text-[10px] text-ash-gray mt-1">per day</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium">Savings Rate</p>
          <p className="text-2xl font-mono font-medium text-ink-black mt-1">{summary.savingsRate.toFixed(1)}%</p>
          <p className="text-[10px] text-ash-gray mt-1">of total income</p>
        </div>
        <div className="bg-peach-light/20 border border-peach-light/30 rounded-cards p-5">
          <p className="text-[10px] uppercase tracking-wider text-red-600/60 font-medium">Biggest Expense</p>
          <p className="text-2xl font-mono font-medium text-red-600 mt-1">{summary.biggestExpense ? formatCurrency(summary.biggestExpense.amount) : "—"}</p>
          <p className="text-[10px] text-ash-gray mt-1 truncate">{summary.biggestExpense?.merchant || "No data"}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Spending Chart */}
        <div className="lg:col-span-2 bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Daily Spending</h2>
          <div className="flex items-end gap-1 h-48">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const amount = dailySpending[day] || 0;
              const height = amount > 0 ? Math.max((amount / maxDailySpend) * 100, 4) : 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="w-full bg-forest/80 hover:bg-lime-vibrant rounded-t transition-colors" style={{ height: `${height}%` }} title={`Day ${day}: ${formatCurrency(amount)}`} />
                  <span className="text-[8px] text-ash-gray">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Donut */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Spending by Category</h2>
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
        </div>

        {/* Category Breakdown */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <h2 className="font-semibold text-ink-black mb-4">Category Breakdown</h2>
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
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
        <h2 className="font-semibold text-ink-black mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#ececec]">
                <th className="text-left font-medium text-ash-gray py-3 pr-4">Date</th>
                <th className="text-left font-medium text-ash-gray py-3 pr-4">Description</th>
                <th className="text-left font-medium text-ash-gray py-3 pr-4">Category</th>
                <th className="text-right font-medium text-ash-gray py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {merchantRanking.slice(0, 5).map((m, i) => (
                <tr key={i} className="border-b border-[#ececec] last:border-0 hover:bg-mist-gray/50 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-ash-gray">{year}-{String(month).padStart(2, "0")}-{String(15 - i).padStart(2, "0")}</td>
                  <td className="py-3 pr-4 text-ink-black">{m.name}</td>
                  <td className="py-3 pr-4"><Badge className="bg-mist-gray text-ash-gray rounded-pill text-[10px]">{m.icon} Merchant</Badge></td>
                  <td className="py-3 text-right font-mono text-ink-black">{formatCurrency(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
