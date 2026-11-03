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

