# Trainee Screens Visual Inspection & Screenshot Artifacts

This directory contains visual inspection documentation and responsive screenshots for all Trainee screens across 1440px (Desktop) and 390px (Mobile) resolutions in both Light and Dark color schemes.

## Captured Screen Artifacts Matrix

| Screen | Route / PageId | 1440px Light | 1440px Dark | 390px Light | 390px Dark |
|---|---|---|---|---|---|
| **1. Home** | `/dashboard` | `home-1440-light.png` | `home-1440-dark.png` | `home-390-light.png` | `home-390-dark.png` |
| **2. Discover** | `/trainee/trainers` | `discover-1440-light.png` | `discover-1440-dark.png` | `discover-390-light.png` | `discover-390-dark.png` |
| **3. Course Detail** | `/trainee/trainers` (Detail) | `course-detail-1440-light.png` | `course-detail-1440-dark.png` | `course-detail-390-light.png` | `course-detail-390-dark.png` |
| **4. Course Player** | `/trainee/my-learning` | `player-1440-light.png` | `player-1440-dark.png` | `player-390-light.png` | `player-390-dark.png` |
| **5. Practice** | Practice Modal | `practice-1440-light.png` | `practice-1440-dark.png` | `practice-390-light.png` | `practice-390-dark.png` |
| **6. Assessment** | `/trainee/assessments` | `assessment-1440-light.png` | `assessment-1440-dark.png` | `assessment-390-light.png` | `assessment-390-dark.png` |
| **7. Growth** | `/skill-gap` | `growth-1440-light.png` | `growth-1440-dark.png` | `growth-390-light.png` | `growth-390-dark.png` |
| **8. Certificates** | `/certificates` | `certificates-1440-light.png` | `certificates-1440-dark.png` | `certificates-390-light.png` | `certificates-390-dark.png` |
| **9. Profile & Settings** | `/profile`, `/settings` | `profile-1440-light.png` | `profile-1440-dark.png` | `profile-390-light.png` | `profile-390-dark.png` |

---

## Visual Design Standards Checklist
- ✅ Uses `AppShell` or `FocusLayout` layout containers.
- ✅ Structured according to the learning journey: Discover $\rightarrow$ Learn $\rightarrow$ Practice $\rightarrow$ Assess $\rightarrow$ Improve.
- ✅ Uses standard tokens from `src/styles/tokens.css` with 0 raw hardcoded hex codes.
- ✅ Accessible `aria-live` timer alerts in assessment focus view.
- ✅ Print-friendly CSS `@media print` rules included for certificates.
