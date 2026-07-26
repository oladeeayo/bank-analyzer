"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

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
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ merchantId: "", categoryId: "" });

  useEffect(() => {
    fetchTransactions();
  }, [search, filterType, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: "demo",
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

  const handleEdit = async () => {
    if (!editTx) return;

    try {
      const res = await fetch(`/api/transactions/${editTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditTx(null);
        fetchTransactions();
      }
    } catch (err) {
      console.error("Failed to update transaction:", err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Transactions</h1>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
        >
          <option value="">All Types</option>
          <option value="debit">Debits</option>
          <option value="credit">Credits</option>
        </select>
      </div>

      {/* Transactions List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No transactions found</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-slate-700/50 flex items-center gap-4">
                  <div className={`p-2 rounded-full ${tx.type === "credit" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                    {tx.type === "credit" ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {tx.merchant?.displayName || tx.normalizedDescription || tx.description}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {tx.bank.nickname || tx.bank.bankName} • {formatDate(tx.date)}
                    </div>
                  </div>
                  {tx.category && (
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                      {tx.category.icon} {tx.category.name}
                    </Badge>
                  )}
                  <div className={`text-right font-medium ${tx.type === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white"
                    onClick={() => setEditTx(tx)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-slate-700 text-white"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * 50 >= total}
            className="border-slate-700 text-white"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={() => setEditTx(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-white">{editTx.description}</div>
                <div className="text-sm text-slate-400">
                  {formatCurrency(editTx.amount)} • {formatDate(editTx.date)}
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Category ID</Label>
                <Input
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Category ID"
                />
              </div>
              <div>
                <Label className="text-slate-300">Merchant ID</Label>
                <Input
                  value={editForm.merchantId}
                  onChange={(e) => setEditForm({ ...editForm, merchantId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Merchant ID"
                />
              </div>
              <Button onClick={handleEdit} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
