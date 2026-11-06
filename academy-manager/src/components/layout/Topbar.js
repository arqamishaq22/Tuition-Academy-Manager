"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";

// Map pathname to human-readable page titles
const pageTitles = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/classes": "Classes & Batches",
  "/attendance": "Daily Attendance",
  "/fees": "Fee Management",
  "/results": "Exams & Results",
  "/settings": "Academy Settings",
};

export function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef(null);

  // States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Page title lookup
  const pageTitle = pageTitles[pathname] || "Dashboard";

  // Global keyboard shortcut "/" to focus search input
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setMobileSearchOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#131A2E]/80 sm:px-6">
      {/* Left: Mobile hamburger menu & Page Title */}
      <div className="flex items-center space-x-3">
        {/* Hamburger button visible below lg */}
        <button
          onClick={onMenuClick}
          className="flex lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Page Title */}
        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Center: Search input with "/" shortcut (md and up) */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search students, roll numbers, fees..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-10 pr-9 text-xs text-slate-900 placeholder-slate-400 shadow-xs transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-[#131A2E]"
          />
          {/* Keyboard shortcut hint */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <kbd className="hidden sm:inline-flex items-center justify-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Search button (below md), ThemeToggle, Notifications, User Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile Search Icon Button (visible below md) */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="flex md:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          aria-label="Toggle mobile search"
        >
          {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>

        {/* Notification Bell with pulsing dot */}
        <button
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer transition-colors"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Pulsing indicator dot */}
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar with Dropdown */}
        <div className="relative pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
          >
            <Avatar name="Arqam Ishaq" size="sm" />
            <div className="hidden xl:block text-left pr-1">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                Arqam Ishaq
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Owner
              </span>
            </div>
          </button>

          {/* Animated Dropdown Menu (fade & scale) */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-[#131A2E] z-50"
              >
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Arqam Ishaq
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Owner • Academy Admin
                  </p>
                </div>

                {/* Dropdown Options */}
                <div className="pt-1.5 space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/login");
                    }}
                    className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expandable Mobile Search Bar (Below md) */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-16 left-0 right-0 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#131A2E] md:hidden z-20 shadow-md"
          >
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search students, roll numbers, fees..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Topbar;
