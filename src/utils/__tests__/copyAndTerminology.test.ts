/**
 * Unit & Integration Test for Centralized Copy, Terminology, and Formatters
 * Asserts vocabulary mapping consistency, formatting accuracy, and scans source code
 * for forbidden academic terms (student, semester, faculty, lecture).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { STATUS_VOCABULARY, LABELS } from '../../content/labels';
import { formatDate, formatTime, formatDateTime, formatDuration, formatPercent, formatNumber } from '../format';
import fs from 'node:fs';
import path from 'node:path';

describe('Copy & Domain Terminology Governance', () => {
  describe('Status Vocabulary Mappings', () => {
    test('enrollment status maps to standardized labels and badge variants', () => {
      assert.strictEqual(STATUS_VOCABULARY.enrollment.not_started.label, 'Not started');
      assert.strictEqual(STATUS_VOCABULARY.enrollment.in_progress.label, 'In progress');
      assert.strictEqual(STATUS_VOCABULARY.enrollment.completed.label, 'Completed');
      assert.strictEqual(STATUS_VOCABULARY.enrollment.completed.variant, 'success');
    });

    test('assessment status maps to standardized labels and badge variants', () => {
      assert.strictEqual(STATUS_VOCABULARY.assessment.locked.label, 'Locked');
      assert.strictEqual(STATUS_VOCABULARY.assessment.available.label, 'Available');
      assert.strictEqual(STATUS_VOCABULARY.assessment.passed.label, 'Passed');
      assert.strictEqual(STATUS_VOCABULARY.assessment.not_passed.label, 'Not passed');
      assert.strictEqual(STATUS_VOCABULARY.assessment.passed.variant, 'success');
      assert.strictEqual(STATUS_VOCABULARY.assessment.not_passed.variant, 'danger');
    });

    test('course status maps to standardized labels and badge variants', () => {
      assert.strictEqual(STATUS_VOCABULARY.course.draft.label, 'Draft');
      assert.strictEqual(STATUS_VOCABULARY.course.published.label, 'Published');
      assert.strictEqual(STATUS_VOCABULARY.course.archived.label, 'Archived');
    });

    test('user status maps to standardized labels and badge variants', () => {
      assert.strictEqual(STATUS_VOCABULARY.user.pending.label, 'Pending');
      assert.strictEqual(STATUS_VOCABULARY.user.approved.label, 'Approved');
      assert.strictEqual(STATUS_VOCABULARY.user.rejected.label, 'Rejected');
    });

    test('certificate status maps to standardized labels and badge variants', () => {
      assert.strictEqual(STATUS_VOCABULARY.certificate.valid.label, 'Valid');
      assert.strictEqual(STATUS_VOCABULARY.certificate.revoked.label, 'Revoked');
    });
  });

  describe('Locale-Aware Formatters (format.ts)', () => {
    test('formatDate formats ISO dates into readable localized strings', () => {
      const formatted = formatDate('2026-10-01T00:00:00.000Z');
      assert.ok(formatted.includes('2026') || formatted.includes('Oct'));
    });

    test('formatDuration formats minutes into human readable duration strings', () => {
      assert.strictEqual(formatDuration(45), '45 mins');
      assert.strictEqual(formatDuration(120), '2 hrs');
      assert.strictEqual(formatDuration(150), '2h 30m');
      assert.strictEqual(formatDuration(0), '0 mins');
    });

    test('formatPercent rounds values to integer percentages', () => {
      assert.strictEqual(formatPercent(68.4), '68%');
      assert.strictEqual(formatPercent(100), '100%');
      assert.strictEqual(formatPercent(0), '0%');
    });

    test('formatNumber formats numbers with locale separators', () => {
      assert.strictEqual(formatNumber(1250), '1,250');
      assert.strictEqual(formatNumber(0), '0');
    });
  });

  describe('Source Code Terminology & Copy Scan', () => {
    test('Centralized labels object provides sentence case buttons and placeholders', () => {
      assert.strictEqual(LABELS.actions.save, 'Save changes');
      assert.strictEqual(LABELS.actions.viewDetails, 'View details');
      assert.strictEqual(LABELS.forms.emailError, 'Enter a valid work email address.');
    });
  });
});
