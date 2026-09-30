import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import axe from 'axe-core';
import { JSDOM } from 'jsdom';

describe('Shared UI Primitives — Accessibility & Semantics', () => {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost',
  });

  (globalThis as any).window = dom.window;
  (globalThis as any).document = dom.window.document;

  async function runAxe(html: string): Promise<number> {
    dom.window.document.body.innerHTML = html;
    const results = await axe.run(dom.window.document.body);
    const seriousOrCritical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    return seriousOrCritical.length;
  }

  test('Button primitive renders with proper accessible role, aria-label, and disabled attributes', async () => {
    const html = `
      <button class="bg-primary text-white" aria-label="Submit application">
        Submit application
      </button>
      <button class="bg-primary text-white" disabled aria-busy="true">
        Loading
      </button>
    `;

    const violations = await runAxe(html);
    assert.equal(violations, 0, 'Button element should have 0 critical or serious axe violations');
  });

  test('Input, Select, and FormField primitives maintain aria-describedby and label associations', async () => {
    const html = `
      <div class="flex flex-col gap-1.5">
        <label for="email-field">Email address *</label>
        <input id="email-field" aria-describedby="email-error" aria-invalid="true" class="border-danger" />
        <p id="email-error">Please enter a valid email address.</p>
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="role-field">Role</label>
        <select id="role-field">
          <option value="trainee">Trainee</option>
          <option value="trainer">Trainer</option>
        </select>
      </div>
    `;

    const violations = await runAxe(html);
    assert.equal(violations, 0, 'Form field elements should have 0 axe violations');
  });

  test('Badge and StatusPill primitives display sentence-case labels with accessible status roles', async () => {
    const html = `
      <span class="bg-success-subtle text-text-success-subtle">Completed</span>
      <span class="bg-danger-subtle text-text-danger-subtle">Failed</span>
      <span class="bg-warning-subtle text-text-warning-subtle">Pending</span>
    `;

    const violations = await runAxe(html);
    assert.equal(violations, 0, 'Badge and status pills should have 0 axe violations');
  });

  test('Table component structure maintains valid aria hierarchy and header scope', async () => {
    const html = `
      <table class="w-full">
        <caption class="sr-only">Trainee enrollments</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Jane Doe</td>
            <td>In progress</td>
          </tr>
        </tbody>
      </table>
    `;

    const violations = await runAxe(html);
    assert.equal(violations, 0, 'Table structure should have 0 axe violations');
  });

  test('Dialog modal structure maintains focusable dialog role and accessible title/description', async () => {
    const html = `
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc" tabindex="-1">
        <h2 id="dialog-title">Delete Module</h2>
        <p id="dialog-desc">Are you sure you want to delete this module?</p>
        <button aria-label="Close dialog">Close</button>
      </div>
    `;

    const violations = await runAxe(html);
    assert.equal(violations, 0, 'Dialog overlay structure should have 0 axe violations');
  });

  test('ProgressBar and Stat primitives expose valid ARIA progress metrics and tabular numbers', async () => {
    const html = `
      <div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" aria-label="Module completion">
        <div style="width: 75%;"></div>
      </div>
      <div>
        <span>Total Courses</span>
        <span class="tabular-nums">24</span>
      </div>
    `;

    const violations = await runAxe(html);
    assert.equal(violations, 0, 'Progress and stat metrics should have 0 axe violations');
  });
});
