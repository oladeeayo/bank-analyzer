"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/lib/hooks";

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleClearData = async () => {
    if (!user) return;
    if (!confirm("Are you sure? This will permanently delete ALL transactions, statements, merchants, categories, and rules. This cannot be undone.")) return;

    setClearing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "All data cleared." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to clear data." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setClearing(false);
    }
  };

  const handleClearStatements = async () => {
    if (!user) return;
    if (!confirm("Delete all uploaded statements and their transactions?")) return;

    setClearing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/clear-statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "All statements cleared." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to clear statements." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setClearing(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/settings/export?userId=${user.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transactions.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-signifier text-[28px] text-ink-black">Settings</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-lime-vibrant/20 text-forest" : "bg-error/10 text-error"
        }`}>
          {message.text}
        </div>
      )}

      <Card className="bg-paper-white border-[#ececec] rounded-cards">
        <CardHeader>
          <CardTitle className="text-ink-black">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-ash-gray">Name</label>
            <p className="text-ink-black">{user?.name || "—"}</p>
          </div>
          <div>
            <label className="text-sm text-ash-gray">Email</label>
            <p className="text-ink-black">{user?.email || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-paper-white border-[#ececec] rounded-cards">
        <CardHeader>
          <CardTitle className="text-ink-black">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-ink-black font-medium">Export All Data</div>
              <div className="text-sm text-ash-gray">Download all transactions as CSV</div>
            </div>
            <Button variant="outline" className="border-[#ececec] rounded-xl" onClick={handleExport}>
              Export
            </Button>
          </div>
          <Separator className="bg-[#ececec]" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-ink-black font-medium">Clear Statements</div>
              <div className="text-sm text-ash-gray">Delete all uploaded statements and their transactions</div>
            </div>
            <Button variant="outline" className="border-error text-error hover:bg-error/10 rounded-xl" onClick={handleClearStatements} disabled={clearing}>
              {clearing ? "Clearing..." : "Clear Statements"}
            </Button>
          </div>
          <Separator className="bg-[#ececec]" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-ink-black font-medium">Clear All Data</div>
              <div className="text-sm text-ash-gray">Permanently delete everything — transactions, statements, merchants, rules</div>
            </div>
            <Button variant="destructive" className="rounded-xl" onClick={handleClearData} disabled={clearing}>
              {clearing ? "Clearing..." : "Clear Data"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-paper-white border-[#ececec] rounded-cards">
        <CardHeader>
          <CardTitle className="text-ink-black">Classification Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-ash-gray text-sm mb-4">
            Manage rules for automatic transaction classification. Rules are checked in priority order.
          </p>
          <Button variant="outline" className="border-[#ececec] rounded-xl" asChild>
            <a href="/dashboard/settings/rules">Manage Rules</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
