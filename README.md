# NoteIT AI

NoteIT AI is an academic learning workspace that turns lectures, documents, website links, and YouTube resources into study material. Students can capture resources, generate notes and quizzes, practise concepts, track learning progress, and ask faculty doubts. A separate faculty workspace supports teaching-focused views of doubts, courses, and analytics.

> NoteIT uses BYOK (bring your own key). A user-provided AI key is sent only in an authenticated setup request, encrypted with AES-256-GCM on the backend, and saved in that user's server-side vault. It is not persisted in browser storage.

## Feature overview

### Student workspace

| Feature | What it does | How it works |
| --- | --- | --- |
| Authentication and onboarding | Creates a student workspace and profile | Firebase Authentication identifies the user; Firestore stores profile and workspace data. |
| AI provider vault | Lets a student choose and validate a provider/model | The Express API validates the key, encrypts it server-side, then uses it only for that user's future AI requests. |
| Lecture Capture | Records or imports lecture material | Browser capture/upload produces audio or source data, then the backend handles authenticated processing. |
| Resource import | Imports PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, websites, and YouTube links | The API extracts usable text and stores/source-links it for study workflows. |
| Lecture Processing | Converts raw material into learning resources | The selected AI provider processes transcript/source context into structured outputs. |
| Academic Library | Organizes notes, sources, lectures, folders, and subjects | User-owned data is stored under Firebase/Firestore collections. |
| Knowledge Studio | Works with a selected learning source in one workspace | Students can generate and review notes, summaries, flashcards, quizzes, mind-map content, and related source assets. |
| Research Hub | Supports source-grounded academic exploration | Imported text/source context is used to support study and research interactions. |
| Quiz and preparation modes | Provides practice activities and focused revision | AI-generated questions and local/user learning data drive practice flows. |
| Weak-topic and progress tools | Highlights areas needing revision | Quiz/learning telemetry is used for targeted practice and dashboard displays. |
| Streaks, XP, rewards, weekend challenges | Encourages consistent study habits | Daily activity, rewards, and challenge state are synchronized where possible and cached for resilience. |
| Notifications | Supports browser push and in-app notification flows | Firebase Cloud Messaging can register devices and the backend can send scheduled/test pushes. |
| Bhai Lang | Explains selected material in student-friendly Hinglish | An authenticated AI request generates a simpler contextual explanation. |
| Ask Doubt | Lets a student submit a doubt tied to a topic or lecture | Doubts are stored in Firestore and surfaced to faculty. |

### Faculty workspace

Faculty users have dedicated screens for overview dashboards, courses, course progress, quiz performance, learning/lecture insights, announcements, activity, profile settings, and student doubts.

Several analytics/course views currently use packaged demo data. Present those as prototype analytics until they are connected to a live institutional source.

## How the main workflow works

```text
Sign in -> Complete profile -> Select provider and validate key
        -> Import/record lecture or add a source
        -> Extract transcript/text
        -> Generate notes, summaries, flashcards, quizzes, or mind maps
        -> Save/review in Library and Knowledge Studio
        -> Practise, track progress, ask doubts, and earn streak rewards
```

The browser sends a Firebase ID token with protected requests. The Express API verifies it, reads only that user's encrypted provider credential when needed, calls the configured provider, and returns the generated result. User notes, lectures, settings, and related data are stored in Firebase/Firestore; Azure Blob Storage is optional durable file storage.

## Architecture

```text
React + Vite frontend
        | Firebase ID token
        v
Express API (server.ts) ---> AI providers (Gemini, OpenAI, Groq, Claude, ...)
        |                         |
        +--> Firebase Admin / Firestore
        +--> Azure Blob Storage (optional)
        +--> Firebase Cloud Messaging (optional)

Firebase Auth + Firestore <----> React app
```

## Technology stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide
- Backend: Node.js, Express, TypeScript/TSX
- Identity/data: Firebase Authentication, Firestore, Firebase Cloud Messaging
- Storage: Azure Blob Storage with a local development fallback
- Parsers: PDF, DOCX, PPTX, XLSX/CSV, text, web articles, and YouTube transcript tools
- AI integrations: Gemini, OpenAI, Groq, Anthropic/Claude, OpenRouter, DeepSeek, Mistral, xAI/Grok, NVIDIA NIM, and Notion where configured

## Repository layout

```text
src/components/          Student UI
src/components/faculty/  Faculty UI
src/teacher-portal/      Faculty portal and demo-data views
src/services/            AI, storage, notifications, streaks, doubts, sharing
src/providers/           AI provider clients and validation adapters
src/hooks/               Firestore-backed client hooks
src/middleware/          Firebase token authentication
src/server/              Server-only helper services
server.ts                Express API and routes
firestore.rules          Firestore access rules
render.yaml              Render API + web deployment blueprint
vercel.json              Static frontend deployment configuration
```

## Local setup

### Prerequisites

- Node.js 18+ (Node 22 recommended)
- Firebase project with Authentication and Firestore enabled
- A supported AI-provider key for AI generation

### Install

```bash
npm install
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env`.

### Core environment variables

| Variable | Location | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend only | Optional server-owned Gemini fallback key. |
| `ENCRYPTION_SECRET` | Backend only | Unique production secret for encrypting user BYOK credentials. |
| `FIREBASE_PROJECT_ID` | Backend | Firebase Admin project ID. |
| `FIREBASE_CLIENT_EMAIL` | Backend | Firebase Admin service-account email. |
| `FIREBASE_PRIVATE_KEY` | Backend | Firebase Admin service-account private key. |
| `VITE_FIREBASE_*` | Frontend | Firebase web-app configuration. |
| `VITE_API_URL` | Frontend | Public URL of the Express API, such as `https://your-api.onrender.com`. |
| `VITE_FIREBASE_VAPID_KEY` | Frontend, optional | Web-push public key. |
| `AZURE_STORAGE_*` | Backend, optional | Azure Blob Storage configuration. |
| `ADMIN_API_SECRET` | Backend, optional | Additional protection for admin/debug endpoints. |
| `AI_DAILY_LIMIT_PER_USER` | Backend, optional | Maximum authenticated AI operations per user per day; defaults to `20`. |
| `AI_REQUESTS_PER_MINUTE` | Backend, optional | Per-user burst limit; defaults to `4`. |
| `AI_MAX_OUTPUT_TOKENS` | Backend, optional | Gemini response cap; defaults to `8192` tokens. |
| `ALLOW_SERVER_AI_FALLBACK` | Backend, optional | Keep `false` for BYOK-only operation. `true` permits explicit platform-quota requests only. |

Do not put a private AI key in a `VITE_*` variable. Vite embeds those values into the public browser bundle. Keep AI keys, Firebase Admin credentials, Azure credentials, and encryption secrets only on the API service.

### Run locally

Run both frontend and API:

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:server
npm run dev:vite
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3002` unless `PORT` is set
- Health check: `http://localhost:3002/api/health`

## Android app (Capacitor)

The React application is packaged as an Android app with Capacitor. Install Android Studio, Android SDK Platform 36, and a full JDK 21 (not a JRE). The Android project is configured to use JDK 21 because Capacitor 8 requires it.

```bash
# Build the web app and copy it into the native Android project
npm run android:sync

# Open the native project in Android Studio
npm run android:open

# Or create a debug APK from the command line (Windows)
npm run android:build
```

In Android Studio, open the `android` folder—not the repository root—and select a device or emulator before pressing Run. When you change the React app, run `npm run android:sync` again before launching it in Android Studio.

## Verification

```bash
npm run lint
npm run build
npx tsx test-all-features.ts
```

The smoke-test script checks provider utilities, API authentication guards, route behaviour, and a local upload/extraction round trip. AI, Firebase, Azure, and notification checks can report configuration-dependent warnings when external credentials are absent.

## Deployment

`render.yaml` defines two services:

1. `noteit-api`: the Node/Express backend; configure all secret values here.
2. `noteit-web`: the Vite static frontend; configure Firebase web settings and `VITE_API_URL` here.

Deployment checklist:

1. Configure Firebase Authentication, Firestore, and optional Cloud Messaging/Storage.
2. Deploy and review `firestore.rules` for your intended student/faculty data-sharing model.
3. Configure backend secrets: Firebase Admin credentials, a unique `ENCRYPTION_SECRET`, provider/storage credentials, and restrictive `CORS_ORIGINS`.
4. Set the frontend `VITE_API_URL` to the exact deployed API URL.
5. Add the final frontend domain to Firebase Authentication's Authorized domains.
6. Test sign-in, key setup, upload, one AI-generation flow, and a Firestore write after deployment.

### Vercel note

`vercel.json` deploys the static frontend only. `server.ts` must run on a Node backend such as the `noteit-api` Render service. A `GEMINI_API_KEY` placed only in a static Vercel project is not available to the Express API.

## Security and production notes

- Protected API routes verify Firebase ID tokens.
- User provider keys are encrypted server-side; browser storage no longer retains them.
- Every expensive AI route is protected by a centralized per-user daily quota, per-minute rate limit, payload-size limit, and text/audio input limit. Usage is recorded in a server-only `ai_rate_limits` collection; a local limiter is used only when Firebase Admin is unavailable during development.
- BYOK is the default. A server-owned Gemini key is never selected automatically: it can be used only when `ALLOW_SERVER_AI_FALLBACK=true` and a request explicitly opts into platform quota. API responses and Settings identify the key source.
- Upload routes enforce the authenticated user's filename prefix.
- Admin debug/broadcast routes require Firebase authentication plus a server-side admin secret.
- For production, prefer private blob storage and authorization-checked download URLs over publicly served local upload files.
- Harden arbitrary URL import against SSRF before opening public access.
- Review dependency-audit findings and update/replace vulnerable document parsers before a public launch.
- AI output can be inaccurate; students should verify it against original source material.

## License

This repository is private. Add an explicit license before distributing or open-sourcing it.
