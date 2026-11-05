"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  History,
  CheckCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Calendar as CalendarIcon,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { cn } from "@/lib/utils";

import { classes } from "@/data/classes";
import { students as initialStudents } from "@/data/students";
import {
  initialAttendanceRecords,
  getMonthHeatmap,
  STATUS_TYPES,
} from "@/data/attendance";

// Default today's date
const TODAY_DATE = "2026-11-05";

// Timezone-safe date arithmetic
function addDaysToDateStr(dateStr, days) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    dateObj.setUTCDate(dateObj.getUTCDate() + days);
    const nextY = dateObj.getUTCFullYear();
    const nextM = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const nextD = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${nextY}-${nextM}-${nextD}`;
  } catch {
    return dateStr;
  }
}

// Format date string for display (e.g. "Thu, 05 Nov 2026")
function formatDateFriendly(dateStr) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(dateObj);
  } catch {
    return dateStr;
  }
}

// 24 Confetti particles with random trajectories
const CONFETTI_PARTICLES = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i / 24) * 360;
  const distance = 45 + ((i * 17) % 45);
  const rad = (angle * Math.PI) / 180;
  return {
    id: i,
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance - 10,
    color: [
      "#6366F1", // primary-500
      "#14B8A6", // accent-500
      "#10B981", // emerald-500
      "#F59E0B", // amber-500
      "#F43F5E", // rose-500
    ][i % 5],
    size: 4 + (i % 4) * 2,
  };
});

export default function AttendancePage() {
  // Navigation Tabs: "mark" | "history"
  const [activeTab, setActiveTab] = useState("mark");

  // Selected Class & Date
  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || "");
  const [currentDate, setCurrentDate] = useState(TODAY_DATE);

  // In-memory daily attendance state: { [date]: { [studentId]: "Present" | "Absent" | "Late" | "Leave" } }
  const [dailyAttendanceState, setDailyAttendanceState] = useState(initialAttendanceRecords);

  // Loading & Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Modal state for Tab 2 Heatmap Day inspection
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showToast = (type, title, message) => {
    setToast({ isOpen: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3500);
  };

  // Filter students enrolled in the currently selected class
  const classStudents = useMemo(() => {
    return initialStudents.filter(
      (s) => s.className === selectedClass || s.classId === selectedClass
    );
  }, [selectedClass]);

  // Current day's status dictionary for the active date
  const currentDayRecords = useMemo(() => {
    const records = dailyAttendanceState[currentDate] || {};
    // Ensure every student has a status (defaults to "Present" if not yet set)
    const normalized = {};
    classStudents.forEach((std) => {
      normalized[std.id] = records[std.id] || "Present";
    });
    return normalized;
  }, [dailyAttendanceState, currentDate, classStudents]);

  // Live count summary of Present, Absent, Late, Leave
  const counts = useMemo(() => {
    let p = 0;
    let a = 0;
    let l = 0;
    let lv = 0;

    classStudents.forEach((std) => {
      const status = currentDayRecords[std.id];
      if (status === "Present") p++;
      else if (status === "Absent") a++;
      else if (status === "Late") l++;
      else if (status === "Leave") lv++;
      else p++;
    });

    return {
      present: p,
      absent: a,
      late: l,
      leave: lv,
      total: classStudents.length,
    };
  }, [classStudents, currentDayRecords]);

  // Update a student's status for the current date
  const handleSetStudentStatus = (studentId, status) => {
    setDailyAttendanceState((prev) => {
      const dateMap = prev[currentDate] || {};
      return {
        ...prev,
        [currentDate]: {
          ...dateMap,
          [studentId]: status,
        },
      };
    });
  };

  // Quick Action: Mark all present
  const handleMarkAllPresent = () => {
    const updatedMap = {};
    classStudents.forEach((std) => {
      updatedMap[std.id] = "Present";
    });

    setDailyAttendanceState((prev) => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || {}),
        ...updatedMap,
      },
    }));

    showToast("success", "All Marked Present", `All ${classStudents.length} students set to Present.`);
  };

  // Quick Action: Reset to initial or default state
  const handleReset = () => {
    setDailyAttendanceState((prev) => {
      const next = { ...prev };
      delete next[currentDate];
      return next;
    });
    showToast("info", "Attendance Reset", `Attendance for ${formatDateFriendly(currentDate)} was reset.`);
  };

  // Date Navigation handlers
  const handlePrevDay = () => {
    setCurrentDate((prev) => addDaysToDateStr(prev, -1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDaysToDateStr(prev, 1));
  };

  // Save Attendance Action with loading, toast, and confetti burst
  const handleSaveAttendance = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowConfetti(true);
      showToast(
        "success",
        "Attendance Saved",
        `Attendance for ${selectedClass} on ${formatDateFriendly(currentDate)} recorded.`
      );
      setTimeout(() => setShowConfetti(false), 2000);
    }, 600);
  };

  // Helper to build WhatsApp direct link for absent students
  const buildWhatsAppLink = (student) => {
    const message = `Assalam o Alaikum, ${student.name} was absent today in ${selectedClass}.`;
    const cleanPhone = (student.phone || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  // Tab 2 Heatmap & Monthly History Data
  const heatmapData = useMemo(() => {
    return getMonthHeatmap(selectedClass, classStudents);
  }, [selectedClass, classStudents]);

  return (
    <div className="space-y-6 pb-28 md:pb-20">
      {/* 1. Header & Tab Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Attendance
            </h1>
            <Badge variant="info" className="text-xs">
              {classStudents.length} Students
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quickly mark daily student presence and analyze monthly attendance heatmaps.
          </p>
        </div>

        {/* Tab Toggle Pills with Framer Motion slide */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("mark")}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]",
              activeTab === "mark"
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "mark" && (
              <motion.div
                layoutId="attendance-active-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-[#131A2E]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>Mark Attendance</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]",
              activeTab === "history"
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "history" && (
              <motion.div
                layoutId="attendance-active-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-[#131A2E]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <History className="h-4 w-4 text-accent-600 dark:text-accent-400" />
              <span>Monthly History</span>
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top Controls & Class Selection */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Class Select Dropdown */}
          <div className="w-full lg:w-72">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Batch / Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker with Prev / Next Chevron buttons */}
          {activeTab === "mark" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1 dark:border-slate-800 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  aria-label="Previous day"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 px-3 py-1 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[170px] justify-center">
                  <CalendarIcon className="h-4 w-4 text-primary-500 shrink-0" />
                  <span>{formatDateFriendly(currentDate)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  title="Next Day"
                  aria-label="Next day"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {currentDate !== TODAY_DATE && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(TODAY_DATE)}
                  className="text-xs h-11 min-h-[44px]"
                >
                  Jump to Today
                </Button>
              )}
            </div>
          )}

          {/* Live Attendance Summary Pills with Spring Number Animation */}
          {activeTab === "mark" && (
            <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
              {/* Present Pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 min-h-[36px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Present:</span>
                <motion.span
                  key={counts.present}
                  initial={{ scale: 1.35, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="font-bold text-sm"
                >
                  {counts.present}
                </motion.span>
              </div>

              {/* Absent Pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 min-h-[36px]">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span>Absent:</span>
                <motion.span
                  key={counts.absent}
                  initial={{ scale: 1.35, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="font-bold text-sm"
                >
                  {counts.absent}
                </motion.span>
              </div>

              {/* Late Pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 min-h-[36px]">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>Late:</span>
                <motion.span
                  key={counts.late}
                  initial={{ scale: 1.35, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="font-bold text-sm"
                >
                  {counts.late}
                </motion.span>
              </div>

              {/* Leave Pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 min-h-[36px]">
                <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                <span>Leave:</span>
                <motion.span
                  key={counts.leave}
                  initial={{ scale: 1.35, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 450, damping: 20 }}
                  className="font-bold text-sm"
                >
                  {counts.leave}
                </motion.span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ============================================================ */}
      {/* TAB 1: MARK ATTENDANCE CONTENT                               */}
      {/* ============================================================ */}
      {activeTab === "mark" && (
        <div className="space-y-4">
          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Students ({classStudents.length}) • Tap P, A, L, or Lv to record
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 text-xs font-semibold min-h-[44px] sm:min-h-[36px]"
              >
                <CheckCheck className="h-4 w-4 text-emerald-600" />
                <span>Mark All Present</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 min-h-[44px] sm:min-h-[36px]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          {/* Student List View */}
          {classStudents.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                No Students in this Batch
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select another class from the dropdown above to mark attendance.
              </p>
            </Card>
          ) : (
            <>
              {/* MOBILE VIEW (< md): High-touch Responsive Cards */}
              <div className="block md:hidden space-y-3">
                <AnimatePresence initial={false}>
                  {classStudents.map((student) => {
                    const currentStatus = currentDayRecords[student.id] || "Present";
                    const isAbsent = currentStatus === "Absent";

                    return (
                      <motion.div
                        key={student.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={cn(
                            "p-4 transition-all duration-150 border",
                            isAbsent
                              ? "border-rose-200/80 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10"
                              : "border-slate-200 dark:border-slate-800"
                          )}
                        >
                          {/* Student Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={student.name} size="md" />
                              <div className="min-w-0">
                                <h4 className="truncate font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {student.name}
                                </h4>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  Roll #{student.rollNumber} • {student.phone}
                                </p>
                              </div>
                            </div>

                            {/* Small Current Status Badge */}
                            <Badge
                              variant={
                                currentStatus === "Present"
                                  ? "success"
                                  : currentStatus === "Absent"
                                  ? "danger"
                                  : currentStatus === "Late"
                                  ? "warning"
                                  : "neutral"
                              }
                              className="text-[11px] px-2 py-0.5 shrink-0"
                            >
                              {currentStatus}
                            </Badge>
                          </div>

                          {/* Segmented Control Options: P, A, L, Lv (>= 44px touch target) */}
                          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
                            {/* Present (P) */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, "Present")}
                              className={cn(
                                "relative flex h-11 min-h-[44px] items-center justify-center rounded-lg text-xs font-bold transition-colors select-none",
                                currentStatus === "Present"
                                  ? "text-white"
                                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                              )}
                            >
                              {currentStatus === "Present" && (
                                <motion.div
                                  layoutId={`mobile-pill-${student.id}`}
                                  className="absolute inset-0 rounded-lg bg-emerald-500 shadow-xs"
                                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">P</span>
                            </button>

                            {/* Absent (A) */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, "Absent")}
                              className={cn(
                                "relative flex h-11 min-h-[44px] items-center justify-center rounded-lg text-xs font-bold transition-colors select-none",
                                currentStatus === "Absent"
                                  ? "text-white"
                                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                              )}
                            >
                              {currentStatus === "Absent" && (
                                <motion.div
                                  layoutId={`mobile-pill-${student.id}`}
                                  className="absolute inset-0 rounded-lg bg-rose-500 shadow-xs"
                                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">A</span>
                            </button>

                            {/* Late (L) */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, "Late")}
                              className={cn(
                                "relative flex h-11 min-h-[44px] items-center justify-center rounded-lg text-xs font-bold transition-colors select-none",
                                currentStatus === "Late"
                                  ? "text-white"
                                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                              )}
                            >
                              {currentStatus === "Late" && (
                                <motion.div
                                  layoutId={`mobile-pill-${student.id}`}
                                  className="absolute inset-0 rounded-lg bg-amber-500 shadow-xs"
                                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">L</span>
                            </button>

                            {/* Leave (Lv) */}
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(student.id, "Leave")}
                              className={cn(
                                "relative flex h-11 min-h-[44px] items-center justify-center rounded-lg text-xs font-bold transition-colors select-none",
                                currentStatus === "Leave"
                                  ? "text-white"
                                  : "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                              )}
                            >
                              {currentStatus === "Leave" && (
                                <motion.div
                                  layoutId={`mobile-pill-${student.id}`}
                                  className="absolute inset-0 rounded-lg bg-slate-600 shadow-xs"
                                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                              )}
                              <span className="relative z-10">Lv</span>
                            </button>
                          </div>

                          {/* Absent Action: Notify Parent via WhatsApp */}
                          {isAbsent && (
                            <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-200/80 bg-rose-50/70 p-2.5 text-xs dark:border-rose-900/50 dark:bg-rose-950/30">
                              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                                Parent: {student.phone}
                              </span>

                              <a
                                href={buildWhatsAppLink(student)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>Notify parent</span>
                              </a>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* DESKTOP VIEW (md and up): Compact Structured Table */}
              <div className="hidden md:block">
                <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Roll No</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="w-72 text-center">Status Selection</TableHead>
                        <TableHead className="w-40 text-right">Quick Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <AnimatePresence initial={false}>
                        {classStudents.map((student) => {
                          const currentStatus = currentDayRecords[student.id] || "Present";
                          const isAbsent = currentStatus === "Absent";

                          return (
                            <TableRow key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              {/* Roll Number */}
                              <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {student.rollNumber}
                              </TableCell>

                              {/* Student Profile */}
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar name={student.name} size="sm" />
                                  <div>
                                    <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {student.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Parent: {student.phone}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Segmented Control for Desktop */}
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <div className="inline-flex w-64 items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                    {/* Present (P) */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "Present")}
                                      className={cn(
                                        "relative flex-1 py-1.5 text-xs font-bold transition-colors select-none text-center rounded-lg",
                                        currentStatus === "Present"
                                          ? "text-white"
                                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                      )}
                                    >
                                      {currentStatus === "Present" && (
                                        <motion.div
                                          layoutId={`desktop-pill-${student.id}`}
                                          className="absolute inset-0 rounded-lg bg-emerald-500 shadow-xs"
                                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                      )}
                                      <span className="relative z-10">P</span>
                                    </button>

                                    {/* Absent (A) */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "Absent")}
                                      className={cn(
                                        "relative flex-1 py-1.5 text-xs font-bold transition-colors select-none text-center rounded-lg",
                                        currentStatus === "Absent"
                                          ? "text-white"
                                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                      )}
                                    >
                                      {currentStatus === "Absent" && (
                                        <motion.div
                                          layoutId={`desktop-pill-${student.id}`}
                                          className="absolute inset-0 rounded-lg bg-rose-500 shadow-xs"
                                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                      )}
                                      <span className="relative z-10">A</span>
                                    </button>

                                    {/* Late (L) */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "Late")}
                                      className={cn(
                                        "relative flex-1 py-1.5 text-xs font-bold transition-colors select-none text-center rounded-lg",
                                        currentStatus === "Late"
                                          ? "text-white"
                                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                      )}
                                    >
                                      {currentStatus === "Late" && (
                                        <motion.div
                                          layoutId={`desktop-pill-${student.id}`}
                                          className="absolute inset-0 rounded-lg bg-amber-500 shadow-xs"
                                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                      )}
                                      <span className="relative z-10">L</span>
                                    </button>

                                    {/* Leave (Lv) */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetStudentStatus(student.id, "Leave")}
                                      className={cn(
                                        "relative flex-1 py-1.5 text-xs font-bold transition-colors select-none text-center rounded-lg",
                                        currentStatus === "Leave"
                                          ? "text-white"
                                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                      )}
                                    >
                                      {currentStatus === "Leave" && (
                                        <motion.div
                                          layoutId={`desktop-pill-${student.id}`}
                                          className="absolute inset-0 rounded-lg bg-slate-600 shadow-xs"
                                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                        />
                                      )}
                                      <span className="relative z-10">Lv</span>
                                    </button>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Desktop Notify Action */}
                              <TableCell className="text-right">
                                {isAbsent ? (
                                  <a
                                    href={buildWhatsAppLink(student)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                                  >
                                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Notify parent</span>
                                  </a>
                                ) : (
                                  <Badge
                                    variant={
                                      currentStatus === "Present"
                                        ? "success"
                                        : currentStatus === "Late"
                                        ? "warning"
                                        : "neutral"
                                    }
                                    className="text-[10px]"
                                  >
                                    {currentStatus}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </>
          )}

          {/* Sticky Bottom Bar (Above Mobile Nav at bottom-16 on mobile, bottom-4 on desktop) */}
          <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-8 z-30 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-3.5 sm:px-6 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-[#131A2E]/95 md:min-w-[420px]">
            {/* Live Count Overview */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <strong>{counts.present}</strong> present
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <XCircle className="h-4 w-4" />
                <strong>{counts.absent}</strong> absent
              </span>
            </div>

            {/* Save Attendance Button with Confetti Burst */}
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="relative z-10 flex items-center gap-2 font-semibold shadow-md min-h-[44px] px-5 text-xs sm:text-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="h-4 w-4" />
                    <span>Save attendance</span>
                  </>
                )}
              </Button>

              {/* Animated Confetti Burst Particles */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    {CONFETTI_PARTICLES.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                          x: p.x,
                          y: p.y,
                          scale: [0, 1.4, 0],
                          opacity: [1, 1, 0],
                          rotate: [0, 180],
                        }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                        className="absolute rounded-full"
                        style={{
                          backgroundColor: p.color,
                          width: `${p.size}px`,
                          height: `${p.size}px`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: HISTORY CONTENT                                       */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* 1. Summary Cards: Average, Best Day, Lowest Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Average Attendance */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Monthly Average
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {heatmapData.summary.averageRate}%
              </div>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Overall regular batch attendance
              </p>
            </Card>

            {/* Best Day */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Best Day
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {heatmapData.summary.bestDay.date} ({heatmapData.summary.bestDay.percentage}%)
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {heatmapData.summary.bestDay.note}
              </p>
            </Card>

            {/* Lowest Day */}
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Lowest Day
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {heatmapData.summary.lowestDay.date} ({heatmapData.summary.lowestDay.percentage}%)
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {heatmapData.summary.lowestDay.note}
              </p>
            </Card>
          </div>

          {/* 2. Monthly Calendar Heatmap */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Monthly Attendance Heatmap ({heatmapData.month})
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Click any day cell to view that day&apos;s full student attendance breakdown.
                </p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">High (≥90%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Medium (75-89%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Low (&lt;75%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-slate-200 dark:bg-slate-700" />
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">Weekend/Off</span>
                </div>
              </div>
            </div>

            {/* Days of week header */}
            <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Calendar Grid (cells stay square and readable at 320px) */}
            <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* November 2026 started on a Sunday. If Monday is col 0, we add 6 blank padding cells for week 1 */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square rounded-xl bg-transparent" />
              ))}

              {heatmapData.days.map((dayItem) => {
                const isOff = dayItem.isWeekend;
                const isLow = !isOff && dayItem.percentage < 75;
                const isMedium = !isOff && dayItem.percentage >= 75 && dayItem.percentage < 90;
                const isHigh = !isOff && dayItem.percentage >= 90;

                return (
                  <button
                    key={dayItem.day}
                    type="button"
                    onClick={() => {
                      if (!isOff) {
                        setSelectedHeatmapDay(dayItem);
                      }
                    }}
                    disabled={isOff}
                    className={cn(
                      "group relative aspect-square w-full rounded-xl border p-1 sm:p-2 flex flex-col items-center justify-between transition-all select-none min-h-[44px]",
                      isOff &&
                        "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800/40 dark:bg-slate-900/40 dark:text-slate-600",
                      isHigh &&
                        "border-emerald-300 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 hover:scale-105 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/70 cursor-pointer shadow-2xs",
                      isMedium &&
                        "border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 hover:scale-105 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70 cursor-pointer shadow-2xs",
                      isLow &&
                        "border-rose-300 bg-rose-50/70 text-rose-900 hover:bg-rose-100 hover:scale-105 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/70 cursor-pointer shadow-2xs"
                    )}
                  >
                    {/* Day Number */}
                    <span className="text-[11px] sm:text-xs md:text-sm font-bold">
                      {dayItem.day}
                    </span>

                    {/* Percentage or Weekend Tag */}
                    <span
                      className={cn(
                        "text-[9px] sm:text-[11px] md:text-xs font-semibold leading-tight",
                        isOff
                          ? "text-slate-400 dark:text-slate-600"
                          : isHigh
                          ? "text-emerald-700 dark:text-emerald-400 font-bold"
                          : isMedium
                          ? "text-amber-700 dark:text-amber-400 font-bold"
                          : "text-rose-700 dark:text-rose-400 font-bold"
                      )}
                    >
                      {isOff ? "Off" : `${dayItem.percentage}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 3. Monthly Student Attendance Table */}
          <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                Student Attendance Performance (November)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Students below 75% attendance are flagged for parent follow-up.
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Roll No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-32 text-center">Present / Days</TableHead>
                  <TableHead className="w-48">Attendance Rate</TableHead>
                  <TableHead className="w-36 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {classStudents.map((std) => {
                  const rate = std.attendanceRate || 92;
                  const isBelowThreshold = rate < 75;

                  return (
                    <TableRow
                      key={std.id}
                      className={cn(
                        "hover:bg-slate-50/60 dark:hover:bg-slate-800/40",
                        isBelowThreshold && "bg-rose-50/20 dark:bg-rose-950/10"
                      )}
                    >
                      <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {std.rollNumber}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={std.name} size="sm" />
                          <div>
                            <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                              {std.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {std.phone}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-medium text-xs text-slate-600 dark:text-slate-400">
                        {Math.round((rate / 100) * 22)} / 22 Days
                      </TableCell>

                      {/* Mini Bar with Animated Fill */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={cn(
                                "font-bold",
                                isBelowThreshold
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-slate-800 dark:text-slate-200"
                              )}
                            >
                              {rate}%
                            </span>
                          </div>

                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${rate}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                isBelowThreshold
                                  ? "bg-rose-500"
                                  : rate >= 90
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              )}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Status / Warning Flag */}
                      <TableCell className="text-right">
                        {isBelowThreshold ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            <span>&lt;75% Alert</span>
                          </div>
                        ) : (
                          <Badge variant="success" className="text-[11px]">
                            Regular
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MODAL: DAY ATTENDANCE BREAKDOWN (From Heatmap Click)       */}
      {/* ============================================================ */}
      <Modal
        isOpen={!!selectedHeatmapDay}
        onClose={() => setSelectedHeatmapDay(null)}
        title={
          selectedHeatmapDay
            ? `Attendance Roster - ${formatDateFriendly(selectedHeatmapDay.date)}`
            : "Day Attendance"
        }
        className="max-w-2xl"
      >
        {selectedHeatmapDay && (
          <div className="space-y-4 pt-2">
            {/* Top Stats Banner */}
            <div className="grid grid-cols-4 gap-2 text-center rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/40">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                  Present
                </span>
                <p className="font-heading text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  {selectedHeatmapDay.presentCount}
                </p>
              </div>

              <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/40">
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                  Absent
                </span>
                <p className="font-heading text-lg font-bold text-rose-800 dark:text-rose-300">
                  {selectedHeatmapDay.absentCount}
                </p>
              </div>

              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/40">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                  Late
                </span>
                <p className="font-heading text-lg font-bold text-amber-800 dark:text-amber-300">
                  {selectedHeatmapDay.lateCount}
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                  Overall
                </span>
                <p className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedHeatmapDay.percentage}%
                </p>
              </div>
            </div>

            {/* Student Records List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {selectedHeatmapDay.studentRecords.map((rec) => (
                <div
                  key={rec.studentId}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-xs dark:border-slate-800 dark:bg-[#131A2E]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={rec.name} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {rec.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Roll #{rec.rollNumber} • Check-in: {rec.timeIn}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      rec.status === "Present"
                        ? "success"
                        : rec.status === "Absent"
                        ? "danger"
                        : rec.status === "Late"
                        ? "warning"
                        : "neutral"
                    }
                    className="text-[10px]"
                  >
                    {rec.status}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHeatmapDay(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Floating Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />
    </div>
  );
}
