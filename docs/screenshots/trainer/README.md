# Trainer Portal Screens Visual Inspection & Screenshot Artifacts

This directory contains visual inspection documentation and responsive screenshots for all Trainer Portal screens across 1440px (Desktop) and 390px (Mobile) resolutions in both Light and Dark color schemes.

## Captured Trainer Screen Artifacts Matrix

| Screen | Route / ViewId | 1440px Light | 1440px Dark | 390px Light | 390px Dark |
|---|---|---|---|---|---|
| **1. Overview** | `overview` | `overview-1440-light.png` | `overview-1440-dark.png` | `overview-390-light.png` | `overview-390-dark.png` |
| **2. My Courses** | `courses` | `my-courses-1440-light.png` | `my-courses-1440-dark.png` | `my-courses-390-light.png` | `my-courses-390-dark.png` |
| **3. Course Workspace** | `progress` | `workspace-1440-light.png` | `workspace-1440-dark.png` | `workspace-390-light.png` | `workspace-390-dark.png` |
| **4. Trainees** | `my-trainees` | `trainees-1440-light.png` | `trainees-1440-dark.png` | `trainees-390-light.png` | `trainees-390-dark.png` |
| **5. Assessment Builder** | `quizzes` | `builder-1440-light.png` | `builder-1440-dark.png` | `builder-390-light.png` | `builder-390-dark.png` |
| **6. Doubts & Announcements** | `doubts`, `announcements` | `doubts-1440-light.png` | `doubts-1440-dark.png` | `doubts-390-light.png` | `doubts-390-dark.png` |
| **7. Trainer Profile** | `settings` | `profile-1440-light.png` | `profile-1440-dark.png` | `profile-390-light.png` | `profile-390-dark.png` |

---

## Visual & Functional Verification Checklist
- ✅ Embedded in `AppShell` with `role="faculty"`.
- ✅ All stats rendered using unstyled `Stat` primitive.
- ✅ Course workspace modules support drag handles + keyboard accessible up/down reorder buttons.
- ✅ Azure file uploader integrated in "Add module" `Drawer`.
- ✅ Pre-publish verification checklist implemented in `ConfirmDialog`.
- ✅ Two-pane assessment editor with autosave draft state indicator ("Saved", "Saving...").
- ✅ Announcement composer opens in accessible `Dialog`.
- ✅ Trainee view modal for Trainer Profile preview.
