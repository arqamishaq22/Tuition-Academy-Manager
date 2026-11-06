"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  Wallet,
  Award,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

// Navigation links with Lucide icons
export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Classes", href: "/classes", icon: BookOpen },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Fees", href: "/fees", icon: Wallet },
  { label: "Results", href: "/results", icon: Award },
  { label: "Settings", href: "/settings", icon: Settings },
];

// Stagger animation container for sidebar items
const navListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  className,
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={cn(
        "flex h-full flex-col justify-between border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out dark:border-slate-800 dark:bg-[#131A2E]",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Top Header: Brand Logo */}
      <div>
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-100 px-4 dark:border-slate-800/80",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            onClick={isMobileDrawer ? onCloseMobileDrawer : undefined}
            className="flex items-center space-x-3 group overflow-hidden"
          >
            {/* Primary Gradient Logo Badge */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/20 transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>

            {!isCollapsed && (
              <div className="truncate text-left">
                <span className="font-heading text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 block truncate">
                  Academy Manager
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Tuition Center SaaS
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Chevron Button (hidden on mobile drawer) */}
          {!isMobileDrawer && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer transition-colors",
                isCollapsed && "mx-auto mt-2"
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <motion.nav
          variants={navListVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5 px-3 py-4"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <motion.div key={item.href} variants={navItemVariants}>
                <Link
                  href={item.href}
                  onClick={isMobileDrawer ? onCloseMobileDrawer : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 select-none",
                    isCollapsed ? "justify-center" : "space-x-3",
                    isActive
                      ? "bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                  )}
                >
                  {/* Active Indicator Bar (Animated layoutId slides between items) */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-600 dark:bg-primary-400"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  {/* Icon with hover nudge effect */}
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-200",
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-100 group-hover:translate-x-0.5"
                    )}
                  />

                  {/* Nav Item Label */}
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </div>

      {/* Bottom Footer Section: Academy Card & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Academy Summary Card */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70 dark:bg-slate-850 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Punjab Coaching Center
                </span>
                <Badge variant="info" className="text-[10px] px-1.5 py-0.2 shrink-0">
                  Free Pilot
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Lahore Campus • PK
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                router.push("/login");
              }}
              className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-1">
            {/* Collapsed Tooltip Icon for Plan */}
            <div
              className="h-8 w-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 text-[10px] font-bold"
              title="Punjab Coaching Center (Free Pilot)"
            >
              PCC
            </div>

            {/* Collapsed Logout Icon */}
            <button
              onClick={() => {
                router.push("/login");
              }}
              className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer"
              title="Log Out"
              aria-label="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
