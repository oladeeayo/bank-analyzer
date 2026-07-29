"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/hooks";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  FolderIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  sortOrder: number;
  isSystem: boolean;
  parentId: string | null;
  children?: Category[];
  _count?: { transactions: number };
}

const ICON_OPTIONS = [
  "📁", "🍔", "🛒", "🚗", "🏠", "💊", "🎓", "🎬", "💰", "🎁",
  "☕", "🛒", "✈️", "📱", "💳", "🔧", "👕", "🐕", "🏋️", "💇",
  "🏦", "💳", "📊", "🎮", "🎵", "📰", "🛒", "🏪", "🏥", "⛽",
];

const COLOR_OPTIONS = [
  "#003527", "#416900", "#8BC34A", "#C5E1A5",
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F0B27A", "#AED6F1",
];

export default function CategoriesPage() {
  const { user, loading: userLoading } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("📁");
  const [formColor, setFormColor] = useState("#6B7280");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories?userId=${user.id}&nested=true`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        setExpandedIds(new Set(data.map((c: Category) => c.id)));
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormIcon("📁");
    setFormColor("#6B7280");
    setParentId(null);
    setEditingCategory(null);
    setShowForm(false);
    setError(null);
  };

  const handleCreate = async () => {
    if (!user || !formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
          parentId: parentId || undefined,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create category");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!user || !editingCategory || !formName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: formName.trim(),
          icon: formIcon,
          color: formColor,
        }),
      });
      if (res.ok) {
        resetForm();
        fetchCategories();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update category");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!user || cat.isSystem) return;
    if (!confirm(`Delete "${cat.name}"? ${cat.children?.length ? "This will also delete all subcategories." : ""}`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}?userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setParentId(cat.parentId);
    setShowForm(true);
  };

  const startCreateSub = (parentId: string) => {
    setParentId(parentId);
    setEditingCategory(null);
    setFormName("");
    setFormIcon("📁");
    setFormColor("#6B7280");
    setShowForm(true);
  };

  const renderCategory = (cat: Category, depth: number = 0) => {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedIds.has(cat.id);
    const txCount = cat._count?.transactions || 0;

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-mist-gray transition-colors group ${
            depth > 0 ? "ml-6" : ""
          }`}
        >
          {/* Expand/collapse */}
          <button
            onClick={() => toggleExpand(cat.id)}
            className="w-5 h-5 flex items-center justify-center text-ash-gray hover:text-ink-black"
          >
            {hasChildren ? (
              isExpanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <span className="w-3.5" />
            )}
          </button>

          {/* Icon */}
          <span className="text-lg w-7 text-center" style={{ color: cat.color }}>{cat.icon}</span>

          {/* Name */}
          <span className="flex-1 text-sm font-medium text-ink-black">{cat.name}</span>

          {/* System badge */}
          {cat.isSystem && (
            <span className="flex items-center gap-1 text-[10px] text-ash-gray bg-mist-gray px-2 py-0.5 rounded-full">
              <Lock className="h-2.5 w-2.5" /> System
            </span>
          )}

          {/* Transaction count */}
          {txCount > 0 && (
            <span className="text-[10px] text-ash-gray bg-mist-gray px-2 py-0.5 rounded-full">
              {txCount} tx
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => startCreateSub(cat.id)}
              className="p-1 hover:bg-mist-gray rounded text-ash-gray hover:text-forest"
              title="Add subcategory"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {!cat.isSystem && (
              <>
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1 hover:bg-mist-gray rounded text-ash-gray hover:text-forest"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1 hover:bg-mist-gray rounded text-ash-gray hover:text-error"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-[#ececec] ml-5">
            {cat.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (userLoading || loading) {
    return <div className="flex items-center justify-center h-64 text-ash-gray">Loading categories...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Categories</h1>
          <p className="text-sm text-ash-gray">Manage your categories and subcategories</p>
        </div>
        <Button
          onClick={() => {
            setParentId(null);
            setEditingCategory(null);
            setFormName("");
            setFormIcon("📁");
            setFormColor("#6B7280");
            setShowForm(true);
          }}
          className="bg-forest text-lime-vibrant hover:bg-forest/90 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" /> New Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-paper-white border border-[#ececec] rounded-cards p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink-black">
              {editingCategory ? "Edit Category" : parentId ? "New Subcategory" : "New Category"}
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-mist-gray rounded text-ash-gray">
              <X className="h-4 w-4" />
            </button>
          </div>

          {parentId && !editingCategory && (
            <div className="text-xs text-ash-gray">
              Parent: {categories.find(c => c.id === parentId)?.icon} {categories.find(c => c.id === parentId)?.name}
            </div>
          )}

          {error && (
            <div className="text-sm text-error bg-error/10 p-2 rounded-lg">{error}</div>
          )}

          <div>
            <Label className="text-xs font-semibold text-ink-black mb-1 block">Name</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Groceries, Subscriptions..."
              className="bg-paper-white border-[#ececec] rounded-lg"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-ink-black mb-2 block">Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    formIcon === icon
                      ? "bg-lime-vibrant/20 ring-2 ring-forest scale-110"
                      : "bg-mist-gray hover:bg-mist-gray/80"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-ink-black mb-2 block">Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formColor === color ? "ring-2 ring-forest ring-offset-2 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={editingCategory ? handleUpdate : handleCreate}
              disabled={saving || !formName.trim()}
              className="bg-forest text-lime-vibrant hover:bg-forest/90 rounded-xl"
            >
              {saving ? "Saving..." : editingCategory ? "Update" : "Create"}
            </Button>
            <Button variant="ghost" onClick={resetForm} className="text-ash-gray">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Category Tree */}
      <div className="bg-paper-white border border-[#ececec] rounded-cards p-4">
        {categories.length > 0 ? (
          <div className="space-y-0.5">
            {categories.map(cat => renderCategory(cat))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-ash-gray">
            <FolderTree className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No categories yet</p>
            <p className="text-xs mt-1">Create your first category to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
