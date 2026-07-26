"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Building2, X, Clock } from "lucide-react";
import { useUser } from "@/lib/hooks";

interface Bank {
  id: string;
  bankName: string;
  nickname: string | null;
}

interface UploadResult {
  statement: { id: string; month: number; year: number };
  transactionCount: number;
  errorCount: number;
  errors: string[];
}

interface HistoryEntry {
  id: string;
  bankName: string;
  fileName: string;
  status: "success" | "processing" | "error";
  transactionCount: number;
  date: string;
}

const statusConfig = {
  success: { label: "Completed", icon: CheckCircle, className: "bg-lime-vibrant/20 text-forest border-lime-vibrant/30" },
  processing: { label: "Processing", icon: Clock, className: "bg-golden-light/40 text-amber-700 border-golden-light" },
  error: { label: "Error", icon: X, className: "bg-peach-light/40 text-red-600 border-peach-light" },
};

export default function UploadPage() {
  const { user, loading: userLoading } = useUser();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchBanks();
  }, [user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?userId=${user?.id || ""}`);
      if (res.ok) setBanks(await res.json());
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    }
  };

  const handleUpload = async (forceOverwrite = false) => {
    if (!file || !selectedBank) {
      setError("Please select a bank and a file");
      return;
    }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bankId", selectedBank);
      formData.append("userId", user.id);
      if (forceOverwrite) formData.append("overwrite", "true");
      const res = await fetch("/api/statements/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateCount(data.existingStatement?.transactionCount || 0);
          setShowDuplicate(true);
          return;
        }
        setError(data.error || "Upload failed");
        return;
      }
      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
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

  const uploadHistory: HistoryEntry[] = banks.slice(0, 3).map((bank, i) => ({
    id: bank.id,
    bankName: bank.nickname || bank.bankName,
    fileName: `${bank.bankName.toLowerCase()}_july2026.xlsx`,
    status: (["success", "processing", "error"] as const)[i % 3],
    transactionCount: [156, 0, 89][i % 3],
    date: "2026-07-25",
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Upload Statement</h1>
          <p className="text-sm text-ash-gray">Import your Nigerian bank statements for analysis</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-lime-vibrant/20 rounded-lg flex items-center justify-center">
                <Upload className="h-4 w-4 text-forest" />
              </div>
              <h2 className="font-semibold text-ink-black">Import New Statement</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-black mb-2 block">Select Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-mist-gray border border-[#ececec] text-ink-black rounded-inputs px-4 py-3 focus:ring-2 focus:ring-lime focus:outline-none text-sm"
                >
                  <option value="">Choose a bank</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>{bank.nickname || bank.bankName}</option>
                  ))}
                </select>
              </div>
              <div
                className={`border-2 border-dashed rounded-cards p-10 text-center transition-colors ${dragActive ? "border-lime bg-lime-vibrant/5" : "border-[#ececec] hover:border-forest/30"}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-lime-vibrant/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-forest" />
                </div>
                <p className="text-ink-black font-medium mb-2">Drag and drop your statement here</p>
                <p className="text-sm text-ash-gray mb-4">or</p>
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="inline-flex items-center px-6 py-2.5 bg-forest text-white rounded-inputs hover:bg-forest-container cursor-pointer transition-colors text-sm font-medium">
                  Choose File
                </label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-black bg-mist-gray px-4 py-2 rounded-inputs w-fit mx-auto">
                    <FileText className="h-4 w-4 text-forest" />{file.name}
                  </div>
                )}
              </div>
              <div className="text-xs text-ash-gray flex items-center gap-2">
                <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">CSV</span>
                <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">XLSX</span>
                <span className="px-2 py-0.5 bg-mist-gray rounded text-[10px]">PDF</span>
                — All major Nigerian bank formats supported
              </div>
              {error && (
                <div className="bg-peach-light/40 border border-peach-light text-red-600 px-4 py-3 rounded-inputs text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />{error}
                </div>
              )}
              {result && (
                <div className="bg-lime-vibrant/10 border border-lime-vibrant/30 text-forest px-4 py-3 rounded-inputs text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4" /><span className="font-medium">Upload successful!</span>
                  </div>
                  <div>{result.transactionCount} transactions imported</div>
                  {result.errorCount > 0 && <div className="text-amber-700 mt-1">{result.errorCount} rows had errors during parsing</div>}
                </div>
              )}
              <Button onClick={() => handleUpload(false)} disabled={!file || !selectedBank || uploading} className="w-full">
                {uploading ? "Processing..." : "Upload Statement"}
              </Button>
            </div>
          </div>

          <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
            <h2 className="font-semibold text-ink-black mb-4">Recent Uploads</h2>
            {uploadHistory.length === 0 ? (
              <div className="text-center py-8 text-ash-gray text-sm">No uploads yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#ececec]">
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Bank</th>
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">File</th>
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Status</th>
                      <th className="text-left font-medium text-ash-gray py-3 pr-4">Transactions</th>
                      <th className="text-left font-medium text-ash-gray py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadHistory.map((entry) => {
                      const sc = statusConfig[entry.status];
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={entry.id} className="border-b border-[#ececec] last:border-0 hover:bg-mist-gray/50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-mist-gray rounded-lg flex items-center justify-center"><Building2 className="h-4 w-4 text-forest" /></div>
                              <span className="font-medium text-ink-black">{entry.bankName}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-ash-gray">{entry.fileName}</td>
                          <td className="py-3 pr-4">
                            <Badge className={`rounded-pill text-[10px] gap-1 ${sc.className}`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-ink-black">{entry.transactionCount || "—"}</td>
                          <td className="py-3 text-ash-gray">{entry.date}</td>
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
              { label: "Completed", count: 12, color: "bg-lime-vibrant/20 text-forest" },
              { label: "Processing", count: 1, color: "bg-golden-light/40 text-amber-700" },
              { label: "Failed", count: 1, color: "bg-peach-light/40 text-red-600" },
              { label: "Total", count: 14, color: "bg-mist-gray text-ink-black" },
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
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />Select CSV or PDF format for best results</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-forest rounded-full mt-1.5 shrink-0" />Upload one month at a time for accurate parsing</li>
            </ul>
          </div>
        </div>
      </div>

      {showDuplicate && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-paper-white w-full max-w-md rounded-cards overflow-hidden shadow-elevated p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-peach-light/40 rounded-full flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-semibold text-ink-black">Duplicate Statement Detected</h3>
                <p className="text-sm text-ash-gray">A statement for this month already exists with {duplicateCount} transactions.</p>
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
