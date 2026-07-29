"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { ArrowLeft, MapPin, TrendingUp, Calendar, PiggyBank, Repeat } from "lucide-react";
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

interface MerchantAnalytics {
  merchant: { id: string; displayName: string; icon: string; color: string };
  totalSpent: number;
  visitCount: number;
  avgVisit: number;
  monthlySpending: { month: number; year: number; amount: number; count: number }[];
  categorySplit: { name: string; icon: string; color: string; amount: number; count: number }[];
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: { name: string; icon: string } | null;
    channelTag: string | null;
  }[];
  peakDay: { day: string; amount: number; count: number } | null;
  avgDaysBetween: number;
  uniqueDays: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#003527", "#416900", "#95d3ba", "#acf847", "#91db2a"];

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<MerchantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !merchantId) return;
    setLoading(true);
    fetch(`/api/merchants/${merchantId}/analytics?userId=${user.id}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, merchantId]);

  if (userLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-ash-gray mb-4">Merchant not found</p>
        <Link href="/dashboard/merchants" className="text-sm text-forest font-semibold hover:underline">
          ← Back to merchants
        </Link>
      </div>
    );
  }

  const { merchant, totalSpent, visitCount, avgVisit, monthlySpending, categorySplit, recentTransactions, peakDay, avgDaysBetween } = data;

  const chartData = monthlySpending.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    amount: Math.round(m.amount),
  }));

  const totalCategoryAmount = categorySplit.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/dashboard/merchants" className="inline-flex items-center gap-1.5 text-sm text-ash-gray hover:text-forest transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Merchants
      </Link>

      {/* Merchant Profile Card */}
      <div className="bg-forest rounded-cards p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
              {merchant.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-signifier text-2xl">{merchant.displayName}</h1>
                <span className="px-2 py-0.5 bg-lime-vibrant/20 text-lime-vibrant text-[10px] font-semibold rounded-full uppercase tracking-wider">
                  Merchant
                </span>
              </div>
              <p className="text-white/60 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {data.uniqueDays} unique visit days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-8">
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Total Spent</p>
              <p className="font-mono text-2xl font-medium text-lime-vibrant">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Visits</p>
              <p className="font-mono text-2xl font-medium">{visitCount}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wider">Avg. Visit</p>
              <p className="font-mono text-2xl font-medium">{formatCurrency(avgVisit)}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-lime-vibrant/10 rounded-full blur-3xl" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Spending Velocity */}
        <div className="lg:col-span-2 bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-signifier text-xl text-ink-black">Spending Velocity</h2>
              <p className="text-xs text-ash-gray mt-1">Historical analysis over {monthlySpending.length} months</p>
            </div>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
                  />
                  <Bar dataKey="amount" fill="var(--color-lime-bright)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-ash-gray text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Category Split */}
        <div className="bg-paper-white border border-[#ececec] p-4 sm:p-6 rounded-cards shadow-subtle">
          <div className="mb-4">
            <h2 className="font-signifier text-xl text-ink-black">Category Split</h2>
            <p className="text-xs text-ash-gray mt-1">Spend distribution relative to total</p>
          </div>
          {categorySplit.length > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={categorySplit.map((c) => ({ name: c.name, value: c.amount }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categorySplit.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[9px] uppercase tracking-widest text-ash-gray">Total Share</div>
                    <div className="text-lg font-mono font-medium text-ink-black">
                      {totalCategoryAmount > 0 ? Math.round((categorySplit[0]?.amount || 0) / totalCategoryAmount * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {categorySplit.map((cat, idx) => {
                  const pct = totalCategoryAmount > 0 ? (cat.amount / totalCategoryAmount) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-ink-black">{cat.name}</span>
                      </div>
                      <span className="font-mono text-ash-gray">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-ash-gray text-sm">No categories</div>
          )}
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper-white border border-[#ececec] p-5 rounded-cards">
          <div className="w-9 h-9 bg-forest/5 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="h-4 w-4 text-forest" />
          </div>
          <h3 className="text-sm font-semibold text-ink-black mb-1">Top Category</h3>
          <p className="text-xs text-slate-gray leading-relaxed">
            {categorySplit.length > 0
              ? `${categorySplit[0].name} makes up ${Math.round((categorySplit[0].amount / totalCategoryAmount) * 100)}% of your spending here.`
              : "No category data available."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-5 rounded-cards">
          <div className="w-9 h-9 bg-forest/5 rounded-xl flex items-center justify-center mb-3">
            <Calendar className="h-4 w-4 text-forest" />
          </div>
          <h3 className="text-sm font-semibold text-ink-black mb-1">Peak Spending Day</h3>
          <p className="text-xs text-slate-gray leading-relaxed">
            {peakDay
              ? `Most expensive ${peakDay.day}s with a total of ${formatCurrency(peakDay.amount)}.`
              : "Not enough data to determine."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-5 rounded-cards">
          <div className="w-9 h-9 bg-forest/5 rounded-xl flex items-center justify-center mb-3">
            <PiggyBank className="h-4 w-4 text-forest" />
          </div>
          <h3 className="text-sm font-semibold text-ink-black mb-1">Saving Opportunity</h3>
          <p className="text-xs text-slate-gray leading-relaxed">
            {visitCount > 3
              ? `You visit ${merchant.displayName} ${visitCount} times. Consider bulk buying to save more.`
              : `You visit ${merchant.displayName} ${visitCount} time${visitCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-5 rounded-cards">
          <div className="w-9 h-9 bg-forest/5 rounded-xl flex items-center justify-center mb-3">
            <Repeat className="h-4 w-4 text-forest" />
          </div>
          <h3 className="text-sm font-semibold text-ink-black mb-1">Visit Frequency</h3>
          <p className="text-xs text-slate-gray leading-relaxed">
            {avgDaysBetween > 0
              ? `You visit approximately every ${Math.round(avgDaysBetween)} days.`
              : "Not enough visit data."}
          </p>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards shadow-subtle overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-[#ececec]">
          <h2 className="font-signifier text-xl text-ink-black">Activity History</h2>
          <p className="text-xs text-ash-gray mt-1">Recent transactions at {merchant.displayName}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-mist-gray">
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Category</th>
                <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Description</th>
                <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-mist-gray/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-ash-gray">
                      {new Date(tx.date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-slate-gray">
                      {tx.category?.icon} {tx.category?.name || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-sm text-ink-black">{tx.description}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-sm font-mono font-medium text-error">
                      -{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ash-gray text-sm">
                    No transactions found
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
