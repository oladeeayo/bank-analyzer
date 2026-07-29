"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface MonthData {
  year: number;
  month: number;
  credits: number;
  debits: number;
  count: number;
}

interface GroupEntry {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
  months: MonthData[];
}

interface Bank {
  id: string;
  bankName: string;
  nickname: string | null;
}

type GroupBy = "merchant" | "category" | "subcategory";

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BreakdownPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<{ groupBy: GroupBy; groups: GroupEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>("merchant");
  const [filterBank, setFilterBank] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let url = `/api/analytics/breakdown?userId=${user.id}&groupBy=${groupBy}`;
    if (filterBank) url += `&bankId=${filterBank}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, groupBy, filterBank]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/banks?userId=${user.id}`)
      .then(r => r.json())
      .then(d => setBanks(d))
      .catch(console.error);
  }, [user]);

  if (userLoading || !user) {
    return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;
  }

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Detailed Breakdown</h1>
          <p className="text-sm text-ash-gray">View deposits and withdrawals by merchant, category, or subcategory</p>
        </div>
        <div className="flex gap-2">
          {(["merchant", "category", "subcategory"] as GroupBy[]).map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                groupBy === g
                  ? "bg-forest text-lime-vibrant"
                  : "bg-paper-white border border-[#ececec] text-ink-black hover:bg-mist-gray"
              }`}
            >
              {g === "merchant" ? "By Merchant" : g === "category" ? "By Category" : "By Subcategory"}
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

      {loading ? (
        <div className="text-center py-16 text-ash-gray">Loading breakdown...</div>
      ) : !data || data.groups.length === 0 ? (
        <div className="text-center py-16 text-ash-gray">No data found. Upload statements to see breakdowns.</div>
      ) : (
        <div className="space-y-3">
          {data.groups.map(group => {
            const isOpen = expanded.has(group.id);
            const maxAmount = Math.max(group.totalCredits, group.totalDebits, 1);

            return (
              <Card key={group.id} className="bg-paper-white border border-[#ececec] rounded-cards overflow-hidden">
                <button
                  onClick={() => toggleExpanded(group.id)}
                  className="w-full text-left p-5 hover:bg-mist-gray/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: group.color + "20" }}
                    >
                      {group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-black truncate">{group.name}</div>
                      <div className="text-xs text-ash-gray">{group.transactionCount} transactions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-forest">
                        +{formatCurrency(group.totalCredits)}
                      </div>
                      <div className="text-sm font-semibold text-error">
                        -{formatCurrency(group.totalDebits)}
                      </div>
                      <div className={`text-xs font-medium ${group.netAmount >= 0 ? "text-forest" : "text-error"}`}>
                        Net: {group.netAmount >= 0 ? "+" : ""}{formatCurrency(group.netAmount)}
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="text-[10px] text-ash-gray mb-1">Credits vs Debits</div>
                      <div className="h-3 bg-lime-vibrant/20 rounded-full overflow-hidden flex">
                        <div
                          className="bg-forest h-full transition-all"
                          style={{ width: `${(group.totalCredits / maxAmount) * 50}%` }}
                        />
                        <div
                          className="bg-error/60 h-full transition-all"
                          style={{ width: `${(group.totalDebits / maxAmount) * 50}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-ash-gray">
                      {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[#ececce]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-mist-gray border-b border-[#ececec]">
                            <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2">Month</th>
                            <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2">Deposits (Credits)</th>
                            <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2">Withdrawals (Debits)</th>
                            <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2">Net Flow</th>
                            <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-2">Transactions</th>
                            <th className="w-20"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ececec]">
                          {group.months.map(m => {
                            const monthMax = Math.max(m.credits, m.debits, 1);
                            return (
                              <tr key={`${m.year}-${m.month}`} className="hover:bg-mist-gray/30">
                                <td className="px-4 py-2.5 font-medium text-ink-black">
                                  {MONTH_NAMES[m.month]} {m.year}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-sm text-forest">
                                  +{formatCurrency(m.credits)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-sm text-error">
                                  -{formatCurrency(m.debits)}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-sm">
                                  <span className={m.credits - m.debits >= 0 ? "text-forest" : "text-error"}>
                                    {m.credits - m.debits >= 0 ? "+" : ""}{formatCurrency(m.credits - m.debits)}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono text-sm text-ink-black">
                                  {m.count}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="h-2 bg-lime-vibrant/20 rounded-full overflow-hidden flex">
                                    <div className="bg-forest h-full transition-all" style={{ width: `${(m.credits / monthMax) * 50}%` }} />
                                    <div className="bg-error/60 h-full transition-all" style={{ width: `${(m.debits / monthMax) * 50}%` }} />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
