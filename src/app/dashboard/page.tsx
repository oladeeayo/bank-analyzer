"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Filter,
} from "lucide-react";
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
} from "recharts";

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

interface Transaction {
  id: string;
  date: string;
  description: string;
  normalizedDescription: string | null;
  amount: number;
  type: string;
  category: { name: string; icon: string } | null;
}

const CHART_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    fetchDashboard();
    fetchTransactions();
  }, [month, year, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?userId=${user?.id || ""}&month=${month}&year=${year}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions?userId=${user?.id || ""}&page=1&limit=5`);
      if (res.ok) {
        const result = await res.json();
        setTransactions(result.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Bank Analyzer</h2>
        <p className="text-gray-500 mb-8">
          Get started by adding your banks and uploading your first statement.
        </p>
        <a
          href="/dashboard/banks"
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Add Your First Bank
        </a>
      </div>
    );
  }

  const { summary, categoryBreakdown, dailySpending } = data;

  // Prepare cashflow chart data
  const cashflowData = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(2024, i).toLocaleString("en", { month: "short" });
    const isCurrentMonth = i + 1 === month;
    // Simulate income/expenses for demo
    const income = isCurrentMonth ? summary.totalIncome : summary.totalIncome * (0.6 + Math.random() * 0.8);
    const expense = isCurrentMonth ? summary.totalExpenses : summary.totalExpenses * (0.6 + Math.random() * 0.8);
    return {
      name: monthName,
      income: Math.round(income),
      expense: Math.round(expense),
      isCurrentMonth,
    };
  });

  // Prepare category pie data
  const categoryPieData = categoryBreakdown.slice(0, 5).map((cat, idx) => ({
    name: cat.name,
    value: cat.amount,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  const totalExpenses = categoryPieData.reduce((sum, cat) => sum + cat.value, 0);

  const monthName = new Date(2024, month - 1).toLocaleString("en", { month: "long" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
            className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Section: Card + Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bank Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-[#1a3a2a] to-[#2d5a42] rounded-3xl p-6 text-white relative overflow-hidden h-full min-h-[280px]">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="text-lg font-semibold">{user?.name || "USER"}</div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-sm text-emerald-200/60 mb-1">Balance</div>
                <div className="text-3xl font-bold">{formatCurrency(summary.currentBalance)}</div>
              </div>

              <div className="flex items-end justify-between">
                <div className="text-xs text-emerald-200/60">
                  <div>EXP</div>
                  <div className="text-white font-medium">11/29</div>
                </div>
                <div className="text-xs text-emerald-200/60">
                  <div>CVV</div>
                  <div className="text-white font-medium">232</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="text-sm text-gray-500 mb-2">Total Income</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(summary.totalIncome)}</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                2.84%
              </span>
              <span className="text-xs text-gray-400">Last month {formatCurrency(summary.totalIncome * 0.95)}</span>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="text-sm text-gray-500 mb-2">Total Expenses</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(summary.totalExpenses)}</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                <TrendingDown className="h-3 w-3" />
                4.78%
              </span>
              <span className="text-xs text-gray-400">Last month {formatCurrency(summary.totalExpenses * 1.05)}</span>
            </div>
          </div>

          {/* Total Saving */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="text-sm text-gray-500 mb-2">Total Saving</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(summary.totalIncome - summary.totalExpenses)}</div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                <TrendingUp className="h-3 w-3" />
                1.98%
              </span>
              <span className="text-xs text-gray-400">Last month {formatCurrency((summary.totalIncome - summary.totalExpenses) * 0.97)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Cashflow Chart + Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cashflow</h2>
              <div className="text-sm text-gray-500">Total Balance</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.currentBalance)}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-gray-500">Income</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-[#1a3a2a] rounded"></div>
                <span className="text-gray-500">Expense</span>
              </div>
              <select className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm">
                <option>This Year</option>
              </select>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  formatter={(value) => [formatCurrency(Number(value))]}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#1a3a2a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Statistic</h2>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm">
              <option>This Month</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-100">
            <button className="pb-2 text-sm text-gray-400 font-medium">Income</button>
            <button className="pb-2 text-sm text-gray-900 font-medium border-b-2 border-emerald-500">Expense</button>
          </div>

          {/* Donut Chart */}
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
                <div className="text-xs text-gray-500">Total Expenses</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(totalExpenses)}</div>
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {categoryPieData.map((cat, idx) => {
              const percentage = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{percentage.toFixed(0)}%</span>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">{formatCurrency(cat.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <div className="flex items-center gap-3">
            <select className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm">
              <option>This Month</option>
            </select>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Note</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                        {tx.type === "credit" ? (
                          <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {tx.normalizedDescription || tx.description}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-500">
                      {tx.category?.icon} {tx.category?.name || "—"}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-500">{formatDate(tx.date)}</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`text-sm font-medium ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-500 truncate max-w-[200px] block">
                      {tx.normalizedDescription || tx.description}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      tx.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}>
                      {tx.type === "credit" ? "Completed" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
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
