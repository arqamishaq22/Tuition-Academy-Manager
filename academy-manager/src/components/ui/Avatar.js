import { cn } from "@/lib/utils";

// Avatar component that displays user photo or generated 2-letter initials
export function Avatar({ src, name = "User", size = "md", className }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  // Extract initials cleanly (e.g. "Muhammad Ali" -> "MA")
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden bg-primary-100 text-primary-800 font-semibold select-none border border-primary-200",
        "dark:bg-primary-950 dark:text-primary-300 dark:border-primary-900",
        sizes[size] || sizes.md,
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials || "U"}</span>
      )}
    </div>
  );
}

export default Avatar;
