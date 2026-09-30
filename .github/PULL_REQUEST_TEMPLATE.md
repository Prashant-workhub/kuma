## Summary of Changes
<!-- Provide a brief description of the changes introduced in this PR -->

## UI & Design System Contribution Checklist

Before submitting this Pull Request, please confirm that your changes adhere to the Kuma design system standards:

- [ ] **Primitive Check**: Used existing primitives from `src/components/ui/` (Button, Input, Badge, Card, Dialog, Table, etc.) instead of creating custom unstyled elements.
- [ ] **Design Tokens**: Verified zero raw hex colors (`#...`), arbitrary Tailwind values (`[...px]`), or non-dynamic `style={{...}}` props in TSX files.
- [ ] **State Coverage**: Verified that data-fetching views provide all three required states:
  - [ ] **Loading**: Skeleton layout matching final view bounds.
  - [ ] **Empty**: Clear description of what the section is, what to do next, and a primary action button.
  - [ ] **Error**: `InlineAlert` or `ErrorState` explaining what failed, how to fix it, and a "Retry" button.
- [ ] **Keyboard Operable**: Verified tab order, focus trap inside dialogs/drawers, focus restoration on close, and <kbd>Escape</kbd> overlay dismissal.
- [ ] **Copy Quality**: Verified sentence-case text everywhere, zero emojis or slang in system text, and consistent domain vocabulary (`trainee`, `trainer`, `course`, `module`, `assessment`, `competency`).
- [ ] **Verification Passed**: Executed `npm run lint`, `npm test`, and `npx playwright test` with clean pass.
