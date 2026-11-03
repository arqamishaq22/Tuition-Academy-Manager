"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

// Classic Lucide SVG brand icons (strokeWidth 2, 24x24)
function Facebook(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function Instagram(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function Youtube(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0B1020] text-slate-600 dark:text-slate-400 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Info (takes 2 cols on lg) */}
          <div className="sm:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-heading text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Academy Manager
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              The modern web operating system designed specifically for Pakistani tuition academies, coaching institutes, and private tutors. Attendance, PKR fee collections, and report cards in one simple app.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300 dark:hover:text-primary-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300 dark:hover:text-primary-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Pricing in PKR
                </a>
              </li>
              <li>
                <Link href="/parent" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Parent Portal
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Live Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Academies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Matric & FSc Batches
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  ICS Computer Science
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  O & A Levels Coaching
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Home Tutors & Groups
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Quran & Islamic Studies
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Support & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#faq" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  Teacher Login
                </Link>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  WhatsApp Helpline (PK)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© 2026 Academy Manager Pakistan. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Built with care for Pakistani tuition academies</span>
            <span>🇵🇰</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
