# Project Kuma — SIH 2026 Judge Demonstration Guide
**Problem Statement:** SIH26075 — *“CAPACITY CONNECT: A Digital Capacity Building and Learning Management Portal”*

---

## 1. Quick Start & Setup

### Launch local development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 1-Click SIH Demo Data Initialization
On the login screen, click the **`⚡ Reset/Seed Demo`** button inside the **SIH 2026 JUDGE DEMO SELECTOR** card. This populates realistic organization hierarchy, designation competency baselines, trainee profiles, training programs, and assessment evaluations.

---

## 2. SIH Judge Quick Demo Accounts

| Role | Quick Button | Account Email | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `👑 Admin Login` | `admin@capacityconnect.in` | Org setup, department/designation requirements, and capacity analytics. |
| **Trainer** | `👨‍🏫 Trainer Login` | `alex.rivera@capacityconnect.in` | Course administration and trainee monitoring. |
| **Primary Judge Trainee** | `🎓 Primary Judge Demo Trainee` | `aarav.sharma@capacityconnect.in` | **Primary 10-step end-to-end judge demonstration.** |
| **Trainee A (Significant Gaps)** | Quick Switcher | `priya.patel@capacityconnect.in` | Shows multiple critical gaps (React, JS, Node). |
| **Trainee B (Moderate Gaps)** | Quick Switcher | `rohan.verma@capacityconnect.in` | Shows moderate single gap (Git). |
| **Trainee C (Meets Targets)** | Quick Switcher | `neha.gupta@capacityconnect.in` | Shows resolved gaps & verified certificate. |

---

## 3. Step-by-Step Judge Demonstration Flow (10-Step Story)

### Step 1: Login & Organization Governance (Admin)
1. On the login screen, click **`👑 Admin Login`**.
2. Navigate to **Organization & Departments** tab (`/admin-organization`).
3. Observe the three organization departments:
   - **Engineering**
   - **Data & Analytics**
   - **Human Resources**

### Step 2: Designation Competency Requirements (Admin)
1. Under **Engineering**, locate the **Software Developer** designation.
2. Click **View / Edit Required Competencies**.
3. Observe the configured organizational baseline benchmarks:
   - **React:** Required Level = `Advanced (3)` (High Priority)
   - **JavaScript:** Required Level = `Advanced (3)` (High Priority)
   - **Node.js:** Required Level = `Intermediate (2)` (Medium Priority)
   - **Git & Version Control:** Required Level = `Intermediate (2)` (Medium Priority)

### Step 3: Switch to Trainee Workspace
1. Sign out or click **`🎓 Primary Judge Demo Trainee (Aarav)`** on the login page.

### Step 4: Trainee Profile & Designation View (Trainee)
1. Navigate to **My Profile** or **Skill Gaps** (`/skill-gaps`).
2. Observe Aarav Sharma's assigned role:
   - **Department:** `Engineering`
   - **Designation:** `Software Developer`

### Step 5: Automated Skill Gap Engine (Trainee)
1. In the **Skill Gap Matrix**, observe the automated calculation comparing Required vs Current proficiency levels:
   - **React:** Required Level 3 (`Advanced`) vs Current Level 2 (`Intermediate`) $\rightarrow$ **Skill Gap: 1 (High Priority)**
   - **Node.js:** Required Level 2 vs Current Level 1 $\rightarrow$ **Skill Gap: 1**
   - **Git & Version Control:** Required Level 2 vs Current Level 1 $\rightarrow$ **Skill Gap: 1**
   - **JavaScript:** Required Level 3 vs Assessed Level 3 $\rightarrow$ **Skill Gap: 0 (Target Met)**

### Step 6: Training Recommendations Engine (Trainee)
1. Scroll down to **Recommended Training Programs**.
2. Notice that the platform dynamically recommends **`Advanced React Development`** to address the detected React gap.
3. Observe the data-driven match explanation: *"Directly targets your gap in React (Target: Level 3)"*.

### Step 7: Training Enrollment & Progress (Trainee)
1. Click **`Enroll in Training`** on **Advanced React Development**.
2. The lifecycle modal opens. Click **`Start Training`**.
3. Check off all module lessons to complete the syllabus (Progress increases to **100%**).

### Step 8: Competency Assessment Execution (Trainee)
1. Click **`Take Assessment`** to launch **React Advanced Competency Evaluation**.
2. Answer the 5 multiple-choice questions ($\ge 70\%$ required to pass).
3. Click **`Submit Assessment`**.

### Step 9: Automated Competency Update, Gap Resolution & Certificate (Trainee)
1. Upon passing ($\ge 70\%$), observe the immediate automated updates:
   - **Assessed React Proficiency** updates from `Intermediate (2)` to **`Advanced (3)`**.
   - **Skill Gap for React** recalculates from `1` to **`0 (Meets Target)`**.
   - **Training Status** updates to `Completed`.
   - **Certificate Issued:** A verified certificate with unique ID (e.g. `KUMA-2026-REACT-001`) becomes downloadable under **My Certificates**.

### Step 10: Organizational Capacity Analytics (Admin)
1. Log back in as **Admin**.
2. Open **Admin Analytics** (`/admin-analytics`).
3. Filter by **Department: Engineering**.
4. Observe that the org-wide analytics reflect:
   - Total Resolved Skill Gaps (+1)
   - Verified Certificates Issued (+1)
   - Updated competency coverage across the Software Developer designation.

---

## 4. Reset & Reseed Instructions

To reset the demo back to its clean initial state for another judge evaluation:
1. Open the login page (`/auth`).
2. Click **`⚡ Reset/Seed Demo`** in the top selector card.
3. A confirmation toast will confirm that demo data is refreshed to the initial clean state. Production records remain safe and untouched.
