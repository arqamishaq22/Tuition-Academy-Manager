import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Button with variants, sizes, left/right icons, loading state, and lift/press micro-interactions
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-primary-600 to-accent-500 text-white hover:opacity-95 shadow-md shadow-primary-500/20 focus:ring-primary-500",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400",
    outline:
      "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/80 focus:ring-slate-400",
    ghost:
      "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-slate-400",
    danger:
      "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 focus:ring-rose-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      className={cn(
        "inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none",
        // Smooth lift on hover, press down on click
        !isButtonDisabled && "hover:-translate-y-0.5 hover:shadow-md active:scale-95 cursor-pointer",
        "transition-all duration-200 ease-out",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={cn("animate-spin shrink-0", iconSizes[size] || iconSizes.md)} />
      ) : (
        LeftIcon && <LeftIcon className={cn("shrink-0", iconSizes[size] || iconSizes.md)} />
      )}
      <span>{children}</span>
      {!isLoading && RightIcon && (
        <RightIcon className={cn("shrink-0", iconSizes[size] || iconSizes.md)} />
      )}
    </button>
  );
}

export default Button;
