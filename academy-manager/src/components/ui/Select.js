import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Select dropdown with label, helper text, error state, and optional left icon
export function Select({
  label,
  helperText,
  error,
  id,
  options = [],
  children,
  leftIcon: LeftIcon,
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

      {/* Select container */}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-slate-400">
            <LeftIcon className="h-4 w-4" />
          </div>
        )}

        <select
          id={id}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-10 text-sm text-slate-900 shadow-xs transition-colors cursor-pointer",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            "disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed",
            "dark:border-slate-800 dark:bg-[#131A2E] dark:text-slate-100 dark:disabled:bg-slate-900",
            LeftIcon && "pl-10",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500",
            className
          )}
          {...props}
        >
          {children ||
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>

        {/* Chevron icon */}
        <div className="pointer-events-none absolute right-3 flex items-center text-slate-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* Error or Helper text */}
      {error ? (
        <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Select;

