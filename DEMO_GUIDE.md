# Kuma Capacity Connect — Evaluation Demo Guide & Walkthrough

This document provides a **5-10 minute step-by-step evaluator demo script** for testing the complete end-to-end organizational capacity building workflow in **Kuma Capacity Connect**.

---

## Evaluation Walkthrough Summary (5–10 Minutes)

```
Admin defines requirements ➔ Trainer approved ➔ Trainee profile & gap detection ➔ Explained trainer match ➔ Enroll & learn ➔ Practice ➔ Post-training assessment ➔ Gap reduction & growth ➔ Certificate HMAC verification ➔ Admin capacity analytics
```

---

## Step-by-Step Evaluation Script

### Step 1: Login & Admin Capacity Setup (1 Minute)
1. On the login page (`AuthView`), locate the **Evaluator access** panel and click **Admin**.
2. **Action**: The login flow signs in as the demo admin (`admin@acme.com`).
3. **Expected Result**: You land in the **Admin Portal** (`AdminPortalApp`).
4. Inspect **Organization & Competencies**: Organization `Acme Digital Services`, Departments (`Engineering & AI`, `Data Science & Analytics`), and Designations with required competencies (`Senior Software Engineer`: `comp-python` L3, `comp-react` L3).

### Step 2: Trainer Approval Workflow (1 Minute)
1. In the Admin Portal sidebar navigation, click **Users & Approvals**.
2. **Action**: Click **Approve** on pending trainer registrations (e.g., `Dr. Alex Rivera`).
3. **Expected Result**: User approval status transitions to `Approved`, and a trainer discovery profile is published to `trainerProfiles/`.

### Step 3: Trainee Sign-In & Initial Skill Gap Detection (1 Minute)
1. Log out using the user account menu and select **Evaluator access: Trainee** on the login page.
2. **Expected Result**: Lands in the **Trainee Home** (`DashboardView`).
3. View the **Skills & Gaps** summary card.
4. **Expected Result**: Visualizes current declared level (`React` Level 1, `Python` Level 2) vs designation requirement (`Senior Software Engineer` Target Level 3). Urgent gaps are highlighted: **Gap Delta = 2 Levels** for React.

### Step 4: Explained Trainer Match & Course Discovery (1 Minute)
1. Navigate to **Discover Courses** (`FindTrainerDiscoveryView`).
2. Filter or select the published course: **Advanced Web Architecture & Data Engineering**.
3. Inspect the **Trainer Card** (`Dr. Alex Rivera`).
4. **Expected Result**: Displays the explained weighted match score computed by `trainerMatching.ts` (e.g. **94% Match Score** based on competency alignment, domain specialization, and teaching experience).

### Step 5: Course Player — "Learn" Step (1.5 Minutes)
1. Click **Enroll in course** (duplicate-safe enrollment creation in `trainingEnrollments`).
2. Enter the **Course Workspace**.
3. **Action**:
   - Play video module (`1. Modular React Architecture`) — watched percentage updates in real-time.
   - Type a private note in the **Private notes** tab (*"React hooks simplify custom state encapsulation"*).
4. **Expected Result**: Note autosaves with timestamp. Click **Mark complete** to mark module 1 complete.

### Step 6: Low-Stakes Practice & Flashcard Step (1 Minute)
1. Click **Practice module** (`PracticeModal`).
2. **Action**: Answer practice question (instant right/wrong feedback with explanation) and flip flashcards using <kbd>Space</kbd> or <kbd>Arrow</kbd> keys.
3. **Expected Result**: Low-stakes practice results update immediately without modifying formal competency levels.

### Step 7: Post-Training Assessment & Score Summary (1 Minute)
1. Complete module 2 (`2. Enterprise Python APIs`).
2. Click **Start course assessment** (`AssessmentTakingModal`).
3. Answer assessment questions and click **Submit assessment**.
4. **Expected Result**: Post-assessment result screen displays score (e.g. **85% - Passed**), per-question review, and the **Competency Change Card**:
   - `React Development`: **Level 1 → Level 3 (+2 Levels)**.
   - `Python Programming`: **Level 2 → Level 3 (+1 Level)**.

### Step 8: Growth Timeline & Certificate Cryptographic Verification (1 Minute)
1. Navigate to **Certificates** (`CertificatesView`).
2. **Expected Result**: Shows issued verifiable credentials.
3. Click **Verify certificate** (`CertificateVerificationView`).
4. **Expected Result**: Displays cryptographic HMAC-SHA256 signature verification status (**Valid - Issued by Acme Digital Services**).

### Step 9: Admin Capacity Analytics & Bulk User Import (1 Minute)
1. Switch back to **Evaluator access: Admin**.
2. Navigate to **Overview** and **Users & Approvals** in the Admin Portal.
3. **Expected Result**: Live organization competency coverage metrics update dynamically based on the completed trainee training.
4. Click **Bulk import users**: Upload sample CSV or click **Validate preview**.
5. **Expected Result**: Validates row entries and outputs an import summary report.

---

## Offline Network Fallback Testing

1. In DevTools, set Network to **Offline** (or disconnect Wi-Fi).
2. Complete a module and save a private note in the Course Player.
3. **Expected Result**: The persistent indicator shows **Offline · 1 change to sync**. Operations are safely queued in the IndexedDB `outbox`.
4. Restricted actions (Assessments, Certificate Issuance) display clear online guards: *"Assessments require an active internet connection to start and submit for security verification."*
5. Toggle Network back to **Online**.
6. **Expected Result**: The outbox automatically flushes, changes sync idempotently to Firestore with `clientOpId` deduplication, and status returns to **Online**.
