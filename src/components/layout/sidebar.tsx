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
  LogOut,
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
    <aside className="w-[260px] bg-surface-lowest border-r border-[#ececec] min-h-screen p-6 flex flex-col gap-4 fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-forest-container rounded-buttons flex items-center justify-center text-white">
          <span className="font-bold text-lg">C</span>
        </div>
        <div>
          <h1 className="font-signifier text-[22px] text-forest leading-tight">CONYEST</h1>
          <p className="text-[10px] uppercase tracking-widest text-ash-gray font-medium">Financial Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-buttons text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-lime-vibrant text-forest font-semibold"
                  : "text-slate-gray hover:text-forest hover:bg-mist-gray"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-2">
        {/* Pro Card */}
        <div className="bg-forest p-4 rounded-cards relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-white/80 text-sm mb-2">Analyze spending, gain financial control.</p>
            <button className="bg-lime-vibrant text-forest px-4 py-2 rounded-buttons text-sm font-semibold w-full hover:brightness-95 transition-all">
              Get Pro
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-lime-vibrant/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Settings & Logout */}
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "text-forest bg-mist-gray"
              : "text-slate-gray hover:text-forest hover:bg-mist-gray"
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-gray hover:text-forest hover:bg-mist-gray transition-colors">
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
