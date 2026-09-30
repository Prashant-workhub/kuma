# Admin Portal Screens Visual Inspection & Screenshot Artifacts

This directory contains visual inspection documentation and responsive screenshots for all Admin Portal screens across 1440px (Desktop) and 390px (Mobile) resolutions in both Light and Dark color schemes.

## Captured Admin Screen Artifacts Matrix

| Screen | Route / ViewId | 1440px Light | 1440px Dark | 390px Light | 390px Dark |
|---|---|---|---|---|---|
| **1. Overview** | `admin-dashboard` | `overview-1440-light.png` | `overview-1440-dark.png` | `overview-390-light.png` | `overview-390-dark.png` |
| **2. Users & Approvals** | `admin-users` | `users-1440-light.png` | `users-1440-dark.png` | `users-390-light.png` | `users-390-dark.png` |
| **3. Organization** | `admin-organization` | `org-1440-light.png` | `org-1440-dark.png` | `org-390-light.png` | `org-390-dark.png` |
| **4. Competencies** | `admin-competencies` | `competencies-1440-light.png` | `competencies-1440-dark.png` | `competencies-390-light.png` | `competencies-390-dark.png` |
| **5. Courses & Certificates** | `admin-courses`, `admin-certificates` | `courses-1440-light.png` | `courses-1440-dark.png` | `courses-390-light.png` | `courses-390-dark.png` |
| **6. Analytics** | `admin-analytics` | `analytics-1440-light.png` | `analytics-1440-dark.png` | `analytics-390-light.png` | `analytics-390-dark.png` |
| **7. Audit Log** | `admin-audit` | `audit-1440-light.png` | `audit-1440-dark.png` | `audit-390-light.png` | `audit-390-dark.png` |

---

## Visual & Functional Verification Checklist
- ✅ Built into `AppShell` with `role="admin"`.
- ✅ Overview rendered using compact unstyled `Stat` primitives with two prioritized lists ("Needs your attention" and "Recent activity").
- ✅ Users & Approvals includes bulk selection checkboxes, actions dropdown menu, user detail `Drawer`, multi-step CSV import wizard, and `ConfirmDialog` for role elevation / rejection.
- ✅ Organization master-detail view with department picker on left, designation requirements table with `SegmentedControl` (levels 1-5) on right.
- ✅ Competency catalog with level 1-5 description `Drawer`.
- ✅ Consistent `Toolbar` + `Table` pattern with status filters across Courses, Enrollments, Assessments, and Certificates.
- ✅ Certificate revocation flow using `ConfirmDialog` with required text justification.
- ✅ Analytics sections with title, 1-sentence description, accessible table toggle, empty state handling, and CSV export.
- ✅ Audit log filterable table with detail `Drawer`.
