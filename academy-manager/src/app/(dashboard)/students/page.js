"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Download,
  Search,
  Filter,
  List,
  LayoutGrid,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2,
  X,
  Camera,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  Clock,
  SearchX,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { cn } from "@/lib/utils";

import { students as initialStudents } from "@/data/students";
import { classes } from "@/data/classes";

const PAGE_SIZE = 10;

export default function StudentsPage() {
  // In-memory student list state
  const [studentsList, setStudentsList] = useState(initialStudents);

  // Filters & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [feeStatusFilter, setFeeStatusFilter] = useState("all"); // all | Paid | Pending | Overdue
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"

  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // null = add, object = edit
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null); // for right-side drawer

  // Form input state
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    rollNumber: "",
    className: "Class 10 - Mathematics & Physics",
    dob: "2010-01-01",
    phone: "",
    address: "",
    monthlyFee: 5000,
  });
  const [formErrors, setFormErrors] = useState({});

  // Toast feedback state
  const [toast, setToast] = useState({ isOpen: false, type: "success", title: "", message: "" });

  // Class options for select
  const classOptions = useMemo(
    () => [
      { value: "all", label: "All Classes" },
      ...classes.map((c) => ({ value: c.name, label: c.name })),
    ],
    []
  );

  // Filtered and Sorted Students
  const filteredStudents = useMemo(() => {
    let result = [...studentsList];

    // Search filter (by name or roll number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }

    // Class filter
    if (selectedClass !== "all") {
      result = result.filter((s) => s.className === selectedClass);
    }

    // Fee status filter
    if (feeStatusFilter !== "all") {
      result = result.filter((s) => s.feeStatus === feeStatusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [studentsList, searchQuery, selectedClass, feeStatusFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Open Add Student Modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      fatherName: "",
      rollNumber: `TAM-${101 + studentsList.length}`,
      className: classes[0]?.name || "Class 10 - Mathematics & Physics",
      dob: "2010-05-15",
      phone: "0300-",
      address: "Lahore",
      monthlyFee: 5000,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEdit = (student, e) => {
    if (e) e.stopPropagation();
    setEditingStudent(student);
    setFormData({
      name: student.name,
      fatherName: student.fatherName || "",
      rollNumber: student.rollNumber,
      className: student.className,
      dob: student.dob || "2010-01-01",
      phone: student.phone,
      address: student.address || "",
      monthlyFee: student.monthlyFee,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validate Student Form
  const validateStudentForm = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errs.name = "Full name must be at least 3 characters.";
    }
    if (!formData.fatherName.trim() || formData.fatherName.trim().length < 3) {
      errs.fatherName = "Father's name is required.";
    }
    if (!formData.rollNumber.trim()) {
      errs.rollNumber = "Roll number is required.";
    }
    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = "Enter a valid phone number (e.g. 0300-1234567).";
    }
    if (!formData.monthlyFee || formData.monthlyFee <= 0) {
      errs.monthlyFee = "Monthly fee must be greater than 0 PKR.";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!validateStudentForm()) return;

    if (editingStudent) {
      // Update existing
      setStudentsList((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? { ...s, ...formData } : s))
      );
      setToast({
        isOpen: true,
        type: "success",
        title: "Student Updated",
        message: `${formData.name}'s profile has been updated.`,
      });
    } else {
      // Add new
      const newStudent = {
        id: `std-${Date.now().toString().slice(-4)}`,
        ...formData,
        attendanceRate: 100,
        feeStatus: "Paid",
        admissionDate: new Date().toISOString().split("T")[0],
        feeHistory: [
          {
            month: "November 2026",
            amount: Number(formData.monthlyFee),
            status: "Paid",
            date: new Date().toISOString().split("T")[0],
            method: "Cash",
          },
        ],
        results: [],
      };
      setStudentsList((prev) => [newStudent, ...prev]);
      setToast({
        isOpen: true,
        type: "success",
        title: "Student Admitted",
        message: `${formData.name} admitted successfully with Roll #${formData.rollNumber}.`,
      });
    }

    setIsFormModalOpen(false);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    setStudentsList((prev) => prev.filter((s) => s.id !== deletingStudent.id));
    setToast({
      isOpen: true,
      type: "success",
      title: "Student Removed",
      message: `${deletingStudent.name} (${deletingStudent.rollNumber}) deleted from records.`,
    });
    setDeletingStudent(null);
    if (selectedStudentDetail?.id === deletingStudent.id) {
      setSelectedStudentDetail(null);
    }
  };

  // Export Toast
  const handleExport = () => {
    setToast({
      isOpen: true,
      type: "info",
      title: "Export Initiated",
      message: `Exported ${filteredStudents.length} student records to Excel / CSV format.`,
    });
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedClass("all");
    setFeeStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center space-x-3">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Students
          </h1>
          <Badge variant="neutral" className="text-xs">
            {studentsList.length} Total
          </Badge>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={Download}
            className="shrink-0"
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={UserPlus}
            className="shrink-0 shadow-md shadow-primary-500/20"
          >
            Add student
          </Button>
        </div>
      </div>

      {/* 2. TOOLBAR (Search, Class Filter, Fee Filter, View Toggle) */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:bg-[#131A2E]"
            />
          </div>

          {/* Class Select Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/70 py-2 px-3 text-slate-800 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 cursor-pointer"
            >
              {classOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle (List vs Card) */}
          <div className="hidden lg:flex md:col-span-3 justify-end items-center space-x-1.5">
            <span className="text-xs text-slate-400 mr-1">View:</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-lg p-1.5 transition-colors cursor-pointer",
                  viewMode === "table"
                    ? "bg-white text-primary-600 shadow-2xs dark:bg-[#131A2E] dark:text-primary-400"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Table View"
                aria-label="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={cn(
                  "rounded-lg p-1.5 transition-colors cursor-pointer",
                  viewMode === "card"
                    ? "bg-white text-primary-600 shadow-2xs dark:bg-[#131A2E] dark:text-primary-400"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title="Card View"
                aria-label="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Fee Status Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium mr-1">Fee Status:</span>
          {["all", "Paid", "Pending", "Overdue"].map((status) => {
            const isSelected = feeStatusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setFeeStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border select-none",
                  isSelected
                    ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-[#131A2E] dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {status === "all" ? "All Statuses" : status}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. CONTENT AREA: EMPTY STATE OR LIST */}
      {filteredStudents.length === 0 ? (
        /* Empty State */
        <Card className="py-16 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <SearchX className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
              No students found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any student matching your filters. Try checking spelling or clearing filters.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear all filters
          </Button>
        </Card>
      ) : (
        <>
          {/* A. TABLE VIEW (Desktop lg+) */}
          <div className={cn("hidden", viewMode === "table" ? "lg:block" : "hidden")}>
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("name")}
                      className="cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Student</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Class Batch</TableHead>
                    <TableHead>Parent Phone</TableHead>
                    <TableHead
                      onClick={() => handleSort("attendanceRate")}
                      className="cursor-pointer select-none hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>Attendance %</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Fee Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {paginatedStudents.map((student) => (
                      <motion.tr
                        key={student.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedStudentDetail(student)}
                      >
                        {/* Student Name & Roll No */}
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar name={student.name} size="sm" />
                            <div>
                              <p className="font-heading font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {student.name}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                {student.rollNumber}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Class */}
                        <TableCell>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {student.className}
                          </span>
                        </TableCell>

                        {/* Phone */}
                        <TableCell>
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            {student.phone}
                          </span>
                        </TableCell>

                        {/* Attendance Progress */}
                        <TableCell>
                          <div className="w-32 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {student.attendanceRate}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  student.attendanceRate >= 90
                                    ? "bg-emerald-500"
                                    : student.attendanceRate >= 80
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                )}
                                style={{ width: `${student.attendanceRate}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Fee Status */}
                        <TableCell>
                          <Badge
                            variant={
                              student.feeStatus === "Paid"
                                ? "success"
                                : student.feeStatus === "Pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {student.feeStatus}
                          </Badge>
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedStudentDetail(student)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                              title="View Profile Drawer"
                              aria-label="View Student"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={(e) => handleOpenEdit(student, e)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800 dark:hover:text-primary-400 cursor-pointer"
                              title="Edit Student"
                              aria-label="Edit Student"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingStudent(student);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                              title="Delete Student"
                              aria-label="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* B. CARD VIEW (Default below lg, or toggled on lg+) */}
          <div className={cn(viewMode === "card" ? "block" : "block lg:hidden")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {paginatedStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      hoverLift={true}
                      className="p-5 flex flex-col justify-between cursor-pointer space-y-4"
                      onClick={() => setSelectedStudentDetail(student)}
                    >
                      {/* Top Row: Avatar, Name, Badge */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar name={student.name} size="md" />
                          <div>
                            <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 transition-colors">
                              {student.name}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-400">
                              {student.rollNumber}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            student.feeStatus === "Paid"
                              ? "success"
                              : student.feeStatus === "Pending"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {student.feeStatus}
                        </Badge>
                      </div>

                      {/* Class & Phone */}
                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{student.className}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{student.phone}</span>
                        </div>
                      </div>

                      {/* Attendance Bar */}
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Attendance:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {student.attendanceRate}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              student.attendanceRate >= 90
                                ? "bg-emerald-500"
                                : student.attendanceRate >= 80
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Quick-Actions Row */}
                      <div
                        className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          Rs. {new Intl.NumberFormat("en-PK").format(student.monthlyFee)}
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedStudentDetail(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            aria-label="View Student Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(student, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            aria-label="Edit Student"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingStudent(student);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            aria-label="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* C. PAGINATION BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredStudents.length}
              </span>{" "}
              students
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                leftIcon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={cn(
                        "h-8 w-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                        currentPage === pNum
                          ? "bg-primary-600 text-white"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                rightIcon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* 4. ADD & EDIT STUDENT MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingStudent ? "Edit Student Profile" : "Admit New Student"}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-left" noValidate>
          {/* Photo Preview Circle */}
          <div className="flex items-center space-x-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-700 dark:text-primary-300 font-heading font-extrabold text-lg border-2 border-primary-300 dark:border-primary-800">
              {formData.name ? formData.name.slice(0, 2).toUpperCase() : <Camera className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Student Photo / Avatar
              </p>
              <p className="text-[11px] text-slate-400">
                Initials are automatically generated from student name.
              </p>
            </div>
          </div>

          {/* Full Name & Father Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="name"
              label="Full Name"
              placeholder="e.g. Muhammad Ali"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
            <Input
              id="fatherName"
              label="Father / Guardian Name"
              placeholder="e.g. Tariq Mahmood"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              error={formErrors.fatherName}
            />
          </div>

          {/* Roll No & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="rollNumber"
              label="Roll Number"
              placeholder="TAM-101"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              error={formErrors.rollNumber}
            />
            <Select
              id="classSelect"
              label="Assigned Class Batch"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              options={classes.map((c) => ({ value: c.name, label: c.name }))}
            />
          </div>

          {/* DOB & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="dob"
              type="date"
              label="Date of Birth"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            <Input
              id="phone"
              type="tel"
              label="Parent Mobile / WhatsApp"
              placeholder="0300-1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={formErrors.phone}
            />
          </div>

          {/* Address & Monthly Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="address"
              label="Residential Address"
              placeholder="e.g. Johar Town, Lahore"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              id="monthlyFee"
              type="number"
              label="Monthly Fee (PKR)"
              placeholder="5000"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
              error={formErrors.monthlyFee}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingStudent ? "Save Changes" : "Confirm Admission"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deletingStudent)}
        onClose={() => setDeletingStudent(null)}
        title="Delete Student Record"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Are you sure you want to delete{" "}
            <strong className="text-slate-900 dark:text-white">
              {deletingStudent?.name} ({deletingStudent?.rollNumber})
            </strong>
            ? This will remove all their attendance and fee records.
          </p>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setDeletingStudent(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Delete Student
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. STUDENT DETAIL DRAWER (Slide-in from right) */}
      <AnimatePresence>
        {selectedStudentDetail && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
              onClick={() => setSelectedStudentDetail(null)}
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative z-10 w-full max-w-md h-full bg-white dark:bg-[#131A2E] shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <Avatar name={selectedStudentDetail.name} size="lg" />
                    <div>
                      <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                        {selectedStudentDetail.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">
                        Roll: {selectedStudentDetail.rollNumber}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentDetail(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Tabs */}
                <Tabs
                  tabs={[
                    {
                      id: "profile",
                      label: "Profile",
                      content: (
                        <div className="space-y-3.5 text-xs text-left">
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">Father Name:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {selectedStudentDetail.fatherName || "Tariq Mahmood"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">Class Batch:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {selectedStudentDetail.className}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">Parent Phone:</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {selectedStudentDetail.phone}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">Monthly Fee:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              Rs. {new Intl.NumberFormat("en-PK").format(selectedStudentDetail.monthlyFee)}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">Admission Date:</span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {selectedStudentDetail.admissionDate || "2026-03-01"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400">Address:</span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {selectedStudentDetail.address || "Lahore, Pakistan"}
                            </span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "fees",
                      label: "Fee History",
                      content: (
                        <div className="space-y-2.5 text-xs text-left">
                          {(selectedStudentDetail.feeHistory || []).map((inv, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {inv.month}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {inv.method || "Cash"} • {inv.date}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  Rs. {new Intl.NumberFormat("en-PK").format(inv.amount)}
                                </p>
                                <Badge
                                  variant={
                                    inv.status === "Paid"
                                      ? "success"
                                      : inv.status === "Pending"
                                      ? "warning"
                                      : "danger"
                                  }
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {inv.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "attendance",
                      label: "Attendance",
                      content: (
                        <div className="space-y-3 text-xs text-left">
                          <div className="p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-primary-900 dark:text-primary-100">
                                Overall Attendance Rate
                              </p>
                              <p className="text-[11px] text-primary-700 dark:text-primary-300">
                                Current Academic Session
                              </p>
                            </div>
                            <span className="font-heading text-xl font-extrabold text-primary-700 dark:text-primary-300">
                              {selectedStudentDetail.attendanceRate}%
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500">Recent Logs</p>
                            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span>05 Nov 2026 (Today)</span>
                              <Badge variant="success">Present</Badge>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span>04 Nov 2026</span>
                              <Badge variant="success">Present</Badge>
                            </div>
                            <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                              <span>03 Nov 2026</span>
                              <Badge variant={selectedStudentDetail.attendanceRate < 90 ? "danger" : "success"}>
                                {selectedStudentDetail.attendanceRate < 90 ? "Absent" : "Present"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "results",
                      label: "Results",
                      content: (
                        <div className="space-y-2.5 text-xs text-left">
                          {(selectedStudentDetail.results || []).length > 0 ? (
                            selectedStudentDetail.results.map((res, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">
                                    {res.test}
                                  </p>
                                  <p className="text-[11px] text-slate-400">{res.subject}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {res.marks} / {res.total}
                                  </p>
                                  <Badge variant="success" className="text-[10px]">
                                    Grade {res.grade}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 py-4 text-center">No exam results recorded yet.</p>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 justify-center"
                  leftIcon={Pencil}
                  onClick={() => handleOpenEdit(selectedStudentDetail)}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 justify-center"
                  onClick={() => setSelectedStudentDetail(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. TOAST NOTIFICATION */}
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
