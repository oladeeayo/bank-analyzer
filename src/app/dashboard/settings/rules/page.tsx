"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/lib/hooks";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  Zap,
  Search,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

interface ClassificationRule {
  id: string;
  name: string;
  type: string;
  pattern: string;
  merchantId: string | null;
  categoryId: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  merchant?: { displayName: string } | null;
  category?: { name: string; icon: string } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  children?: Category[];
}

export default function RulesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-ash-gray">Loading...</div>}>
      <RulesPage />
    </Suspense>
  );
}

function RulesPage() {
  const { user, loading: userLoading } = useUser();
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ClassificationRule | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("contains");
  const [formPattern, setFormPattern] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPriority, setFormPriority] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(new Set());
  const [selectedParentCat, setSelectedParentCat] = useState<string | null>(null);
  const [reclassifying, setReclassifying] = useState(false);
  const [reclassifyResult, setReclassifyResult] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classification-rules?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/categories?userId=${user.id}&nested=true`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        setExpandedCatIds(new Set(data.map((c: Category) => c.id)));
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRules();
      fetchCategories();
    }
  }, [user, fetchRules, fetchCategories]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const shouldCreate = searchParams.get("create");
    if (shouldCreate === "1") {
      const pattern = searchParams.get("pattern") || "";
      const categoryId = searchParams.get("categoryId") || "";
      setFormPattern(pattern);
      setFormCategoryId(categoryId);
      setShowForm(true);
    }
  }, [searchParams]);

  const resetForm = () => {
    setFormName("");
    setFormType("contains");
    setFormPattern("");
    setFormCategoryId("");
    setFormPriority(0);
    setEditingRule(null);
    setShowForm(false);
    setError(null);
    setSelectedParentCat(null);
  };

  const handleCreate = async () => {
    if (!user || !formName.trim() || !formPattern.trim() || !formCategoryId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/classification-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: formName.trim(),
          type: formType,
          pattern: formPattern.trim(),
          categoryId: formCategoryId,
          priority: formPriority,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchRules();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create rule");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!user || !editingRule) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/classification-rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          type: formType,
          pattern: formPattern.trim(),
          categoryId: formCategoryId,
          priority: formPriority,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchRules();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update rule");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      const res = await fetch(`/api/classification-rules/${ruleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchRules();
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const handleToggleActive = async (rule: ClassificationRule) => {
    try {
      const res = await fetch(`/api/classification-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (res.ok) {
        fetchRules();
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const handleMovePriority = async (rule: ClassificationRule, direction: "up" | "down") => {
    const newPriority = direction === "up" ? rule.priority + 1 : rule.priority - 1;
    try {
      const res = await fetch(`/api/classification-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        fetchRules();
      }
    } catch (err) {
      console.error("Failed to update priority:", err);
    }
  };

  const startEdit = (rule: ClassificationRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormPattern(rule.pattern);
    setFormCategoryId(rule.categoryId);
    setFormPriority(rule.priority);
    setShowForm(true);
    setError(null);
    setSelectedParentCat(null);
  };

  const handleReclassify = async () => {
    if (!user) return;
    setReclassifying(true);
    setReclassifyResult(null);
    try {
      const res = await fetch("/api/transactions/reclassify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setReclassifyResult(`Re-classified ${data.updatedCount} of ${data.totalTransactions} transactions`);
      } else {
        const data = await res.json();
        setReclassifyResult(data.error || "Failed to re-classify");
      }
    } catch {
      setReclassifyResult("Network error");
    } finally {
      setReclassifying(false);
    }
  };

  const filteredRules = rules.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.pattern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRules = [...filteredRules].sort((a, b) => b.priority - a.priority);

  const allCategories: Array<{ id: string; name: string; icon: string; depth: number; fullName: string }> = [];
  const flattenCategories = (cats: Category[], parentName = "", depth = 0) => {
    for (const cat of cats) {
      const fullName = parentName ? `${parentName} > ${cat.name}` : cat.name;
      allCategories.push({ id: cat.id, name: cat.name, icon: cat.icon, depth, fullName });
      if (cat.children) {
        flattenCategories(cat.children, fullName, depth + 1);
      }
    }
  };
  flattenCategories(categories);

  const selectedCat = allCategories.find(c => c.id === formCategoryId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="text-ash-gray hover:text-ink-black">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-signifier text-[28px] text-ink-black">Classification Rules</h1>
          <p className="text-ash-gray text-sm">
            Rules are checked in priority order (highest first). Transactions matching a rule get automatically classified.
          </p>
        </div>
        <Button
          onClick={handleReclassify}
          disabled={reclassifying}
          variant="outline"
          className="border-[#ececec] rounded-xl"
        >
          <Zap className="h-4 w-4 mr-2" />
          {reclassifying ? "Re-classifying..." : "Re-classify All"}
        </Button>
      </div>

      {reclassifyResult && (
        <div className="p-3 rounded-lg bg-lime-vibrant/20 text-forest text-sm">
          {reclassifyResult}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" />
          <Input
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-[#ececec] rounded-xl"
          />
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-forest text-white hover:bg-forest/90 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>

      {showForm && (
        <Card className="bg-paper-white border-[#ececec] rounded-cards">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-ink-black">
                {editingRule ? "Edit Rule" : "New Rule"}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-error/10 text-error text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-ink-black">Rule Name</Label>
                <Input
                  placeholder="e.g. Netflix subscriptions"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border-[#ececec] rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-ink-black">Match Type</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-[#ececec] bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals (exact)</option>
                  <option value="regex">Regex</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-ink-black">Pattern</Label>
              <Input
                placeholder={formType === "regex" ? "e.g. ^uber\\s+trip" : "e.g. netflix, spotify, dstv"}
                value={formPattern}
                onChange={(e) => setFormPattern(e.target.value)}
                className="border-[#ececec] rounded-xl"
              />
              <p className="text-xs text-ash-gray">
                {formType === "contains" && "Transaction description must contain this text (case-insensitive)"}
                {formType === "equals" && "Transaction description must match exactly (case-insensitive)"}
                {formType === "regex" && "Regular expression pattern to match against description"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-ink-black">Category</Label>
              {selectedCat ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-xl">
                    {selectedCat.icon} {selectedCat.fullName}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFormCategoryId(""); setSelectedParentCat(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedParentCat ? (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedParentCat(null)}
                        className="text-xs mb-2"
                      >
                        <ChevronLeft className="h-3 w-3 mr-1" /> Back to parents
                      </Button>
                      <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border border-[#ececec] rounded-lg p-2">
                        {allCategories
                          .filter(c => {
                            const parent = allCategories.find(p => p.name === selectedParentCat);
                            return parent && c.fullName.startsWith(selectedParentCat + " > ") && c.depth > 0;
                          })
                          .map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setFormCategoryId(cat.id)}
                              className="text-left text-sm px-2 py-1 rounded hover:bg-mist-gray"
                            >
                              {"  ".repeat(cat.depth - 1)}{cat.icon} {cat.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border border-[#ececec] rounded-lg p-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (cat.children && cat.children.length > 0) {
                              setSelectedParentCat(cat.name);
                            } else {
                              setFormCategoryId(cat.id);
                            }
                          }}
                          className="text-left text-sm px-2 py-1 rounded hover:bg-mist-gray"
                        >
                          {cat.icon} {cat.name}
                          {cat.children && cat.children.length > 0 && (
                            <span className="text-ash-gray ml-1">({cat.children.length})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-ink-black">Priority (higher = checked first)</Label>
              <Input
                type="number"
                value={formPriority}
                onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                className="border-[#ececec] rounded-xl w-32"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm} className="border-[#ececec] rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={editingRule ? handleUpdate : handleCreate}
                disabled={saving || !formName.trim() || !formPattern.trim() || !formCategoryId}
                className="bg-forest text-white hover:bg-forest/90 rounded-xl"
              >
                {saving ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-ash-gray">Loading rules...</div>
        ) : sortedRules.length === 0 ? (
          <div className="text-center py-12 text-ash-gray">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium text-ink-black">No classification rules yet</p>
            <p className="text-sm mt-1">
              Create rules to automatically classify transactions. For example: &quot;All transactions containing &apos;netflix&apos; = Entertainment &gt; Streaming&quot;.
            </p>
          </div>
        ) : (
          sortedRules.map((rule, idx) => (
            <Card key={rule.id} className={`bg-paper-white border-[#ececec] rounded-cards ${!rule.isActive ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMovePriority(rule, "up")}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMovePriority(rule, "down")}
                    disabled={idx === sortedRules.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-black">{rule.name}</span>
                    <Badge variant={rule.isActive ? "default" : "secondary"} className="rounded-xl text-[9px]">
                      {rule.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <Badge variant="outline" className="rounded-xl text-[9px]">
                      P{rule.priority}
                    </Badge>
                  </div>
                  <div className="text-sm text-ash-gray mt-1 truncate">
                    <span className="font-mono text-xs bg-mist-gray px-1.5 py-0.5 rounded mr-2">{rule.type}</span>
                    <span className="font-mono text-xs">&quot;{rule.pattern}&quot;</span>
                    {rule.category && (
                      <span className="ml-2">→ {rule.category.icon} {rule.category.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(rule)}
                    title={rule.isActive ? "Deactivate" : "Activate"}
                  >
                    {rule.isActive ? (
                      <ToggleRight className="h-5 w-5 text-forest" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-ash-gray" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(rule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                    className="text-error hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Built-in Keyword Patterns */}
      <BuiltInPatterns />
    </div>
  );
}

const BUILTIN_PATTERNS = [
  { patterns: ["auto-save", "savings to/from", "save to/into", "owealth balance"], categoryName: "Savings", confidence: 0.85 },
  { patterns: ["salary", "wages", "payroll", "income"], categoryName: "Income", confidence: 0.9 },
  { patterns: ["electricity", "ikeja electric", "bedc", "ibedc", "aedc", "kedco", "phcn", "prepaid meter"], categoryName: "Utilities", confidence: 0.95 },
  { patterns: ["water board/supply/bill/payment", "water vendor"], categoryName: "Utilities", confidence: 0.9 },
  { patterns: ["airtime", "data bundle/plan/purchase", "recharge", "vtu", "glo data", "mtn data", "9mobile", "airtel data"], categoryName: "Utilities", confidence: 0.9 },
  { patterns: ["spotify", "netflix", "showmax", "dstv", "youtube premium", "apple music", "prime video", "disney+", "tv subscription"], categoryName: "Entertainment", confidence: 0.95 },
  { patterns: ["restaurant", "food vendor", "chicken republic", "pizza", "kfc", "burger king", "buka", "mama put", "canteen"], categoryName: "Food & Dining", confidence: 0.85 },
  { patterns: ["uber", "bolt", "taxify", "ride share", "transport fare", "danfo", "keke", "okada"], categoryName: "Transportation", confidence: 0.9 },
  { patterns: ["shoprite", "jumia", "konga", "slot", "computer village", "market", "mall", "store"], categoryName: "Shopping", confidence: 0.8 },
  { patterns: ["hospital", "pharmacy", "clinic", "medical", "health care", "drug", "lab test"], categoryName: "Healthcare", confidence: 0.85 },
  { patterns: ["school", "university", "college", "tuition", "course", "exam", "jamb", "waec"], categoryName: "Education", confidence: 0.85 },
  { patterns: ["rent", "landlord", "accommodation", "house rent", "mortgage"], categoryName: "Housing", confidence: 0.85 },
  { patterns: ["investment", "dividend", "mutual fund", "stock", "treasury bills", "fixed deposit", "bond", "crypto", "bitcoin"], categoryName: "Savings & Investments", confidence: 0.85 },
  { patterns: ["bet9ja", "sportybet", "betway", "betting", "gambling", "casino", "lottery"], categoryName: "Entertainment", confidence: 0.8 },
  { patterns: ["pos purchase", "pos terminal", "atm withdrawal", "atm cash", "card purchase", "card payment"], categoryName: "Banking & Financial", confidence: 0.7 },
  { patterns: ["transfer", "trf", "sent to", "received from"], categoryName: "Banking & Financial", confidence: 0.6 },
];

function BuiltInPatterns() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-paper-white border-[#ececec] rounded-cards">
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-left"
        >
          <Zap className="h-4 w-4 text-forest" />
          <span className="font-medium text-ink-black text-sm">Built-in Keyword Patterns</span>
          <span className="text-xs text-ash-gray ml-auto">{expanded ? "Click to collapse" : "Click to view"}</span>
        </button>
        {expanded && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-ash-gray">
              These patterns are automatically checked during upload. They match transaction descriptions and assign categories. Your custom rules take priority over these.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {BUILTIN_PATTERNS.map((p, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-mist-gray/50 text-xs">
                  <Zap className="h-3 w-3 text-forest mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-ink-black">{p.categoryName}</span>
                    <span className="text-ash-gray ml-1">({Math.round(p.confidence * 100)}%)</span>
                    <div className="text-ash-gray mt-0.5">{p.patterns.join(", ")}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
