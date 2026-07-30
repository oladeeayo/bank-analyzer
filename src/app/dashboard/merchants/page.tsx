"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { MagnifyingGlassIcon, ArrowUpRightIcon, XMarkIcon, ArrowTrendingUpIcon, CalendarDaysIcon, BanknotesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const HOURS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
  totalReceived: number;
  netAmount: number;
  visitCount: number;
  receiveCount: number;
  avgVisit: number;
  monthlySpending: { month: number; year: number; amount: number; count: number }[];
  intensity: { day: string; hour: number; count: number; credits: number; debits: number }[];
  categorySplit: { name: string; icon: string; color: string; amount: number; count: number }[];
  recentTransactions: {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: string;
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
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchants..."
          className="w-full bg-paper-white border border-[#ececec] rounded-inputs pl-11 pr-4 py-3 text-sm text-ink-black placeholder:text-ash-gray focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <p className="text-[8px] sm:text-[11px] text-ash-gray uppercase tracking-wider leading-tight">Total Merchants</p>
          <p className="text-sm sm:text-xl font-mono font-medium text-ink-black mt-1">{merchants.length}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <p className="text-[8px] sm:text-[11px] text-ash-gray uppercase tracking-wider leading-tight">Total Txns</p>
          <p className="text-sm sm:text-xl font-mono font-medium text-ink-black mt-1 truncate">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <p className="text-[8px] sm:text-[11px] text-ash-gray uppercase tracking-wider leading-tight">Avg/Merchant</p>
          <p className="text-sm sm:text-xl font-mono font-medium text-ink-black mt-1 truncate">
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
                <ArrowUpRightIcon className="h-4 w-4 text-ash-gray group-hover:text-forest transition-colors" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-ash-gray uppercase tracking-wider">Total Transactions</p>
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
              <XMarkIcon className="h-4 w-4" />
            </button>

            {analyticsLoading ? (
              <div className="flex items-center justify-center h-64">
                <ArrowPathIcon className="h-6 w-6 text-forest animate-spin" />
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
  const { merchant, totalSpent, totalReceived, netAmount, visitCount, receiveCount, avgVisit, monthlySpending, intensity, recentTransactions, peakDay, avgDaysBetween } = data;
  const hasBoth = totalSpent > 0 && totalReceived > 0;
  const txnTimes = visitCount + receiveCount;

  const chartData = monthlySpending.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    amount: Math.round(m.amount),
  }));

  // Build intensity grid with credits/debits
  const intensityDetailMap = new Map<string, { count: number; credits: number; debits: number }>();
  for (const i of intensity) {
    const existing = intensityDetailMap.get(`${i.day}-${i.hour}`) || { count: 0, credits: 0, debits: 0 };
    existing.count += i.count;
    existing.credits += i.credits || 0;
    existing.debits += i.debits || 0;
    intensityDetailMap.set(`${i.day}-${i.hour}`, existing);
  }
  const maxIntensity = Math.max(1, ...Array.from(intensityDetailMap.values()).map(v => v.count));
  const [selectedCell, setSelectedCell] = useState<{ day: string; hour: number; count: number; credits: number; debits: number } | null>(null);

  // Hour labels to show (compact)
  const hourLabels = [0, 3, 6, 9, 12, 15, 18, 21];

  return (
    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
      {/* Profile Card */}
      <div className="bg-forest rounded-cards p-4 sm:p-5 text-white relative overflow-hidden">
        <div className="relative z-10">
          {/* Top row: icon + name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-13 sm:h-13 bg-white/10 rounded-2xl flex items-center justify-center text-xl sm:text-2xl backdrop-blur-sm shrink-0">
              {merchant.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-signifier text-lg sm:text-xl truncate">{merchant.displayName}</h2>
                <span className="px-2 py-0.5 bg-lime-vibrant/20 text-lime-vibrant text-[9px] sm:text-[10px] font-semibold rounded-full uppercase tracking-wider shrink-0">
                  {hasBoth ? "Two-Way" : totalReceived > 0 ? "Received" : "Spent"}
                </span>
              </div>
              <p className="text-white/50 text-[11px] sm:text-xs mt-0.5">
                {data.uniqueDays} unique days
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {totalSpent > 0 && (
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Total Sent</p>
                <p className="font-mono text-base sm:text-xl font-medium text-lime-vibrant">{formatCurrency(totalSpent)}</p>
              </div>
            )}
            {totalReceived > 0 && (
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider">Total Received</p>
                <p className="font-mono text-base sm:text-xl font-medium text-white">{formatCurrency(totalReceived)}</p>
              </div>
            )}
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-wider">Txn Times</p>
              <p className="font-mono text-base sm:text-xl font-medium">{txnTimes}</p>
            </div>
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-wider">Net</p>
              <p className={`font-mono text-base sm:text-xl font-medium ${netAmount >= 0 ? "text-white" : "text-red-300"}`}>
                {netAmount >= 0 ? "+" : ""}{formatCurrency(netAmount)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-lime-vibrant/10 rounded-full blur-3xl" />
      </div>

      {/* Spending Velocity */}
      <div className="bg-paper-white border border-[#ececec] p-3 sm:p-5 rounded-cards">
        <div className="mb-2">
          <h3 className="font-signifier text-sm sm:text-lg text-ink-black">Spending Velocity</h3>
          <p className="text-[10px] text-ash-gray mt-0.5">{monthlySpending.length} months of data</p>
        </div>
        <div className="h-32 sm:h-52">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#979799", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: "12px" }}
                  formatter={(value) => [formatCurrency(Number(value)), "Amount"]}
                />
                <Bar dataKey="amount" fill="var(--color-lime-bright)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-ash-gray text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Transaction Intensity Heatmap */}
      <div className="bg-paper-white border border-[#ececec] p-3 sm:p-5 rounded-cards">
        <div className="mb-2">
          <h3 className="font-signifier text-sm sm:text-lg text-ink-black">Transaction Intensity</h3>
          <p className="text-[10px] text-ash-gray mt-0.5">{txnTimes} txns · {data.uniqueDays} days</p>
        </div>

        {/* Selected cell details */}
        {selectedCell && (
          <div className="flex items-center gap-3 mb-2 p-2 bg-forest/5 rounded-lg">
            <div>
              <p className="text-[9px] text-ash-gray uppercase">{selectedCell.day} {selectedCell.hour === 0 ? "12:00 AM" : selectedCell.hour < 12 ? `${selectedCell.hour}:00 AM` : selectedCell.hour === 12 ? "12:00 PM" : `${selectedCell.hour - 12}:00 PM`}</p>
              <p className="text-sm font-mono font-medium text-ink-black">{selectedCell.count} txn{selectedCell.count !== 1 ? "s" : ""}</p>
            </div>
            <div className="h-6 w-px bg-[#ececec]" />
            <div>
              <p className="text-[9px] text-forest uppercase">Sent</p>
              <p className="text-xs font-mono font-medium text-forest">{formatCurrency(selectedCell.debits)}</p>
            </div>
            <div className="h-6 w-px bg-[#ececec]" />
            <div>
              <p className="text-[9px] text-[#4a7c0f] uppercase">Received</p>
              <p className="text-xs font-mono font-medium text-[#4a7c0f]">{formatCurrency(selectedCell.credits)}</p>
            </div>
            <button onClick={() => setSelectedCell(null)} className="ml-auto text-ash-gray hover:text-ink-black">
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div>
          <div>
            {/* Hour labels */}
            <div className="flex mb-0.5">
              <div className="w-8 shrink-0" />
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center">
                  {hourLabels.includes(h) ? (
                    <span className="text-[7px] sm:text-[8px] text-ash-gray">{h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h-12}p`}</span>
                  ) : null}
                </div>
              ))}
            </div>
            {/* Grid */}
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-px mb-px">
                <span className="w-8 text-[8px] sm:text-[9px] text-ash-gray shrink-0 text-right pr-1">{day}</span>
                {HOURS.map((h) => {
                  const detail = intensityDetailMap.get(`${day}-${h}`);
                  const count = detail?.count || 0;
                  const opacity = count > 0 ? 0.15 + (count / maxIntensity) * 0.85 : 0;
                  const isSelected = selectedCell?.day === day && selectedCell?.hour === h;
                  return (
                    <div
                      key={h}
                      onClick={() => {
                        if (detail) setSelectedCell(isSelected ? null : { day, hour: h, ...detail });
                      }}
                      className={`flex-1 aspect-square rounded-[2px] cursor-pointer transition-all hover:scale-110 hover:z-10 ${isSelected ? "ring-2 ring-forest ring-offset-1 scale-110" : ""}`}
                      style={{
                        backgroundColor: count === 0 ? "#f0f0f0" : `rgba(0,53,39,${opacity})`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <span className="text-[7px] sm:text-[8px] text-ash-gray">Less</span>
              {[0, 0.2, 0.4, 0.6, 0.85].map((o) => (
                <div key={o} className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: o === 0 ? "#f0f0f0" : `rgba(0,53,39,${o})` }} />
              ))}
              <span className="text-[7px] sm:text-[8px] text-ash-gray">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <div className="w-6 h-6 bg-forest/5 rounded flex items-center justify-center mb-1.5">
            <CalendarDaysIcon className="h-3 w-3 text-forest" />
          </div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-ink-black mb-0.5">Peak Day</h4>
          <p className="text-[9px] sm:text-[11px] text-slate-gray leading-relaxed">
            {peakDay ? `${peakDay.day}s` : "Not enough data."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <div className="w-6 h-6 bg-forest/5 rounded flex items-center justify-center mb-1.5">
            <ArrowPathIcon className="h-3 w-3 text-forest" />
          </div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-ink-black mb-0.5">Frequency</h4>
          <p className="text-[9px] sm:text-[11px] text-slate-gray leading-relaxed">
            {avgDaysBetween > 0 ? `Every ~${Math.round(avgDaysBetween)} days` : "Not enough data."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <div className="w-6 h-6 bg-forest/5 rounded flex items-center justify-center mb-1.5">
            <BanknotesIcon className="h-3 w-3 text-forest" />
          </div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-ink-black mb-0.5">Avg. Txn</h4>
          <p className="text-[9px] sm:text-[11px] text-slate-gray leading-relaxed">
            {txnTimes > 0 ? formatCurrency((totalSpent + totalReceived) / txnTimes) : "No data."}
          </p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-2.5 sm:p-4 rounded-cards">
          <div className="w-6 h-6 bg-forest/5 rounded flex items-center justify-center mb-1.5">
            <ArrowTrendingUpIcon className="h-3 w-3 text-forest" />
          </div>
          <h4 className="text-[10px] sm:text-xs font-semibold text-ink-black mb-0.5">Net Flow</h4>
          <p className="text-[9px] sm:text-[11px] text-slate-gray leading-relaxed">
            {netAmount >= 0 ? `+${formatCurrency(netAmount)}` : `-${formatCurrency(Math.abs(netAmount))}`}
          </p>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards overflow-hidden">
        <div className="px-3 sm:px-5 pb-2 border-b border-[#ececec]">
          <h3 className="font-signifier text-sm sm:text-lg text-ink-black">Activity History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[350px]">
            <thead>
              <tr className="bg-mist-gray">
                <th className="text-left text-[8px] sm:text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-2 sm:px-4 py-1.5">Date</th>
                <th className="text-left text-[8px] sm:text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-2 sm:px-4 py-1.5">Description</th>
                <th className="text-right text-[8px] sm:text-[10px] font-semibold text-ash-gray uppercase tracking-wider px-2 sm:px-4 py-1.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ececec]">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-mist-gray/50 transition-colors">
                  <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-[11px] text-ash-gray whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-[10px] sm:text-[11px] text-ink-black truncate max-w-[160px]">
                    {tx.category?.icon && <span className="mr-1">{tx.category.icon}</span>}
                    {tx.description}
                  </td>
                  <td className={`px-2 sm:px-4 py-2 text-[10px] sm:text-[11px] font-mono font-medium text-right whitespace-nowrap ${tx.type === "credit" ? "text-forest" : "text-error"}`}>
                    {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-ash-gray text-[10px]">No transactions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
