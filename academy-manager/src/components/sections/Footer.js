import Link from "next/link";
import { School } from "lucide-react";

// Landing page footer
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-950 text-xs text-slate-500">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
            <School className="h-4 w-4" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Academy Manager Pakistan
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <Link href="/login" className="hover:text-slate-800 dark:hover:text-slate-200">
            Staff Login
          </Link>
          <Link href="/parent" className="hover:text-slate-800 dark:hover:text-slate-200">
            Parent Portal
          </Link>
          <Link href="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200">
            Dashboard
          </Link>
        </div>

        <div>
          © {new Date().getFullYear()} Academy Manager. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;

