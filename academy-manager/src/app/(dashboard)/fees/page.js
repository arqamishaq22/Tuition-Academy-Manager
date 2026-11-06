"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  FileText,
  Printer,
  X,
  Receipt,
  MoreVertical,
  Edit3,
  BookOpen,
  Users,
  Check,
  Send,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { cn, formatPKR, formatDate } from "@/lib/utils";

import { classes } from "@/data/classes";
import {
  initialFeeRecords,
  initialFeeStructure,
  PAYMENT_METHODS,
} from "@/data/fees";

// Available months for selector
const AVAILABLE_MONTHS = [
  "October 2026",
  "November 2026",
  "December 2026",
];

export default function FeesPage() {
  // Main fee vouchers data in local memory state
  const [feeRecords, setFeeRecords] = useState(initialFeeRecords);
  const [feeStructures, setFeeStructures] = useState(initialFeeStructure);

  // Active view tab: "vouchers" | "structure"
  const [activeTab, setActiveTab] = useState("vouchers");

  // Filters state
  const [monthIndex, setMonthIndex] = useState(1); // Default to "November 2026"
  const currentMonth = AVAILABLE_MONTHS[monthIndex];
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Paid | Pending | Overdue | Partial

  // Collect Fee Modal state
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectStep, setCollectStep] = useState(1); // 1: Pick Student, 2: Payment Details, 3: Success Receipt
  const [collectForm, setCollectForm] = useState({
    student: null,
    amount: "",
    method: "JazzCash",
    note: "",
    date: "2026-11-06",
  });
  const [collectError, setCollectError] = useState("");
  const [latestReceipt, setLatestReceipt] = useState(null);

  // Send Reminders Modal state
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [selectedReminderIds, setSelectedReminderIds] = useState([]);
  const [reminderTemplate, setReminderTemplate] = useState(
    "Assalam o Alaikum, this is a friendly reminder that the tuition fee of {amount} for {student} ({class}, {month}) is due on {dueDate}. Kindly submit the fee at your earliest convenience. Thank you!"
  );

  // View Receipt Modal state
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Edit Fee Structure Modal state
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureFeeInput, setStructureFeeInput] = useState("");

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

  // Month navigation
  const handlePrevMonth = () => {
    if (monthIndex > 0) setMonthIndex(monthIndex - 1);
  };
  const handleNextMonth = () => {
    if (monthIndex < AVAILABLE_MONTHS.length - 1) setMonthIndex(monthIndex + 1);
  };

  // Top Summary Metrics
  const summaryMetrics = useMemo(() => {
    let expected = 0;
    let collected = 0;
    let pending = 0;
    let overdue = 0;

    feeRecords.forEach((item) => {
      expected += item.amount;
      collected += item.paidAmount;
      if (item.status === "Overdue") {
        overdue += item.balance;
      } else if (item.status === "Pending" || item.status === "Partial") {
        pending += item.balance;
      }
    });

    const collectionPercent = expected > 0 ? Math.round((collected / expected) * 100) : 0;

    return {
      expected,
      collected,
      pending,
      overdue,
      collectionPercent,
    };
  }, [feeRecords]);

  // Filtered fee records list
  const filteredRecords = useMemo(() => {
    return feeRecords.filter((item) => {
      // Class filter
      if (selectedClass !== "all" && item.className !== selectedClass) {
        return false;
      }
      // Status filter
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      // Search query (Student Name or Roll Number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesRoll = item.rollNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll) return false;
      }
      return true;
    });
  }, [feeRecords, selectedClass, statusFilter, searchQuery]);

  // Students with pending or overdue balance for Reminders modal
  const unpaidStudents = useMemo(() => {
    return feeRecords.filter(
      (r) => r.status === "Overdue" || r.status === "Pending" || r.status === "Partial"
    );
  }, [feeRecords]);

  // Open Collect Fee Flow
  const handleOpenCollectFee = (preselectedStudent = null) => {
    if (preselectedStudent) {
      setCollectForm({
        student: preselectedStudent,
        amount: String(preselectedStudent?.balance ?? preselectedStudent?.amount ?? 0),
        method: "Cash",
        note: "",
        date: "2026-11-06",
      });
      setCollectStep(2);
    } else {
      setCollectForm({
        student: null,
        amount: "",
        method: "JazzCash",
        note: "",
        date: "2026-11-06",
      });
      setCollectStep(1);
    }
    setCollectError("");
    setIsCollectModalOpen(true);
  };

  // Select student in Step 1
  const handlePickStudent = (record) => {
    if (!record) return;
    setCollectForm((prev) => ({
      ...prev,
      student: record,
      amount: String((record?.balance ?? 0) > 0 ? record.balance : (record?.amount ?? 0)),
    }));
    setCollectStep(2);
  };

  // Submit collected fee in Step 2
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    const student = collectForm.student;
    if (!student) return;

    const enteredAmount = Number(collectForm.amount);
    const balance = (student?.balance ?? 0) > 0 ? (student?.balance ?? 0) : (student?.amount ?? 0);

    if (!enteredAmount || enteredAmount <= 0) {
      setCollectError("Please enter a valid amount in PKR");
      return;
    }
    if (enteredAmount > balance) {
      setCollectError(`Amount cannot exceed the outstanding balance of ${formatPKR(balance)}`);
      return;
    }

    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const studentPaidAmount = student?.paidAmount ?? 0;
    const studentTotalAmount = student?.amount ?? 0;
    const newPaidAmount = studentPaidAmount + enteredAmount;
    const remainingBalance = Math.max(0, studentTotalAmount - newPaidAmount);
    const newStatus = remainingBalance === 0 ? "Paid" : "Partial";

    // Update in-memory fee records
    setFeeRecords((prev) =>
      prev.map((rec) =>
        rec.id === student.id
          ? {
              ...rec,
              paidAmount: newPaidAmount,
              balance: remainingBalance,
              status: newStatus,
              paidDate: collectForm.date,
              paymentMethod: collectForm.method,
              receiptNumber: receiptNum,
            }
          : rec
      )
    );

    const generatedReceipt = {
      receiptNumber: receiptNum,
      studentName: student.studentName,
      rollNumber: student.rollNumber,
      className: student.className,
      amount: enteredAmount,
      balance: remainingBalance,
      paymentMethod: collectForm.method,
      date: collectForm.date,
      phone: student.phone,
    };

    setLatestReceipt(generatedReceipt);
    setCollectStep(3);
    showToast(
      "success",
      "Payment Recorded",
      `Received ${formatPKR(enteredAmount)} from ${student.studentName}.`
    );
  };

  // Print Receipt in a clean printable window
  const handlePrintReceipt = (receipt) => {
    if (!receipt) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt - ${receipt.receiptNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
            .receipt { border: 2px solid #6366f1; border-radius: 14px; padding: 24px; max-width: 440px; margin: 20px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 14px; margin-bottom: 16px; }
            .brand { font-size: 20px; font-weight: 800; color: #4338ca; letter-spacing: -0.5px; }
            .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
            .rec-no { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 6px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .row span:first-child { color: #64748b; }
            .row strong { color: #0f172a; }
            .total-row { font-size: 16px; font-weight: 800; color: #059669; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="brand">ACADEMY MANAGER</div>
              <div class="sub">Official Tuition Fee Receipt</div>
              <div class="rec-no">Receipt #: ${receipt.receiptNumber}</div>
            </div>
            <div class="row"><span>Date:</span><strong>${receipt.date || "2026-11-06"}</strong></div>
            <div class="row"><span>Student Name:</span><strong>${receipt.studentName}</strong></div>
            <div class="row"><span>Roll Number:</span><strong>${receipt.rollNumber}</strong></div>
            <div class="row"><span>Class / Batch:</span><strong>${receipt.className}</strong></div>
            <div class="row"><span>Payment Method:</span><strong>${receipt.paymentMethod}</strong></div>
            <div class="row total-row"><span>Amount Received:</span><span>Rs. ${Number(receipt.amount || 0).toLocaleString("en-PK")}</span></div>
            <div class="row"><span>Remaining Balance:</span><strong>Rs. ${Number(receipt.balance || 0).toLocaleString("en-PK")}</strong></div>
            <div class="footer">
              <p>Thank you for the prompt fee payment.</p>
              <p>Academy Manager SaaS • System Generated</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp receipt sender link
  const buildReceiptWhatsAppLink = (receipt) => {
    if (!receipt) return "#";
    const amountVal = receipt.amount ?? receipt.paidAmount ?? 0;
    const balanceVal = receipt.balance ?? 0;
    const dateVal = receipt.date || receipt.paidDate || "today";
    const receiptNum = receipt.receiptNumber || "N/A";
    const message = `Assalam o Alaikum, fee payment of ${formatPKR(amountVal)} for ${receipt.studentName || "student"} (${receipt.className || ""}) has been received on ${dateVal}. Remaining balance: ${formatPKR(balanceVal)}. Receipt #${receiptNum}. Thank you!`;
    const cleanPhone = (receipt.phone || "").replace(/[^0-9]/g, "");
    const waPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  // Open Reminders Modal
  const handleOpenReminders = () => {
    setSelectedReminderIds(unpaidStudents.map((s) => s.id));
    setIsRemindersModalOpen(true);
  };

  // Toggle Reminder Checkbox
  const handleToggleReminder = (id) => {
    setSelectedReminderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All Reminders
  const handleToggleSelectAllReminders = () => {
    if (selectedReminderIds.length === unpaidStudents.length) {
      setSelectedReminderIds([]);
    } else {
      setSelectedReminderIds(unpaidStudents.map((s) => s.id));
    }
  };

  // Preview generated reminder text for first student
  const previewReminderMessage = useMemo(() => {
    if (unpaidStudents.length === 0) return "";
    const sample = unpaidStudents[0];
    return reminderTemplate
      .replace("{student}", sample.studentName)
      .replace("{amount}", formatPKR(sample.balance))
      .replace("{class}", sample.className.split(" - ")[0])
      .replace("{month}", sample.month)
      .replace("{dueDate}", formatDate(sample.dueDate));
  }, [reminderTemplate, unpaidStudents]);

  // Send WhatsApp Reminders (opens wa.me link for the first selected student and notifies user)
  const handleSendBatchReminders = () => {
    if (selectedReminderIds.length === 0) return;
    const target = unpaidStudents.find((s) => s.id === selectedReminderIds[0]);
    if (target) {
      const msg = reminderTemplate
        .replace("{student}", target.studentName)
        .replace("{amount}", formatPKR(target.balance))
        .replace("{class}", target.className.split(" - ")[0])
        .replace("{month}", target.month)
        .replace("{dueDate}", formatDate(target.dueDate));
      const cleanPhone = (target.phone || "").replace(/[^0-9]/g, "");
      const waPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    }
    showToast(
      "success",
      "Reminders Dispatched",
      `WhatsApp reminder launched for ${selectedReminderIds.length} student${selectedReminderIds.length > 1 ? "s" : ""}.`
    );
    setIsRemindersModalOpen(false);
  };

  // Edit fee structure
  const handleSaveFeeStructure = (e) => {
    e.preventDefault();
    const newFee = Number(structureFeeInput);
    if (!newFee || newFee <= 0) return;

    setFeeStructures((prev) =>
      prev.map((fs) =>
        fs.id === editingStructure.id ? { ...fs, monthlyFee: newFee } : fs
      )
    );
    showToast(
      "success",
      "Fee Updated",
      `${editingStructure.className} fee updated to ${formatPKR(newFee)}.`
    );
    setEditingStructure(null);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-16">
      {/* 1. Header & Tabs Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Fee Management
            </h1>
            <Badge variant="info" className="text-xs">
              {currentMonth}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track tuition fee vouchers, record incoming payments, and dispatch WhatsApp receipts.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("vouchers")}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]",
              activeTab === "vouchers"
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "vouchers" && (
              <motion.div
                layoutId="fees-active-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-[#131A2E]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span>Vouchers &amp; Ledger</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("structure")}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[44px]",
              activeTab === "structure"
                ? "text-slate-900 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {activeTab === "structure" && (
              <motion.div
                layoutId="fees-active-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-xs dark:bg-[#131A2E]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent-600 dark:text-accent-400" />
              <span>Fee Structure</span>
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Expected */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Expected
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {formatPKR(summaryMetrics.expected)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {feeRecords.length} registered students
          </p>
        </Card>

        {/* Collected (with Progress Bar) */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Collected
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatPKR(summaryMetrics.collected)}
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span>Collection Rate</span>
              <span className="text-emerald-600 dark:text-emerald-400">{summaryMetrics.collectionPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summaryMetrics.collectionPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
          </div>
        </Card>

        {/* Pending */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Dues
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {formatPKR(summaryMetrics.pending)}
          </div>
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
            Due within this week
          </p>
        </Card>

        {/* Overdue */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overdue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {formatPKR(summaryMetrics.overdue)}
          </div>
          <p className="mt-1 text-xs text-rose-600/90 dark:text-rose-400/90 font-medium">
            Requires urgent WhatsApp reminder
          </p>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: VOUCHERS & LEDGER                                      */}
      {/* ============================================================ */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <Card className="p-4">
            <div className="flex flex-col gap-4">
              {/* Top controls: Month, Class, and Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {/* Month Navigator */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 p-1 dark:border-slate-800 dark:bg-slate-900/60 self-start">
                  <button
                    onClick={handlePrevMonth}
                    disabled={monthIndex === 0}
                    aria-label="Previous month"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
                    {currentMonth}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    disabled={monthIndex === AVAILABLE_MONTHS.length - 1}
                    aria-label="Next month"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Class Filter Dropdown */}
                <div className="flex-1 max-w-xs">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-900 transition-colors focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  >
                    <option value="all">All Classes &amp; Batches</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons: Collect Fee & Send Reminders */}
                <div className="flex items-center gap-2 self-start lg:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenReminders}
                    className="flex items-center gap-2 text-xs font-semibold min-h-[44px]"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>Send Reminders ({unpaidStudents.length})</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenCollectFee()}
                    className="flex items-center gap-2 text-xs font-semibold shadow-sm min-h-[44px]"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Collect Fee</span>
                  </Button>
                </div>
              </div>

              {/* Bottom controls: Search bar & Status Filter Chips */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500 min-h-[44px]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Status Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {["All", "Paid", "Pending", "Overdue", "Partial"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors select-none min-h-[36px]",
                        statusFilter === st
                          ? "bg-primary-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Fee Records List */}
          {filteredRecords.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Receipt className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                No Fee Vouchers Found
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                No student matched your search and filter criteria. Try clearing filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                  setSelectedClass("all");
                }}
                className="mt-4 text-xs font-semibold"
              >
                Clear All Filters
              </Button>
            </Card>
          ) : (
            <>
              {/* MOBILE VIEW (< md): Stacked Cards */}
              <div className="block md:hidden space-y-3">
                <AnimatePresence initial={false}>
                  {filteredRecords.map((item) => {
                    const isOverdue = item.status === "Overdue";

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={cn(
                            "p-4 border transition-colors",
                            isOverdue
                              ? "border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20"
                              : "border-slate-200 dark:border-slate-800"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={item.studentName} size="md" />
                              <div className="min-w-0">
                                <h4 className="truncate font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {item.studentName}
                                </h4>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  Roll #{item.rollNumber} • {item.className.split(" - ")[0]}
                                </p>
                              </div>
                            </div>

                            <Badge
                              variant={
                                item.status === "Paid"
                                  ? "success"
                                  : item.status === "Pending"
                                  ? "warning"
                                  : item.status === "Overdue"
                                  ? "danger"
                                  : "info"
                              }
                              className="text-[11px] px-2 py-0.5 shrink-0"
                            >
                              {item.status}
                            </Badge>
                          </div>

                          {/* Amounts & Due Date */}
                          <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs dark:bg-slate-900/60">
                            <div>
                              <span className="text-[10px] text-slate-400">Total</span>
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {formatPKR(item.amount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400">Paid</span>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatPKR(item.paidAmount)}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400">Balance</span>
                              <p className="font-bold text-rose-600 dark:text-rose-400">
                                {formatPKR(item.balance)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                            <span className="flex items-center gap-1">
                              {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-rose-500" />}
                              <span>Due: {formatDate(item.dueDate)}</span>
                            </span>
                            {item.paymentMethod && (
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                via {item.paymentMethod}
                              </span>
                            )}
                          </div>

                          {/* Mobile Action Buttons */}
                          <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                            {item.status !== "Paid" && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenCollectFee(item)}
                                className="text-xs font-semibold min-h-[44px] flex-1"
                              >
                                <Wallet className="h-3.5 w-3.5 mr-1" />
                                <span>Collect</span>
                              </Button>
                            )}

                            {item.receiptNumber && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingReceipt(item)}
                                className="text-xs font-semibold min-h-[44px]"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" />
                                <span>Receipt</span>
                              </Button>
                            )}

                            <a
                              href={
                                item.status === "Paid"
                                  ? buildReceiptWhatsAppLink(item)
                                  : `https://wa.me/92${item.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                                      `Assalam o Alaikum, tuition fee reminder of ${formatPKR(item.balance)} for ${item.studentName} is pending for ${item.month}.`
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-600" />
                            </a>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* DESKTOP VIEW (md+): Full Structured Table */}
              <div className="hidden md:block">
                <Card className="overflow-hidden p-0 border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <AnimatePresence initial={false}>
                        {filteredRecords.map((item) => {
                          const isOverdue = item.status === "Overdue";

                          return (
                            <TableRow
                              key={item.id}
                              className={cn(
                                "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
                                isOverdue &&
                                  "bg-rose-50/40 hover:bg-rose-50/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                              )}
                            >
                              {/* Student Profile */}
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar name={item.studentName} size="sm" />
                                  <div>
                                    <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                                      {item.studentName}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      Roll #{item.rollNumber} • {item.phone}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Class */}
                              <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {item.className.split(" - ")[0]}
                              </TableCell>

                              {/* Month */}
                              <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                {item.month}
                              </TableCell>

                              {/* Amount */}
                              <TableCell className="text-right font-medium text-xs text-slate-900 dark:text-slate-100">
                                {formatPKR(item.amount)}
                              </TableCell>

                              {/* Paid */}
                              <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                {formatPKR(item.paidAmount)}
                              </TableCell>

                              {/* Balance */}
                              <TableCell className="text-right font-bold text-xs text-rose-600 dark:text-rose-400">
                                {formatPKR(item.balance)}
                              </TableCell>

                              {/* Due Date with AlertCircle if Overdue */}
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                  {isOverdue && (
                                    <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  )}
                                  <span>{formatDate(item.dueDate)}</span>
                                </div>
                              </TableCell>

                              {/* Status Badge */}
                              <TableCell>
                                <Badge
                                  variant={
                                    item.status === "Paid"
                                      ? "success"
                                      : item.status === "Pending"
                                      ? "warning"
                                      : item.status === "Overdue"
                                      ? "danger"
                                      : "info"
                                  }
                                  className="text-[11px]"
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Collect Action if balance > 0 */}
                                  {item.status !== "Paid" && (
                                    <button
                                      onClick={() => handleOpenCollectFee(item)}
                                      title="Collect fee"
                                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-50 px-2.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300"
                                    >
                                      <Wallet className="h-3.5 w-3.5" />
                                      <span>Collect</span>
                                    </button>
                                  )}

                                  {/* View Receipt */}
                                  {item.receiptNumber && (
                                    <button
                                      onClick={() => setViewingReceipt(item)}
                                      title="View Receipt"
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                      <Receipt className="h-4 w-4" />
                                    </button>
                                  )}

                                  {/* Direct WhatsApp message */}
                                  <a
                                    href={
                                      item.status === "Paid"
                                        ? buildReceiptWhatsAppLink(item)
                                        : `https://wa.me/92${item.phone.replace(/[^0-9]/g, "").slice(-10)}?text=${encodeURIComponent(
                                            `Assalam o Alaikum, tuition fee reminder of ${formatPKR(item.balance)} for ${item.studentName} is pending for ${item.month}.`
                                          )}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Send WhatsApp message"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                </div>
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
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: FEE STRUCTURE                                         */}
      {/* ============================================================ */}
      {activeTab === "structure" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                  Class &amp; Batch Fee Structure
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage standard monthly tuition fees, laboratory charges, and admission fees per class.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeStructures.map((struct) => (
                <Card
                  key={struct.id}
                  hoverLift
                  className="flex flex-col justify-between p-5 border border-slate-200 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                        {struct.className}
                      </h4>
                      <button
                        onClick={() => {
                          setEditingStructure(struct);
                          setStructureFeeInput(String(struct.monthlyFee));
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Edit monthly fee"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formatPKR(struct.monthlyFee)}
                      </span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Admission Fee:</span>
                        <span className="font-semibold">{formatPKR(struct.admissionFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lab &amp; Materials:</span>
                        <span className="font-semibold">{formatPKR(struct.labFee)}</span>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {struct.notes}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{struct.totalStudents} Active Students</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedClass(struct.className);
                        setActiveTab("vouchers");
                      }}
                      className="font-semibold text-primary-600 hover:underline"
                    >
                      View Ledger
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MODAL: COLLECT FEE FLOW (3 Steps)                         */}
      {/* ============================================================ */}
      <Modal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        title={
          collectStep === 1
            ? "Collect Fee - Select Student"
            : collectStep === 2
            ? "Payment Voucher Details"
            : "Payment Receipt Confirmed"
        }
        className="max-w-lg"
      >
        {/* STEP 1: Search & Pick Student */}
        {collectStep === 1 && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an enrolled student to record tuition fee collection:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {feeRecords
                .filter((r) => r.balance > 0)
                .map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handlePickStudent(rec)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all hover:border-primary-500 hover:bg-primary-50/30 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={rec.studentName} size="sm" />
                      <div>
                        <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                          {rec.studentName}
                        </p>
                        <p className="text-xs text-slate-400">
                          Roll #{rec.rollNumber} • {rec.className.split(" - ")[0]}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {formatPKR(rec.balance)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {rec.status === "Overdue" ? "Overdue" : "Pending"}
                      </p>
                    </div>
                  </button>
                ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCollectModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Amount & Payment Method Input */}
        {collectStep === 2 && collectForm.student && (
          <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
            {/* Student Mini Card */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <Avatar name={collectForm.student?.studentName || "Student"} size="md" />
                <div>
                  <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                    {collectForm.student?.studentName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Roll #{collectForm.student?.rollNumber} • {collectForm.student?.className}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Due Balance
                </span>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatPKR(collectForm.student?.balance || collectForm.student?.amount || 0)}
                </p>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount to Collect (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={collectForm.amount}
                onChange={(e) => {
                  setCollectForm({ ...collectForm, amount: e.target.value });
                  setCollectError("");
                }}
                className={cn(
                  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                  collectError && "border-rose-500"
                )}
                placeholder="e.g. 5000"
              />
              {collectError ? (
                <p className="mt-1 text-xs text-rose-500">{collectError}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  Default is full balance. Enter smaller amount for partial payment.
                </p>
              )}
            </div>

            {/* Payment Method Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Channel <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setCollectForm({ ...collectForm, method: pm })}
                    className={cn(
                      "flex items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition-all min-h-[44px]",
                      collectForm.method === pm
                        ? "bg-primary-600 text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    )}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Receipt Date
                </label>
                <input
                  type="date"
                  value={collectForm.date}
                  onChange={(e) => setCollectForm({ ...collectForm, date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received by Sir Usman"
                  value={collectForm.note}
                  onChange={(e) => setCollectForm({ ...collectForm, note: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCollectStep(1)}
              >
                Back
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm &amp; Generate Receipt
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen with Receipt Preview */}
        {collectStep === 3 && latestReceipt && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <h3 className="mt-2 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                Fee Recorded Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Voucher marked as paid and receipt voucher generated.
              </p>
            </div>

            {/* Receipt Preview Card */}
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5 dark:border-indigo-900/50">
                <div>
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    Official Receipt
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {latestReceipt?.receiptNumber}
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {latestReceipt?.date}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold">{latestReceipt?.studentName} ({latestReceipt?.rollNumber})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class:</span>
                  <span>{latestReceipt?.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-medium">{latestReceipt?.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Amount Paid:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatPKR(latestReceipt?.amount ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remaining Balance:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {formatPKR(latestReceipt?.balance ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Print & WhatsApp */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintReceipt(latestReceipt)}
                className="flex items-center justify-center gap-2 text-xs font-semibold min-h-[44px]"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </Button>

              <a
                href={buildReceiptWhatsAppLink(latestReceipt)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send on WhatsApp</span>
              </a>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCollectModalOpen(false)}
                className="text-xs font-semibold min-h-[44px]"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================ */}
      {/* 4. MODAL: SEND REMINDERS                                      */}
      {/* ============================================================ */}
      <Modal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        title="Send WhatsApp Fee Reminders"
        className="max-w-2xl"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select students with outstanding balance to dispatch automated fee reminder messages:
          </p>

          {/* Students Checkbox List */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between bg-slate-50 p-3 border-b border-slate-200 dark:bg-slate-900/60 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    unpaidStudents.length > 0 &&
                    selectedReminderIds.length === unpaidStudents.length
                  }
                  onChange={handleToggleSelectAllReminders}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Select All ({unpaidStudents.length} Students)</span>
              </label>

              <span className="text-xs font-semibold text-primary-600">
                {selectedReminderIds.length} Selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {unpaidStudents.map((std) => (
                <label
                  key={std.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedReminderIds.includes(std.id)}
                      onChange={() => handleToggleReminder(std.id)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {std.studentName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {std.className.split(" - ")[0]} • {std.phone}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatPKR(std.balance)}
                    </span>
                    <Badge
                      variant={std.status === "Overdue" ? "danger" : "warning"}
                      className="text-[9px] ml-2"
                    >
                      {std.status}
                    </Badge>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Editable Message Template */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              WhatsApp Message Template
            </label>
            <textarea
              rows={3}
              value={reminderTemplate}
              onChange={(e) => setReminderTemplate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Variables available: {"{student}"}, {"{amount}"}, {"{class}"}, {"{month}"}, {"{dueDate}"}
            </p>
          </div>

          {/* Live Preview */}
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
              Live Preview for {unpaidStudents[0]?.studentName}:
            </span>
            <p className="text-slate-700 dark:text-slate-300 italic whitespace-pre-wrap">
              &quot;{previewReminderMessage}&quot;
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRemindersModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendBatchReminders}
              disabled={selectedReminderIds.length === 0}
              className="flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Send via WhatsApp ({selectedReminderIds.length})</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* 5. MODAL: VIEW FULL RECEIPT                                  */}
      {/* ============================================================ */}
      <Modal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Tuition Fee Voucher Receipt"
        className="max-w-md"
      >
        {viewingReceipt && (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-slate-900">
              <div className="text-center border-b border-slate-100 pb-3 dark:border-slate-800">
                <h4 className="font-heading text-lg font-bold text-primary-600 dark:text-primary-400">
                  ACADEMY MANAGER
                </h4>
                <p className="text-xs text-slate-500">Official Payment Receipt</p>
                <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  {viewingReceipt.receiptNumber}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Student Name:</span>
                  <strong className="text-slate-900 dark:text-slate-100">{viewingReceipt.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Roll Number:</span>
                  <span>{viewingReceipt.rollNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Class:</span>
                  <span>{viewingReceipt.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="font-medium">{viewingReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Date:</span>
                  <span>{formatDate(viewingReceipt.paidDate || "2026-11-06")}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Paid Amount:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatPKR(viewingReceipt.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remaining Balance:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {formatPKR(viewingReceipt.balance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handlePrintReceipt({
                    receiptNumber: viewingReceipt.receiptNumber,
                    studentName: viewingReceipt.studentName,
                    rollNumber: viewingReceipt.rollNumber,
                    className: viewingReceipt.className,
                    amount: viewingReceipt.paidAmount,
                    balance: viewingReceipt.balance,
                    paymentMethod: viewingReceipt.paymentMethod,
                    date: viewingReceipt.paidDate || "2026-11-06",
                  })
                }
                className="flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
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

      {/* ============================================================ */}
      {/* 6. MODAL: EDIT FEE STRUCTURE                                 */}
      {/* ============================================================ */}
      <Modal
        isOpen={!!editingStructure}
        onClose={() => setEditingStructure(null)}
        title="Edit Monthly Class Fee"
      >
        {editingStructure && (
          <form onSubmit={handleSaveFeeStructure} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Class Batch
              </label>
              <p className="mt-0.5 font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingStructure.className}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Monthly Tuition Fee (PKR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={structureFeeInput}
                onChange={(e) => setStructureFeeInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                placeholder="e.g. 5500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingStructure(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Fee
              </Button>
            </div>
          </form>
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
