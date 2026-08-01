"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BuildingOffice2Icon,
  XMarkIcon,
  ClockIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
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

interface Statement {
  id: string;
  bankId: string;
  bankName: string;
  month: number;
  year: number;
  filename: string;
  fileType: string;
  status: string;
  transactionCount: number;
  uploadedAt: string;
}

interface UploadResult {
  statement: { id: string; month: number; year: number };
  bank?: { id: string; bankName: string };
  transactionCount: number;
  errorCount: number;
  errors: string[];
}

const MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusConfig: Record<string, { label: string; icon: any; className: string; dotColor: string }> = {
  completed: { label: "UPLOADED", icon: CheckCircleIcon, className: "bg-lime-vibrant/20 text-forest", dotColor: "bg-forest" },
  uploaded: { label: "UPLOADED", icon: CheckCircleIcon, className: "bg-lime-vibrant/20 text-forest", dotColor: "bg-forest" },
  processing: { label: "PROCESSING", icon: ClockIcon, className: "bg-pending-container text-pending", dotColor: "bg-pending" },
  failed: { label: "FAILED", icon: XMarkIcon, className: "bg-error-container text-error", dotColor: "bg-error" },
  error: { label: "FAILED", icon: XMarkIcon, className: "bg-error-container text-error", dotColor: "bg-error" },
};

interface ProcessingStep {
  label: string;
  status: "pending" | "active" | "completed";
}

const PROCESSING_STEPS: Omit<ProcessingStep, "status">[] = [
  { label: "Reading your statement" },
  { label: "Detecting bank" },
  { label: "Parsing transactions" },
  { label: "Importing data" },
];

const BANK_ICONS: Record<string, string> = {
  GTBank: "\u{1F3E6}",
  "Access Bank": "\u{1F3E6}",
  "Zenith Bank": "\u{1F3E6}",
  "First Bank": "\u{1F3E6}",
  Kuda: "\u{1F3E6}",
  OPay: "\u{1F4B3}",
  Moniepoint: "\u{1F4B3}",
  PalmPay: "\u{1F4B3}",
  UBA: "\u{1F3E6}",
  "Wema Bank": "\u{1F3E6}",
  "Fidelity Bank": "\u{1F3E6}",
  "Sterling Bank": "\u{1F3E6}",
  "Union Bank": "\u{1F3E6}",
  "Polaris Bank": "\u{1F3E6}",
  "Unity Bank": "\u{1F3E6}",
  "Stanbic IBTC": "\u{1F3E6}",
  Ecobank: "\u{1F3E6}",
  "Standard Chartered": "\u{1F3E6}",
};

export default function UploadPage() {
  const { user, loading: userLoading } = useUser();

  // Bank state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [bankStep, setBankStep] = useState<"select" | "details">("select");
  const [bankForm, setBankForm] = useState({
    accountName: "",
    accountNumber: "",
    nickname: "",
    openingBalance: "",
  });

  // Statement state
  const [statements, setStatements] = useState<Statement[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchBanks();
      fetchStatements();
    }
  }, [user]);

  if (userLoading || !user)
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
          <span className="text-ash-gray">Loading...</span>
        </div>
      </div>
    );

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?userId=${user?.id || ""}`);
      if (res.ok) setBanks(await res.json());
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    } finally {
      setBanksLoading(false);
    }
  };

  const fetchStatements = async () => {
    try {
      const res = await fetch(`/api/statements?userId=${user?.id || ""}`);
      if (res.ok) setStatements(await res.json());
    } catch (err) {
      console.error("Failed to fetch statements:", err);
    }
  };

  const handleCreateBank = async () => {
    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          bankName: selectedBank,
          ...bankForm,
          openingBalance: parseFloat(bankForm.openingBalance) || 0,
        }),
      });
      if (res.ok) {
        closeBankModal();
        fetchBanks();
      }
    } catch (err) {
      console.error("Failed to create bank:", err);
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("Are you sure? This will delete all transactions for this bank.")) return;
    try {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBanks();
        fetchStatements();
      }
    } catch (err) {
      console.error("Failed to delete bank:", err);
    }
  };

  const openBankModal = () => {
    setBankModalOpen(true);
    setBankStep("select");
    setSelectedBank("");
    setBankSearch("");
    setBankForm({ accountName: "", accountNumber: "", nickname: "", openingBalance: "" });
  };

  const closeBankModal = () => {
    setBankModalOpen(false);
    setBankStep("select");
    setSelectedBank("");
  };

  const selectBank = (bank: string) => {
    setSelectedBank(bank);
    setBankStep("details");
  };

  const filteredBanks = BANKS.filter((b) => b.toLowerCase().includes(bankSearch.toLowerCase()));

  const handleDeleteStatement = async (id: string) => {
    if (!confirm("Delete this statement and all its transactions?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/statements?id=${id}&userId=${user?.id}`, { method: "DELETE" });
      if (res.ok) {
        setStatements((prev) => prev.filter((s) => s.id !== id));
        fetchBanks();
      }
    } catch (err) {
      console.error("Failed to delete statement:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleReprocess = async (statementId: string) => {
    try {
      const res = await fetch(`/api/statements/${statementId}/reprocess`, { method: "POST" });
      if (res.ok) {
        fetchStatements();
      }
    } catch (err) {
      console.error("Failed to reprocess:", err);
    }
  };

  const handleUpload = async (forceOverwrite = false) => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    setUploading(true);
    setError("");
    setResult(null);
    setShowProcessing(true);
    setProcessingProgress(0);
    setProcessingSteps(PROCESSING_STEPS.map((s) => ({ ...s, status: "pending" })));

    const simulateProgress = async () => {
      const steps = [...PROCESSING_STEPS];
      for (let i = 0; i < steps.length; i++) {
        setProcessingSteps((prev) =>
          prev.map((s, idx) => ({
            ...s,
            status: idx < i ? "completed" : idx === i ? "active" : "pending",
          }))
        );
        setProcessingProgress(Math.round(((i + 0.5) / steps.length) * 100));
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      }
      setProcessingProgress(100);
      setProcessingSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
    };

    const progressPromise = simulateProgress();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      if (forceOverwrite) formData.append("overwrite", "true");
      const res = await fetch("/api/statements/upload", { method: "POST", body: formData });
      const data = await res.json();

      await progressPromise;

      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateInfo(data);
          setShowDuplicate(true);
          setShowProcessing(false);
          return;
        }
        setError(data.error || "Upload failed");
        setShowProcessing(false);
        return;
      }
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      fetchStatements();
      fetchBanks();
      setTimeout(() => setShowProcessing(false), 1000);
    } catch {
      await progressPromise;
      setError("Upload failed. Please try again.");
      setShowProcessing(false);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const completedCount = statements.filter((s) => s.status === "completed" || s.status === "uploaded").length;
  const failedCount = statements.filter((s) => s.status === "failed" || s.status === "error").length;
  const totalTxns = statements.reduce((sum, s) => sum + s.transactionCount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Bank Accounts & Statements</h1>
          <p className="text-sm text-ash-gray">Manage your linked Nigerian bank accounts.</p>
        </div>
        <Button onClick={openBankModal} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Add New Bank
        </Button>
      </div>

      {/* Bank Cards */}
      {banksLoading ? (
        <div className="text-center py-16 text-ash-gray">Loading banks...</div>
      ) : banks.length === 0 ? (
        <div className="bg-paper-white border border-[#ececec] rounded-cards py-16 text-center">
          <BuildingOffice2Icon className="h-12 w-12 text-ash-gray/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink-black mb-2">No banks added yet</h3>
          <p className="text-ash-gray mb-4">Add your first bank to start tracking transactions</p>
          <Button onClick={openBankModal}>Add Your First Bank</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank, idx) => (
            <div
              key={bank.id}
              className={`rounded-cards p-6 relative overflow-hidden group ${
                idx === 0
                  ? "bg-gradient-to-br from-forest to-forest-container shadow-elevated text-white"
                  : "bg-paper-white border border-[#ececec] text-ink-black hover:shadow-subtle transition-shadow"
              }`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className={`text-sm mb-1 ${idx === 0 ? "text-white/60" : "text-ash-gray"}`}>{bank.nickname || bank.bankName}</p>
                    <p className="text-2xl font-mono font-medium">{formatCurrency(bank.openingBalance)}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${idx === 0 ? "bg-white/20 backdrop-blur-md" : "bg-mist-gray"}`}>
                    <BuildingOffice2Icon className={`h-5 w-5 ${idx === 0 ? "text-lime-vibrant" : "text-forest"}`} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className={`text-xs font-mono ${idx === 0 ? "text-white/60" : "text-ash-gray"}`}>
                      {bank.accountNumber ? bank.accountNumber : "No account number"}
                    </p>
                    <p className={`text-[10px] mt-1 px-2 py-0.5 rounded inline-block ${idx === 0 ? "bg-lime-vibrant/20 text-lime-vibrant" : "bg-lime-vibrant/20 text-forest"}`}>
                      {bank._count.statements} statements uploaded
                    </p>
                  </div>
                  <button onClick={() => handleDeleteBank(bank.id)} className={`text-xs font-semibold hover:underline ${idx === 0 ? "text-white/60" : "text-error"}`}>
                    Remove
                  </button>
                </div>
              </div>
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl ${idx === 0 ? "bg-white/5" : "bg-lime-vibrant/5"}`} />
            </div>
          ))}
        </div>
      )}

      {/* Upload + History Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Statement */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-mist-gray rounded-full flex items-center justify-center">
              <ArrowUpTrayIcon className="h-4 w-4 text-forest" />
            </div>
            <h2 className="font-semibold text-ink-black">Upload Statement</h2>
          </div>
          <p className="text-sm text-ash-gray mb-4">Drag and drop your bank statements here. We support PDF, CSV, and Excel formats.</p>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? "border-lime bg-lime-vibrant/5" : "border-[#ececec] hover:border-forest/30"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm text-ink-black bg-mist-gray px-4 py-2 rounded-inputs w-fit mx-auto">
                <DocumentTextIcon className="h-4 w-4 text-forest" />
                {file.name}
              </div>
            ) : (
              <>
                <p className="text-forest font-medium cursor-pointer" onClick={() => inputRef.current?.click()}>
                  Click to Browse Files
                </p>
                <p className="text-xs text-ash-gray mt-1">Maximum file size: 10MB</p>
              </>
            )}
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
          </div>

          {error && (
            <div className="bg-error-container border border-error/20 text-error px-4 py-3 rounded-inputs text-sm flex items-center gap-2 mt-4">
              <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="bg-lime-vibrant/10 border border-lime-vibrant/30 text-forest px-4 py-3 rounded-inputs text-sm mt-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-medium">Upload successful!</span>
              </div>
              {result.bank && <div className="mb-1">Bank: {result.bank.bankName}</div>}
              <div>{result.transactionCount} transactions imported</div>
              {result.errorCount > 0 && <div className="text-amber-700 mt-1">{result.errorCount} rows had errors during parsing</div>}
            </div>
          )}

          <Button onClick={() => handleUpload(false)} disabled={!file || uploading} className="w-full mt-4">
            {uploading ? "Processing..." : "Upload Statement"}
          </Button>

          <div className="text-xs text-ash-gray flex items-center gap-2 mt-3 justify-center">
            <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">CSV</span>
            <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">XLSX</span>
            <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">PDF</span>
            <span className="text-ash-gray">— Bank auto-detected from your statement</span>
          </div>
        </div>

        {/* Upload History */}
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-black">Upload History</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 text-ash-gray hover:text-ink-black transition-colors rounded-lg hover:bg-mist-gray">
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {statements.length === 0 ? (
            <div className="text-center py-12 text-ash-gray text-sm">No uploads yet</div>
          ) : (
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-[#ececec]">
                    <th className="text-left font-medium text-ash-gray py-3 pr-4 text-[10px] uppercase tracking-wider">Account</th>
                    <th className="text-left font-medium text-ash-gray py-3 pr-4 text-[10px] uppercase tracking-wider">Period</th>
                    <th className="text-left font-medium text-ash-gray py-3 pr-4 text-[10px] uppercase tracking-wider">Transactions</th>
                    <th className="text-left font-medium text-ash-gray py-3 pr-4 text-[10px] uppercase tracking-wider">Status</th>
                    <th className="text-right font-medium text-ash-gray py-3 text-[10px] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((stmt) => {
                    const sc = statusConfig[stmt.status] || statusConfig.uploaded;
                    return (
                      <tr key={stmt.id} className="border-b border-[#ececec] last:border-0 hover:bg-mist-gray/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dotColor}`} />
                            <span className="font-medium text-ink-black">{stmt.bankName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-ink-black">
                          {MONTH_NAMES[stmt.month]} {stmt.year}
                        </td>
                        <td className="py-3 pr-4 text-ink-black">{stmt.transactionCount} Txns</td>
                        <td className="py-3 pr-4">
                          <Badge className={`text-[10px] ${sc.className}`}>{sc.label}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          {stmt.status === "failed" || stmt.status === "error" ? (
                            <button onClick={() => handleReprocess(stmt.id)} className="text-forest hover:underline text-xs font-semibold" title="Retry">
                              Retry
                            </button>
                          ) : (
                            <button onClick={() => handleDeleteStatement(stmt.id)} disabled={deleting === stmt.id} className="text-ash-gray hover:text-red-600 transition-colors p-1" title="Delete statement">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Uploaded", count: completedCount, color: "bg-lime-vibrant/20 text-forest" },
          { label: "Failed", count: failedCount, color: "bg-error-container text-error" },
          { label: "Statements", count: statements.length, color: "bg-mist-gray text-ink-black" },
          { label: "Total Txns", count: totalTxns, color: "bg-mist-gray text-ink-black" },
        ].map((stat) => (
          <div key={stat.label} className={`p-4 rounded-cards ${stat.color}`}>
            <p className="text-[10px] uppercase tracking-wider font-medium opacity-70">{stat.label}</p>
            <p className="text-3xl font-mono font-medium mt-1">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Duplicate Modal */}
      {showDuplicate && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-paper-white w-full max-w-md rounded-cards overflow-hidden shadow-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-error-container rounded-full flex items-center justify-center shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-error" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-black">Duplicate Statement Detected</h3>
                <p className="text-sm text-ash-gray">{duplicateInfo?.message || "A statement for this month already exists."}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDuplicate(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-error hover:bg-red-700 text-white" onClick={() => { setShowDuplicate(false); handleUpload(true); }}>
                Overwrite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {showProcessing && (
        <div className="fixed inset-0 bg-ink-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-paper-white w-full max-w-md rounded-cards shadow-elevated p-8 relative">
            <button
              onClick={() => {
                if (processingProgress === 100) setShowProcessing(false);
              }}
              className={`absolute top-4 right-4 text-ash-gray hover:text-ink-black transition-colors ${processingProgress < 100 ? "invisible" : ""}`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-purple-400 via-orange-300 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
                <div className="flex flex-col gap-1.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-ink-black mb-4">Processing your statement</h2>

              <div className="w-full h-1.5 bg-mist-gray rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${processingProgress}%` }} />
              </div>

              <p className="text-sm font-medium text-purple-600 mb-6">{processingProgress}% completed</p>

              <div className="w-full space-y-3">
                {processingSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                        step.status === "completed" ? "bg-purple-500" : step.status === "active" ? "bg-purple-500" : "bg-mist-gray"
                      }`}
                    />
                    <span className={`text-sm transition-colors duration-300 ${step.status === "pending" ? "text-ash-gray" : "text-ink-black"}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-paper-white w-full max-w-xl rounded-cards overflow-hidden shadow-elevated">
            <div className="p-6 border-b border-[#ececec] flex justify-between items-center bg-mist-gray">
              <div>
                <h3 className="font-signifier text-lg text-ink-black">Connect New Account</h3>
                <p className="text-sm text-ash-gray">Select your bank from the list of Nigerian providers</p>
              </div>
              <button onClick={closeBankModal} className="p-2 hover:bg-paper-white rounded-full transition-colors">
                <XMarkIcon className="h-5 w-5 text-slate-gray" />
              </button>
            </div>

            {bankStep === "select" ? (
              <>
                <div className="p-6 pb-0">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" />
                    <input
                      type="text"
                      placeholder="Search for your bank..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[#ececec] rounded-xl focus:ring-2 focus:ring-lime focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-h-[300px] overflow-y-auto">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank}
                      onClick={() => selectBank(bank)}
                      className="flex flex-col items-center gap-2 p-4 border border-[#ececec] rounded-xl hover:border-lime hover:bg-mist-gray transition-all group"
                    >
                      <div className="w-12 h-12 bg-paper-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-2xl">
                        {BANK_ICONS[bank] || "\u{1F3E6}"}
                      </div>
                      <span className="text-[10px] font-semibold text-ash-gray">{bank}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div className="p-3 bg-mist-gray rounded-lg flex items-center gap-3">
                    <span className="text-2xl">{BANK_ICONS[selectedBank] || "\u{1F3E6}"}</span>
                    <span className="font-semibold text-sm text-ink-black">{selectedBank}</span>
                    <button onClick={() => setBankStep("select")} className="ml-auto text-xs text-forest hover:underline">
                      Change
                    </button>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Account Name</Label>
                    <Input value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} className="bg-mist-gray border-[#ececec] rounded-inputs mt-1" placeholder="e.g., John Doe Savings" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Account Number</Label>
                    <Input value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} className="bg-mist-gray border-[#ececec] rounded-inputs mt-1" placeholder="0123456789" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Nickname</Label>
                    <Input value={bankForm.nickname} onChange={(e) => setBankForm({ ...bankForm, nickname: e.target.value })} className="bg-mist-gray border-[#ececec] rounded-inputs mt-1" placeholder="e.g., GT Salary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Opening Balance</Label>
                    <Input type="number" value={bankForm.openingBalance} onChange={(e) => setBankForm({ ...bankForm, openingBalance: e.target.value })} className="bg-mist-gray border-[#ececec] rounded-inputs mt-1" placeholder="0" />
                  </div>
                </div>
                <div className="p-6 bg-mist-gray flex justify-end gap-4 border-t border-[#ececec]">
                  <Button variant="ghost" onClick={closeBankModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBank}>Proceed</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
