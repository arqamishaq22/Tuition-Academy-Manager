"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden p-8 sm:p-12 md:p-16 text-center text-white bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 shadow-2xl"
        >
          {/* Animated background surface */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-15 [background-size:20px_20px]" />
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-accent-400/30 blur-3xl pointer-events-none animate-float" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-primary-400/30 blur-3xl pointer-events-none animate-float" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-accent-200" />
              <span>Modernize Your Coaching Center Today</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-white leading-tight">
              Ready to run your academy without paper registers?
            </h2>

            <p className="text-sm sm:text-base text-white/90 font-body leading-relaxed max-w-xl mx-auto">
              Join leading tutors and coaching academies across Pakistan. Start your free pilot in under 5 minutes with zero setup fees.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary-700 hover:bg-slate-100 shadow-xl font-bold group gap-2"
                >
                  <span>Start Your Free Pilot Today</span>
                  <ArrowRight className="h-4 w-4 text-primary-700 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-white/80 pt-2">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-accent-200" /> Free Forever Tier
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-accent-200" /> WhatsApp Ready
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-accent-200" /> 24/7 Local Support
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FinalCTA;

