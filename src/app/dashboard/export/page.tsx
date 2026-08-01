"use client";

import { useState } from "react";
import { useUser } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

export default function ExportPage() {
  const { user, loading: userLoading } = useUser();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCsvExport = async () => {
    if (!user) return;
    setDownloading("csv");
    setMessage(null);
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
        setMessage({ type: "success", text: "CSV downloaded successfully." });
      } else {
        setMessage({ type: "error", text: "Failed to export CSV." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setDownloading(null);
    }
  };

  const handleReportExport = async () => {
    if (!user) return;
    setDownloading("report");
    setMessage(null);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    try {
      const res = await fetch(
        `/api/report?userId=${user.id}&period=monthly&month=${month}&year=${year}`
      );
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${year}-${String(month).padStart(2, "0")}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "success", text: "Report downloaded successfully." });
      } else {
        setMessage({ type: "error", text: "Failed to generate report." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setDownloading(null);
    }
  };

  const handleCustomExport = async () => {
    if (!user || !startDate || !endDate) return;
    setDownloading("custom");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/transactions?userId=${user.id}&startDate=${startDate}&endDate=${endDate}&limit=10000`
      );
      if (res.ok) {
        const data = await res.json();
        const txns = data.transactions || [];
        const header = "Date,Description,Amount,Type,Merchant,Category,Bank,Reference\n";
        const rows = txns.map((tx: any) => {
          const date = new Date(tx.date).toISOString().split("T")[0];
          const desc = `"${(tx.description || "").replace(/"/g, '""')}"`;
          const amount = tx.amount;
          const type = tx.type;
          const merchant = `"${(tx.merchant?.displayName || "").replace(/"/g, '""')}"`;
          const category = `"${(tx.category?.name || "").replace(/"/g, '""')}"`;
          const bank = `"${(tx.bank?.nickname || tx.bank?.bankName || "").replace(/"/g, '""')}"`;
          const ref = `"${(tx.reference || "").replace(/"/g, '""')}"`;
          return `${date},${desc},${amount},${type},${merchant},${category},${bank},${ref}`;
        }).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${startDate}-to-${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "success", text: `${txns.length} transactions exported.` });
      } else {
        setMessage({ type: "error", text: "Failed to fetch transactions." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setDownloading(null);
    }
  };

  if (userLoading || !user) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
          <span className="text-ash-gray">Loading...</span>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-signifier text-[24px] sm:text-[28px] text-ink-black">Export Data</h1>
        <p className="text-sm text-ash-gray">Download your financial data</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-lime-vibrant/20 text-forest"
              : "bg-error/10 text-error"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* CSV Export */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 flex flex-col">
          <div className="w-10 h-10 bg-mist-gray rounded-full flex items-center justify-center mb-4">
            <DocumentTextIcon className="h-5 w-5 text-forest" />
          </div>
          <h2 className="font-signifier text-lg text-ink-black mb-1">All Transactions</h2>
          <p className="text-sm text-ash-gray mb-6 flex-1">
            Download all transactions as a CSV file
          </p>
          <Button
            onClick={handleCsvExport}
            disabled={downloading === "csv"}
            className="w-full"
          >
            <ArrowDownTrayIcon
              className={`h-4 w-4 mr-2 ${downloading === "csv" ? "animate-bounce" : ""}`}
            />
            {downloading === "csv" ? "Downloading..." : "Download CSV"}
          </Button>
        </div>

        {/* Report Export */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 flex flex-col">
          <div className="w-10 h-10 bg-mist-gray rounded-full flex items-center justify-center mb-4">
            <ChartBarIcon className="h-5 w-5 text-forest" />
          </div>
          <h2 className="font-signifier text-lg text-ink-black mb-1">Monthly Report</h2>
          <p className="text-sm text-ash-gray mb-6 flex-1">
            Export your current month&apos;s financial summary
          </p>
          <p className="text-xs text-ash-gray mb-3 font-mono">{monthName}</p>
          <Button
            onClick={handleReportExport}
            disabled={downloading === "report"}
            className="w-full"
          >
            <ArrowDownTrayIcon
              className={`h-4 w-4 mr-2 ${downloading === "report" ? "animate-bounce" : ""}`}
            />
            {downloading === "report" ? "Downloading..." : "Download Report"}
          </Button>
        </div>

        {/* Custom Export */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 flex flex-col">
          <div className="w-10 h-10 bg-mist-gray rounded-full flex items-center justify-center mb-4">
            <CalendarDaysIcon className="h-5 w-5 text-forest" />
          </div>
          <h2 className="font-signifier text-lg text-ink-black mb-1">Date Range</h2>
          <p className="text-sm text-ash-gray mb-6 flex-1">
            Export transactions for a specific date range
          </p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-ash-gray mb-1 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ash-gray mb-1 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-3 py-2 text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleCustomExport}
            disabled={downloading === "custom" || !startDate || !endDate}
            className="w-full"
          >
            <ArrowDownTrayIcon
              className={`h-4 w-4 mr-2 ${downloading === "custom" ? "animate-bounce" : ""}`}
            />
            {downloading === "custom" ? "Downloading..." : "Download CSV"}
          </Button>
        </div>
      </div>
    </div>
  );
}
