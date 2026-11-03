"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Users,
  Wallet,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Framer motion variants for staggering hero elements
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
  },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
      {/* 1. Animated Gradient Mesh Background & Floating Blurred Blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-transparent to-accent-50/40 dark:from-primary-950/20 dark:via-transparent dark:to-accent-950/20 animate-gradient-shift bg-[length:200%_200%]" />

        {/* Floating Blob 1 */}
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-3xl animate-float" />

        {/* Floating Blob 2 */}
        <div
          className="absolute bottom-10 -right-20 h-80 w-80 rounded-full bg-accent-400/20 dark:bg-accent-500/10 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Text & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center">
              <span className="inline-flex items-center space-x-2 rounded-full border border-primary-200/80 bg-primary-50/80 px-3.5 py-1 text-xs font-semibold text-primary-700 shadow-2xs dark:border-primary-800/80 dark:bg-primary-950/60 dark:text-primary-300">
                <Sparkles className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                <span>Built for academies in Pakistan</span>
              </span>
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
            >
              Run your academy{" "}
              <span className="text-brand-gradient">
                without the paper register
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-body"
            >
              Attendance, fees, results and parent updates in one simple app. Designed specifically for Pakistani tuition academies, coaching centers, and private tutors.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto group gap-2 shadow-lg shadow-primary-500/25"
                >
                  <span>Start free pilot</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>

              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  leftIcon={Play}
                  className="w-full sm:w-auto"
                >
                  Watch demo
                </Button>
              </a>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
              variants={itemVariants}
              className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>PKR fee vouchers & JazzCash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>WhatsApp parent alerts</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Dashboard Preview Card with Floating Chips */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Soft Glow behind preview */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary-500/20 via-accent-500/20 to-highlight-500/10 blur-2xl -z-10" />

            {/* Gentle Floating Wrapper */}
            <div className="relative w-full max-w-lg animate-float">
              {/* Dashboard Preview Card (CSS illustration of SaaS dashboard) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#131A2E]">
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-2">
                      Punjab Coaching Center
                    </span>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Live Batch
                  </Badge>
                </div>

                {/* Dashboard Metrics Row */}
                <div className="grid grid-cols-3 gap-2.5 my-3.5">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400">Total Students</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      128
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Fees Paid</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Rs. 640k
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary-50/60 p-2.5 border border-primary-100 dark:bg-primary-950/30 dark:border-primary-900/40">
                    <p className="text-[10px] text-primary-600 dark:text-primary-400">Attendance</p>
                    <p className="text-sm font-bold text-primary-700 dark:text-primary-300 mt-0.5">
                      96.4%
                    </p>
                  </div>
                </div>

                {/* Simulated Attendance Table / Rows */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span>Student</span>
                    <span>Class</span>
                    <span>Status</span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-[10px] font-bold flex items-center justify-center">
                        MA
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Muhammad Ali
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Class 10</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      Present
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 text-[10px] font-bold flex items-center justify-center">
                        FN
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Fatima Noor
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">FSc Med</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      Present
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center">
                        BA
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Bilal Ahmed
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Class 9</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 px-2 py-0.5 rounded-full">
                      Absent
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Stat Chip 1: Fees Collected 92% */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -top-4 -left-4 sm:-left-6 flex items-center space-x-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-[#131A2E]/95"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Monthly Collection</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Fees Collected 92%
                  </p>
                </div>
              </motion.div>

              {/* Floating Stat Chip 2: Attendance 96% */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="absolute -bottom-4 -right-4 sm:-right-6 flex items-center space-x-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-[#131A2E]/95"
              >
                <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-600">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Today&apos;s Ratio</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Attendance 96%
                  </p>
                </div>
              </motion.div>

              {/* Floating Stat Chip 3: Parent Alerts Sent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="hidden sm:flex absolute -bottom-6 left-6 items-center space-x-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-md dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span>WhatsApp alerts dispatched</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
