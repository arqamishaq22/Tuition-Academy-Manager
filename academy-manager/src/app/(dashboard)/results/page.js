"use client";

import { useState, useMemo, useRef, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  GraduationCap,
  Medal,
  MessageCircle,
  Plus,
  Printer,
  Search,
  Share2,
  Trophy,
  Users,
  AlertCircle,
  TrendingUp,
  FileText,
  Check,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { cn, calculateGrade, getGradeBadgeVariant, formatDate } from "@/lib/utils";

import { classes } from "@/data/classes";
import { students as initialStudents } from "@/data/students";
import {
  initialExams,
  initialMarksByExam,
  studentHistoricalProgress,
  classReportSubjects,
} from "@/data/results";

// Grade distribution palette
const GRADE_COLORS = {
  "A+": "#10B981", // Emerald 500
  A: "#059669", // Emerald 600
  B: "#6366F1", // Indigo 500
  C: "#F59E0B", // Amber 500
  D: "#D97706", // Amber 600
  F: "#F43F5E", // Rose 500
};

const emptySubscribe = () => () => {};

export default function ResultsPage() {
  // Prevent SSR dimension mismatch for Recharts
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Main Tabs: "exams" | "enter-marks" | "report-cards"
  const [activeTab, setActiveTab] = useState("exams");

  // In-memory data states
  const [examsList, setExamsList] = useState(initialExams);
  const [marksState, setMarksState] = useState(initialMarksByExam);

  // Tab 1 state: Selected Exam for detailed analytics
  const [selectedExamId, setSelectedExamId] = useState(initialExams[0]?.id || "ex-001");

  // Create Exam Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    name: "",
    className: classes[0]?.name || "",
    subject: "Mathematics",
    date: "2026-11-20",
    totalMarks: 50,
    passingMarks: 20,
  });
  const [createErrors, setCreateErrors] = useState({});

  // Tab 2 state: Enter Marks
  const [marksExamId, setMarksExamId] = useState(initialExams[0]?.id || "ex-001");
  const [draftMarks, setDraftMarks] = useState({});
  const [isSavingMarks, setIsSavingMarks] = useState(false);
  const inputRefs = useRef([]);

  // Tab 3 state: Report Cards
  const [reportClass, setReportClass] = useState(classes[0]?.name || "");
  const [reportStudentId, setReportStudentId] = useState(
    () => initialStudents.find((s) => s.className === classes[0]?.name)?.id || ""
  );
  const [teacherRemarks, setTeacherRemarks] = useState(
    "Demonstrates excellent conceptual understanding and analytical problem-solving skills. Recommended for scholarship honors."
  );

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

  // Active exam object for Tab 1
  const activeExam = useMemo(() => {
    return examsList.find((e) => e.id === selectedExamId) || examsList[0];
  }, [examsList, selectedExamId]);

  // Students enrolled in active exam's class
  const activeExamStudents = useMemo(() => {
    if (!activeExam) return [];
    return initialStudents.filter((s) => s.className === activeExam.className);
  }, [activeExam]);

  // Exam Results Analytics for Tab 1
  const examAnalytics = useMemo(() => {
    if (!activeExam) {
      return {
        avg: 0,
        avgPct: 0,
        highest: 0,
        lowest: 0,
        passPct: 0,
        podium: [],
        gradeDist: [],
      };
    }

    const marksMap = marksState[activeExam.id] || {};
    const scores = [];
    const gradeCounts = { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 };

    activeExamStudents.forEach((student) => {
      const mark = marksMap[student.id];
      if (typeof mark === "number") {
        const pct = Math.round((mark / activeExam.totalMarks) * 100);
        const grade = calculateGrade(pct);
        scores.push({
          student,
          mark,
          pct,
          grade,
        });
        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
      }
    });

    if (scores.length === 0) {
      return {
        avg: 0,
        avgPct: 0,
        highest: 0,
        lowest: 0,
        passPct: 0,
        podium: [],
        gradeDist: Object.entries(gradeCounts).map(([grade, count]) => ({
          grade,
          count,
        })),
      };
    }

    scores.sort((a, b) => b.mark - a.mark);

    const totalScore = scores.reduce((acc, curr) => acc + curr.mark, 0);
    const avg = Math.round(totalScore / scores.length);
    const avgPct = Math.round((avg / activeExam.totalMarks) * 100);
    const highest = scores[0].mark;
    const lowest = scores[scores.length - 1].mark;
    const passingCount = scores.filter((s) => s.mark >= activeExam.passingMarks).length;
    const passPct = Math.round((passingCount / scores.length) * 100);

    const podium = scores.slice(0, 3);
    const gradeDist = ["A+", "A", "B", "C", "D", "F"].map((grade) => ({
      grade,
      count: gradeCounts[grade] || 0,
    }));

    return {
      avg,
      avgPct,
      highest,
      lowest,
      passPct,
      podium,
      gradeDist,
    };
  }, [activeExam, activeExamStudents, marksState]);

  // Tab 2: Compute effective marks combining saved marks and local drafts
  const activeMarksExam = useMemo(() => {
    return examsList.find((e) => e.id === marksExamId) || examsList[0];
  }, [examsList, marksExamId]);

  const marksExamStudents = useMemo(() => {
    if (!activeMarksExam) return [];
    return initialStudents.filter((s) => s.className === activeMarksExam.className);
  }, [activeMarksExam]);

  const effectiveMarks = useMemo(() => {
    if (!activeMarksExam) return {};
    const existing = marksState[activeMarksExam.id] || {};
    const edits = draftMarks[activeMarksExam.id] || {};
    const result = {};
    marksExamStudents.forEach((std) => {
      if (edits[std.id] !== undefined) {
        result[std.id] = edits[std.id];
      } else if (existing[std.id] !== undefined) {
        result[std.id] = String(existing[std.id]);
      } else {
        result[std.id] = "";
      }
    });
    return result;
  }, [activeMarksExam, marksState, draftMarks, marksExamStudents]);

  // Tab 2: Count how many marks are entered
  const enteredMarksCount = useMemo(() => {
    return Object.values(effectiveMarks).filter((v) => v !== "" && !isNaN(Number(v))).length;
  }, [effectiveMarks]);

  // Handle Mark Input Change with 0 to totalMarks validation
  const handleMarkChange = (studentId, val) => {
    if (!activeMarksExam) return;
    if (val === "") {
      setDraftMarks((prev) => ({
        ...prev,
        [activeMarksExam.id]: { ...(prev[activeMarksExam.id] || {}), [studentId]: "" },
      }));
      return;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      if (num < 0) return;
      if (num > activeMarksExam.totalMarks) return;
      setDraftMarks((prev) => ({
        ...prev,
        [activeMarksExam.id]: { ...(prev[activeMarksExam.id] || {}), [studentId]: String(num) },
      }));
    }
  };

  // Keyboard navigation: Enter moves to the next student row
  const handleKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Save Marks to state
  const handleSaveMarks = () => {
    setIsSavingMarks(true);
    setTimeout(() => {
      const parsed = {};
      Object.entries(effectiveMarks).forEach(([id, val]) => {
        if (val !== "" && !isNaN(Number(val))) {
          parsed[id] = Number(val);
        }
      });

      setMarksState((prev) => ({
        ...prev,
        [activeMarksExam.id]: parsed,
      }));

      setDraftMarks((prev) => {
        const next = { ...prev };
        delete next[activeMarksExam.id];
        return next;
      });

      // Update exam status to "Published"
      setExamsList((prev) =>
        prev.map((e) =>
          e.id === activeMarksExam.id ? { ...e, status: "Published" } : e
        )
      );

      setIsSavingMarks(false);
      showToast(
        "success",
        "Marks Recorded",
        `Saved marks for ${activeMarksExam.name} (${activeMarksExam.className}).`
      );
    }, 500);
  };

  // Create Exam Handler
  const handleCreateExam = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newExamForm.name.trim()) errors.name = "Exam name is required";
    if (!newExamForm.subject.trim()) errors.subject = "Subject is required";
    if (!newExamForm.totalMarks || newExamForm.totalMarks <= 0) {
      errors.totalMarks = "Total marks must be > 0";
    }
    if (newExamForm.passingMarks > newExamForm.totalMarks) {
      errors.passingMarks = "Passing marks cannot exceed total marks";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    const created = {
      id: `ex-${Date.now().toString().slice(-4)}`,
      name: newExamForm.name.trim(),
      className: newExamForm.className,
      subject: newExamForm.subject.trim(),
      date: newExamForm.date,
      totalMarks: Number(newExamForm.totalMarks),
      passingMarks: Number(newExamForm.passingMarks || 20),
      status: "Upcoming",
    };

    setExamsList((prev) => [created, ...prev]);
    setSelectedExamId(created.id);
    setIsCreateModalOpen(false);
    showToast("success", "Exam Scheduled", `${created.name} added to schedule.`);
  };

  // Tab 3: Report Card data calculations
  const reportStudentsInClass = useMemo(() => {
    return initialStudents.filter((s) => s.className === reportClass);
  }, [reportClass]);

  const activeReportStudent = useMemo(() => {
    return (
      reportStudentsInClass.find((s) => s.id === reportStudentId) ||
      reportStudentsInClass[0] ||
      null
    );
  }, [reportStudentsInClass, reportStudentId]);

  // Report card subject breakdown
  const reportSubjectData = useMemo(() => {
    const list = classReportSubjects[reportClass] || [
      { subject: "Mathematics", total: 100, obtained: 92 },
      { subject: "Physics", total: 100, obtained: 88 },
      { subject: "Chemistry", total: 100, obtained: 85 },
      { subject: "English", total: 75, obtained: 65 },
    ];

    return list.map((item) => {
      const pct = Math.round((item.obtained / item.total) * 100);
      const grade = calculateGrade(pct);
      return {
        ...item,
        pct,
        grade,
        passed: pct >= 40,
      };
    });
  }, [reportClass]);

  const reportTotals = useMemo(() => {
    const totalMax = reportSubjectData.reduce((acc, c) => acc + c.total, 0);
    const totalObt = reportSubjectData.reduce((acc, c) => acc + c.obtained, 0);
    const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;
    const overallGrade = calculateGrade(overallPct);
    return {
      totalMax,
      totalObt,
      overallPct,
      overallGrade,
      position: overallPct >= 92 ? "1st Position" : overallPct >= 85 ? "2nd Position" : "3rd Position",
    };
  }, [reportSubjectData]);

  // Report Card Progress Chart data
  const progressChartData = useMemo(() => {
    if (!activeReportStudent) return studentHistoricalProgress.default;
    return (
      studentHistoricalProgress[activeReportStudent.id] ||
      studentHistoricalProgress.default
    );
  }, [activeReportStudent]);

  // Printable Report Card in a clean A4 pop-up window
  const handlePrintReportCard = () => {
    if (!activeReportStudent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const rowsHtml = reportSubjectData
      .map(
        (s) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${s.subject}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.total}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${s.obtained}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.pct}%</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${s.grade.startsWith("A") ? "#059669" : "#4338ca"};">${s.grade}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.passed ? "Pass" : "Fail"}</td>
      </tr>
    `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${activeReportStudent.name} (${activeReportStudent.rollNumber})</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
            .report-card { border: 2px solid #4338ca; border-radius: 12px; padding: 24px; max-width: 780px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #e0e7ff; padding-bottom: 14px; margin-bottom: 18px; }
            .logo-title { font-size: 24px; font-weight: 800; color: #3730a3; letter-spacing: -0.5px; }
            .sub-title { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; }
            .meta-item span { color: #64748b; font-weight: 500; }
            .meta-item strong { color: #0f172a; margin-left: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th { background: #eef2ff; color: #3730a3; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary-box { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 20px; margin-bottom: 20px; }
            .summary-item { text-align: center; }
            .summary-item .label { font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: bold; }
            .summary-item .val { font-size: 18px; font-weight: 800; color: #166534; margin-top: 2px; }
            .remarks-box { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 30px; font-size: 12px; background: #fafafa; }
            .signatures { display: flex; justify-content: space-between; padding-top: 40px; }
            .sig-line { width: 200px; text-align: center; border-top: 1.5px solid #0f172a; padding-top: 6px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="report-card">
            <div class="header">
              <div class="logo-title">ACADEMY MANAGER</div>
              <div class="sub-title">Official Student Academic Evaluation • Session 2026-2027</div>
            </div>

            <div class="meta-grid">
              <div class="meta-item"><span>Student Name:</span><strong>${activeReportStudent.name}</strong></div>
              <div class="meta-item"><span>Roll Number:</span><strong>${activeReportStudent.rollNumber}</strong></div>
              <div class="meta-item"><span>Father Name:</span><strong>${activeReportStudent.fatherName}</strong></div>
              <div class="meta-item"><span>Class / Batch:</span><strong>${activeReportStudent.className}</strong></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th style="text-align: center;">Total</th>
                  <th style="text-align: center;">Obtained</th>
                  <th style="text-align: center;">%</th>
                  <th style="text-align: center;">Grade</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-item"><div class="label">Grand Total</div><div class="val">${reportTotals.totalObt} / ${reportTotals.totalMax}</div></div>
              <div class="summary-item"><div class="label">Aggregate %</div><div class="val">${reportTotals.overallPct}%</div></div>
              <div class="summary-item"><div class="label">Final Grade</div><div class="val">${reportTotals.overallGrade}</div></div>
              <div class="summary-item"><div class="label">Class Position</div><div class="val">${reportTotals.position}</div></div>
              <div class="summary-item"><div class="label">Attendance</div><div class="val">${activeReportStudent.attendanceRate}%</div></div>
            </div>

            <div class="remarks-box">
              <strong>Teacher Remarks:</strong><br />
              <p style="margin-top: 4px; font-style: italic; color: #334155;">&ldquo;${teacherRemarks}&rdquo;</p>
            </div>

            <div class="signatures">
              <div class="sig-line">Class Instructor Signature</div>
              <div class="sig-line">Principal / Controller Exams</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Result Sharing
  const handleShareWhatsApp = () => {
    if (!activeReportStudent) return;
    const msg = `Assalam o Alaikum, here is the official academic report for ${activeReportStudent.name} (Roll #${activeReportStudent.rollNumber}, ${activeReportStudent.className}): Total Marks: ${reportTotals.totalObt}/${reportTotals.totalMax} (${reportTotals.overallPct}%), Overall Grade: ${reportTotals.overallGrade}, Position: ${reportTotals.position}, Attendance: ${activeReportStudent.attendanceRate}%. Remarks: "${teacherRemarks}". - Academy Manager`;
    const cleanPhone = (activeReportStudent.phone || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6 pb-24 md:pb-16">
      {/* 1. Header & Sliding Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Exam Results &amp; Grading
            </h1>
            <Badge variant="info" className="text-xs">
              {examsList.length} Assessments
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Schedule exams, enter student marks with auto-calculated grades, and generate printable report cards.
          </p>
        </div>

        {/* Sliding Tabs Switcher */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
          {[
            { id: "exams", label: "Exams", icon: BookOpen },
            { id: "enter-marks", label: "Enter Marks", icon: Edit },
            { id: "report-cards", label: "Report Cards", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]",
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="results-active-tab"
                    className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-[#131A2E]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: EXAMS & RESULTS ANALYTICS                             */}
      {/* ============================================================ */}
      {activeTab === "exams" && (
        <motion.div
          key="tab-exams"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header Row & Create Exam Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                Scheduled Tests &amp; Examinations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click on any exam card below to inspect class analytics, grade curves, and the top podium.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold shadow-sm min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Exam</span>
            </Button>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examsList.map((exam) => {
              const isSelected = exam.id === selectedExamId;
              return (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all select-none shadow-2xs hover:shadow-md",
                    isSelected
                      ? "border-primary-500 bg-primary-50/20 ring-2 ring-primary-500/20 dark:border-primary-500/80 dark:bg-primary-950/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#131A2E]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {exam.subject}
                    </span>
                    <Badge
                      variant={
                        exam.status === "Published"
                          ? "success"
                          : exam.status === "Marks pending"
                          ? "warning"
                          : "neutral"
                      }
                      className="text-[10px]"
                    >
                      {exam.status}
                    </Badge>
                  </div>

                  <h3 className="mt-2.5 font-heading text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {exam.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {exam.className}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(exam.date)}</span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Total: {exam.totalMarks} Marks
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Exam Results Summary */}
          {activeExam && (
            <Card className="p-5 sm:p-6 space-y-6 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {activeExam.name} - Performance Summary
                    </h3>
                    <Badge variant="info" className="text-xs">
                      {activeExam.subject}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {activeExam.className} • Conducted on {formatDate(activeExam.date)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMarksExamId(activeExam.id);
                    setActiveTab("enter-marks");
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold self-start sm:self-auto min-h-[44px]"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Update Marks</span>
                </Button>
              </div>

              {/* 4 Stat KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Class Average
                  </span>
                  <div className="mt-1 text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {examAnalytics.avg} / {activeExam.totalMarks}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{examAnalytics.avgPct}% mean aggregate</p>
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Highest Score
                  </span>
                  <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {examAnalytics.highest} / {activeExam.totalMarks}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Top paper grade</p>
                </div>

                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Lowest Score
                  </span>
                  <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {examAnalytics.lowest} / {activeExam.totalMarks}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Needs remedial help</p>
                </div>

                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    Pass Percentage
                  </span>
                  <div className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {examAnalytics.passPct}%
                  </div>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">Passing cut: {activeExam.passingMarks} marks</p>
                </div>
              </div>

              {/* Two Column Grid: Grade Distribution Bar Chart + Top 3 Podium Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Left: Grade Distribution Bar Chart */}
                <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800">
                  <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Grade Distribution Curve
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Student count categorized across letter grades (A+ to F).
                  </p>

                  <div className="h-56 w-full">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={examAnalytics.gradeDist}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                          <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(val) => [`${val} Students`, "Count"]}
                            contentStyle={{
                              borderRadius: "12px",
                              backgroundColor: "#1e293b",
                              border: "none",
                              color: "#fff",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {examAnalytics.gradeDist.map((entry) => (
                              <Cell
                                key={`cell-${entry.grade}`}
                                fill={GRADE_COLORS[entry.grade] || "#6366F1"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Right: Top 3 Podium Card */}
                <div className="rounded-2xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>Class Toppers Podium</span>
                      </h4>
                      <Badge variant="success" className="text-[10px]">
                        Top 3 Honors
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Highest achieving learners in {activeExam.name}.
                    </p>

                    {examAnalytics.podium.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No marks recorded for this assessment yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {examAnalytics.podium.map((pod, idx) => {
                          const medals = [
                            { rank: "1st", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300", icon: Trophy },
                            { rank: "2nd", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Medal },
                            { rank: "3rd", color: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400", icon: Medal },
                          ];
                          const m = medals[idx] || medals[2];
                          const MedalIcon = m.icon;

                          return (
                            <motion.div
                              key={pod.student.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900/60"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs shrink-0", m.color)}>
                                  <MedalIcon className="h-4 w-4" />
                                </div>
                                <Avatar name={pod.student.name} size="sm" />
                                <div>
                                  <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                                    {pod.student.name}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    Roll #{pod.student.rollNumber}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {pod.mark} / {activeExam.totalMarks}
                                </span>
                                <Badge variant="success" className="text-[10px] ml-2">
                                  {pod.pct}% ({pod.grade})
                                </Badge>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <p className="mt-4 text-[11px] text-slate-400 italic text-center">
                    Podium rankings update live as marks are entered or revised.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ENTER MARKS                                           */}
      {/* ============================================================ */}
      {activeTab === "enter-marks" && (
        <motion.div
          key="tab-enter-marks"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Controls Bar: Exam selection & Progress */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <div className="w-full sm:w-72">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Examination
                  </label>
                  <select
                    value={marksExamId}
                    onChange={(e) => setMarksExamId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  >
                    {examsList.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.className.split(" - ")[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-4">
                  <Badge variant="info" className="text-xs">
                    Subject: {activeMarksExam?.subject}
                  </Badge>
                  <Badge variant="neutral" className="text-xs">
                    Max Marks: {activeMarksExam?.totalMarks}
                  </Badge>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="w-full lg:w-64">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Entry Progress</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {enteredMarksCount} of {marksExamStudents.length} Students
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${marksExamStudents.length > 0 ? (enteredMarksCount / marksExamStudents.length) * 100 : 0}%`,
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-full rounded-full bg-primary-600"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Marks Input Table / Cards */}
          <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                  Student Marks Entry Sheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: Press <kbd className="rounded border bg-slate-100 px-1 py-0.5 text-[10px] dark:bg-slate-800">Enter</kbd> to jump automatically to the next row.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveMarks}
                disabled={isSavingMarks}
                className="flex items-center gap-2 min-h-[44px]"
              >
                {isSavingMarks ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Marks</span>
                  </>
                )}
              </Button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Roll No</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-40 text-center">Marks Obtained (/{activeMarksExam?.totalMarks})</TableHead>
                    <TableHead className="w-28 text-center">Percentage</TableHead>
                    <TableHead className="w-28 text-center">Grade</TableHead>
                    <TableHead className="w-28 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {marksExamStudents.map((std, idx) => {
                    const rawVal = effectiveMarks[std.id] ?? "";
                    const numVal = Number(rawVal);
                    const hasValue = rawVal !== "" && !isNaN(numVal);
                    const pct = hasValue && activeMarksExam ? Math.round((numVal / activeMarksExam.totalMarks) * 100) : null;
                    const grade = pct !== null ? calculateGrade(pct) : "-";
                    const isPassed = hasValue && activeMarksExam ? numVal >= activeMarksExam.passingMarks : null;

                    return (
                      <TableRow key={std.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
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
                              <p className="text-xs text-slate-400">
                                {std.fatherName}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <input
                            ref={(el) => (inputRefs.current[idx] = el)}
                            type="number"
                            min="0"
                            max={activeMarksExam?.totalMarks || 100}
                            value={rawVal}
                            onChange={(e) => handleMarkChange(std.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            placeholder="0"
                            className="w-24 mx-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold text-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </TableCell>

                        <TableCell className="text-center font-bold text-xs text-slate-700 dark:text-slate-300">
                          {pct !== null ? `${pct}%` : "-"}
                        </TableCell>

                        <TableCell className="text-center">
                          {pct !== null ? (
                            <Badge variant={getGradeBadgeVariant(grade)} className="text-xs font-bold">
                              {grade}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {isPassed !== null ? (
                            <span className={cn("text-xs font-bold", isPassed ? "text-emerald-600" : "text-rose-600")}>
                              {isPassed ? "Pass" : "Fail"}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View: High-Touch Compact Cards */}
            <div className="block sm:hidden p-4 space-y-3">
              {marksExamStudents.map((std, idx) => {
                const rawVal = effectiveMarks[std.id] ?? "";
                const numVal = Number(rawVal);
                const hasValue = rawVal !== "" && !isNaN(numVal);
                const pct = hasValue && activeMarksExam ? Math.round((numVal / activeMarksExam.totalMarks) * 100) : null;
                const grade = pct !== null ? calculateGrade(pct) : "-";

                return (
                  <div
                    key={std.id}
                    className="rounded-xl border border-slate-200 p-3.5 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={std.name} size="sm" />
                        <div>
                          <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                            {std.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Roll #{std.rollNumber}
                          </p>
                        </div>
                      </div>

                      {pct !== null && (
                        <Badge variant={getGradeBadgeVariant(grade)} className="text-xs">
                          {grade} ({pct}%)
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      <span className="text-xs font-medium text-slate-500">
                        Marks (out of {activeMarksExam?.totalMarks}):
                      </span>
                      <input
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="number"
                        min="0"
                        max={activeMarksExam?.totalMarks || 100}
                        value={rawVal}
                        onChange={(e) => handleMarkChange(std.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        placeholder="0"
                        className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-primary-500 min-h-[44px] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: REPORT CARDS & PRINTABLE CERTIFICATES                 */}
      {/* ============================================================ */}
      {activeTab === "report-cards" && (
        <motion.div
          key="tab-report-cards"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Controls: Class & Student Pickers */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Class / Batch
                  </label>
                  <select
                    value={reportClass}
                    onChange={(e) => {
                      const newCls = e.target.value;
                      setReportClass(newCls);
                      const first = initialStudents.find((s) => s.className === newCls);
                      setReportStudentId(first ? first.id : "");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.name}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Student
                  </label>
                  <select
                    value={activeReportStudent?.id || ""}
                    onChange={(e) => setReportStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  >
                    {reportStudentsInClass.map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.name} (Roll #{std.rollNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons: Print PDF & WhatsApp */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReportCard}
                  className="flex items-center gap-2 text-xs font-semibold min-h-[44px]"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-2 text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Share on WhatsApp</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Official Report Card Preview Document */}
          {activeReportStudent && (
            <div className="overflow-x-auto pb-4">
              <Card className="max-w-4xl mx-auto p-6 sm:p-10 border-2 border-indigo-100 dark:border-indigo-950/60 shadow-lg bg-white dark:bg-[#131A2E]">
                {/* Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b-2 border-indigo-100 dark:border-indigo-900/50">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-md">
                      <GraduationCap className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-primary-700 dark:text-primary-300">
                        ACADEMY MANAGER
                      </h2>
                      <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Comprehensive Academic Evaluation Report
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Session 2026 - 2027
                    </span>
                    <span>Date of Issue: {formatDate(new Date().toISOString().split("T")[0])}</span>
                  </div>
                </div>

                {/* Student Info Block */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 dark:bg-slate-900/60 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Student Name:</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm font-heading">
                      {activeReportStudent.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Roll Number:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                      {activeReportStudent.rollNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Father Name:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-medium">
                      {activeReportStudent.fatherName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Class / Batch:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-medium">
                      {activeReportStudent.className.split(" - ")[0]}
                    </strong>
                  </div>
                </div>

                {/* Subject Assessment Table */}
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4 text-center">Max Marks</th>
                        <th className="py-3 px-4 text-center">Obtained</th>
                        <th className="py-3 px-4 text-center">Percentage</th>
                        <th className="py-3 px-4 text-center">Grade</th>
                        <th className="py-3 px-4 text-right">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportSubjectData.map((item) => (
                        <tr key={item.subject} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {item.subject}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 font-medium">
                            {item.total}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                            {item.obtained}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                            {item.pct}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={getGradeBadgeVariant(item.grade)} className="text-[11px] font-bold">
                              {item.grade}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-xs">
                            <span className={cn("font-medium", item.passed ? "text-emerald-600" : "text-rose-600")}>
                              {item.passed ? "Passed" : "Retake Required"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grand Summary Metrics Banner */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-center">
                  <div className="p-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Total Marks
                    </span>
                    <p className="mt-1 font-heading text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      {reportTotals.totalObt} / {reportTotals.totalMax}
                    </p>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Aggregate %
                    </span>
                    <p className="mt-1 font-heading text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      {reportTotals.overallPct}%
                    </p>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Overall Grade
                    </span>
                    <p className="mt-1 font-heading text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      {reportTotals.overallGrade}
                    </p>
                  </div>
                  <div className="p-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Class Position
                    </span>
                    <p className="mt-1 font-heading text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      {reportTotals.position}
                    </p>
                  </div>
                  <div className="p-2 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Attendance Rate
                    </span>
                    <p className="mt-1 font-heading text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      {activeReportStudent.attendanceRate}%
                    </p>
                  </div>
                </div>

                {/* Line Chart: Progress Across Exams */}
                <div className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary-600" />
                        <span>Academic Progress Trajectory Across Assessments</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Historical trend across diagnostic, monthly quizzes, and term evaluations.
                      </p>
                    </div>
                  </div>

                  <div className="h-44 w-full">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                          <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
                          <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(val) => [`${val}%`, "Score"]}
                            contentStyle={{
                              borderRadius: "10px",
                              backgroundColor: "#1e293b",
                              border: "none",
                              color: "#fff",
                              fontSize: "11px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="percentage"
                            stroke="#4F46E5"
                            strokeWidth={3}
                            dot={{ fill: "#4F46E5", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Teacher Remarks Textarea */}
                <div className="mt-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Faculty Remarks &amp; Guidance
                  </label>
                  <textarea
                    rows={2}
                    value={teacherRemarks}
                    onChange={(e) => setTeacherRemarks(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    placeholder="Enter teacher comments..."
                  />
                </div>

                {/* Signatures & Seal Lines */}
                <div className="mt-10 grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="text-center">
                    <div className="mx-auto w-44 border-b-2 border-slate-400 mb-2" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Class Faculty Signature</span>
                    <p className="text-[10px] text-slate-400">Head of Subject Department</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-44 border-b-2 border-slate-400 mb-2" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Principal / Director</span>
                    <p className="text-[10px] text-slate-400">Official Academy Seal Stamp</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* 4. MODAL: CREATE EXAM                                        */}
      {/* ============================================================ */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Examination"
        className="max-w-md"
      >
        <form onSubmit={handleCreateExam} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Exam Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. November Monthly Assessment"
              value={newExamForm.name}
              onChange={(e) => setNewExamForm({ ...newExamForm, name: e.target.value })}
              className={cn(
                "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                createErrors.name && "border-rose-500"
              )}
            />
            {createErrors.name && (
              <p className="mt-1 text-xs text-rose-500">{createErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Class Batch <span className="text-rose-500">*</span>
            </label>
            <select
              value={newExamForm.className}
              onChange={(e) => setNewExamForm({ ...newExamForm, className: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Physics"
                value={newExamForm.subject}
                onChange={(e) => setNewExamForm({ ...newExamForm, subject: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Exam Date
              </label>
              <input
                type="date"
                value={newExamForm.date}
                onChange={(e) => setNewExamForm({ ...newExamForm, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total Marks <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={newExamForm.totalMarks}
                onChange={(e) => setNewExamForm({ ...newExamForm, totalMarks: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Passing Cut Marks
              </label>
              <input
                type="number"
                value={newExamForm.passingMarks}
                onChange={(e) => setNewExamForm({ ...newExamForm, passingMarks: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Exam
            </Button>
          </div>
        </form>
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
