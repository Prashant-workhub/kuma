# Kuma Enterprise UI Guidelines & Component Usage

This guide establishes the layout structure, content standards, component selection rules, visual decoration constraints, and contribution checklist for the Kuma enterprise learning platform.

---

## 1. Radix UI Dependency Justification

To ensure enterprise-grade accessibility (WCAG 2.1 AA & WAI-ARIA 1.2), Kuma adopts headless **Radix UI Primitives** (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`, `@radix-ui/react-switch`, `@radix-ui/react-slot`).

### Why Radix UI?
1. **Uncompromising Accessibility**: Automated focus traps for modals, keyboard navigation for tabs (<kbd>ArrowRight</kbd>, <kbd>ArrowLeft</kbd>), <kbd>Escape</kbd> key listeners, and `aria-describedby` wiring out of the box.
2. **Zero Unwanted Styling**: Completely unstyled and headless, allowing 100% of visual styling to be driven by Kuma's token system in `src/styles/tokens.css`.
3. **Lightweight & Modular**: Tree-shakeable individual packages with zero heavy runtime overhead.

---

## 2. Primitive Selection Matrix

| Use Case | Recommended Primitive | Location | Avoid |
| :--- | :--- | :--- | :--- |
| Main CTA / Action Trigger | `<Button variant="primary">` | `src/components/ui/Button.tsx` | Colored text links or styled cards as buttons |
| Secondary Page Action | `<Button variant="secondary">` | `src/components/ui/Button.tsx` | Raw HTML `<button>` with ad-hoc classes |
| Destructive Action | `<Button variant="danger">` | `src/components/ui/Button.tsx` | Standard red text links |
| Icon-only Action | `<Button isIconOnly aria-label="...">` | `src/components/ui/Button.tsx` | Unlabeled icon elements |
| Grouping Related Content | `<Card>` / `<CardHeader>` / `<CardContent>` | `src/components/ui/Card.tsx` | Fragmented cards for every single text snippet |
| Structured Data List | `<Table>` + `<Pagination>` | `src/components/ui/Table.tsx` | Unstructured `<div className="flex">` grids |
| Form Fields | `<FormField>` + `<Input>` / `<Select>` | `src/components/ui/Input.tsx` | Naked `<input>` missing labels or aria-describedby |
| Status Display | `<StatusPill>` / `<Badge>` | `src/components/ui/Badge.tsx` | Custom colored badges with raw hex codes |
| Key Metric Overview | `<Stat>` | `src/components/ui/Stat.tsx` | Giant numbers with gradient text |
| Modal & Confirmation | `<Dialog>` / `<ConfirmDialog>` | `src/components/ui/Dialog.tsx` | Uncontrolled custom div popups |
| Navigation Layout | `<AppShell>` | `src/components/layout/AppShell.tsx` | Ad-hoc duplicate sidebar implementations |
| Chart Visualizations | `<ChartCard>`, `<BarChart>`, `<LineChart>`, `<RadarChart>` | `src/components/charts/` | Direct imports of recharts or Chart.js in views |

---

## 3. Spacing & Layout Hierarchy

- **Page Container Max Width**: `max-w-6xl` (`1152px`) centered with `mx-auto`.
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
3. **Domain Terminology Consistency**: Always use `trainee`, `trainer`, `course`, `module`, `assessment`, `competency`. Never use academic terms (`student`, `faculty`, `semester`, `lecture`).
4. **No Emojis in System UI Text**: Emojis are strictly prohibited in labels, buttons, headers, or alerts. Use monochrome `lucide-react` icons.
5. **Empty & Error States**:
   - **Empty State**: State what this is, what action to take next, and include a primary action button.
   - **Error State**: State what failed, how to fix it, and include an explicit "Retry" button.

---

## 5. Automated Guardrails (`scripts/uiGuardrails.ts`)

Ran automatically during `npm run lint` (`tsc --noEmit && tsx scripts/uiGuardrails.ts`):
- **NO_RAW_HEX_COLOR**: Rejects raw hex/RGB strings (`#123456`) in TSX code outside token files and chart palette definitions.
- **NO_INLINE_STYLE_PROP**: Rejects visual styling in `style={{...}}` props (dynamic height/width progress exceptions allowed).
- **NO_ARBITRARY_TAILWIND_VALUES**: Rejects hardcoded Tailwind bracket values (`w-[200px]`, `bg-[#123456]`).
- **NO_DIRECT_CHART_IMPORT**: Rejects direct imports of chart libraries outside `src/components/charts/`.
- **NO_EMOJI_IN_SYSTEM_TEXT**: Fails when emoji characters are embedded in system UI text strings.

---

## 6. Contribution Checklist

Before adding or submitting any UI changes, verify:
- [ ] **Primitive Exists**: Does a shared primitive exist in `src/components/ui/` or `src/components/charts/`?
- [ ] **Tokens Used**: Are all colors, radii, shadows, and fonts driven strictly by CSS design tokens?
- [ ] **Three UI States Designed**: Does the view support Skeleton loading, EmptyState, and InlineAlert error/retry?
- [ ] **Keyboard & Focus Operable**: Is the UI 100% operable via <kbd>Tab</kbd>, <kbd>Space</kbd>, <kbd>Enter</kbd>, and <kbd>Escape</kbd>?
- [ ] **Copy Compliance**: Is all copy written in sentence case with zero emojis or non-standard terminology?
