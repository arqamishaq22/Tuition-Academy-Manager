"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Clock,
  MapPin,
  Wallet,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Phone,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Download,
  GraduationCap,
  Sparkles,
  UserCheck,
  Briefcase,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { cn, formatPKR } from "@/lib/utils";

import { classes as initialClasses, teachers as initialTeachers } from "@/data/classes";
import { students as initialStudents } from "@/data/students";

// Popular subjects quick selector tags
const AVAILABLE_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Urdu",
  "General Science",
  "Statistics",
];

export default function ClassesPage() {
  // In-memory data states
  const [classesList, setClassesList] = useState(initialClasses);
  const [teachersList, setTeachersList] = useState(initialTeachers);
  const [studentsList, setStudentsList] = useState(initialStudents);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Expandable state for student rosters (stores class IDs)
  const [expandedClasses, setExpandedClasses] = useState({});

  // Modals state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClass, setDeletingClass] = useState(null);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);

  // Form states for Add/Edit Class
  const [classForm, setClassForm] = useState({
    name: "",
    subjects: [],
    teacher: "",
    teacherPhone: "",
    schedule: "",
    room: "",
    monthlyFee: "",
  });
  const [customSubjectInput, setCustomSubjectInput] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // Form states for Add Teacher
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    role: "",
    subjects: "",
    phone: "",
    experience: "",
  });
  const [teacherErrors, setTeacherErrors] = useState({});

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

  // Toggle expand/collapse for a class's student roster
  const toggleClassExpansion = (classId) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  // Filtered classes based on search
  const filteredClasses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return classesList;
    return classesList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.teacher.toLowerCase().includes(q) ||
        c.room.toLowerCase().includes(q) ||
        c.subjects.some((s) => s.toLowerCase().includes(q))
    );
  }, [classesList, searchQuery]);

  // High level metrics
  const totalEnrolled = useMemo(() => {
    return classesList.reduce((acc, curr) => {
      const count = studentsList.filter(
        (s) => s.className === curr.name || s.classId === curr.id
      ).length;
      return acc + (count || curr.totalStudents || 0);
    }, 0);
  }, [classesList, studentsList]);

  const avgAttendance = useMemo(() => {
    if (classesList.length === 0) return 0;
    const total = classesList.reduce((acc, curr) => acc + (curr.attendanceRate || 0), 0);
    return Math.round(total / classesList.length);
  }, [classesList]);

  const totalMonthlyPotential = useMemo(() => {
    return classesList.reduce((acc, curr) => {
      const count = studentsList.filter(
        (s) => s.className === curr.name || s.classId === curr.id
      ).length || curr.totalStudents || 0;
      return acc + (curr.monthlyFee || 0) * count;
    }, 0);
  }, [classesList, studentsList]);

  // Open Add Class Modal
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassForm({
      name: "",
      subjects: ["Mathematics"],
      teacher: teachersList[0]?.name || "Sir Usman Ghani",
      teacherPhone: teachersList[0]?.phone || "0300-8889901",
      schedule: "Mon - Thu, 4:00 PM - 6:00 PM",
      room: "Room 1 (Ground Floor)",
      monthlyFee: 5000,
    });
    setFormErrors({});
    setIsAddClassModalOpen(true);
  };

  // Open Edit Class Modal
  const handleOpenEditClass = (cls) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      subjects: cls.subjects || [],
      teacher: cls.teacher || "",
      teacherPhone: cls.teacherPhone || "",
      schedule: cls.schedule || "",
      room: cls.room || "",
      monthlyFee: cls.monthlyFee || 0,
    });
    setFormErrors({});
    setIsAddClassModalOpen(true);
  };

  // Toggle subject selection in modal
  const handleToggleSubject = (subject) => {
    setClassForm((prev) => {
      const exists = prev.subjects.includes(subject);
      const nextSubjects = exists
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects: nextSubjects };
    });
  };

  // Add custom subject tag
  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (trimmed && !classForm.subjects.includes(trimmed)) {
      setClassForm((prev) => ({
        ...prev,
        subjects: [...prev.subjects, trimmed],
      }));
      setCustomSubjectInput("");
    }
  };

  // Handle Teacher change to auto-fill phone
  const handleTeacherChange = (teacherName) => {
    const selected = teachersList.find((t) => t.name === teacherName);
    setClassForm((prev) => ({
      ...prev,
      teacher: teacherName,
      teacherPhone: selected ? selected.phone : prev.teacherPhone,
    }));
  };

  // Save Class (Create or Update)
  const handleSaveClass = (e) => {
    e.preventDefault();
    const errors = {};

    if (!classForm.name.trim()) errors.name = "Class title is required";
    if (classForm.subjects.length === 0) errors.subjects = "Select at least one subject";
    if (!classForm.teacher.trim()) errors.teacher = "Please assign a teacher";
    if (!classForm.schedule.trim()) errors.schedule = "Class timings are required";
    if (!classForm.room.trim()) errors.room = "Room or hall is required";
    if (!classForm.monthlyFee || Number(classForm.monthlyFee) <= 0) {
      errors.monthlyFee = "Enter a valid monthly fee in PKR";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingClass) {
      // Update existing
      setClassesList((prev) =>
        prev.map((c) =>
          c.id === editingClass.id
            ? {
                ...c,
                name: classForm.name.trim(),
                subjects: classForm.subjects,
                teacher: classForm.teacher.trim(),
                teacherPhone: classForm.teacherPhone.trim(),
                schedule: classForm.schedule.trim(),
                room: classForm.room.trim(),
                monthlyFee: Number(classForm.monthlyFee),
              }
            : c
        )
      );
      showToast("success", "Batch Updated", `${classForm.name} details have been saved.`);
    } else {
      // Add new
      const newClass = {
        id: `cls-${Date.now().toString().slice(-4)}`,
        name: classForm.name.trim(),
        subjects: classForm.subjects,
        teacher: classForm.teacher.trim(),
        teacherPhone: classForm.teacherPhone.trim(),
        schedule: classForm.schedule.trim(),
        room: classForm.room.trim(),
        monthlyFee: Number(classForm.monthlyFee),
        totalStudents: 0,
        attendanceRate: 95,
      };
      setClassesList((prev) => [newClass, ...prev]);
      showToast("success", "Batch Created", `${newClass.name} has been added successfully.`);
    }

    setIsAddClassModalOpen(false);
  };

  // Confirm and delete class
  const handleDeleteClass = () => {
    if (!deletingClass) return;
    setClassesList((prev) => prev.filter((c) => c.id !== deletingClass.id));
    showToast("info", "Batch Removed", `${deletingClass.name} was removed from the roster.`);
    setDeletingClass(null);
  };

  // Save new teacher
  const handleSaveTeacher = (e) => {
    e.preventDefault();
    const errors = {};
    if (!teacherForm.name.trim()) errors.name = "Teacher name is required";
    if (!teacherForm.role.trim()) errors.role = "Designation is required";
    if (!teacherForm.phone.trim()) errors.phone = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setTeacherErrors(errors);
      return;
    }

    const newTeacher = {
      id: `tch-${Date.now().toString().slice(-4)}`,
      name: teacherForm.name.trim(),
      role: teacherForm.role.trim(),
      subjects: teacherForm.subjects
        ? teacherForm.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : ["General"],
      phone: teacherForm.phone.trim(),
      batches: 0,
      experience: teacherForm.experience.trim() || "Qualified Faculty",
    };

    setTeachersList((prev) => [...prev, newTeacher]);
    showToast("success", "Faculty Added", `${newTeacher.name} was added to the faculty directory.`);
    setIsAddTeacherModalOpen(false);
    setTeacherForm({ name: "", role: "", subjects: "", phone: "", experience: "" });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Classes & Batches
            </h1>
            <Badge variant="info" className="text-xs">
              {classesList.length} Active Batches
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage tuition batches, class schedules, room allocations, and enrolled students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              showToast(
                "info",
                "Timetable Exported",
                "Class schedule PDF has been downloaded for print."
              )
            }
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            <span>Export Schedule</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddClass}
            className="flex items-center gap-2 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {/* Total Batches */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Batches
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {classesList.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across 4 academy halls
          </p>
        </Card>

        {/* Total Students */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Students
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {totalEnrolled}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Active enrolled learners
          </p>
        </Card>

        {/* Average Attendance */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Attendance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {avgAttendance}%
          </div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            High regular attendance
          </p>
        </Card>

        {/* Total Potential */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Potential
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {formatPKR(totalMonthlyPotential)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Projected batch revenue
          </p>
        </Card>
      </div>

      {/* 3. Search and Filter Bar */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by class title, subject, teacher name, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-[#131A2E]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-slate-100">{filteredClasses.length}</strong> of {classesList.length} classes
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Grid of Class Cards */}
      {filteredClasses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
            No Batches Found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            No class matches &quot;{searchQuery}&quot;. Try searching for another subject or clear the search filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="mt-4 text-xs font-semibold"
          >
            Clear Search
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredClasses.map((cls) => {
              // Get actual enrolled students for this class
              const enrolledStudents = studentsList.filter(
                (s) => s.className === cls.name || s.classId === cls.id
              );
              const isExpanded = !!expandedClasses[cls.id];
              const attendance = cls.attendanceRate || 92;

              return (
                <motion.div
                  key={cls.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col"
                >
                  <Card className="flex h-full flex-col justify-between overflow-hidden p-0 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    {/* Card Top / Header */}
                    <div className="p-5 sm:p-6 pb-4">
                      {/* Title & Action Buttons */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {cls.name}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {cls.subjects?.map((sub, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Edit & Delete quick icons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditClass(cls)}
                            aria-label="Edit batch"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingClass(cls)}
                            aria-label="Delete batch"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Teacher Profile Row */}
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                        <div className="flex items-center gap-3">
                          <Avatar name={cls.teacher} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {cls.teacher}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Lead Instructor
                            </div>
                          </div>
                        </div>

                        {cls.teacherPhone && (
                          <a
                            href={`https://wa.me/92${cls.teacherPhone.replace(/[^0-9]/g, "").slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            title="Message on WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Class Details: Schedule, Room, Fee */}
                      <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{cls.schedule}</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{cls.room}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2.5">
                            <Wallet className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatPKR(cls.monthlyFee)}
                              <span className="font-normal text-slate-400 text-[11px]"> / month</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                            <span>
                              {enrolledStudents.length || cls.totalStudents || 0} students
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Rate Animated Bar */}
                      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Average Attendance
                          </span>
                          <span
                            className={cn(
                              "font-bold text-xs",
                              attendance >= 90
                                ? "text-emerald-600 dark:text-emerald-400"
                                : attendance >= 80
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {attendance}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${attendance}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn(
                              "h-full rounded-full",
                              attendance >= 90
                                ? "bg-emerald-500"
                                : attendance >= 80
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expandable Enrolled Students Roster */}
                    <div className="border-t border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-900/40">
                      <button
                        onClick={() => toggleClassExpansion(cls.id)}
                        className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-slate-700 transition-colors hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-indigo-500" />
                          <span>
                            {isExpanded ? "Hide" : "View"} Enrolled Students (
                            {enrolledStudents.length})
                          </span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-slate-200/80 px-5 pb-4 pt-3 dark:border-slate-800"
                          >
                            {enrolledStudents.length === 0 ? (
                              <div className="py-4 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  No students registered in this batch yet.
                                </p>
                              </div>
                            ) : (
                              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                {enrolledStudents.map((std) => (
                                  <div
                                    key={std.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white p-2.5 text-xs shadow-2xs dark:border-slate-800/80 dark:bg-[#131A2E]"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <Avatar name={std.name} size="sm" />
                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                          {std.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          Roll #{std.rollNumber} • {std.phone}
                                        </p>
                                      </div>
                                    </div>

                                    <Badge
                                      variant={
                                        std.feeStatus === "Paid"
                                          ? "success"
                                          : std.feeStatus === "Pending"
                                          ? "warning"
                                          : "danger"
                                      }
                                      className="text-[10px] px-2 py-0.2 shrink-0 ml-2"
                                    >
                                      {std.feeStatus}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 5. Teachers & Faculty Directory Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Faculty & Teachers Directory
              </h2>
              <Badge variant="neutral" className="text-xs">
                {teachersList.length} Teachers
              </Badge>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Assigned instructors, subject specializations, and batch teaching load.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddTeacherModalOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Faculty</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {teachersList.map((tch) => {
            // Count classes taught by this teacher
            const batchesCount = classesList.filter((c) => c.teacher === tch.name).length;

            return (
              <Card
                key={tch.id}
                hoverLift
                className="flex flex-col justify-between p-4 sm:p-5 border border-slate-200 dark:border-slate-800"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <Avatar name={tch.name} size="md" />
                    <div className="min-w-0">
                      <h4 className="truncate font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                        {tch.name}
                      </h4>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {tch.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {tch.subjects?.map((subj, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Experience:
                    </span>{" "}
                    {tch.experience}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {batchesCount} {batchesCount === 1 ? "Batch" : "Batches"}
                  </span>

                  <a
                    href={`tel:${tch.phone}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{tch.phone}</span>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 6. Add / Edit Class Modal */}
      <Modal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        title={editingClass ? "Edit Class Batch" : "Add New Class Batch"}
        className="max-w-xl"
      >
        <form onSubmit={handleSaveClass} className="space-y-4 pt-2">
          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Class Batch Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Class 10 - Mathematics & Physics"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              className={cn(
                "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500",
                formErrors.name && "border-rose-500 focus:ring-rose-500/20"
              )}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-500">{formErrors.name}</p>
            )}
          </div>

          {/* Subjects Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subjects Included <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click to toggle subjects taught in this batch:
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {AVAILABLE_SUBJECTS.map((subj) => {
                const isSelected = classForm.subjects.includes(subj);
                return (
                  <button
                    type="button"
                    key={subj}
                    onClick={() => handleToggleSubject(subj)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors select-none",
                      isSelected
                        ? "bg-primary-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>

            {/* Custom subject tag input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Or add other subject (e.g. Accounting)"
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomSubject}
                className="text-xs"
              >
                Add Tag
              </Button>
            </div>
            {formErrors.subjects && (
              <p className="mt-1 text-xs text-rose-500">{formErrors.subjects}</p>
            )}
          </div>

          {/* Teacher Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Instructor <span className="text-rose-500">*</span>
              </label>
              <select
                value={classForm.teacher}
                onChange={(e) => handleTeacherChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {teachersList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.role.split(" ")[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Teacher WhatsApp / Contact
              </label>
              <input
                type="text"
                placeholder="03XX-XXXXXXX"
                value={classForm.teacherPhone}
                onChange={(e) => setClassForm({ ...classForm, teacherPhone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Schedule & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Class Schedule & Timing <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mon - Thu, 4:00 PM - 6:00 PM"
                value={classForm.schedule}
                onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })}
                className={cn(
                  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                  formErrors.schedule && "border-rose-500"
                )}
              />
              {formErrors.schedule && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.schedule}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Room or Hall <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Room 2 (First Floor)"
                value={classForm.room}
                onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                className={cn(
                  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                  formErrors.room && "border-rose-500"
                )}
              />
              {formErrors.room && (
                <p className="mt-1 text-xs text-rose-500">{formErrors.room}</p>
              )}
            </div>
          </div>

          {/* Monthly Fee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Monthly Fee per Student (PKR) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={classForm.monthlyFee}
              onChange={(e) => setClassForm({ ...classForm, monthlyFee: e.target.value })}
              className={cn(
                "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
                formErrors.monthlyFee && "border-rose-500"
              )}
            />
            {formErrors.monthlyFee && (
              <p className="mt-1 text-xs text-rose-500">{formErrors.monthlyFee}</p>
            )}
          </div>

          {/* Modal Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingClass ? "Save Changes" : "Create Batch"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClass}
        onClose={() => setDeletingClass(null)}
        title="Remove Batch"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to remove{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {deletingClass?.name}
            </strong>
            ? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingClass(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteClass}
            >
              Delete Batch
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. Add Teacher Modal */}
      <Modal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        title="Add Faculty Member"
        className="max-w-md"
      >
        <form onSubmit={handleSaveTeacher} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Teacher Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sir Asadullah Khan"
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            {teacherErrors.name && (
              <p className="mt-1 text-xs text-rose-500">{teacherErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Designation / Role <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Math Faculty"
              value={teacherForm.role}
              onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            {teacherErrors.role && (
              <p className="mt-1 text-xs text-rose-500">{teacherErrors.role}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subjects (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Mathematics, Calculus"
              value={teacherForm.subjects}
              onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={teacherForm.phone}
                onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              {teacherErrors.phone && (
                <p className="mt-1 text-xs text-rose-500">{teacherErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Experience
              </label>
              <input
                type="text"
                placeholder="e.g. 8 Years"
                value={teacherForm.experience}
                onChange={(e) => setTeacherForm({ ...teacherForm, experience: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddTeacherModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Teacher
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Floating Toast Notification */}
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
