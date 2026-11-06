# Academy Manager 🎓
> Smart Management SaaS for Pakistani Tuition Academies, Coaching Centers, and Entry-Test Preparatory Institutes.

Academy Manager eliminates paper registers and spreadsheet chaos for tuition center owners in Pakistan. Built specifically for local academy workflows—supporting Matric (9th/10th), F.Sc Pre-Medical & Pre-Engineering, ICS, O/A Levels, and MDCAT/ECAT entry test batches with full PKR currency formatting, one-tap WhatsApp parent notifications, and high-touch mobile marking.

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js 18.18.0 or higher
- npm 9.0 or higher

### Installation & Development

```bash
# 1. Clone repository and navigate to the project directory
git clone https://github.com/your-username/tuition-academy-manager.git
cd Tuition-Academy-Manager/academy-manager

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Visit http://localhost:3000
```

### Production Build & Linting

```bash
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
academy-manager/
├── public/                     # Static brand assets & favicons
├── src/
│   ├── app/                    # Next.js App Router (v16.4)
│   │   ├── (auth)/             # Authentication route group
│   │   │   ├── login/          # /login (Sign In)
│   │   │   ├── signup/         # /signup (Registration)
│   │   │   └── layout.js       # Shared split-screen auth layout
│   │   ├── (dashboard)/        # Academy Admin Workspace
│   │   │   ├── attendance/     # /attendance (Marking & History)
│   │   │   ├── classes/        # /classes (Batches & Capacities)
│   │   │   ├── dashboard/      # /dashboard (KPIs & Visualizations)
│   │   │   ├── fees/           # /fees (Vouchers, Receipts, PKR Ledger)
│   │   │   ├── results/        # /results (Exams & Report Cards)
│   │   │   ├── settings/       # /settings (System Configuration)
│   │   │   ├── students/       # /students (Directory & Enrollment)
│   │   │   └── layout.js       # Dashboard shell with Sidebar & Topbar
│   │   ├── (marketing)/        # Public Marketing Site
│   │   │   └── page.js         # / (High-converting Landing Page)
│   │   ├── parent/             # /parent (Standalone Parent Portal)
│   │   ├── favicon.ico
│   │   ├── globals.css         # Tailwind v4 utility styles & theme variables
│   │   └── layout.js           # Root layout with fonts & ThemeProvider
│   ├── components/
│   │   ├── layout/             # Sidebar, Topbar, MobileNav, ThemeToggle
│   │   ├── sections/           # Landing page marketing components
│   │   ├── ui/                 # Accessible atomic design system components:
│   │   │   ├── Avatar.js       # Auto-initials and responsive sizes
│   │   │   ├── Badge.js        # Color variants for status & grades
│   │   │   ├── Button.js       # Primary, secondary, outline, ghost, sizes
│   │   │   ├── Card.js         # Modern surface container with hover states
│   │   │   ├── Input.js        # Form controls with label and error state
│   │   │   ├── Modal.js        # Accessible dialog with max-h and auto-scroll
│   │   │   ├── Table.js        # Responsive desktop tabular components
│   │   │   ├── Tabs.js         # Animated sliding pill & underline tabs
│   │   │   └── Toast.js        # Timed user notifications
│   │   └── ThemeProvider.js    # next-themes integration
│   ├── data/                   # Realistic Pakistani mock datasets
│   │   ├── attendance.js       # Attendance records & student lists
│   │   ├── classes.js          # Class batches, timings & faculties
│   │   ├── fees.js             # 32+ student invoices & fee structures
│   │   ├── results.js          # Exam schedules, marks ledger & subjects
│   │   └── students.js         # 30+ Pakistani student demographic records
│   └── lib/
│       └── utils.js            # Tailwind cn helper, grade & formatting logic
├── eslint.config.mjs           # Flat ESLint configuration
├── next.config.mjs             # Next.js compiler & caching config
├── package.json                # Project dependencies and npm scripts
└── README.md                   # System documentation
```

---

## 🎨 Design System & Accessibility

- **Color System**: Tailored Emerald (`#059669`) / Indigo (`#4F46E5`) primary palette, high-contrast Slate neutrals, and semantic alert hues.
- **Dark Mode**: Complete theme support with smooth icon rotations and contrast verified for all text, borders, tables, and Recharts charts.
- **Responsive Standard**: Tested from 320px mobile screens up to 1920px 2K displays; tables automatically adapt into mobile cards or scroll within isolated boundaries.
- **Accessibility**: Explicit `aria-label` tags on all icon buttons, full keyboard navigation with Enter-to-next mark inputs, and standard `role="dialog"` modal containers.
- **Reduced Motion**: Gracefully respects `prefers-reduced-motion` settings.

---

## 📄 License
This project is proprietary and built for tuition academies across Pakistan. All rights reserved.
