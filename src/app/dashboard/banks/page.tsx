"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, FileText, ArrowLeftRight } from "lucide-react";
import { BANKS } from "@/lib/constants";

interface Bank {
  id: string;
  bankName: string;
  accountName: string | null;
  accountNumber: string | null;
  nickname: string | null;
  openingBalance: number;
  currency: string;
  _count: { transactions: number; statements: number };
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    nickname: "",
    openingBalance: "",
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks?userId=demo");
      if (res.ok) {
        setBanks(await res.json());
      }
    } catch (_err) {
      console.error("Failed to fetch banks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          ...form,
          openingBalance: parseFloat(form.openingBalance) || 0,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        setForm({ bankName: "", accountName: "", accountNumber: "", nickname: "", openingBalance: "" });
        fetchBanks();
      }
    } catch (_err) {
      console.error("Failed to create bank:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all transactions for this bank.")) return;

    try {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (res.ok) fetchBanks();
    } catch (_err) {
      console.error("Failed to delete bank:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Banks</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Bank</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Bank Name</Label>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                >
                  <option value="">Select bank</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-slate-300">Account Name</Label>
                <Input
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., John Doe Savings"
                />
              </div>
              <div>
                <Label className="text-slate-300">Account Number</Label>
                <Input
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label className="text-slate-300">Nickname</Label>
                <Input
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., GT Salary"
                />
              </div>
              <div>
                <Label className="text-slate-300">Opening Balance (₦)</Label>
                <Input
                  type="number"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="0"
                />
              </div>
              <Button onClick={handleCreate} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Add Bank
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading banks...</div>
      ) : banks.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No banks added yet</h3>
            <p className="text-slate-400 mb-4">Add your first bank to start tracking transactions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <Card key={bank.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    <CardTitle className="text-white text-lg">{bank.nickname || bank.bankName}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {bank.bankName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {bank.accountName && (
                    <div className="text-slate-300">{bank.accountName}</div>
                  )}
                  {bank.accountNumber && (
                    <div className="text-slate-400">••••{bank.accountNumber.slice(-4)}</div>
                  )}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1 text-slate-400">
                      <ArrowLeftRight className="h-4 w-4" />
                      <span>{bank._count.transactions} transactions</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <FileText className="h-4 w-4" />
                      <span>{bank._count.statements} statements</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(bank.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
