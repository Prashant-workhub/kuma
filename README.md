# KUMA (CAPACITY CONNECT) — DIGITAL CAPACITY BUILDING & LMS PORTAL

**SIH Problem Statement**: SIH26075 — CAPACITY CONNECT: A Digital Capacity Building and Learning Management Portal  
**Platform**: Kuma Capacity Connect  
**License**: Apache-2.0 / SIH2026 Submission  

---

## 1. PROJECT OVERVIEW

**Kuma (Capacity Connect)** is an enterprise-grade Digital Capacity Building and Learning Management Portal engineered for Smart India Hackathon (SIH26075). It empowers government bodies, public enterprises, and private organizations to continuously build workforce competencies, quantitatively identify skill gaps, deliver targeted training programs, issue cryptographically verifiable digital certificates, and monitor organizational capacity in real time.

---

## 2. KEY FEATURES & SIH26075 COMPLIANCE

| # | SIH26075 Requirement | Kuma Platform Solution |
| :-: | :--- | :--- |
| **1** | **Organizational Training Management** | Department & division taxonomy with catalog mapping in `CourseCatalogView.tsx` and `AdminPortalApp.tsx`. |
| **2** | **Competency Development** | 5-tier proficiency modeling (*Novice, Beginner, Intermediate, Advanced, Expert*) with target level tracking in `SkillGapView.tsx`. |
| **3** | **Knowledge Sharing & Resources** | Multimodal Knowledge Studio, AI note/summary synthesis, presentation workspace, and document players in `KnowledgeStudioView.tsx`. |
| **4** | **Centralized Web & Mobile Portal** | Responsive web app with Bauhaus aesthetic tokens, dark/light modes, and Capacitor Android mobile packaging. |
| **5** | **Training Program Management** | Multi-module course creation, assigned trainers, competency mapping, and active enrollment tracking in `TeacherPortalApp.tsx`. |
| **6** | **Competency Assessment** | Multi-question interactive assessment engine with automated scoring and level determination in `AssessmentTakingModal.tsx`. |
| **7** | **Skill-Gap Identification** | Algorithmic gap calculation separating declared, assessed, and target levels (`Gap = Target - Max(Declared, Assessed)`). |
| **8** | **Training Recommendations** | Deterministic gap-to-course recommendation engine matching gap competencies directly to training courses in `recommendationUtils.ts`. |
| **9** | **Training Progress & Completion** | Step-by-step module completion tracking, percentage progress calculation, and completion validation in `enrollmentUtils.ts`. |
| **10**| **Organizational Capacity Insights** | Real-time executive capacity analytics, competency radar distributions, skill gap urgency matrices, and certificate registers in `LearningAnalytics.tsx`. |

---

## 3. THREE-ROLE GOVERNANCE ARCHITECTURE

Kuma enforces strict role-based access control (RBAC) across three distinct organizational user types:

### 1. Trainee (Workforce Member / Scholar)
- **Professional Profile**: Department, designation, employee ID, and declared proficiency settings.
- **Skill Gap Radar**: Dynamic gap visualization based on declared vs. assessed vs. target competency levels.
- **Interactive Assessments**: Interactive quiz taking with immediate level qualification.
- **Course Enrollment**: Enroll in recommended or catalog training programs; complete modules step-by-step.
- **Digital Certificates**: View, download, print, and share verifiable cryptographic certificates (`/verify/certificate/:id`).

### 2. Trainer (Instructor / Subject Matter Expert)
- **Course Management**: Manage assigned training programs, upload lecture resources, and structure course modules.
- **Trainee Roster**: Track enrolled trainee progress and completion milestones across modules.
- **Doubt Resolution**: Queue and respond to student inquiries and doubt submissions in real time.
- **Assessment Publishing**: Configure assessment questions, score weights, and competency target thresholds.

### 3. Admin (Organization Executive / Admin Panel)
- **Executive Telemetry**: High-level organizational capacity analytics, competency coverage, and skill gap urgency.
- **Bulk Trainee Import**: Interactive CSV import engine for batch-enrolling organizational cohorts (`/admin/bulk-import`).
- **Competency Catalog**: Define 5-level proficiency scales, core skills, and skill taxonomy.
- **Course & Competency Mapping**: Link training courses directly to required organizational competencies.
- **Certificate Register**: Audit and verify issued digital certificates across the organization.

---

## 4. END-TO-END WORKFLOW

```text
               ┌─────────────────────────────────────────────────────────┐
               │              KUMA CAPACITY CONNECT PORTAL               │
               └────────────────────────────┬────────────────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │                                  │                                  │
         ▼                                  ▼                                  ▼
   TRAINEE PORTAL                     TRAINER PORTAL                      ADMIN PORTAL
   --------------                     --------------                      ------------
   ✓ Declare Target Levels            ✓ Manage Course Programs            ✓ Executive Capacity Telemetry
   ✓ Take Skill Assessment            ✓ Monitor Trainee Progress          ✓ Bulk CSV Cohort Import
   ✓ View Skill Gap Calculation       ✓ Publish Assessments               ✓ Manage Competency Taxonomy
   ✓ Enroll in Recommended Course     ✓ Answer Trainee Doubts             ✓ Map Courses to Competencies
   ✓ Complete Modules (0-100%)        ✓ Resource Upload & Delivery        ✓ Audit Certificate Register
   ✓ Claim Verifiable Certificate                                         ✓ Security & User RBAC Guards
```

---

## 5. TECHNOLOGY STACK

- **Frontend Core**: React 19, TypeScript, Vite, Vanilla CSS + Kuma Bauhaus UI System.
- **Backend API**: Node.js, Express, TypeScript (`server.ts`).
- **Authentication & Database**: Firebase Auth (with Local Session fallback for demo resiliency) & Cloud Firestore.
- **AI Engines**: Gemini API (multimodal document processing, flashcard synthesis, lecture summarization).
- **Mobile Packaging**: Capacitor framework for Android & iOS builds.

---

## 6. REPOSITORY STRUCTURE

```text
kuma/
├── src/
│   ├── admin/               Dedicated Admin Portal (`AdminPortalApp.tsx`) & CSV Import Engine
│   ├── components/          Trainee UI Views (`SkillGapView`, `ProfileView`, `CertificatesView`, etc.)
│   ├── components/faculty/  Trainer Portal & Instructor Onboarding
│   ├── teacher-portal/      Trainer & Organization Admin dashboards & `LearningAnalytics.tsx`
│   ├── services/            Firebase Auth/Firestore, AI Gemini synthesis, Notifications
│   ├── utils/               Skill gap math, recommendation logic, certificate generator, demo seeder
│   ├── types.ts             Unified TypeScript interfaces (Trainee, Trainer, Admin, Competency, Course)
│   ├── routes.ts            Client route registry with administrative security guards
│   └── App.tsx              Main layout, route dispatcher, and local session manager
├── server.ts                Express API backend server
├── DEMO_GUIDE.md            Official SIH Evaluation Demonstration Manual & Walkthrough Script
└── README.md                Project documentation
```

---

## 7. QUICK START & LOCAL DEVELOPMENT

### Prerequisites
- Node.js 18+ (Node.js 20 or 22 recommended)
- `npm` package manager

### Installation

1. **Clone Repository & Install Dependencies**:
   ```bash
   git clone https://github.com/Prashant-workhub/kuma.git
   cd kuma
   npm install
   ```

2. **Environment Configuration** *(Optional — safe local defaults are pre-configured)*:
   ```bash
   cp .env.example .env
   ```

3. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - **Web Application**: `http://localhost:5173`
   - **Express Server**: `http://localhost:3003`

---

## 8. DEMONSTRATION & SIH EVALUATION GUIDE

Kuma includes an automated demo environment and seeder designed for SIH judges and evaluators:
- **Demonstration Manual**: Refer to [`DEMO_GUIDE.md`](./DEMO_GUIDE.md) for the 8-step evaluation script.
- **Demo Data Seeder**: `src/utils/demoDataSeeder.ts` populates sample records for *"Acme Digital Services"*.
- **Pre-Configured Demo Accounts**:
  - **Admin Portal**: `admin@acme.com` (Access to `/admin/dashboard` & `/admin/bulk-import`)
  - **Trainer Portal**: `trainer@acme.com` (Access to Trainer Dashboard & Course Manager)
  - **Trainee Portal**: `analyst@acme.com` (Access to Trainee Dashboard, Skill Gap & Recommendations)

---

## 9. BUILD & QUALITY VERIFICATION

Ensure zero TypeScript errors and verify production Vite compilation:

```bash
# Run TypeScript Type Checker
npx tsc --noEmit

# Execute Production Bundle Build
npm run build
```

---

## 10. LICENSE

Apache-2.0 License. Developed for Smart India Hackathon 2026 (SIH26075).
