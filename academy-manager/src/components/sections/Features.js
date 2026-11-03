"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck,
  Wallet,
  MessageCircle,
  FileText,
  Users,
  BarChart3,
  Sparkles,
} from "lucide-react";

// Six core SaaS features for academies
const features = [
  {
    icon: CalendarCheck,
    title: "Attendance Marking",
    description:
      "One-click daily attendance marking with instant automated absence logs and monthly percentage calculations.",
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/50",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Wallet,
    title: "Fee Tracking & Vouchers",
    description:
      "Generate printable fee challans in PKR. Track paid, pending, and overdue dues with JazzCash & EasyPaisa support.",
    color: "bg-primary-500",
    lightBg: "bg-primary-50 dark:bg-primary-950/50",
    textColor: "text-primary-600 dark:text-primary-400",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Reminders",
    description:
      "Automate fee reminders and absent alerts directly to parents via WhatsApp with one click from your phone or desktop.",
    color: "bg-teal-500",
    lightBg: "bg-teal-50 dark:bg-teal-950/50",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  {
    icon: FileText,
    title: "Report Cards & Tests",
    description:
      "Record marks for weekly assessments and mid-term exams. Auto-calculate positions, percentages, and printable result cards.",
    color: "bg-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/50",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Users,
    title: "Dedicated Parent Portal",
    description:
      "Parents can check their child's attendance history, test scores, and pending fee status anytime without bothering staff.",
    color: "bg-indigo-500",
    lightBg: "bg-indigo-50 dark:bg-indigo-950/50",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: BarChart3,
    title: "Reports & Academy Insights",
    description:
      "Get clarity on monthly tuition revenue, batch capacity, best performing students, and teacher attendance trends.",
    color: "bg-rose-500",
    lightBg: "bg-rose-50 dark:bg-rose-950/50",
    textColor: "text-rose-600 dark:text-rose-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Essential Academy Toolkit</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
            Everything your coaching center needs
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 font-body max-w-2xl mx-auto">
            Replace heavy physical registers, manual Excel calculations, and lost fee slips with an intuitive digital workflow.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                variants={cardVariants}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-500/10 dark:border-slate-800 dark:bg-[#131A2E]"
              >
                {/* Colored Rounded Square Icon with bounce on hover */}
                <div
                  className={`h-12 w-12 rounded-xl ${feat.lightBg} ${feat.textColor} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                  {feat.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-body">
                  {feat.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default Features;
