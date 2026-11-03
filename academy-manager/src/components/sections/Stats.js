"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

// Counter component that animates from 0 to target number when in view
function AnimatedCounter({ end, suffix = "", duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const increment = end / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className="font-heading font-extrabold tracking-tight">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function Stats() {
  const stats = [
    { end: 500, suffix: "+", label: "Students Managed", desc: "Across Lahore, Karachi & Rawalpindi" },
    { end: 25, suffix: "+", label: "Active Academies", desc: "Coaching centers & home tutors" },
    { end: 95, suffix: "%", label: "On-Time Fees", desc: "Via automated reminders" },
    { end: 5, suffix: " hrs", label: "Saved Weekly", desc: "Eliminating paper registers" },
  ];

  return (
    <section className="relative overflow-hidden py-16 bg-gradient-to-r from-primary-700 via-primary-800 to-accent-800 text-white shadow-xl">
      {/* Background glow dots */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          {stats.map((stat, idx) => (
            <div key={stat.label} className={idx > 1 ? "pt-6 md:pt-0" : ""}>
              <div className="text-3xl sm:text-4xl lg:text-5xl text-white font-heading font-extrabold mb-1">
                <AnimatedCounter end={stat.end} suffix={stat.suffix} />
              </div>
              <p className="text-sm sm:text-base font-bold text-accent-200">
                {stat.label}
              </p>
              <p className="text-[11px] sm:text-xs text-white/70 mt-0.5">
                {stat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;

