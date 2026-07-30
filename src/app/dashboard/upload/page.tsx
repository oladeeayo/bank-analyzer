"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon, BuildingOffice2Icon, XMarkIcon, ClockIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useUser } from "@/lib/hooks";

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

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  completed: { label: "Uploaded", icon: CheckCircleIcon, className: "bg-lime-vibrant/20 text-forest border-lime-vibrant/30" },
  uploaded: { label: "Uploaded", icon: CheckCircleIcon, className: "bg-lime-vibrant/20 text-forest border-lime-vibrant/30" },
  processing: { label: "Processing", icon: ClockIcon, className: "bg-golden-light/40 text-amber-700 border-golden-light" },
  failed: { label: "Failed", icon: XMarkIcon, className: "bg-peach-light/40 text-red-600 border-peach-light" },
  error: { label: "Failed", icon: XMarkIcon, className: "bg-peach-light/40 text-red-600 border-peach-light" },
};

export default function UploadPage() {
  const { user, loading: userLoading } = useUser();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchStatements();
    }
  }, [user]);

  if (userLoading || !user) return <div role="status" aria-live="polite" className="flex items-center justify-center h-64"><div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" /><span className="text-ash-gray">Loading...</span></div></div>;

  const fetchStatements = async () => {
    try {
      const res = await fetch(`/api/statements?userId=${user?.id || ""}`);
      if (res.ok) setStatements(await res.json());
    } catch (err) {
      console.error("Failed to fetch statements:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this statement and all its transactions?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/statements?id=${id}&userId=${user?.id}`, { method: "DELETE" });
      if (res.ok) {
        setStatements((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete statement:", err);
    } finally {
      setDeleting(null);
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
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      if (forceOverwrite) formData.append("overwrite", "true");
      const res = await fetch("/api/statements/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateInfo(data);
          setShowDuplicate(true);
          return;
        }
        setError(data.error || "Upload failed");
        return;
      }
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      fetchStatements();
    } catch {
      setError("Upload failed. Please try again.");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Upload Statement</h1>
          <p className="text-sm text-ash-gray">Import your Nigerian bank statements for analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-lime-vibrant/20 rounded-lg flex items-center justify-center">
                <ArrowUpTrayIcon className="h-4 w-4 text-forest" />
              </div>
              <h2 className="font-semibold text-ink-black">Import New Statement</h2>
            </div>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-cards p-10 text-center transition-colors ${dragActive ? "border-lime bg-lime-vibrant/5" : "border-[#ececec] hover:border-forest/30"}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-lime-vibrant/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUpTrayIcon className="h-6 w-6 text-forest" />
                </div>
                <p className="text-ink-black font-medium mb-2">Drag and drop your statement here</p>
                <p className="text-sm text-ash-gray mb-4">or</p>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="inline-flex items-center px-6 py-2.5 bg-forest text-white rounded-inputs hover:bg-forest-container cursor-pointer transition-colors text-sm font-medium">
                  Choose File
                </label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-black bg-mist-gray px-4 py-2 rounded-inputs w-fit mx-auto">
                    <DocumentTextIcon className="h-4 w-4 text-forest" />{file.name}
                  </div>
                )}
              </div>
              <div className="text-xs text-ash-gray flex items-center gap-2">
                <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">CSV</span>
                <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">XLSX</span>
                <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">PDF</span>
                — Bank auto-detected from your statement
              </div>
              {error && (
                <div className="bg-peach-light/40 border border-peach-light text-red-600 px-4 py-3 rounded-inputs text-sm flex items-center gap-2">
                  <ExclamationCircleIcon className="h-4 w-4" />{error}
                </div>
              )}
              {result && (
                <div className="bg-lime-vibrant/10 border border-lime-vibrant/30 text-forest px-4 py-3 rounded-inputs text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircleIcon className="h-4 w-4" /><span className="font-medium">Upload successful!</span>
                  </div>
                  {result.bank && <div className="mb-1">Bank: {result.bank.bankName}</div>}
                  <div>{result.transactionCount} transactions imported</div>
                  {result.errorCount > 0 && <div className="text-amber-700 mt-1">{result.errorCount} rows had errors during parsing</div>}
                </div>
              )}
              <Button onClick={() => handleUpload(false)} disabled={!file || uploading} className="w-full">
                {uploading ? "Processing..." : "Upload Statement"}
              </Button>
            </div>
          </div>

          <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
            <h2 className="font-semibold text-ink-black mb-4">Upload History</h2>
            {statements.length === 0 ? (
              <div className="text-center py-8 text-ash-gray text-sm">No uploads yet</div>
            ) : (
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#ececec]">
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Account</th>
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Period</th>
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Transactions</th>
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Status</th>
                      <th className="text-right font-medium text-ash-gray py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statements.map((stmt) => {
                      const sc = statusConfig[stmt.status] || statusConfig.uploaded;
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={stmt.id} className="border-b border-[#ececec] last:border-0 hover:bg-mist-gray/50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-mist-gray rounded-lg flex items-center justify-center"><BuildingOffice2Icon className="h-4 w-4 text-forest" /></div>
                              <span className="font-medium text-ink-black">{stmt.bankName}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-ink-black">{MONTH_NAMES[stmt.month]} {stmt.year}</td>
                          <td className="py-3 pr-4 text-ink-black">{stmt.transactionCount} Txns</td>
                          <td className="py-3 pr-4">
                            <Badge className={`rounded-pill text-[10px] gap-1 ${sc.className}`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDelete(stmt.id)}
                              disabled={deleting === stmt.id}
                              className="text-ash-gray hover:text-red-600 transition-colors p-1"
                              title="Delete statement"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
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

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Uploaded", count: completedCount, color: "bg-lime-vibrant/20 text-forest" },
              { label: "Failed", count: failedCount, color: "bg-peach-light/40 text-red-600" },
              { label: "Statements", count: statements.length, color: "bg-mist-gray text-ink-black" },
              { label: "Total Txns", count: totalTxns, color: "bg-mist-gray text-ink-black" },
            ].map((stat) => (
              <div key={stat.label} className={`p-4 rounded-cards ${stat.color}`}>
                <p className="text-[10px] uppercase tracking-wider font-medium opacity-70">{stat.label}</p>
                <p className="text-3xl font-mono font-medium mt-1">{stat.count}</p>
              </div>
            ))}
          </div>
          <div className="bg-mist-gray rounded-cards p-6">
            <h3 className="font-semibold text-ink-black text-sm mb-3">Need Help?</h3>
            <ul className="space-y-2 text-sm text-ash-gray">
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />Download your statement from your bank&apos;s mobile app</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />Select CSV, Excel, or PDF format for best results</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />Upload one month at a time for accurate parsing</li>
            </ul>
          </div>
        </div>
      </div>

      {showDuplicate && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-paper-white w-full max-w-md rounded-cards overflow-hidden shadow-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-peach-light/40 rounded-full flex items-center justify-center"><ExclamationCircleIcon className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-semibold text-ink-black">Duplicate Statement Detected</h3>
                <p className="text-sm text-ash-gray">{duplicateInfo?.message || "A statement for this month already exists."}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDuplicate(false)}>Cancel</Button>
              <Button className="flex-1 bg-error hover:bg-red-700 text-white" onClick={() => { setShowDuplicate(false); handleUpload(true); }}>Overwrite</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
