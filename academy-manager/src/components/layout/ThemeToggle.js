"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// ThemeToggle with smooth rotate and fade icon swap
export function ThemeToggle({ className }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("h-9 w-9 rounded-xl border border-transparent p-2", className)} />
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-200 ease-out dark:border-slate-800 dark:bg-[#131A2E] dark:text-slate-300 dark:hover:bg-slate-800/80 cursor-pointer overflow-hidden",
        className
      )}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun Icon (Rotates and scales out in dark mode) */}
      <Sun
        className={cn(
          "h-4 w-4 transition-all duration-300 ease-out",
          isDark
            ? "rotate-90 scale-0 opacity-0 absolute"
            : "rotate-0 scale-100 opacity-100 text-amber-500"
        )}
      />

      {/* Moon Icon (Rotates and scales in for dark mode) */}
      <Moon
        className={cn(
          "h-4 w-4 transition-all duration-300 ease-out",
          isDark
            ? "rotate-0 scale-100 opacity-100 text-indigo-400"
            : "-rotate-90 scale-0 opacity-0 absolute"
        )}
      />
    </button>
  );
}

export default ThemeToggle;
