# Kuma UI Audit & Design Token Migration Plan

This audit inventories all visual styling elements, duplicate primitives, screen structures, theming mechanisms, and decorative artifacts across `src/` to serve as the migration checklist for enterprise normalization.

---

## 1. Color Inventory & Near-Duplicates

### Raw Hex / RGB / HSL Values (53 occurrences across 30 files)
- **Canvas / Background Near-Duplicates (Near-black & Charcoal)**:
  - `#050814` (10 instances) — Primary dark canvas
  - `#0c1220` (15 instances) — Surface card background
  - `#10182a` (7 instances) — Elevated panel background
  - `#0d0f17`, `#141827`, `#1e2233`, `#12121a`, `#1a1329`, `#161622`, `#0e0e17`, `#14141f` (15 instances) — Fragmented dark shades across feature code
- **Green / Accent Near-Duplicates**:
  - `#1d2a20`, `#233326`, `#162019`, `#1f2e23`, `#667869` (27 instances) — Custom dark emerald variants in handwritten notes and analytics
- **Other Loose Hex Colors**:
  - `#fb7185` (1), `#ffb300` (1), `#ffd54f` (legacy CSS selector target)

### Tailwind Palette Classes (239 distinct utility classes)
- **Slate / Dark Palette (585 instances)**:
  - `bg-slate-50` (82), `bg-slate-100` (16), `bg-slate-800` (23), `bg-slate-900` (6), `bg-slate-950` (9)
  - `text-slate-400` (152), `text-slate-900` (132), `text-slate-500` (71), `text-slate-300` (57), `text-slate-700` (47), `text-slate-600` (22), `text-slate-100` (21)
  - `border-slate-800` (146), `border-slate-200` (110), `border-slate-100` (33), `border-slate-700` (25)
- **Purple / Indigo Palette (246 instances)**:
  - `bg-purple-950` (42), `bg-purple-50` (30), `bg-purple-100` (20), `bg-purple-500` (19)
  - `text-purple-300` (65), `text-purple-400` (34), `text-purple-600` (22), `text-purple-500` (12)
  - `border-purple-500` (25), `border-purple-800` (24), `border-purple-200` (23), `border-purple-100` (14)
- **Amber / Yellow Palette (178 instances)**:
  - `bg-amber-500` (36), `bg-amber-400` (9), `bg-amber-950` (5), `bg-amber-50` (3)
  - `text-amber-500` (27), `text-amber-400` (21), `text-amber-300` (13), `text-amber-600` (13)
  - `border-amber-500` (18), `border-amber-300` (8), `border-amber-400` (7)
- **Rose / Red Palette (202 instances)**:
  - `bg-red-500` (31), `bg-rose-500` (29), `bg-red-950` (7), `bg-rose-950` (5)
  - `text-rose-500` (40), `text-red-500` (36), `text-red-400` (15), `text-red-600` (14), `text-rose-400` (10)
  - `border-rose-500` (20), `border-red-500` (22), `border-rose-800` (3)
- **Emerald Palette (150 instances)**:
  - `bg-emerald-500` (33), `bg-emerald-950` (14), `bg-emerald-600` (9), `bg-emerald-50` (7)
  - `text-emerald-500` (31), `text-emerald-400` (17), `text-emerald-600` (14), `text-emerald-300` (11)
  - `border-emerald-500` (17), `border-emerald-800` (8), `border-emerald-300` (8)

---

## 2. Typography Inventory

### Font Families
- `Inter`, `system-ui`, `-apple-system`, `sans-serif` (Default body text set in `src/index.css`)
- `Space Grotesk`, `system-ui`, `sans-serif` (Headings scale set in `src/index.css`)
- Custom inline/font overrides: `font-serif`, `font-mono` (in handwritten/academic notes viewer)

### Font Sizes & Frequencies
- `text-xs`: 1071 instances
- `text-sm`: 272 instances
- `text-base`: 59 instances
- `text-lg`: 72 instances
- `text-xl`: 36 instances
- `text-2xl`: 77 instances
- `text-3xl`: 29 instances
- `text-4xl`: 9 instances
- `text-5xl`: 1 instance

### Font Weights & Frequencies
- `font-bold`: 787 instances
- `font-extrabold`: 299 instances
- `font-medium`: 248 instances
- `font-semibold`: 229 instances
- `font-black`: 178 instances
- `font-normal`: 10 instances

---

## 3. Radii, Shadows, Spacing & Arbitrary Values

### Border Radii Breakdown
- `rounded-full`: 274 instances
- `rounded-xl`: 206 instances
- `rounded-lg`: 83 instances
- `rounded-md`: 68 instances
- `rounded-2xl`: 68 instances
- `rounded-sm`: 2 instances
- `rounded-3xl`: 1 instance

### Shadows Breakdown
- `shadow-sm`: 74 instances
- `shadow-md`: 18 instances
- `shadow-2xl`: 18 instances
- `shadow-lg`: 13 instances
- `shadow-xl`: 7 instances
- `shadow-inner`: 5 instances
- `shadow-none`: 5 instances

### Arbitrary Tailwind Values & Inline Styles
- **Arbitrary TW Classes**: 4,948 instances across layout width/height (`w-[320px]`), opacity (`bg-purple-500/10`), grid coordinates (`grid-cols-[280px_1fr]`), and z-indices.
- **Inline Styles**: 53 occurrences across 30 files (e.g. video position, canvas overlays, and dynamic chart height overrides).

---

## 4. Duplicate & Near-Duplicate Components

| Component Type | Duplicate Implementations Found | File Paths |
|---|---|---|
| **Buttons** | 3 separate primitives | `src/components/ui/index.ts`, `src/teacher-portal/components/ui/Button.tsx`, `src/components/bauhaus/Button.tsx` |
| **Inputs** | 3 separate primitives | `src/components/ui/Input.tsx`, `src/teacher-portal/components/ui/SearchInput.tsx`, `src/components/bauhaus/Input.tsx` |
| **Cards / Panels** | 4 separate card components | `src/components/ui/index.ts`, `src/teacher-portal/components/ui/Card.tsx`, `src/teacher-portal/components/ui/KpiCard.tsx`, `src/components/bauhaus/Card.tsx` |
| **Modals / Dialogs** | 4 modal variations | `src/teacher-portal/components/ui/Modal.tsx`, `src/components/bauhaus/Modal.tsx`, `src/components/AssessmentTakingModal.tsx`, `src/components/PracticeModal.tsx` |
| **Badges / Status Pills**| 4 badge primitives | `src/components/ui/Badge.tsx`, `src/teacher-portal/components/ui/Badge.tsx`, `src/teacher-portal/components/ui/Chip.tsx`, `src/components/bauhaus/StatusPill.tsx` |
| **Empty States** | 3 empty state definitions | `src/components/ui/index.ts`, `src/teacher-portal/components/ui/EmptyState.tsx`, `src/components/bauhaus/EmptyState.tsx` |

---

## 5. Top-Level Screens per Role & Shell Layouts

### Auth Role
- **Login / Landing**: `src/components/AuthView.tsx`, `src/teacher-portal/components/auth/LoginScreen.tsx`
- **Onboarding**: `src/components/OnboardingView.tsx`, `src/components/TraineeRegistrationView.tsx`
- **Shell**: Standalone full-viewport canvas

### Trainee Role
- **Home / Dashboard**: `src/components/TraineeHome.tsx`, `src/components/DashboardView.tsx`
- **Course Library**: `src/components/LibraryView.tsx`
- **Skill Gap & Assessment**: `src/components/SkillGapView.tsx`, `src/components/AssessmentTakingModal.tsx`
- **Practice & Flashcards**: `src/components/PracticeModal.tsx`
- **Certificates & Verification**: `src/components/CertificatesView.tsx`, `src/components/CertificateVerificationView.tsx`
- **Notifications & Settings**: `src/components/NotificationsView.tsx`, `src/components/SettingsView.tsx`
- **Shell**: `src/design-system/PortalShell.tsx` (Top navigation header + retractable sidebar)

### Trainer Role
- **Overview Dashboard**: `src/teacher-portal/views/OverviewDashboard.tsx`
- **My Courses & Progress**: `src/teacher-portal/views/MyCourses.tsx`, `src/teacher-portal/views/CourseProgress.tsx`
- **Trainees & Doubts**: `src/teacher-portal/views/MyTraineesView.tsx`, `src/teacher-portal/views/StudentDoubtsManager.tsx`
- **Analytics & Insights**: `src/teacher-portal/views/LearningAnalytics.tsx`, `src/teacher-portal/views/LectureInsights.tsx`
- **Shell**: `src/teacher-portal/components/layout/PortalLayout.tsx` (Sidebar navigation + TopBar)

### Admin Role
- **User Approvals**: `src/admin/UserApprovalsManager.tsx`
- **Organization Analytics**: `src/admin/AdminAnalyticsView.tsx`
- **Shell**: `src/admin/AdminPortalApp.tsx` (Dedicated admin navigation bar)

---

## 6. Current Theming Mechanism

- **Theme State Owner**: `src/theme/theme.tsx` provides `ThemeProvider` and `useTheme()`.
- **Persistence**: Writes key `kuma.theme` (and legacy `kuma_theme`) to `localStorage`.
- **DOM Application**: `applyTheme()` toggles class `.dark` and sets `data-theme="light"|"dark"` on `document.documentElement` and `document.body`.
- **CSS Definitions**: `src/index.css` defines color schemes and CSS variables for `[data-theme="dark"]` and `[data-theme="light"]`.

---

## 7. Decorative Elements & Copy Violations Inventory

### Emoji Matches (115 total in 22 UI files)
- 🔥 (11), 🎯 (11), ⚠ (9), 📝 (7), 🧠 (6), 💡 (5), 🔍 (5), 📊 (3), ⚡ (2), 🎓 (2), ✨ (2), 🔒 (2), 🛑 (2), 🔑 (2), 🚀 (1), 🌟 (1), 👍 (1), 🧹 (1), 👑 (1)
- **Key offending files**: `src/components/AuthView.tsx`, `src/components/TraineeHome.tsx`, `src/admin/AdminPortalApp.tsx`, `src/teacher-portal/views/StudentDoubtsManager.tsx`

### Gradients & Blur/Glow Effects
- **Gradient Backgrounds / Text**: 14 files containing `bg-gradient-to-*`, `from-purple-500`, `to-indigo-600`, `bg-clip-text`.
- **Glow & Glassmorphism Blur**: 25 files containing `backdrop-blur-md`, `shadow-[0_0_20px_...]`, `glow-effect`.

---

## 8. Summary of Top Offenders

1. **Colors**: 239 distinct Tailwind palette classes and 53 raw hex codes creating mismatched background surfaces (`bg-slate-900` vs `bg-slate-950` vs `#0c1220`).
2. **Typography**: Heavy over-use of `font-bold` (787) and `font-extrabold` (299) alongside arbitrary `text-xs` (1071) creates high visual clutter.
3. **Duplicate Primitives**: 3 distinct Button components, 3 Input components, 4 Card components, and 4 Badge components scattered across `src/components/ui`, `src/teacher-portal`, and `src/components/bauhaus`.
4. **Decorative Effects**: 115 emojis, 14 gradient text/background files, and 25 glassmorphism/blur cards violating enterprise design guidelines.
