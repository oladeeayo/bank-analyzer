"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon, ExclamationCircleIcon, XMarkIcon, LinkIcon, PencilIcon, PlusIcon, BoltIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/lib/hooks";

interface Transaction {
  id: string;
  date: string;
  description: string;
  normalizedDescription: string | null;
  narration: string | null;
  amount: number;
  type: string;
  balance: number | null;
  reference: string | null;
  merchantId: string | null;
  categoryId: string | null;
  notes: string | null;
  tags: string | null;
  bank: { bankName: string; nickname: string | null };
  merchant: { id: string; displayName: string; icon: string; color: string } | null;
  category: { id: string; name: string; icon: string; color: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sortOrder: number;
  isSystem: boolean;
  parentId: string | null;
  children?: Category[];
  _count?: { transactions: number };
}

interface SimilarTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  matchReason: string;
}

interface Bank {
  id: string;
  bankName: string;
  nickname: string | null;
  accountNumber: string | null;
}

export default function TransactionsPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBank, setFilterBank] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [similarTxs, setSimilarTxs] = useState<SimilarTransaction[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [editingMerchant, setEditingMerchant] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedParentForPicker, setSelectedParentForPicker] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Array<{ txId: string; prevCategoryId: string | null; prevMerchantId: string | null; prevNormalizedDesc: string | null }>>([]);
  const [txNotes, setTxNotes] = useState("");
  const [txTags, setTxTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [ruleForm, setRuleForm] = useState({
    normalizedMerchant: "",
    categoryId: "",
    markTransfer: false,
  });
  const [reclassifying, setReclassifying] = useState(false);
  const [similarFilterType, setSimilarFilterType] = useState<"all" | "debit" | "credit">("all");
  const [similarFilterOp, setSimilarFilterOp] = useState<"all" | "gt" | "lt" | "eq">("all");
  const [similarFilterAmount, setSimilarFilterAmount] = useState("");

  const findSimilarTransactions = useCallback(async (tx: Transaction) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/transactions/similar?userId=${user.id}&txId=${tx.id}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarTxs(data.similar || []);
        setShowSimilar((data.similar?.length || 0) > 0);
      }
    } catch (err) {
      console.error("Failed to find similar transactions:", err);
    }
  }, [user]);

  const getFilteredSimilar = useCallback(() => {
    const active = similarTxs.filter(s => !dismissedIds.has(s.id));
    return active.filter(s => {
      if (similarFilterType === "debit" && s.type !== "debit") return false;
      if (similarFilterType === "credit" && s.type !== "credit") return false;
      if (similarFilterAmount) {
        const amt = parseFloat(similarFilterAmount);
        if (similarFilterOp === "gt" && s.amount <= amt) return false;
        if (similarFilterOp === "lt" && s.amount >= amt) return false;
        if (similarFilterOp === "eq" && s.amount !== amt) return false;
      }
      return true;
    });
  }, [similarTxs, dismissedIds, similarFilterType, similarFilterOp, similarFilterAmount]);

  useEffect(() => {
    if (!user) return;

    const loadTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          userId: user.id,
          page: String(page),
          limit: "100",
        });
        if (search) params.set("search", search);
        if (filterType) params.set("type", filterType);
        if (filterCategory) params.set("categoryId", filterCategory);
        if (filterBank) params.set("bankId", filterBank);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (minAmount) params.set("minAmount", minAmount);
        if (maxAmount) params.set("maxAmount", maxAmount);
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

    const loadCategories = async () => {
      try {
        const res = await fetch(`/api/categories?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    const loadBanks = async () => {
      try {
        const res = await fetch(`/api/banks?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setBanks(data);
        }
      } catch (err) {
        console.error("Failed to fetch banks:", err);
      }
    };

    loadTransactions();
    loadCategories();
    loadBanks();
  }, [user, search, filterType, filterCategory, filterBank, startDate, endDate, minAmount, maxAmount, page, refreshKey]);

  const handleReclassify = async () => {
    if (!user) return;
    setReclassifying(true);
    try {
      const res = await fetch("/api/transactions/reclassify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveMessage({ type: "success", text: `Re-classified ${data.updatedCount} of ${data.totalTransactions} transactions` });
        setRefreshKey(k => k + 1);
      } else {
        const err = await res.json();
        setSaveMessage({ type: "error", text: err.error || "Failed to re-classify" });
      }
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setReclassifying(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  if (userLoading || !user) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-mist-gray rounded-cards" />
      <div className="bg-paper-white border border-[#ececec] rounded-cards p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-mist-gray rounded-cards" />
          ))}
        </div>
      </div>
    </div>
  );

  const handleSave = async () => {
    if (!selectedTx) return;

    setSaving(true);
    setSaveMessage(null);

    const newMerchant = merchantName || ruleForm.normalizedMerchant || undefined;
    const newCategoryId = ruleForm.categoryId || null;

    // Push current state to undo stack (keep last 3)
    setUndoStack(prev => {
      const next = [...prev, {
        txId: selectedTx.id,
        prevCategoryId: selectedTx.categoryId || null,
        prevMerchantId: selectedTx.merchantId || null,
        prevNormalizedDesc: selectedTx.normalizedDescription || null,
      }];
      return next.slice(-3);
    });

    try {
      // Save the main transaction
      const res = await fetch(`/api/transactions/${selectedTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: selectedTx.merchantId || null,
          categoryId: newCategoryId,
          normalizedDescription: newMerchant,
          isTransfer: ruleForm.markTransfer,
        }),
      });

      if (!res.ok) {
        setSaveMessage({ type: "error", text: "Failed to save." });
        setSaving(false);
        return;
      }

      const data = await res.json();
      setSelectedTx(data.transaction);
      setMerchantName(data.transaction.merchant?.displayName || newMerchant || "");
      setRuleForm(prev => ({ ...prev, categoryId: data.transaction.categoryId || "" }));

      // Apply same changes to non-dismissed similar transactions only
      let updatedSimilar = 0;
      const activeSimilar = getFilteredSimilar();
      if (activeSimilar.length > 0 && (newMerchant || newCategoryId)) {
        const similarPromises = activeSimilar.map(s =>
          fetch(`/api/transactions/${s.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              normalizedDescription: newMerchant,
              categoryId: newCategoryId,
            }),
          }).then(r => r.ok)
        );
        const results = await Promise.all(similarPromises);
        updatedSimilar = results.filter(Boolean).length;
      }

      setSaveMessage({
        type: "success",
        text: updatedSimilar > 0 ? `Saved! Also updated ${updatedSimilar} similar` : "Saved!",
      });
      setRefreshKey(k => k + 1);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];

    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${last.txId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: last.prevMerchantId,
          categoryId: last.prevCategoryId,
          normalizedDescription: last.prevNormalizedDesc || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTx(data.transaction);
        setMerchantName(data.transaction.merchant?.displayName || "");
        setRuleForm(prev => ({ ...prev, categoryId: data.transaction.categoryId || "" }));
        setSaveMessage({ type: "success", text: "Undone!" });
        setUndoStack(prev => prev.slice(0, -1));
        setRefreshKey(k => k + 1);
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (err) {
      setSaveMessage({ type: "error", text: "Undo failed." });
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
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error("Bulk update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCategory = async (txId: string, categoryId: string) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: categoryId || null }),
      });
      if (res.ok) {
        setTransactions(prev => prev.map(tx =>
          tx.id === txId
            ? { ...tx, categoryId: categoryId || null, category: categories.find(c => c.id === categoryId) || null }
            : tx
        ));
      }
    } catch (err) {
      console.error("Quick category failed:", err);
    }
  };

  const handleExportCsv = () => {
    const headers = ["Date", "Description", "Merchant", "Category", "Type", "Amount", "Balance", "Reference", "Bank"];
    const rows = transactions.map(tx => [
      tx.date,
      tx.description,
      tx.normalizedDescription || tx.merchant?.displayName || "",
      tx.category?.name || "Uncategorized",
      tx.type,
      tx.amount.toString(),
      tx.balance?.toString() || "",
      tx.reference || "",
      tx.bank.nickname || tx.bank.bankName,
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectTransaction = (tx: Transaction) => {
    setSelectedTx(tx);
    setRuleForm({
      normalizedMerchant: tx.merchant?.displayName || tx.normalizedDescription || "",
      categoryId: tx.categoryId || "",
      markTransfer: false,
    });
    setMerchantName(tx.merchant?.displayName || "");
    setEditingMerchant(false);
    setSaveMessage(null);
    setCategorySearch("");
    setSelectedParentForPicker(null);
    setDismissedIds(new Set());
    setSimilarFilterType("all");
    setSimilarFilterOp("all");
    setSimilarFilterAmount("");
    setTxNotes(tx.notes || "");
    try {
      setTxTags(tx.tags ? JSON.parse(tx.tags) : []);
    } catch {
      setTxTags([]);
    }
    setTagInput("");
    findSimilarTransactions(tx);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-signifier text-[28px] text-ink-black">Cleaning Rules Engine</h1>
        <p className="text-sm text-ash-gray">Standardizing messy transaction data</p>
      </div>

      <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 space-y-3">
        {/* Row 1: Search + Type */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] max-w-xs">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search transactions..."
              className="bg-paper-white border-[#ececec] rounded-lg text-sm pl-8"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-mist-gray rounded">
                <XMarkIcon className="h-3 w-3 text-ash-gray" />
              </button>
            )}
          </div>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="bg-paper-white border border-[#ececec] rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="bg-paper-white border border-[#ececec] rounded-lg px-3 py-2 text-sm max-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.filter(c => !c.parentId).map(parent => (
              <optgroup key={parent.id} label={`${parent.icon} ${parent.name}`}>
                {categories.filter(c => c.parentId === parent.id).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={filterBank}
            onChange={(e) => { setFilterBank(e.target.value); setPage(1); }}
            className="bg-paper-white border border-[#ececec] rounded-lg px-3 py-2 text-sm max-w-[200px]"
          >
            <option value="">All Banks</option>
            {banks.map(bank => (
              <option key={bank.id} value={bank.id}>{bank.nickname || bank.bankName}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2">
            {selectedIds.size > 0 && (
              <select
                onChange={(e) => handleBulkCategory(e.target.value)}
                className="bg-paper-white border border-[#ececec] rounded-lg px-3 py-1.5 text-sm"
                value=""
              >
                <option value="">Bulk: Set Category ({selectedIds.size} selected)</option>
              {categories.filter(c => c.parentId && categories.some(p => p.id === c.parentId)).map(c => {
                const parent = categories.find(p => p.id === c.parentId);
                return (
                  <option key={c.id} value={c.id}>
                    {parent?.icon} {parent?.name} → {c.icon} {c.name}
                  </option>
                );
              })}
            </select>
          )}
            <Button
              onClick={handleReclassify}
              disabled={reclassifying}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <BoltIcon className={`h-3.5 w-3.5 ${reclassifying ? "animate-spin" : ""}`} />
              {reclassifying ? "Classifying..." : "Classify"}
            </Button>
            <Button
              onClick={handleExportCsv}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              Export CSV
            </Button>
        </div>
        </div>
        {/* Row 2: Date Range + Amount Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#ececec]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CalendarDaysIcon className="h-4 w-4 text-slate-gray shrink-0" />
            <span className="text-xs text-ash-gray">Date:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-paper-white border-[#ececec] rounded-lg px-2 py-1 text-xs w-[120px] sm:w-[140px]"
            />
            <span className="text-xs text-ash-gray">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-paper-white border-[#ececec] rounded-lg px-2 py-1 text-xs w-[120px] sm:w-[140px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ash-gray">Amount:</span>
            <Input
              type="number"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
              placeholder="Min"
              className="bg-paper-white border-[#ececec] rounded-lg px-2 py-1 text-xs w-[80px]"
            />
            <span className="text-xs text-ash-gray">to</span>
            <Input
              type="number"
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
              placeholder="Max"
              className="bg-paper-white border-[#ececec] rounded-lg px-2 py-1 text-xs w-[80px]"
            />
          </div>
          {(startDate || endDate || minAmount || maxAmount || filterType || filterCategory || filterBank || search) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterType("");
                setFilterCategory("");
                setFilterBank("");
                setStartDate("");
                setEndDate("");
                setMinAmount("");
                setMaxAmount("");
                setPage(1);
              }}
              className="text-xs text-ash-gray hover:text-ink-black flex items-center gap-1"
            >
              <XMarkIcon className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transaction Table */}
        <div className="lg:col-span-8 bg-paper-white border border-[#ececec] rounded-cards overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-380px)]">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-mist-gray border-b border-[#ececec]">
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-[#ececec]"
                      checked={selectedIds.size === transactions.length && transactions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(transactions.map(t => t.id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Description</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Merchant</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Type</th>
                  <th className="text-right text-[11px] font-semibold text-ash-gray uppercase tracking-wider px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-4">
                    <div className="space-y-3 animate-pulse">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-mist-gray rounded-cards" />
                      ))}
                    </div>
                  </td></tr>
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
                              <span className="font-semibold text-sm text-ink-black">{tx.normalizedDescription || tx.merchant.displayName}</span>
                            </>
                          ) : (
                            <span className="text-slate-gray text-sm truncate max-w-[200px]" title={tx.narration || tx.normalizedDescription || ""}>
                              {tx.narration || tx.normalizedDescription || <span className="italic">—</span>}
                            </span>
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
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.type === "credit" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"
                        }`}>
                          {tx.type === "credit" ? "CREDIT" : "DEBIT"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-medium">
                        <span className={tx.type === "credit" ? "text-forest" : "text-error"}>
                          {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#ececec] flex items-center justify-between bg-mist-gray">
            <span className="text-xs text-ash-gray">
              Showing {(page - 1) * 100 + 1}-{Math.min(page * 100, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              {(() => {
                const totalPages = Math.ceil(total / 100);
                if (totalPages <= 1) return null;
                const pages: (number | "...")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 4) pages.push("...");
                  const start = Math.max(2, page - 2);
                  const end = Math.min(totalPages - 1, page + 2);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (page < totalPages - 3) pages.push("...");
                  pages.push(totalPages);
                }
                return (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    {pages.map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-ash-gray text-xs">...</span>
                      ) : (
                        <Button
                          key={p}
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 text-xs font-medium ${
                            page === p
                              ? "bg-forest text-lime-vibrant hover:bg-forest/90"
                              : "text-ash-gray hover:text-ink-black hover:bg-mist-gray"
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page * 100 >= total}>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Edit Sidebar */}
        <div className="lg:col-span-4 bg-paper-white border border-[#ececec] rounded-cards p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          <div className="flex items-center justify-between">
            <h3 className="font-signifier text-lg text-ink-black">Edit Transaction</h3>
            <div className="bg-forest p-1 rounded-lg">
              <BoltIcon className="h-4 w-4 text-lime-vibrant" />
            </div>
          </div>

          {selectedTx ? (
            <>
              {saveMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  saveMessage.type === "success" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"
                }`}>
                  {saveMessage.type === "success" ? <CheckIcon className="h-4 w-4" /> : <ExclamationCircleIcon className="h-4 w-4" />}
                  {saveMessage.text}
                </div>
              )}

              {/* Transaction Info */}
              <div className="p-4 bg-mist-gray rounded-lg border border-[#ececec]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ash-gray">Original Description</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    selectedTx.type === "credit" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"
                  }`}>
                    {selectedTx.type === "credit" ? "CREDIT" : "DEBIT"}
                  </span>
                </div>
                <p className="font-mono text-sm text-ink-black bg-paper-white p-2 rounded border border-[#ececec]">
                  {selectedTx.description}
                </p>
              </div>

              {/* Merchant Name */}
              <div>
                <Label className="text-xs font-semibold text-ink-black mb-1 block">Merchant Name</Label>
                {editingMerchant ? (
                  <div className="flex gap-2">
                    <Input
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="e.g. Shoprite"
                      className="bg-paper-white border-[#ececec] rounded-lg text-sm"
                    />
                    <Button size="sm" onClick={() => { setRuleForm({ ...ruleForm, normalizedMerchant: merchantName }); setEditingMerchant(false); }}>
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingMerchant(false)}>
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-black flex-1">{merchantName || "—"}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMerchant(true)}>
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Category Picker */}
              <div>
                <Label className="text-xs font-semibold text-ink-black mb-1 block">Category</Label>
                
                {/* Current Selection */}
                {ruleForm.categoryId && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-lime-vibrant/10 rounded-lg border border-lime/20">
                    {(() => {
                      const cat = categories.find(c => c.id === ruleForm.categoryId);
                      const parent = cat?.parentId ? categories.find(c => c.id === cat.parentId) : null;
                      return cat ? (
                        <span className="text-sm text-ink-black flex-1">
                          {parent && <span className="text-ash-gray">{parent.icon} {parent.name} → </span>}
                          {cat.icon} {cat.name}
                        </span>
                      ) : null;
                    })()}
                    <button
                      onClick={() => {
                        setRuleForm({ ...ruleForm, categoryId: "" });
                        setSelectedParentForPicker(null);
                        setCategorySearch("");
                      }}
                      className="p-0.5 hover:bg-lime-vibrant/20 rounded"
                    >
                      <XMarkIcon className="h-3 w-3 text-ash-gray" />
                    </button>
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-2">
                  <Input
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      if (e.target.value) setSelectedParentForPicker(null);
                    }}
                    placeholder="Search categories..."
                    className="bg-paper-white border-[#ececec] rounded-lg text-sm pr-8"
                  />
                  {categorySearch && (
                    <button
                      onClick={() => setCategorySearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-mist-gray rounded"
                    >
                      <XMarkIcon className="h-3 w-3 text-ash-gray" />
                    </button>
                  )}
                </div>

                {/* Category Grid / List */}
                <div className="border border-[#ececec] rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-paper-white">
                  {categorySearch ? (
                    /* Search Results */
                    (() => {
                      const q = categorySearch.toLowerCase();
                      const matches = categories.filter(c =>
                        c.name.toLowerCase().includes(q) ||
                        c.icon?.toLowerCase().includes(q)
                      );
                      if (matches.length === 0) {
                        return <div className="p-3 text-xs text-ash-gray text-center">No categories found</div>;
                      }
                      return matches.map(c => {
                        const parent = c.parentId ? categories.find(p => p.id === c.parentId) : null;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setRuleForm({ ...ruleForm, categoryId: c.id });
                              setCategorySearch("");
                              setSelectedParentForPicker(null);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-mist-gray transition-colors ${
                              ruleForm.categoryId === c.id ? "bg-lime-vibrant/10" : ""
                            }`}
                          >
                            <span>{c.icon}</span>
                            <span className="flex-1 truncate">{c.name}</span>
                            {parent && (
                              <span className="text-[10px] text-ash-gray truncate">{parent.icon} {parent.name}</span>
                            )}
                          </button>
                        );
                      });
                    })()
                  ) : selectedParentForPicker ? (
                    /* Subcategories of Selected Parent */
                    (() => {
                      const parent = categories.find(c => c.id === selectedParentForPicker);
                      const children = categories.filter(c => c.parentId === selectedParentForPicker);
                      const grandchildren = categories.filter(c => c.parentId && children.some(ch => ch.id === c.parentId));
                      
                      return (
                        <>
                          <button
                            onClick={() => setSelectedParentForPicker(null)}
                            className="w-full px-3 py-2 text-left text-sm text-ash-gray hover:bg-mist-gray flex items-center gap-2 border-b border-[#ececec]"
                          >
                            ← Back to categories
                          </button>
                          <button
                            onClick={() => {
                              setRuleForm({ ...ruleForm, categoryId: selectedParentForPicker });
                              setSelectedParentForPicker(null);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-lime-vibrant/10 transition-colors font-medium ${
                              ruleForm.categoryId === selectedParentForPicker ? "bg-lime-vibrant/10" : ""
                            }`}
                          >
                            <span>{parent?.icon}</span>
                            <span>{parent?.name}</span>
                            <span className="text-[10px] text-ash-gray ml-auto">Select this</span>
                          </button>
                          {children.map(child => (
                            <div key={child.id}>
                              <button
                                onClick={() => {
                                  setRuleForm({ ...ruleForm, categoryId: child.id });
                                  setSelectedParentForPicker(null);
                                }}
                                className={`w-full px-3 py-2 pl-6 text-left text-sm flex items-center gap-2 hover:bg-mist-gray transition-colors ${
                                  ruleForm.categoryId === child.id ? "bg-lime-vibrant/10" : ""
                                }`}
                              >
                                <span>{child.icon}</span>
                                <span className="flex-1">{child.name}</span>
                                {grandchildren.some(gc => gc.parentId === child.id) && (
                                  <ChevronRightIcon className="h-3 w-3 text-ash-gray" />
                                )}
                              </button>
                              {grandchildren.filter(gc => gc.parentId === child.id).map(gc => (
                                <button
                                  key={gc.id}
                                  onClick={() => {
                                    setRuleForm({ ...ruleForm, categoryId: gc.id });
                                    setSelectedParentForPicker(null);
                                  }}
                                  className={`w-full px-3 py-1.5 pl-10 text-left text-xs flex items-center gap-2 hover:bg-mist-gray transition-colors ${
                                    ruleForm.categoryId === gc.id ? "bg-lime-vibrant/10" : ""
                                  }`}
                                >
                                  <span>{gc.icon}</span>
                                  <span>{gc.name}</span>
                                </button>
                              ))}
                            </div>
                          ))}
                          {children.length === 0 && (
                            <div className="px-3 py-2 text-xs text-ash-gray">No subcategories</div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    /* Parent Categories */
                    (() => {
                      const parents = categories.filter(c => !c.parentId);
                      return parents.map(parent => {
                        const childCount = categories.filter(c => c.parentId === parent.id).length;
                        return (
                          <button
                            key={parent.id}
                            onClick={() => setSelectedParentForPicker(parent.id)}
                            className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-mist-gray transition-colors"
                          >
                            <span className="text-lg">{parent.icon}</span>
                            <span className="flex-1 font-medium">{parent.name}</span>
                            <span className="text-[10px] text-ash-gray">{childCount} sub</span>
                            <ChevronRightIcon className="h-3 w-3 text-ash-gray" />
                          </button>
                        );
                      });
                    })()
                  )}
                  {/* Inline Create Button */}
                  {!categorySearch && (
                    <button
                      onClick={() => window.location.href = "/dashboard/settings/categories"}
                      className="w-full px-3 py-2 text-left text-xs text-forest hover:bg-lime-vibrant/10 flex items-center gap-2 border-t border-[#ececec] font-medium"
                    >
                      <PlusIcon className="h-3 w-3" /> Create new category
                    </button>
                  )}
                </div>
              </div>

              {/* Mark as Transfer */}
              <div className="p-4 bg-lime-vibrant/10 rounded-lg border border-lime/20">
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

              {/* Notes & Tags */}
              <div>
                <Label className="text-xs font-semibold text-ink-black mb-1 block">Notes</Label>
                <textarea
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  onBlur={async () => {
                    if (!selectedTx) return;
                    try {
                      await fetch(`/api/transactions/${selectedTx.id}/notes`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ notes: txNotes }),
                      });
                      setSelectedTx(prev => prev ? { ...prev, notes: txNotes } : prev);
                    } catch (err) {
                      console.error("Failed to save notes:", err);
                    }
                  }}
                  placeholder="Add notes about this transaction..."
                  rows={3}
                  className="bg-paper-white border border-[#ececec] rounded-lg text-sm w-full p-2 resize-none"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-ink-black mb-1 block">Tags</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {txTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-lime-vibrant/20 text-forest text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={async () => {
                          const newTags = txTags.filter(t => t !== tag);
                          setTxTags(newTags);
                          if (selectedTx) {
                            try {
                              await fetch(`/api/transactions/${selectedTx.id}/notes`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tags: newTags }),
                              });
                              setSelectedTx(prev => prev ? { ...prev, tags: JSON.stringify(newTags) } : prev);
                            } catch (err) {
                              console.error("Failed to save tags:", err);
                            }
                          }
                        }}
                        className="text-forest/60 hover:text-forest"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && tagInput.trim()) {
                          e.preventDefault();
                          const newTags = [...txTags, tagInput.trim()];
                          setTxTags(newTags);
                          setTagInput("");
                          if (selectedTx) {
                            try {
                              await fetch(`/api/transactions/${selectedTx.id}/notes`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tags: newTags }),
                              });
                              setSelectedTx(prev => prev ? { ...prev, tags: JSON.stringify(newTags) } : prev);
                            } catch (err) {
                              console.error("Failed to save tags:", err);
                            }
                          }
                        }
                      }}
                      placeholder="Add tag..."
                      className="bg-transparent border-none text-xs p-0 w-20 focus:outline-none placeholder:text-ash-gray"
                    />
                  </div>
                </div>
              </div>

              {/* Similar Transactions */}
              {showSimilar && similarTxs.filter(s => !dismissedIds.has(s.id)).length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">
                      {getFilteredSimilar().length} Similar Found
                      {getFilteredSimilar().length !== similarTxs.filter(s => !dismissedIds.has(s.id)).length && (
                        <span className="font-normal text-blue-600"> (filtered from {similarTxs.filter(s => !dismissedIds.has(s.id)).length})</span>
                      )}
                    </p>
                  </div>
                  {/* Filter controls */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <select
                      value={similarFilterType}
                      onChange={e => setSimilarFilterType(e.target.value as "all" | "debit" | "credit")}
                      className="text-[10px] px-1.5 py-0.5 border border-blue-200 rounded bg-white text-blue-800"
                    >
                      <option value="all">All Types</option>
                      <option value="debit">Debit Only</option>
                      <option value="credit">Credit Only</option>
                    </select>
                    <select
                      value={similarFilterOp}
                      onChange={e => setSimilarFilterOp(e.target.value as "all" | "gt" | "lt" | "eq")}
                      className="text-[10px] px-1.5 py-0.5 border border-blue-200 rounded bg-white text-blue-800"
                    >
                      <option value="all">Any Amount</option>
                      <option value="gt">{">"} Amount</option>
                      <option value="lt">{"<"} Amount</option>
                      <option value="eq">= Amount</option>
                    </select>
                    {similarFilterOp !== "all" && (
                      <input
                        type="number"
                        placeholder="Amount"
                        value={similarFilterAmount}
                        onChange={e => setSimilarFilterAmount(e.target.value)}
                        className="text-[10px] px-1.5 py-0.5 border border-blue-200 rounded bg-white text-blue-800 w-20"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {getFilteredSimilar().map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-blue-100/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-blue-900 truncate">{s.description}</p>
                          <p className="text-blue-600 text-[10px]">{s.matchReason}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className={`font-mono ${s.type === "credit" ? "text-forest" : "text-error"}`}>
                            {s.type === "credit" ? "+" : "-"}{formatCurrency(s.amount)}
                          </span>
                          <button
                            onClick={() => setDismissedIds(prev => new Set([...prev, s.id]))}
                            className="p-0.5 hover:bg-blue-200 rounded text-blue-400 hover:text-blue-700"
                            title="Remove"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex flex-col gap-3 border-t border-[#ececec]">
                <Button onClick={handleSave} className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#ececec]"
                  onClick={() => {
                    const desc = selectedTx.description;
                    const pattern = desc.length > 30 ? desc.substring(0, 30) : desc;
                    window.open(
                      `/dashboard/settings/rules?create=1&pattern=${encodeURIComponent(pattern)}&categoryId=${ruleForm.categoryId || ""}`,
                      "_blank"
                    );
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Rule from This
                </Button>
                {undoStack.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={handleUndo} disabled={saving}>
                    Undo last change ({undoStack.length})
                  </Button>
                )}
                <Button variant="ghost" className="w-full text-ash-gray" onClick={() => { setSelectedTx(null); setShowSimilar(false); }}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div className="text-ash-gray">
                <BoltIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a transaction to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
