"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
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

interface MerchantSummary {
  merchantId: string;
  displayName: string;
  icon: string;
  color: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
}

interface MerchantSummaryData {
  merchants: MerchantSummary[];
  uncategorized: { totalAmount: number; transactionCount: number };
  categories: { categoryId: string; name: string; icon: string; color: string; totalAmount: number; transactionCount: number }[];
}

const CHART_COLORS = ["#003527", "#416900", "#95d3ba", "#acf847", "#91db2a"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchantSummary, setMerchantSummary] = useState<MerchantSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (user) {
      fetchDashboard();
      fetchTransactions();
      fetchMerchantSummary();
    }
  }, [month, year, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

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

  const fetchMerchantSummary = async () => {
    try {
      const res = await fetch(`/api/merchants/summary?userId=${user?.id || ""}&month=${month}&year=${year}`);
      if (res.ok) {
        const result = await res.json();
        setMerchantSummary(result);
      }
    } catch (err) {
      console.error("Failed to fetch merchant summary:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ash-gray">Loading dashboard...</div>
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

  const { summary, categoryBreakdown, dailySpending } = data;

  const cashflowData = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(2024, i).toLocaleString("en", { month: "short" });
    const isCurrentMonth = i + 1 === month;
    const income = isCurrentMonth ? summary.totalIncome : summary.totalIncome * (0.6 + Math.random() * 0.8);
    const expense = isCurrentMonth ? summary.totalExpenses : summary.totalExpenses * (0.6 + Math.random() * 0.8);
    return {
      name: monthName,
      income: Math.round(income),
      expense: Math.round(expense),
      isCurrentMonth,
    };
  });

  const categoryPieData = categoryBreakdown.slice(0, 5).map((cat, idx) => ({
    name: cat.name,
    value: cat.amount,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  const totalExpenses = categoryPieData.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div className="space-y-8">
      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance — Forest Card */}
        <div className="bg-forest p-6 rounded-cards text-white relative overflow-hidden flex flex-col justify-between h-44 shadow-elevated">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Across All Banks</p>
              <h3 className="font-mono text-[28px] font-medium">{formatCurrency(summary.currentBalance)}</h3>
            </div>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <span className="text-lime-vibrant">💰</span>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <span className="bg-lime-vibrant text-forest px-2 py-0.5 rounded-buttons text-[10px] font-semibold">+12.5%</span>
            <span className="text-xs text-white/60">vs last month</span>
          </div>
          <div className="absolute -right-4 -top-8 w-32 h-32 bg-lime-vibrant/10 rounded-full blur-3xl"></div>
        </div>

        {/* Money In — Floating Artifact */}
        <div className="bg-paper-white border border-[#ececec] p-6 rounded-cards flex flex-col justify-between h-44 shadow-subtle">
          <div>
            <p className="text-ash-gray text-xs mb-1">Total Income</p>
            <h3 className="font-mono text-[28px] font-medium text-forest">{formatCurrency(summary.totalIncome)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success font-semibold flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" /> 2.84%
            </span>
            <span className="text-xs text-ash-gray">Last month</span>
          </div>
        </div>

        {/* Money Out — Floating Artifact */}
        <div className="bg-paper-white border border-[#ececec] p-6 rounded-cards flex flex-col justify-between h-44 shadow-subtle">
          <div>
            <p className="text-ash-gray text-xs mb-1">Total Expenses</p>
            <h3 className="font-mono text-[28px] font-medium text-forest">{formatCurrency(summary.totalExpenses)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-error font-semibold flex items-center gap-1 text-xs">
              <TrendingDown className="h-3 w-3" /> 4.78%
            </span>
            <span className="text-xs text-ash-gray">Last month</span>
          </div>
        </div>

        {/* Savings Rate — Floating Artifact */}
        <div className="bg-paper-white border border-[#ececec] p-6 rounded-cards flex flex-col justify-between h-44 shadow-subtle">
          <div>
            <p className="text-ash-gray text-xs mb-1">Total Saving</p>
            <h3 className="font-mono text-[28px] font-medium text-forest">{formatCurrency(summary.totalIncome - summary.totalExpenses)}</h3>
          </div>
          <div className="w-full bg-mist-gray h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-lime h-full rounded-full" style={{ width: `${Math.min(100, ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100)}%` }}></div>
          </div>
        </div>
      </div>

      {/* Middle Section: Cashflow Chart + Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart — Floating Artifact */}
        <div className="lg:col-span-2 bg-paper-white border border-[#ececec] p-6 rounded-cards shadow-subtle">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-signifier text-xl text-ink-black">Cash Flow Analysis</h2>
              <p className="text-xs text-ash-gray mt-1">Monthly overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-lime-vibrant rounded"></div>
                <span className="text-ash-gray">Income</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-forest rounded"></div>
                <span className="text-ash-gray">Expense</span>
              </div>
              <select className="bg-mist-gray border-none rounded-buttons px-3 py-1.5 text-xs focus:ring-2 focus:ring-lime-vibrant/50 cursor-pointer">
                <option>This Year</option>
              </select>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                  formatter={(value) => [formatCurrency(Number(value))]}
                />
                <Bar dataKey="income" fill="#acf847" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#003527" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Donut — Floating Artifact */}
        <div className="bg-paper-white border border-[#ececec] p-6 rounded-cards shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-signifier text-xl text-ink-black">Category Split</h2>
              <p className="text-xs text-ash-gray mt-1">Expense distribution</p>
            </div>
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
                <div className="text-[10px] uppercase tracking-widest text-ash-gray">Total</div>
                <div className="text-lg font-mono font-medium text-ink-black">{formatCurrency(totalExpenses)}</div>
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
        </div>
      </div>

      {/* Spending by Merchant */}
      {merchantSummary && merchantSummary.merchants.length > 0 && (
        <div className="bg-paper-white border border-[#ececec] p-6 rounded-cards shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-signifier text-xl text-ink-black">Spending by Merchant</h2>
              <p className="text-xs text-ash-gray mt-1">Top merchants this period</p>
            </div>
            <a href="/dashboard/analytics" className="text-sm text-lime font-semibold hover:underline">
              View All →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {merchantSummary.merchants.slice(0, 8).map((merchant) => (
              <div key={merchant.merchantId} className="p-4 bg-mist-gray rounded-cards hover:bg-surface-high transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${merchant.color}20` }}>
                    {merchant.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink-black truncate">{merchant.displayName}</div>
                    <div className="text-xs text-ash-gray">{merchant.transactionCount} transactions</div>
                  </div>
                </div>
                <div className="text-lg font-mono font-medium text-forest">{formatCurrency(merchant.totalAmount)}</div>
                <div className="text-xs text-ash-gray">avg {formatCurrency(merchant.averageAmount)}/txn</div>
              </div>
            ))}
          </div>

          {merchantSummary.uncategorized.transactionCount > 0 && (
            <div className="mt-4 p-4 bg-blush-peach rounded-cards">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sienna-brown/10 flex items-center justify-center text-xl">
                    🏪
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-sienna-brown">Uncategorized</div>
                    <div className="text-xs text-sienna-brown/70">{merchantSummary.uncategorized.transactionCount} transactions</div>
                  </div>
                </div>
                <div className="text-lg font-mono font-medium text-sienna-brown">{formatCurrency(merchantSummary.uncategorized.totalAmount)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
          <div>
            <h2 className="font-signifier text-xl text-ink-black">Recent Activity</h2>
            <p className="text-xs text-ash-gray mt-1">Latest transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-mist-gray border-none rounded-buttons px-3 py-1.5 text-xs focus:ring-2 focus:ring-lime-vibrant/50 cursor-pointer">
              <option>This Month</option>
            </select>
            <button className="p-2 text-slate-gray hover:text-forest transition-colors">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
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
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
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
                      {tx.type === "credit" ? "Completed" : "Pending"}
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
