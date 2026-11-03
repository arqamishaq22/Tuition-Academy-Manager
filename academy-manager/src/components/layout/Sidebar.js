"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  Settings,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sidebar navigation links for the dashboard
export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Classes", href: "/classes", icon: BookOpen },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Fees", href: "/fees", icon: CreditCard },
  { label: "Results", href: "/results", icon: GraduationCap },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* Academy Brand / Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <School className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Academy Manager
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Tuition Management
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
        <p className="font-medium text-slate-600 dark:text-slate-300">
          Pakistan Edition (PKR)
        </p>
        <p className="text-[11px] text-slate-400">Academic Year 2026</p>
      </div>
    </aside>
  );
}

export default Sidebar;

