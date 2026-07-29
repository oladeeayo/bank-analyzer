"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { Search, ArrowUpRight, X, MapPin, TrendingUp, Calendar, PiggyBank, Repeat, Loader2 } from "lucide-react";
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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#003527", "#416900", "#95d3ba", "#acf847", "#91db2a"];

interface MerchantSummary {
  merchantId: string;
  displayName: string;
  icon: string;
  color: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
}

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

export default function MerchantsPage() {
  const { user, loading: userLoading } = useUser();
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/merchants/summary?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMerchants(data.merchants || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const openMerchant = useCallback((merchantId: string) => {
    setSelectedId(merchantId);
    setAnalytics(null);
    setAnalyticsLoading(true);
    if (!user) return;
    fetch(`/api/merchants/${merchantId}/analytics?userId=${user.id}`)
      .then((res) => res.json())
      .then((d) => {
        setAnalytics(d.error ? null : d);
        setAnalyticsLoading(false);
      })
      .catch(() => setAnalyticsLoading(false));
  }, [user]);

  const closeModal = () => {
    setSelectedId(null);
    setAnalytics(null);
  };

  useEffect(() => {
    if (!selectedId) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [selectedId]);

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = merchants.filter((m) =>
    m.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = merchants.reduce((s, m) => s + m.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-signifier text-[24px] sm:text-[28px] text-ink-black">Merchant Analytics</h1>
        <p className="text-sm text-ash-gray mt-1">Search and analyze your spending by merchant</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchants..."
          className="w-full bg-paper-white border border-[#ececec] rounded-inputs pl-11 pr-4 py-3 text-sm text-ink-black placeholder:text-ash-gray focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-paper-white border border-[#ececec] p-3 sm:p-4 rounded-cards">
          <p className="text-[10px] sm:text-[11px] text-ash-gray uppercase tracking-wider">Total Merchants</p>
          <p className="text-base sm:text-xl font-mono font-medium text-ink-black mt-1">{merchants.length}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-3 sm:p-4 rounded-cards">
          <p className="text-[10px] sm:text-[11px] text-ash-gray uppercase tracking-wider">Total Spent</p>
          <p className="text-base sm:text-xl font-mono font-medium text-ink-black mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-3 sm:p-4 rounded-cards">
          <p className="text-[10px] sm:text-[11px] text-ash-gray uppercase tracking-wider">Avg per Merchant</p>
          <p className="text-base sm:text-xl font-mono font-medium text-ink-black mt-1">
            {merchants.length > 0 ? formatCurrency(totalSpent / merchants.length) : "₦0"}
          </p>
        </div>
      </div>

      {/* Merchant List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ash-gray text-sm">
          {search ? "No merchants match your search" : "No merchants found. Upload a statement to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <button
              key={m.merchantId}
              onClick={() => openMerchant(m.merchantId)}
              className="group bg-paper-white border border-[#ececec] p-5 rounded-cards hover:shadow-[rgba(4,23,43,0.05)0px_0px_0px_1px,rgba(0,0,0,0.08)0px_8px_32px_0px] hover:-translate-y-0.5 transition-all duration-300 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${m.color}15` }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-black group-hover:text-forest transition-colors">
                      {m.displayName}
                    </h3>
                    <p className="text-[11px] text-ash-gray">{m.transactionCount} transactions</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ash-gray group-hover:text-forest transition-colors" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-ash-gray uppercase tracking-wider">Total Spent</p>
                  <p className="text-lg font-mono font-medium text-forest">{formatCurrency(m.totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-ash-gray uppercase tracking-wider">Avg</p>
                  <p className="text-sm font-mono text-ink-black">{formatCurrency(m.averageAmount)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Merchant Detail Overlay */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex sm:items-start sm:justify-center sm:pt-[5vh]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-paper-white sm:rounded-cards shadow-elevated w-full sm:max-w-4xl h-full sm:max-h-[88vh] sm:mx-4 overflow-y-auto">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-ink-black shadow-subtle transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 text-forest animate-spin" />
              </div>
            ) : !analytics ? (
              <div className="flex flex-col items-center justify-center h-64 text-ash-gray">
                <p className="text-sm">Failed to load merchant data</p>
                <button onClick={closeModal} className="text-xs text-forest mt-2 hover:underline">Close</button>
              </div>
            ) : (
              <MerchantDetailContent data={analytics} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantDetailContent({ data }: { data: MerchantAnalytics }) {
  const { merchant, totalSpent, visitCount, avgVisit, monthlySpending, categorySplit, recentTransactions, peakDay, avgDaysBetween } = data;

  const chartData = monthlySpending.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    amount: Math.round(m.amount),
  }));

  const totalCategoryAmount = categorySplit.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Merchant Profile Card */}
      <div className="bg-forest rounded-cards p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl sm:text-2xl backdrop-blur-sm shrink-0">
              {merchant.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-signifier text-xl sm:text-2xl truncate">{merchant.displayName}</h2>
                <span className="px-2 py-0.5 bg-lime-vibrant/20 text-lime-vibrant text-[10px] font-semibold rounded-full uppercase tracking-wider shrink-0">
                  Merchant
                </span>
              </div>
              <p className="text-white/60 text-xs sm:text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {data.uniqueDays} unique visit days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 sm:flex sm:justify-end">
            <div className="sm:text-right">
              <p className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider">Total Spent</p>
              <p className="font-mono text-lg sm:text-2xl font-medium text-lime-vibrant">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider">Visits</p>
              <p className="font-mono text-lg sm:text-2xl font-medium">{visitCount}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider">Avg. Visit</p>
              <p className="font-mono text-lg sm:text-2xl font-medium">{formatCurrency(avgVisit)}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-lime-vibrant/10 rounded-full blur-3xl" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending Velocity */}
        <div className="lg:col-span-2 bg-paper-white border border-[#ececec] p-4 sm:p-5 rounded-cards">
          <div className="mb-4">
            <h3 className="font-signifier text-lg text-ink-black">Spending Velocity</h3>
            <p className="text-xs text-ash-gray mt-0.5">Historical analysis over {monthlySpending.length} months</p>
          </div>
          <div className="h-44 sm:h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                    formatter={(value) => [formatCurrency(Number(value)), "Spent"]}
                  />
                  <Bar dataKey="amount" fill="var(--color-lime-bright)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-ash-gray text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Category Split */}
        <div className="bg-paper-white border border-[#ececec] p-4 sm:p-5 rounded-cards">
          <div className="mb-3">
            <h3 className="font-signifier text-lg text-ink-black">Category Split</h3>
            <p className="text-xs text-ash-gray mt-0.5">Spend distribution</p>
          </div>
          {categorySplit.length > 0 ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie
                        data={categorySplit.map((c) => ({ name: c.name, value: c.amount }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
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
                    <div className="text-[8px] uppercase tracking-widest text-ash-gray">Share</div>
                    <div className="text-base font-mono font-medium text-ink-black">
                      {totalCategoryAmount > 0 ? Math.round((categorySplit[0]?.amount || 0) / totalCategoryAmount * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {categorySplit.map((cat, idx) => {
                  const pct = totalCategoryAmount > 0 ? (cat.amount / totalCategoryAmount) * 100 : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-ink-black">{cat.name}</span>
                      </div>
                      <span className="font-mono text-ash-gray">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-24 text-ash-gray text-xs">No categories</div>
          )}
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <div className="w-8 h-8 bg-forest/5 rounded-lg flex items-center justify-center mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-forest" />
          </div>
          <h4 className="text-xs font-semibold text-ink-black mb-0.5">Top Category</h4>
          <p className="text-[11px] text-slate-gray leading-relaxed">
            {categorySplit.length > 0
              ? `${categorySplit[0].name} makes up ${Math.round((categorySplit[0].amount / totalCategoryAmount) * 100)}% of spending.`
              : "No data."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <div className="w-8 h-8 bg-forest/5 rounded-lg flex items-center justify-center mb-2">
            <Calendar className="h-3.5 w-3.5 text-forest" />
          </div>
          <h4 className="text-xs font-semibold text-ink-black mb-0.5">Peak Day</h4>
          <p className="text-[11px] text-slate-gray leading-relaxed">
            {peakDay
              ? `${peakDay.day}s — ${formatCurrency(peakDay.amount)}`
              : "Not enough data."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <div className="w-8 h-8 bg-forest/5 rounded-lg flex items-center justify-center mb-2">
            <PiggyBank className="h-3.5 w-3.5 text-forest" />
          </div>
          <h4 className="text-xs font-semibold text-ink-black mb-0.5">Saving Tip</h4>
          <p className="text-[11px] text-slate-gray leading-relaxed">
            {visitCount > 3
              ? `${visitCount} visits — consider bulk buying.`
              : `${visitCount} visit${visitCount === 1 ? "" : "s"} so far.`}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <div className="w-8 h-8 bg-forest/5 rounded-lg flex items-center justify-center mb-2">
            <Repeat className="h-3.5 w-3.5 text-forest" />
          </div>
          <h4 className="text-xs font-semibold text-ink-black mb-0.5">Frequency</h4>
          <p className="text-[11px] text-slate-gray leading-relaxed">
            {avgDaysBetween > 0
              ? `Every ~${Math.round(avgDaysBetween)} days.`
              : "Not enough data."}
          </p>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards overflow-hidden">
        <div className="px-4 sm:px-5 pb-3 border-b border-[#ececec]">
          <h3 className="font-signifier text-lg text-ink-black">Activity History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="bg-mist-gray">
                <th className="text-left text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2.5">Date</th>
                <th className="text-left text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2.5">Category</th>
                <th className="text-left text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2.5">Description</th>
                <th className="text-right text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-mist-gray/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-ash-gray whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-gray whitespace-nowrap">
                    {tx.category?.icon} {tx.category?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-black truncate max-w-[200px]">
                    {tx.description}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-medium text-error text-right whitespace-nowrap">
                    -{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-ash-gray text-xs">No transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
