"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PlusIcon, FlagIcon } from "@heroicons/react/24/outline";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  icon: string;
  isCompleted: boolean;
}

export default function GoalsPage() {
  const { user, loading: userLoading } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", deadline: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string; targetAmount?: string; deadline?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  if (userLoading || !user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="h-9 w-48 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-paper-white border-[#ececec]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded-xl animate-pulse mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const fetchGoals = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/goals?userId=${user?.id || ""}`);
      if (res.ok) {
        setGoals(await res.json());
      } else {
        setError("Failed to load goals. Please try again.");
      }
    } catch (err) {
      setError("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; targetAmount?: string; deadline?: string } = {};

    if (!form.name.trim()) {
      errors.name = "Goal name is required";
    }

    const amount = parseFloat(form.targetAmount);
    if (!form.targetAmount || isNaN(amount) || amount <= 0) {
      errors.targetAmount = "Target amount must be a positive number";
    }

    if (form.deadline) {
      const deadlineDate = new Date(form.deadline);
      if (deadlineDate <= new Date()) {
        errors.deadline = "Deadline must be in the future";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          name: form.name.trim(),
          targetAmount: parseFloat(form.targetAmount),
          deadline: form.deadline || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", targetAmount: "", deadline: "" });
        setFormErrors({});
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = form.name.trim() !== "" && parseFloat(form.targetAmount) > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink-black">Savings Goals</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setFormErrors({});
          }}
          className="bg-forest hover:bg-forest/90 text-white rounded-xl"
        >
          <PlusIcon className="h-4 w-4 mr-2" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-ink-black">Goal Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`bg-gray-50 border-gray-200 text-ink-black rounded-xl ${formErrors.name ? "border-red-500" : ""}`}
                  placeholder="e.g., Emergency Fund"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <Label className="text-ink-black">Target Amount (₦)</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  className={`bg-gray-50 border-gray-200 text-ink-black rounded-xl ${formErrors.targetAmount ? "border-red-500" : ""}`}
                  placeholder="1000000"
                />
                {formErrors.targetAmount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.targetAmount}</p>
                )}
              </div>
              <div>
                <Label className="text-ink-black">Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className={`bg-gray-50 border-gray-200 text-ink-black rounded-xl ${formErrors.deadline ? "border-red-500" : ""}`}
                />
                {formErrors.deadline && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.deadline}</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={!isFormValid || submitting}
              className="mt-4 bg-forest hover:bg-forest/90 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Goal"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="py-12 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={fetchGoals}
              className="bg-forest hover:bg-forest/90 text-white rounded-xl"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-paper-white border-[#ececec]">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="h-4 w-16 bg-gray-200 rounded-xl animate-pulse mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !error && goals.length === 0 ? (
        <Card className="bg-paper-white border-[#ececec]">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
              <FlagIcon className="h-8 w-8 text-forest" />
            </div>
            <h3 className="text-lg font-medium text-ink-black mb-2">No savings goals yet</h3>
            <p className="text-ash-gray mb-6 max-w-sm mx-auto">
              Create your first goal to start tracking your savings progress and stay motivated.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-forest hover:bg-forest/90 text-white rounded-xl"
            >
              <PlusIcon className="h-4 w-4 mr-2" /> Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        !error && (
          <div className="grid md:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              return (
                <Card key={goal.id} className="bg-paper-white border-[#ececec] hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <div className="font-medium text-ink-black">{goal.name}</div>
                        {goal.deadline && (
                          <div className="text-xs text-ash-gray">
                            Deadline: {new Date(goal.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-3" />
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-ink-black">{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-ash-gray">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="text-center mt-2 text-sm text-forest font-medium">
                      {percentage.toFixed(1)}% saved
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
