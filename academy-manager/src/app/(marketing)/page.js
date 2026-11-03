import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Landing page for Academy Manager
export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl space-y-4">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Pakistan Tuition SaaS
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Academy Manager Landing Page
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage students, classes, attendance, fees, and results for tuition academies and coaching centers in Pakistan.
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

