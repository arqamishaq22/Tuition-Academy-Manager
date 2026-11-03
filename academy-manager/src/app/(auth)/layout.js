"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ArrowLeft, Check, Sparkles } from "lucide-react";

// Stagger animation for benefit bullets
const bulletContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.2,
    },
  },
};

const bulletItem = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const benefits = [
  "Mark daily attendance in 30 seconds from any phone",
  "Automated PKR fee vouchers & WhatsApp payment reminders",
  "Instant term report cards & transparent parent portal",
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B1020] text-slate-900 dark:text-slate-100 relative overflow-x-hidden font-body">
      {/* "Back to home" floating link */}
      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 inline-flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-[#131A2E]/90 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to home</span>
      </Link>

      {/* LEFT HALF: Brand Panel (Desktop lg and above) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-accent-800 p-12 xl:p-16 text-white flex-col justify-between">
        {/* Animated Floating Glow Blobs */}
        <div className="absolute top-1/4 -left-12 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl animate-float pointer-events-none" />
        <div
          className="absolute bottom-10 -right-12 h-72 w-72 rounded-full bg-primary-400/25 blur-3xl animate-float pointer-events-none"
          style={{ animationDelay: "2.5s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] opacity-10 [background-size:20px_20px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 pt-8">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-700 shadow-lg transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-heading text-xl font-extrabold tracking-tight text-white block">
                Academy Manager
              </span>
              <span className="text-[11px] text-accent-200 font-medium block">
                Tuition Center SaaS • Pakistan
              </span>
            </div>
          </Link>
        </div>

        {/* Center Content: Headline & 3 Animated Benefit Bullets */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md text-accent-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart Coaching Administration</span>
            </div>
            <h1 className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your academy, <br />
              <span className="text-accent-300">organized.</span>
            </h1>
            <p className="text-sm text-white/80 leading-relaxed">
              Say goodbye to paper registers, delayed fee payments, and manual registers. Join 25+ tuition academies across Pakistan.
            </p>
          </div>

          {/* 3 Animated Benefit Bullets */}
          <motion.div
            variants={bulletContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4 pt-2"
          >
            {benefits.map((bullet, idx) => (
              <motion.div
                key={idx}
                variants={bulletItem}
                className="flex items-start space-x-3.5 rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10"
              >
                <div className="h-6 w-6 rounded-lg bg-emerald-400 text-slate-900 flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-bold">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/95 leading-snug">
                  {bullet}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer info in brand panel */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
          <span>🇵🇰 Built for Pakistani Education</span>
          <span>Free Forever Pilot</span>
        </div>
      </div>

      {/* RIGHT HALF: Form Container (and Mobile Full View) */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 relative">
        {/* Mobile Background Glow (Below lg) */}
        <div className="lg:hidden absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/50 via-transparent to-accent-50/30 dark:from-primary-950/20 dark:via-transparent dark:to-accent-950/10 pointer-events-none" />

        <div className="w-full max-w-md mx-auto pt-16 sm:pt-12 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

