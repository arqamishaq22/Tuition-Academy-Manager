"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  School,
  MapPin,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

// Pakistani cities for academy location
const cities = [
  { value: "lahore", label: "Lahore" },
  { value: "karachi", label: "Karachi" },
  { value: "islamabad", label: "Islamabad" },
  { value: "rawalpindi", label: "Rawalpindi" },
  { value: "faisalabad", label: "Faisalabad" },
  { value: "multan", label: "Multan" },
  { value: "peshawar", label: "Peshawar" },
  { value: "quetta", label: "Quetta" },
  { value: "sialkot", label: "Sialkot" },
  { value: "gujranwala", label: "Gujranwala" },
  { value: "other", label: "Other City" },
];

// Student capacity brackets
const studentRanges = [
  { value: "under_50", label: "Under 50 students" },
  { value: "50_150", label: "50 to 150 students" },
  { value: "150_300", label: "150 to 300 students" },
  { value: "300_plus", label: "300+ students" },
];

// Multi-select subject chips
const subjectOptions = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "Quranic Studies",
  "Commerce",
];

export default function SignupPage() {
  const router = useRouter();

  // Wizard Step (1: You, 2: Academy)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Personal info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Academy info
  const [academyName, setAcademyName] = useState("");
  const [city, setCity] = useState("lahore");
  const [studentRange, setStudentRange] = useState("50_150");
  const [selectedSubjects, setSelectedSubjects] = useState(["Mathematics", "Physics"]);

  // Validation & loading states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, type: "success", title: "", message: "" });

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1) return { score: 1, label: "Weak", color: "bg-rose-500", width: "w-1/3" };
    if (score === 2) return { score: 2, label: "Medium", color: "bg-amber-500", width: "w-2/3" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", width: "w-full" };
  };

  const passwordStrength = getPasswordStrength(password);

  // Toggle subject chip
  const toggleSubject = (subject) => {
    if (selectedSubjects.includes(subject)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  // Validate Step 1
  const validateStep1 = () => {
    const errs = {};
    if (!fullName.trim() || fullName.trim().length < 3) {
      errs.fullName = "Please enter your full name (at least 3 characters).";
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    // Pakistani phone validation (e.g. 03001234567 or 0300-1234567)
    const cleanedPhone = phone.replace(/[\s-]/g, "");
    if (!cleanedPhone || !/^03[0-9]{9}$/.test(cleanedPhone)) {
      errs.phone = "Enter a valid 11-digit Pakistani phone (e.g. 0300-1234567).";
    }

    if (!password || password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const errs = {};
    if (!academyName.trim() || academyName.trim().length < 3) {
      errs.academyName = "Please enter your academy name (at least 3 characters).";
    }
    if (!city) {
      errs.city = "Please select a city.";
    }
    if (selectedSubjects.length === 0) {
      errs.subjects = "Select at least one subject.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);

    // Simulate account setup delay
    setTimeout(() => {
      setIsLoading(false);
      setToast({
        isOpen: true,
        type: "success",
        title: "Account Created Successfully!",
        message: `Welcome ${fullName}! Setting up ${academyName}... Redirecting to dashboard.`,
      });

      // Redirect to /dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    }, 1100);
  };

  return (
    <div className="w-full">
      {/* Mobile-only brand logo */}
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

      {/* Main Signup Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-[#131A2E]">
        {/* Header with Step Tracker */}
        <div className="space-y-3 mb-6 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Step {currentStep} of 2 • {currentStep === 1 ? "Personal Info" : "Academy Setup"}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {currentStep === 1 ? "50%" : "100%"}
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: currentStep === 1 ? "50%" : "100%" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500"
            />
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
            {currentStep === 1 ? "Start your free pilot" : "Tell us about your academy"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {currentStep === 1
              ? "Create your owner administrator profile to manage your staff."
              : "We will configure your batches, fee vouchers, and city settings."}
          </p>
        </div>

        {/* Wizard Form with Animated Step Slide */}
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            /* STEP 1: Personal Details */
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onSubmit={handleNextStep}
              className="space-y-4"
              noValidate
            >
              {/* Full Name */}
              <Input
                id="fullName"
                type="text"
                label="Full Name"
                placeholder="Muhammad Arqam"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
                error={errors.fullName}
                leftIcon={User}
              />

              {/* Email */}
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="director@coaching.pk"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                error={errors.email}
                leftIcon={Mail}
              />

              {/* Pakistani Phone Number */}
              <Input
                id="phone"
                type="tel"
                label="WhatsApp / Mobile Number"
                placeholder="03XX XXXXXXX"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                }}
                error={errors.phone}
                leftIcon={Phone}
                helperText="Used for official fee receipt notices & alerts"
              />

              {/* Password with Strength Meter */}
              <div className="space-y-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  placeholder="Min 8 chars, mix letters & numbers"
                  autoComplete="new-password"
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

                {/* Password Strength Meter Bar */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strength:</span>
                      <span
                        className={cn(
                          "font-bold",
                          passwordStrength.score === 1 && "text-rose-500",
                          passwordStrength.score === 2 && "text-amber-500",
                          passwordStrength.score === 3 && "text-emerald-500"
                        )}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          passwordStrength.color,
                          passwordStrength.width
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Next Step Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center min-h-[44px] shadow-md shadow-primary-500/25 group text-sm font-semibold"
                >
                  <span>Continue to Academy Setup</span>
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.form>
          ) : (
            /* STEP 2: Academy Details */
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onSubmit={handleFinalSubmit}
              className="space-y-4"
              noValidate
            >
              {/* Academy Name */}
              <Input
                id="academyName"
                type="text"
                label="Academy / Institute Name"
                placeholder="Punjab Coaching Center"
                value={academyName}
                onChange={(e) => {
                  setAcademyName(e.target.value);
                  if (errors.academyName) setErrors((prev) => ({ ...prev, academyName: null }));
                }}
                error={errors.academyName}
                leftIcon={School}
              />

              {/* City & Student Range in 2 Cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  id="city"
                  label="City (Pakistan)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  options={cities}
                  leftIcon={MapPin}
                />

                <Select
                  id="students"
                  label="Student Enrollment"
                  value={studentRange}
                  onChange={(e) => setStudentRange(e.target.value)}
                  options={studentRanges}
                  leftIcon={Users}
                />
              </div>

              {/* Main Subjects (Multi-select chips) */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Main Subjects Offered
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {subjectOptions.map((subj) => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 select-none",
                          isSelected
                            ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-950/60 dark:border-primary-400 dark:text-primary-300 shadow-2xs font-semibold"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-[#131A2E] dark:border-slate-800 dark:text-slate-300"
                        )}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
                        <span>{subj}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.subjects && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
                    {errors.subjects}
                  </p>
                )}
              </div>

              {/* Back & Submit Actions */}
              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="w-1/3 justify-center min-h-[44px]"
                  leftIcon={ArrowLeft}
                  disabled={isLoading}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-2/3 justify-center min-h-[44px] shadow-md shadow-primary-500/25 group text-sm font-semibold"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  <span>Create account</span>
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Link to Login */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            Log in
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
