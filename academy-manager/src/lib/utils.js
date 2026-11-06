import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn helper: Combines multiple Tailwind CSS class names
 * and safely resolves any conflicting styles.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Pakistani Rupee currency (e.g. 5000 -> Rs. 5,000)
 */
export function formatPKR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "Rs. 0";
  }
  return `Rs. ${Number(amount).toLocaleString("en-PK")}`;
}

/**
 * Format a date string into a readable format (e.g. "2026-11-03" -> "03 Nov 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Calculate grade based on percentage:
 * 90 and above: A+
 * 80 to 89: A
 * 70 to 79: B
 * 60 to 69: C
 * 50 to 59: D
 * Below 50: F (fail)
 */
export function calculateGrade(percentage) {
  if (percentage === undefined || percentage === null || isNaN(percentage)) {
    return "F";
  }
  const pct = Number(percentage);
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/**
 * Return badge variant for a letter grade:
 * A+, A: success
 * B: info
 * C, D: warning
 * F: danger
 */
export function getGradeBadgeVariant(grade) {
  if (grade === "A+" || grade === "A") return "success";
  if (grade === "B") return "info";
  if (grade === "C" || grade === "D") return "warning";
  return "danger";
}


