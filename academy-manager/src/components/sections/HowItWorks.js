"use client";

import { motion } from "framer-motion";
import { UserPlus, CheckSquare, Send, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Add Students & Batches",
    description:
      "Register students with their B-Form roll numbers, parent contact details, and assign them to Matric, FSc, or ICS subject batches.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Mark Attendance & Fees",
    description:
      "Teachers quickly mark daily attendance in 30 seconds. Record monthly fee collections with JazzCash, EasyPaisa, or Cash vouchers.",
    icon: CheckSquare,
  },
  {
    step: "03",
    title: "Parents Get Instant Updates",
    description:
      "Parents automatically receive instant WhatsApp alerts for absent days, monthly fee invoices, and term exam scorecards.",
    icon: Send,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-slate-50/70 dark:bg-[#131A2E]/30 border-y border-slate-200/80 dark:border-slate-800/80 scroll-mt-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 dark:border-accent-800 dark:bg-accent-950 dark:text-accent-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simple 3-Step Setup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
            How Academy Manager Works
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 font-body max-w-2xl mx-auto">
            Get your entire coaching center up and running in less than 10 minutes.
          </p>
        </div>

        {/* Steps Grid: Vertical on mobile, Horizontal on md+ */}
        <div className="relative">
          {/* Connecting Line (Horizontal on md+) */}
          <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-600 dark:from-primary-700 dark:via-accent-600 dark:to-primary-800 -z-0" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 relative z-10"
          >
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  variants={stepVariants}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-[#131A2E] dark:border-slate-800 relative group hover:shadow-lg transition-all"
                >
                  {/* Step Number Circle */}
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 text-white flex items-center justify-center font-heading font-extrabold text-xl shadow-md shadow-primary-500/25 mb-5 group-hover:scale-105 transition-transform">
                    {item.step}
                  </div>

                  <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-body">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;

