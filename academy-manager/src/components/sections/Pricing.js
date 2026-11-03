"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

  const plans = [
    {
      name: "Free Pilot",
      badge: "Free Trial",
      description: "Ideal for home tutors and testing with a single class batch.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      period: "forever",
      features: [
        "Up to 30 active students",
        "1 teacher account",
        "Daily attendance tracking",
        "Basic fee voucher generation",
        "Web dashboard access",
      ],
      popular: false,
      cta: "Start Free Pilot",
      href: "/signup",
    },
    {
      name: "Standard",
      badge: "Most Popular",
      description: "Perfect for growing tuition centers with multiple batches.",
      monthlyPrice: 3500,
      yearlyPrice: 2800, // 20% off
      period: "/ month",
      features: [
        "Up to 150 active students",
        "Up to 5 teacher accounts",
        "JazzCash & EasyPaisa fee records",
        "Automated WhatsApp fee reminders",
        "Monthly attendance percentage logs",
        "Term exam result cards",
        "Parent portal access",
      ],
      popular: true,
      cta: "Start 14-Day Free Trial",
      href: "/signup",
    },
    {
      name: "Pro Institute",
      badge: "Unlimited Scale",
      description: "For established coaching colleges with large student bodies.",
      monthlyPrice: 7500,
      yearlyPrice: 6000, // 20% off
      period: "/ month",
      features: [
        "Unlimited students & batches",
        "Unlimited staff & teacher accounts",
        "Custom SMS gateway integration",
        "Multi-branch support",
        "Advanced revenue & dues analytics",
        "Priority WhatsApp support",
        "Dedicated onboarding manager",
      ],
      popular: false,
      cta: "Get Started Pro",
      href: "/signup",
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

  return (
    <section id="pricing" className="py-20 md:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Affordable Pakistani Tuition Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transparent Pricing in PKR
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400 font-body max-w-2xl mx-auto">
            Choose the plan that fits your academy. Cancel anytime with zero hidden charges.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-[#131A2E] dark:text-slate-100"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center space-x-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-[#131A2E] dark:text-slate-100"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>Yearly</span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
        >
          {plans.map((plan) => {
            const displayPrice =
              plan.monthlyPrice === 0
                ? "Rs. 0"
                : billingCycle === "yearly"
                ? `Rs. ${plan.yearlyPrice.toLocaleString()}`
                : `Rs. ${plan.monthlyPrice.toLocaleString()}`;

            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                className={`relative flex flex-col rounded-2xl border bg-white p-7 shadow-xs dark:bg-[#131A2E] transition-all duration-200 ${
                  plan.popular
                    ? "border-primary-500 shadow-xl shadow-primary-500/10 ring-2 ring-primary-500 dark:border-primary-400"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Most Popular Badge */}
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Animated Price display */}
                  <div className="py-2 border-y border-slate-100 dark:border-slate-800">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={displayPrice}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-baseline space-x-1"
                      >
                        <span className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white">
                          {displayPrice}
                        </span>
                        <span className="text-xs text-slate-400">
                          {plan.monthlyPrice === 0 ? "forever" : "/ month"}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                    {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Billed annually (Rs. {(plan.yearlyPrice * 12).toLocaleString()} / yr)
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <Link href={plan.href} className="w-full block">
                    <Button
                      variant={plan.popular ? "primary" : "outline"}
                      className="w-full justify-center group"
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default Pricing;
