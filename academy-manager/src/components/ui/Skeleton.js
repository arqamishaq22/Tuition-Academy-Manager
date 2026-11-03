import { cn } from "@/lib/utils";

// Skeleton component with animated shimmer effect for loading placeholders
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-200/80 dark:bg-slate-800/60",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent dark:before:via-white/10",
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
