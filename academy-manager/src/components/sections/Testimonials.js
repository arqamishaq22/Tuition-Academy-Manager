"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

const testimonials = [
  {
    name: "Sir Usman Ghani",
    role: "Founder & Physics Lead",
    academy: "Apex Coaching Center, Lahore",
    quote:
      "Before Academy Manager, tracking monthly fee registers for 180 students across Matric and FSc was a total nightmare. Now with JazzCash logs and automated WhatsApp alerts, our on-time fee recovery jumped to 96%!",
    rating: 5,
    initials: "UG",
  },
  {
    name: "Dr. Samina Kausar",
    role: "Academic Director",
    academy: "Al-Razi Pre-Medical Academy, Karachi",
    quote:
      "The instant daily attendance marking is a game changer for our faculty. When a student is absent, the parents get notified within seconds. The parents love the transparency and modern parent portal.",
    rating: 5,
    initials: "SK",
  },
  {
    name: "Sir Naveed Raza",
    role: "Head of Institute",
    academy: "Shaheen Science Academy, Rawalpindi",
    quote:
      "Generating report cards used to take our staff three full weekends after every assessment. With Academy Manager, report cards with student positions and percentages are printed in two clicks. Simply outstanding!",
    rating: 5,
    initials: "NR",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance carousel every 5s (unless hovered)
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-20 md:py-28 bg-slate-50/70 dark:bg-[#131A2E]/40 border-y border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trusted By Educators</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold tracking-tight text-slate-900 dark:text-white">
            Loved by academy owners across Pakistan
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400 font-body max-w-2xl mx-auto">
            Discover how tutors and coaching centers eliminated paperwork and grew their student enrollment.
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Card wrapper */}
          <div className="relative min-h-[290px] sm:min-h-[250px] rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 shadow-xl dark:border-slate-800 dark:bg-[#131A2E] flex flex-col justify-between overflow-hidden">
            <Quote className="absolute top-6 right-6 h-16 w-16 text-primary-500/10 dark:text-primary-400/5 pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                {/* 5 Stars */}
                <div className="flex items-center space-x-1">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-body italic">
                  &ldquo;{current.quote}&rdquo;
                </p>

                {/* Author Info */}
                <div className="flex items-center space-x-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Avatar name={current.name} size="md" />
                  <div>
                    <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                      {current.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {current.role} • <span className="text-primary-600 dark:text-primary-400 font-medium">{current.academy}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Left / Right Arrow Controls */}
          <div className="flex items-center justify-between mt-6 px-2">
            <div className="flex items-center space-x-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? "w-8 bg-primary-600 dark:bg-primary-400"
                      : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={prevSlide}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131A2E] flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-xs cursor-pointer transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131A2E] flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-xs cursor-pointer transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;

