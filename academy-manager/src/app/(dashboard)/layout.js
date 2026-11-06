"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  // Desktop sidebar collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("academy_sidebar_collapsed");
        if (stored !== null) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    return false;
  });
  // Mobile drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Toggle collapse and save state
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("academy_sidebar_collapsed", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1020] dark:text-slate-100 flex overflow-x-hidden font-body">
      {/* 1. Desktop Fixed Sidebar (visible on lg and up) */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* 2. Mobile Responsive Nav: Slide-in Drawer (below lg) & Bottom Tab Bar (below md) */}
      <MobileNav
        isDrawerOpen={mobileDrawerOpen}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
        onOpenDrawer={() => setMobileDrawerOpen(true)}
      />

      {/* 3. Main Application Area (pushed right on lg and up) */}
      <div
        className={cn(
          "flex flex-1 flex-col min-w-0 transition-[padding] duration-300 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        {/* Sticky Topbar */}
        <Topbar onMenuClick={() => setMobileDrawerOpen(true)} />

        {/* Content Area with Max Width 1400px and bottom padding for mobile tab bar */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="max-w-[1400px] mx-auto w-full">
            {/* Animated Page Transitions (250ms fade and slide-up) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
