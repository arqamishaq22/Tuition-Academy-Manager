"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  Wallet,
  AlertCircle,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  Award,
  Clock,
  TrendingUp,
  School,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { Select } from "@/components/ui/Select";

import { students } from "@/data/students";
import { classes } from "@/data/classes";
import { feeInvoices } from "@/data/fees";
import { attendanceRecords } from "@/data/attendance";

// 6 Months Revenue History (PKR)
const monthlyFeeData = [
  { month: "Jun", collected: 380000, target: 400000 },
  { month: "Jul", collected: 415000, target: 430000 },
  { month: "Aug", collected: 440000, target: 450000 },
  { month: "Sep", collected: 470000, target: 480000 },
  { month: "Oct", collected: 510000, target: 500000 },
  { month: "Nov", collected: 485000, target: 520000 },
];

// Fee Status Distribution
const feeStatusData = [
  { name: "Paid", value: 485000, color: "#10B981", percent: "78%" },
  { name: "Pending", value: 425000, color: "#F59E0B", percent: "14%" },
  { name: "Overdue", value: 200000, color: "#F43F5E", percent: "8%" },
];

// Weekly Attendance Rates
const weeklyAttendanceData = [
  { day: "Mon", rate: 96, present: 95 },
  { day: "Tue", rate: 94, present: 93 },
  { day: "Wed", rate: 98, present: 97 },
  { day: "Thu", rate: 91, present: 90 },
  { day: "Fri", rate: 95, present: 94 },
  { day: "Sat", rate: 88, present: 87 },
];

// Recent Activities Stream
const recentActivities = [
  {
    id: 1,
    title: "Muhammad Ali paid monthly tuition",
    desc: "Rs. 5,000 received via JazzCash (Challan #1001)",
    time: "15 mins ago",
    icon: Wallet,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  {
    id: 2,
    title: "Class 10 Physics attendance marked",
    desc: "23 of 24 students present (Sir Usman Ghani)",
    time: "1 hour ago",
    icon: CalendarCheck,
    color: "text-primary-600 bg-primary-50 dark:bg-primary-950/60 dark:text-primary-400",
  },
  {
    id: 3,
    title: "Zubair Khan admitted to Class 9",
    desc: "Roll #TAM-106 assigned with Science Group",
    time: "3 hours ago",
    icon: UserPlus,
    color: "text-accent-600 bg-accent-50 dark:bg-accent-950/60 dark:text-accent-400",
  },
  {
    id: 4,
    title: "Monthly Assessment 1 results uploaded",
    desc: "Average class score: 82% in Mathematics",
    time: "Yesterday",
    icon: Award,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400",
  },
];

// Number counting animation component
function AnimatedCounter({ end, prefix = "", suffix = "", duration = 1000 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = end / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [end, duration]);

  const formatted =
    end >= 1000
      ? new Intl.NumberFormat("en-PK").format(count)
      : count.toString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// Time-aware greeting & date calculation helper
function getGreetingAndDate() {
  if (typeof window === "undefined") {
    return { greeting: "Good morning", todayFormatted: "Thursday, 05 Nov 2026" };
  }
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const todayFormatted = new Intl.DateTimeFormat("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return { greeting, todayFormatted };
}

// Custom Recharts Area Chart Tooltip
function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-[#131A2E] text-xs space-y-1">
        <p className="font-heading font-bold text-slate-800 dark:text-slate-100">
          {label} 2026
        </p>
        <p className="text-primary-600 dark:text-primary-400 font-semibold">
          Collected: Rs. {new Intl.NumberFormat("en-PK").format(payload[0].value)}
        </p>
        {payload[1] && (
          <p className="text-slate-400">
            Target: Rs. {new Intl.NumberFormat("en-PK").format(payload[1].value)}
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Loading skeleton state (800ms)
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("last_6");
  const [toast, setToast] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Time-aware greeting and date state
  const [{ greeting, todayFormatted }] = useState(getGreetingAndDate);

  // Trigger WhatsApp reminder toast
  const handleRemind = (studentName, amount) => {
    setToast({
      isOpen: true,
      type: "success",
      title: "WhatsApp Reminder Dispatched",
      message: `Payment notice of Rs. ${amount.toLocaleString()} sent to ${studentName}'s guardian.`,
    });
  };

  // Calculate totals from mock data
  const totalStudents = classes.reduce((acc, c) => acc + c.totalStudents, 0);
  const totalPendingInvoices = feeInvoices.filter((f) => f.status === "Pending" || f.status === "Overdue");

  // Recharts styling tokens based on theme
  const chartStroke = isDark ? "#334155" : "#E2E8F0";
  const chartText = isDark ? "#94A3B8" : "#64748B";

  // 1. SKELETON LOADING STATE (800ms)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        {/* Skeleton Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>

        {/* Skeleton Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 2. REAL DASHBOARD CONTENT
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* 1. GREETING & QUICK ACTIONS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting}, Arqam
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Punjab Coaching Center
            </span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
          <Link href="/students">
            <Button size="sm" variant="outline" leftIcon={UserPlus} className="shrink-0">
              Add student
            </Button>
          </Link>
          <Link href="/attendance">
            <Button size="sm" variant="outline" leftIcon={CalendarCheck} className="shrink-0">
              Mark attendance
            </Button>
          </Link>
          <Link href="/fees">
            <Button size="sm" variant="primary" leftIcon={Wallet} className="shrink-0 shadow-md shadow-primary-500/20">
              Collect fee
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. STAT CARDS (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Total Students */}
        <Card hoverLift={true} className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Enrolled Students
            </p>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              <AnimatedCounter end={totalStudents} />
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Across 5 active batches</p>
          </div>
        </Card>

        {/* Card 2: Today's Attendance % */}
        <Card hoverLift={true} className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+2.4%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Today&apos;s Attendance Rate
            </p>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              <AnimatedCounter end={94} suffix="%" />
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">93 of 99 students present</p>
          </div>
        </Card>

        {/* Card 3: Fees Collected This Month */}
        <Card hoverLift={true} className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-2xs">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+18%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Fees Collected (Nov)
            </p>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              <AnimatedCounter end={485000} prefix="Rs. " />
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">78% of monthly target</p>
          </div>
        </Card>

        {/* Card 4: Pending Fees */}
        <Card hoverLift={true} className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="h-3 w-3" />
              <span>-8%</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pending Dues (PKR)
            </p>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              <AnimatedCounter end={62500} prefix="Rs. " />
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">3 vouchers pending collection</p>
          </div>
        </Card>
      </div>

      {/* 3. CHARTS ROW (2/3 Area Chart + 1/3 Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left (2/3): Area Chart "Fees collected, last 6 months" */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <CardTitle className="text-lg">Fee Collection Overview</CardTitle>
              <CardDescription>
                Monthly tuition fees collected in PKR over the last 6 months
              </CardDescription>
            </div>

            {/* Filter Dropdown */}
            <div className="w-36">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="last_6">Last 6 Months</option>
                <option value="year">This Year (2026)</option>
                <option value="last_3">Last 3 Months</option>
              </select>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="w-full h-64 sm:h-72 min-h-[240px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFeeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="feeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStroke} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={chartText}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: chartStroke }}
                />
                <YAxis
                  stroke={chartText}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#feeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right (1/3): Donut Chart "Fee Status" */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="mb-2">
            <CardTitle className="text-lg">Fee Status Distribution</CardTitle>
            <CardDescription>Current month payment breakdown</CardDescription>
          </CardHeader>

          {/* Donut Chart with Center Label */}
          <div className="relative w-full h-52 min-h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `Rs. ${new Intl.NumberFormat("en-PK").format(value)}`,
                    "Amount",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total In Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-medium text-slate-400">Total</span>
              <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
                Rs. 547k
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {feeStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    Rs. {(item.value / 1000).toFixed(0)}k
                  </span>
                  <span className="text-slate-400 text-[11px]">({item.percent})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. SECOND ROW (Weekly Attendance Bar Chart + Fees Due This Week) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Bar Chart "Weekly Attendance" */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="mb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Weekly Attendance Rate</CardTitle>
                <CardDescription>Daily present percentage (Monday to Saturday)</CardDescription>
              </div>
              <Badge variant="success">94.2% Avg</Badge>
            </div>
          </CardHeader>

          {/* Bar Chart Container */}
          <div className="w-full h-64 min-h-[240px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartStroke} vertical={false} />
                <XAxis dataKey="day" stroke={chartText} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={chartText}
                  fontSize={11}
                  domain={[60, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}% Attendance`, "Rate"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#131A2E" : "#FFFFFF",
                    borderColor: isDark ? "#334155" : "#E2E8F0",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="rate" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: "Fees Due This Week" List */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-lg">Fees Due This Week</CardTitle>
              <CardDescription>Pending tuition invoices needing collection</CardDescription>
            </div>
            <Link href="/fees">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
            {feeInvoices.slice(1, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <Avatar name={invoice.studentName} size="sm" />
                  <div>
                    <h4 className="font-heading text-xs font-bold text-slate-800 dark:text-slate-200">
                      {invoice.studentName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {invoice.className.split(" - ")[0]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      Rs. {new Intl.NumberFormat("en-PK").format(invoice.amount)}
                    </p>
                    <Badge
                      variant={invoice.status === "Overdue" ? "danger" : "warning"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {invoice.status === "Overdue" ? "Overdue" : "Due 10 Nov"}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemind(invoice.studentName, invoice.amount)}
                    className="h-8 px-2.5 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    leftIcon={MessageCircle}
                  >
                    Remind
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              WhatsApp reminders send localized Urdu/English fee notices
            </span>
          </div>
        </Card>
      </div>

      {/* 5. RECENT ACTIVITY & 6. TOP CLASSES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Recent Activity Timeline */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Academy Activity</CardTitle>
                <CardDescription>Live log of admissions, fees, and tests</CardDescription>
              </div>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start space-x-3 text-left">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${act.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {act.desc}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {act.time}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Top Classes Attendance Rate */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Top Class Batches</CardTitle>
                <CardDescription>Attendance efficiency across assigned faculty</CardDescription>
              </div>
              <School className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {classes.map((cls, idx) => {
              const rates = [96, 94, 91, 88, 93];
              const rate = rates[idx % rates.length];

              return (
                <div key={cls.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cls.name}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        ({cls.teacher})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                      {rate}%
                    </span>
                  </div>

                  {/* Progress Bar with Animated Width */}
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Floating Toast Notification for WhatsApp Reminders */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />
    </motion.div>
  );
}
