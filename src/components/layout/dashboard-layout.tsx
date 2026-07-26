"use client";

import { Sidebar } from "./sidebar";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useUser } from "@/lib/hooks";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen bg-paper-white">
      <Sidebar />
      <div className="ml-[260px] flex-1 flex flex-col">
        {/* Header — Steep-style with serif title */}
        <header className="h-20 bg-paper-white/80 backdrop-blur-md border-b border-[#ececec]/50 flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="font-signifier text-[28px] text-ink-black">Dashboard</h2>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-smoke-gray" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="bg-mist-gray border-none rounded-buttons pl-10 pr-4 py-2 w-64 text-sm text-ink-black placeholder:text-smoke-gray focus:outline-none focus:ring-2 focus:ring-lime-vibrant/50 transition-all"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-gray hover:text-forest transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#ececec] cursor-pointer">
              <div className="text-right">
                <div className="text-sm font-semibold text-ink-black">{user?.name || "User"}</div>
                <div className="text-xs text-ash-gray">Premium User</div>
              </div>
              <div className="w-10 h-10 bg-forest-container rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <ChevronDown className="h-4 w-4 text-ash-gray" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
