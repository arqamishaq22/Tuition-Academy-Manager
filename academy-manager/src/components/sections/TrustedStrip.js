"use client";

import { motion } from "framer-motion";
import {
  Calculator,
  Atom,
  Languages,
  Laptop,
  BookMarked,
} from "lucide-react";

// Subjects & disciplines supported
const subjects = [
  { label: "Mathematics", icon: Calculator, desc: "Matric, FSc & O/A Levels" },
  { label: "Science & Physics", icon: Atom, desc: "Biology & Chemistry" },
  { label: "English Language", icon: Languages, desc: "Grammar & Spoken" },
  { label: "Computer Science", icon: Laptop, desc: "ICS & Coding" },
  { label: "Quran & Islamic", icon: BookMarked, desc: "Nazra & Hifz" },
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

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function TrustedStrip() {
  return (
    <section className="border-y border-slate-200/80 bg-slate-50/70 py-10 dark:border-slate-800/80 dark:bg-[#131A2E]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Made for small academies and coaching centers
        </p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
        >
          {subjects.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                variants={itemVariants}
                className="flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-200/70 shadow-xs dark:bg-[#131A2E] dark:border-slate-800 transition-transform hover:-translate-y-0.5"
              >
                <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-2">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {item.desc}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default TrustedStrip;

