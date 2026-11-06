"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Building2,
  Wallet,
  BookOpen,
  Users,
  Bell,
  Palette,
  CreditCard,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Upload,
  AlertCircle,
  Sparkles,
  Shield,
  Sun,
  Moon,
  Laptop,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Camera,
  UserPlus,
  GraduationCap,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { cn, formatPKR } from "@/lib/utils";

// Initial Settings State
const INITIAL_SETTINGS = {
  // 1. Academy Profile
  profile: {
    name: "Al-Hadi Science & Commerce Academy",
    tagline: "Premier Coaching & Tuition Center",
    address: "Main Boulevard, Phase 3, Gulberg III",
    city: "Lahore",
    phone: "0300-8889901",
    email: "contact@alhadituition.edu.pk",
    logoUrl: "",
  },
  // 2. Fee Settings
  fee: {
    dueDay: "10",
    lateFeeEnabled: true,
    lateFeeAmount: 300,
    reminderTemplate:
      "Assalam o Alaikum, tuition fee of {amount} for {student} is due on {dueDate}. Kindly clear the balance at your earliest convenience.",
  },
  // 3. Classes & Subjects
  classesList: [
    { id: "c1", name: "Class 10 - Matric", subjects: ["Mathematics", "Physics", "Chemistry"] },
    { id: "c2", name: "Class 9 - Matric", subjects: ["General Science", "Math", "Biology"] },
    { id: "c3", name: "FSc Pre-Medical", subjects: ["Biology", "Chemistry", "Physics"] },
    { id: "c4", name: "FSc Pre-Engineering", subjects: ["Mathematics", "Physics", "Chemistry"] },
    { id: "c5", name: "ICS Computer Group", subjects: ["Computer Science", "Math", "Statistics"] },
  ],
  // 4. Team Members
  team: [
    { id: "t1", name: "Sir Usman Ghani", email: "usman.ghani@academy.pk", phone: "0300-8889901", role: "Principal / Admin" },
    { id: "t2", name: "Dr. Samina Kausar", email: "samina.k@academy.pk", phone: "0321-4445566", role: "Senior Faculty" },
    { id: "t3", name: "Sir Naveed Raza", email: "naveed.raza@academy.pk", phone: "0333-2223344", role: "Math Faculty" },
    { id: "t4", name: "Miss Hina Khalid", email: "hina.khalid@academy.pk", phone: "0345-6667788", role: "Science Faculty" },
    { id: "t5", name: "Kashif Mehmood", email: "accounts@academy.pk", phone: "0312-5556677", role: "Accountant" },
  ],
  // 5. Notifications
  notifications: {
    whatsappReminders: true,
    absentAlerts: true,
    weeklyReport: false,
    examPublishAlert: true,
  },
};

const SETTINGS_SECTIONS = [
  { id: "profile", label: "Academy Profile", icon: Building2 },
  { id: "fee", label: "Fee Settings", icon: Wallet },
  { id: "classes", label: "Classes & Subjects", icon: BookOpen },
  { id: "team", label: "Team & Staff", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
];

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Active settings section
  const [activeSection, setActiveSection] = useState("profile");

  // Saved state vs current working state for unsaved-changes detection
  const [savedSettings, setSavedSettings] = useState(INITIAL_SETTINGS);
  const [currentSettings, setCurrentSettings] = useState(INITIAL_SETTINGS);

  // New team member modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", phone: "", role: "Teacher" });

  // New class modal state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ name: "", subjects: "" });

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

  // Detect unsaved changes by JSON comparison
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(savedSettings) !== JSON.stringify(currentSettings);
  }, [savedSettings, currentSettings]);

  // Save changes handler
  const handleSaveChanges = () => {
    setSavedSettings(JSON.parse(JSON.stringify(currentSettings)));
    showToast("success", "Settings Saved", "Your academy preferences have been successfully updated.");
  };

  // Discard changes handler
  const handleDiscardChanges = () => {
    setCurrentSettings(JSON.parse(JSON.stringify(savedSettings)));
    showToast("info", "Changes Discarded", "Reverted all uncommitted settings.");
  };

  // Add Class
  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassForm.name.trim()) return;

    const subjectsArray = newClassForm.subjects
      ? newClassForm.subjects.split(",").map((s) => s.trim()).filter(Boolean)
      : ["General"];

    const newClassItem = {
      id: `c-${Date.now().toString().slice(-4)}`,
      name: newClassForm.name.trim(),
      subjects: subjectsArray,
    };

    setCurrentSettings((prev) => ({
      ...prev,
      classesList: [...prev.classesList, newClassItem],
    }));

    setIsAddClassModalOpen(false);
    setNewClassForm({ name: "", subjects: "" });
    showToast("success", "Class Added", `${newClassItem.name} added to your curriculum list.`);
  };

  // Remove Class
  const handleRemoveClass = (id) => {
    setCurrentSettings((prev) => ({
      ...prev,
      classesList: prev.classesList.filter((c) => c.id !== id),
    }));
  };

  // Invite Team Member
  const handleInviteMember = (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;

    const newMember = {
      id: `t-${Date.now().toString().slice(-4)}`,
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      phone: inviteForm.phone.trim() || "0300-0000000",
      role: inviteForm.role,
    };

    setCurrentSettings((prev) => ({
      ...prev,
      team: [...prev.team, newMember],
    }));

    setIsInviteModalOpen(false);
    setInviteForm({ name: "", email: "", phone: "", role: "Teacher" });
    showToast("success", "Member Added", `${newMember.name} has been added to the academy roster.`);
  };

  // Remove Team Member
  const handleRemoveMember = (id) => {
    setCurrentSettings((prev) => ({
      ...prev,
      team: prev.team.filter((m) => m.id !== id),
    }));
  };

  return (
    <div className="space-y-6 pb-28 md:pb-20">
      {/* 1. Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Academy Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure your coaching center identity, billing parameters, faculty access, and automated communications.
        </p>
      </div>

      {/* 2. Main Two-Column Layout (Sidebar Menu on left, Content on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Settings Navigation Menu */}
        <div className="lg:col-span-1">
          {/* Mobile Horizontal Scrollable Tab Bar */}
          <div className="block lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max">
              {SETTINGS_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all min-h-[44px]",
                      isActive
                        ? "bg-primary-600 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Vertical Menu Card */}
          <Card className="hidden lg:block p-2 border border-slate-200 dark:border-slate-800">
            <nav className="space-y-1">
              {SETTINGS_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left min-h-[44px]",
                      isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Right Column: Active Settings Section Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: ACADEMY PROFILE */}
          {activeSection === "profile" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                  Academy Identity &amp; Contact
                </h3>
                <p className="text-xs text-slate-500">
                  This information appears on fee vouchers, official report cards, and parent notifications.
                </p>
              </div>

              {/* Logo Upload Preview */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-md">
                  <GraduationCap className="h-10 w-10" />
                  <button
                    type="button"
                    title="Change Logo"
                    onClick={() => showToast("info", "Logo Uploader", "Image selector opened.")}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-md hover:bg-slate-100 dark:bg-[#131A2E] dark:text-slate-200"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Academy Crest / Logo
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recommended 512x512 PNG with transparent background.
                  </p>
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academy Name
                  </label>
                  <input
                    type="text"
                    value={currentSettings.profile.name}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        profile: { ...currentSettings.profile, name: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={currentSettings.profile.tagline}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        profile: { ...currentSettings.profile, tagline: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={currentSettings.profile.phone}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        profile: { ...currentSettings.profile, phone: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={currentSettings.profile.email}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        profile: { ...currentSettings.profile, email: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <select
                    value={currentSettings.profile.city}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        profile: { ...currentSettings.profile, city: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  >
                    {["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot"].map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Address
                  </label>
                  <input
                    type="text"
                    value={currentSettings.profile.address}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        profile: { ...currentSettings.profile, address: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveChanges}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </Button>
              </div>
            </Card>
          )}

          {/* SECTION 2: FEE SETTINGS */}
          {activeSection === "fee" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                  Fee Collection &amp; Late Policy
                </h3>
                <p className="text-xs text-slate-500">
                  Configure billing cycle deadlines, overdue surcharges, and auto-reminder messages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Due Day of Each Month
                  </label>
                  <select
                    value={currentSettings.fee.dueDay}
                    onChange={(e) =>
                      setCurrentSettings({
                        ...currentSettings,
                        fee: { ...currentSettings.fee, dueDay: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px]"
                  >
                    <option value="5">5th of every month</option>
                    <option value="10">10th of every month</option>
                    <option value="15">15th of every month</option>
                    <option value="20">20th of every month</option>
                  </select>
                </div>

                {/* Late fee surcharge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Late Fee Surcharge (PKR)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      disabled={!currentSettings.fee.lateFeeEnabled}
                      value={currentSettings.fee.lateFeeAmount}
                      onChange={(e) =>
                        setCurrentSettings({
                          ...currentSettings,
                          fee: {
                            ...currentSettings.fee,
                            lateFeeAmount: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 min-h-[44px] disabled:opacity-50"
                    />

                    {/* Animated Switch for Late Fee */}
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentSettings({
                          ...currentSettings,
                          fee: {
                            ...currentSettings.fee,
                            lateFeeEnabled: !currentSettings.fee.lateFeeEnabled,
                          },
                        })
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        currentSettings.fee.lateFeeEnabled ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          currentSettings.fee.lateFeeEnabled ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reminder Template */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default WhatsApp Fee Reminder Template
                </label>
                <textarea
                  rows={3}
                  value={currentSettings.fee.reminderTemplate}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      fee: { ...currentSettings.fee, reminderTemplate: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Variables: {"{student}"}, {"{amount}"}, {"{dueDate}"}
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveChanges}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Fee Policy</span>
                </Button>
              </div>
            </Card>
          )}

          {/* SECTION 3: CLASSES & SUBJECTS */}
          {activeSection === "classes" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                    Curriculum &amp; Batch Categories
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define the classes and subjects taught in your coaching center.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddClassModalOpen(true)}
                  className="flex items-center gap-1.5 min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Class</span>
                </Button>
              </div>

              <div className="space-y-3">
                {currentSettings.classesList.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div>
                      <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                        {cls.name}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {cls.subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveClass(cls.id)}
                      title="Remove class"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECTION 4: TEAM & STAFF */}
          {activeSection === "team" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                    Faculty &amp; Staff Members
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage instructors and administrative access roles.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-1.5 min-h-[44px]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invite Member</span>
                </Button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentSettings.team.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} size="md" />
                      <div>
                        <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                          {member.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {member.email} • {member.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="info" className="text-xs">
                        {member.role}
                      </Badge>

                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        title="Remove member"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECTION 5: NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                  Automated Alerts &amp; Triggers
                </h3>
                <p className="text-xs text-slate-500">
                  Enable or disable automated system messages and alerts.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "whatsappReminders",
                    label: "WhatsApp Fee Reminders",
                    desc: "Enable quick one-tap WhatsApp messages for students with pending fees.",
                  },
                  {
                    key: "absentAlerts",
                    label: "Instant Absent Student Alert",
                    desc: "Suggest automatic parent notification button whenever a student is marked Absent.",
                  },
                  {
                    key: "weeklyReport",
                    label: "Weekly Attendance Summary to Parents",
                    desc: "Generate weekly aggregate attendance percentage notices.",
                  },
                  {
                    key: "examPublishAlert",
                    label: "Result Publication Broadcasts",
                    desc: "Allow single-click result card WhatsApp dispatch to parents.",
                  },
                ].map((item) => {
                  const isChecked = currentSettings.notifications[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40"
                    >
                      <div className="pr-4">
                        <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.label}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>

                      {/* Animated Switch */}
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentSettings({
                            ...currentSettings,
                            notifications: {
                              ...currentSettings.notifications,
                              [item.key]: !isChecked,
                            },
                          })
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none min-h-[24px]",
                          isChecked ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isChecked ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveChanges}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Notification Preferences</span>
                </Button>
              </div>
            </Card>
          )}

          {/* SECTION 6: APPEARANCE */}
          {activeSection === "appearance" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                  Theme &amp; Display Preferences
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your interface appearance mode across desktop and mobile.
                </p>
              </div>

              {/* Theme Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: "light",
                    label: "Light Mode",
                    desc: "Crisp white cards & clean contrast",
                    icon: Sun,
                    previewBg: "bg-slate-100 border-slate-200 text-slate-800",
                  },
                  {
                    id: "dark",
                    label: "Dark Mode",
                    desc: "Deep navy #0B1020 & #131A2E cards",
                    icon: Moon,
                    previewBg: "bg-[#0B1020] border-slate-800 text-white",
                  },
                  {
                    id: "system",
                    label: "System Match",
                    desc: "Matches your OS device preference",
                    icon: Laptop,
                    previewBg: "bg-gradient-to-r from-slate-100 to-[#0B1020] border-slate-300 text-slate-800",
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        showToast("info", "Theme Updated", `Switched to ${t.label}.`);
                      }}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 transition-all shadow-2xs hover:shadow-md",
                        isSelected
                          ? "border-primary-500 bg-primary-50/20 ring-2 ring-primary-500/20 dark:border-primary-500"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                      )}
                    >
                      {/* Preview Thumbnail Box */}
                      <div
                        className={cn(
                          "h-20 w-full rounded-xl border flex flex-col justify-between p-2 mb-3",
                          t.previewBg
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-primary-500" />
                          <span className="h-1.5 w-12 rounded bg-slate-400/40" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 w-full rounded bg-slate-400/20" />
                          <div className="h-2 w-2/3 rounded bg-slate-400/20" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-primary-600" />
                          <span>{t.label}</span>
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-primary-600" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* SECTION 7: PLAN & BILLING */}
          {activeSection === "billing" && (
            <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">
                  Subscription &amp; Capacity
                </h3>
                <p className="text-xs text-slate-500">
                  Manage your academy manager plan, active student limits, and features.
                </p>
              </div>

              {/* Current Plan Card */}
              <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-teal-50/50 p-5 dark:border-indigo-900/60 dark:from-indigo-950/30 dark:to-teal-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950/80 dark:text-primary-300">
                      <Sparkles className="h-3.5 w-3.5" /> Free Pilot Plan (Active)
                    </span>
                    <h4 className="mt-2 font-heading text-xl font-bold text-slate-900 dark:text-slate-100">
                      Rs. 0 / Month (Pilot Trial)
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Complimentary access for coaching centers in Pakistan with up to 50 active students.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      showToast(
                        "info",
                        "Upgrade Options",
                        "Pro Plan starts at Rs. 3,500/month with unlimited students."
                      )
                    }
                    className="self-start sm:self-auto min-h-[44px]"
                  >
                    <span>Upgrade Plan</span>
                  </Button>
                </div>
              </div>

              {/* Usage Progress Bars */}
              <div className="space-y-4">
                <h4 className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">
                  Current Quota Utilization
                </h4>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Enrolled Students</span>
                    <span className="text-primary-600">32 / 50 Students (64%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-primary-600" style={{ width: "64%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Active Batches / Classes</span>
                    <span className="text-accent-600">5 / 10 Batches (50%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-accent-600" style={{ width: "50%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>WhatsApp Reminder Quota</span>
                    <span className="text-emerald-600">240 / 500 Dispatched (48%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 3. Floating Unsaved Changes Warning Bar */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 z-50 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-3.5 sm:px-6 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-[#131A2E]/95 md:min-w-[440px]"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>You have unsaved changes</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                className="text-xs min-h-[40px]"
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveChanges}
                className="text-xs min-h-[40px]"
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODAL: ADD CLASS */}
      <Modal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        title="Add Class Category"
        className="max-w-md"
      >
        <form onSubmit={handleAddClass} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Class Batch Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. O-Levels Science"
              value={newClassForm.name}
              onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subjects (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Mathematics, Physics, Chemistry"
              value={newClassForm.subjects}
              onChange={(e) => setNewClassForm({ ...newClassForm, subjects: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddClassModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: INVITE MEMBER */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Faculty or Staff Member"
        className="max-w-md"
      >
        <form onSubmit={handleInviteMember} className="space-y-3.5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Sir Asadullah"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. asad@academy.pk"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Staff Role
              </label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="Admin">Administrator</option>
                <option value="Teacher">Teacher / Faculty</option>
                <option value="Accountant">Accountant</option>
                <option value="Staff">Support Staff</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add Member
            </Button>
          </div>
        </form>
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
