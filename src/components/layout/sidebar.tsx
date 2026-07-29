"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import {
  HomeIcon,
  BuildingOffice2Icon,
  TableCellsIcon,
  ArrowsRightLeftIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  FlagIcon,
  WalletIcon,
  ArrowLeftOnRectangleIcon,
  FolderIcon,
  XMarkIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowsRightLeftIcon },
  { name: "Merchants", href: "/dashboard/merchants", icon: ShoppingBagIcon },
  { name: "Report", href: "/dashboard/report", icon: DocumentTextIcon },
  { name: "Upload", href: "/dashboard/upload", icon: TableCellsIcon },
  { name: "Banks", href: "/dashboard/banks", icon: BuildingOffice2Icon },
  { name: "Budgets", href: "/dashboard/budgets", icon: WalletIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: ChartPieIcon },
  { name: "Goals", href: "/dashboard/goals", icon: FlagIcon },
  { name: "Categories", href: "/dashboard/settings/categories", icon: FolderIcon },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-container rounded-buttons flex items-center justify-center text-white">
            <span className="font-bold text-lg">C</span>
          </div>
          <div>
            <h1 className="font-signifier text-[22px] text-forest leading-tight">CONYEST</h1>
            <p className="text-[10px] uppercase tracking-widest text-ash-gray font-medium">Financial Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-gray hover:text-forest" aria-label="Close sidebar">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-buttons text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                isActive
                  ? "bg-lime-vibrant text-forest font-semibold"
                  : "text-slate-gray hover:text-forest hover:bg-mist-gray"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]",
            pathname === "/dashboard/settings"
              ? "text-forest bg-mist-gray"
              : "text-slate-gray hover:text-forest hover:bg-mist-gray"
          )}
        >
          <Cog6ToothIcon className="h-5 w-5 shrink-0" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-gray hover:text-forest hover:bg-mist-gray transition-all active:scale-[0.97]"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-surface-lowest border-r border-[#ececec] min-h-screen p-6 flex flex-col gap-4 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}