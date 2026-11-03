"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Can parents pay tuition fees through JazzCash or EasyPaisa?",
    answer:
      "Yes! Academy Manager generates printable PKR fee vouchers with your academy's JazzCash, EasyPaisa, or bank account details. Once parents send payment screenshots or transaction IDs, you can mark the voucher as Paid with a single click.",
  },
  {
    question: "How do WhatsApp alerts work for absent students?",
    answer:
      "When a teacher marks a student absent during attendance, the system generates a ready-to-send WhatsApp notification with the student's name, class, and date. You can dispatch alerts automatically or manually click to send directly to the parent's phone.",
  },
  {
    question: "Can we manage different classes like Matric, FSc, and ICS?",
    answer:
      "Absolutely. You can create unlimited subject batches (e.g. Class 10 Physics & Math, FSc Pre-Medical Chemistry, ICS Computer Science) with custom fee amounts, assigned teachers, and schedules.",
  },
  {
    question: "Can teachers use the app on their smartphones?",
    answer:
      "Yes! Academy Manager is fully responsive and optimized for mobile browsers. Teachers can log in on any Android phone or iPhone and mark attendance in less than 30 seconds without needing a computer.",
  },
  {
    question: "What happens when my Free Pilot ends?",
    answer:
      "The Free Pilot lets you test all core features for up to 30 students forever. When your academy grows beyond 30 students, you can easily upgrade to the Standard plan starting at just Rs. 2,800/month. No data is ever lost.",
  },
  {
    question: "Is our student record and fee data safe and secure?",
    answer:
      "Your academy records, parent contact numbers, and financial vouchers are encrypted and strictly private. Only authenticated administrators and teachers authorized by your academy can access the dashboard.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0); // First item open by default

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400 font-body max-w-xl mx-auto">
            Everything you need to know about setting up and running Academy Manager for your coaching center.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "border-primary-300 bg-white shadow-md dark:border-primary-800 dark:bg-[#131A2E]"
                    : "border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-[#131A2E]/50"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between p-5 sm:p-6 text-left cursor-pointer transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 pr-4">
                    {faq.question}
                  </span>

                  {/* Plus Icon that rotates into an X */}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 transition-transform duration-300",
                      isOpen && "rotate-45 bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>

                {/* Smooth Height Animation */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-body border-t border-slate-100 dark:border-slate-800/80 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;

