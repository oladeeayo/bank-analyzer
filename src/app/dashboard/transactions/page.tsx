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
}

export default function TransactionsPage() {
  const { user, loading: userLoading } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ merchantId: "", categoryId: "" });

  useEffect(() => {
    if (user) fetchTransactions();
  }, [search, filterType, page, user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;

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
      <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-white border-gray-200 text-gray-700 rounded-xl"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="">All Types</option>
          <option value="debit">Debits</option>
          <option value="credit">Credits</option>
        </select>
      </div>

      {/* Transactions List */}
      <Card className="bg-white border-gray-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No transactions found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50/50 flex items-center gap-4 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                    {tx.type === "credit" ? (
                      <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {tx.merchant?.displayName || tx.normalizedDescription || tx.description}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {tx.bank.nickname || tx.bank.bankName} • {formatDate(tx.date)}
                    </div>
                  </div>
                  {tx.category && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-lg">
                      {tx.category.icon} {tx.category.name}
                    </Badge>
                  )}
                  <div className={`text-right font-medium ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                    {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
        <div className="text-sm text-gray-500">
          Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-gray-200 text-gray-700 rounded-xl"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * 50 >= total}
            className="border-gray-200 text-gray-700 rounded-xl"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={() => setEditTx(null)}>
        <DialogContent className="bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-gray-900">{editTx.description}</div>
                <div className="text-sm text-gray-500">
                  {formatCurrency(editTx.amount)} • {formatDate(editTx.date)}
                </div>
              </div>
              <div>
                <Label className="text-gray-700">Category ID</Label>
                <Input
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="Category ID"
                />
              </div>
              <div>
                <Label className="text-gray-700">Merchant ID</Label>
                <Input
                  value={editForm.merchantId}
                  onChange={(e) => setEditForm({ ...editForm, merchantId: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="Merchant ID"
                />
              </div>
              <Button onClick={handleEdit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
