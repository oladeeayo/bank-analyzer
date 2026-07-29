"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationCircleIcon, LightBulbIcon, FlagIcon, ArrowRightIcon, SparklesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ReportData {
  summary: {
    currentBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    savingsRate: number;
    averageDailySpend: number;
  };
  periodLabel: string;
  transactionCount: number;
  categoryBreakdown: { name: string; icon: string; amount: number; count: number }[];
  merchantRanking: { name: string; amount: number; count: number }[];
  recurringExpenses: { description: string; avgAmount: number; frequency: string }[];
  biggestExpense: { amount: number; description: string; merchant: string } | null;
  topIncomeCategories: { name: string; amount: number }[];
  budgetHealth: { category: string; limit: number; spent: number }[];
  goals: { name: string; targetAmount: number; currentAmount: number }[];
}

interface AIReport {
  overview: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  savingsOpportunities: string[];
  spendingPattern: string;
  nextSteps: string[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportPage() {
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<ReportData | null>(null);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  const generateReport = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      let url = `/api/report?userId=${user.id}&period=${period}`;
      if (period === "monthly") url += `&month=${month}&year=${year}`;
      else if (period === "quarterly") url += `&quarter=${quarter}&year=${year}`;
      else if (period === "yearly") url += `&year=${year}`;
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result.data);
        setAiReport(result.aiReport);
      }
    } catch (err) {
      console.error("Report fetch error:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (user) generateReport();
  }, [user]);

  if (userLoading || !user) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
          <span className="text-ash-gray">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-signifier text-[24px] sm:text-[28px] text-ink-black">Financial Report</h1>
          <p className="text-sm text-ash-gray">AI-powered analysis of your finances</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["monthly", "quarterly", "yearly", "all"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.96] ${
                period === p
                  ? "bg-forest text-lime-vibrant"
                  : "bg-paper-white border border-[#ececec] text-ink-black hover:bg-mist-gray"
              }`}
            >
              {p === "monthly" ? "Monthly" : p === "quarterly" ? "Quarterly" : p === "yearly" ? "Yearly" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {period !== "all" && (
        <div className="flex flex-wrap items-center gap-3">
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-3 sm:px-4 py-2 text-sm">
            {[2023, 2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
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
          <Button onClick={generateReport} disabled={generating} size="sm" className="gap-1.5 ml-auto sm:ml-0">
            <ArrowPathIcon className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      )}

      {generating && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-ash-gray">Analyzing your financial data...</p>
          </div>
        </div>
      )}

      {!generating && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium mb-1">Current Balance</p>
              <p className="font-mono text-xl sm:text-2xl font-medium text-ink-black">{formatCurrency(data.summary.currentBalance)}</p>
            </div>
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium mb-1">Total Income</p>
              <p className="font-mono text-xl sm:text-2xl font-medium text-forest">{formatCurrency(data.summary.totalIncome)}</p>
            </div>
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium mb-1">Total Expenses</p>
              <p className="font-mono text-xl sm:text-2xl font-medium text-error">{formatCurrency(data.summary.totalExpenses)}</p>
            </div>
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-wider text-ash-gray font-medium mb-1">Net Flow</p>
              <p className={`font-mono text-xl sm:text-2xl font-medium ${data.summary.netCashFlow >= 0 ? "text-forest" : "text-error"}`}>
                {formatCurrency(data.summary.netCashFlow)}
              </p>
            </div>
          </div>

          {/* Savings Rate + Daily Spend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
              <p className="text-xs text-ash-gray mb-2">Savings Rate</p>
              <div className="flex items-end gap-3">
                <p className={`font-signifier text-3xl font-medium ${data.summary.savingsRate >= 15 ? "text-forest" : "text-pending"}`}>
                  {data.summary.savingsRate.toFixed(1)}%
                </p>
                <p className="text-xs text-ash-gray mb-1.5">
                  {data.summary.savingsRate >= 20 ? "Excellent" : data.summary.savingsRate >= 10 ? "Good" : "Needs improvement"}
                </p>
              </div>
              <div className="w-full bg-mist-gray h-2 rounded-full overflow-hidden mt-3">
                <div className="bg-lime h-full rounded-full transition-all" style={{ width: `${Math.min(100, data.summary.savingsRate)}%` }} />
              </div>
            </div>
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
              <p className="text-xs text-ash-gray mb-2">Average Daily Spend</p>
              <p className="font-mono text-2xl font-medium text-ink-black">{formatCurrency(data.summary.averageDailySpend)}</p>
              <p className="text-xs text-ash-gray mt-1">{data.transactionCount} transactions in this period</p>
            </div>
          </div>

          {/* Category Breakdown */}
          {data.categoryBreakdown.length > 0 && (
            <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
              <h2 className="font-signifier text-lg text-ink-black mb-4">Where your money went</h2>
              <div className="space-y-3">
                {data.categoryBreakdown.slice(0, 8).map((cat, i) => {
                  const pct = data.summary.totalExpenses > 0 ? (cat.amount / data.summary.totalExpenses) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-sm w-6 text-center shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm text-ink-black truncate">{cat.name}</span>
                          <span className="text-xs text-ash-gray shrink-0 ml-2">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-mist-gray h-1.5 rounded-full overflow-hidden">
                          <div className="bg-forest h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="font-mono text-xs font-medium text-ink-black w-20 text-right shrink-0">{formatCurrency(cat.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Report Section */}
          {aiReport && (
            <>
              <div className="bg-forest/5 border border-forest/10 rounded-cards p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-5">
                  <SparklesIcon className="h-5 w-5 text-lime-vibrant" />
                  <h2 className="font-signifier text-lg text-forest">AI Analysis</h2>
                </div>
                <p className="text-sm text-ink-black leading-relaxed mb-6">{aiReport.overview}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowTrendingUpIcon className="h-4 w-4 text-forest" />
                      <h3 className="text-sm font-semibold text-forest">Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {aiReport.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-ink-black flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ExclamationCircleIcon className="h-4 w-4 text-pending" />
                      <h3 className="text-sm font-semibold text-pending">Concerns</h3>
                    </div>
                    <ul className="space-y-2">
                      {aiReport.concerns.map((c, i) => (
                        <li key={i} className="text-sm text-ink-black flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-pending rounded-full mt-1.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-slate-gray mb-3 italic">&ldquo;{aiReport.spendingPattern}&rdquo;</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <LightBulbIcon className="h-4 w-4 text-lime" />
                    <h3 className="text-sm font-semibold text-lime">Recommendations</h3>
                  </div>
                  <ul className="space-y-2">
                    {aiReport.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-ink-black flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-lime rounded-full mt-1.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {aiReport.savingsOpportunities.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FlagIcon className="h-4 w-4 text-forest" />
                        <h3 className="text-sm font-semibold text-forest">Savings Opportunities</h3>
                      </div>
                      <ul className="space-y-2">
                        {aiReport.savingsOpportunities.map((s, i) => (
                          <li key={i} className="text-sm text-ink-black flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-lime-vibrant rounded-full mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiReport.nextSteps.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRightIcon className="h-4 w-4 text-forest" />
                        <h3 className="text-sm font-semibold text-forest">Next Steps</h3>
                      </div>
                      <ul className="space-y-2">
                        {aiReport.nextSteps.map((s, i) => (
                          <li key={i} className="text-sm text-ink-black flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Recurring Expenses */}
              {data.recurringExpenses.length > 0 && (
                <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
                  <h2 className="font-signifier text-lg text-ink-black mb-4">Recurring Expenses</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.recurringExpenses.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-mist-gray rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-ink-black">{r.description}</p>
                          <p className="text-[10px] text-ash-gray">{r.frequency}</p>
                        </div>
                        <span className="font-mono text-sm font-medium text-ink-black">{formatCurrency(r.avgAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Health */}
              {data.budgetHealth.length > 0 && (
                <div className="bg-paper-white border border-[#ececec] rounded-cards p-5">
                  <h2 className="font-signifier text-lg text-ink-black mb-4">Budget Performance</h2>
                  <div className="space-y-3">
                    {data.budgetHealth.map((b, i) => {
                      const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-ink-black">{b.category}</span>
                            <span className="text-xs text-ash-gray">{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                          </div>
                          <div className="w-full bg-mist-gray h-2 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct > 100 ? "bg-error" : pct > 80 ? "bg-pending" : "bg-lime"}`}
                              style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!aiReport && !generating && (
            <div className="bg-mist-gray rounded-cards p-8 text-center">
              <p className="text-sm text-ash-gray">AI analysis could not be generated. The data overview is still available above.</p>
            </div>
          )}
        </>
      )}

      {!generating && !data && (
        <div className="text-center py-16">
          <p className="text-ash-gray">No data available for this period.</p>
        </div>
      )}
    </div>
  );
}