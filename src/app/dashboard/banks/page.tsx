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
import { useUser } from "@/lib/hooks";

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
  const { user, loading: userLoading } = useUser();
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
    if (user) fetchBanks();
  }, [user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?userId=${user?.id || ""}`);
      if (res.ok) {
        setBanks(await res.json());
      }
    } catch (err) {
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
          userId: user?.id || "",
          ...form,
          openingBalance: parseFloat(form.openingBalance) || 0,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        setForm({ bankName: "", accountName: "", accountNumber: "", nickname: "", openingBalance: "" });
        fetchBanks();
      }
    } catch (err) {
      console.error("Failed to create bank:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all transactions for this bank.")) return;

    try {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (res.ok) fetchBanks();
    } catch (err) {
      console.error("Failed to delete bank:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Banks</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add New Bank</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Bank Name</Label>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full mt-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select bank</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-gray-700">Account Name</Label>
                <Input
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="e.g., John Doe Savings"
                />
              </div>
              <div>
                <Label className="text-gray-700">Account Number</Label>
                <Input
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label className="text-gray-700">Nickname</Label>
                <Input
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="e.g., GT Salary"
                />
              </div>
              <div>
                <Label className="text-gray-700">Opening Balance (₦)</Label>
                <Input
                  type="number"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="0"
                />
              </div>
              <Button onClick={handleCreate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Add Bank
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading banks...</div>
      ) : banks.length === 0 ? (
        <Card className="bg-white border-gray-100">
          <CardContent className="py-16 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No banks added yet</h3>
            <p className="text-gray-500 mb-4">Add your first bank to start tracking transactions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <Card key={bank.id} className="bg-white border-gray-100 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-gray-900 text-lg">{bank.nickname || bank.bankName}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-lg">
                    {bank.bankName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {bank.accountName && (
                    <div className="text-gray-700">{bank.accountName}</div>
                  )}
                  {bank.accountNumber && (
                    <div className="text-gray-500">••••{bank.accountNumber.slice(-4)}</div>
                  )}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1 text-gray-500">
                      <ArrowLeftRight className="h-4 w-4" />
                      <span>{bank._count.transactions} transactions</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span>{bank._count.statements} statements</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
