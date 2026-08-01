"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PlusIcon, WalletIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";

interface Budget {
  id: string;
  limit: number;
  category: { name: string; icon: string; color: string };
}

interface FormErrors {
  categoryId?: string;
  limit?: string;
}

export default function BudgetsPage() {
  const { user, loading: userLoading } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: "", limit: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    if (user) fetchBudgets();
  }, [user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets?userId=${user?.id || ""}&month=${month}&year=${year}`);
      if (res.ok) {
        setBudgets(await res.json());
      } else {
        throw new Error("Failed to fetch budgets");
      }
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      setError("Failed to load budgets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const limit = parseFloat(form.limit);

    if (!form.categoryId.trim()) {
      errors.categoryId = "Please select a category";
    }

    if (!form.limit.trim()) {
      errors.limit = "Please enter a budget limit";
    } else if (isNaN(limit) || limit <= 0) {
      errors.limit = "Limit must be a positive number greater than 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          categoryId: form.categoryId,
          month,
          year,
          limit: parseFloat(form.limit),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ categoryId: "", limit: "" });
        setFormErrors({});
        fetchBudgets();
      }
    } catch (err) {
      console.error("Failed to create budget:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-black">Budgets</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-forest hover:bg-forest/90 text-white rounded-xl">
          <PlusIcon className="h-4 w-4 mr-2" /> Set Budget
        </Button>
      </div>

      {showForm && (
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="flex-1">
                <Label className="text-ink-black">Category ID</Label>
                <Input
                  value={form.categoryId}
                  onChange={(e) => {
                    setForm({ ...form, categoryId: e.target.value });
                    if (formErrors.categoryId) setFormErrors({ ...formErrors, categoryId: undefined });
                  }}
                  className={`bg-gray-50 border-gray-200 text-ink-black rounded-xl ${formErrors.categoryId ? "border-red-500" : ""}`}
                  placeholder="Category ID"
                />
                {formErrors.categoryId && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.categoryId}</p>
                )}
              </div>
              <div className="flex-1">
                <Label className="text-ink-black">Monthly Limit (₦)</Label>
                <Input
                  type="number"
                  value={form.limit}
                  onChange={(e) => {
                    setForm({ ...form, limit: e.target.value });
                    if (formErrors.limit) setFormErrors({ ...formErrors, limit: undefined });
                  }}
                  className={`bg-gray-50 border-gray-200 text-ink-black rounded-xl ${formErrors.limit ? "border-red-500" : ""}`}
                  placeholder="150000"
                />
                {formErrors.limit && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.limit}</p>
                )}
              </div>
              <Button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-forest hover:bg-forest/90 text-white rounded-xl disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-cards p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchBudgets} className="rounded-xl">
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-paper-white border-[#ececec]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-mist-gray rounded-lg animate-pulse" />
                    <div className="h-5 w-24 bg-mist-gray rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-32 bg-mist-gray rounded animate-pulse" />
                </div>
                <div className="h-2 bg-mist-gray rounded-full animate-pulse" />
                <div className="flex justify-between mt-2">
                  <div className="h-3 w-12 bg-mist-gray rounded animate-pulse" />
                  <div className="h-3 w-20 bg-mist-gray rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="py-16 text-center">
            <WalletIcon className="h-16 w-16 text-ash-gray/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink-black mb-2">No budgets set for this month</h3>
            <p className="text-ash-gray mb-6 max-w-sm mx-auto">
              Create a budget to track your spending limits for each category
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-forest hover:bg-forest/90 text-white rounded-xl">
              <PlusIcon className="h-4 w-4 mr-2" /> Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const spent = 0;
            const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
            return (
              <Card key={budget.id} className="bg-paper-white border-[#ececec] hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{budget.category.icon}</span>
                      <span className="font-medium text-ink-black">{budget.category.name}</span>
                    </div>
                    <span className="text-sm text-ash-gray">
                      {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-ash-gray">
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
