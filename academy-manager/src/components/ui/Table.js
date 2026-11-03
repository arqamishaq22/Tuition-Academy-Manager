import { cn } from "@/lib/utils";

// Responsive table container with horizontal scroll on smaller screens
export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table
        className={cn("w-full text-left text-sm text-slate-700 dark:text-slate-300", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

// Table header wrapper
export function TableHeader({ className, children, ...props }) {
  return (
    <thead
      className={cn(
        "border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500",
        "dark:border-slate-800 dark:bg-[#0B1020]/60 dark:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

// Table body wrapper
export function TableBody({ className, children, ...props }) {
  return (
    <tbody
      className={cn("divide-y divide-slate-100 bg-white dark:divide-slate-800/80 dark:bg-[#131A2E]", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

// Table row
export function TableRow({ className, children, ...props }) {
  return (
    <tr
      className={cn(
        "hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// Table head cell
export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn("px-4 py-3.5 font-medium", className)} {...props}>
      {children}
    </th>
  );
}

// Table cell
export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn("px-4 py-3.5 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

export default Table;
