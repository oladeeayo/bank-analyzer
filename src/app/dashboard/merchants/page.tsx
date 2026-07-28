"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/hooks";
import { Search, ArrowUpRight } from "lucide-react";

interface MerchantSummary {
  merchantId: string;
  displayName: string;
  icon: string;
  color: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
}

export default function MerchantsPage() {
  const { user, loading: userLoading } = useUser();
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/merchants/summary`)
      .then((res) => res.json())
      .then((data) => {
        setMerchants(data.merchants || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = merchants.filter((m) =>
    m.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = merchants.reduce((s, m) => s + m.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-signifier text-[24px] sm:text-[28px] text-ink-black">Merchant Analytics</h1>
        <p className="text-sm text-ash-gray mt-1">Search and analyze your spending by merchant</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search merchants..."
          className="w-full bg-paper-white border border-[#ececec] rounded-inputs pl-11 pr-4 py-3 text-sm text-ink-black placeholder:text-ash-gray focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40 transition-all"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <p className="text-[11px] text-ash-gray uppercase tracking-wider">Total Merchants</p>
          <p className="text-xl font-mono font-medium text-ink-black mt-1">{merchants.length}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <p className="text-[11px] text-ash-gray uppercase tracking-wider">Total Spent</p>
          <p className="text-xl font-mono font-medium text-ink-black mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-paper-white border border-[#ececec] p-4 rounded-cards">
          <p className="text-[11px] text-ash-gray uppercase tracking-wider">Avg per Merchant</p>
          <p className="text-xl font-mono font-medium text-ink-black mt-1">
            {merchants.length > 0 ? formatCurrency(totalSpent / merchants.length) : "₦0"}
          </p>
        </div>
      </div>

      {/* Merchant List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ash-gray text-sm">
          {search ? "No merchants match your search" : "No merchants found. Upload a statement to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Link
              key={m.merchantId}
              href={`/dashboard/merchants/${m.merchantId}`}
              className="group bg-paper-white border border-[#ececec] p-5 rounded-cards hover:shadow-[rgba(4,23,43,0.05)0px_0px_0px_1px,rgba(0,0,0,0.08)0px_8px_32px_0px] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${m.color}15` }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-black group-hover:text-forest transition-colors">
                      {m.displayName}
                    </h3>
                    <p className="text-[11px] text-ash-gray">{m.transactionCount} transactions</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ash-gray group-hover:text-forest transition-colors" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-ash-gray uppercase tracking-wider">Total Spent</p>
                  <p className="text-lg font-mono font-medium text-forest">{formatCurrency(m.totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-ash-gray uppercase tracking-wider">Avg</p>
                  <p className="text-sm font-mono text-ink-black">{formatCurrency(m.averageAmount)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
