"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Calendar, Wand2, ChevronLeft, ChevronRight, Check, AlertCircle, Plus, X, Link, Edit } from "lucide-react";
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
  merchantId: string | null;
  categoryId: string | null;
  bank: { bankName: string; nickname: string | null };
  merchant: { id: string; displayName: string; icon: string; color: string } | null;
  category: { id: string; name: string; icon: string; color: string } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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

export default function TransactionsPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [similarTxs, setSimilarTxs] = useState<SimilarTransaction[]>([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState("");
  const [editingMerchant, setEditingMerchant] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [ruleForm, setRuleForm] = useState({
    normalizedMerchant: "",
    categoryId: "",
    markTransfer: false,
  });

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCategories();
    }
  }, [search, filterType, page, user]);

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

  const findSimilarTransactions = useCallback((tx: Transaction) => {
    const similar: SimilarTransaction[] = [];
    const txDesc = tx.normalizedDescription || tx.description;
    const txWords = txDesc.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    for (const other of transactions) {
      if (other.id === tx.id) continue;

      const otherDesc = other.normalizedDescription || other.description;
      const otherWords = otherDesc.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      let matchCount = 0;
      const matchedWords: string[] = [];
      for (const tw of txWords) {
        for (const ow of otherWords) {
          if (tw === ow || tw.includes(ow) || ow.includes(tw)) {
            matchCount++;
            matchedWords.push(tw);
            break;
          }
        }
      }

      if (tx.type === other.type && matchCount >= 2) {
        similar.push({
          id: other.id,
          description: otherDesc,
          amount: other.amount,
          type: other.type,
          date: other.date,
          matchReason: `Words: ${matchedWords.join(", ")}`,
        });
      } else if (tx.type === other.type && tx.merchantId && tx.merchantId === other.merchantId) {
        similar.push({
          id: other.id,
          description: otherDesc,
          amount: other.amount,
          type: other.type,
          date: other.date,
          matchReason: "Same merchant",
        });
      } else if (tx.type !== other.type && Math.abs(tx.amount - other.amount) / tx.amount < 0.01) {
        similar.push({
          id: other.id,
          description: otherDesc,
          amount: other.amount,
          type: other.type,
          date: other.date,
          matchReason: "Potential transfer (same amount)",
        });
      }
    }

    setSimilarTxs(similar);
    setShowSimilar(similar.length > 0);
  }, [transactions]);

  const handleSave = async () => {
    if (!selectedTx) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      let categoryId = ruleForm.categoryId;

      // Create new category if needed
      if (showNewCategory && newCategoryName) {
        const catRes = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            name: newCategoryName,
            icon: "📁",
            color: "#6B7280",
          }),
        });
        if (catRes.ok) {
          const newCat = await catRes.json();
          categoryId = newCat.id;
          fetchCategories();
        }
      }

      // Create new subcategory if needed
      if (showNewSubcategory && newSubcategoryName && selectedParentCategoryId) {
        const subRes = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            name: newSubcategoryName,
            icon: "📁",
            color: "#6B7280",
            parentId: selectedParentCategoryId,
          }),
        });
        if (subRes.ok) {
          const newSub = await subRes.json();
          categoryId = newSub.id;
          fetchCategories();
        }
      }

      const res = await fetch(`/api/transactions/${selectedTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: selectedTx.merchantId || null,
          categoryId: categoryId || null,
          normalizedDescription: merchantName || ruleForm.normalizedMerchant || undefined,
          isTransfer: ruleForm.markTransfer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveMessage({
          type: "success",
          text: `Saved! ${data.updatedSimilarCount > 0 ? `${data.updatedSimilarCount} similar updated.` : ""}`,
        });
        fetchTransactions();
        setTimeout(() => {
          setSelectedTx(null);
          setSaveMessage(null);
          setShowSimilar(false);
          setShowNewCategory(false);
          setShowNewSubcategory(false);
        }, 2000);
      } else {
        setSaveMessage({ type: "error", text: "Failed to save." });
      }
    } catch (err) {
      setSaveMessage({ type: "error", text: "Network error." });
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
      markTransfer: false,
    });
    setMerchantName(tx.merchant?.displayName || "");
    setEditingMerchant(false);
    setSaveMessage(null);
    setNewCategoryName("");
    setShowNewCategory(false);
    setNewSubcategoryName("");
    setShowNewSubcategory(false);
    setSelectedParentCategoryId("");
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

  // Build nested category options
  const renderCategoryOptions = () => {
    const options: JSX.Element[] = [];
    
    // Root categories (no parentId)
    const rootCats = categories.filter(c => !c.parentId);
    
    for (const root of rootCats) {
      // Add root category
      options.push(
        <option key={root.id} value={root.id}>
          {root.icon} {root.name}
        </option>
      );
      
      // Add children (subcategories)
      const children = categories.filter(c => c.parentId === root.id);
      for (const child of children) {
        options.push(
          <option key={child.id} value={child.id}>
            &nbsp;&nbsp;└ {child.icon} {child.name}
          </option>
        );
        
        // Add grandchildren
        const grandchildren = categories.filter(c => c.parentId === child.id);
        for (const gc of grandchildren) {
          options.push(
            <option key={gc.id} value={gc.id}>
              &nbsp;&nbsp;&nbsp;&nbsp;└ {gc.icon} {gc.name}
            </option>
          );
        }
      }
    }
    
    return options;
  };

  const parentCategories = categories.filter(c => !c.parentId && c.isSystem);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-signifier text-[28px] text-ink-black">Cleaning Rules Engine</h1>
        <p className="text-sm text-ash-gray">Standardizing messy transaction data</p>
      </div>

      <div className="bg-paper-white border border-[#ececec] rounded-cards p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-mist-gray rounded-lg border border-[#ececec]">
          <Calendar className="h-4 w-4 text-slate-gray" />
          <span className="text-sm text-ink-black">Oct 1, 2023 - Oct 31, 2023</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <select
              onChange={(e) => handleBulkCategory(e.target.value)}
              className="bg-paper-white border border-[#ececec] rounded-lg px-3 py-1.5 text-sm"
              value=""
            >
              <option value="">Bulk: Set Category ({selectedIds.size} selected)</option>
              {renderCategoryOptions()}
            </select>
          )}
        </div>
      </div>

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
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-ash-gray text-sm">Loading...</td></tr>
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
                            <span className="italic text-slate-gray text-sm">—</span>
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
              Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
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

        {/* Edit Sidebar */}
        <div className="col-span-12 lg:col-span-4 bg-paper-white border border-[#ececec] rounded-cards p-6 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          <div className="flex items-center justify-between">
            <h3 className="font-signifier text-lg text-ink-black">Edit Transaction</h3>
            <div className="bg-forest p-1 rounded-lg">
              <Wand2 className="h-4 w-4 text-lime-vibrant" />
            </div>
          </div>

          {selectedTx ? (
            <>
              {saveMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  saveMessage.type === "success" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"
                }`}>
                  {saveMessage.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
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
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingMerchant(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-black flex-1">{merchantName || "—"}</span>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMerchant(true)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <Label className="text-xs font-semibold text-ink-black mb-1 block">Category</Label>
                <select
                  value={showNewCategory ? "__new__" : showNewSubcategory ? "__new_sub__" : ruleForm.categoryId}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewCategory(true);
                      setShowNewSubcategory(false);
                      setRuleForm({ ...ruleForm, categoryId: "" });
                    } else if (e.target.value === "__new_sub__") {
                      setShowNewSubcategory(true);
                      setShowNewCategory(false);
                      setRuleForm({ ...ruleForm, categoryId: "" });
                    } else {
                      setShowNewCategory(false);
                      setShowNewSubcategory(false);
                      setRuleForm({ ...ruleForm, categoryId: e.target.value });
                    }
                  }}
                  className="w-full bg-paper-white border border-[#ececec] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-lime-vibrant/50"
                >
                  <option value="">Select category...</option>
                  {renderCategoryOptions()}
                  <option value="__new__">+ Create New Category</option>
                  <option value="__new_sub__">+ Create New Subcategory</option>
                </select>

                {showNewCategory && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="bg-paper-white border-[#ececec] rounded-lg text-sm"
                    />
                    <Button size="sm" onClick={() => { if (newCategoryName) setShowNewCategory(false); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {showNewSubcategory && (
                  <div className="space-y-2 mt-2">
                    <select
                      value={selectedParentCategoryId}
                      onChange={(e) => setSelectedParentCategoryId(e.target.value)}
                      className="w-full bg-paper-white border border-[#ececec] rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select parent category...</option>
                      {parentCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Input
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Subcategory name"
                        className="bg-paper-white border-[#ececec] rounded-lg text-sm"
                      />
                      <Button size="sm" onClick={() => { if (newSubcategoryName && selectedParentCategoryId) setShowNewSubcategory(false); }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
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

              {/* Similar Transactions */}
              {showSimilar && similarTxs.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">
                      {similarTxs.length} Similar Found
                    </p>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {similarTxs.slice(0, 5).map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-blue-900 truncate">{s.description}</p>
                          <p className="text-blue-600 text-[10px]">{s.matchReason}</p>
                        </div>
                        <span className={`ml-2 font-mono ${s.type === "credit" ? "text-forest" : "text-error"}`}>
                          {s.type === "credit" ? "+" : "-"}{formatCurrency(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex flex-col gap-3 border-t border-[#ececec]">
                <Button onClick={handleSave} className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save & Apply to Similar"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setSelectedTx(null); setShowSimilar(false); }}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div className="text-ash-gray">
                <Wand2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a transaction to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
