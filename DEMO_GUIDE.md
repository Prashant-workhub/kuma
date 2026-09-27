# KUMA (CAPACITY CONNECT) — SIH26075 DEMONSTRATION GUIDE

**System**: Kuma Digital Capacity Building & LMS Portal (SIH26075)  
**Target Organization**: Acme Digital Services  
**Evaluation Standard**: Smart India Hackathon 2026 Core Workflow  

---

## 1. DEMO OVERVIEW

Kuma (Capacity Connect) is an AI-powered Digital Capacity Building and Learning Management Portal built for SIH26075. It connects competency assessment, skill-gap identification, training recommendations, progress tracking, and digital certificate verification into one unified platform.

---

## 2. DEMO ACCOUNTS & MODES

You can demonstrate Kuma using either **Real Firebase Authentication** or **Local Session Mode**:

| Role | Email | Display Name | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@acme.com` | Dr. Rajesh Kumar | Organizational analytics, competency catalog, training & user management |
| **Trainer** | `trainer@acme.com` | Prof. Anita Sharma | Training content delivery, module assignment & doubt management |
| **Trainee** | `analyst@acme.com` | Demo Analyst | Profile setup, assessment, skill gap calculation, training & certification |

*Note: In local session mode, clicking **"Continue in Guest / Local Mode"** on the auth view enters the app instantly without requiring remote server credentials.*

---

## 3. STEP-BY-STEP SIH DEMONSTRATION SCRIPT

### STEP 1: Admin Organization & Catalog Management
1. Launch Kuma and sign in as **Admin / Faculty** (`admin@acme.com`).
2. Navigate to the **Faculty / Admin Portal**.
3. **Showcase**:
   - **Organization Header**: *Acme Digital Services*.
   - **Competency Catalog**: View competencies (*Data Analysis, Python, Communication, Leadership, Digital Literacy*).
   - **Training Programs**: Inspect available courses (*Advanced Data Analytics, Python for Data Professionals, Professional Communication*).

---

### STEP 2: Organizational Skill Gap Analytics
1. Click **Analytics / Learning Insights** in the top navigation.
2. **Showcase**:
   - **Total Trainees & Enrollments**.
   - **Competency Breakdown & Priority Skill Gaps** across departments (*Data & Analytics, Technology, Human Resources*).
   - **Training Coverage & Completion Telemetry**.

---

### STEP 3: Trainee Profile & Target Competency Selection
1. Switch user session and sign in as **Trainee** (`analyst@acme.com` / *Demo Analyst*).
2. Open **Professional Profile**.
3. **Showcase**:
   - Organization: *Acme Digital Services*, Department: *Data & Analytics*.
   - Current declared competencies and target proficiency levels (e.g. Target: *Advanced* for *Data Analysis*).

---

### STEP 4: Competency Assessment & Gap Calculation
1. Navigate to **Skill Gap Analysis**.
2. Click **Take Assessment** under *Data Analysis*.
3. Complete the interactive assessment module (e.g. Score 78%).
4. **Showcase**:
   - **Assessed Level**: *Intermediate* (Level 2).
   - **Target Level**: *Advanced* (Level 3).
   - **Calculated Skill Gap**: `1 Level` (`Priority: High`).

---

### STEP 5: AI & Rule-Based Training Recommendation
1. Scroll down to **Recommended Training Programs**.
2. **Showcase**:
   - Kuma automatically matches the calculated skill gap (`comp-data-analysis`) to the existing training catalog.
   - Recommended Course: **→ Advanced Data Analytics & Insights**.

---

### STEP 6: Training Enrollment & Progress Tracking
1. Click **Enroll Now** on the recommended training program.
2. Open **Training Progress Tracker**.
3. Complete the required training modules (Module 1, Module 2, Module 3).
4. **Showcase**:
   - Progress advances from `0%` → `50%` → `100%`.
   - Status updates automatically to **Completed**.

---

### STEP 7: Digital Certificate Generation & Verification
1. Click **View Certificate** upon training completion.
2. **Showcase**:
   - Digital Certificate issued with non-sequential ID format `KUMA-2026-XXXXXXXX`.
   - Download / Print options.
3. Open **Public Certificate Verification** page (`/verify-certificate`).
4. Enter the Certificate ID to verify cryptographic validity and public metadata.

---

### STEP 8: Live Admin Analytics Update
1. Return to the **Admin / Faculty Analytics Portal**.
2. **Showcase**:
   - Completion rate & total issued certificates increment live.
   - The resolved skill gap reflects dynamically in the organizational capacity radar chart.

---

## 4. DEMO DATA RESET

To re-seed or reset demo records to initial state:
- Open browser developer tools console and run:
  ```javascript
  import('./src/utils/demoDataSeeder.ts').then(m => m.resetDemoEnvironment());
  ```
- Or click **Reset Demo Data** in Settings -> System Utilities.
