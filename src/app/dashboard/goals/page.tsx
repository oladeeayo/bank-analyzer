"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", deadline: "" });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals?userId=demo");
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
          userId: "demo",
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
        <h1 className="text-3xl font-bold text-white">Savings Goals</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Goal Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <Label className="text-slate-300">Target Amount (₦)</Label>
                <Input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="1000000"
                />
              </div>
              <div>
                <Label className="text-slate-300">Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading goals...</div>
      ) : goals.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No savings goals yet</p>
            <p className="text-sm text-slate-500">Create a goal to start tracking your progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            return (
              <Card key={goal.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <div className="font-medium text-white">{goal.name}</div>
                      {goal.deadline && (
                        <div className="text-xs text-slate-400">
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-3" />
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-slate-300">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-slate-400">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="text-center mt-2 text-sm text-emerald-400 font-medium">
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
