# Kuma Capacity Connect (SIH26075 Prototype)

**Kuma Capacity Connect** is an AI-enhanced, competency-driven organizational capacity building platform designed for public sector and enterprise workforce development.

The platform continuously assesses employee skill gaps against organizational designation requirements, provides personalized course discovery and practice workflows, tracks live training progress, issues cryptographically signed (HMAC-SHA256) certificates, and provides platform administrators with organization-wide capacity analytics and user provisioning.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, Vanilla CSS Custom Properties (`src/index.css`), Lucide Icons.
- **Backend Server**: Node.js, Express 5, Firebase Admin SDK (`server/index.js`), running on port `10000` (or `PORT` env).
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth, GitHub OAuth, and Server-Minted Custom Tokens for Demo Mode).
- **Database & Security**: Cloud Firestore with role-based security rules (`firestore.rules`), custom claims for Admin access, and strict organization-level data isolation.
- **Cloud Storage**: Azure Blob Storage (`@azure/storage-blob`) via short-lived, authenticated SAS URLs for resource uploads (`POST /api/storage/upload-url`).
- **Offline Support**: IndexedDB database layer (`src/offline/`) with size-capped LRU resource caching (100MB limit), idempotent outbox operation queue with `clientOpId` deduplication, and a persistent connection status UI (`NetworkStatusIndicator`).
- **AI Integrations (Optional)**: Google Gemini API integration (`src/services/gemini.ts`) for automated note synthesis and quiz generation when an API key is provided.

---

## 📁 Repository Structure

```
.
├── server/
│   └── index.js                   # Express 5 REST API & Firebase Admin backend
├── scripts/
│   └── seedDemo.js                # Server-side Firebase Auth & Firestore demo seeder
├── src/
│   ├── admin/                     # Admin Portal (bulk import, summary, analytics)
│   ├── components/                # Core UI views (TraineeHome, LearnView, PracticeView, etc.)
│   ├── design-system/             # Theme tokens and Bauhaus primitives
│   ├── offline/                   # IndexedDB layer, outbox queue, and sync engine
│   ├── services/                  # Business logic (capacityConnect, azure, gemini, etc.)
│   ├── teacher-portal/            # Trainer Portal (course editor, module practice, doubts)
│   └── utils/                     # Utility helpers (trainerMatching, recommendationUtils, etc.)
├── firestore.rules                # Production Firestore security rules
├── firestore.indexes.json         # Firestore index declarations
├── DEMO_GUIDE.md                  # 5-10 minute evaluator demo walkthrough script
└── ARCHITECTURE.md                # System architecture, API catalog, and Mermaid data flows
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root:

```env
# Server Backend Port
PORT=10000

# Firebase Client Environment Variables
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Firebase Admin Service Credentials (for server/index.js and scripts/seedDemo.js)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Demo Mode Configuration
DEMO_MODE=true
DEMO_ADMIN_EMAIL="admin@acme.com"
DEMO_ADMIN_PASSWORD="YourSecureAdminPassword123!"
DEMO_TRAINER_EMAIL="trainer@acme.com"
DEMO_TRAINER_PASSWORD="YourSecureTrainerPassword123!"
DEMO_TRAINEE_EMAIL="trainee@acme.com"
DEMO_TRAINEE_PASSWORD="YourSecureTraineePassword123!"

# Azure Blob Storage (Optional, for course resource uploads)
AZURE_STORAGE_ACCOUNT_NAME="your-storage-account"
AZURE_STORAGE_ACCOUNT_KEY="your-storage-key"
AZURE_STORAGE_CONTAINER_NAME="course-resources"

# HMAC Certificate Signing Secret
CERTIFICATE_HMAC_SECRET="kuma-sih-2026-capacity-connect-secret-key"
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Seed the Demo Database

Run the server-side seed script using Node.js to populate Firebase Auth accounts (`admin@acme.com`, `trainer@acme.com`, `trainee@acme.com`), organization metadata, competencies, courses, and history:

```bash
node scripts/seedDemo.js
```

### 3. Start the Server Backend

```bash
npm run start
```

### 4. Start the Frontend Development Server

```bash
npm run dev
```

---

## 🧪 Testing & Build Verification

```bash
# Run unit tests (88 tests using Node test runner + fake-indexeddb)
npm test

# Type check TypeScript files
npm run lint

# Build production bundle (Vite)
npm run build
```

---

## 🔥 Deploying to Firebase

```bash
# Deploy Firestore security rules and index definitions
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 📊 Feature Matrix: Implemented vs. Optional Components

| Feature Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Competency Engine & Gap Analysis** | ✅ Fully Implemented | Calculated using numeric skill levels (1-4) vs designation requirements in `recommendationUtils.ts`. |
| **Trainer Matching Algorithm** | ✅ Fully Implemented | Multi-factor weighted match score computed in `trainerMatching.ts`. |
| **IndexedDB Offline Support** | ✅ Fully Implemented | Outbox queue, size-capped LRU resource cache, and max-progress merge in `src/offline/`. |
| **HMAC Certificate Verification** | ✅ Fully Implemented | HMAC-SHA256 signature generated and verified in `certificateUtils.ts`. |
| **Bulk User Provisioning** | ✅ Fully Implemented | Client CSV parser + `POST /api/admin/users/bulk` with password reset link generation. |
| **Azure Storage SAS Uploads** | ✅ Fully Implemented | Express backend SAS token generation via `@azure/storage-blob` in `server/index.js`. |
| **Gemini AI Integration** | 🟡 Optional BYOK | Requires Gemini API Key in Settings or env to enable note synthesis and quiz generation. |
| **Capacitor Mobile Shell** | 🟡 Webview Wrapper | Uses `@capacitor/core` webview container; native iOS/Android project bundles are optional additions. |
