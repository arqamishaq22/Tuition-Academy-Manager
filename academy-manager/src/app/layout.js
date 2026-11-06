import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

// Headings font: Plus Jakarta Sans (500, 600, 700, 800)
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

// Body & UI font: Inter (400, 500, 600)
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Academy Manager - Tuition & Coaching Center SaaS (Pakistan)",
    template: "%s | Academy Manager",
  },
  description:
    "Smart management SaaS web application for Pakistani tuition academies, coaching centers, and home tutors.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#0B1020] dark:text-slate-100 font-body">
        {/* ThemeProvider from next-themes enables light/dark mode */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
