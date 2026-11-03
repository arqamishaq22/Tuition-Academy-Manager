"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation & loading states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, type: "success", title: "", message: "" });

  // Client-side validation function
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      setToast({
        isOpen: true,
        type: "success",
        title: "Welcome Back!",
        message: "Signing in as Arqam Ishaq (Owner)... Redirecting to dashboard.",
      });

      // Redirect to /dashboard after brief confirmation
      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    }, 1000);
  };

  return (
    <div className="w-full">
      {/* Mobile-only logo above form */}
      <div className="lg:hidden text-center mb-6">
        <Link href="/" className="inline-flex items-center space-x-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            Academy Manager
          </span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-[#131A2E]">
        <div className="space-y-1.5 mb-6 text-left">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sign in to your academy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enter your email and password to access the administrative portal.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          {/* Email Field */}
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="admin@academy.pk"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            error={errors.email}
            leftIcon={Mail}
          />

          {/* Password Field with Eye/EyeOff toggle */}
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Enter at least 8 characters"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            error={errors.password}
            leftIcon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setToast({
                  isOpen: true,
                  type: "info",
                  title: "Password Reset",
                  message: "Password recovery instructions sent to your registered email.",
                });
              }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold cursor-pointer transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center min-h-[44px] shadow-md shadow-primary-500/25 group text-sm font-semibold"
              isLoading={isLoading}
              disabled={isLoading}
            >
              <span>Log in</span>
              <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Divider "or" */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 dark:bg-[#131A2E] font-medium">
                or
              </span>
            </div>
          </div>

          {/* Continue as Parent Outline Button */}
          <Link href="/parent" className="block w-full">
            <Button
              variant="outline"
              className="w-full justify-center min-h-[44px] text-xs font-semibold"
              leftIcon={UserCheck}
            >
              Continue as parent
            </Button>
          </Link>
        </form>

        {/* Link to Signup */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>Don&apos;t have an academy account? </span>
          <Link
            href="/signup"
            className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            Start free pilot
          </Link>
        </div>
      </div>

      {/* Success / Alert Toast */}
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
