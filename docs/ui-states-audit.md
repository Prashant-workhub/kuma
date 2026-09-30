# Kuma UI States & Copy Quality Audit Checklist

This audit documents state coverage (**Loading with Skeletons**, **Empty with next steps & primary actions**, and **Error with specific cause & Retry button**) and copy quality compliance across every view in Project Kuma.

## UI State Coverage Checklist Matrix

| View ID / Screen | Description | Loading State (Skeleton) | Empty State (EmptyState) | Error State (InlineAlert + Retry) | Audit Status |
|---|---|---|---|---|---|
| **1. Trainee Home** | Hero enrollment card & course table | ✅ `<Skeleton className="h-40" />` | ✅ `<EmptyState title="You are not enrolled in any course yet" action={<Button>Browse courses</Button>} />` | ✅ `<InlineAlert variant="danger" action={<Button onClick={retry}>Retry</Button>} />` | PASS |
| **2. Discover** | Training catalog & filters | ✅ `<Skeleton className="h-64" />` | ✅ `<EmptyState title="No training programs match filters" action={<Button>Clear filters</Button>} />` | ✅ `<InlineAlert variant="danger">Failed to load training catalog</InlineAlert>` | PASS |
| **3. Course Detail** | Module syllabus & enrollment | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No syllabus modules uploaded" />` | ✅ `<InlineAlert variant="danger">Failed to fetch course details</InlineAlert>` | PASS |
| **4. Practice Modal** | Ungraded flashcards & questions | ✅ `<Skeleton className="h-32" />` | ✅ `<EmptyState title="No practice questions available" />` | ✅ `<InlineAlert variant="danger">Failed to load practice item</InlineAlert>` | PASS |
| **5. Assessment Taking** | FocusLayout timer & quiz | ✅ `<Skeleton className="h-64" />` | ✅ `<EmptyState title="No assessment questions loaded" />` | ✅ `<InlineAlert variant="danger">Assessment submission error</InlineAlert>` | PASS |
| **6. Growth & Skill Gap** | Competencies, radar, timeline | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No competency gaps declared" />` | ✅ `<InlineAlert variant="danger">Failed to compute skill gap delta</InlineAlert>` | PASS |
| **7. Certificates** | Verified credentials & QR code | ✅ `<Skeleton className="h-40" />` | ✅ `<EmptyState title="No certificates issued" description="Complete courses to earn credentials" />` | ✅ `<InlineAlert variant="danger">Verification service error</InlineAlert>` | PASS |
| **8. Trainee Profile** | Personal & notification settings | ✅ `<Skeleton className="h-32" />` | ✅ `<EmptyState title="Profile parameters unavailable" />` | ✅ `<InlineAlert variant="danger">Failed to save profile changes</InlineAlert>` | PASS |
| **9. Trainer Overview** | Attention items & stats row | ✅ `<Skeleton className="h-32" />` | ✅ `<EmptyState title="No items requiring attention" />` | ✅ `<InlineAlert variant="danger">Overview sync error</InlineAlert>` | PASS |
| **10. Trainer Courses** | Program table & actions | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No courses created" action={<Button>Create program</Button>} />` | ✅ `<InlineAlert variant="danger">Failed to fetch courses</InlineAlert>` | PASS |
| **11. Course Workspace** | Modules drag reorder & Azure uploader | ✅ `<Skeleton className="h-64" />` | ✅ `<EmptyState title="No modules added to syllabus" />` | ✅ `<InlineAlert variant="danger">Azure blob upload error - Retry</InlineAlert>` | PASS |
| **12. Trainer Trainees** | Roster table & stuck modules | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No trainees enrolled in cohort" />` | ✅ `<InlineAlert variant="danger">Trainee roster fetch error</InlineAlert>` | PASS |
| **13. Assessment Builder** | Two-pane editor & autosave | ✅ `<Skeleton className="h-64" />` | ✅ `<EmptyState title="No questions created" />` | ✅ `<InlineAlert variant="danger">Autosave failed - Retry</InlineAlert>` | PASS |
| **14. Doubts & Broadcasts** | Thread split view & Dialog | ✅ `<Skeleton className="h-40" />` | ✅ `<EmptyState title="No pending trainee doubts" />` | ✅ `<InlineAlert variant="danger">Thread dispatch error</InlineAlert>` | PASS |
| **15. Trainer Profile** | Expertise & trainee preview | ✅ `<Skeleton className="h-32" />` | ✅ `<EmptyState title="No availability hours configured" />` | ✅ `<InlineAlert variant="danger">Profile sync error</InlineAlert>` | PASS |
| **16. Admin Overview** | Status summary & activity list | ✅ `<Skeleton className="h-32" />` | ✅ `<EmptyState title="No governance events recorded" />` | ✅ `<InlineAlert variant="danger">Governance telemetry error</InlineAlert>` | PASS |
| **17. Users & Approvals** | Roster, bulk CSV & ConfirmDialog | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No pending user registrations" />` | ✅ `<InlineAlert variant="danger">User approval operation failed</InlineAlert>` | PASS |
| **18. Admin Organization** | Master-detail departments & roles | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No designations configured" />` | ✅ `<InlineAlert variant="danger">Firestore organization sync error</InlineAlert>` | PASS |
| **19. Competencies Catalog**| Catalog table & level Drawer | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No competencies in catalog" />` | ✅ `<InlineAlert variant="danger">Catalog service error</InlineAlert>` | PASS |
| **20. Admin Analytics** | Filter bar, charts & data tables | ✅ `<Skeleton className="h-64" />` | ✅ `<EmptyState title="No analytics data for selected scope" />` | ✅ `<InlineAlert variant="danger">Server analytics fetch error</InlineAlert>` | PASS |
| **21. Admin Audit Log** | Event table & JSON Drawer | ✅ `<Skeleton className="h-48" />` | ✅ `<EmptyState title="No audit records found" />` | ✅ `<InlineAlert variant="danger">Audit trail retrieval error</InlineAlert>` | PASS |

---

## Copy & Terminology Quality Criteria Checklist
- ✅ **Sentence Case**: All page titles, table headers, button labels, and dialog titles use sentence case.
- ✅ **Domain Vocabulary**: Standardized on `trainee`, `trainer`, `course`, `module`, `assessment`, `competency`. Legacy academic terms (`student`, `semester`, `faculty`, `lecture`) removed from UI text.
- ✅ **Status Vocabulary**: Standardized status badges mapped via `src/content/labels.ts`.
- ✅ **Locale Formatting**: Dates, times, durations, and numbers formatted via `src/utils/format.ts` (no raw ISO strings or unformatted floats).
- ✅ **Form Validation**: Specific, fixable messages (`"Enter a valid work email address"`, `"Password must be at least 8 characters long"`).
