"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Search,
  User,
  Mail,
  GraduationCap,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { fadeUp, fadeIn, scaleIn } from "@/lib/motion";

export default function DesignSystemPage() {
  // Interactive UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastConfig, setToastConfig] = useState({ isOpen: false, type: "success", title: "", message: "" });
  const [btnLoading, setBtnLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Trigger toast notification
  const triggerToast = (type, title, message) => {
    setToastConfig({ isOpen: true, type, title, message });
  };

  // Color Swatch Groups
  const primaryPalette = [
    { name: "primary-50", hex: "#EEF2FF", class: "bg-primary-50 text-slate-800" },
    { name: "primary-100", hex: "#E0E7FF", class: "bg-primary-100 text-slate-800" },
    { name: "primary-200", hex: "#C7D2FE", class: "bg-primary-200 text-slate-900" },
    { name: "primary-300", hex: "#A5B4FC", class: "bg-primary-300 text-slate-900" },
    { name: "primary-400", hex: "#818CF8", class: "bg-primary-400 text-white" },
    { name: "primary-500", hex: "#6366F1", class: "bg-primary-500 text-white" },
    { name: "primary-600", hex: "#4F46E5", class: "bg-primary-600 text-white" },
    { name: "primary-700", hex: "#4338CA", class: "bg-primary-700 text-white" },
    { name: "primary-800", hex: "#3730A3", class: "bg-primary-800 text-white" },
    { name: "primary-900", hex: "#312E81", class: "bg-primary-900 text-white" },
  ];

  const accentPalette = [
    { name: "accent-50", hex: "#F0FDFA", class: "bg-accent-50 text-slate-800" },
    { name: "accent-100", hex: "#CCFBF1", class: "bg-accent-100 text-slate-800" },
    { name: "accent-400", hex: "#2DD4BF", class: "bg-accent-400 text-slate-900" },
    { name: "accent-500", hex: "#14B8A6", class: "bg-accent-500 text-white" },
    { name: "accent-600", hex: "#0D9488", class: "bg-accent-600 text-white" },
    { name: "accent-700", hex: "#0F766E", class: "bg-accent-700 text-white" },
  ];

  const highlightPalette = [
    { name: "highlight-100", hex: "#FEF3C7", class: "bg-highlight-100 text-slate-900" },
    { name: "highlight-400", hex: "#FBBF24", class: "bg-highlight-400 text-slate-900" },
    { name: "highlight-500", hex: "#F59E0B", class: "bg-highlight-500 text-white" },
    { name: "highlight-600", hex: "#D97706", class: "bg-highlight-600 text-white" },
  ];

  const statusPalette = [
    { name: "success (Emerald 500)", hex: "#10B981", class: "bg-emerald-500 text-white" },
    { name: "danger (Rose 500)", hex: "#F43F5E", class: "bg-rose-500 text-white" },
    { name: "warning (Amber 500)", hex: "#F59E0B", class: "bg-amber-500 text-white" },
  ];

  const slatePalette = [
    { name: "slate-50", hex: "#F8FAFC", class: "bg-slate-50 text-slate-900 border border-slate-200" },
    { name: "slate-100", hex: "#F1F5F9", class: "bg-slate-100 text-slate-900" },
    { name: "slate-200", hex: "#E2E8F0", class: "bg-slate-200 text-slate-900" },
    { name: "slate-400", hex: "#94A3B8", class: "bg-slate-400 text-slate-900" },
    { name: "slate-600", hex: "#475569", class: "bg-slate-600 text-white" },
    { name: "slate-800", hex: "#1E293B", class: "bg-slate-800 text-white" },
    { name: "slate-900", hex: "#0F172A", class: "bg-slate-900 text-white" },
    { name: "Dark Bg", hex: "#0B1020", class: "bg-[#0B1020] text-white border border-slate-700" },
    { name: "Dark Card", hex: "#131A2E", class: "bg-[#131A2E] text-white border border-slate-700" },
  ];

  // Sample tab content
  const tabData = [
    {
      id: "admissions",
      label: "New Admissions",
      content: (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Manage admission forms for Matric (Science), FSc Pre-Medical & Pre-Engineering, and ICS sessions.
        </p>
      ),
    },
    {
      id: "batches",
      label: "Class Batches",
      content: (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          5 active batches across Morning and Evening shifts with assigned teachers.
        </p>
      ),
    },
    {
      id: "schedules",
      label: "Timing Schedule",
      content: (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Classrooms are reserved Monday through Saturday from 3:00 PM to 8:00 PM.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1020] dark:text-slate-100 transition-colors duration-200 font-body">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 dark:border-slate-800 dark:bg-[#131A2E]/90 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold tracking-tight">
                Academy Manager Design System
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailwind CSS v4 • Tokens, Typography, Components & Motion
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Go to Dashboard
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Intro Banner */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="info" className="mb-2">
            Design Tokens & Component Preview
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight">
            Design System <span className="text-brand-gradient">Showcase</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-body">
            Complete design specification for the Academy Manager application. Toggle theme using the Sun/Moon button to inspect in both Light and Dark modes.
          </p>
        </section>

        {/* 1) TYPOGRAPHY SECTION */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              1. Typography & Font Scale
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Headings: Plus Jakarta Sans (weights 500, 600, 700, 800) • Body: Inter (weights 400, 500, 600)
            </p>
          </div>

          <Card className="space-y-8">
            {/* Heading Scale */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  Heading Scale (Plus Jakarta Sans, tracking-tight)
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">h1 • text-4xl md:text-5xl lg:text-6xl (font-extrabold)</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight">
                  Tuition Academy Manager
                </h1>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">h2 • text-3xl md:text-4xl (font-bold)</span>
                <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                  Student Admissions & Fee Tracking
                </h2>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">h3 • text-xl md:text-2xl (font-semibold)</span>
                <h3 className="text-xl md:text-2xl font-heading font-semibold tracking-tight">
                  Class 10 Physics & Mathematics Batch
                </h3>
              </div>
            </div>

            {/* Body Text */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 block mb-2">
                Body Font (Inter)
              </span>
              <p className="font-body text-base font-normal text-slate-700 dark:text-slate-300">
                <strong className="font-semibold text-slate-900 dark:text-white">Inter Regular (400) / Semibold (600):</strong> Modern tuition coaching centers across Lahore, Karachi, and Islamabad require real-time tracking of attendance, automated PKR fee voucher generation, and instant WhatsApp alerts for parents.
              </p>
              <p className="font-body text-sm font-medium text-slate-600 dark:text-slate-400">
                Inter Medium (500) • 14px UI copy used for table cells, input labels, badge texts, and dashboard statistics.
              </p>
              <p className="font-body text-xs text-slate-500 dark:text-slate-400">
                Inter Small (400) • 12px helper copy for metadata, invoice timestamps, and roll numbers.
              </p>
            </div>
          </Card>
        </section>

        {/* 2) COLOR SCHEME SECTION */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              2. Color Palette & Brand Tokens
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Indigo Primary • Teal Accent • Amber Highlight • Feedback & Neutrals
            </p>
          </div>

          {/* Brand Gradient Bar */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg">
            <h3 className="text-lg font-heading font-bold mb-1">
              Brand Gradient Token (primary-600 to accent-500)
            </h3>
            <p className="text-xs opacity-90">
              Applied on primary interactive buttons, hero headings, and key highlights (#4F46E5 → #14B8A6).
            </p>
          </div>

          {/* Primary Swatches */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Primary: Indigo (50 - 900)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {primaryPalette.map((color) => (
                <div key={color.name} className="space-y-1">
                  <div className={`h-14 rounded-xl ${color.class} flex items-end p-1.5 shadow-xs text-[10px] font-bold`}>
                    {color.name.replace("primary-", "")}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">{color.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Swatches */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Accent: Teal (50 - 700)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {accentPalette.map((color) => (
                <div key={color.name} className="space-y-1">
                  <div className={`h-14 rounded-xl ${color.class} flex items-end p-1.5 shadow-xs text-[10px] font-bold`}>
                    {color.name.replace("accent-", "")}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">{color.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlight & Status Swatches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Highlight: Amber (100 - 600)
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {highlightPalette.map((color) => (
                  <div key={color.name} className="space-y-1">
                    <div className={`h-14 rounded-xl ${color.class} flex items-end p-1.5 shadow-xs text-[10px] font-bold`}>
                      {color.name.replace("highlight-", "")}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">{color.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Feedback Colors (Success, Danger, Warning)
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {statusPalette.map((color) => (
                  <div key={color.name} className="space-y-1">
                    <div className={`h-14 rounded-xl ${color.class} flex items-end p-1.5 shadow-xs text-[10px] font-bold`}>
                      {color.name.split(" ")[0]}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">{color.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Neutral & Surfaces */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Neutrals & Dark Mode Surfaces
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
              {slatePalette.map((color) => (
                <div key={color.name} className="space-y-1">
                  <div className={`h-14 rounded-xl ${color.class} flex items-end p-1.5 shadow-xs text-[10px] font-bold`}>
                    {color.name}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">{color.hex}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3) BASE UI COMPONENTS SECTION */}
        <section className="space-y-8">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              3. Base UI Components
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All accessible, responsive, dark-mode ready, rounded-xl/2xl, with micro-interactions.
            </p>
          </div>

          {/* BUTTONS */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle>Buttons (Variants, Sizes & Interactions)</CardTitle>
              <CardDescription>
                Features hover lift (-translate-y-0.5 & shadow), active press down (scale-95), loading states, and left/right icons.
              </CardDescription>
            </CardHeader>

            {/* Variants */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Variants</span>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" leftIcon={Sparkles}>
                  Primary Gradient
                </Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500">Sizes & Icons</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary" leftIcon={User}>
                  Small (sm)
                </Button>
                <Button size="md" variant="primary" rightIcon={ArrowRight}>
                  Medium (md)
                </Button>
                <Button size="lg" variant="primary" rightIcon={ArrowRight}>
                  Large (lg)
                </Button>
              </div>
            </div>

            {/* Interactive Loading toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => setBtnLoading(!btnLoading)}
                >
                  {btnLoading ? "Processing Fee..." : "Toggle Loading State"}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Disabled Button
                </Button>
              </div>
            </div>
          </Card>

          {/* INPUTS AND SELECTS */}
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle>Form Controls (Input & Select)</CardTitle>
              <CardDescription>
                Rounded-xl with left icons, helper text, and validation error states.
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Student Full Name"
                placeholder="Muhammad Ali"
                leftIcon={User}
                helperText="Enter student name according to B-Form"
              />

              <Input
                label="Guardian Contact"
                placeholder="0300-1234567"
                leftIcon={Mail}
                error="Please enter a valid Pakistani phone number"
                defaultValue="0300-"
              />

              <Select
                label="Select Class Batch"
                leftIcon={GraduationCap}
                helperText="Batch schedule will be applied automatically"
                options={[
                  { value: "c10", label: "Class 10 - Matric (Physics & Math)" },
                  { value: "fsc1", label: "FSc Pre-Medical Part 1" },
                  { value: "fsc2", label: "FSc Pre-Engineering Part 2" },
                  { value: "ics", label: "ICS Computer Science" },
                ]}
              />
            </div>
          </Card>

          {/* CARDS & BADGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cards Showcase */}
            <Card hoverLift={true} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="success">Hover Lift Card</Badge>
                  <span className="text-xs text-slate-400">Rs. 5,000 / mo</span>
                </div>
                <CardTitle className="text-xl">Interactive Hover Lift Card</CardTitle>
                <CardDescription className="mt-1">
                  Hover over this card to see the smooth lift (-translate-y-1) and soft primary glow shadow.
                </CardDescription>
              </div>
              <CardFooter className="justify-between">
                <span className="text-xs text-slate-500 font-medium">Class 10 Matric Batch</span>
                <Button size="sm" variant="outline">
                  View Batch
                </Button>
              </CardFooter>
            </Card>

            {/* Badges Showcase */}
            <Card className="space-y-4">
              <CardTitle>Status Badges</CardTitle>
              <CardDescription>
                Designed for fee statuses (Paid, Overdue), attendance (Present, Absent), and admissions.
              </CardDescription>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Badge variant="success">Paid • Present • Active</Badge>
                <Badge variant="warning">Pending • Late • Due Soon</Badge>
                <Badge variant="danger">Overdue • Absent • Inactive</Badge>
                <Badge variant="info">JazzCash • FSc Pre-Med</Badge>
                <Badge variant="neutral">Draft • Neutral</Badge>
              </div>
            </Card>
          </div>

          {/* MODAL & TOAST TRIGGERS */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle>Modal & Toast Dialogs</CardTitle>
              <CardDescription>
                Both use Framer Motion for smooth scale and fade animations, with backdrop blur and escape key handling.
              </CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                Open Animated Modal
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  triggerToast("success", "Fee Recorded", "Payment of Rs. 5,000 received via JazzCash.")
                }
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  triggerToast("warning", "Fee Overdue Alert", "Invoice #1003 is overdue by 3 days.")
                }
              >
                Trigger Warning Toast
              </Button>
            </div>
          </Card>

          {/* TABS & AVATARS & SKELETON */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tabs */}
            <Card className="lg:col-span-2 space-y-4">
              <CardTitle>Interactive Tabs</CardTitle>
              <Tabs tabs={tabData} />
            </Card>

            {/* Avatars & Skeletons */}
            <Card className="space-y-6">
              <div>
                <CardTitle className="text-base mb-3">Avatars (Initials Fallback)</CardTitle>
                <div className="flex items-center space-x-3">
                  <Avatar name="Muhammad Ali" size="sm" />
                  <Avatar name="Fatima Noor" size="md" />
                  <Avatar name="Arqam Ishaq" size="lg" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base mb-3">Skeleton Loader (Shimmer)</CardTitle>
                <div className="space-y-2.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            </Card>
          </div>

          {/* RESPONSIVE TABLE */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Responsive Table</CardTitle>
                <CardDescription>
                  Supports horizontal scrolling on mobile screens with custom borders.
                </CardDescription>
              </div>
              <Badge variant="info">3 Sample Records</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class Batch</TableHead>
                  <TableHead>Fee Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    Muhammad Ali
                  </TableCell>
                  <TableCell>Class 10 - Mathematics</TableCell>
                  <TableCell className="font-mono">Rs. 5,000</TableCell>
                  <TableCell>JazzCash</TableCell>
                  <TableCell>
                    <Badge variant="success">Paid</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    Fatima Noor
                  </TableCell>
                  <TableCell>FSc Pre-Medical</TableCell>
                  <TableCell className="font-mono">Rs. 7,500</TableCell>
                  <TableCell>Cash</TableCell>
                  <TableCell>
                    <Badge variant="warning">Pending</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    Bilal Ahmed
                  </TableCell>
                  <TableCell>Class 9 - Science</TableCell>
                  <TableCell className="font-mono">Rs. 4,500</TableCell>
                  <TableCell>EasyPaisa</TableCell>
                  <TableCell>
                    <Badge variant="danger">Overdue</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* 4) ANIMATIONS SECTION */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
                4. Keyframe & Motion Animations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tailwind CSS v4 keyframes + Framer Motion presets with prefers-reduced-motion compatibility.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={RotateCcw}
              onClick={() => setAnimKey((k) => k + 1)}
            >
              Replay Animations
            </Button>
          </div>

          <div key={animKey} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Fade In */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-fade-in text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-fade-in
              </span>
              <p className="text-xs text-slate-500">Smooth opacity fade</p>
            </div>

            {/* Fade Up */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-fade-up text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-fade-up
              </span>
              <p className="text-xs text-slate-500">Fade + 16px vertical slide</p>
            </div>

            {/* Slide In Left */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-slide-in-left text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-slide-in-left
              </span>
              <p className="text-xs text-slate-500">Slide in from -24px</p>
            </div>

            {/* Slide In Right */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-slide-in-right text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-slide-in-right
              </span>
              <p className="text-xs text-slate-500">Slide in from +24px</p>
            </div>

            {/* Scale In */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-scale-in text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-scale-in
              </span>
              <p className="text-xs text-slate-500">Scale up from 0.95</p>
            </div>

            {/* Float */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-float text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-float
              </span>
              <p className="text-xs text-slate-500">Slow 4s up and down hover</p>
            </div>

            {/* Pulse Soft */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131A2E] animate-pulse-soft text-center space-y-2">
              <span className="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                animate-pulse-soft
              </span>
              <p className="text-xs text-slate-500">Soft breathing pulse</p>
            </div>

            {/* Gradient Shift */}
            <div className="p-5 rounded-2xl text-white bg-gradient-to-r from-primary-600 via-accent-500 to-highlight-500 bg-[length:200%_200%] animate-gradient-shift text-center space-y-2 shadow-md">
              <span className="text-xs font-mono font-bold">animate-gradient-shift</span>
              <p className="text-xs opacity-90">Moving gradient surface</p>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Modal Instance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tuition Fee Invoice Modal"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Invoice #TAM-2026-101 generated for <strong>Muhammad Ali</strong> (Class 10 Matric).
          </p>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 dark:bg-slate-900/60 dark:border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Tuition Fee:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Rs. 5,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Due Date:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">10 Nov 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Supported Gateways:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">JazzCash / EasyPaisa / Cash</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                triggerToast("success", "Voucher Printed", "Fee voucher generated successfully.");
              }}
            >
              Print Fee Voucher
            </Button>
          </div>
        </div>
      </Modal>

      {/* Interactive Toast Instance */}
      <Toast
        isOpen={toastConfig.isOpen}
        onClose={() => setToastConfig((t) => ({ ...t, isOpen: false }))}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
      />
    </div>
  );
}

