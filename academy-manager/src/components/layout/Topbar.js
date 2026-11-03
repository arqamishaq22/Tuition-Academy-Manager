"use client";

import { Menu, Bell } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";

// Top bar navigation for the dashboard layout
export function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
      {/* Left side: Mobile menu button and Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/60 dark:text-emerald-400">
          Punjab Coaching Center
        </span>
      </div>

      {/* Right side: Notifications, Theme Toggle, and User Profile */}
      <div className="flex items-center space-x-3">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        <ThemeToggle />

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <Avatar name="Sir Arqam" size="sm" />
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Admin Arqam
            </p>
            <p className="text-[10px] text-slate-400">Academy Director</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

