"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Wallet, Search, X } from "lucide-react";
import { BANKS } from "@/lib/constants";
import { useUser } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";

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

const BANK_ICONS: Record<string, string> = {
  "GTBank": "🏦",
  "Access Bank": "🏦",
  "Zenith Bank": "🏦",
  "First Bank": "🏦",
  "Kuda": "🏦",
  "OPay": "💳",
  "Moniepoint": "💳",
  "PalmPay": "💳",
  "UBA": "🏦",
  "Wema Bank": "🏦",
  "Fidelity Bank": "🏦",
  "Sterling Bank": "🏦",
  "Union Bank": "🏦",
  "Polaris Bank": "🏦",
  "Unity Bank": "🏦",
  "Stanbic IBTC": "🏦",
  "Ecobank": "🏦",
  "Standard Chartered": "🏦",
};

export default function BanksPage() {
  const { user, loading: userLoading } = useUser();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [step, setStep] = useState<"select" | "details">("select");
  const [form, setForm] = useState({
    accountName: "",
    accountNumber: "",
    nickname: "",
    openingBalance: "",
  });

  useEffect(() => {
    if (user) fetchBanks();
  }, [user]);

  if (userLoading || !user) return <div className="flex items-center justify-center h-64"><div className="text-ash-gray">Loading...</div></div>;

  const fetchBanks = async () => {
    try {
      const res = await fetch(`/api/banks?userId=${user?.id || ""}`);
      if (res.ok) {
        setBanks(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "",
          bankName: selectedBank,
          ...form,
          openingBalance: parseFloat(form.openingBalance) || 0,
        }),
      });

      if (res.ok) {
        closeModal();
        fetchBanks();
      }
    } catch (err) {
      console.error("Failed to create bank:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all transactions for this bank.")) return;
    try {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (res.ok) fetchBanks();
    } catch (err) {
      console.error("Failed to delete bank:", err);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    setStep("select");
    setSelectedBank("");
    setBankSearch("");
    setForm({ accountName: "", accountNumber: "", nickname: "", openingBalance: "" });
  };

  const closeModal = () => {
    setModalOpen(false);
    setStep("select");
    setSelectedBank("");
  };

  const selectBank = (bank: string) => {
    setSelectedBank(bank);
    setStep("details");
  };

  const filteredBanks = BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-signifier text-[28px] text-ink-black">Connected Accounts</h1>
          <p className="text-sm text-ash-gray">Manage your linked Nigerian bank accounts</p>
        </div>
        <Button onClick={openModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Bank
        </Button>
      </div>

      {/* Bank Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-ash-gray">Loading banks...</div>
      ) : banks.length === 0 ? (
        <div className="bg-paper-white border border-[#ececec] rounded-cards py-16 text-center">
          <Building2 className="h-12 w-12 text-ash-gray/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink-black mb-2">No banks added yet</h3>
          <p className="text-ash-gray mb-4">Add your first bank to start tracking transactions</p>
          <Button onClick={openModal}>Add Your First Bank</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank, idx) => (
            <div
              key={bank.id}
              className={`rounded-cards p-6 text-white relative overflow-hidden group ${
                idx === 0
                  ? "bg-gradient-to-br from-forest to-forest-container shadow-elevated"
                  : "bg-paper-white border border-[#ececec] text-ink-black hover:shadow-subtle transition-shadow"
              }`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className={`text-sm mb-1 ${idx === 0 ? "text-white/60" : "text-ash-gray"}`}>
                      {bank.nickname || bank.bankName}
                    </p>
                    <p className="text-2xl font-mono font-medium">
                      {formatCurrency(bank.openingBalance)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${idx === 0 ? "bg-white/20 backdrop-blur-md" : "bg-mist-gray"}`}>
                    <Building2 className={`h-5 w-5 ${idx === 0 ? "text-lime-vibrant" : "text-forest"}`} />
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className={`text-xs font-mono ${idx === 0 ? "text-white/60" : "text-ash-gray"}`}>
                      {bank.accountNumber ? `••••${bank.accountNumber.slice(-4)}` : "No account number"}
                    </p>
                    <p className={`text-[10px] mt-1 px-2 py-0.5 rounded inline-block ${
                      idx === 0
                        ? "bg-lime-vibrant/20 text-lime-vibrant"
                        : "bg-lime-vibrant/20 text-forest"
                    }`}>
                      {bank._count.statements} statements uploaded
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(bank.id)}
                    className={`text-xs font-semibold hover:underline ${idx === 0 ? "text-white/60" : "text-error"}`}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Decorative circle */}
              <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl ${
                idx === 0 ? "bg-white/5" : "bg-lime-vibrant/5"
              }`}></div>
            </div>
          ))}
        </div>
      )}

      {/* Add Bank Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-paper-white w-full max-w-xl rounded-cards overflow-hidden shadow-elevated">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#ececec] flex justify-between items-center bg-mist-gray">
              <div>
                <h3 className="font-signifier text-lg text-ink-black">Connect New Account</h3>
                <p className="text-sm text-ash-gray">Select your bank from the list of Nigerian providers</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-paper-white rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-gray" />
              </button>
            </div>

            {step === "select" ? (
              <>
                {/* Search */}
                <div className="p-6 pb-0">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ash-gray" />
                    <input
                      type="text"
                      placeholder="Search for your bank..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[#ececec] rounded-xl focus:ring-2 focus:ring-lime focus:outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Bank Grid */}
                <div className="p-6 grid grid-cols-4 gap-4 max-h-[300px] overflow-y-auto">
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank}
                      onClick={() => selectBank(bank)}
                      className="flex flex-col items-center gap-2 p-4 border border-[#ececec] rounded-xl hover:border-lime hover:bg-mist-gray transition-all group"
                    >
                      <div className="w-12 h-12 bg-paper-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-2xl">
                        {BANK_ICONS[bank] || "🏦"}
                      </div>
                      <span className="text-[10px] font-semibold text-ash-gray">{bank}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Details Form */}
                <div className="p-6 space-y-4">
                  <div className="p-3 bg-mist-gray rounded-lg flex items-center gap-3">
                    <span className="text-2xl">{BANK_ICONS[selectedBank] || "🏦"}</span>
                    <span className="font-semibold text-sm text-ink-black">{selectedBank}</span>
                    <button onClick={() => setStep("select")} className="ml-auto text-xs text-lime hover:underline">Change</button>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-ink-black">Account Name</Label>
                    <Input
                      value={form.accountName}
                      onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                      className="bg-mist-gray border-[#ececec] rounded-inputs mt-1"
                      placeholder="e.g., John Doe Savings"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Account Number</Label>
                    <Input
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      className="bg-mist-gray border-[#ececec] rounded-inputs mt-1"
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Nickname</Label>
                    <Input
                      value={form.nickname}
                      onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                      className="bg-mist-gray border-[#ececec] rounded-inputs mt-1"
                      placeholder="e.g., GT Salary"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-ink-black">Opening Balance (₦)</Label>
                    <Input
                      type="number"
                      value={form.openingBalance}
                      onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                      className="bg-mist-gray border-[#ececec] rounded-inputs mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-mist-gray flex justify-end gap-4 border-t border-[#ececec]">
                  <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleCreate}>Proceed</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
