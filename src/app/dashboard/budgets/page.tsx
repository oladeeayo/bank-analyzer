"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Budget {
  id: string;
  limit: number;
  category: { name: string; icon: string; color: string };
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: "", limit: "" });
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`/api/budgets?userId=demo&month=${month}&year=${year}`);
      if (res.ok) setBudgets(await res.json());
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo",
          categoryId: form.categoryId,
          month,
          year,
          limit: parseFloat(form.limit),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ categoryId: "", limit: "" });
        fetchBudgets();
      }
    } catch (err) {
      console.error("Failed to create budget:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Budgets</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> Set Budget
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label className="text-slate-300">Category ID</Label>
                <Input
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Category ID"
                />
              </div>
              <div className="flex-1">
                <Label className="text-slate-300">Monthly Limit (₦)</Label>
                <Input
                  type="number"
                  value={form.limit}
                  onChange={(e) => setForm({ ...form, limit: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="150000"
                />
              </div>
              <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700">
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-16 text-center">
            <p className="text-slate-400 mb-4">No budgets set for this month</p>
            <p className="text-sm text-slate-500">Create a budget to track your spending limits</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const spent = 0; // Would need to query actual spending
            const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
            return (
              <Card key={budget.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{budget.category.icon}</span>
                      <span className="font-medium text-white">{budget.category.name}</span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>{percentage.toFixed(0)}% used</span>
                    <span>{formatCurrency(budget.limit - spent)} remaining</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
