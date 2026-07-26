"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, ArrowUpRight, ArrowDownRight, Calendar, Building2, DollarSign, Wand2, ChevronLeft, ChevronRight, Zap, Check, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/lib/hooks";

interface Transaction {
  id: string;
  date: string;
  description: string;
  normalizedDescription: string | null;
  amount: number;
  type: string;
  balance: number | null;
  reference: string | null;
  bank: { bankName: string; nickname: string | null };
  merchant: { displayName: string; icon: string; color: string } | null;
  category: { name: string; icon: string; color: string } | null;
  categoryId: string | null;
  merchantId: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  _count?: { transactions: number };
}

export default function TransactionsPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [ruleForm, setRuleForm] = useState({
    normalizedMerchant: "",
    categoryId: "",
    regexExact: true,
    ignoreNumbers: false,
    markTransfer: false,
  });

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCategories();
    }
  }, [search, filterType, filterBank, page, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user?.id || "",
        page: String(page),
        limit: "50",
      });
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?userId=${user?.id || ""}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleRuleApply = async () => {
    if (!selectedTx) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/transactions/${selectedTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: null, // Will be resolved by backend from merchant name
          categoryId: ruleForm.categoryId || null,
          normalizedDescription: ruleForm.normalizedMerchant || undefined,
          isTransfer: ruleForm.markTransfer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveMessage({
          type: "success",
          text: `Saved! ${data.updatedSimilarCount > 0 ? `Updated ${data.updatedSimilarCount} similar transactions.` : "No similar transactions found."}`,
        });
        fetchTransactions();
        setTimeout(() => {
          setSelectedTx(null);
          setSaveMessage(null);
        }, 2000);
      } else {
        setSaveMessage({ type: "error", text: "Failed to save. Please try again." });
      }
    } catch (err) {
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkCategory = async (categoryId: string) => {
    if (selectedIds.size === 0) return;

    setSaving(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/transactions/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId }),
        })
      );

      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchTransactions();
    } catch (err) {
      console.error("Bulk update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const selectTransaction = (tx: Transaction) => {
    setSelectedTx(tx);
    setRuleForm({
      normalizedMerchant: tx.merchant?.displayName || tx.normalizedDescription || "",
      categoryId: tx.categoryId || "",
      regexExact: true,
      ignoreNumbers: false,
      markTransfer: false,
    });
    setSaveMessage(null);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group categories by parent for better UX
  const parentCategories = categories.filter(c => !categories.some(p => p.name === c.name && categories.some(sub => sub.name === p.name)));
  const getCategoryDisplay = (cat: Category) => `${cat.icon} ${cat.name}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-signifier text-[28px] text-ink-black">Cleaning Rules Engine</h1>
        <p className="text-sm text-ash-gray">Standardizing messy transaction data</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-lg border border-[#ececec]">
          <Calendar className="h-4 w-4 text-slate-gray" />
          <span className="text-sm text-ink-black">Oct 1, 2023 - Oct 31, 2023</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-lg border border-[#ececec]">
          <Building2 className="h-4 w-4 text-slate-gray" />
          <span className="text-sm text-ink-black">All Banks</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-lg border border-[#ececec]">
          <DollarSign className="h-4 w-4 text-slate-gray" />
          <span className="text-sm text-ink-black">All Amounts</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <select
              onChange={(e) => handleBulkCategory(e.target.value)}
              className="bg-paper-white border border-[#ececec] rounded-lg px-3 py-1.5 text-sm"
              value=""
            >
              <option value="">Bulk: Set Category ({selectedIds.size} selected)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{getCategoryDisplay(cat)}</option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" className="gap-2" disabled={selectedIds.size === 0}>
            <Edit className="h-4 w-4" />
            Bulk Edit
          </Button>
        </div>
      </div>

      {/* Main Content: Table + Rules Sidebar */}
      <div className="grid grid-cols-12 gap-6">
        {/* Transaction Table */}
        <div className="col-span-12 lg:col-span-8 bg-paper-white border border-[#ececec] rounded-cards overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-380px)]">
            <table className="w-full">
              <thead>
                <tr className="bg-mist-gray border-b border-[#ececec]">
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-[#ececec]"
                      checked={selectedIds.size === transactions.length && transactions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(transactions.map(t => t.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Original Description</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Merchant</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Bank</th>
                  <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-ash-gray text-sm">Loading transactions...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-ash-gray text-sm">No transactions found</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-lime-vibrant/5 transition-colors cursor-pointer ${selectedTx?.id === tx.id ? "bg-lime-vibrant/10" : ""}`}
                      onClick={() => selectTransaction(tx)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-[#ececec]"
                          checked={selectedIds.has(tx.id)}
                          onClick={(e) => toggleSelect(tx.id, e)}
                          onChange={() => {}}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-ink-black whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-gray max-w-[200px] truncate">{tx.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tx.merchant ? (
                            <>
                              <div className="w-6 h-6 rounded bg-lime-vibrant/20 flex items-center justify-center text-[10px] font-bold text-forest">{tx.merchant.icon}</div>
                              <span className="font-semibold text-sm text-ink-black">{tx.merchant.displayName}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-slate-gray">❓</span>
                              <span className="italic text-slate-gray text-sm">Unnormalized</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {tx.category ? (
                          <Badge variant="default">{tx.category.icon} {tx.category.name}</Badge>
                        ) : (
                          <Badge variant="destructive">Uncategorized</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-forest" />
                          <span className="text-sm text-slate-gray">{tx.bank.nickname || tx.bank.bankName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-medium text-ink-black">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-[#ececec] flex items-center justify-between bg-mist-gray">
            <span className="text-xs text-ash-gray">
              Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total} transactions
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Rules Sidebar Engine */}
        <div className="col-span-12 lg:col-span-4 bg-paper-white border border-[#ececec] rounded-cards p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-280px)]">
          <div className="flex items-center justify-between">
            <h3 className="font-signifier text-lg text-ink-black">Rule Configuration</h3>
            <div className="bg-forest p-1 rounded-lg">
              <Wand2 className="h-4 w-4 text-lime-vibrant" />
            </div>
          </div>

          {selectedTx ? (
            <>
              {/* Save Message */}
              {saveMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  saveMessage.type === "success"
                    ? "bg-lime-vibrant/20 text-forest"
                    : "bg-error/10 text-error"
                }`}>
                  {saveMessage.type === "success" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {saveMessage.text}
                </div>
              )}

              {/* Detected Pattern */}
              <div className="p-4 bg-mist-gray rounded-lg border border-[#ececec]">
                <p className="text-xs text-ash-gray mb-1">Detected Pattern</p>
                <p className="font-mono text-sm text-ink-black bg-paper-white p-2 rounded border border-[#ececec]">
                  {selectedTx.description}
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-ink-black mb-1 block">Normalized Merchant</Label>
                  <Input
                    value={ruleForm.normalizedMerchant}
                    onChange={(e) => setRuleForm({ ...ruleForm, normalizedMerchant: e.target.value })}
                    placeholder="e.g. Shoprite"
                    className="bg-paper-white border-[#ececec] rounded-lg text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-ink-black mb-1 block">Category Assignment</Label>
                  <select
                    value={ruleForm.categoryId}
                    onChange={(e) => setRuleForm({ ...ruleForm, categoryId: e.target.value })}
                    className="w-full bg-paper-white border border-[#ececec] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-vibrant/50"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Advanced Matching */}
                <div className="p-4 bg-lime-vibrant/10 rounded-lg border border-lime/20">
                  <h4 className="text-xs font-semibold text-lime flex items-center gap-2 mb-3">
                    <Wand2 className="h-3 w-3" />
                    Advanced Matching
                  </h4>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ruleForm.regexExact}
                        onChange={(e) => setRuleForm({ ...ruleForm, regexExact: e.target.checked })}
                        className="rounded border-[#ececec]"
                      />
                      Regex Exact Match
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ruleForm.ignoreNumbers}
                        onChange={(e) => setRuleForm({ ...ruleForm, ignoreNumbers: e.target.checked })}
                        className="rounded border-[#ececec]"
                      />
                      Ignore Numbers/Dates
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ruleForm.markTransfer}
                        onChange={(e) => setRuleForm({ ...ruleForm, markTransfer: e.target.checked })}
                        className="rounded border-[#ececec]"
                      />
                      Mark as Internal Transfer
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col gap-3 border-t border-[#ececec]">
                <Button onClick={handleRuleApply} className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Apply to Similar Transactions"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setSelectedTx(null)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div className="text-ash-gray">
                <Wand2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a transaction to edit its cleaning rule</p>
              </div>
            </div>
          )}

          {/* Data Quality Score */}
          <div className="mt-auto pt-6 border-t border-[#ececec]">
            <p className="text-xs text-ash-gray mb-2">Data Quality Score</p>
            <div className="w-full h-2 bg-mist-gray rounded-full overflow-hidden">
              <div className="w-[88%] h-full bg-lime rounded-full"></div>
            </div>
            <p className="text-right text-[10px] font-semibold text-lime mt-1">88% of data is cleaned</p>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-lime text-white w-14 h-14 rounded-full flex items-center justify-center shadow-elevated hover:scale-105 active:scale-95 transition-transform">
          <Zap className="h-6 w-6" fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
