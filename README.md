# Tuition Academy Manager 🎓
> Smart Management SaaS Web Application for Pakistani Tuition Academies, Coaching Centers, and Entry-Test Preparatory Institutes.

Academy Manager eliminates paper registers and spreadsheet chaos for tuition center owners in Pakistan. Built specifically for local academy workflows—supporting Matric (9th/10th), F.Sc Pre-Medical & Pre-Engineering, ICS, O/A Levels, and MDCAT/ECAT entry test batches with full PKR currency formatting, one-tap WhatsApp parent notifications, and high-touch mobile marking.

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js 18.18.0 or higher
- npm 9.0 or higher

### Installation & Development

```bash
# 1. Navigate to the Next.js project directory
cd academy-manager

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Visit http://localhost:3000
```

### Production Build & Linting

```bash
cd academy-manager

# Lint codebase (0 errors, 0 warnings enforced)
npm run lint

# Compile optimized production build
npm run build

# Start production server
npm run start
```

---

## 🧭 Page Routes Overview

| Route | Title | Description |
|---|---|---|
| `/` | **Landing Page** | High-conversion marketing page with hero, live preview, feature highlights, PKR pricing tiers, testimonials, and FAQs. |
| `/login` | **Sign In** | Secure authentication portal with email/password validation, show/hide password, and quick-fill demo credentials. |
| `/signup` | **Create Account** | Multi-step academy onboarding with campus city selection, academy type, and trial activation. |
| `/dashboard` | **Academy Dashboard** | Executive summary: active students, attendance rate, PKR revenue collected vs pending, Recharts analytics, and quick-action modals. |
| `/students` | **Student Directory** | Comprehensive student roster with 30+ Pakistani profiles, table/grid views, search, batch filters, admission modal, and slide-out profile drawer. |
| `/classes` | **Classes & Batches** | Capacity tracking, morning/evening shifts, room assignments, faculty allocation, and class creation. |
| `/attendance` | **Attendance Center** | High-speed mobile-first daily attendance marking with segmented controls, bulk check, and direct WhatsApp absence alerts to parents. |
| `/fees` | **Fee Management** | Complete PKR ledger: monthly vouchers, partial payments, JazzCash/Easypaisa/Bank tracking, receipts, and overdue reminders. |
| `/results` | **Exams & Report Cards** | Exam scheduling, tab-navigated marks entry with real-time grade calculations, and printable board-style report cards with QR codes. |
| `/settings` | **Academy Settings** | Configuration for academy branding, tuition fee schedules, grading thresholds, staff permissions, and dark mode preferences. |
| `/parent` | **Parent Portal** | Standalone mobile-app interface for parents: child switcher, attendance calendar dots, fee receipts with WhatsApp inquiry, and notices. |

---

## 📁 Project Architecture & Folder Structure

```
Tuition Academy Manager/
├── academy-manager/            # Next.js 16.4 Application
│   ├── public/                 # Static brand assets & favicons
│   ├── src/
│   │   ├── app/                # Next.js App Router (v16.4)
│   │   │   ├── (auth)/         # Authentication route group (/login, /signup)
│   │   │   ├── (dashboard)/    # Academy Admin Workspace (/dashboard, /students, etc.)
│   │   │   ├── (marketing)/    # Public Marketing Site (/)
│   │   │   ├── parent/         # Dedicated Parent Portal (/parent)
│   │   │   ├── globals.css     # Tailwind v4 utility styles & theme tokens
│   │   │   └── layout.js       # Root layout with fonts & ThemeProvider
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Topbar, MobileNav, ThemeToggle
│   │   │   ├── sections/       # Landing page marketing components
│   │   │   ├── ui/             # Accessible atomic UI components (Modal, Button, Tabs, etc.)
│   │   │   └── ThemeProvider.js
│   │   ├── data/               # Realistic Pakistani mock datasets
│   │   └── lib/                # Utilities and helper logic
│   ├── package.json
│   └── README.md
└── README.md                   # Root repository documentation
```

---

## 📄 License
This project is proprietary and built for tuition academies across Pakistan. All rights reserved.
