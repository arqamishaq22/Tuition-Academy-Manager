"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Input field with label, helper text, shake error state, left icon, and right element
export function Input({
  label,
  helperText,
  error,
  id,
  type = "text",
  placeholder,
  leftIcon: LeftIcon,
  rightElement,
  className,
  disabled = false,
  ...props
}) {
  return (
    <div className="w-full space-y-1.5 text-left">
      {/* Field Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Input container with optional left icon & right element */}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-slate-400">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs transition-colors",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
            "dark:border-slate-800 dark:bg-[#131A2E] dark:text-slate-100 dark:placeholder-slate-500 dark:disabled:bg-slate-900",
            LeftIcon && "pl-10",
            rightElement && "pr-11",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500",
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {/* Animated Error with AlertCircle & shake */}
      {error ? (
        <motion.p
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: [0, -3, 3, -3, 2, 0] }}
          transition={{ duration: 0.3 }}
          className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </motion.p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Input;
