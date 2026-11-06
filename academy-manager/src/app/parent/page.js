"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LogOut,
  CalendarCheck,
  Wallet,
  Award,
  Bell,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MessageCircle,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { cn, formatPKR, formatDate } from "@/lib/utils";

// Parent's enrolled children mock data
const CHILDREN = [
  {
    id: "std-001",
    name: "Muhammad Ali",
    fatherName: "Tariq Mahmood",
    rollNumber: "TAM-101",
    className: "Class 10 - Mathematics & Physics",
    attendanceRate: 96,
    pendingFee: 0,
    lastResult: 94,
    lastResultGrade: "A+",
    phone: "0300-1234567",
    attendanceSummary: { present: 21, absent: 1, late: 1, leave: 1 },
    calendarDays: [
      { day: 1, status: "off" },
      { day: 2, status: "present" },
      { day: 3, status: "present" },
      { day: 4, status: "present" },
      { day: 5, status: "present" },
      { day: 6, status: "present" },
      { day: 7, status: "present" },
      { day: 8, status: "off" },
      { day: 9, status: "present" },
      { day: 10, status: "present" },
      { day: 11, status: "present" },
      { day: 12, status: "late" },
      { day: 13, status: "present" },
      { day: 14, status: "present" },
      { day: 15, status: "off" },
      { day: 16, status: "present" },
      { day: 17, status: "absent" },
      { day: 18, status: "present" },
      { day: 19, status: "present" },
      { day: 20, status: "present" },
      { day: 21, status: "present" },
      { day: 22, status: "off" },
      { day: 23, status: "present" },
      { day: 24, status: "present" },
      { day: 25, status: "leave" },
      { day: 26, status: "present" },
      { day: 27, status: "present" },
      { day: 28, status: "present" },
      { day: 29, status: "off" },
      { day: 30, status: "present" },
    ],
    feeHistory: [
      { month: "November 2026", amount: 5000, status: "Paid", paidDate: "2026-11-02", receiptNo: "REC-2026-101", method: "JazzCash" },
      { month: "October 2026", amount: 5000, status: "Paid", paidDate: "2026-10-04", receiptNo: "REC-2026-088", method: "Cash" },
      { month: "September 2026", amount: 5000, status: "Paid", paidDate: "2026-09-03", receiptNo: "REC-2026-042", method: "JazzCash" },
    ],
    results: [
      { exam: "Mid-Term Examination 2026", total: 100, obtained: 94, pct: 94, grade: "A+", position: "2nd", date: "02 Nov 2026" },
      { exam: "October Monthly Assessment", total: 50, obtained: 46, pct: 92, grade: "A+", position: "3rd", date: "25 Oct 2026" },
      { exam: "September Foundation Test", total: 50, obtained: 45, pct: 90, grade: "A+", position: "2nd", date: "20 Sep 2026" },
    ],
  },
  {
    id: "std-002",
    name: "Fatima Noor",
    fatherName: "Tariq Mahmood",
    rollNumber: "TAM-102",
    className: "FSc Pre-Medical - Biology & Chemistry",
    attendanceRate: 94,
    pendingFee: 7500,
    lastResult: 96,
    lastResultGrade: "A+",
    phone: "0321-7654321",
    attendanceSummary: { present: 20, absent: 2, late: 1, leave: 1 },
    calendarDays: [
      { day: 1, status: "off" },
      { day: 2, status: "present" },
      { day: 3, status: "present" },
      { day: 4, status: "present" },
      { day: 5, status: "present" },
      { day: 6, status: "present" },
      { day: 7, status: "present" },
      { day: 8, status: "off" },
      { day: 9, status: "absent" },
      { day: 10, status: "present" },
      { day: 11, status: "present" },
      { day: 12, status: "present" },
      { day: 13, status: "present" },
      { day: 14, status: "present" },
      { day: 15, status: "off" },
      { day: 16, status: "present" },
      { day: 17, status: "present" },
      { day: 18, status: "late" },
      { day: 19, status: "present" },
      { day: 20, status: "present" },
      { day: 21, status: "present" },
      { day: 22, status: "off" },
      { day: 23, status: "present" },
      { day: 24, status: "absent" },
      { day: 25, status: "present" },
      { day: 26, status: "present" },
      { day: 27, status: "leave" },
      { day: 28, status: "present" },
      { day: 29, status: "off" },
      { day: 30, status: "present" },
    ],
    feeHistory: [
      { month: "November 2026", amount: 7500, status: "Pending", paidDate: null, receiptNo: null, method: null },
      { month: "October 2026", amount: 7500, status: "Paid", paidDate: "2026-10-06", receiptNo: "REC-2026-092", method: "Easypaisa" },
      { month: "September 2026", amount: 7500, status: "Paid", paidDate: "2026-09-05", receiptNo: "REC-2026-048", method: "Cash" },
    ],
    results: [
      { exam: "Biology Chapter 1-3 Quiz", total: 50, obtained: 48, pct: 96, grade: "A+", position: "1st", date: "28 Oct 2026" },
      { exam: "Chemistry Organic Fundamentals", total: 50, obtained: 45, pct: 90, grade: "A+", position: "2nd", date: "15 Oct 2026" },
    ],
  },
];

// Academy announcements for Notices Tab
const ACADEMY_NOTICES = [
  {
    id: "not-01",
    title: "Winter Timetable Schedule Update",
    date: "04 Nov 2026",
    category: "Schedule",
    unread: true,
    content:
      "Dear Parents, starting Monday 10th November, academy evening timings will shift 30 minutes earlier due to winter daylight hours. Classes will commence at 3:30 PM. Please ensure students arrive on time.",
  },
  {
    id: "not-02",
    title: "Parent-Teacher Evaluation Conference (PTM)",
    date: "01 Nov 2026",
    category: "Meeting",
    unread: true,
    content:
      "Mid-Term examination report cards will be discussed in person this Saturday, November 8th, between 10:00 AM and 2:00 PM. Parents are warmly invited to meet faculty members and review paper assessments.",
  },
  {
    id: "not-03",
    title: "Special Sunday Mock Tests for Board Batches",
    date: "25 Oct 2026",
    category: "Exams",
    unread: false,
    content:
      "Matric Class 10 and FSc batches will have structured past paper assessments every alternate Sunday from 9:00 AM to 12:00 PM. Attendance is compulsory for high board exam score preparation.",
  },
];

export default function ParentPage() {
  // Child switcher state
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const child = CHILDREN[selectedChildIndex];

  // Active Tab: "attendance" | "fees" | "results" | "notices"
  const [activeTab, setActiveTab] = useState("attendance");

  // Notices expansion state
  const [expandedNoticeId, setExpandedNoticeId] = useState(ACADEMY_NOTICES[0]?.id);

  // View Receipt Modal state
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // View Report Card Modal state
  const [viewingReport, setViewingReport] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0B1020] dark:text-slate-100 pb-28 md:pb-12">
      <div className="mx-auto max-w-3xl px-4 pt-4 sm:pt-6">
        {/* 1. Header with Academy Branding, Child Switcher, Theme & Logout */}
        <header className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3.5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-[#131A2E]/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Academy Manager
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Parent Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Child Switcher Dropdown */}
            {CHILDREN.length > 1 && (
              <div className="relative">
                <select
                  value={selectedChildIndex}
                  onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-2.5 pr-7 text-xs font-bold text-slate-800 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer min-h-[38px]"
                >
                  {CHILDREN.map((c, idx) => (
                    <option key={c.id} value={idx}>
                      {c.name.split(" ")[0]} ({c.className.split(" - ")[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ThemeToggle />

            <Link
              href="/login"
              title="Logout"
              aria-label="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:border-slate-800 dark:bg-[#131A2E] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* 2. Child Summary Card with Gradient Background */}
        <div className="mt-4">
          <motion.div
            key={child.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 p-5 sm:p-7 text-white shadow-xl shadow-primary-500/10"
          >
            {/* Decorative background blurs */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent-400/20 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-primary-400/20 blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar
                  name={child.name}
                  size="lg"
                  className="border-2 border-white/30 shadow-md ring-2 ring-white/10"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight">
                      {child.name}
                    </h2>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-indigo-100 font-medium mt-0.5">
                    {child.className}
                  </p>
                  <p className="text-[11px] text-indigo-200 font-mono">
                    Roll #{child.rollNumber} • Parent: {child.fatherName}
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Mini Stats Tiles */}
            <div className="relative z-10 mt-5 grid grid-cols-3 gap-2.5 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/15 text-center">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-200">
                  Attendance
                </span>
                <p className="mt-0.5 font-heading text-base sm:text-lg font-bold text-emerald-300">
                  {child.attendanceRate}%
                </p>
                <span className="text-[10px] text-white/70">Regular</span>
              </div>

              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-200">
                  Pending Fee
                </span>
                <p
                  className={cn(
                    "mt-0.5 font-heading text-base sm:text-lg font-bold",
                    child.pendingFee > 0 ? "text-amber-300" : "text-emerald-300"
                  )}
                >
                  {formatPKR(child.pendingFee)}
                </p>
                <span className="text-[10px] text-white/70">
                  {child.pendingFee > 0 ? "Due Now" : "Cleared"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-200">
                  Last Result
                </span>
                <p className="mt-0.5 font-heading text-base sm:text-lg font-bold text-white">
                  {child.lastResult}%
                </p>
                <span className="text-[10px] text-emerald-300 font-bold">
                  Grade {child.lastResultGrade}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 3. Navigation Tabs with Sliding Underline (Desktop & Tablet) */}
        <div className="mt-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-6">
            {[
              { id: "attendance", label: "Attendance", icon: CalendarCheck },
              { id: "fees", label: "Fees", icon: Wallet },
              { id: "results", label: "Results", icon: Award },
              { id: "notices", label: "Notices", icon: Bell, badge: 2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 py-3 px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]",
                    isActive
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {tab.badge}
                    </span>
                  )}

                  {isActive && (
                    <motion.div
                      layoutId="parent-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Tab Panels Content */}
        <div className="mt-5">
          <AnimatePresence mode="wait">
            {/* TAB 1: ATTENDANCE */}
            {activeTab === "attendance" && (
              <motion.div
                key="panel-attendance"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Summary Pills */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                      Present
                    </span>
                    <p className="font-heading text-lg font-bold text-emerald-800 dark:text-emerald-300">
                      {child.attendanceSummary.present}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                    <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">
                      Absent
                    </span>
                    <p className="font-heading text-lg font-bold text-rose-800 dark:text-rose-300">
                      {child.attendanceSummary.absent}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
                    <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                      Late
                    </span>
                    <p className="font-heading text-lg font-bold text-amber-800 dark:text-amber-300">
                      {child.attendanceSummary.late}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-3 text-center dark:border-slate-800 dark:bg-slate-900/60">
                    <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                      Leave
                    </span>
                    <p className="font-heading text-lg font-bold text-slate-800 dark:text-slate-200">
                      {child.attendanceSummary.leave}
                    </p>
                  </div>
                </div>

                {/* Monthly Calendar View with Colored Dots */}
                <Card className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      November 2026 Hazri Record
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Absent
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500" /> Late
                      </span>
                    </div>
                  </div>

                  {/* Day of Week */}
                  <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-slate-400">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>

                  {/* Calendar Grid with Dots */}
                  <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
                    {/* Blank offset for November 2026 */}
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
                    ))}

                    {child.calendarDays.map((d) => (
                      <div
                        key={d.day}
                        className={cn(
                          "aspect-square rounded-xl border p-1 sm:p-1.5 flex flex-col items-center justify-between text-xs transition-colors",
                          d.status === "off"
                            ? "border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800/40 dark:bg-slate-900/30 dark:text-slate-600"
                            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131A2E]"
                        )}
                      >
                        <span className="font-bold text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                          {d.day}
                        </span>

                        {d.status === "present" && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        )}
                        {d.status === "absent" && (
                          <span className="h-2 w-2 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                        )}
                        {d.status === "late" && (
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                        )}
                        {d.status === "leave" && (
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                        )}
                        {d.status === "off" && (
                          <span className="text-[9px] text-slate-400">Off</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* TAB 2: FEES */}
            {activeTab === "fees" && (
              <motion.div
                key="panel-fees"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Highlighted Due Amount Card */}
                {child.pendingFee > 0 ? (
                  <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          <AlertCircle className="h-3 w-3" /> Due Fee Notice
                        </span>
                        <h4 className="mt-1 font-heading text-lg font-bold text-amber-900 dark:text-amber-200">
                          {formatPKR(child.pendingFee)} Due for November 2026
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Due date: 10th November 2026. EasyPaisa / JazzCash accepted.
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/923008889901?text=${encodeURIComponent(
                          `Assalam o Alaikum, regarding fee submission of ${formatPKR(child.pendingFee)} for ${child.name} (Roll #${child.rollNumber}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Contact Academy</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          All Tuition Fees Cleared!
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Thank you for paying on time. Next voucher issues 1st Dec.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monthly Vouchers & Receipts History */}
                <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                    Fee Invoices &amp; Receipts History
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {child.feeHistory.map((fee, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                      >
                        <div>
                          <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                            {fee.month}
                          </p>
                          <p className="text-xs text-slate-500">
                            {fee.paidDate ? `Paid on ${formatDate(fee.paidDate)} via ${fee.method}` : "Payment pending"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">
                              {formatPKR(fee.amount)}
                            </span>
                            <Badge
                              variant={fee.status === "Paid" ? "success" : "warning"}
                              className="text-[10px]"
                            >
                              {fee.status}
                            </Badge>
                          </div>

                          {fee.receiptNo && (
                            <button
                              onClick={() => setViewingReceipt(fee)}
                              title="View official receipt"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* TAB 3: RESULTS */}
            {activeTab === "results" && (
              <motion.div
                key="panel-results"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {child.results.map((res, idx) => (
                  <Card
                    key={idx}
                    className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="info" className="text-[10px]">
                          {res.date}
                        </Badge>
                        <h4 className="mt-1 font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                          {res.exam}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Class Position: <strong className="text-primary-600">{res.position}</strong>
                        </p>
                      </div>

                      {/* Percentage Circle / Badge */}
                      <div className="flex flex-col items-end">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 font-heading text-base font-extrabold dark:bg-primary-950/60 dark:text-primary-400">
                          {res.pct}%
                        </div>
                        <Badge variant="success" className="text-[10px] mt-1">
                          Grade {res.grade}
                        </Badge>
                      </div>
                    </div>

                    {/* Subject Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Marks Obtained</span>
                        <span>{res.obtained} / {res.total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-primary-600"
                          style={{ width: `${res.pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Download Report Card Button */}
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingReport(res)}
                        className="flex items-center gap-1.5 text-xs font-semibold min-h-[44px]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download Report Card</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* TAB 4: NOTICES */}
            {activeTab === "notices" && (
              <motion.div
                key="panel-notices"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {ACADEMY_NOTICES.map((notice) => {
                  const isExpanded = expandedNoticeId === notice.id;
                  return (
                    <Card
                      key={notice.id}
                      className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800"
                    >
                      <button
                        onClick={() =>
                          setExpandedNoticeId(isExpanded ? null : notice.id)
                        }
                        className="flex w-full items-start justify-between p-4 text-left hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 shrink-0 mt-0.5">
                            <Megaphone className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                                {notice.title}
                              </h4>
                              {notice.unread && (
                                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {notice.date} • {notice.category}
                            </span>
                          </div>
                        </div>

                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-slate-400 transition-transform mt-1 shrink-0",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-600 leading-relaxed dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
                          >
                            {notice.content}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. Fixed Mobile Bottom Navigation Bar (Visible below md) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#131A2E]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <nav className="flex items-center justify-around px-2 pt-1.5">
            {[
              { id: "attendance", label: "Attendance", icon: CalendarCheck },
              { id: "fees", label: "Fees", icon: Wallet },
              { id: "results", label: "Results", icon: Award },
              { id: "notices", label: "Notices", icon: Bell },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors select-none min-h-[44px]",
                    isActive
                      ? "text-primary-600 dark:text-primary-400 font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">{item.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="parent-mobile-nav"
                      className="absolute -top-1 h-1 w-6 rounded-full bg-primary-600 dark:bg-primary-400"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 6. Receipt Modal */}
      <Modal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Official Fee Receipt"
        className="max-w-md"
      >
        {viewingReceipt && (
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <div className="text-center pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
                <span className="font-heading font-extrabold text-sm text-primary-700 dark:text-primary-300">
                  ACADEMY MANAGER
                </span>
                <p className="text-[11px] text-slate-500">Official Payment Receipt</p>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {viewingReceipt.receiptNo}
                </p>
              </div>

              <div className="mt-3 space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <strong>{child.name} ({child.rollNumber})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class:</span>
                  <span>{child.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Month:</span>
                  <span>{viewingReceipt.month}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span>{viewingReceipt.method}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                  <span className="font-bold">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatPKR(viewingReceipt.amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewingReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Report Card Modal */}
      <Modal
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
        title="Student Report Card"
        className="max-w-md"
      >
        {viewingReport && (
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl border border-slate-200 p-4 text-xs dark:border-slate-800">
              <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-heading font-bold text-sm text-primary-600">
                  {viewingReport.exam}
                </span>
                <p className="text-[11px] text-slate-400">{child.name} • Roll #{child.rollNumber}</p>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Marks:</span>
                  <strong>{viewingReport.obtained} / {viewingReport.total}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Percentage:</span>
                  <strong>{viewingReport.pct}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Grade:</span>
                  <Badge variant="success">{viewingReport.grade}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Class Position:</span>
                  <strong>{viewingReport.position}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewingReport(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
