# Kuma Capacity Connect: Intelligent Organizational Capacity Building Platform

## 🚀 Vision & Executive Overview
**Kuma Capacity Connect** (SIH26075 Prototype) is an AI-enhanced, competency-driven organizational capacity building platform designed for public sector and enterprise workforce development.

It bridges the gap between organizational designation requirements and individual employee skill baselines through continuous gap detection, explained trainer matching, adaptive course delivery, low-stakes module practice, and cryptographically verifiable HMAC-SHA256 certification.

---

## 💡 Key Challenges Addressed
- **Unidentified Skill Gaps:** Organizations lack real-time visibility into employee competency gaps against designation benchmarks.
- **Unaligned Training Assignments:** Course assignments are often generic rather than tailored to specific skill deficits.
- **Lack of Practice & Retention Tools:** Passive training completion lacks immediate, low-stakes feedback and spaced flashcard review.
- **Offline & Connectivity Constraints:** Field employees require uninterrupted access to course structures, resources, and progress tracking when offline.
- **Verification & Oversight:** Administrators require verifiable training certificates and live organizational capacity analytics.

---

## ✨ System Architecture & Key Capabilities

### 🎓 Trainee Workspace (Discover ➔ Learn ➔ Practice ➔ Assess ➔ Improve)
- **Trainee Home Dashboard (`TraineeHome`):** Immediate "What should I learn next?" guidance with resume CTAs and recommended courses.
- **Competency Gap Engine (`SkillGapView`):** Calculates skill level deltas (1–4) against organizational designation targets.
- **Explained Trainer Match (`DiscoverView`):** Multi-factor weighted match score computed via `trainerMatching.ts` based on competency alignment, domain expertise, and experience.
- **Unified Course Player (`LearnView`):** Supports video, PDF, slides, and markdown resource viewers with throttled progress tracking and private notes.
- **Low-Stakes Practice (`PracticeView`):** Non-scoring, retryable module practice questions and spaced flashcards.
- **Growth & Certification (`GrowthView` & `CertificatesView`):** Visualizes skill growth over time and issues HMAC-SHA256 cryptographically signed certificates with QR code verification.

### 👨‍🏫 Trainer Portal (`TeacherPortalApp`)
- **Course & Syllabus Management:** Create and publish courses with structured module resource references.
- **Module Practice Authoring:** Attach non-assessment practice questions and explanations to course modules.
- **Trainee Performance Monitoring:** Track live module completion rates, doubt queries, and assessment outcomes.

### 👑 Admin Portal (`AdminPortalApp`)
- **Organization & Requirement Config:** Manage organizations (`Acme Digital Services`), departments, designations, and required competencies.
- **Trainer Approvals & RBAC:** Approve trainer registrations and assign custom admin claims via Firebase Admin SDK.
- **Bulk User Provisioning:** Parse CSV spreadsheets and provision Auth users with password reset invitation links via `POST /api/admin/users/bulk`.
- **Capacity Analytics (`AdminAnalyticsView`):** Real-time department competency coverage, top skill gap urgency scores, and course completion funnels.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Vanilla CSS Custom Properties (`src/index.css`), Lucide Icons.
- **Backend API:** Node.js, Express 5 REST API (`server/index.js`), Firebase Admin SDK.
- **Database & Auth:** Firebase Authentication (Email/Password, OAuth, Custom Tokens), Cloud Firestore (`firestore.rules`).
- **Cloud Storage:** Azure Blob Storage (`@azure/storage-blob`) for SAS URL resource uploads (`POST /api/storage/upload-url`).
- **Offline Engine:** IndexedDB (`src/offline/`) with size-capped LRU resource caching (100MB cap), outbox operation queue with `clientOpId` deduplication, and persistent connection status UI.
- **Verification:** HMAC-SHA256 cryptographic certificate signature generation and public verification (`certificateUtils.ts`).

---

## 🔄 Core Capacity Building Loop

```
1. Admin Org Requirements ➔ 2. Baseline Gap Detection ➔ 3. Explained Trainer Match ➔
4. Course Player & Notes ➔ 5. Practice & Flashcards ➔ 6. Post-Training Assessment ➔
7. Competency Growth Update ➔ 8. HMAC Certificate Verification ➔ 9. Admin Capacity Analytics
```

---

## 🛡️ Security & Reliability
- **Custom Claim RBAC:** Administrative access is enforced exclusively by Firebase custom claims (`{ admin: true }`).
- **Idempotent Offline Sync:** Client operations use deterministic `clientOpId` UUIDs to ensure exact-once execution upon reconnect.
- **Cryptographic Verification:** Certificates feature HMAC-SHA256 signatures for tamper-proof validation.
- **Clean Fallbacks:** Offline actions gracefully queue outbox ops; restricted actions (Assessments, Certificate Issuance) display clear online guards.
