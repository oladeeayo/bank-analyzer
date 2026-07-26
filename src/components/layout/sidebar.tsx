"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  ArrowLeftRight,
  PieChart,
  Settings,
  Target,
  Wallet,
  CreditCard,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Payments", href: "/dashboard/transactions", icon: CreditCard },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { name: "Invoices", href: "/dashboard/upload", icon: FileSpreadsheet },
  { name: "Cards", href: "/dashboard/banks", icon: Building2 },
  { name: "Saving Plans", href: "/dashboard/budgets", icon: Wallet },
  { name: "Investments", href: "/dashboard/analytics", icon: PieChart },
  { name: "Insights", href: "/dashboard/goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#1a3a2a] min-h-screen p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center">
            <span className="text-[#1a3a2a] font-bold text-lg">B</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">CONVEST</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-emerald-400 text-[#1a3a2a] shadow-lg shadow-emerald-400/20"
                  : "text-emerald-100/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
