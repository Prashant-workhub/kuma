# Kuma Enterprise UI Guidelines & Component Usage

This guide establishes the layout structure, content standards, component selection rules, and visual decoration constraints for Kuma enterprise learning software.

---

## 1. Radix UI Dependency Justification

To ensure enterprise-grade accessibility (WCAG 2.1 AA & WAI-ARIA 1.2), Kuma adopts headless **Radix UI Primitives** (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`, `@radix-ui/react-switch`, `@radix-ui/react-slot`).

### Why Radix UI?
1. **Uncompromising Accessibility**: Provides automated focus traps for modals, keyboard navigation for tabs (`ArrowRight`, `ArrowLeft`), `Escape` key listeners, and `aria-describedby` wiring out of the box.
2. **Zero Unwanted Styling**: Completely unstyled and headless, allowing 100% of visual styling to be driven by Kuma's token system in `src/styles/tokens.css`.
3. **Lightweight & Modular**: Tree-shakeable individual packages with zero heavy runtime overhead.

---

## 2. Primitive Selection Matrix

| Use Case | Recommended Primitive | Avoid |
|---|---|---|
| Main CTA / Action Trigger | `<Button variant="primary">` | Colored text links or styled cards as buttons |
| Secondary Page Action | `<Button variant="secondary">` | Raw HTML `<button>` with ad-hoc classes |
| Destructive Action | `<Button variant="danger">` | Standard red text links |
| Icon-only Action | `<Button isIconOnly aria-label="...">` | Unlabeled icon elements |
| Grouping Related Content | `<Card>` / `<CardHeader>` / `<CardContent>` | Fragmented cards for every single text snippet |
| Structured Data List | `<Table>` + `<Pagination>` | Unstructured `<div className="flex">` grids |
| Form Fields | `<FormField>` + `<Input>` / `<Select>` | Naked `<input>` missing labels or aria-describedby |
| Status Display | `<StatusPill>` / `<Badge>` | Custom colored badges with raw hex codes |
| Key Metric Overview | `<Stat>` | Giant numbers with gradient text |

---

## 3. Spacing & Layout Hierarchy

- **Page Padding**: `p-6` (24px) on desktop, `p-4` (16px) on mobile.
- **Section Gap**: `gap-6` (24px) between major page sections.
- **Form Field Gap**: `gap-4` (16px) between stacked form fields; `gap-1.5` (6px) between label, input, and error text within a single field.
- **Card Padding**: `p-5` (20px) internal padding for card content.

---

## 4. Content & Copy Patterns

1. **Sentence Case Everywhere**: Capitalize only the first word and proper nouns.
   - **Correct**: "Save changes", "Enroll in course", "Start assessment", "View details".
   - **Incorrect**: "SAVE CHANGES", "Enroll In Course", "Start Assessment".
2. **Explicit Action Names**: Buttons name exact actions. The same action maintains the identical name across the entire flow, including toast notifications:
   - Button: "Enroll in course" $\rightarrow$ Toast: "Enrolled in course".
3. **No Emojis in UI Text**: Emojis are strictly prohibited in labels, buttons, headers, or alerts. Use monochrome `lucide-react` icons (sizes 16, 20, 24).
4. **Empty & Error States**:
   - **Empty State**: State what to do next ("No assigned courses found. Explore the catalog to begin learning.").
   - **Error State**: State what happened and how to fix it ("Failed to connect to server. Check your network connection and try again.").

---

## 5. Banned Visual Decoration (Do / Don't)

| Banned Element | Do | Don't |
|---|---|---|
| **Gradient Backgrounds / Text** | Solid token colors (`bg-surface`, `text-primary`) | `bg-gradient-to-r from-purple-500 to-indigo-600`, `bg-clip-text` |
| **Glassmorphism / Blur** | Solid enterprise surface backgrounds (`bg-surface`, `bg-surface-muted`) | `backdrop-blur-md`, `bg-white/10` |
| **Glow Shadows** | Single clean enterprise shadow (`shadow-overlay`) | `shadow-[0_0_20px_rgba(...)]`, colored glows |
| **Colored Left-Border Cards** | 1px neutral border (`border-border`) with a status badge inside | `border-l-4 border-amber-500` cards |
| **Tracked-out All-Caps Eyebrows**| Standard sentence-case section titles (`text-sm font-semibold text-text-secondary`) | `uppercase tracking-widest text-[10px]` |
| **Entrance Animations & Hover-Lift**| Subtle 150ms color transitions on focus/hover | `hover:-translate-y-1`, floating card animations |
