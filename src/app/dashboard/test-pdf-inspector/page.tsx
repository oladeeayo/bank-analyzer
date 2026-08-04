"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

type Tab = "classification" | "rawText" | "reconstructedText" | "text" | "markdown" | "markdownPages" | "positions" | "raw";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-mist-gray hover:bg-[#e5e5e5] text-ink-black"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          {label || "Copy"}
        </>
      )}
    </button>
  );
}

export default function TestPDFInspectorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("classification");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/test-pdf-inspector", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process PDF");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to process PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "classification", label: "Classification" },
    { id: "rawText", label: "Raw Text" },
    { id: "reconstructedText", label: "Spatial Text" },
    { id: "text", label: "Cleaned Text" },
    { id: "markdown", label: "Full Markdown" },
    { id: "markdownPages", label: "Markdown Per Page" },
    { id: "positions", label: "Text Positions" },
    { id: "raw", label: "Raw JSON" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-signifier text-[28px] text-ink-black">
          Test PDF Inspector
        </h1>
        <p className="text-sm text-ash-gray">
          Test the pdf-inspector library&apos;s text extraction capabilities.
          Upload a PDF to compare different extraction methods.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-mist-gray rounded-full flex items-center justify-center">
            <ArrowUpTrayIcon className="h-4 w-4 text-forest" />
          </div>
          <h2 className="font-semibold text-ink-black">Upload PDF</h2>
        </div>

        <div className="border-2 border-dashed rounded-xl p-8 text-center transition-colors border-[#ececec] hover:border-forest/30">
          {file ? (
            <div className="flex items-center justify-center gap-2 text-sm text-ink-black bg-mist-gray px-4 py-2 rounded-inputs w-fit mx-auto">
              <DocumentTextIcon className="h-4 w-4 text-forest" />
              {file.name}
            </div>
          ) : (
            <>
              <p
                className="text-forest font-medium cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                Click to Browse Files
              </p>
              <p className="text-xs text-ash-gray mt-1">
                Select a bank statement PDF to test
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        {error && (
          <div className="bg-error-container border border-error/20 text-error px-4 py-3 rounded-inputs text-sm flex items-center gap-2 mt-4">
            <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full mt-4"
        >
          {loading ? "Processing..." : "Extract Text"}
        </Button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-mist-gray p-1 rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-paper-white text-ink-black shadow-sm"
                    : "text-ash-gray hover:text-ink-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "classification" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-mist-gray p-4 rounded-xl">
                    <p className="text-xs text-ash-gray uppercase tracking-wider">PDF Type</p>
                    <p className="text-lg font-mono font-semibold text-ink-black mt-1">
                      {result.classification.pdfType}
                    </p>
                  </div>
                  <div className="bg-mist-gray p-4 rounded-xl">
                    <p className="text-xs text-ash-gray uppercase tracking-wider">Pages</p>
                    <p className="text-lg font-mono font-semibold text-ink-black mt-1">
                      {result.classification.pageCount}
                    </p>
                  </div>
                  <div className="bg-mist-gray p-4 rounded-xl">
                    <p className="text-xs text-ash-gray uppercase tracking-wider">Confidence</p>
                    <p className="text-lg font-mono font-semibold text-ink-black mt-1">
                      {(result.classification.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-mist-gray p-4 rounded-xl">
                    <p className="text-xs text-ash-gray uppercase tracking-wider">OCR Pages</p>
                    <p className="text-lg font-mono font-semibold text-ink-black mt-1">
                      {result.classification.pagesNeedingOcr.length === 0
                        ? "None"
                        : result.classification.pagesNeedingOcr.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-forest/5 border border-forest/20 rounded-xl">
                  <h3 className="font-medium text-forest mb-2">File Info</h3>
                  <p className="text-sm text-ink-black">
                    {result.fileName} — {(result.fileSize / 1024).toFixed(1)} KB —{" "}
                    {result.textLength.toLocaleString()} characters extracted
                  </p>
                </div>

                {result.processed.pagesWithTables.length > 0 && (
                  <div className="p-4 bg-mist-gray rounded-xl">
                    <h3 className="font-medium text-ink-black mb-1">Tables Detected</h3>
                    <p className="text-sm text-ash-gray">
                      Pages: {result.processed.pagesWithTables.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "rawText" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ash-gray">
                    Raw text before cleanup ({(result.rawText || "").length.toLocaleString()} characters)
                  </p>
                  <CopyButton text={result.rawText || ""} label="Copy Raw" />
                </div>
                <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[700px] text-xs font-mono text-ink-black whitespace-pre-wrap">
                  {result.rawText || "No raw text available"}
                </pre>
              </div>
            )}

            {activeTab === "reconstructedText" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ash-gray">
                    Spatially reconstructed text with original page layout & line breaks ({(result.reconstructedText || "").length.toLocaleString()} characters)
                  </p>
                  <CopyButton text={result.reconstructedText || ""} label="Copy Spatial Text" />
                </div>
                <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[700px] text-xs font-mono text-ink-black whitespace-pre-wrap">
                  {result.reconstructedText || "No spatial text available"}
                </pre>
              </div>
            )}

            {activeTab === "text" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ash-gray">
                    Cleaned text ({result.textLength.toLocaleString()} characters)
                  </p>
                  <CopyButton text={result.text} label="Copy Cleaned" />
                </div>
                <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[700px] text-xs font-mono text-ink-black whitespace-pre-wrap">
                  {result.text}
                </pre>
              </div>
            )}

            {activeTab === "markdown" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ash-gray">
                    Full markdown conversion ({result.processed.processingTimeMs}ms)
                  </p>
                  <CopyButton text={result.processed.markdown || ""} label="Copy Markdown" />
                </div>
                <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[600px] text-xs font-mono text-ink-black whitespace-pre-wrap">
                  {result.processed.markdown}
                </pre>
              </div>
            )}

            {activeTab === "markdownPages" && (
              <div className="space-y-6">
                <p className="text-xs text-ash-gray">
                  Per-page markdown with OCR flags
                </p>
                {result.markdownPages ? (
                  result.markdownPages.pages.map((page: any) => (
                    <div key={page.page} className="border border-[#ececec] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-ink-black">
                            Page {page.page + 1}
                          </h3>
                          {page.needsOcr && (
                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                              Needs OCR
                            </span>
                          )}
                          <span className="text-[10px] text-ash-gray">
                            {page.markdown.length.toLocaleString()} chars
                          </span>
                        </div>
                        <CopyButton text={page.markdown} label="Copy Page" />
                      </div>
                      <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[500px] text-xs font-mono text-ink-black whitespace-pre-wrap">
                        {page.markdown}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ash-gray">Not available</p>
                )}
              </div>
            )}

            {activeTab === "positions" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ash-gray">
                    Text items with X/Y positions (page 1, first 100 items)
                  </p>
                  <CopyButton
                    text={result.textWithPositions ? JSON.stringify(result.textWithPositions, null, 2) : ""}
                    label="Copy JSON"
                  />
                </div>
                {result.textWithPositions ? (
                  <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[600px] text-xs font-mono text-ink-black whitespace-pre-wrap">
                    {JSON.stringify(result.textWithPositions, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-ash-gray">Not available</p>
                )}
              </div>
            )}

            {activeTab === "raw" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-ash-gray">Full API response</p>
                  <CopyButton
                    text={JSON.stringify(result, null, 2)}
                    label="Copy JSON"
                  />
                </div>
                <pre className="bg-mist-gray p-4 rounded-xl overflow-auto max-h-[600px] text-xs font-mono text-ink-black">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
