"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Target } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", deadline: "" });

  useEffect(() => {
    if (user) fetchGoals();
  }, [user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?userId=${user?.id || ""}`);
      if (res.ok) setGoals(await res.json());
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          deadline: form.deadline || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", targetAmount: "", deadline: "" });
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white border-gray-100">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-700">Goal Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <Label className="text-gray-700">Target Amount (₦)</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                  placeholder="1000000"
                />
              </div>
              <div>
                <Label className="text-gray-700">Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="bg-gray-50 border-gray-200 text-gray-700 rounded-xl"
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading goals...</div>
      ) : goals.length === 0 ? (
        <Card className="bg-white border-gray-100">
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No savings goals yet</p>
            <p className="text-sm text-gray-400">Create a goal to start tracking your progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            return (
              <Card key={goal.id} className="bg-white border-gray-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{goal.name}</div>
                      {goal.deadline && (
                        <div className="text-xs text-gray-500">
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-3" />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-700">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-gray-500">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="text-center mt-2 text-sm text-emerald-600 font-medium">
                    {percentage.toFixed(1)}% saved
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
