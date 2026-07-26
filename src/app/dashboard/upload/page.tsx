"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Building2 } from "lucide-react";
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

export default function UploadPage() {
  const { user, loading: userLoading } = useUser();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchBanks();
  }, [user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>;

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?userId=${user?.id || ""}`);
      if (res.ok) setBanks(await res.json());
    } catch (err) {
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
      formData.append("userId", user.id);

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
    } catch (err) {
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
      <h1 className="text-3xl font-bold text-gray-900">Upload Statement</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card className="bg-white border-gray-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Upload New Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                dragActive ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 mb-2">
                Drag and drop your statement here
              </p>
              <p className="text-sm text-gray-400 mb-4">or</p>
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
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 cursor-pointer transition-colors"
              >
                Choose File
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-700">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400">
              Supported formats: CSV, Excel (.xlsx, .xls), PDF
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {result && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Upload successful!</span>
                </div>
                <div>{result.transactionCount} transactions imported</div>
                {result.errorCount > 0 && (
                  <div className="text-amber-600 mt-1">
                    {result.errorCount} rows had errors during parsing
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || !selectedBank || uploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {uploading ? "Uploading..." : "Upload Statement"}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card className="bg-white border-gray-100">
          <CardHeader>
            <CardTitle className="text-gray-900">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {banks.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Add a bank first to upload statements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banks.map((bank) => (
                  <div key={bank.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 text-sm font-medium">{bank.nickname || bank.bankName}</span>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-lg">
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
