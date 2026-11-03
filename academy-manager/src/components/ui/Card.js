import { cn } from "@/lib/utils";

// Card container with rounded-2xl, soft shadow, border, and optional hover lift with glow
export function Card({
  className,
  hoverLift = false,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        "dark:border-slate-800 dark:bg-[#131A2E]",
        hoverLift &&
          "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card header area for title and badges
export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("mb-4 flex flex-col space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

// Card title with tight tracking
export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

// Card description
export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-xs text-slate-500 dark:text-slate-400 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// Card main body content
export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("text-sm text-slate-700 dark:text-slate-300", className)} {...props}>
      {children}
    </div>
  );
}

// Card bottom footer area
export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center pt-3 border-t border-slate-100 dark:border-slate-800/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
