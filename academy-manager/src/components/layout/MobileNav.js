"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

// 5 Most important mobile navigation items
const bottomNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Fees", href: "/fees", icon: Wallet },
  { label: "More", href: "#more", icon: MoreHorizontal, isDrawerTrigger: true },
];

export function MobileNav({
  isDrawerOpen,
  onCloseDrawer,
  onOpenDrawer,
}) {
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    if (isDrawerOpen && onCloseDrawer) {
      onCloseDrawer();
    }
  }, [pathname, isDrawerOpen, onCloseDrawer]);

  // Close drawer on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isDrawerOpen && onCloseDrawer) {
        onCloseDrawer();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, onCloseDrawer]);

  return (
    <>
      {/* 1. Slide-in Drawer from Left with Dark Blurred Overlay (Visible below lg) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Blurred Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
              onClick={onCloseDrawer}
              aria-label="Close navigation overlay"
            />

            {/* Slide-out Sidebar Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-[#131A2E]"
            >
              {/* Close Button Inside Drawer Header */}
              <div className="absolute top-4 right-3 z-20">
                <button
                  onClick={onCloseDrawer}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sidebar Component in Full Width Mobile Mode */}
              <Sidebar
                isCollapsed={false}
                isMobileDrawer={true}
                onCloseMobileDrawer={onCloseDrawer}
                className="w-full border-r-0"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Bottom Tab Bar for Small Screens (Visible below md) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-[#131A2E]/90 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <nav className="flex items-center justify-around px-2 pt-1.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = !item.isDrawerTrigger && pathname === item.href;

            if (item.isDrawerTrigger) {
              return (
                <button
                  key={item.label}
                  onClick={onOpenDrawer}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
                    isDrawerOpen && "text-primary-600 dark:text-primary-400 font-semibold"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors select-none",
                  isActive
                    ? "text-primary-600 dark:text-primary-400 font-bold"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute -bottom-1 h-1 w-5 rounded-full bg-primary-600 dark:bg-primary-400"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default MobileNav;
