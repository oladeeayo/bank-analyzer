"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalytics();
  }, [month, year]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=demo&month=${month}&year=${year}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-center py-16 text-slate-400">No data available</div>;
  }

  const { summary, categoryBreakdown, merchantRanking, dailySpending } = data;
  const daysInMonth = new Date(year, month, 0).getDate();
  const maxDailySpend = Math.max(...Object.values(dailySpending), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Net Cash Flow</div>
            <div className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(summary.netCashFlow)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Avg Daily Spend</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(summary.averageDailySpend)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Savings Rate</div>
            <div className="text-2xl font-bold text-blue-400">{summary.savingsRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-400">Biggest Expense</div>
            <div className="text-2xl font-bold text-orange-400">
              {summary.biggestExpense ? formatCurrency(summary.biggestExpense.amount) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Chart (text-based) */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Daily Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const amount = dailySpending[day] || 0;
              const height = amount > 0 ? Math.max((amount / maxDailySpend) * 100, 4) : 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-emerald-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`Day ${day}: ${formatCurrency(amount)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>1</span>
            <span>{daysInMonth}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => {
                const pct = summary.totalExpenses > 0 ? (cat.amount / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span>{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">{cat.name}</span>
                        <span className="text-slate-300">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Merchant Ranking */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {merchantRanking.slice(0, 10).map((m, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <div className="text-sm text-white">{m.name}</div>
                      <div className="text-xs text-slate-400">{m.count} visits</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-white">{formatCurrency(m.amount)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
