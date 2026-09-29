# KUMA Current-Version Audit: SIH26075

Audit date: 2026-09-29  
Repository: `Prashant-workhub/kuma`  
Branch/commit: `main` / `ab1982d` (`version 1.0 updates`)  
Working tree at audit start: clean

## Scope And Confidence

This is a source/configuration audit of the checked-out version, not a claim of a production end-to-end test. The baseline TypeScript check, unit tests, and production build were run. No Firebase emulator, authorized judge/admin account, or safe test credentials were available, so account creation, live Firestore reads/writes, mobile packaging, and the three-role regression flow were not exercised against a remote project. UI presence is not treated as persistence.

The repository's main runtime entry is `src/main.tsx` -> `src/App.tsx`; it uses React/Vite, Firebase Auth/Firestore, Express (`server/index.js`), and shared theme tokens (`src/theme/theme.tsx`, `src/index.css`). `README.md` describes a more complete system than the runtime currently implements and names stale/missing files such as `server.ts`.

## A. Current Project Health

KUMA is a substantial prototype with several real client-side engines and Firebase integrations, but it is not currently one connected, durable capacity-building system. Authentication and selected profile/directory operations reach Firebase; most admin, trainer, assessment, enrollment, analytics, and certificate flows use seeded constants, component state, or browser storage.

The core gap is integration rather than lack of screens: no single backend-owned source of truth connects organization requirements to trainee assessment, training delivery, completion, certificates, and organization analytics. Do not describe the current project as enterprise-grade or fully SIH-compliant based on the README.

## B. SIH26075 Compliance Matrix

| Requirement | Current implementation | Status | Evidence | Gap |
|---|---|---|---|---|
| Authentication | Firebase Auth email/password and Google flows; GitHub code exists but is not enabled in `firebase.json` | PARTIALLY IMPLEMENTED | [src/components/AuthView.tsx](src/components/AuthView.tsx), [firebase.json](firebase.json) | No functioning judge-account shortcut; role selection and profile role can disagree. |
| Role management / RBAC | Firestore profile role maps to trainee/trainer/admin UI; backend and rules require the `admin` custom claim | PARTIALLY IMPLEMENTED | [src/App.tsx](src/App.tsx), [firestore.rules](firestore.rules), [server/index.js](server/index.js) | No admin UI/API to grant or manage roles; trainer self-registration is immediately assigned the trainer role; claim provisioning is external. |
| Trainee registration and organization profile | Firebase Auth plus a `users/{uid}` document; organization/department/designation options are hardcoded | PARTIALLY IMPLEMENTED | [src/components/TraineeRegistrationView.tsx](src/components/TraineeRegistrationView.tsx) | Firestore write errors are swallowed and registration still succeeds; subsequent settings persistence omits competencies and most professional fields. |
| Trainer registration/profile | Firebase Auth, private user record, and a discovery-safe `trainerProfiles/{uid}` record | PARTIALLY IMPLEMENTED | [src/components/TrainerRegistrationView.tsx](src/components/TrainerRegistrationView.tsx), [firestore.rules](firestore.rules) | No approval state; registration write failures are swallowed; no durable trainer course-management workflow. |
| Organization / department / designation management | Admin forms change React state; a few department/designation REST endpoints exist | UI ONLY / PARTIALLY IMPLEMENTED | [src/admin/AdminPortalApp.tsx](src/admin/AdminPortalApp.tsx), [server/index.js](server/index.js) | Admin UI is not connected to those endpoints; no durable organization hierarchy or requirement mapping in the UI. |
| Competency catalog | Static catalog in app data; signed-in Firestore reads and admin writes are permitted; backend has a catalog endpoint | PARTIALLY IMPLEMENTED | [src/data.ts](src/data.ts), [firestore.rules](firestore.rules), [server/index.js](server/index.js) | Registration and skill-gap UI use static catalog data; admin changes do not update the trainee workflow. |
| Declared competency/proficiency | Registration/profile forms store declared values; deterministic proficiency levels | PARTIALLY IMPLEMENTED | [src/components/TraineeRegistrationView.tsx](src/components/TraineeRegistrationView.tsx), [src/types.ts](src/types.ts) | Profile updates do not persist competency changes to Firestore. |
| Assessment creation/publishing/deadlines | Static trainee quizzes and a client-side quiz authoring surface | UI ONLY / MOCK DATA | [src/data.ts](src/data.ts), [src/components/AssessmentTakingModal.tsx](src/components/AssessmentTakingModal.tsx), [src/components/CreateAssessmentModal.tsx](src/components/CreateAssessmentModal.tsx) | No durable publishing, attempts, deadlines, or server-side scoring. |
| Assessment scoring/proficiency | Client computes percentage and maps it deterministically to a level | REAL + PARTIAL | [src/components/AssessmentTakingModal.tsx](src/components/AssessmentTakingModal.tsx), [src/utils/competencyUtils.ts](src/utils/competencyUtils.ts) | Result handler changes app memory; no durable attempt record. Client contains answer keys, so this is a prototype assessment, not a secure examination. |
| Skill-gap calculation | Deterministic gap calculation; assessed level takes precedence over declared level | REAL + PARTIAL | [src/utils/competencyUtils.ts](src/utils/competencyUtils.ts), [src/components/SkillGapView.tsx](src/components/SkillGapView.tsx) | Designation requirements come from demo constants, not the admin's persisted organization data. |
| Training recommendations | Deterministic competency-gap-to-course matching | REAL + PARTIAL | [src/utils/recommendationUtils.ts](src/utils/recommendationUtils.ts) | Input courses/resources and most designation data are static demo data; no live organization catalog. |
| Trainer discovery and match explanation | Firestore public trainer profiles plus seeded trainer records; deterministic weighted score with breakdown and explanation | PARTIALLY IMPLEMENTED | [src/services/trainerDiscoveryService.ts](src/services/trainerDiscoveryService.ts), [src/utils/trainerMatching.ts](src/utils/trainerMatching.ts), [src/components/FindTrainerDiscoveryView.tsx](src/components/FindTrainerDiscoveryView.tsx) | Seeded trainers are currently returned to every trainee; no domain-alignment factor; unverified trainer profiles can register directly. |
| Trainer selection relationship | Local storage plus `trainer_assignments` Firestore writes/queries | PARTIALLY IMPLEMENTED | [src/services/trainerDiscoveryService.ts](src/services/trainerDiscoveryService.ts), [firestore.rules](firestore.rules) | Persistence failure is swallowed; trainer roster falls back to fabricated profile defaults and cannot read private trainee profile documents under current rules. |
| Training program/module management | Trainer UI and course/module data are initialized from static mock data | MOCK/DEMO ONLY | [src/teacher-portal/lib/mockData.ts](src/teacher-portal/lib/mockData.ts), [src/teacher-portal/context/DataContext.tsx](src/teacher-portal/context/DataContext.tsx) | Creation, competency mapping, announcements, and progress are component/context state, not a shared backend model. |
| Enrollment and progress | Enrollment helper prevents duplicates and filters real users by UID/email; writes browser local storage | REAL + PARTIAL | [src/utils/enrollmentUtils.ts](src/utils/enrollmentUtils.ts) | Not synced to Firestore; data is device/browser-specific. Assessment success can auto-mark a mapped course 100% complete without module participation. |
| Certificates | IDs, completion records, de-duplication, and verification lookup work locally | MOCK/DEMO ONLY | [src/utils/certificateUtils.ts](src/utils/certificateUtils.ts), [src/utils/__tests__/certificateUtils.test.ts](src/utils/__tests__/certificateUtils.test.ts) | Browser-local records; Azure backup endpoint is absent from this backend; IDs are not digital signatures or proof of server-issued completion. |
| Public certificate verification | Client-side local lookup, with a seeded certificate shown when no ID is supplied | MOCK/DEMO ONLY | [src/components/CertificateVerificationView.tsx](src/components/CertificateVerificationView.tsx), [src/utils/certificateUtils.ts](src/utils/certificateUtils.ts) | Not an authoritative public verification service; the default view can present a demo record as valid. |
| Admin users, approvals, governance | Admin portal displays seeded users/trainers and updates local UI state | MOCK/DEMO ONLY | [src/admin/AdminPortalApp.tsx](src/admin/AdminPortalApp.tsx) | No user approval, trainer approval, organization-wide CRUD, or real admin control of the shown records. |
| Bulk trainee import | CSV text parser populates local admin state | UI ONLY | [src/admin/AdminPortalApp.tsx](src/admin/AdminPortalApp.tsx) | Does not provision Auth accounts or write trainees to Firestore. |
| Analytics/capacity coverage | Calculations and visualizations operate on demo arrays and local enrollments | MOCK/DEMO ONLY | [src/admin/AdminAnalyticsView.tsx](src/admin/AdminAnalyticsView.tsx), [src/teacher-portal/views/LearningAnalytics.tsx](src/teacher-portal/views/LearningAnalytics.tsx) | Not organization-wide, cross-user, or sourced from durable assessment/training records. |
| Feedback | Authenticated Firestore feedback write with local telemetry fallback | PARTIALLY IMPLEMENTED | [src/components/FeedbackWidget.tsx](src/components/FeedbackWidget.tsx), [firestore.rules](firestore.rules) | Admin telemetry is read locally; no complete moderation/reporting workflow. |
| Notifications | Browser permission, service worker/FCM token registration, preferences, and local test-notification fallback | PARTIALLY IMPLEMENTED | [src/services/notificationService.ts](src/services/notificationService.ts), [public/firebase-messaging-sw.js](public/firebase-messaging-sw.js) | Backend has no notification send route; app notification lists are in-memory and no scheduled/broadcast workflow is wired. |
| Knowledge/resources | Legacy notes and AI content-generation code exists; notes use per-user Firestore subcollections | PARTIALLY IMPLEMENTED / LEGACY | [src/hooks/useNotes.ts](src/hooks/useNotes.ts), [src/services/gemini.ts](src/services/gemini.ts), [src/services/storageService.ts](src/services/storageService.ts) | Not a trainer-managed, published resource library; remote document/storage API routes are absent. |
| Azure Blob Storage | `azure.ts` is a local-storage stub; another client service expects `/api/storage/*` routes | MISSING / BROKEN | [src/services/azure.ts](src/services/azure.ts), [src/services/storageService.ts](src/services/storageService.ts), [server/index.js](server/index.js) | This Express server has no storage/SAS/upload/extraction endpoints and no Azure integration. Firebase Storage code is also not backed by configured storage rules in `firebase.json`. |
| AI | Gemini and other provider calls are real optional client-side integrations | REAL + OPTIONAL | [src/services/gemini.ts](src/services/gemini.ts), [src/providers](src/providers) | AI is not part of core competency matching; Vite-configured keys ship to clients and user keys are held in local storage/profile data. Do not represent it as server-secret. |
| Dark/light theme | One root provider persists theme and synchronizes DOM attributes across active portals | IMPLEMENTED | [src/theme/theme.tsx](src/theme/theme.tsx), [src/main.tsx](src/main.tsx), [src/index.css](src/index.css) | Many legacy utility classes and fixed colors remain; visual parity/contrast has not been browser-tested at all viewports. |
| Mobile | Responsive classes and Capacitor back-button/network code exist | PARTIALLY IMPLEMENTED / UNVERIFIED | [src/App.tsx](src/App.tsx), [package.json](package.json) | No Capacitor config or native `android/`/`ios/` project found; this audit did not run device/browser viewport tests. |

## C. Working Features

- Firebase Auth integration and owner-scoped Firestore profile/notes writes are implemented in code.
- Firestore rules prevent a user from self-promoting their profile to `admin`; admin operations require a Firebase custom claim.
- Deterministic skill-gap and recommendation utilities are implemented and the enrollment/certificate helper behavior has focused unit tests.
- Trainer matching is deterministic and has a visible breakdown/explanation; it uses declared competency, proficiency, experience, and qualification data.
- Trainer directory profiles intentionally omit phone/email and are readable to authenticated users.
- Shared theme state persists through `localStorage`, updates both `.dark` and `data-theme`, and is used by the active root/admin/trainer shells.
- Server health, competency read, admin summary, department, and designation routes exist; admin routes verify an ID token/custom claim.
- User enrollment/certificate reads filter by a real UID/email, and the current tests cover enrollment isolation and completion helper behavior.

## D. Partial Features

Registration, profiles, trainer discovery/selection, feedback, notifications, recommendations, skill-gap analysis, assessments, and training progress combine working client logic with static or local-only persistence. Firestore write failures in trainee/trainer registration and trainer assignment are often logged but do not fail the user flow, so visible success is not proof of persistence.

`handleUpdateSettings` in `src/App.tsx` writes only selected identity/contact/theme fields to the root user document. It does not write the changed competencies, organization mapping, or assessment attempt history. `handleCompleteAssessmentAttempt` updates React state; it does not create an assessment-attempt document. The skill-gap view uses demo designation requirements and static courses.

## E. Missing Features

- Durable and connected training/assessment/enrollment/certificate persistence across refreshes and across roles.
- Approval workflow for trainer accounts, organization membership, and role administration.
- A production source of truth for organization, department, designation, and required competency records wired into trainee gap analysis.
- Admin controls over real organizational users and training records; analytics over live organization data.
- Backend endpoints for Azure/storage operations and notification delivery.
- Authoritative server-side certificate issuance and public verification.
- Real bulk account provisioning from CSV.
- Capacitor configuration/native platform projects in this checkout.

## F. Broken Or Misleading Features

- The login-page Admin, Trainer, and Aarav judge buttons do not authenticate or navigate; they only show an error. The “Reset/Seed Demo” action writes browser-local records, not Firebase accounts or records.
- Storage and notification client calls target endpoints that are not implemented in `server/index.js`; graceful fallbacks can make these appear usable while remote persistence/delivery is unavailable.
- The verification screen defaults to a seeded certificate and verifies client-local state. “Verified” here does not establish server authority or cryptographic authenticity.
- Passing an assessment can mark a mapped course complete and issue a local certificate without proving that training modules were completed or that a trainer monitored participation.
- Trainer assigned-trainee details use demo defaults (for example, skills/progress) if the real user document is unreadable; current Firestore rules deny trainers access to other users' private root profiles.
- Generic error handling can conceal a failed registration/profile write while allowing a session to proceed.

## G. Legacy Feature Audit

| Legacy concept | Finding | SIH relevance / recommendation |
|---|---|---|
| NoteIT | No active `NoteIT` product name/route found in source search. | No removal needed. |
| Student/faculty terminology | Still used as compatibility role names, old route names, and trainer portal labels. | Shared identity compatibility is still in use; normalize labels only after migration. |
| Lecture capture, academic notes, quiz, presentation, subject maps | Legacy code and user-facing references remain in `src/App.tsx`, `src/services/gemini.ts`, settings tour copy, and `subjectCanonicalizer.ts`. | Some reusable notes/AI infrastructure exists, but it is not the SIH capacity-building core. Inventory usage before deletion. |
| Bhai Lang, XP, streaks, challenges/rewards | Found in `Kuma_Presentation.md`, not an active source feature. | Stale documentation; update later, do not infer implementation. |
| Old academy/semester/marks/attendance concepts | No separate active academic portal requirement surfaced; isolated model/copy references remain. | Legacy residue; do not remove shared auth/notes infrastructure blindly. |
| `src/teacher-portal/App.tsx` vs `TeacherPortalApp.tsx` | Multiple trainer portal shells/models exist; root app mounts `TeacherPortalApp.tsx`. | Treat the other shell as potentially stale; verify imports/build entry before removal. |
| `scratch/`, `uploads/`, generated logs | Repository utilities and artifacts exist outside the application runtime. Some purge scripts are destructive by purpose. | Not automatically run or deleted. Review separately and keep away from user-facing deploy artifacts. |

No legacy code was removed during this audit.

## H. Demo Data Risks

- At the audit baseline, `getAvailableTrainers()` merged three seeded trainer profiles into every trainee's discovery results; this was changed below to require an explicit demo identity.
- Certificate and enrollment helpers contain seeded records, but normal user reads are UID/email-filtered. At baseline, the certificate view's fallback UID of `user-demo-1` defeated that protection if the loaded profile had no UID; this fallback was removed below.
- Admin views initialize from `DEMO_*` arrays and report local data as organizational counts. The trainer portal initializes from mock course, doubt, announcement, activity, and profile data.
- `seedDemoEnvironment()` merges demo records into shared browser `localStorage`; it does not provision Firebase Auth users or create server-side org records.
- Logout clears all local storage, which reduces cross-account residue in a single tab, but does not make shared browser data an acceptable persistence/security boundary.
- A missing Firestore profile after a swallowed registration write can leave `INITIAL_SETTINGS` in memory. That profile contains generic/demo-looking values and is not identity-scoped.

The P0 demo-isolation changes in this pass are described in section L and recorded below.

## I. Security Risks

Firestore rules are materially safer than the UI's apparent capability: owner-scoped private profiles, admin custom-claim checks, an allowlisted trainer directory, and assignment ownership checks are present. However, self-service users can choose `faculty`/`trainer` at account creation without approval. Most domain collections are admin-only, which blocks trainer/trainee workflows rather than providing a complete least-privilege model. The public trainer directory is authenticated-only and intentionally excludes direct contact fields.

BYOK/provider secrets and any `VITE_*` API key are available to browser code; `App.tsx` also copies profile `api_key` values into local storage. Treat them as client-held credentials, never as protected server secrets. Firebase web API keys are identifiers, not service-account secrets. Server admin credentials are environment variables and are not bundled by the client.

Firestore rules auditor summary (score 1-5):

```json
{
  "score": 3,
  "summary": "Good owner/admin boundaries for several collections, but self-service trainer roles and admin-only domain access leave authorization/business workflows incomplete.",
  "findings": [
    {
      "check": "Authority source / role assignment",
      "severity": "moderate",
      "issue": "An authenticated user may create their own profile with faculty/trainer role, and no approval state is enforced before the trainer UI/directory is available.",
      "recommendation": "Add a pending state and publish trainer profiles/enable trainer actions only after an admin-controlled approval; preserve custom-claim-only admin authority."
    },
    {
      "check": "Business logic vs rules",
      "severity": "major",
      "issue": "Assessments, courses, announcements, and most domain collections are covered by the admin-only catch-all, so normal trainer/trainee persistence is denied or falls back to local/mock state.",
      "recommendation": "Design ownership- and organization-scoped rules alongside a migration of each collection; do not broaden the catch-all globally."
    },
    {
      "check": "Storage authorization",
      "severity": "moderate",
      "issue": "No Firebase Storage rules are configured in firebase.json; direct Firebase Storage upload code cannot be certified from this repository configuration.",
      "recommendation": "Add and deploy owner-scoped storage rules before enabling direct uploads, or use a verified backend upload flow."
    }
  ]
}
```

This score is a source audit of the checked-in rules/configuration, not a deployed-project penetration test.

## J. UI/UX Issues

- Theme ownership is centralized, but the stylesheet still mixes theme tokens, legacy aliases, Tailwind fixed-color classes, and hardcoded page palettes; one token provider does not guarantee the three portals render consistently.
- `src/index.css` uses Inter for the global body despite a more expressive heading/mono palette, and active pages retain extensive slate/purple classes. The trainee/trainer/admin parity concerns need actual browser checks before page-specific patches.
- Registration and login copy still includes academic/lecture language. The judge selector presents controls that do not perform the labeled action.
- Loading/error/empty states exist in some screens, but swallowed persistence failures can make success states inaccurate.
- Responsive utility classes are present; no desktop/mobile screenshots or keyboard/accessibility pass was run.

## K. Performance Issues

- Production output includes a 762.05 kB minified Firebase vendor chunk (183.06 kB gzip) and 185.73 kB CSS (27.61 kB gzip). Several portals/views are lazy-loaded, but Firebase remains a large shared dependency.
- `DataContext` subscribes to the full `doubts` collection; the current rules reject non-admin reads, and there is no pagination/tenant scope for a future large collection.
- The build emits a CSS optimizer warning for an attribute selector containing `#FFD54F` in `src/index.css`.
- No runtime, network, Firestore query-volume, or mobile performance profile was collected.

## L. P0 Fixes

| Problem | Current implementation | Required implementation | Affected files | Risk | Estimate / dependencies | Audit-pass status |
|---|---|---|---|---|---|---|
| Real trainees receive seeded trainers; a missing profile UID can select the demo certificate | At baseline, trainer discovery always seeded demo trainers and `CertificatesView` substituted `user-demo-1` | Include seeded profiles only for explicitly recognized demo identities; use no demo identity when UID is missing | `src/utils/demoDataSeeder.ts`, `src/services/trainerDiscoveryService.ts`, `src/components/FindTrainerDiscoveryView.tsx`, `src/components/CertificatesView.tsx` | Medium: demo identities can be mistaken for real recommendations/credentials | 1-2 hours; no schema/deployment dependency | Implemented; focused TypeScript check and 2 identity tests pass |
| Judge demo selector does not start the advertised role flows | Buttons display errors; seed action only touches local storage | Provision controlled Firebase demo accounts and the required admin custom claim; connect buttons to those flows without embedding secrets | `src/components/AuthView.tsx`, Firebase project IAM/Auth setup, demo guide | High: demo start is blocked; admin claim cannot safely be self-assigned in client code | 0.5-1 day plus authorized Firebase project access | Not implemented: requires project credentials/claim provisioning |
| The advertised end-to-end capacity chain is not durable or connected | Admin/trainer state is mock/local; attempts are in memory; enrollment/certificates local; rules deny most domain writes | Pick the owning persistence boundary and migrate in small steps, starting with assessment attempts and enrollment/completion ownership, then connect admin designation requirements and trainer progress | `src/App.tsx`, `src/admin/AdminPortalApp.tsx`, `src/teacher-portal/context/DataContext.tsx`, `src/utils/enrollmentUtils.ts`, `src/utils/certificateUtils.ts`, `firestore.rules` | High: changing shared schemas/rules risks exposing cross-user data or breaking existing demo flows | 2-4 days minimum; requires schema/rules design and Firebase emulator/test project | Not implemented: intentionally not attempted as a broad unverified migration |

## M. P1 Upgrades

- Persist assessment attempts and trainee competency updates under owner-scoped documents; make settings writes include the professional fields users actually edit.
- Persist training programs, modules, enrollments, progress, trainer assignments, announcements, feedback, and certificates with organization/ownership checks and refresh-safe reads.
- Add admin-controlled trainer approval and role provisioning; keep admin custom claims server-managed.
- Wire Admin department/designation/catalog forms to authenticated endpoints and use those saved requirements in trainee gap calculations.
- Remove hardcoded demo course/designation inputs from real accounts; add tenant-aware queries and pagination.
- Implement or remove advertised Azure storage calls; if retained, add verified upload/read authorization and rules. Same for backend notification send/broadcast routes.
- Make certificate verification authoritative (server lookup, revocation status, validated completion source); do not describe a random ID as cryptographic proof.
- Fix demo account entry controls and make registration failures explicit rather than treating failed persistence as success.
- Extend trainer match explanation to label its current weights honestly; add domain alignment only when domain data is actually captured and verified.

## N. P2 Upgrades

- Run a browser contrast and viewport pass across login, admin, trainer, and trainee in both themes; resolve token leaks centrally after screenshots identify actual failures.
- Bring mobile packaging to a real supported state with Capacitor config/native project and device testing, or describe the deliverable as responsive web only.
- Clean stale academic labels/documentation and evaluate old portal shells after reference/build-entry analysis.
- Add targeted integration tests with Firebase emulator for owner access, trainer directory, assignment, attempts, and certificate isolation.
- Reduce bundle size by reviewing Firebase imports/code splitting; fix the invalid CSS selector warning and measure before optimizing further.

## O. Not Worth Adding Now

- More AI features for trainer matching; the existing deterministic engine is more explainable and AI does not repair disconnected persistence.
- Achievements, XP/streaks, subscriptions, payment/plan features, or extra dashboards before the organization-to-completion chain is durable.
- New portal redesigns, alternate backend/database systems, or broad field renames.
- Removing all legacy academic code in one sweep; shared auth, notes, and utility dependencies need a usage/dependency audit first.

## P. Recommended SIH Demo Flow

The desired 5-10 minute narrative is Admin requirements -> approved trainer profile -> trainee registration/profile -> assessment -> gap -> explained trainer match -> training enrollment/progress -> post-training assessment -> gap reduction -> certificate verification -> admin capacity view.

That full flow is **not currently verifiable as a connected workflow**. The current demo controls do not authenticate, admin/trainer dashboards are seeded, and assessment/enrollment/certificate state is not shared durably. Until P0/P1 data ownership is fixed, use a clearly labeled prototype walkthrough: show the real deterministic gap/match calculations, distinguish static records from live Firebase records, and do not claim that admin edits or trainee outcomes persist across roles/reload. A final competition script should be built only after one seeded trainee can complete the chain in a test Firebase project and the admin sees the same persisted outcome.

## Q. Build / Type / Lint Status

- `npm run lint`: PASS at baseline and after the isolation patch (`tsc --noEmit`)
- Baseline `npm test`: PASS, 30 tests, 0 failures; post-edit `npm test`: PASS, 32 tests, 0 failures (including 2 identity tests)
- `npm run build`: PASS at baseline and after the isolation patch; one existing CSS optimizer warning for the `#FFD54F` attribute selector
- Browser registration/login and three-role regression flow: NOT RUN; no safe authorized test accounts/emulator credentials were available
- Capacitor/native build and mobile viewport test: NOT RUN; no Capacitor config/native project was found

## Safe Changes Made After The Audit

- Added `isDemoTraineeIdentity()` for the explicit demo UID/email allowlist and a focused test for accepted/rejected identities.
- Trainer discovery now excludes seeded and unscoped local trainer records by default; only the recognized demo identities load those fixtures. The same choice is propagated when resolving an existing demo trainer assignment.
- Certificate listing passes an empty identity when a profile has no UID, so the existing per-user filter returns no certificate instead of selecting the demo account.
- Validation: `npm run lint` PASS; `npm test` PASS (32 tests); `npm run build` PASS; `git diff --check` found no whitespace errors (Git noted configured LF-to-CRLF conversion on edited TS files).