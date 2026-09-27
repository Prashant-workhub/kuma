# KUMA (CAPACITY CONNECT) — DIGITAL CAPACITY BUILDING & LMS PORTAL

**SIH Problem Statement**: SIH26075 — CAPACITY CONNECT: A Digital Capacity Building and Learning Management Portal  
**Platform**: Kuma Capacity Connect  
**License**: Apache-2.0 / SIH2026 Submission  

---

## 1. PROJECT OVERVIEW

Kuma (Capacity Connect) is a unified Digital Capacity Building and Learning Management Portal designed to help organizations build workforce competencies, identify skill gaps, deliver targeted training programs, and monitor organizational capacity in real time.

---

## 2. PROBLEM & SOLUTION

### Problem Statement
Organizations struggle to track workforce competencies, measure skill deficiencies, recommend relevant training programs, and verify training completions at scale.

### Solution Overview
Kuma provides an end-to-end organizational capacity building platform that connects:
- **Competency Catalog & Framework**: 5-tier proficiency modeling (Novice, Beginner, Intermediate, Advanced, Expert).
- **Competency Assessments**: Interactive multi-question assessments with automated numeric scoring.
- **Skill Gap Identification**: Algorithmic gap calculation separating declared, assessed, and target levels.
- **Training Recommendation Engine**: Rule-based matching connecting skill gaps directly to relevant training programs.
- **Multimodal Knowledge Studio**: AI-assisted note generation, summaries, flashcards, and resource players.
- **Training Progress & Completion**: Module-by-module progress tracking and completion validation.
- **Digital Certification**: Cryptographically verifiable certificates with unique IDs (`KUMA-2026-XXXXXXXX`) and public lookup verification (`/verify-certificate`).
- **Organizational Capacity Analytics**: Real-time telemetry dashboards for executive administration.

---

## 3. USER ROLES & CAPABILITIES

### 1. Trainee (Scholar)
- Manage professional profile (Organization, Department, Designation).
- Declare current proficiency levels and set target competency goals.
- Take competency-based assessments and receive real-time scores.
- View calculated skill gaps and recommended training programs.
- Enroll in training programs, complete learning modules, and track progress.
- View, download, and share verified digital certificates.

### 2. Trainer (Instructor)
- Manage assigned training programs and learning resources.
- Monitor active trainee enrollments and module progress.
- Publish competency assessments and evaluate participant performance.
- Resolve trainee doubts and post course announcements.

### 3. Admin (Organization Manager)
- Manage organizational structure, departments, and user roles.
- Create and edit organizational competencies and proficiency criteria.
- Publish training programs and map courses to competencies.
- View executive capacity analytics, skill gap distributions, and training completion telemetry.
- Audit platform certificates and user records.

---

## 4. MAIN WORKFLOW

```text
Admin Setup           Trainer           Trainee Journey              System Logic           Certification & Analytics
-----------         -----------      ----------------------         --------------         --------------------------
Create Org     ---> Publish      ---> Create Profile          --->  Calculate Gap      ---> Issue Digital Certificate
Create Competencies Training          Select Target Levels          (Target - Assessed)      (Unique Verification ID)
Create Courses      Map to Comp      Take Assessment          --->  Recommend Course   ---> Refresh Admin Telemetry
```

---

## 5. TECHNOLOGY STACK

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS + Bauhaus styling tokens, Lucide icons.
- **Backend API**: Node.js, Express, TypeScript (`server.ts`).
- **Identity & Database**: Firebase Authentication (with Local Session fallback), Cloud Firestore.
- **Storage**: Azure Blob Storage / Local fallback for documents & media assets.
- **AI Integrations**: Gemini API (Multimodal transcript processing, automated notes, summary synthesis).
- **Mobile Packaging**: Capacitor for Android/iOS cross-platform deployment.

---

## 6. REPOSITORY STRUCTURE

```text
src/
├── components/          Trainee UI components (SkillGapView, ProfileView, CertificatesView, etc.)
├── components/faculty/  Trainer & Admin UI components (FacultyOnboarding, etc.)
├── teacher-portal/      Admin & Trainer Portal App (TeacherPortalApp, LearningAnalytics, etc.)
├── services/            Firebase services, AI Gemini integration, doubt management
├── utils/               Skill gap math, recommendation engine, certificate generation, demo seeder
├── hooks/               Firestore real-time data hooks (useNotes, useLectures)
├── types.ts             Unified TypeScript interfaces and data models
├── firebaseConfig.ts    Firebase setup with fallback project credentials & try-catch guards
server.ts                Express API server
DEMO_GUIDE.md            Official SIH evaluation demonstration manual & script
```

---

## 7. LOCAL SETUP & INSTALLATION

### Prerequisites
- Node.js 18+ (Node 22 recommended)
- `npm` package manager

### Installation Steps

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Prashant-workhub/kuma.git
   cd kuma
   npm install
   ```

2. Configure environment variables (optional for local testing; fallbacks are pre-configured):
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   - Frontend app: `http://localhost:5173`
   - Express backend: `http://localhost:3003`

---

## 8. DEMONSTRATION WORKFLOW

For SIH evaluation, Kuma includes a complete demo environment and seeder:
- **Demonstration Manual**: Refer to [`DEMO_GUIDE.md`](./DEMO_GUIDE.md) for the exact 8-step walkthrough script.
- **Demo Seeder**: `src/utils/demoDataSeeder.ts` initializes realistic records for *Acme Digital Services*.
- **Demo Accounts**:
  - Admin: `admin@acme.com`
  - Trainer: `trainer@acme.com`
  - Trainee: `analyst@acme.com`

---

## 9. VERIFICATION & BUILD

Run type checking and production bundling:

```bash
# TypeScript type check
npx tsc --noEmit

# Production Vite build
npm run build
```

---

## 10. LICENSE

Apache-2.0 License. Developed for Smart India Hackathon 2026 (SIH26075).
