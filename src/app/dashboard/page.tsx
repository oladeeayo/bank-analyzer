"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DashboardData {
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboard();
  }, [month, year]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=demo&month=${month}&year=${year}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (_err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-white mb-4">Welcome to Bank Analyzer</h2>
        <p className="text-slate-400 mb-8">
          Get started by adding your banks and uploading your first statement.
        </p>
        <a
          href="/dashboard/banks"
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Add Your First Bank
        </a>
      </div>
    );
  }

  const { summary, categoryBreakdown, merchantRanking, bankComparison, dailySpending } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
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
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(summary.currentBalance)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Money In</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Money Out</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(summary.totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{summary.savingsRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryBreakdown.length === 0 && (
              <p className="text-slate-400 text-sm">No expenses recorded this month</p>
            )}
            {categoryBreakdown.map((cat, idx) => {
              const percentage = summary.totalExpenses > 0 ? (cat.amount / summary.totalExpenses) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white">{cat.name}</span>
                      <span className="text-sm text-slate-300">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Merchants */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {merchantRanking.length === 0 && (
              <p className="text-slate-400 text-sm">No merchant data available</p>
            )}
            {merchantRanking.slice(0, 10).map((merch, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{merch.icon}</span>
                  <span className="text-sm text-white">{merch.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{formatCurrency(merch.amount)}</div>
                  <div className="text-xs text-slate-400">{merch.count} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank Comparison */}
      {bankComparison.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Bank Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bankComparison.map((bank, idx) => (
                <div key={idx} className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="font-medium text-white mb-2">{bank.name}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Income:</span>{" "}
                      <span className="text-emerald-400">{formatCurrency(bank.income)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Expenses:</span>{" "}
                      <span className="text-red-400">{formatCurrency(bank.expenses)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
