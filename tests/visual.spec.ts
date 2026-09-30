import { test, expect } from '@playwright/test';

/**
 * Visual regression test suite.
 * Run `npx playwright test tests/visual.spec.ts --update-snapshots` to update baselines.
 */
test.describe('Visual Regression Baseline Suite', () => {

  test('Login screen visual snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`login-${testInfo.project.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Trainee Home screen visual snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    const traineeButton = page.getByRole('button', { name: 'Trainee', exact: true });
    if (await traineeButton.isVisible()) {
      await traineeButton.click();
      await page.waitForTimeout(1000);
    }
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`trainee-home-${testInfo.project.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Trainer Overview screen visual snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    const trainerButton = page.getByRole('button', { name: 'Trainer', exact: true });
    if (await trainerButton.isVisible()) {
      await trainerButton.click();
      await page.waitForTimeout(1000);
    }
    await page.goto('/faculty-dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`trainer-overview-${testInfo.project.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Admin Overview screen visual snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    const adminButton = page.getByRole('button', { name: 'Admin', exact: true });
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await page.waitForTimeout(1000);
    }
    await page.goto('/admin-dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`admin-overview-${testInfo.project.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
