import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Smoke Suite (Axe Core)', () => {

  test('Auth / Login page accessibility check', async ({ page }) => {
    await page.goto('/');
    
    // Expect login form or landing page
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const seriousViolations = axeResults.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );

    expect(seriousViolations).toEqual([]);
  });

  test('Trainee demo role routes accessibility check', async ({ page }) => {
    await page.goto('/');
    
    // Select Trainee demo access
    const traineeButton = page.getByRole('button', { name: 'Trainee', exact: true });
    if (await traineeButton.isVisible()) {
      await traineeButton.click();
      await page.waitForTimeout(1000);
    }

    const traineeRoutes = ['/dashboard', '/discover', '/skill-gap', '/certificates', '/profile', '/settings'];
    for (const route of traineeRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousViolations = axeResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(seriousViolations, `Violations on route ${route}`).toEqual([]);
    }
  });

  test('Trainer demo role routes accessibility check', async ({ page }) => {
    await page.goto('/');
    
    // Select Trainer demo access
    const trainerButton = page.getByRole('button', { name: 'Trainer', exact: true });
    if (await trainerButton.isVisible()) {
      await trainerButton.click();
      await page.waitForTimeout(1000);
    }

    const trainerRoutes = ['/faculty-dashboard', '/faculty/courses', '/faculty/trainees', '/faculty/doubts'];
    for (const route of trainerRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousViolations = axeResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(seriousViolations, `Violations on route ${route}`).toEqual([]);
    }
  });

  test('Admin demo role routes accessibility check', async ({ page }) => {
    await page.goto('/');
    
    // Select Admin demo access
    const adminButton = page.getByRole('button', { name: 'Admin', exact: true });
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await page.waitForTimeout(1000);
    }

    const adminRoutes = ['/admin-dashboard', '/admin/users', '/admin/organization', '/admin/competencies'];
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousViolations = axeResults.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      expect(seriousViolations, `Violations on route ${route}`).toEqual([]);
    }
  });
});
