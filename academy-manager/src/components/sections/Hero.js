import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Hero section for the landing page
export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 text-center bg-gradient-to-b from-emerald-50/50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Pakistani Tuition Badge */}
        <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-6">
          <span>🇵🇰 Built specifically for Pakistani Academies & Tuition Centers</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
          Manage your Academy, Students & Fees{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            Effortlessly
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base text-slate-600 dark:text-slate-300 sm:text-lg max-w-2xl mx-auto">
          From student admissions, attendance, monthly fee collection via JazzCash/EasyPaisa, to exam results and parent SMS alerts — everything your coaching center needs in one simple dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              Live Demo Dashboard
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            No credit card required
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            PKR Currency & Local Billing
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Parent Portal & WhatsApp Alerts
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

