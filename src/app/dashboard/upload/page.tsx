"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Building2 } from "lucide-react";

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

export default function UploadPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks?userId=demo");
      if (res.ok) setBanks(await res.json());
    } catch (_err) {
      console.error("Failed to fetch banks:", err);
    }
  };

  const handleUpload = async () => {
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
      formData.append("userId", "demo");

      const res = await fetch("/api/statements/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(`Statement already exists for this month. ${data.existingStatement?.transactionCount || 0} transactions already imported.`);
        } else {
          setError(data.error || "Upload failed");
        }
        return;
      }

      setResult(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (_err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Upload Statement</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Upload New Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
              >
                <option value="">Choose a bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.nickname || bank.bankName}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-emerald-400 bg-emerald-400/10" : "border-slate-600"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 mb-2">
                Drag and drop your statement here
              </p>
              <p className="text-sm text-slate-500 mb-4">or</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 cursor-pointer"
              >
                Choose File
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-300">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500">
              Supported formats: CSV, Excel (.xlsx, .xls), PDF
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {result && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Upload successful!</span>
                </div>
                <div>{result.transactionCount} transactions imported</div>
                {result.errorCount > 0 && (
                  <div className="text-yellow-400 mt-1">
                    {result.errorCount} rows had errors during parsing
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || !selectedBank || uploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? "Uploading..." : "Upload Statement"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {banks.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Add a bank first to upload statements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banks.map((bank) => (
                  <div key={bank.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{bank.nickname || bank.bankName}</span>
                      <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                        {bank.nickname || bank.bankName}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
